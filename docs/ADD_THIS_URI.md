# Add This Exact Redirect URI to Google Console

## Your App is Using This URI:

```
exp://192.168.0.152:8081
```

## Steps to Add It:

1. **Go to Google Cloud Console:**
   https://console.cloud.google.com/apis/credentials

2. **Click on your OAuth client:** MedTrackr

3. **Scroll to "Authorized redirect URIs"**

4. **Click "+ ADD URI"**

5. **Add this EXACT URI:**
   ```
   exp://192.168.0.152:8081
   ```

6. **Also add these for compatibility:**
   ```
   exp://localhost:8081
   med-atlas://oauth
   med-atlas://
   https://auth.expo.io/@izu/med-atlas
   ```

7. **Click "SAVE"**

8. **Wait 1-2 minutes** for changes to take effect

9. **Try connecting again**

## Why This URI?

- `exp://192.168.0.152:8081` = Your local network IP (for Expo development)
- This changes if your IP changes, so also add `exp://localhost:8081`
- The custom scheme URIs (`med-atlas://`) are for production builds

## Also Don't Forget:

1. **Add test user:**
   - Go to: https://console.cloud.google.com/apis/credentials/consent
   - Add: `izuchukwuonuoha6@gmail.com` to test users

2. **Check publishing status:**
   - Should be "Testing" (not "In production")

