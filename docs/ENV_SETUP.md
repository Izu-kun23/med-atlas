# Environment Variables Setup

## Step 1: Get Your Google Cloud Vision API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or Select a Project**:
   - Click the project dropdown at the top
   - Click "New Project" or select an existing one
3. **Enable Cloud Vision API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click on it and press "Enable"
4. **Create an API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key (it will look like: `AIzaSy...`)
   - **Optional but Recommended**: Click "Restrict Key" and limit it to "Cloud Vision API" only

## Step 2: Add API Key to Your Project

1. **Create a `.env` file** in the root directory of your project (same level as `package.json`)

2. **Add your API key**:
   ```
   EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=your_actual_api_key_here
   ```

   Replace `your_actual_api_key_here` with the API key you copied from Google Cloud Console.

3. **Example**:
   ```
   EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=AIzaSyB1234567890abcdefghijklmnopqrstuvwxyz
   ```

## Step 3: Restart Your Development Server

After creating the `.env` file, restart your Expo development server:

```bash
npm start
```

Or if it's already running, stop it (Ctrl+C) and start again.

## Important Notes

- ✅ The `.env` file is already added to `.gitignore` - it won't be committed to Git
- ✅ Never share your API key publicly
- ✅ The API key starts with `EXPO_PUBLIC_` so it's available in your React Native code
- ⚠️ Google Cloud Vision API has usage limits and may incur charges (check Google Cloud pricing)

## Testing

After setup, test the OCR feature:
1. Go to any subject
2. Click "Add Note"
3. Click "Scan Document"
4. Take a photo or choose from gallery
5. The text should automatically appear in the note body!

## Troubleshooting

If OCR doesn't work:
1. Check that your `.env` file is in the root directory
2. Make sure the variable name is exactly: `EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY`
3. Restart your Expo server after creating/editing `.env`
4. Check the console for error messages
5. Verify your API key is valid in Google Cloud Console

