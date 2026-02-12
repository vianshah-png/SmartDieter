
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    });
}
const API_TOKEN = env['API_TOKEN'] || process.env.API_TOKEN;
const BASE_URL = env['API_BASE_URL'] || 'https://bn-new-api.balancenutritiononline.com/api/v1';

async function debugAPI() {
    const url = `${BASE_API_URL}/special-diet-plan/all?search=&page=1&limit=50`;
    console.log(`[Script] URL: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': 'mentor_db',
                'Content-Type': 'application/json'
            }
        });

        console.log(`[Script] Status: ${res.status}`);
        const text = await res.text();

        try {
            const json = JSON.parse(text);
            console.log('[Script] Is Array?', Array.isArray(json));
            const keys = Object.keys(json);
            console.log('[Script] Top Level Keys:', keys.join(', '));

            if (Array.isArray(json)) {
                console.log(`[Script] Array length: ${json.length}`);
                if (json.length === 1) {
                    console.log('[Script] Item 1 keys:', Object.keys(json[0]).join(', '));
                }
            } else {
                if (json.data) {
                    console.log('[Script] json.data is Array?', Array.isArray(json.data));
                    if (Array.isArray(json.data)) console.log(`[Script] json.data length: ${json.data.length}`);
                }
            }
        } catch (e) {
            console.log('[Script] Response is NOT JSON:', text.slice(0, 500));
        }
    } catch (e) {
        console.error(e);
    }
}

// Fix my copy-paste error of BASE_API_URL variable name
const BASE_API_URL = BASE_URL;

debugAPI();
