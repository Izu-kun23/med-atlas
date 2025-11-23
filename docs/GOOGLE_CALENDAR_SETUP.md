# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the MedAtlas app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "MedAtlas Calendar")
5. Click "Create"

## Step 2: Enable Google Calendar API

1. In your Google Cloud project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - Choose "External" (unless you have a Google Workspace account)
   - Fill in the required information:
     - App name: "MedAtlas"
     - User support email: Your email
     - Developer contact: Your email
   - Click "Save and Continue"
   - Add scopes:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Click "Save and Continue"
   - **IMPORTANT - Add Test Users:**
     - If your app is in "Testing" mode, you MUST add test users
     - Click "Add Users" or "Add Test Users"
     - Add your email: `izuchukwuonuoha6@gmail.com`
     - Add any other emails that will test the app
     - **Note**: Only test users can sign in while the app is in testing mode
   - Click "Save and Continue" > "Back to Dashboard"
   
   **Troubleshooting "Access blocked" error:**
   - Make sure your email is added as a test user
   - Check that the redirect URI in the console matches exactly what's logged in your app
   - Verify the OAuth client type matches your use case (Web application for Expo)

4. Now create the OAuth client ID:
   - **For Expo Development (Expo Go or Development Build):**
     - Application type: Select "Web application"
     - Name: "MedAtlas Web Client"
     
   - **IMPORTANT - Two Different Fields:**
     
     **Authorized JavaScript origins** (if shown):
     - Add only the domain (no path):
       ```
       https://auth.expo.io
       ```
     - This field is for browser-based OAuth flows
     - Leave empty if not using browser-based auth
     
     **Authorized redirect URIs** (this is what you need):
     - Add the following URIs (add all of them to be safe):
       ```
       med-atlas://oauth
       med-atlas://
       https://auth.expo.io/@izu/med-atlas
       exp://localhost:8081
       ```
     - This field accepts full URIs with paths
     - **This is the field you need to fill!**
     
     - **Note**: Your Expo username is `izu` (found via `npx expo whoami`)
   - **For Production (Standalone Apps):**
     - You may need separate iOS and Android OAuth clients
     - iOS: Application type "iOS"
     - Android: Application type "Android"
   - Click "Create"
   - **IMPORTANT**: Copy the Client ID and Client Secret
   
   **Pro Tip**: When you first try to authenticate, check the console logs - it will show the exact redirect URI being used. Make sure that exact URI is in your authorized redirect URIs list.

## Step 4: Configure Environment Variables

1. Create or update your `.env` file in the project root:

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-client-secret-here
```

2. Make sure `.env` is in your `.gitignore` file to keep credentials secure

## Step 5: Configure app.json for Deep Linking

1. Open `app.json` and ensure you have a scheme configured:

```json
{
  "expo": {
    "scheme": "med-atlas",
    ...
  }
}
```

## Step 6: Test the Integration

1. Start your Expo app: `npm start`
2. Navigate to the Calendar screen
3. Tap "Add to Google Calendar"
4. You should be redirected to Google's OAuth consent screen
5. Sign in and authorize the app
6. You should be redirected back to the app

## Troubleshooting

### "Redirect URI mismatch" error

- Make sure the redirect URI in your Google Cloud Console matches exactly with what Expo generates
- Check your Expo username in the redirect URI
- For development, ensure `expo-auth-session` is using the correct redirect URI

### "Invalid client" error

- Verify your Client ID and Client Secret are correct in `.env`
- Make sure the environment variables are prefixed with `EXPO_PUBLIC_`
- Restart your Expo development server after changing `.env`

### Token refresh issues

- The app automatically refreshes tokens when they expire
- If you're having issues, try disconnecting and reconnecting

## Security Notes

- Never commit your `.env` file to version control
- Keep your Client Secret secure
- For production, consider using environment-specific credentials
- Regularly rotate your OAuth credentials

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Expo AuthSession Documentation](https://docs.expo.dev/guides/authentication/#google)
- [OAuth 2.0 for Mobile Apps](https://developers.google.com/identity/protocols/oauth2/native-app)

