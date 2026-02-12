
const fs = require('fs');
const path = require('path');

// Manual .env.local parsing
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

const getEnv = (key, defaultVal = '') => env[key] || process.env[key] || defaultVal;
const API_BASE_URL = getEnv('API_BASE_URL', 'https://bn-new-api.balancenutritiononline.com/api/v1');
const API_TOKEN = getEnv('API_TOKEN');
const CLIENT_ID = '132127';

async function testAPI() {
    console.log('--- API Connectivity Test ---');
    console.log(`Token ends with: ...${API_TOKEN ? API_TOKEN.slice(-5) : 'NONE'}`);

    // Test Client API
    console.log('\n1. Testing Client API...');
    const clientUrl = getEnv('C_URL', `${API_BASE_URL}/client-details/get-single-client-by-user_id`);
    const separator = clientUrl.includes('?') ? '&' : '?';
    const fullClientUrl = `${clientUrl}${separator}user_id=${CLIENT_ID}`;

    try {
        const res = await fetch(fullClientUrl, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': getEnv('CLIENT_HEADER_SOURCE', 'cs_db'),
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            // Handle array vs object response
            const clientData = Array.isArray(data) ? data[0] : (data.data && Array.isArray(data.data) ? data.data[0] : data);
            const keys = clientData ? Object.keys(clientData) : [];
            console.log(`   SUCCESS: Retrieved data with ${keys.length} fields.`);
            console.log(`   Sample Fields: ${keys.slice(0, 5).join(', ')}...`);
            console.log(`   Name found: ${clientData.first_name || clientData.name || 'N/A'}`);
        } else {
            console.log(`   FAILED: ${await res.text()}`);
        }
    } catch (e) {
        console.log(`   ERROR: ${e.message}`);
    }

    // Test Template API
    console.log('\n2. Testing Template API...');
    const templateUrl = getEnv('TEMPLATE_API_URL', `${API_BASE_URL}/special-diet-plan/all`);

    try {
        const res = await fetch(templateUrl, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': getEnv('TEMPLATE_HEADER_SOURCE', 'mentor_db'),
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
            console.log(`   SUCCESS: Retrieved ${count} templates.`);
        } else {
            console.log(`   FAILED: ${await res.text()}`);
        }
    } catch (e) {
        console.log(`   ERROR: ${e.message}`);
    }
}

testAPI();
