# Google OAuth "Access Blocked" Error - Troubleshooting Guide

## Error: "Access blocked: Authorization Error - Error 400: invalid_request"

This error occurs when Google OAuth configuration doesn't match your app's requirements.

## Common Causes and Solutions

### 1. **Missing Test User (Most Common)**

If your OAuth app is in "Testing" mode, you must add test users.

**Fix:**
1. **Go to OAuth Consent Screen:**
   - Direct link: https://console.cloud.google.com/apis/credentials/consent
   - OR: Google Cloud Console → APIs & Services → OAuth consent screen

2. **Find "Test users" section:**
   - Scroll down on the page
   - Look for "Test users" section (below "Scopes")

3. **Add your email:**
   - Click "ADD USERS" or "+ ADD USERS" button
   - Enter: `izuchukwuonuoha6@gmail.com`
   - Press Enter or click "Add"
   - Click "SAVE" at the bottom

4. **Wait 10-30 seconds** for changes to take effect

5. **Try authenticating again** in your app

**See detailed guide:** `HOW_TO_ADD_TEST_USER.md`

### 2. **Redirect URI Mismatch**

The redirect URI in your app must exactly match what's configured in Google Cloud Console.

**Fix:**
1. Run your app and try to connect to Google Calendar
2. Check the console logs - you'll see: `Redirect URI: med-atlas://oauth` (or similar)
3. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
4. Click on your OAuth client (MedTrackr)
5. Under "Authorized redirect URIs", make sure the exact URI from the console is listed
6. Common URIs to add:
   ```
   med-atlas://oauth
   med-atlas://
   https://auth.expo.io/@izu/med-atlas
   ```

### 3. **OAuth Client Type Mismatch**

Make sure you're using a "Web application" type OAuth client for Expo.

**Fix:**
1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Check your OAuth client type
3. For Expo, it should be "Web application"
4. If it's not, create a new "Web application" OAuth client

### 4. **OAuth Consent Screen Not Configured**

The consent screen must be properly set up.

**Fix:**
1. Go to [OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Make sure:
   - App name is set: "MedAtlas" or "MedTrackr"
   - User support email is your email
   - Developer contact is your email
   - Scopes are added:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
3. Save all changes

### 5. **App in Production Mode (Not Verified)**

If your app is in "Production" mode but not verified by Google, it may be blocked.

**Fix:**
- Keep the app in "Testing" mode during development
- Only move to "Production" after Google verification (which requires app review)

## Step-by-Step Fix for Your Current Error

1. **Add Test User:**
   ```
   Go to: https://console.cloud.google.com/apis/credentials/consent
   → Scroll to "Test users"
   → Click "ADD USERS"
   → Add: izuchukwuonuoha6@gmail.com
   → Save
   ```

2. **Verify Redirect URI:**
   ```
   Run your app → Check console for "Redirect URI: ..."
   Go to: https://console.cloud.google.com/apis/credentials
   → Click your OAuth client
   → Under "Authorized redirect URIs"
   → Add the exact URI from console
   → Save
   ```

3. **Check OAuth Client Settings:**
   ```
   Application type: Web application
   Authorized JavaScript origins: https://auth.expo.io (optional)
   Authorized redirect URIs: med-atlas://oauth, https://auth.expo.io/@izu/med-atlas
   ```

4. **Restart and Try Again:**
   - Clear app cache: `npm start -- --clear`
   - Try connecting to Google Calendar again

## Still Not Working?

1. **Check the exact error in Google Cloud Console:**
   - Go to [Google Cloud Console - APIs & Services - Dashboard](https://console.cloud.google.com/apis/dashboard)
   - Look for any error messages or warnings

2. **Verify Environment Variables:**
   - Make sure `.env` file has correct values
   - Restart Expo server after changing `.env`

3. **Check Expo Scheme:**
   - Verify `app.json` has: `"scheme": "med-atlas"`
   - The scheme must match your redirect URI

## Quick Checklist

- [ ] Test user added (izuchukwuonuoha6@gmail.com)
- [ ] Redirect URI matches exactly in Google Console
- [ ] OAuth client type is "Web application"
- [ ] OAuth consent screen is configured
- [ ] Scopes are added to consent screen
- [ ] Environment variables are set correctly
- [ ] App scheme matches redirect URI
- [ ] Expo server restarted with cleared cache

