
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

async function testOldAPI() {
    const oldUrl = "https://api.balancenutrition.in/v1/templates";
    console.log(`Testing Old API URL: ${oldUrl}`);

    try {
        const res = await fetch(oldUrl, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': 'mentor_db',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Status: ${res.status}`);
        if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
            console.log(`SUCCESS: Found ${count} templates.`);
            if (count > 0) console.log('Sample Name:', (Array.isArray(data) ? data[0] : data.data[0]).name);
        } else {
            console.log(`FAILED: ${await res.text()}`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testOldAPI();
