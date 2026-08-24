/**
 * Device and Platform Detection Utility for PWA & Web Share Target
 */

export type DeviceOS = 'ios' | 'android' | 'desktop';

/**
 * Detect the current operating system accurately
 * Covers iOS (iPhone, iPod, iPad including iPadOS Safari) and Android
 */
export function getDeviceOS(): DeviceOS {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'desktop';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';

  // 1. iOS detection (iPhone, iPod, and iPad with desktop-class browsing)
  const isIOSDevice =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOSDevice) {
    return 'ios';
  }

  // 2. Android detection
  if (/android/i.test(userAgent)) {
    return 'android';
  }

  // 3. Desktop / Others
  return 'desktop';
}

/**
 * Check if the app is currently running in standalone PWA mode (installed to home screen)
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false;

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');

  return isStandalone;
}
