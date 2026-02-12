// server-only configuration
import 'server-only';

// Toggle for verbose API logging in server console
export const DEBUG_MODE = process.env.DEBUG_MODE === 'true';

export const API_CONFIG = {
    CLIENT: {
        URL: process.env.C_URL || "https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id",
        SOURCE: process.env.CLIENT_HEADER_SOURCE || "cs_db",
        TOKEN: process.env.CLIENT_API_TOKEN || process.env.API_TOKEN || "",
    },
    TEMPLATE: {
        URL: process.env.TEMPLATE_API_URL || "https://api.balancenutrition.in/v1/templates",
        SOURCE: process.env.TEMPLATE_HEADER_SOURCE || "mentor_db",
        TOKEN: process.env.TEMPLATE_API_TOKEN || process.env.API_TOKEN || "",
    },
    RECIPE: {
        URL: process.env.RECIPE_API_URL || "https://api.balancenutrition.in/v1/recipes",
        SOURCE: process.env.RECIPE_HEADER_SOURCE || "mentor_db",
        TOKEN: process.env.RECIPE_API_TOKEN || process.env.API_TOKEN || "",
    }
};
