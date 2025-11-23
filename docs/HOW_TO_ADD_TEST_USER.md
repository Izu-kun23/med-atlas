# How to Add Test Users to Google OAuth

## Step-by-Step Instructions

### Step 1: Go to OAuth Consent Screen

1. Open your browser and go to:
   **https://console.cloud.google.com/apis/credentials/consent**

   OR navigate manually:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Click on the hamburger menu (☰) in the top left
   - Go to **"APIs & Services"** → **"OAuth consent screen"**

### Step 2: Find the Test Users Section

1. On the OAuth consent screen page, scroll down
2. Look for a section called **"Test users"** or **"User type"**
3. You should see it below the "Scopes" section

### Step 3: Add Your Email

1. In the "Test users" section, click the button:
   - **"ADD USERS"** or **"+ ADD USERS"** or **"Add test users"**

2. A dialog/popup will appear

3. In the text field, type your email:
   ```
   izuchukwuonuoha6@gmail.com
   ```

4. Press **Enter** or click **"Add"**

5. Your email should now appear in the test users list

6. Click **"SAVE"** or **"Save"** at the bottom of the page

### Step 4: Verify

1. Make sure your email appears in the "Test users" list
2. The list should show: `izuchukwuonuoha6@gmail.com`

## Visual Guide

```
Google Cloud Console
└── APIs & Services
    └── OAuth consent screen
        ├── App information
        ├── Scopes
        └── Test users  ← YOU ARE HERE
            └── [ADD USERS] button
                └── Enter: izuchukwuonuoha6@gmail.com
                    └── [Add] → [Save]
```

## Important Notes

- **Only test users can sign in** while your app is in "Testing" mode
- You can add multiple test users (one per line or separated by commas)
- Changes may take a few seconds to propagate
- If you don't see "Test users" section, make sure your app is set to "Testing" mode (not "In production")

## Quick Link

**Direct link to OAuth Consent Screen:**
https://console.cloud.google.com/apis/credentials/consent

## After Adding Test User

1. Wait 10-30 seconds for changes to take effect
2. Try connecting to Google Calendar again in your app
3. You should now see the Google consent screen instead of "Access blocked"

