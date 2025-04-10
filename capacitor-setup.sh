#!/bin/bash

# Available commands:
# ./capacitor-setup.sh init - Initialize Capacitor
# ./capacitor-setup.sh add-android - Add Android platform
# ./capacitor-setup.sh add-ios - Add iOS platform
# ./capacitor-setup.sh sync - Sync capacitor with web build
# ./capacitor-setup.sh open-android - Open Android project
# ./capacitor-setup.sh open-ios - Open iOS project

# Check if a command was provided
if [ $# -eq 0 ]; then
  echo "Usage: ./capacitor-setup.sh [command]"
  echo "Available commands: init, add-android, add-ios, sync, open-android, open-ios"
  exit 1
fi

COMMAND=$1

case $COMMAND in
  init)
    echo "Initializing Capacitor..."
    npx cap init Spousey com.spousey.app --web-dir=dist
    ;;
  add-android)
    echo "Adding Android platform..."
    npx cap add android
    ;;
  add-ios)
    echo "Adding iOS platform..."
    npx cap add ios
    ;;
  sync)
    echo "Syncing Capacitor with web build..."
    npm run build
    npx cap sync
    ;;
  open-android)
    echo "Opening Android project..."
    npx cap open android
    ;;
  open-ios)
    echo "Opening iOS project..."
    npx cap open ios
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Available commands: init, add-android, add-ios, sync, open-android, open-ios"
    exit 1
    ;;
esac
