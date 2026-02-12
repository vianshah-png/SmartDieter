
const fs = require('fs');
const path = require('path');

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            if (key && !key.startsWith('#')) env[key] = value;
        }
    });
}
const API_TOKEN = env['API_TOKEN'] || process.env.API_TOKEN;
const BASE_URL = env['API_BASE_URL'] || 'https://bn-new-api.balancenutritiononline.com/api/v1';

async function testProperAPI() {
    // Construct URL with parameters as per user input
    // User said: https://bn-new api.balancenutritiononline.com...
    // I assume https://bn-new-api.balancenutritiononline.com
    const url = `${BASE_URL}/special-diet-plan/all?search=&page=1&limit=50`;

    console.log(`Testing Corrected API URL: ${url}`);

    try {
        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': 'mentor_db',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []);

            console.log(`SUCCESS: Found ${list.length} templates.`);
            if (list.length > 0) {
                console.log('Sample Template:', list[0].name || list[0].diet_name);
            }
        } else {
            console.log(`FAILED: ${await res.text()}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testProperAPI();
