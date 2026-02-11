# Debug: Client Data Not Reflecting on Dashboard

## Issue Summary
Client data is successfully fetched from the API on the server side, but the mapped result shows empty values for critical fields.

## Observed Behavior

### Server Logs Show:
```
[Client Action] Mapped client data: {
  id: '132127',
  name: '',              // ❌ EMPTY
  allergies: [],         // ❌ EMPTY  
  aversions: [],         // ❌ EMPTY
  medicalIssues: [],     // ❌ EMPTY
  foodPreference: 'Veg'  // ✅ Works
}
```

### Root Causes Identified:

1. **Webpack Cache Issue**: The compiled webpack bundle was using old code even after file changes
2. **Missing Debug Logs**: Added debug logs weren't appearing, confirming cache issue
3. **API Response Structure Unknown**: We don't know the exact structure of the API response

## Solution Applied

### Step 1: Added Debug Logging
Added comprehensive logging in `lib/services/api-service.ts`:

```typescript
console.log('[API Service] Raw API Response:', JSON.stringify(response, null, 2));
console.log('[API Service] Raw Client Data:', JSON.stringify(rawClient, null, 2));
console.log('[API Service] Raw Field Values:', {
    first_name: rawClient.first_name,
    last_name: rawClient.last_name,
    allergies: rawClient.allergies,
    medical_issues: rawClient.medical_issues,
    aversions: rawClient.aversions,
    food_preference: rawClient.food_preference
});
```

### Step 2: Cleared Build Cache
```powershell
# Killed all Node processes
Get-Process | Where-Object {$_.ProcessName -eq 'node'} | Stop-Process -Force

# Deleted Next.js cache
Remove-Item -Recurse -Force .next

# Restarted dev server
npx next dev
```

### Step 3: Fresh Start
- ✅ Server restarted on http://localhost:3000
- ✅ Clean build without cached webpack modules
- ✅ Debug logs will now appear

## Next Steps: Diagnosing the Mapping Issue

### Test Search
1. Open http://localhost:3000 in browser
2. Search for client ID: `132127` or `132129`
3. Check server console for debug logs

### Expected Debug Output
```
[API Service] Raw API Response: {
  "status": 200,
  "message": "Success",
  "data": {
    "user_id": "132127",
    "first_name": "John",     // ← Need to see this
    "last_name": "Doe",       // ← Need to see this
    "allergies": "Peanuts,Shellfish",  // ← Need to see format
    ...
  }
}
```

### Possible API Response Issues:

#### Issue 1: Different Field Names
API might return:
- `firstName` instead of `first_name`
- `lastName` instead of `last_name`
- `allergy_list` instead of `allergies`

#### Issue 2: Different Data Types
API might return:
- Arrays directly instead of comma-separated strings
- Nested objects instead of flat fields
- Empty strings instead of null

#### Issue 3: Response Wrapper Structure
API might have:
- `response.result.data` instead of `response.data`
- Direct data without wrapper
- Different status indicators

## Current Field Mapping Logic

### In `lib/services/api-service.ts` (lines 145-170):

```typescript
const mappedClient: ClientProfile = {
    user_id: rawClient.user_id?.toString() || userId,
    first_name: rawClient.first_name || '',
    last_name: rawClient.last_name || '',
    email: rawClient.email || '',
    mobile_number: rawClient.mobile_number || '',
    age: Number(rawClient.age) || 0,
    gender: rawClient.gender || 'Unknown',

    // Parse comma-separated strings to arrays
    allergies: rawClient.allergies
        ? String(rawClient.allergies).split(',').map(s => s.trim()).filter(Boolean)
        : [],
    medical_conditions: rawClient.medical_issues || rawClient.medical_conditions
        ? String(rawClient.medical_issues || rawClient.medical_conditions).split(',').map(s => s.trim()).filter(Boolean)
        : [],
    food_aversions: rawClient.aversions || rawClient.food_aversions
        ? String(rawClient.aversions || rawClient.food_aversions).split(',').map(s => s.trim()).filter(Boolean)
        : [],
    diet_preference: parseDietPreference(rawClient.food_preference),

    current_weight: Number(rawClient.current_weight) || 0,
    target_weight: Number(rawClient.target_weight) || 0,
    program_start_weight: Number(rawClient.program_start_weight) || 0,
    assessment_start_weight: Number(rawClient.assessment_start_weight) || 0,
};
```

## Action Required from User

**Please search for a client ID again** so we can see the debug logs and identify the exact API response structure.

Expected logs will show:
1. The complete raw API response
2. The extracted data object
3. Individual field values before mapping

This will help us fix the field mapping to match the actual API structure.

---

## Temporary Workarounds (If Needed)

### Option 1: Use Mock Data
If API continues to have issues, can temporarily use mock data to test UI.

### Option 2: Test with Postman/curl
Test the API directly to see response format:

```bash
curl -X GET "https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id?user_id=132127" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Source: cs_db" \
  -H "Content-Type: application/json"
```

---

**Status**: 🔍 Debugging in progress  
**Server**: ✅ Clean restart on http://localhost:3000  
**Next**: Search for client to see debug logs
