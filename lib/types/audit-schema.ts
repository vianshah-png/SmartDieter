import { z } from 'zod';

// ============================================================================
// CLIENT PROFILE DOMAIN MODEL
// ============================================================================

/**
 * ClientProfile matches the structure from:
 * GET /client-details/get-single-client-by-user_id
 */
export interface ClientProfile {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    mobile_number: string;
    age: number;
    gender: string;

    // Dietary Constraints (Critical for AI Audit)
    allergies: string[];
    medical_conditions: string[];
    food_aversions: string[];
    diet_preference: 'Veg' | 'NonVeg' | 'Eggetarian' | 'Vegan';

    // Weight Tracking
    current_weight: number;
    target_weight: number;
    program_start_weight: number;
    assessment_start_weight: number;
}

/**
 * Zod Schema for Runtime Validation of API Response
 * Note: Email validation is lenient to handle API responses with missing/invalid emails
 */
/**
 * Zod Schema for Runtime Validation of API Response
 * Note: validation is extremely lenient to handle diverse API responses
 */
export const ClientProfileSchema = z.object({
    user_id: z.string().optional().or(z.number().transform(String)).or(z.null()).transform(val => val || ''),
    first_name: z.string().optional().or(z.null()).transform(val => val || ''),
    last_name: z.string().optional().or(z.null()).transform(val => val || ''),
    email: z.string().optional().or(z.null()).transform(val => val || ''),
    mobile_number: z.string().optional().or(z.number().transform(String)).or(z.null()).transform(val => val || ''),
    age: z.number().optional().or(z.string().transform(Number)).or(z.null()).transform(val => val || 0),
    gender: z.string().optional().or(z.null()).transform(val => val || 'Unknown'),
    allergies: z.array(z.string()).optional().or(z.null()).transform(val => val || []),
    medical_conditions: z.array(z.string()).optional().or(z.null()).transform(val => val || []),
    food_aversions: z.array(z.string()).optional().or(z.null()).transform(val => val || []),
    diet_preference: z.enum(['Veg', 'NonVeg', 'Eggetarian', 'Vegan']).optional().or(z.string()).transform(val => {
        if (!val) return 'Veg';
        const str = String(val).toLowerCase();
        if (str.includes('non')) return 'NonVeg';
        if (str.includes('egg')) return 'Eggetarian';
        if (str.includes('vegan')) return 'Vegan';
        return 'Veg';
    }),
    current_weight: z.number().optional().or(z.string().transform(Number)).or(z.null()).transform(val => val || 0),
    target_weight: z.number().optional().or(z.string().transform(Number)).or(z.null()).transform(val => val || 0),
    program_start_weight: z.number().optional().or(z.string().transform(Number)).or(z.null()).transform(val => val || 0),
    assessment_start_weight: z.number().optional().or(z.string().transform(Number)).or(z.null()).transform(val => val || 0),
});

// ============================================================================
// DIET TEMPLATE DOMAIN MODEL
// ============================================================================

/**
 * DietTemplate as returned by the API.
 * content_html is the raw HTML string with embedded links and meal structure.
 */
export interface DietTemplate {
    id: string;
    name: string;
    content_html: string; // Raw HTML to be parsed
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    created_at?: string;
    updated_at?: string;
}

export const DietTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    content_html: z.string(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
});

// ============================================================================
// ENRICHED DISH (Post Recipe API Lookup)
// ============================================================================

/**
 * EnrichedDish represents a dish after ingredient lookup from Recipe API.
 */
export interface EnrichedDish {
    name: string;
    ingredients: string[];
    original_html_snippet?: string; // For debugging/traceability
}

export const EnrichedDishSchema = z.object({
    name: z.string(),
    ingredients: z.array(z.string()),
    original_html_snippet: z.string().optional(),
});

// ============================================================================
// AI AUDIT OUTPUT SCHEMA (Vercel AI SDK Contract)
// Minimal schema: AI only returns conflicting dish + ingredient + type
// ============================================================================

/**
 * Conflict Type - determines highlight color
 *   allergy  → RED
 *   aversion → ORANGE
 */
export const ConflictTypeEnum = z.enum(['allergy', 'aversion', 'diet_type_violation', 'medical_conflict']);
export type ConflictType = z.infer<typeof ConflictTypeEnum>;

/**
 * Single Conflict: one dish flagged by AI
 */
export const ConflictSchema = z.object({
    dish_name: z.string().describe('The exact dish name as it appears in the template (text before first comma)'),
    conflicting_ingredient: z.string().describe('The specific ingredient causing the conflict'),
    conflict_type: ConflictTypeEnum.describe('Type of conflict: allergy, aversion, diet_type_violation, or medical_conflict'),
    reason: z.string().describe('Brief explanation for the conflict'),
});

export type Conflict = z.infer<typeof ConflictSchema>;

/**
 * Complete Audit Result - minimal output from AI
 */
export const AuditResultSchema = z.object({
    conflicts: z.array(ConflictSchema).describe('Array of conflicting dishes only. Empty if no conflicts.'),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;
