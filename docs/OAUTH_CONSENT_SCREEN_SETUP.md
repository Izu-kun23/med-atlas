# OAuth Consent Screen Configuration Guide

## What You Have (Good!)

✅ **App name:** MedTrackr  
✅ **User support email:** izuchukwuonuoha6@gmail.com  
✅ **Authorized domain:** expo.io (already added)  
✅ **Verification status:** "Verification is not required" (perfect for testing!)

## What You Need to Fill (Optional for Testing)

### App Domain Section (Optional for Testing Mode)

These fields are **optional** when your app is in "Testing" mode, but you can fill them if you want:

1. **Application home page:**
   - Can leave empty for testing
   - Or add: `https://expo.dev/@izu/med-atlas` (your Expo app URL)
   - Or add: `https://medatlas.app` (if you have a website)

2. **Application privacy policy link:**
   - Can leave empty for testing
   - Or create a simple privacy policy page and link it
   - Example: `https://yourwebsite.com/privacy`

3. **Application terms of service link:**
   - Can leave empty for testing
   - Or create a simple terms page and link it
   - Example: `https://yourwebsite.com/terms`

### App Logo (Optional)

- You can upload a logo (120x120px, JPG/PNG/BMP, max 1MB)
- **Note:** Uploading a logo may require verification, so you can skip this for now
- For testing, no logo is needed

## For Testing Mode (Current Setup)

**You can leave these empty:**
- Application home page
- Privacy policy link
- Terms of service link
- App logo

**Just make sure:**
- ✅ App name is filled
- ✅ User support email is filled
- ✅ Test users are added (izuchukwuonuoha6@gmail.com)
- ✅ Scopes are added (Calendar, Calendar Events)

## Next Steps

1. **Scroll down** on the OAuth Consent Screen page
2. **Find "Scopes" section** - make sure these are added:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. **Find "Test users" section** - add your email:
   - `izuchukwuonuoha6@gmail.com`
4. **Click "SAVE"** at the bottom

## Important Notes

- **For Testing:** You don't need to fill home page, privacy policy, or terms
- **For Production:** You'll need to fill these before verification
- **Current status:** "Verification is not required" = Perfect for development!

## What to Do Now

1. Scroll down to **"Scopes"** section
2. Make sure Calendar scopes are there
3. Scroll to **"Test users"** section
4. Add: `izuchukwuonuoha6@gmail.com`
5. Click **"SAVE"**
6. Try connecting to Google Calendar again

Your current setup is fine for testing! You can proceed without filling the optional fields.

