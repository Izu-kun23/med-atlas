# Google Cloud Vision API Key Troubleshooting

## Error: "Requests to this API are blocked"

This error means your API key doesn't have permission to access the Cloud Vision API. Here's how to fix it:

### Solution 1: Enable Cloud Vision API (Most Common)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **"APIs & Services" > "Library"**
4. Search for **"Cloud Vision API"**
5. Click on it
6. Click **"Enable"** (if it says "Manage", it's already enabled)
7. Wait a few minutes for it to activate

### Solution 2: Check API Key Restrictions

1. Go to **"APIs & Services" > "Credentials"**
2. Find your API key and click on it
3. Under **"API restrictions"**:
   - If it says **"Don't restrict key"**: This should work, but make sure Cloud Vision API is enabled
   - If it says **"Restrict key"**: 
     - Make sure **"Cloud Vision API"** is in the list of allowed APIs
     - If not, click **"Restrict key"** and add **"Cloud Vision API"** to the list
4. Click **"Save"**

### Solution 3: Enable Billing (Required for Vision API)

1. Go to **"Billing"** in Google Cloud Console
2. Make sure billing is enabled for your project
3. Cloud Vision API requires a billing account (even for free tier usage)

### Solution 4: Check API Key Validity

1. Make sure your API key in `.env` is correct
2. Copy it from Google Cloud Console again
3. Make sure there are no extra spaces or quotes in your `.env` file:
   ```
   EXPO_PUBLIC_GOOGLE_CLOUD_VISION_API_KEY=AIzaSy... (no quotes, no spaces)
   ```

### Solution 5: Wait and Retry

- Sometimes it takes a few minutes for API changes to propagate
- Restart your Expo server after making changes
- Try again after 5-10 minutes

### Quick Checklist

- ✅ Cloud Vision API is enabled
- ✅ API key has Cloud Vision API in allowed APIs (or key is unrestricted)
- ✅ Billing is enabled for the project
- ✅ API key is correctly set in `.env` file
- ✅ Restarted Expo server after changes

### Alternative: Use Unrestricted API Key (For Testing Only)

If you're just testing, you can temporarily use an unrestricted API key:

1. Go to **"APIs & Services" > "Credentials"**
2. Click on your API key
3. Under **"API restrictions"**, select **"Don't restrict key"**
4. Click **"Save"**
5. **⚠️ Warning**: Only do this for testing. For production, always restrict your API key!

### Still Not Working?

1. Check the Google Cloud Console for any error messages
2. Verify your project has the Vision API enabled
3. Try creating a new API key
4. Check if there are any quota limits reached

