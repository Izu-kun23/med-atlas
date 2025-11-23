# Fix: Google OAuth Redirect URI Issue

## The Problem

Google OAuth **does NOT accept** `exp://` scheme URIs for "Web application" OAuth clients.

Your app was generating: `exp://192.168.0.152:8081`
But Google only accepts:
- `https://` URIs
- `http://localhost` (for localhost only)
- Custom schemes like `med-atlas://` (but these have limitations)

## The Solution

I've updated the code to use the **Expo proxy URI** which is web-compatible:
```
https://auth.expo.io/@izu/med-atlas
```

## What I Changed

1. **Updated redirect URI generation** to use Expo proxy
2. **This generates a web-compatible URI** that Google accepts
3. **Fallback to known working URI** if proxy fails

## What You Need to Do

### Step 1: Make Sure This URI is in Google Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth client: **MedTrackr**
3. Under **"Authorized redirect URIs"**, make sure you have:
   ```
   https://auth.expo.io/@izu/med-atlas
   ```
4. **Remove** any `exp://` URIs (Google doesn't accept them)
5. Click **"SAVE"**

### Step 2: Add Test User

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to **"Test users"**
3. Add: `izuchukwuonuoha6@gmail.com`
4. Click **"SAVE"**

### Step 3: Restart Your App

1. Stop your Expo server (Ctrl+C)
2. Clear cache and restart:
   ```bash
   npm start -- --clear
   ```
3. Try connecting to Google Calendar again

## Why This Works

- **Expo proxy URI** (`https://auth.expo.io/...`) = Web-compatible, Google accepts it
- **Expo proxy** handles the OAuth flow and redirects back to your app
- This is the recommended approach for Expo apps with Google OAuth

## Expected Redirect URI Now

After the fix, your app should log:
```
Redirect URI: https://auth.expo.io/@izu/med-atlas
```

Make sure this EXACT URI is in Google Console!

