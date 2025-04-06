import { Capacitor } from '@capacitor/core';

/**
 * Helper functions for Capacitor integration
 */

/**
 * Check if the app is running on a native platform via Capacitor
 */
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Get the current platform name
 * @returns 'ios', 'android', or 'web'
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};

/**
 * Check if the app is running on iOS
 */
export const isIOS = (): boolean => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Check if the app is running on Android
 */
export const isAndroid = (): boolean => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if the app is running in a web browser
 */
export const isWeb = (): boolean => {
  return Capacitor.getPlatform() === 'web';
};

/**
 * Open a URL in the appropriate app-specific browser
 * @param url The URL to open
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url });
};

/**
 * Use appropriate navigation based on platform
 * For web: use standard navigation
 * For native: use appropriate platform navigation
 * @param path The path to navigate to
 */
export const navigatePlatformAware = (path: string, setLocation: (path: string) => void) => {
  if (isNativePlatform()) {
    // In native apps, just use the router's navigation
    setLocation(path);
  } else {
    // In web, use standard navigation
    setLocation(path);
  }
};