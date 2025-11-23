# How to Navigate to Test Users from OAuth Overview

## You're Currently On:
**OAuth Overview** page (showing metrics, traffic, errors, etc.)

## Where You Need to Go:
**OAuth Consent Screen** → **Test Users** section

## Step-by-Step Navigation:

### Option 1: Using the Left Sidebar Menu

1. Look at the **left sidebar** (hamburger menu ☰ if collapsed)
2. Find **"APIs & Services"** section
3. Click on **"OAuth consent screen"** (NOT "OAuth Overview")
4. Scroll down to find **"Test users"** section
5. Click **"ADD USERS"** or **"+ ADD USERS"**

### Option 2: Using the Top Navigation

1. At the top of the page, you might see tabs like:
   - OAuth Overview ← You are here
   - OAuth consent screen ← Click this
2. Click **"OAuth consent screen"** tab
3. Scroll down to **"Test users"** section
4. Click **"ADD USERS"**

### Option 3: Direct URL

Just go directly to:
**https://console.cloud.google.com/apis/credentials/consent**

## What You Should See on OAuth Consent Screen:

```
OAuth consent screen page
├── Publishing status: Testing (or In production)
├── App information
│   ├── App name
│   ├── User support email
│   └── App logo
├── App domain
├── Authorized domains
├── Developer contact information
├── Scopes
│   └── (Your calendar scopes should be here)
└── Test users  ← YOU NEED TO GO HERE
    └── [ADD USERS] button
```

## Quick Checklist:

- [ ] You're on "OAuth consent screen" (NOT "OAuth Overview")
- [ ] You see "Test users" section
- [ ] You can see an "ADD USERS" button
- [ ] Your app shows "Testing" mode (not "In production")

## If You Don't See "Test users" Section:

1. Make sure your app is in **"Testing"** mode (not "In production")
2. If it says "In production", you need to:
   - Click "BACK TO TESTING" or "PUBLISHING STATUS" → "Testing"
   - Then you'll see the "Test users" section

## Still Can't Find It?

Try this direct link:
**https://console.cloud.google.com/apis/credentials/consent**

Then look for "Test users" section and click "ADD USERS"

