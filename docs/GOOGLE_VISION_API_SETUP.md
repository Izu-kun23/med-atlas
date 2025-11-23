# Google Cloud Vision API Setup Guide

## Step 1: Get Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Vision API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click on it and press "Enable"
4. Create an API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (it will look like: `AIzaSy...`)

## Step 2: Add API Key to Your Project

### Option A: Using app.config.js (Recommended)

1. Rename `app.json` to `app.config.js` (or create a new `app.config.js`)
2. Add your API key to the `extra` field:

```javascript
export default {
  expo: {
    // ... your existing config
    extra: {
      googleCloudVisionApiKey: process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY,
    },
  },
};
```

3. Create a `.env` file in the root directory:
```
EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

4. Install dotenv (if needed):
```bash
npm install dotenv
```

### Option B: Direct in app.config.js

Add the API key directly (less secure, but simpler):

```javascript
export default {
  expo: {
    // ... your existing config
    extra: {
      googleCloudVisionApiKey: "YOUR_API_KEY_HERE",
    },
  },
};
```

## Step 3: Update the OCR Utility

The OCR utility will automatically use the API key from `process.env.EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY` or you can pass it directly.

## Important Notes

- **Never commit your API key to Git!** Add `.env` to your `.gitignore`
- The API key should be kept secret
- Google Cloud Vision API has usage limits and may incur charges
- For production, consider using environment-specific keys

## Testing

After adding the API key, restart your Expo development server:
```bash
npm start
```

Then test the scan functionality in the app - it should automatically extract text from scanned documents!

