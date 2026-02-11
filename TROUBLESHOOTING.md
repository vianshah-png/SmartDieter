# Client API Data Display Troubleshooting

## Issue Fixed: Unified API Service Layer

### Problem
The client API data wasn't reflecting on the dashboard because there were **two separate data fetching systems**:

1. **Old System**: `app/actions/client.ts` - Direct API fetch with manual parsing
2. **New System**: `lib/services/api-service.ts` - Unified service with Zod validation

### Solution
✅ **Refactored `getClientDetails()` to delegate to `fetchClientProfile()`**

Now both the dashboard search and the audit pipeline use the same unified API service layer.

---

## How to Verify Data Is Loading

### 1. Check Server Console Logs

When you search for a client ID, you should see:

```
[Client Action] Fetching client details for ID: 132129
[API Service] GET https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id?user_id=132129
[Client Action] Successfully fetched client: John Doe
[Client Action] Mapped client data: {
  id: '132129',
  name: 'John Doe',
  allergies: ['Peanuts', 'Shellfish'],
  aversions: ['Spinach'],
  medicalIssues: ['Diabetes'],
  foodPreference: 'Veg'
}
```

### 2. Check Browser Console Logs

In the browser console (F12), you should see:

```
[Dashboard] Received client: John Doe
```

### 3. Visual Confirmation

The dashboard should display:
- Client name in the left sidebar header
- Email, phone, age, gender in the Profile tab
- Allergies, aversions, medical issues in the Health tab
- Weight stats

---

## Common Issues & Solutions

### Issue 1: API Returns Empty Data

**Symptoms:**
```
[API Service] API returned empty data for client profile
```

**Solution:**
- The API endpoint returned `{ data: null }` or empty object
- Verify the `user_id` exists in the database
- Check if the API requires specific headers (already configured: `Source: cs_db`)

### Issue 2: Network Error (ENOTFOUND)

**Symptoms:**
```
[API Service] Network request failed: getaddrinfo ENOTFOUND bn-new-api.balancenutritiononline.com
```

**Solution:**
- DNS resolution failed
- Check internet connection
- Verify the API domain is accessible
- Try pinging: `ping bn-new-api.balancenutritiononline.com`

### Issue 3: 401 Unauthorized

**Symptoms:**
```
[API Service] API request failed: Unauthorized
API request failed: Unauthorized returned 401
```

**Solution:**
- Invalid or missing API token
- Update `.env.local` with a valid token:
  ```env
  API_TOKEN=your_actual_token_here
  ```
- Restart the dev server after updating `.env.local`

### Issue 4: 404 Not Found

**Symptoms:**
```
[API Service] Error 404 for https://.../client-details/...
```

**Solution:**
- Endpoint URL is incorrect
- Verify `C_URL` in `.env.local`:
  ```env
  C_URL=https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id
  ```

### Issue 5: Validation Error

**Symptoms:**
```
[API Service] Validation error: Client profile validation failed
Field: <fieldName>
```

**Solution:**
- API response structure doesn't match the Zod schema
- Check `lib/types/audit-schema.ts` → `ClientProfileSchema`
- The API might be returning unexpected field format (e.g., number as string)

### Issue 6: Dashboard Shows "Enter a Client ID"

**Symptoms:**
- Dashboard doesn't load client data after search
- No errors in console

**Check:**
1. Did you press **Enter** after typing the client ID?
2. Check browser console for `[Dashboard] Starting search...` log
3. Verify `isSearchPending` state transition

### Issue 7: Client Data Loads But Doesn't Display

**Symptoms:**
- Logs show successful fetch
- UI still shows empty state

**Solution:**
1. Check React state update:
   ```
   [Dashboard] Setting client data in state
   ```
2. Open React DevTools and inspect `DashboardContainer` state
3. Verify `clientData` state is populated
4. Check if `ClientProfile` component is receiving props

---

## Test with a Valid Client ID

### Steps:
1. Find a valid `user_id` from your database
2. Type it into the search bar in the dashboard header
3. Press **Enter**
4. Monitor both server and browser consoles
5. Client profile should appear in left sidebar

### Expected Behavior:
- Loading spinner appears (very brief)
- Client name displays
- Tabs populate with data
- "Run Audit" button becomes enabled

---

## Architecture Flow

```
User enters client ID → Press Enter
    ↓
DashboardContainer.handleSearchClient()
    ↓
startSearchTransition(() => getClientDetails(query))
    ↓
app/actions/client.ts → getClientDetails()
    ↓
lib/services/api-service.ts → fetchClientProfile()
    ↓
API: GET .../client-details/get-single-client-by-user_id?user_id=...
    ↓
Zod validation (ClientProfileSchema)
    ↓
Map ClientProfile → Client type
    ↓
Return to Dashboard
    ↓
setClientData(client)
    ↓
ClientProfile component renders with data
```

---

## Quick Diagnostic Command

Run in browser console:
```javascript
// Check if client data is in React state
document.querySelector('[data-client-id]')?.getAttribute('data-client-id')
```

Or in React DevTools:
- Select `DashboardContainer` component
- Check `hooks` → `State` → `clientData`
- Should show populated object

---

## Manual API Test

Test the API directly with curl:

```bash
curl -X GET "https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id?user_id=132129" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Source: cs_db" \
  -H "Content-Type: application/json"
```

Expected response:
```json
{
  "status": 200,
  "message": "Success",
  "data": {
    "user_id": "132129",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "allergies": "Peanuts,Shellfish",
    ...
  }
}
```

---

## Still Not Working?

1. **Enable DEBUG_MODE** in `.env.local`:
   ```env
   DEBUG_MODE=true
   ```

2. **Restart the server**:
   ```bash
   npm run dev
   ```

3. **Try a different client ID** - ensure the ID exists in the database

4. **Check Network Tab** in browser DevTools:
   - Look for the client-details API call
   - Check status code and response body

5. **Verify all environment variables** in `.env.local`:
   ```env
   API_TOKEN=your_actual_token
   C_URL=https://bn-new-api.balancenutritiononline.com/api/v1/client-details/get-single-client-by-user_id
   CLIENT_HEADER_SOURCE=cs_db
   ```

---

**Status**: ✅ API service layer unified  
**Next**: Test with a valid client ID and monitor console logs
