import { useEffect, useState, useCallback } from 'react';
import {
  AppLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  TranslationKey,
  detectLanguageFromBrowserList,
  detectLanguageFromCountry,
  normalizeAppLanguage,
  resolveLanguageAndCurrency,
  translateKey,
} from './i18n';
import {
  buildLocalePath,
  getPublishedLocaleConfig,
  isPublishedSeoLanguage,
  parseLocalePath,
} from './localeRouting';
import { normalizeValidIsoCountry } from './heroGeoCopy';
import { applyIpSuggestedCurrency } from './currencyConfig';
import { translateUiPhrase } from './globalTranslator';

export {
  type AppLanguage,
  type TranslationKey,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  detectLanguageFromCountry,
  detectLanguageFromBrowserList,
  normalizeAppLanguage,
  resolveLanguageAndCurrency,
  translateKey,
};

export interface GeoInfo {
  countryCode: string | null;
  source: string;
}

export const LANG_STORAGE_KEY = 'dslink_lang';
export const LANG_MANUAL_KEY = 'dslink_lang_manual';
export const LANG_ACCOUNT_KEY = 'dslink_account_lang';
export const GEO_CACHE_KEY = 'dslink_visitor_country_v3';
export const LANG_CHANGE_EVENT = 'dslink-language-change';
export const VISITOR_COUNTRY_EVENT = 'dslink-visitor-country-change';

function getHtmlLangForAppLanguage(lang: AppLanguage): string {
  if (isPublishedSeoLanguage(lang)) {
    return getPublishedLocaleConfig(lang).htmlLang;
  }
  return lang;
}

function hasExplicitCountryQuery(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).has('country');
  } catch {
    return false;
  }
}

/**
 * Fallback Bangladesh signal for dev/preview environments where edge geo headers
 * (cf-ipcountry / x-vercel-ip-country) are absent.
 */
export function isLikelyBangladeshBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz === 'Asia/Dhaka' || tz === 'Asia/Dacca') {
      return true;
    }
  } catch {
    // ignore
  }
  try {
    const langs =
      Array.isArray(navigator.languages) && navigator.languages.length > 0
        ? navigator.languages
        : navigator.language
          ? [navigator.language]
          : [];
    return langs.some((l) => /^bn(?:-|$)/i.test(String(l || '').trim()));
  } catch {
    return false;
  }
}

/**
 * Resolves the visitor's preferred language from their detected country code.
 * Maps every country to its corresponding supported language (e.g., BD -> bn, MM -> my,
 * CN -> zh-CN, HK/TW/MO -> zh-TW, TH -> th, KR -> ko, JP -> ja, IN -> hi, RU/BY/KZ -> ru,
 * UA -> uk, AE/SA/QA/KW/OM/BH/EG -> ar, FR/BE -> fr, DE/AT/CH -> de, ES/MX/AR/CO/CL -> es,
 * BR/PT -> pt, MY/BN -> ms, ID -> id, TR -> tr, IT -> it, VN -> vi, otherwise en).
 */
export function resolveVisitorAutoLanguage(countryCode: string | null): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  const parsed = parseLocalePath(window.location.pathname);
  // Explicit locale URL prefix (/bn, /my, /zh-hans, etc.) always determines language
  if (parsed.hasExplicitPrefix) return null;

  try {
    const params = new URLSearchParams(window.location.search);
    if (normalizeAppLanguage(params.get('lang'))) return null;
  } catch {
    // ignore
  }

  try {
    if (window.localStorage.getItem(LANG_MANUAL_KEY) === '1') {
      return null;
    }
  } catch {
    // ignore
  }

  if (countryCode) {
    return detectLanguageFromCountry(countryCode);
  }

  // Fallback for preview/dev environments where edge geo headers are unavailable
  if (!hasExplicitCountryQuery() && isLikelyBangladeshBrowser()) {
    return 'bn';
  }

  return null;
}

/**
 * Resolves the display language from the current URL, manual user selection,
 * and automatic visitor-country language detection on unprefixed routes
 * (without forcing a URL redirect or altering stable per-URL SEO metadata).
 *
 * Priority:
 * 1. Explicit published locale URL prefix (/bn, /my, /zh-hans)
 * 2. Explicit ?lang= query parameter (legacy links)
 * 3. Manual user selection (persisted across visits)
 * 4. Visitor's detected IP country language (e.g. BD -> bn, MM -> my, CN -> zh-CN, TH -> th, US -> en)
 * 5. Default to English ('en')
 */
export function getInitialLanguage(pathnameOverride?: string): AppLanguage {
  if (typeof window === 'undefined') {
    return parseLocalePath(pathnameOverride || '/').locale;
  }

  const pathname = pathnameOverride ?? window.location.pathname;
  const parsed = parseLocalePath(pathname);

  // 1. Explicit locale prefix in URL always wins
  if (parsed.hasExplicitPrefix) {
    return parsed.locale;
  }

  // 2. Legacy ?lang= query parameter
  try {
    const params = new URLSearchParams(window.location.search);
    const qLang = normalizeAppLanguage(params.get('lang'));
    if (qLang) return qLang;
  } catch {
    // ignore
  }

  // 3. Respect explicit manual selection on unprefixed URLs
  let isManual = false;
  try {
    isManual = window.localStorage.getItem(LANG_MANUAL_KEY) === '1';
    const stored = normalizeAppLanguage(window.localStorage.getItem(LANG_STORAGE_KEY));
    if (isManual && stored) {
      return stored;
    }
  } catch {
    // ignore
  }

  // 4. Automatically show the visitor's country language when no manual selection exists
  if (!isManual) {
    const initialGeo = getInitialVisitorCountry();
    const autoLang = resolveVisitorAutoLanguage(initialGeo.countryCode);
    if (autoLang) {
      return autoLang;
    }
  }

  return 'en';
}

export const getInitialLanguageSync = getInitialLanguage;

/**
 * Applies display language state without altering visitor country detection.
 * Optionally navigates to the equivalent localized URL when switching between published locales.
 */
export function applyGlobalLanguage(
  lang: AppLanguage,
  isManual = false,
  options?: { navigate?: boolean }
): void {
  if (typeof window === 'undefined') return;
  const normalized = normalizeAppLanguage(lang) || 'en';
  const meta = LANGUAGE_LABELS[normalized] || LANGUAGE_LABELS.en;
  const htmlLang = getHtmlLangForAppLanguage(normalized);

  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, normalized);
    if (isManual) {
      window.localStorage.setItem(LANG_MANUAL_KEY, '1');
    }
  } catch {
    // ignore
  }

  document.documentElement.lang = htmlLang;
  document.documentElement.dir = meta.dir;
  (window as any).__DSLINK_ACTIVE_LANG__ = normalized;

  if (options?.navigate) {
    const currentPath = window.location.pathname;
    const targetPath = isPublishedSeoLanguage(normalized)
      ? buildLocalePath(currentPath, normalized)
      : buildLocalePath(currentPath, 'en');

    // Preserve non-lang query params (such as ?country=MM during verification) while stripping ?lang=
    const params = new URLSearchParams(window.location.search);
    params.delete('lang');
    const qs = params.toString();
    const targetUrl = qs ? `${targetPath}?${qs}` : targetPath;
    const currentFull = `${window.location.pathname}${window.location.search}`;

    if (targetUrl !== currentFull) {
      window.history.pushState({}, '', targetUrl);
    }
  }

  // Dispatch language-change events first so React localeBase/language providers sync before popstate
  window.dispatchEvent(new CustomEvent(LANG_CHANGE_EVENT, { detail: normalized }));
  window.dispatchEvent(
    new CustomEvent('dslink-lang-change', { detail: { language: normalized } })
  );
  if (options?.navigate) {
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/**
 * Reads initial visitor country synchronously from server-injected bootstrap data or query simulation.
 * Country-level only; never reads or stores raw IP addresses.
 */
export function getInitialVisitorCountry(): GeoInfo {
  if (typeof window === 'undefined') {
    return { countryCode: null, source: 'ssr_default' };
  }

  // Dev/preview query simulation (?country=MM) overrides cached value for testing
  try {
    const params = new URLSearchParams(window.location.search);
    const qCountry = params.get('country');
    if (qCountry !== null) {
      const valid = normalizeValidIsoCountry(qCountry);
      return {
        countryCode: valid,
        source: valid ? 'query_simulation' : 'query_invalid_default',
      };
    }
  } catch {
    // ignore
  }

  const ssrVisitor = (window as any).__VISITOR_COUNTRY__ as Partial<GeoInfo> | undefined;
  if (ssrVisitor && typeof ssrVisitor === 'object' && 'countryCode' in ssrVisitor) {
    return {
      countryCode: normalizeValidIsoCountry(ssrVisitor.countryCode || null),
      source: String(ssrVisitor.source || 'server_injected'),
    };
  }

  const legacyGeo = (window as any).__DETECTED_GEO__ as Partial<GeoInfo> | undefined;
  if (legacyGeo && typeof legacyGeo === 'object' && legacyGeo.countryCode) {
    return {
      countryCode: normalizeValidIsoCountry(legacyGeo.countryCode),
      source: String(legacyGeo.source || 'server_injected'),
    };
  }

  try {
    const cachedRaw = window.sessionStorage.getItem(GEO_CACHE_KEY);
    if (cachedRaw) {
      const parsed = JSON.parse(cachedRaw) as Partial<GeoInfo>;
      return {
        countryCode: normalizeValidIsoCountry(parsed?.countryCode || null),
        source: String(parsed?.source || 'session_cache'),
      };
    }
  } catch {
    // ignore
  }

  return { countryCode: null, source: 'pending' };
}

let inflightGeoPromise: Promise<GeoInfo> | null = null;

/**
 * Resolves visitor country code via server/edge /api/geo (country-level only, no raw IPs).
 * NEVER changes the display language or redirects the user to another locale URL.
 */
export async function fetchVisitorCountry(): Promise<GeoInfo> {
  if (typeof window === 'undefined') {
    return { countryCode: null, source: 'ssr_default' };
  }

  const publishCountry = (info: GeoInfo, shouldCache = true) => {
    (window as any).__VISITOR_COUNTRY__ = info;
    if (shouldCache) {
      try {
        window.sessionStorage.setItem(GEO_CACHE_KEY, JSON.stringify(info));
      } catch {
        // ignore
      }
    }
    if (info.countryCode) {
      applyIpSuggestedCurrency(info.countryCode);
    }
    const autoLang = resolveVisitorAutoLanguage(info.countryCode);
    if (autoLang && (window as any).__DSLINK_ACTIVE_LANG__ !== autoLang) {
      applyGlobalLanguage(autoLang, false, { navigate: false });
    }
    window.dispatchEvent(new CustomEvent(VISITOR_COUNTRY_EVENT, { detail: info }));
  };

  // Explicit ?country= query param for dev/preview verification
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('country')) {
      const rawParam = params.get('country') || '';
      const res = await fetch(`/api/geo?country=${encodeURIComponent(rawParam)}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        const info: GeoInfo = {
          countryCode: normalizeValidIsoCountry(data?.countryCode || null),
          source: String(data?.source || 'api_geo_query'),
        };
        publishCountry(info, false);
        return info;
      }
      const fallbackInfo: GeoInfo = {
        countryCode: normalizeValidIsoCountry(rawParam),
        source: 'query_fallback',
      };
      publishCountry(fallbackInfo, false);
      return fallbackInfo;
    }
  } catch {
    // Fall back gracefully without breaking page
  }

  // If the server already injected trusted edge/platform country data, use it directly
  const ssrVisitor = (window as any).__VISITOR_COUNTRY__ as Partial<GeoInfo> | undefined;
  if (
    ssrVisitor &&
    typeof ssrVisitor === 'object' &&
    typeof ssrVisitor.source === 'string' &&
    ssrVisitor.source !== 'pending' &&
    ssrVisitor.source !== 'static_fallback'
  ) {
    const info: GeoInfo = {
      countryCode: normalizeValidIsoCountry(ssrVisitor.countryCode || null),
      source: ssrVisitor.source,
    };
    publishCountry(info, true);
    return info;
  }

  if (inflightGeoPromise) return inflightGeoPromise;

  inflightGeoPromise = fetch('/api/geo', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) {
        const fallback: GeoInfo = { countryCode: null, source: 'lookup_http_error' };
        publishCountry(fallback, false);
        return fallback;
      }
      const data = await res.json();
      const info: GeoInfo = {
        countryCode: normalizeValidIsoCountry(data?.countryCode || null),
        source: String(data?.source || 'api_geo'),
      };
      publishCountry(info, true);
      return info;
    })
    .catch(() => {
      const fallback: GeoInfo = { countryCode: null, source: 'lookup_failed' };
      publishCountry(fallback, false);
      return fallback;
    })
    .finally(() => {
      inflightGeoPromise = null;
    });

  return inflightGeoPromise;
}

/**
 * Backward-compatible export name.
 * Fetches visitor country ONLY — never switches or forces the display language.
 */
export async function fetchAndApplyIpLanguage(): Promise<GeoInfo | null> {
  return fetchVisitorCountry();
}

if (typeof window !== 'undefined') {
  const initial = getInitialLanguage();
  const meta = LANGUAGE_LABELS[initial] || LANGUAGE_LABELS.en;
  document.documentElement.lang = getHtmlLangForAppLanguage(initial);
  document.documentElement.dir = meta.dir;
  (window as any).__DSLINK_ACTIVE_LANG__ = initial;
  (window as any).__DSLINK_I18N__ = {
    SUPPORTED_LANGUAGES,
    LANGUAGE_LABELS,
    getInitialLanguage,
    applyGlobalLanguage,
    translateKey,
  };
}

export function useVisitorCountry(): GeoInfo {
  const [geoInfo, setGeoInfo] = useState<GeoInfo>(() => getInitialVisitorCountry());

  useEffect(() => {
    let active = true;
    fetchVisitorCountry().then((info) => {
      if (active) setGeoInfo(info);
    });

    const onCountryChange = (ev: Event) => {
      const detail = (ev as CustomEvent<GeoInfo>).detail;
      if (detail && active) {
        setGeoInfo(detail);
      }
    };

    window.addEventListener(VISITOR_COUNTRY_EVENT, onCountryChange);
    return () => {
      active = false;
      window.removeEventListener(VISITOR_COUNTRY_EVENT, onCountryChange);
    };
  }, []);

  return geoInfo;
}

export function useGeoLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() => getInitialLanguage());
  const geoInfo = useVisitorCountry();

  useEffect(() => {
    const syncFromUrl = () => {
      const next = getInitialLanguage(window.location.pathname);
      setLanguageState(next);
      const meta = LANGUAGE_LABELS[next] || LANGUAGE_LABELS.en;
      document.documentElement.lang = getHtmlLangForAppLanguage(next);
      document.documentElement.dir = meta.dir;
      (window as any).__DSLINK_ACTIVE_LANG__ = next;
    };

    syncFromUrl();

    const onLangChange = (ev: Event) => {
      const detail = (ev as CustomEvent<any>).detail;
      const raw = typeof detail === 'string' ? detail : detail?.language;
      const next = normalizeAppLanguage(raw) || getInitialLanguage();
      setLanguageState(next);
    };

    window.addEventListener(LANG_CHANGE_EVENT, onLangChange);
    window.addEventListener('popstate', syncFromUrl);
    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, onLangChange);
      window.removeEventListener('popstate', syncFromUrl);
    };
  }, []);

  const setLanguage = useCallback((next: AppLanguage, navigate = true) => {
    const normalized = normalizeAppLanguage(next) || 'en';
    setLanguageState(normalized);
    applyGlobalLanguage(normalized, true, { navigate });
  }, []);

  /**
   * Multi-language translator for components (bn / my / en + zh-CN and global languages).
   */
  const t3 = useCallback(
    (bn: string, my: string, en: string, zh?: string) =>
      translateUiPhrase(language, bn, my, en, zh),
    [language]
  );

  const t = useCallback(
    (key: TranslationKey, fallback?: string) => translateKey(language, key, fallback),
    [language]
  );

  return {
    language,
    languageMeta: LANGUAGE_LABELS[language] || LANGUAGE_LABELS.en,
    dir: (LANGUAGE_LABELS[language]?.dir || 'ltr') as 'ltr' | 'rtl',
    setLanguage,
    geoInfo,
    visitorCountryCode: geoInfo.countryCode,
    t3,
    t,
  };
}
