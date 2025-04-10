#!/bin/bash

# Script to fix CocoaPods configuration issues
echo "Starting CocoaPods setup and repair..."

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo "CocoaPods not found. Installing CocoaPods..."
    sudo gem install cocoapods
else
    echo "CocoaPods is already installed."
    echo "Updating CocoaPods..."
    pod --version
    sudo gem update cocoapods
fi

# Update CocoaPods repo
echo "Updating CocoaPods repository..."
pod repo update

# Clean up any existing Pods installation
echo "Cleaning up existing Pods installation..."
if [ -d "Pods" ]; then
    rm -rf Pods
    echo "Removed Pods directory."
fi

if [ -f "Podfile.lock" ]; then
    rm Podfile.lock
    echo "Removed Podfile.lock."
fi

# Install Pods
echo "Installing Pods..."
pod install

# Check if workspace was created
if [ -d "App.xcworkspace" ]; then
    echo "---------------------------------------------"
    echo "Success! Pods have been installed properly."
    echo "Please open App.xcworkspace in Xcode instead of the .xcodeproj file."
    echo "You can do this by running: open App.xcworkspace"
    echo "---------------------------------------------"
else
    echo "Warning: App.xcworkspace wasn't created. There might still be issues."
    echo "Please check the output above for any errors."
fi

echo "Pod fix process complete."
