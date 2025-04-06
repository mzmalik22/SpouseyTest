import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Capacitor imports
import { Capacitor } from '@capacitor/core';

// Define a global for platform detection
declare global {
  interface Window {
    isMobileApp: boolean;
  }
}

// Set the flag based on whether the app is running in Capacitor
window.isMobileApp = Capacitor.isNativePlatform();

// Check if we're running in a native environment
if (window.isMobileApp) {
  console.log('Running in Capacitor native container');
  
  // You can add platform-specific initialization here
  document.addEventListener('deviceready', () => {
    console.log('Capacitor device is ready');
  }, false);
} else {
  console.log('Running in browser');
}

createRoot(document.getElementById("root")!).render(
  <App />
);
