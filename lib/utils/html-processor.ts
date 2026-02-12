import * as cheerio from 'cheerio';
import { MealTime, Conflict, Severity } from '../types/audit-schema';

// ============================================================================
// MEAL TIME DETECTION PATTERNS
// ============================================================================

/**
 * Common variations of meal time headings found in diet templates
 */
const MEAL_TIME_PATTERNS: Record<MealTime, RegExp[]> = {
    'On Rising': [
        /on\s+rising/i,
        /early\s+morning/i,
        /wake\s+up/i,
    ],
    'Breakfast': [
        /breakfast/i,
        /morning\s+meal/i,
    ],
    'Mid Meal': [
        /mid\s+meal/i,
        /mid[-\s]?morning/i,
        /snack\s*1/i,
    ],
    'Lunch': [
        /lunch/i,
        /afternoon\s+meal/i,
    ],
    'Evening': [
        /evening/i,
        /tea\s+time/i,
        /snack\s*2/i,
    ],
    'Dinner': [
        /dinner/i,
        /supper/i,
    ],
    'Post Dinner': [
        /post\s+dinner/i,
        /bed\s+time/i,
        /before\s+sleep/i,
    ],
};

/**
 * Detect meal time from heading text
 */
function detectMealTime(text: string): MealTime | null {
    const normalized = text.trim();

    for (const [mealTime, patterns] of Object.entries(MEAL_TIME_PATTERNS)) {
        if (patterns.some(pattern => pattern.test(normalized))) {
            return mealTime as MealTime;
        }
    }

    return null;
}

// ============================================================================
// DISH EXTRACTION FROM HTML
// ============================================================================

/**
 * Extracts dishes grouped by meal time from raw HTML content.
 * 
 * Strategy:
 * 1. Parse HTML with cheerio
 * 2. Find section headings (h1-h6, strong, b tags)
 * 3. Extract dish names from list items or paragraphs following each heading
 * 4. Group by detected meal time
 * 
 * @param html - Raw HTML string from diet template
 * @returns Record mapping meal times to arrays of dish names
 */
export function extractDishes(html: string): Record<MealTime, string[]> {
    const result: Record<MealTime, string[]> = {
        'On Rising': [],
        'Breakfast': [],
        'Mid Meal': [],
        'Lunch': [],
        'Evening': [],
        'Dinner': [],
        'Post Dinner': [],
    };

    if (!html || html.trim() === '') {
        console.warn('[HTML Processor] Empty HTML provided');
        return result;
    }

    try {
        const $ = cheerio.load(html);
        let currentMealTime: MealTime | null = null;

        // Strategy 1: Look for headings (h1-h6, strong, b)
        $('h1, h2, h3, h4, h5, h6, strong, b').each((_, element) => {
            const headingText = $(element).text().trim();
            const detectedMeal = detectMealTime(headingText);

            if (detectedMeal) {
                currentMealTime = detectedMeal;

                // Extract dishes from following siblings until next heading
                let nextElement = $(element).next();

                while (nextElement.length > 0) {
                    const tagName = nextElement.prop('tagName')?.toLowerCase();

                    // Stop at next heading
                    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName || '')) {
                        break;
                    }

                    // Extract from lists
                    if (tagName === 'ul' || tagName === 'ol') {
                        nextElement.find('li').each((_, li) => {
                            const dishText = extractDishName($(li).text());
                            if (dishText && currentMealTime) {
                                result[currentMealTime].push(dishText);
                            }
                        });
                    }

                    // Extract from paragraphs
                    else if (tagName === 'p') {
                        const dishText = extractDishName(nextElement.text());
                        if (dishText && currentMealTime) {
                            result[currentMealTime].push(dishText);
                        }
                    }

                    nextElement = nextElement.next();
                }
            }
        });

        // Strategy 2: If no headings found, look for line-by-line patterns
        if (Object.values(result).every(arr => arr.length === 0)) {
            const lines = $.text().split('\n');

            for (const line of lines) {
                const detectedMeal = detectMealTime(line);
                if (detectedMeal) {
                    currentMealTime = detectedMeal;
                } else if (currentMealTime && line.trim()) {
                    const dishText = extractDishName(line);
                    if (dishText) {
                        result[currentMealTime].push(dishText);
                    }
                }
            }
        }

        const totalDishes = Object.values(result).flat().length;
        console.log(`[HTML Processor] Extracted ${totalDishes} dishes from HTML`);

    } catch (error) {
        console.error('[HTML Processor] Failed to parse HTML:', error);
    }

    return result;
}

/**
 * Extracts clean dish name from raw text
 * - Removes leading bullets, numbers, dashes
 * - Extracts text before first comma (dish name vs description separator)
 * - Trims whitespace
 */
function extractDishName(text: string): string {
    return text
        .replace(/^[\d\-•●◦\*\s]+/, '') // Remove bullets/numbers
        .split(',')[0] // Take only dish name (before comma)
        .trim();
}

// ============================================================================
// CONFLICT HIGHLIGHTING INJECTION
// ============================================================================

/**
 * Injects conflict highlights into HTML by wrapping flagged dishes in styled spans.
 * 
 * Safety guarantees:
 * - Does NOT break HTML structure
 * - Does NOT replace text inside anchor tags (<a href="...">)
 * - Only replaces exact dish names in text nodes
 * 
 * @param originalHtml - The original HTML content
 * @param conflicts - Array of conflicts from AI audit
 * @returns Modified HTML with conflict highlights
 */
export function injectHighlights(
    originalHtml: string,
    conflicts: Conflict[]
): string {
    if (!originalHtml || conflicts.length === 0) {
        return originalHtml;
    }

    try {
        const $ = cheerio.load(originalHtml);

        // Build highlight map for efficient lookup
        const highlightMap = new Map<string, { severity: Severity; reason: string; swap?: string }>();

        for (const conflict of conflicts) {
            highlightMap.set(conflict.dish_name.toLowerCase(), {
                severity: conflict.severity,
                reason: conflict.reason,
                swap: conflict.suggested_swap,
            });
        }

        // Process all text nodes EXCEPT those inside <a> tags
        const processTextNode = (node: any) => {
            if (node.type === 'text' && node.parent && node.parent.name !== 'a') {
                let text = node.data;
                let modified = false;

                // Try to match each conflict
                for (const [dishName, highlight] of Array.from(highlightMap.entries())) {
                    // Create case-insensitive regex that matches whole words
                    const regex = new RegExp(`\\b${escapeRegex(dishName)}\\b`, 'gi');

                    if (regex.test(text)) {
                        // Replace with highlighted span
                        text = text.replace(regex, (match: string) => {
                            const escapedReason = escapeHtml(highlight.reason);
                            const swapAttr = highlight.swap
                                ? ` data-swap="${escapeHtml(highlight.swap)}"`
                                : '';

                            return `<span class="conflict-highlight ${highlight.severity}" data-reason="${escapedReason}"${swapAttr}>${match}</span>`;
                        });
                        modified = true;
                    }
                }

                if (modified) {
                    // Replace the text node with new HTML
                    const tempElement = cheerio.load(`<div>${text}</div>`)('div');
                    $(node).replaceWith(tempElement.html() || '');
                }
            }
        };

        // Traverse all nodes
        const traverse = (element: any) => {
            if (!element) return;

            if (element.type === 'text') {
                processTextNode(element);
            } else if (element.children) {
                element.children.forEach(traverse);
            }
        };

        $('body').children().each((_, el) => traverse(el));

        const highlightedHtml = $.html();
        console.log(`[HTML Processor] Injected ${conflicts.length} conflict highlights`);

        return highlightedHtml;

    } catch (error) {
        console.error('[HTML Processor] Failed to inject highlights:', error);
        return originalHtml; // Return original on error
    }
}

/**
 * Escape special regex characters in string
 */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Escape HTML special characters to prevent XSS
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Stats helper for debugging
 */
export function getHtmlStats(html: string): {
    length: number;
    headings: number;
    lists: number;
    links: number;
} {
    const $ = cheerio.load(html);

    return {
        length: html.length,
        headings: $('h1, h2, h3, h4, h5, h6').length,
        lists: $('ul, ol').length,
        links: $('a').length,
    };
}
