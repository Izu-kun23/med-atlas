# Quick Navigation: From OAuth Client to Test Users

## You're Currently On:
**OAuth Client** page (showing Client ID, redirect URIs, etc.)

## You Need To Go To:
**OAuth Consent Screen** (different page!)

## Quick Navigation Steps:

### Method 1: Use the Left Sidebar
1. Look at the **left sidebar menu** (☰ if collapsed)
2. Under **"APIs & Services"**, click:
   - **"OAuth consent screen"** ← This is what you need!
   - (NOT "Credentials" or "OAuth client IDs")

### Method 2: Use Breadcrumbs
1. At the top of the page, you might see breadcrumbs like:
   ```
   Google Cloud Platform > APIs & Services > Credentials
   ```
2. Click on **"APIs & Services"** in the breadcrumb
3. Then click **"OAuth consent screen"**

### Method 3: Direct Link
Just click this link:
**https://console.cloud.google.com/apis/credentials/consent**

## What You'll See on OAuth Consent Screen:

```
OAuth consent screen
├── Publishing status: Testing
├── App information
├── Scopes
└── Test users  ← THIS IS WHERE YOU ADD YOUR EMAIL
    └── [ADD USERS] button
```

## Important Note:

- **OAuth Client page** = Where you configure redirect URIs (what you're on now)
- **OAuth Consent Screen** = Where you add test users (where you need to go)

These are TWO DIFFERENT PAGES!

