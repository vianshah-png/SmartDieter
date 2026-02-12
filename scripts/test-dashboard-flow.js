
const fs = require('fs');
const path = require('path');

// 1. Setup Env
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

// 2. Mock Logic from lib/services/api-service.ts
function mapClientProfile(response, userId) {
    console.log('\n[Logic Check] 1. Extracting Raw Data...');

    // Extract data payload - handle various API structures
    let rawClient = response.data || response;

    // Handle array response
    if (Array.isArray(response)) {
        rawClient = response[0];
    } else if (Array.isArray(response.data)) {
        rawClient = response.data[0];
    }

    // Capture potential sibling data before drilling down
    const extraWeightData = rawClient?.weight;
    if (extraWeightData) console.log('[Logic Check]    Found Weight Object Keys:', Object.keys(extraWeightData).join(', '));
    const extraProgramData = rawClient?.program_details;

    // Check deeper nesting
    if (rawClient?.client) rawClient = rawClient.client;
    // If client_details exists, use it as the main object but keep reference to siblings
    if (rawClient?.client_details) {
        rawClient = { ...rawClient.client_details, ...(extraWeightData || {}), ...(extraProgramData || {}) };
    }
    if (rawClient?.result) rawClient = rawClient.result;

    if (!rawClient) {
        throw new Error('Mapping Logic Failed: formatted object is empty');
    }

    console.log(`[Logic Check]    Found raw object with keys: ${Object.keys(rawClient).join(', ')}`);

    // Loose mapping logic
    const firstName = rawClient.first_name || rawClient.firstName || (rawClient.name ? rawClient.name.split(' ')[0] : '') || '';
    const lastName = rawClient.last_name || rawClient.lastName || (rawClient.name ? rawClient.name.split(' ').slice(1).join(' ') : '') || '';

    // Simulate Zod transformation/coercion
    const profile = {
        user_id: String(rawClient.user_id || rawClient.userId || rawClient.id || userId),
        first_name: firstName,
        last_name: lastName,
        email: rawClient.email || rawClient.emailAddress || '',
        mobile_number: String(rawClient.mobile_number || rawClient.mobileNumber || rawClient.phone || ''),
        age: Number(rawClient.age || 0),
        gender: rawClient.gender || 'Unknown',

        allergies: rawClient.allergies || rawClient.allergy_list
            ? String(rawClient.allergies || rawClient.allergy_list).split(',').map(s => s.trim()).filter(Boolean)
            : [],
        medical_conditions: rawClient.medical_issues || rawClient.medical_conditions || rawClient.medicalIssues
            ? String(rawClient.medical_issues || rawClient.medical_conditions || rawClient.medicalIssues).split(',').map(s => s.trim()).filter(Boolean)
            : [],
        food_aversions: rawClient.aversions || rawClient.food_aversions || rawClient.foodAversions
            ? String(rawClient.aversions || rawClient.food_aversions || rawClient.foodAversions).split(',').map(s => s.trim()).filter(Boolean)
            : [],
        diet_preference: rawClient.food_preference || rawClient.diet_preference || rawClient.foodPreference || 'Veg',

        current_weight: Number(rawClient.current_weight || rawClient.currentWeight || 0),
        target_weight: Number(rawClient.target_weight || rawClient.targetWeight || 0),
        program_start_weight: Number(rawClient.program_start_weight || rawClient.programStartWeight || 0),
        assessment_start_weight: Number(rawClient.assessment_start_weight || rawClient.assessmentStartWeight || 0),
    };

    console.log('[Logic Check] 2. Computed Profile:', JSON.stringify(profile, null, 2));
    return profile;
}

// 3. Mock logic from app/actions/client.ts
function mapToDashboardClient(profile) {
    console.log('\n[Logic Check] 3. Mapping to Dashboard Model...');
    return {
        id: profile.user_id,
        name: `${profile.first_name} ${profile.last_name}`.trim(),
        email: profile.email,
        phone: profile.mobile_number,
        address: '',
        gender: profile.gender,
        age: profile.age,
        foodPreference: profile.diet_preference,
        allergies: profile.allergies,
        aversions: profile.food_aversions,
        medicalIssues: profile.medical_conditions,
        lastKeyInsight: '',
        status: 'ACTIVE',
        isVeg: String(profile.diet_preference).toLowerCase().includes('veg') && !String(profile.diet_preference).toLowerCase().includes('non'),
        platform: 'Android',
        weightHistory: [],
        stats: {
            assessStWt: profile.assessment_start_weight,
            prgStWt: profile.program_start_weight,
            goalWt: profile.target_weight,
            currentWt: profile.current_weight,
        }
    };
}

// 4. Run Test
async function runIntegrationTest() {
    console.log('--- Dashboard Data Flow Simulation ---');
    console.log(`Fetching data for Client ID: ${CLIENT_ID}`);

    const clientUrl = getEnv('C_URL', `${API_BASE_URL}/client-details/get-single-client-by-user_id`);
    const separator = clientUrl.includes('?') ? '&' : '?';
    const fullUrl = `${clientUrl}${separator}user_id=${CLIENT_ID}`;

    try {
        const res = await fetch(fullUrl, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Source': getEnv('CLIENT_HEADER_SOURCE', 'cs_db'),
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);

        const rawJson = await res.json();
        console.log('[API] Raw JSON Payload received.');

        const profile = mapClientProfile(rawJson, CLIENT_ID);
        const dashboardData = mapToDashboardClient(profile);

        console.log('\n=== FINAL DASHBOARD DATA ===');
        console.log(JSON.stringify(dashboardData, null, 2));

        console.log('\n[VERIFICATION]');
        if (dashboardData.name) console.log(`✅ Name: ${dashboardData.name}`);
        else console.log('❌ Name is missing');

        if (dashboardData.stats.currentWt > 0) console.log(`✅ Weight: ${dashboardData.stats.currentWt}`);
        else console.log('⚠️ Weight is 0 (might be normal)');

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

runIntegrationTest();
