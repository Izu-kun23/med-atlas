# Fix: Authorization Blocked - Redirect URI Mismatch

## The Problem

Your app generates a redirect URI like: `med-atlas://oauth`
But Google Console only has: `https://auth.expo.io/@izu/med-atlas`

**These don't match, so Google blocks the request!**

## Solution: Add the Custom Scheme URI

### Step 1: Check What URI Your App Uses

1. Run your app
2. Try to connect to Google Calendar
3. Check the console logs - you'll see:
   ```
   Redirect URI: med-atlas://oauth
   ```
   (or similar)

### Step 2: Add That Exact URI to Google Console

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client: **MedTrackr**
3. Scroll to **"Authorized redirect URIs"**
4. Click **"+ ADD URI"** or **"ADD URI"**
5. Add these URIs (one at a time):
   ```
   med-atlas://oauth
   med-atlas://
   ```
6. Click **"SAVE"**

### Step 3: Also Add Test User

1. Go to: https://console.cloud.google.com/apis/credentials/consent
2. Scroll to **"Test users"** section
3. Click **"ADD USERS"**
4. Add: `izuchukwuonuoha6@gmail.com`
5. Click **"SAVE"**

## Complete List of URIs to Add

Add ALL of these to "Authorized redirect URIs":

```
exp://192.168.0.152:8081
exp://localhost:8081
med-atlas://oauth
med-atlas://
https://auth.expo.io/@izu/med-atlas
```

**IMPORTANT:** The exact URI from your console (`exp://192.168.0.152:8081`) MUST be added!

## Why This Happens

- **Custom scheme** (`med-atlas://`) = Used in development builds
- **Expo Go URI** (`https://auth.expo.io/...`) = Used in Expo Go app
- Your app is using the custom scheme, but Google only has the Expo Go URI

## After Adding URIs

1. Wait 1-2 minutes for Google to update
2. Try connecting to Google Calendar again
3. Should work now!

