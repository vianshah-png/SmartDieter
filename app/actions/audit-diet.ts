'use server';

import { generateObject } from 'ai';
import { getAIModel } from '../../lib/ai-provider';
import {
    AuditResultSchema,
    AuditResult,
    EnrichedDish,
    ClientProfile,
} from '../../lib/types/audit-schema';
import {
    fetchClientProfile,
    enrichDishes,
    APIError,
    ValidationError
} from '../../lib/services/api-service';

// ============================================================================
// TYPES
// ============================================================================

export interface AuditResponse {
    success: boolean;
    conflictCount?: number;
    auditResult?: AuditResult;
    updatedSections?: Array<{
        title: string;
        replacedContent: string;
    }>;
    error?: {
        message: string;
        code: string;
        details?: string;
    };
}

/**
 * Represents a single meal section passed from the dashboard template
 */
interface MealSection {
    title: string;      // e.g. "Breakfast", "Lunch"
    htmlContent: string; // raw HTML from the API field
}

// ============================================================================
// MAIN AUDIT ORCHESTRATOR
// ============================================================================

/**
 * Main Audit Pipeline - Orchestrates the complete diet safety analysis
 * 
 * Flow:
 * 1. Fetch Client Profile (allergies, preferences, medical conditions)
 * 2. Use template content passed directly from dashboard (no re-fetch!)
 * 3. Extract dish names from each meal section's text
 * 4. Enrich Dishes with Ingredients (parallel API calls)
 * 5. AI Safety Analysis (Vercel AI SDK with Zod schema)
 * 6. Return results for UI to render
 * 
 * @param userId - Client's user ID
 * @param templateId - Diet template ID (for logging)
 * @param templateName - Template name (for logging)
 * @param mealSections - Array of { title, htmlContent } from the dashboard template
 * @returns AuditResponse with conflict data
 */
export async function auditDietPlan(
    userId: string,
    templateId: string,
    templateName: string,
    mealSections: MealSection[],
    clientOverride?: Partial<ClientProfile>
): Promise<AuditResponse> {

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🔍 AUDIT PIPELINE START`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Template ID: ${templateId}`);
    console.log(`   Template Name: ${templateName}`);
    console.log(`   Meal Sections: ${mealSections.length}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    console.time('🕒 Total Audit Time');

    try {
        // ========================================================================
        // STEP 1: Fetch Client Profile
        // ========================================================================
        console.time('⏱️  Step 1: Client Profile');
        console.log('📋 Step 1: Fetching client profile...');
        let client = await fetchClientProfile(userId);

        if (clientOverride) {
            console.log('   ℹ️  Applying manual client overrides from UI');
            client = { ...client, ...clientOverride };
        }
        console.timeEnd('⏱️  Step 1: Client Profile');

        console.log(`   ✓ Client: ${client.first_name} ${client.last_name}`);
        console.log(`   ✓ Allergies: ${client.allergies.join(', ') || 'None'}`);
        console.log(`   ✓ Diet Preference: ${client.diet_preference}`);
        console.log(`   ✓ Medical Conditions: ${client.medical_conditions.join(', ') || 'None'}`);
        console.log(`   ✓ Aversions: ${client.food_aversions.join(', ') || 'None'}\n`);

        // ========================================================================
        // STEP 2: Extract Dishes from Meal Sections (dashboard provides these)
        // ========================================================================
        console.time('⏱️  Step 2: Dish Extraction');
        console.log('🍽️  Step 2: Extracting dishes from template sections...');

        if (mealSections.length === 0) {
            console.warn('   ⚠️  No meal sections provided - nothing to audit\n');
            console.timeEnd('🕒 Total Audit Time');
            return {
                success: true,
                conflictCount: 0,
                auditResult: { conflicts: [] },
            };
        }

        // Build a combined HTML for display and extract dish info from each section
        const allDishEntries: { mealTime: string; dishText: string }[] = [];
        let combinedHtml = '';

        for (const section of mealSections) {
            combinedHtml += `<h3>${section.title}</h3>\n${section.htmlContent}\n`;

            // Extract plain text from HTML and split into individual dishes
            const plainText = section.htmlContent
                .replace(/<br\s*\/?>/gi, '\n')
                .replace(/<\/?(p|div|li|ul|ol|td|tr|table)[^>]*>/gi, '\n')
                .replace(/<[^>]+>/g, '')  // Strip remaining tags
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&nbsp;/g, ' ')
                .replace(/&#?\w+;/g, ' ')
                // Aggressive cleaning of metadata/links
                .replace(/https?:\/\/[^\s]+/gi, '') // Remove URLs
                .replace(/\s*[\[\(](?:Buy|Order|View|Click|Read|Recipe|Link|Watch).+?[\]\)]/gi, '') // Remove (Buy Here), [View Recipe]
                .replace(/\s*-\s*\d+\s*(?:grams|g|ml|calories|kcal)/gi, '') // Remove quantities like "- 50 grams"
                .replace(/\s+/g, ' '); // Collapse whitespace

            // Split by newlines and common separators to get atomic dishes
            // We split by: newline, " OR " (surrounded by whitespace)
            // OR slash/plus with space on AT LEAST ONE side (to avoid breaking URLs or w/o)
            const lines = plainText
                .split(/\n|\s+OR\s+|(?:\s+(?:[\/+])\s*)|(?:\s*(?:[\/+])\s+)/i)
                .map(l => l.trim())
                .filter(l => l.length > 3); // skip tiny fragments

            for (const line of lines) {
                // CLEAN UP: Remove content inside [], (), {} before extracting dish name
                // This prevents "[Make a wrap, then eat]" from being split at the comma
                const cleanedLine = line.replace(/[\(\[\{].*?[\)\]\}]/g, '').trim();

                // Extract the dish name (text before first comma)
                const dishName = cleanedLine.split(',')[0].trim();
                if (dishName && dishName.length > 2) {
                    allDishEntries.push({
                        mealTime: section.title,
                        dishText: cleanedLine, // Use the cleaned line
                    });
                }
            }
        }
        console.timeEnd('⏱️  Step 2: Dish Extraction');

        console.log(`   ✓ Extracted ${allDishEntries.length} dish entries from ${mealSections.length} meal sections`);
        for (const entry of allDishEntries) {
            console.log(`     • [${entry.mealTime}] ${entry.dishText.substring(0, 80)}`);
        }
        console.log('');

        if (allDishEntries.length === 0) {
            console.warn('   ⚠️  No dishes extracted - skipping AI audit\n');
            console.timeEnd('🕒 Total Audit Time');
            return {
                success: true,
                conflictCount: 0,
                auditResult: { conflicts: [] },
            };
        }

        // ========================================================================
        // STEP 3: Enrich Dishes with Ingredients (Parallel)
        // ========================================================================
        console.time('⏱️  Step 3: Enrichment API');

        // Helper to clean dish name by removing content in brackets, braces, or parentheses
        const cleanDishName = (text: string) => {
            // Remove content inside [], (), {} and collapse whitespace
            return text.replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/\s+/g, ' ').trim();
        };

        // Extract and clean names for enrichment
        const dishNames = allDishEntries.map(e => {
            const shortName = e.dishText.split(',')[0].trim();
            return cleanDishName(shortName);
        });

        console.log('🔬 Step 3: Enriching dishes with ingredients...');
        const ingredientsMap = await enrichDishes(dishNames);
        console.timeEnd('⏱️  Step 3: Enrichment API');

        console.log(`   ✓ Enriched ${ingredientsMap.size} / ${dishNames.length} dishes\n`);

        // Build enriched dish list for AI
        const enrichedDishes: EnrichedDish[] = allDishEntries.map(entry => {
            const shortName = entry.dishText.split(',')[0].trim();
            const cleanedName = cleanDishName(shortName);

            return {
                name: cleanedName, // Send ONLY the cleaned name to AI
                ingredients: ingredientsMap.get(cleanedName) || [],
            };
        });

        // ========================================================================
        // STEP 4: AI Safety Analysis (Vercel AI SDK)
        // ========================================================================
        console.time('⏱️  Step 4: AI Generation');
        console.log('🤖 Step 4: Running AI safety analysis...');

        const systemPrompt = `You are a nutrition mentor. Apply common sense regarding cooking flexibility.. Your goal is to strictly audit a diet plan against client limitations using a logical deduction framework.
        Audit meal options for health compliance against Allergies and Aversions.

CLIENT PROFILE:
- Allergies (Critical): ${client.allergies.join(', ') || 'None'}
- Medical Conditions: ${client.medical_conditions.join(', ') || 'None'}
- Food Aversions: ${client.food_aversions.join(', ') || 'None'}
- Diet Preference: ${client.diet_preference || 'Standard'}

1. **FUNDAMENTAL INGREDIENTS (STRICT FLAG)**:
   - If the allergen is the **Main Base** or **Definition** of the dish, it is ALWAYS UNSAFE.
   - *Example*: Client allergic to 'Oats'. Dish 'Oats Porridge', 'Masala Oats', 'Oat Pancake'. -> **UNSAFE** (Dish cannot exist without Oats).
   - *Example*: Client allergic to 'Dairy'. Dish 'Curd', 'Paneer', 'Whey'. -> **UNSAFE**.
   - *Example*: Client allergic to 'Chickpeas'. Dish 'Hummus'. -> **UNSAFE**.

2. **OPTIONAL / PREPARATION INGREDIENTS (DO NOT FLAG)**:
   - If an allergen is commonly used but **can be omitted** during cooking (e.g., thickeners, marinades, garnishes), assume the kitchen can modify it. **DO NOT FLAG** unless the text *explicitly* lists that ingredient.
   - *Example*: Client allergic to 'Besan' (Chickpea flour). Dish 'Paneer Tikka'. -> **SAFE**. (Besan is a marinade binder, but Paneer Tikka *can* be made without it. Unless text says "Besan Coated", assume Safe).
   - *Example*: Client allergic to 'Corn'. Dish 'Soup'. -> **SAFE**. (Cornflour is a thickener, but soup can be made clear).

3. **EXPLICIT LISTING (STRICT FLAG)**:
   - If the dish description or ingredients list provided explicitly mentions the allergen, it is **UNSAFE**.
   - *Example*: "Paneer Tikka (marinated in Besan)" -> **UNSAFE** (because Besan is explicitly listed).

4. **BRANDED / EDGE CASES (VERIFY)**:
   - For specific named items (e.g., "High Protein BN Nippat")Skip Them*.
   - If the base flour is the allergen -> Flag it.
   - If the allergen is a minor optional additive -> Ignore it.

VERIFICATION STEP (Perform internally before outputting):
1. For every flagged conflict, ask: "Is this TRULY a violation based on the rules above?"
2. If I flagged a Veg item for a Non-Veg client, REMOVE THE FLAG.

OUTPUT JSON (Strictly for conflicts):
[{
  "dish_name": "Exact dish name from menu",
  "conflicting_ingredient": "The specific culprit",
  "conflict_type": "allergy" | "aversion" | "diet_type_violation" | "medical_conflict",
  "reason": "Brief explanation"
}]

Return [] ONLY if absolutely NO conflicts are found.`;

        const userPrompt = `Dishes to check:\n${enrichedDishes.map((dish, idx) => {
            return `${idx + 1}. ${dish.name}` +
                (dish.ingredients.length > 0 ? ` [Ingredients: ${dish.ingredients.join(', ')}]` : '');
        }).join('\n')}`;

        console.log('\n--- SYSTEM PROMPT ---');
        console.log(systemPrompt);
        console.log('\n--- USER PROMPT ---');
        console.log(userPrompt);
        console.log('--- END PROMPTS ---\n');

        const model = getAIModel();
        const aiResponse = await generateObject({
            model,
            schema: AuditResultSchema,
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.1, // Strict deterministic mode
        });

        const auditResult = aiResponse.object;
        console.timeEnd('⏱️  Step 4: AI Generation');

        console.log(`   ✓ AI Analysis Complete`);
        console.log(`   ✓ Conflicts Found: ${auditResult.conflicts.length}`);

        if (auditResult.conflicts.length > 0) {
            console.log(`\n   📌 Conflicts:`);
            auditResult.conflicts.forEach(c => {
                console.log(`      • ${c.dish_name} → ${c.conflicting_ingredient} [${c.conflict_type}]`);
                console.log(`        Reason: ${c.reason}`);
            });
        }
        console.log('');

        // ========================================================================
        // STEP 5: Find-and-Replace conflicting dishes with colored text
        //   allergy  → RED text
        //   aversion → ORANGE text
        // ========================================================================
        console.time('⏱️  Step 5: Replacement');
        console.log('🔄 Step 5: Coloring conflicting dishes in template...');

        const updatedSections = mealSections.map(section => {
            let content = section.htmlContent;

            // Sort conflicts by length (descending) to avoid partial replacement issues
            // e.g. "Chicken Salad" should be replaced before "Chicken"
            const sortedConflicts = [...auditResult.conflicts].sort(
                (a, b) => b.dish_name.length - a.dish_name.length
            );

            for (const conflict of sortedConflicts) {
                const dishName = conflict.dish_name;

                if (!dishName || dishName.length < 2) continue; // Skip bad data

                // Helper to create a robust regex pattern from a plain string
                const createRobustPattern = (text: string) => {
                    // 1. Escape regex special characters
                    let pattern = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

                    // 2. Handle HTML entities for common characters
                    pattern = pattern.replace(/&/g, '(?:&|&amp;|&#38;|&#x26;)');
                    pattern = pattern.replace(/</g, '(?:<|&lt;|&#60;|&#x3c;)');
                    pattern = pattern.replace(/>/g, '(?:>|&gt;|&#62;|&#x3e;)');
                    pattern = pattern.replace(/"/g, '(?:"|&quot;|&#34;|&#x22;)');
                    pattern = pattern.replace(/'/g, "(?:'|&apos;|&#39;|&#x27;)");

                    // 3. Handle whitespace AND potential HTML tags between words
                    // This allows "Chicken Salad" to match "Chicken <b>Salad</b>" or "Chicken<br>Salad"
                    // We loosely allow inline tags like b, strong, i, em, span, font, small, big, mark, sub, sup, and breaks
                    // Avoid block tags like div/p to prevent cross-block matching
                    pattern = pattern.replace(/ /g, '(?:\\s+|&nbsp;|&#160;|&#x20;|<br\\s*\\/?>|<\/?(?:b|strong|i|em|span|font|u|small|big|mark)[^>]*>)+');

                    return pattern;
                };

                const flexibleRegexPattern = createRobustPattern(dishName);
                const regex = new RegExp(`(${flexibleRegexPattern})(?![^<]*>)`, 'gi');

                if (regex.test(content)) {
                    // Logic for color coding
                    let color = '#EA580C';
                    let bgColor = '#FFF7ED';
                    let label = 'CONFLICT';

                    if (conflict.conflict_type === 'allergy') { color = '#DC2626'; bgColor = '#FEE2E2'; label = 'ALLERGY'; }
                    else if (conflict.conflict_type === 'diet_type_violation') { color = '#B45309'; bgColor = '#FEFCE8'; label = 'DIET VIOLATION'; }
                    else if (conflict.conflict_type === 'aversion') { color = '#EA580C'; bgColor = '#FFF7ED'; label = 'AVERSION'; }
                    else if (conflict.conflict_type === 'medical_conflict') { color = '#C2410C'; bgColor = '#FFF7ED'; label = 'MEDICAL'; }

                    const replacement = `<span style="color: ${color}; background-color: ${bgColor}; font-weight: bold; padding: 1px 4px; border-radius: 2px;" title="${label}: contains ${conflict.conflicting_ingredient}">$1</span>`;

                    // Reset lastIndex just in case, though replace ignores it usually
                    regex.lastIndex = 0;
                    content = content.replace(regex, replacement);
                    console.log(`      ✓ [${section.title}] "${dishName}" → colored ${conflict.conflict_type.toUpperCase()} (${conflict.conflicting_ingredient})`);
                } else {
                    // FALLBACK: Try matching just the short name (before comma)
                    const shortName = dishName.split(',')[0].trim();
                    if (shortName && shortName.length > 2 && shortName !== dishName) {
                        const flexShortPattern = createRobustPattern(shortName);
                        // Add negative lookahead here too
                        const shortRegex = new RegExp(`(${flexShortPattern})(?![^<]*>)`, 'gi');

                        if (shortRegex.test(content)) {
                            let color = '#EA580C'; let bgColor = '#FFF7ED'; let label = 'CONFLICT';
                            if (conflict.conflict_type === 'allergy') { color = '#DC2626'; bgColor = '#FEE2E2'; label = 'ALLERGY'; }
                            else if (conflict.conflict_type === 'diet_type_violation') { color = '#B45309'; bgColor = '#FEFCE8'; label = 'DIET VIOLATION'; }
                            else if (conflict.conflict_type === 'aversion') { color = '#EA580C'; bgColor = '#FFF7ED'; label = 'AVERSION'; }
                            else if (conflict.conflict_type === 'medical_conflict') { color = '#C2410C'; bgColor = '#FFF7ED'; label = 'MEDICAL'; }

                            const replacement = `<span style="color: ${color}; background-color: ${bgColor}; font-weight: bold; padding: 1px 4px; border-radius: 2px;" title="${label}: contains ${conflict.conflicting_ingredient}">$1</span>`;

                            shortRegex.lastIndex = 0;
                            content = content.replace(shortRegex, replacement);
                            console.log(`      ✓ [${section.title}] "${shortName}" (fallback) → colored ${conflict.conflict_type.toUpperCase()}`);
                        }
                    }
                }
            }

            return { title: section.title, replacedContent: content };
        });
        console.timeEnd('⏱️  Step 5: Replacement');

        console.log(`   ✓ Template sections colored\n`);

        // ========================================================================
        // FINAL RESPONSE
        // ========================================================================
        console.timeEnd('🕒 Total Audit Time');
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`✅ AUDIT COMPLETE — ${auditResult.conflicts.length} conflict(s)`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

        return {
            success: true,
            conflictCount: auditResult.conflicts.length,
            auditResult,
            updatedSections,
        };

    } catch (error) {
        // ========================================================================
        // ERROR HANDLING
        // ========================================================================
        console.error('\n❌ AUDIT PIPELINE FAILED\n', error);

        if (error instanceof APIError) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'API_ERROR',
                    details: `${error.endpoint} returned ${error.statusCode}`,
                }
            };
        }

        if (error instanceof ValidationError) {
            return {
                success: false,
                error: {
                    message: error.message,
                    code: 'VALIDATION_ERROR',
                    details: `Field: ${error.field}`,
                }
            };
        }

        return {
            success: false,
            error: {
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                code: 'INTERNAL_ERROR',
                details: error instanceof Error ? error.stack : undefined,
            }
        };
    }
}
