import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithRelatedApps extends Navigator {
  standalone?: boolean;
  getInstalledRelatedApps?: () => Promise<Array<{ id?: string; platform?: string; url?: string }>>;
}

// Module-level store so an early `beforeinstallprompt` event fired before component mount
// or across route transitions is never missed.
let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let sharedInstalled = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function detectStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = window.navigator as NavigatorWithRelatedApps;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    nav.standalone === true ||
    (typeof document !== 'undefined' && document.referrer.startsWith('android-app://'))
  );
}

let globalListenersAttached = false;

function ensureGlobalPWAListeners() {
  if (typeof window === 'undefined' || globalListenersAttached) return;
  globalListenersAttached = true;

  sharedInstalled = detectStandaloneDisplay();

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    sharedInstalled = false;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    sharedInstalled = true;
    sharedDeferredPrompt = null;
    notifyListeners();
  });

  const standaloneMedia = window.matchMedia('(display-mode: standalone)');
  const onDisplayModeChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      sharedInstalled = true;
      sharedDeferredPrompt = null;
      notifyListeners();
    }
  };
  if (typeof standaloneMedia.addEventListener === 'function') {
    standaloneMedia.addEventListener('change', onDisplayModeChange);
  }

  // Chromium / Android related-app detection (checks if PWA is already installed on device)
  const nav = window.navigator as NavigatorWithRelatedApps;
  if (typeof nav.getInstalledRelatedApps === 'function') {
    nav
      .getInstalledRelatedApps()
      .then((apps) => {
        if (Array.isArray(apps) && apps.length > 0) {
          sharedInstalled = true;
          sharedDeferredPrompt = null;
          notifyListeners();
        }
      })
      .catch(() => {});
  }
}

if (typeof window !== 'undefined') {
  ensureGlobalPWAListeners();
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => sharedDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(
    () => sharedInstalled || detectStandaloneDisplay()
  );
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    ensureGlobalPWAListeners();

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);

    const sync = () => {
      setDeferredPrompt(sharedDeferredPrompt);
      setIsInstalled(sharedInstalled || detectStandaloneDisplay());
    };

    sync();
    listeners.add(sync);
    return () => {
      listeners.delete(sync);
    };
  }, []);

  const install = async () => {
    const promptEvent = sharedDeferredPrompt || deferredPrompt;
    if (!promptEvent || isInstalling) return false;
    setIsInstalling(true);
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      if (outcome === 'accepted') {
        sharedInstalled = true;
        sharedDeferredPrompt = null;
        notifyListeners();
        return true;
      }
      return false;
    } finally {
      setIsInstalling(false);
    }
  };

  return {
    isInstallable: Boolean(deferredPrompt) && !isInstalled,
    isInstalled,
    isIOS: isIOS && !isInstalled,
    isInstalling,
    canPromptInstall: !isInstalled && (Boolean(deferredPrompt) || isIOS),
    install,
  };
}
