'use server';

const RECIPE_URL = 'https://bn-new-api.balancenutritiononline.com/api/v1/recipe/all';

export interface Recipe {
    id: string;
    name: string;
    description?: string;
    category?: string;
    subCategory?: string;
    cuisine?: string;
    recipeType?: string;
    ingredients?: string[];
    image?: string;
    url?: string;
}

export async function getAllRecipesAction(
    page: number = 1,
    limit: number = 50
): Promise<{ recipes: Recipe[]; totalCount: number }> {
    console.log(`[Recipe Action] POST ${RECIPE_URL} (page=${page}, limit=${limit})`);

    try {
        const response = await fetch(RECIPE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page, limit }),
            cache: 'no-store',
        });

        if (!response.ok) {
            console.error(`[Recipe Action] ${response.status} ${response.statusText}`);
            return { recipes: [], totalCount: 0 };
        }

        const json = await response.json();

        // API returns: [{ status, message, data: [...recipes], totalCount }]
        // OR: { status, message, data: [...recipes], totalCount }
        const wrapper = Array.isArray(json) ? json[0] : json;
        const items = Array.isArray(wrapper?.data) ? wrapper.data : [];
        const totalCount = wrapper?.totalCount || 0;

        console.log(`[Recipe Action] Page ${page}: ${items.length} recipes, ${totalCount} total`);

        const recipes: Recipe[] = items.map((r: any) => ({
            id: String(r.id || r._id || Math.random()),
            name: r.title || r.name || r.recipe_name || 'Untitled Recipe',
            description: r.description || r.short_description || '',
            category: r.category || '',
            subCategory: r.sub_category || '',
            cuisine: r.cuisine || '',
            recipeType: r.recipe_type || '',
            ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
            image: r.image || r.image_url || '',
            url: r.web_url || r.url || '',
        }));

        return { recipes, totalCount };

    } catch (error) {
        console.error("[Recipe Action] Failed:", error);
        return { recipes: [], totalCount: 0 };
    }
}
