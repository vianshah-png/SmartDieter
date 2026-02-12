import 'server-only';
import { DEBUG_MODE } from './apiConfig';

interface ApiClientOptions extends RequestInit {
    token?: string;
    source?: string;
    params?: Record<string, string>;
}

const BASE_URL = process.env.API_BASE_URL || '';
const DEFAULT_TOKEN = process.env.API_TOKEN || '';

export const apiClient = async <T>(endpoint: string, options: ApiClientOptions = {}): Promise<T | null> => {
    const { token = DEFAULT_TOKEN, source, params, ...customConfig } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(source ? { 'Source': source } : {}),
    };

    // Resolve URL: absolute endpoints pass through, relative ones get BASE_URL prepended
    let urlStr = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

    if (params) {
        const url = new URL(urlStr);
        Object.entries(params).forEach(([key, value]) => {
            if (value) url.searchParams.append(key, value);
        });
        urlStr = url.toString();
    }

    const config: RequestInit = {
        ...customConfig,
        headers: headers as HeadersInit,
    };

    if (DEBUG_MODE) {
        console.log(`[API Client DEBUG] ${config.method || 'GET'} ${urlStr}`);
        console.log(`[API Client DEBUG] Headers: ${JSON.stringify(headers, null, 2)}`);
    }

    try {
        const response = await fetch(urlStr, config);

        if (DEBUG_MODE) {
            console.log(`[API Client DEBUG] Response: ${response.status} ${response.statusText}`);
        }

        if (!response.ok) {
            console.error(`[API Client] ✗ ${response.status} ${response.statusText} → ${urlStr}`);
            try {
                const body = await response.text();
                if (DEBUG_MODE) console.error(`[API Client DEBUG] Body: ${body}`);
            } catch { }
            return null;
        }

        const data = await response.json();

        if (DEBUG_MODE) {
            console.log(`[API Client DEBUG] Payload: ${JSON.stringify(data).substring(0, 500)}...`);
        }

        return data as T;

    } catch (error) {
        console.error(`[API Client] ✗ Network Error → ${urlStr}:`, error);
        return null;
    }
};
