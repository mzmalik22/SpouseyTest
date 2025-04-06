# Capacitor Integration for Spousey

This document provides instructions on how to use Capacitor to build native mobile apps from your Spousey web application.

## Prerequisites

- Node.js and npm
- For iOS: Mac with Xcode 14+
- For Android: Android Studio 2022+

## Getting Started

The following dependencies have been installed:
- @capacitor/core
- @capacitor/cli
- @capacitor/android
- @capacitor/ios

## Usage

### 1. Initialize Capacitor

First, initialize Capacitor in your project:

```bash
./capacitor-setup.sh init
```

This will create:
- `android` directory (if you add the Android platform)
- `ios` directory (if you add the iOS platform)

### 2. Add Platforms

To add Android:

```bash
./capacitor-setup.sh add-android
```

To add iOS:

```bash
./capacitor-setup.sh add-ios
```

### 3. Build and Sync

After making changes to your web app, build and sync:

```bash
./capacitor-setup.sh sync
```

This command will:
1. Build your web app (npm run build)
2. Copy the web assets to the native projects
3. Update the native configuration

### 4. Open Native Projects

To open Android Studio:

```bash
./capacitor-setup.sh open-android
```

To open Xcode:

```bash
./capacitor-setup.sh open-ios
```

## Code Integration

The integration with Capacitor is already set up in your project:

1. Added Capacitor initialization in `client/src/main.tsx`
2. Created a utilities file at `client/src/lib/capacitor.ts`

### Using Capacitor in Components

```typescript
import { isNativePlatform, isIOS, isAndroid, openExternalUrl } from '@/lib/capacitor';

// Check platform
if (isNativePlatform()) {
  console.log('Running in a native app');
}

// Platform-specific code
if (isIOS()) {
  // iOS-specific behavior
} else if (isAndroid()) {
  // Android-specific behavior
}

// Open external links
const handleOpenLink = async (url: string) => {
  await openExternalUrl(url);
};
```

## Configuration

Capacitor configuration is in `capacitor.config.ts` at the root of the project. You can modify this file to change:

- App ID
- App name
- Web directory
- Native plugins configuration
- Permissions
- Deep links

## Customizing Native Projects

After opening the native projects in their respective IDEs, you can:

1. Add native plugins
2. Customize app icons and splash screens
3. Configure permissions
4. Add native code
5. Configure signing for distribution

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)
