# Android Emulator Setup Guide

## Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Install it following the installation wizard
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (AVD)

## Step 2: Set Up Environment Variables

Add these to your `~/.zshrc` file (since you're using zsh):

```bash
# Android SDK
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Then reload your shell:
```bash
source ~/.zshrc
```

## Step 3: Create an Android Virtual Device (AVD)

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 5)
5. Select a system image (e.g., Android 13 - API 33)
6. Click **Finish**

## Step 4: Verify Installation

Run these commands to verify:
```bash
adb version
emulator -list-avds
```

## Step 5: Start the Emulator

```bash
emulator -avd <AVD_NAME>
```

Or start it from Android Studio's Device Manager.

## Step 6: Run Your Expo App

Once the emulator is running:
```bash
npx expo start --android
```

Or press `a` in the Expo CLI to open on Android.

## Troubleshooting

- If `adb` is still not found, make sure Android Studio is fully installed
- Restart your terminal after adding environment variables
- Make sure the Android SDK is installed via Android Studio's SDK Manager

