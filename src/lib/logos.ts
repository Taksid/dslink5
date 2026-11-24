/**
 * Logo.dev API Integration with Session & LocalStorage Caching Mechanism
 * Public token: pk_VAkAzG28Qve-BdlRPZDa6Q
 * Docs: https://logo.dev
 */

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const LOGO_DEV_PUBLIC_KEY =
  (metaEnv && (metaEnv.VITE_LOGO_DEV_PUBLIC_KEY || metaEnv.LOGO_DEV_PUBLIC_KEY)) ||
  'pk_VAkAzG28Qve-BdlRPZDa6Q';
const LOCAL_STORAGE_CACHE_KEY = 'dslink_logo_cache_v1';

export interface LogoOptions {
  size?: number;
  format?: 'png' | 'jpg' | 'webp';
  theme?: 'dark' | 'light';
  retina?: boolean;
  greyscale?: boolean;
  fallback?: 'monogram' | '404';
}

interface LogoCacheEntry {
  url: string;
  status: 'loaded' | 'failed';
  timestamp: number;
}

// Fast In-Memory Cache Map
const memoryLogoCache = new Map<string, LogoCacheEntry>();

// Read initial persistent cache from localStorage
function loadCacheFromStorage(): Record<string, LogoCacheEntry> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// Write cache update to localStorage
function saveCacheToStorage(cache: Record<string, LogoCacheEntry>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore quota / private browsing errors
  }
}

// Bootstrap memory cache from storage
if (typeof window !== 'undefined') {
  const stored = loadCacheFromStorage();
  Object.entries(stored).forEach(([key, val]) => {
    memoryLogoCache.set(key, val);
  });
}

/**
 * Check if a logo URL is cached as failed to avoid redundant network attempts
 */
export function isLogoFailed(url: string): boolean {
  if (!url) return true;
  const entry = memoryLogoCache.get(url);
  return entry?.status === 'failed';
}

/**
 * Check if a logo URL is cached as successfully loaded
 */
export function isLogoLoaded(url: string): boolean {
  if (!url) return false;
  const entry = memoryLogoCache.get(url);
  return entry?.status === 'loaded';
}

/**
 * Record logo load status into both memory and persistent storage
 */
export function recordLogoStatus(url: string, status: 'loaded' | 'failed') {
  if (!url) return;
  const entry: LogoCacheEntry = {
    url,
    status,
    timestamp: Date.now()
  };
  memoryLogoCache.set(url, entry);

  if (typeof window !== 'undefined') {
    const stored = loadCacheFromStorage();
    stored[url] = entry;
    saveCacheToStorage(stored);
  }
}

/**
 * Returns a high-res Logo.dev CDN image URL for any brand domain
 */
export function getLogoDevUrl(domain: string, options: LogoOptions = {}): string {
  const {
    size = 256,
    format = 'png',
    theme = 'dark',
    retina = true,
    fallback = 'monogram'
  } = options;

  const params = new URLSearchParams();
  params.set('token', LOGO_DEV_PUBLIC_KEY);
  if (size) params.set('size', size.toString());
  if (format) params.set('format', format);
  if (theme) params.set('theme', theme);
  if (retina) params.set('retina', 'true');
  if (fallback) params.set('fallback', fallback);

  return `https://img.logo.dev/${domain}?${params.toString()}`;
}

/**
 * Background Preloader for Logo.dev URLs to warm browser disk & memory cache
 */
export function preloadLogo(url: string): Promise<boolean> {
  if (!url || typeof window === 'undefined') return Promise.resolve(false);

  const existing = memoryLogoCache.get(url);
  if (existing) {
    return Promise.resolve(existing.status === 'loaded');
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      recordLogoStatus(url, 'loaded');
      resolve(true);
    };
    img.onerror = () => {
      recordLogoStatus(url, 'failed');
      resolve(false);
    };
  });
}

// Official brand logos from Logo.dev API
export const STARLINK_LOGO_URL = getLogoDevUrl('starlink.com', { size: 300, format: 'png', theme: 'dark' });
export const SPACEX_LOGO_URL = getLogoDevUrl('spacex.com', { size: 300, format: 'png', theme: 'dark' });

// Official Brand Header/Footer Wordmark Logo (Transparent Background — matches any dark/light header color seamlessly)
export const OFFICIAL_HEADER_LOGO_URL = '/devspark-header-logo.svg';
export const OFFICIAL_HEADER_LOGO_LIGHT_URL = '/devspark-header-logo-light.svg';
export const OFFICIAL_BRAND_LOGO_URL = OFFICIAL_HEADER_LOGO_URL;
export const APP_LOGO_URL = OFFICIAL_HEADER_LOGO_URL;
export const DSLINK_LOGO_TRANSPARENT = OFFICIAL_HEADER_LOGO_URL;
export const DSLINK_LOGO_LIGHT = OFFICIAL_HEADER_LOGO_LIGHT_URL;
export const DSLINK_LOGO_PNG = OFFICIAL_HEADER_LOGO_URL;
export const DSLINK_LOGO_LIGHT_PNG = OFFICIAL_HEADER_LOGO_LIGHT_URL;
export const DSLINK_LOGO_BLACK_BG = OFFICIAL_HEADER_LOGO_URL;

// Mobile Financial Services (MFS) Logos in Bangladesh (Logo.dev)
export const BKASH_LOGO_URL = getLogoDevUrl('bkash.com', { size: 160, format: 'png' });
export const NAGAD_LOGO_URL = getLogoDevUrl('nagad.com.bd', { size: 160, format: 'png' });
export const ROCKET_LOGO_URL = getLogoDevUrl('dutchbanglabank.com', { size: 160, format: 'png' });
export const UPAY_LOGO_URL = getLogoDevUrl('upaybd.com', { size: 160, format: 'png' });

// Card & Gateway Logos (Logo.dev)
export const VISA_LOGO_URL = getLogoDevUrl('visa.com', { size: 160, format: 'png' });
export const MASTERCARD_LOGO_URL = getLogoDevUrl('mastercard.com', { size: 160, format: 'png' });
export const AMEX_LOGO_URL = getLogoDevUrl('americanexpress.com', { size: 160, format: 'png' });
export const SSLCOMMERZ_LOGO_URL = getLogoDevUrl('sslcommerz.com', { size: 160, format: 'png' });

// Major Bank Logos (Logo.dev)
export const CITY_BANK_LOGO_URL = getLogoDevUrl('thecitybank.com', { size: 160, format: 'png' });
export const BRAC_BANK_LOGO_URL = getLogoDevUrl('bracbank.com', { size: 160, format: 'png' });
export const ISLAMI_BANK_LOGO_URL = getLogoDevUrl('islamibankbd.com', { size: 160, format: 'png' });
export const EBL_BANK_LOGO_URL = getLogoDevUrl('ebl.com.bd', { size: 160, format: 'png' });

// Delivery Courier Partner Logos (Logo.dev)
export const PATHAO_LOGO_URL = getLogoDevUrl('pathao.com', { size: 160, format: 'png' });
export const REDX_LOGO_URL = getLogoDevUrl('redx.com.bd', { size: 160, format: 'png' });
export const STEADFAST_LOGO_URL = getLogoDevUrl('steadfast.com.bd', { size: 160, format: 'png' });
export const DHL_LOGO_URL = getLogoDevUrl('dhl.com', { size: 160, format: 'png' });
export const FEDEX_LOGO_URL = getLogoDevUrl('fedex.com', { size: 160, format: 'png' });

/**
 * Preload all common MFS, Bank, and Gateway logos into browser cache on startup
 */
export function warmPaymentLogoCache() {
  if (typeof window === 'undefined') return;
  const targets = [
    BKASH_LOGO_URL,
    NAGAD_LOGO_URL,
    ROCKET_LOGO_URL,
    UPAY_LOGO_URL,
    VISA_LOGO_URL,
    MASTERCARD_LOGO_URL,
    SSLCOMMERZ_LOGO_URL,
    BRAC_BANK_LOGO_URL,
    CITY_BANK_LOGO_URL,
    ISLAMI_BANK_LOGO_URL,
    STARLINK_LOGO_URL
  ];

  setTimeout(() => {
    targets.forEach((url) => preloadLogo(url));
  }, 300);
}

// Auto-warm logo cache when module is imported
warmPaymentLogoCache();
