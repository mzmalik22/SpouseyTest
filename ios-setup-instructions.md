# iOS Build Setup Instructions

After downloading the project from Replit to your local Mac, follow these steps to fix the CocoaPods configuration issue:

## Step 1: Install CocoaPods (if not already installed)

Open Terminal and run:

```bash
sudo gem install cocoapods
```

If you already have CocoaPods installed, you can update it with:

```bash
sudo gem update cocoapods
```

## Step 2: Navigate to the iOS App directory

```bash
cd /path/to/your/project/ios/App
```

Replace `/path/to/your/project` with the actual path where you've downloaded the project.

## Step 3: Update and install Pods

Run these commands one by one:

```bash
pod repo update
pod install
```

This will:
1. Update your local CocoaPods repository
2. Install all the required dependencies for the project

## Step 4: Open the workspace (not the project)

After running `pod install`, a new `.xcworkspace` file will be created. Always open this workspace file, not the `.xcodeproj` file:

```bash
open App.xcworkspace
```

## Step 5: Build and run

Now you should be able to build and run the project without the configuration error.

## Troubleshooting

If you still see the error, try these steps:

1. Clean the build folder in Xcode:
   - Select "Product" > "Clean Build Folder" (or press Shift+Cmd+K)

2. Delete the Derived Data:
   - Select "Xcode" > "Preferences" > "Locations"
   - Click the small arrow next to the Derived Data path
   - Delete the folder for your project

3. If issues persist, try deleting the Pods folder and Podfile.lock:
   ```bash
   rm -rf Pods
   rm Podfile.lock
   pod install
   ```

4. Make sure your Xcode command-line tools are up to date:
   ```bash
   xcode-select --install
   ```
