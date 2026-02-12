'use server';

import { DietTemplate, DietSection } from '../../types';

const TEMPLATE_URL = 'https://bn-new-api.balancenutritiononline.com/api/v1/special-diet-plan/all';

// The API returns meal content as separate HTML fields — map them into sections
const MEAL_FIELDS = [
    { key: 'on_rising', title: 'On Rising' },
    { key: 'breakfast', title: 'Breakfast' },
    { key: 'mid_morning', title: 'Mid Morning' },
    { key: 'pre_workout', title: 'Pre Workout' },
    { key: 'post_workout', title: 'Post Workout' },
    { key: 'pre_lunch', title: 'Pre Lunch' },
    { key: 'lunch', title: 'Lunch' },
    { key: 'post_lunch', title: 'Post Lunch' },
    { key: 'tea_eve', title: 'Tea / Evening Snack' },
    { key: 'late_eve', title: 'Late Evening' },
    { key: 'pre_dinner', title: 'Pre Dinner' },
    { key: 'dinner', title: 'Dinner' },
    { key: 'post_dinner', title: 'Post Dinner' },
    { key: 'bed_time', title: 'Bed Time' },
];

function buildSections(rawTemplate: any): DietSection[] {
    const sections: DietSection[] = [];

    for (const { key, title } of MEAL_FIELDS) {
        const html = rawTemplate[key];
        if (!html || (typeof html === 'string' && html.trim() === '')) continue;

        sections.push({
            title,
            options: [[{
                id: `${rawTemplate.diet_id}-${key}`,
                name: title,
                description: html, // raw HTML — rendered via dangerouslySetInnerHTML in AuditPanel
                ingredients: [],
            }]],
        });
    }

    return sections;
}

export async function getDietTemplatesAction(page: number = 1, limit: number = 50, searchQuery: string = ''): Promise<{ templates: DietTemplate[]; totalPages: number }> {
    // If searching, try to fetch a larger set to filter manually (workaround for potential API search issues)
    const effectiveLimit = searchQuery ? 1000 : limit;
    const url = `${TEMPLATE_URL}?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=${effectiveLimit}`;
    console.log(`[Template Action] GET ${url}`);

    try {
        const response = await fetch(url, { cache: 'no-store' });

        if (!response.ok) {
            console.error(`[Template Action] ${response.status} ${response.statusText}`);
            return { templates: [], totalPages: 0 };
        }

        const json = await response.json();

        // API returns: [{ status, data: { data: [...], totalPage } }]
        const wrapper = Array.isArray(json) ? json[0] : json;
        const inner = wrapper?.data || {};
        const items = Array.isArray(inner.data) ? inner.data : [];
        const totalPages = inner.totalPage || 0;

        console.log(`[Template Action] Page ${page}: ${items.length} templates (before filter), ${totalPages} total pages`);

        let templates: DietTemplate[] = items.map((t: any) => ({
            id: String(t.diet_id || t.id || Math.random()),
            name: t.diet_name || t.subject || t.name || 'Untitled',
            status: t.diet_status === 1 ? 'READY' : 'DRAFT',
            sections: buildSections(t),
            dietNote: t.diet_note || '',
            msg: t.msg || '',
        }));

        // Manual filter if search query exists (in case API ignores it)
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase().trim();
            templates = templates.filter(t => t.name.toLowerCase().includes(lowerQuery));
            console.log(`[Template Action] Filtered to ${templates.length} templates matching "${searchQuery}"`);
        }

        return { templates, totalPages: searchQuery ? 1 : totalPages }; // Reset pages if filtering manually implies single page result

    } catch (error) {
        console.error("[Template Action] Failed:", error);
        return { templates: [], totalPages: 0 };
    }
}
