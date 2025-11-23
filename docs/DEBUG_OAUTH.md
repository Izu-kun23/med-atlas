# Debugging "Authorization Blocked" Error

## Common Reasons for "Authorization Blocked"

### 1. **Test User Not Added** (Most Common)
- Your email must be in the test users list
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Scroll to "Test users" section
- Add: `izuchukwuonuoha6@gmail.com`

### 2. **Redirect URI Mismatch**
The redirect URI in your app must EXACTLY match what's in Google Console.

**Check what your app is using:**
1. Run your app
2. Try to connect to Google Calendar
3. Check the console logs - you'll see: `Redirect URI: ...`
4. Copy that EXACT URI

**Verify in Google Console:**
- Go to: https://console.cloud.google.com/apis/credentials
- Click your OAuth client (MedTrackr)
- Under "Authorized redirect URIs"
- Make sure the EXACT URI from your app console is listed

### 3. **App in Production Mode**
- If your app is "In production" but not verified, it will be blocked
- Make sure it's in "Testing" mode
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Check "Publishing status" - should say "Testing"

### 4. **OAuth Client Type Wrong**
- Should be "Web application" (which you have ✓)
- Not "iOS" or "Android" for Expo

### 5. **Scopes Not Added to Consent Screen**
- Go to: https://console.cloud.google.com/apis/credentials/consent
- Check "Scopes" section
- Should have:
  - `https://www.googleapis.com/auth/calendar`
  - `https://www.googleapis.com/auth/calendar.events`

## Quick Debug Steps

1. **Check the exact redirect URI:**
   - Run app → Try to connect → Check console logs
   - Look for: `Redirect URI: med-atlas://oauth` or similar

2. **Verify in Google Console:**
   - The URI from step 1 must be in "Authorized redirect URIs"
   - Must match EXACTLY (including scheme, path, etc.)

3. **Check test users:**
   - Go to OAuth Consent Screen
   - Verify your email is in test users list

4. **Check publishing status:**
   - Should be "Testing" (not "In production")

## What to Check Right Now

1. **Test Users:**
   - Link: https://console.cloud.google.com/apis/credentials/consent
   - Is `izuchukwuonuoha6@gmail.com` in the list?

2. **Redirect URI:**
   - What URI does your app console show?
   - Is that EXACT URI in Google Console?

3. **Publishing Status:**
   - Is it "Testing" or "In production"?

