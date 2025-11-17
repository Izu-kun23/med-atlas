# Firebase Setup Guide

This project now uses Firebase for authentication (and can be extended for other services). Follow the steps below to configure your local environment.

## 1. Install Dependencies

The Firebase JavaScript SDK is already added to the project:

```bash
npm install firebase
```

If you ever need to reinstall dependencies, run `npm install` in the project root.

## 2. Configure Environment Variables

Create a `.env` file (Expo automatically exposes variables prefixed with `EXPO_PUBLIC_`):

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyBiNBe394oBcVyEZKSqf9dzNyNlAtwZIWM
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=medtrackr-19af1.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=medtrackr-19af1
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=medtrackr-19af1.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1040596873230
EXPO_PUBLIC_FIREBASE_APP_ID=1:1040596873230:web:2bcc45f865c89ada018c5f
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-940FYYHTLL
```

> **Note:** These keys are considered public client credentials. If you rotate or replace them in the Firebase console, update this file accordingly.

Start Expo with the env file loaded:

```bash
npx expo start
```

## 3. Initialize Firebase in the App

The project includes a helper at `src/lib/firebase.ts`:

```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
```

This ensures the Firebase app is created once and that authentication state is persisted via AsyncStorage on React Native.

## 4. Authenticating Users

`LoginScreen` and `SignUpScreen` already reference Firebase Auth:

- `createUserWithEmailAndPassword` and `updateProfile` during sign-up.
- `signInWithEmailAndPassword` during login.

If you add password reset, multi-factor auth, Firestore, etc., import the relevant modules from the SDK.

## 5. Optional: Firebase Analytics (Web Only)

The boilerplate snippet you provided includes analytics:

```ts
import { getAnalytics } from 'firebase/analytics';

const analytics = getAnalytics(app);
```

Analytics is only supported on web builds. If you want to enable it, add a check before calling `getAnalytics` to ensure you’re running in a browser.

## 6. Firebase Console Checklist

1. Create a project: **medtrackr-19af1**.
2. Register a web app and copy the credentials (already populated above).
3. Enable Email/Password sign-in under **Authentication → Sign-in method**.
4. (Optional) Configure Firestore/Realtime Database, Storage rules, Cloud Messaging, etc.

With this setup, the Expo app can authenticate users against Firebase and persist sessions locally. Extend the helper module if you add Firestore or other Firebase products.***

