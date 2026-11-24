import type { AppLanguage } from './i18n';

export type PublishedSeoLanguage = 'en' | 'bn' | 'my' | 'zh-CN';

export interface PublishedLocaleConfig {
  code: PublishedSeoLanguage;
  /** URL path prefix without trailing slash. Empty string for default locale (en). */
  prefix: '' | '/bn' | '/my' | '/zh-hans';
  /** First path segment (lowercase), empty for default locale. */
  segment: '' | 'bn' | 'my' | 'zh-hans';
  /** Valid BCP-47 tag for <html lang="..."> */
  htmlLang: 'en' | 'bn' | 'my' | 'zh-Hans';
  /** Valid BCP-47 tag for <link rel="alternate" hreflang="..."> */
  hreflang: 'en' | 'bn' | 'my' | 'zh-Hans';
  /** Open Graph locale tag */
  ogLocale: 'en_US' | 'bn_BD' | 'my_MM' | 'zh_CN';
  /** Native display label */
  label: string;
  /** English display name */
  englishName: string;
  isDefault: boolean;
}

export const PUBLISHED_SEO_LOCALES: readonly PublishedLocaleConfig[] = [
  {
    code: 'en',
    prefix: '',
    segment: '',
    htmlLang: 'en',
    hreflang: 'en',
    ogLocale: 'en_US',
    label: 'English',
    englishName: 'English',
    isDefault: true,
  },
  {
    code: 'bn',
    prefix: '/bn',
    segment: 'bn',
    htmlLang: 'bn',
    hreflang: 'bn',
    ogLocale: 'bn_BD',
    label: 'বাংলা',
    englishName: 'Bangla',
    isDefault: false,
  },
  {
    code: 'my',
    prefix: '/my',
    segment: 'my',
    htmlLang: 'my',
    hreflang: 'my',
    ogLocale: 'my_MM',
    label: 'မြန်မာ',
    englishName: 'Burmese',
    isDefault: false,
  },
  {
    code: 'zh-CN',
    prefix: '/zh-hans',
    segment: 'zh-hans',
    htmlLang: 'zh-Hans',
    hreflang: 'zh-Hans',
    ogLocale: 'zh_CN',
    label: '中文 (简体)',
    englishName: 'Chinese (Simplified)',
    isDefault: false,
  },
] as const;

export const PUBLISHED_LOCALE_BY_CODE: Record<PublishedSeoLanguage, PublishedLocaleConfig> = {
  en: PUBLISHED_SEO_LOCALES[0],
  bn: PUBLISHED_SEO_LOCALES[1],
  my: PUBLISHED_SEO_LOCALES[2],
  'zh-CN': PUBLISHED_SEO_LOCALES[3],
};

export function isPublishedSeoLanguage(lang?: string | null): lang is PublishedSeoLanguage {
  return lang === 'en' || lang === 'bn' || lang === 'my' || lang === 'zh-CN';
}

export function getPublishedLocaleConfig(lang?: string | null): PublishedLocaleConfig {
  if (lang && isPublishedSeoLanguage(lang)) {
    return PUBLISHED_LOCALE_BY_CODE[lang];
  }
  return PUBLISHED_LOCALE_BY_CODE.en;
}

export interface ParsedLocalePath {
  /** Resolved published SEO language for this URL */
  locale: PublishedSeoLanguage;
  /** Published locale metadata */
  localeConfig: PublishedLocaleConfig;
  /** Locale URL prefix ('', '/bn', '/my', '/zh-hans') */
  prefix: '' | '/bn' | '/my' | '/zh-hans';
  /** Route path without locale prefix, always starting with '/' (e.g. '/', '/rental', '/Legal/rental-policy') */
  basePath: string;
  /** True when the URL contained an explicit locale prefix segment */
  hasExplicitPrefix: boolean;
  /** Present when the incoming URL should 301-redirect to a canonical locale URL (e.g. /en -> /, /zh-cn -> /zh-hans) */
  canonicalRedirectPath?: string;
}

/**
 * Parses a URL pathname into its published locale and locale-stripped base path.
 * Never inspects IP geolocation; URL alone controls the locale route.
 */
export function parseLocalePath(pathnameInput?: string | null): ParsedLocalePath {
  const cleanRaw = (pathnameInput || '/').split('?')[0].split('#')[0] || '/';
  const normalizedSlash = cleanRaw.startsWith('/') ? cleanRaw : `/${cleanRaw}`;
  const withoutTrailing =
    normalizedSlash.length > 1 ? normalizedSlash.replace(/\/+$/, '') : '/';

  const parts = withoutTrailing.split('/').filter(Boolean);
  const firstSegmentRaw = parts[0] || '';
  const firstSegment = firstSegmentRaw.toLowerCase();
  const restPath = parts.length > 1 ? `/${parts.slice(1).join('/')}` : '/';

  if (firstSegment === 'bn') {
    const config = PUBLISHED_LOCALE_BY_CODE.bn;
    const canonical = restPath === '/' ? '/bn' : `/bn${restPath}`;
    return {
      locale: 'bn',
      localeConfig: config,
      prefix: '/bn',
      basePath: restPath,
      hasExplicitPrefix: true,
      ...(firstSegmentRaw !== 'bn' ? { canonicalRedirectPath: canonical } : {}),
    };
  }

  if (firstSegment === 'my') {
    const config = PUBLISHED_LOCALE_BY_CODE.my;
    const canonical = restPath === '/' ? '/my' : `/my${restPath}`;
    return {
      locale: 'my',
      localeConfig: config,
      prefix: '/my',
      basePath: restPath,
      hasExplicitPrefix: true,
      ...(firstSegmentRaw !== 'my' ? { canonicalRedirectPath: canonical } : {}),
    };
  }

  if (firstSegment === 'zh-hans' || firstSegment === 'zh-cn' || firstSegment === 'zh') {
    const config = PUBLISHED_LOCALE_BY_CODE['zh-CN'];
    const canonical = restPath === '/' ? '/zh-hans' : `/zh-hans${restPath}`;
    const needsRedirect = firstSegmentRaw !== 'zh-hans';
    return {
      locale: 'zh-CN',
      localeConfig: config,
      prefix: '/zh-hans',
      basePath: restPath,
      hasExplicitPrefix: true,
      ...(needsRedirect ? { canonicalRedirectPath: canonical } : {}),
    };
  }

  if (firstSegment === 'en') {
    const config = PUBLISHED_LOCALE_BY_CODE.en;
    return {
      locale: 'en',
      localeConfig: config,
      prefix: '',
      basePath: restPath,
      hasExplicitPrefix: true,
      canonicalRedirectPath: restPath,
    };
  }

  return {
    locale: 'en',
    localeConfig: PUBLISHED_LOCALE_BY_CODE.en,
    prefix: '',
    basePath: withoutTrailing,
    hasExplicitPrefix: false,
  };
}

/**
 * Strips any locale prefix from a path and returns the canonical route path for the target language.
 * Private/admin/API routes are never locale-prefixed.
 */
export function buildLocalePath(pathInput: string, targetLang: AppLanguage | string): string {
  const { basePath } = parseLocalePath(pathInput);
  const lower = basePath.toLowerCase();

  if (
    lower.startsWith('/admin') ||
    lower.startsWith('/api/') ||
    lower.startsWith('/assets/')
  ) {
    return basePath;
  }

  const config = getPublishedLocaleConfig(targetLang);
  if (!config.prefix) {
    return basePath === '' ? '/' : basePath;
  }
  return basePath === '/' ? config.prefix : `${config.prefix}${basePath}`;
}

/**
 * Returns true for private, account, admin, checkout, and utility paths
 * that must remain out of the XML sitemap and be marked noindex.
 */
export function isPrivateOrNonIndexablePath(pathnameInput?: string | null): boolean {
  const { basePath } = parseLocalePath(pathnameInput);
  const lower = basePath.toLowerCase();

  const exactNonIndexable = new Set([
    '/admin',
    '/account',
    '/profile',
    '/cart',
    '/checkout',
    '/single-checkout',
    '/promo',
    '/promos',
    '/login',
    '/register',
    '/delete-data',
    '/data-deletion-request',
    '/unsubscribe',
    '/track',
    '/dslink-portal',
    '/warranty-claim',
    '/refund-claim',
    '/reseller',
    '/reseller/portal',
    '/reseller/dashboard',
    '/reseller/login',
    '/reseller/register',
    '/reseller/reset-password',
    '/reseller/confirmation',
    '/resell/confirmation',
  ]);

  if (exactNonIndexable.has(lower)) return true;

  const prefixNonIndexable = [
    '/admin/',
    '/account/',
    '/checkout/',
    '/order-success/',
    '/invoice/',
    '/track/',
    '/promo/',
    '/api/',
    '/reseller/',
    '/resell/confirmation/',
  ];

  return prefixNonIndexable.some((p) => lower.startsWith(p));
}
