/**
 * AI Provider Abstraction Layer
 * 
 * Switch providers by setting AI_PROVIDER in .env.local:
 *   AI_PROVIDER=google   (default)
 *   AI_PROVIDER=openai
 * 
 * Each provider reads its own API key from env:
 *   Google:  GEMINI_API_KEY
 *   OpenAI:  OPENAI_API_KEY
 */

import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

export type AIProviderName = 'google' | 'openai';

export function getAIModel() {
    const provider = (process.env.AI_PROVIDER || 'google') as AIProviderName;
    const modelName = process.env.AI_MODEL || 'gpt-4o-mini';

    switch (provider) {
        case 'google': {
            const apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) throw new Error('GEMINI_API_KEY not set in .env.local');
            const google = createGoogleGenerativeAI({ apiKey });
            return google(modelName);
        }

        case 'openai': {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) throw new Error('OPENAI_API_KEY not set in .env.local');
            const openai = createOpenAI({ apiKey });
            return openai(modelName);
        }

        default:
            throw new Error(`Unknown AI_PROVIDER: ${provider}. Use "google" or "openai".`);
    }
}
