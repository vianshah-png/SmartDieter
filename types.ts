
export interface WeightEntry {
  date: string;
  session: number;
  day: number;
  weight: number;
  diff: number;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  age: number;
  foodPreference: string;
  allergies: string[];
  aversions: string[];
  medicalIssues: string[];
  lastKeyInsight: string;
  status: 'ACTIVE' | 'INACTIVE';
  isVeg: boolean;
  platform: 'Android' | 'iOS';
  weightHistory: WeightEntry[];
  stats: {
    assessStWt: number;
    prgStWt: number;
    goalWt: number;
    currentWt: number;
  };
}

export interface DishOption {
  id: string;
  label?: string; // e.g., "Day 1-5"
  name: string;
  description: string;
  ingredients: string[];
  isCombo?: boolean;
  comboItems?: string[];
  links?: { type: 'recipe' | 'order'; url: string; label: string }[];
}

export interface DietSection {
  title: string;
  options: DishOption[][]; // Outer array for sections (OR groups), inner array for AND combos
  note?: string;
}

export interface AnalysisResult {
  optionId: string;
  isSafe: boolean;
  conflicts: string[];
  conflictType: 'DIRECT_MATCH' | 'DERIVATIVE' | 'IMPLIED_INGREDIENT' | 'DIET_MISMATCH'; // Added DIET_MISMATCH
  reasoning: string;
  suggestedAction?: 'MODIFY' | 'REPLACE';
  modification?: string; // e.g., "Make without chilli flakes"
  // New field to track manual verification
  overrideStatus?: 'CONFIRMED_UNSAFE' | 'MARKED_SAFE';
}

export interface DietTemplate {
  id: string;
  name: string;
  status: 'DRAFT' | 'PROCESSING' | 'READY';
  sections: DietSection[];
  dietNote?: string;
  msg?: string;
  // Support for multiple input types
  inputType?: 'PDF' | 'TEXT';
  rawPdfData?: string[]; // Base64 strings for PDFs
  rawTextData?: string[]; // Raw strings for HTML/JSON/Text
  savedAnalysis?: AnalysisResult[]; // Caches the AI audit
}

export interface RecommendationResponse {
  alternatives: {
    name: string;
    reasoning: string;
    url?: string;
  }[];
}
