# How to Proceed Past "Unsafe" Warning

## The "Unsafe" Warning is Normal!

This warning appears because your app is in **Testing mode** and hasn't been verified by Google yet. This is **completely normal** for development apps.

## Step-by-Step: How to Proceed

### Step 1: You'll See the Warning Screen
```
⚠️ Google hasn't verified this app
   The app is requesting access to sensitive info...
   
   [Advanced]                    [BACK TO SAFETY]
```

### Step 2: Click "Advanced"
- **Don't click "BACK TO SAFETY"** - that will cancel
- Click **"Advanced"** (bottom left, underlined text)

### Step 3: You'll See a New Option
After clicking "Advanced", you'll see:
```
⚠️ Google hasn't verified this app
   
   Go to MedTrackr (unsafe)
   
   [Advanced]                    [BACK TO SAFETY]
```

### Step 4: Click "Go to MedTrackr (unsafe)"
- Click the **"Go to MedTrackr (unsafe)"** button
- This will proceed to the consent screen

### Step 5: Grant Permissions
- You'll see the Google consent screen
- It will show what permissions the app wants (Calendar access)
- Click **"Allow"** or **"Continue"**

### Step 6: Success!
- You'll be redirected back to your app
- Google Calendar should now be connected!

## Important Notes

1. **"Unsafe" doesn't mean dangerous:**
   - It just means Google hasn't verified it yet
   - Since you're the developer, it's safe to proceed

2. **Don't close the browser:**
   - Keep the browser window open
   - Complete the full flow
   - Only close after you're redirected back to the app

3. **If you see "User cancelled":**
   - This means you clicked "BACK TO SAFETY" or closed the browser
   - Try again and click "Advanced" → "Go to MedTrackr (unsafe)"

## Visual Guide

```
Screen 1: Warning
┌─────────────────────────────┐
│ ⚠️ Google hasn't verified   │
│    this app                │
│                             │
│ [Advanced]  [BACK TO SAFETY]│
└─────────────────────────────┘
         ↓ Click "Advanced"

Screen 2: Continue Option
┌─────────────────────────────┐
│ ⚠️ Google hasn't verified   │
│    this app                │
│                             │
│ [Go to MedTrackr (unsafe)]  │
│                             │
│ [Advanced]  [BACK TO SAFETY]│
└─────────────────────────────┘
         ↓ Click "Go to MedTrackr (unsafe)"

Screen 3: Consent Screen
┌─────────────────────────────┐
│ MedTrackr wants to:        │
│ • See your calendars        │
│ • Manage your calendars     │
│                             │
│ [Cancel]      [Allow]       │
└─────────────────────────────┘
         ↓ Click "Allow"

Success! Redirected back to app
```

## Quick Checklist

- [ ] Click "Advanced" (not "BACK TO SAFETY")
- [ ] Click "Go to MedTrackr (unsafe)"
- [ ] Click "Allow" on consent screen
- [ ] Wait for redirect back to app
- [ ] Don't close browser during the process

## If It Still Doesn't Work

1. **Make sure redirect URI is in Google Console:**
   - `https://auth.expo.io/@izu/med-atlas` must be in "Authorized redirect URIs"

2. **Make sure test user is added:**
   - `izuchukwuonuoha6@gmail.com` must be in "Test users"

3. **Try in a different browser:**
   - Sometimes browser settings can interfere
   - Try Chrome or Safari

4. **Clear browser cache:**
   - Clear cookies/cache for accounts.google.com
   - Try again

The key is: **Click "Advanced" → Click "Go to MedTrackr (unsafe)" → Click "Allow"**

