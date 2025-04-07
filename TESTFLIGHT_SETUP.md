# TestFlight Setup Instructions for Spouseyv1

This document explains how to resolve the CocoaPods configuration issues you're experiencing with TestFlight.

## The Issue

The error you're seeing is:
```
/Users/edstockman/spousey-app/Spouseycom/ios/App/App.xcodeproj:1:1 Unable to open base configuration reference file '/Users/edstockman/spousey-app/Spouseycom/ios/App/Pods/Target Support Files/Pods-App/Pods-App.debug.xcconfig'.
```

This indicates that Xcode can't find the CocoaPods configuration files needed to build the app.

## Quick Solution

After downloading the project from Replit to your Mac, follow these steps:

1. Navigate to the iOS App directory in Terminal:
   ```bash
   cd /path/to/your/downloaded/project/ios/App
   ```

2. Run the automated fix script we've created:
   ```bash
   ./pod-fix.sh
   ```
   
3. If prompted for your password, enter it (it's needed for sudo commands)

4. Once the script completes successfully, open the workspace in Xcode:
   ```bash
   open App.xcworkspace
   ```

5. You should now be able to build and archive your app for TestFlight without the configuration error

## What Changed in Your App Configuration

We've made the following updates to prepare your app for the App Store:

1. Changed the app display name from "Spousey" to "Spouseyv1" in:
   - `capacitor.config.json`
   - `ios/App/App/capacitor.config.json`
   - `ios/App/App/Info.plist`

2. Verified the Bundle ID is correctly set to "com.spousey.app"

3. Updated the app icon to use your official Spousey heart logo

4. Added iOS-specific configuration settings in capacitor.config.json for better mobile experience

## Manual Steps (If Automated Script Fails)

If the automated script doesn't work, follow these manual steps:

1. Install or update CocoaPods:
   ```bash
   sudo gem install cocoapods
   ```

2. Navigate to the iOS App directory:
   ```bash
   cd /path/to/your/project/ios/App
   ```

3. Clean the existing Pods installation:
   ```bash
   rm -rf Pods
   rm Podfile.lock
   ```

4. Update CocoaPods repo and install:
   ```bash
   pod repo update
   pod install
   ```

5. Open the workspace (not the project):
   ```bash
   open App.xcworkspace
   ```

## Common Issues and Solutions

- **Xcode Command Line Tools**: Make sure they're installed and up to date
  ```bash
  xcode-select --install
  ```

- **CocoaPods Version**: Sometimes using an older or newer version can help
  ```bash
  sudo gem install cocoapods -v 1.11.3
  ```

- **Clean Build Folder**: In Xcode, select "Product" > "Clean Build Folder" (Shift+Cmd+K)

- **Reset Xcode**: Sometimes a simple restart of Xcode can fix issues
