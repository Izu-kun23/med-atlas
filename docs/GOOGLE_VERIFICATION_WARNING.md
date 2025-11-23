# Google "App Not Verified" Warning - How to Proceed

## What This Warning Means

This warning appears because:
- Your app is in **"Testing"** mode (which is correct for development)
- Google hasn't verified your app yet (verification is only needed for production)
- This is **NORMAL and EXPECTED** during development

## How to Proceed Past the Warning

### Step 1: Click "Advanced"
- At the bottom left, click the **"Advanced"** link

### Step 2: Click "Go to [App Name] (unsafe)"
- After clicking "Advanced", you'll see an option like:
  - **"Go to MedTrackr (unsafe)"** or
  - **"Continue to MedTrackr"**
- Click that button to proceed

### Step 3: Complete the OAuth Flow
- You'll then see the Google consent screen
- Review the permissions (Calendar access)
- Click **"Allow"** or **"Continue"**

## Why This Happens

- **Testing Mode** = Only test users can sign in, but Google shows this warning
- **Production Mode** = Requires Google verification (takes weeks, needs app review)
- **For Development** = You can safely proceed past this warning

## Important Notes

1. **This is Safe to Proceed:**
   - You're the developer
   - The app is in testing mode
   - Only test users can access it

2. **You Don't Need Verification Yet:**
   - Verification is only required when you publish to production
   - For development/testing, you can ignore this warning

3. **To Remove the Warning (Later):**
   - Submit your app for Google verification (only when ready for production)
   - This requires app review and can take weeks
   - Not needed for development

## Quick Steps to Connect

1. Click **"Advanced"** on the warning screen
2. Click **"Go to MedTrackr (unsafe)"** or similar
3. Review permissions on the consent screen
4. Click **"Allow"** to grant Calendar access
5. You'll be redirected back to your app
6. Google Calendar should now be connected!

## If You Don't See "Advanced" Option

- Make sure you're logged into Google with: `izuchukwuonuoha6@gmail.com`
- Make sure that email is added as a test user in OAuth Consent Screen
- Try refreshing the page

