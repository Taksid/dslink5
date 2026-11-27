import { LEGAL_POLICIES, resolveLegalPolicyBySlug } from '../data/legalPolicies';
import {
  GENERAL_FAQ_ITEMS,
  RENTAL_FAQ_ITEMS,
  buildFaqPageJsonLd,
  getLocalizedFaqEntries,
} from '../data/rentalFaqData';
import { buildHreflangLinks, getLocalizedRouteSeo } from './multilingualSeo';
import {
  PUBLISHED_SEO_LOCALES,
  PublishedSeoLanguage,
  buildLocalePath,
  isKnownSiteRoute,
  parseLocalePath,
} from './localeRouting';
import { getHeroGeoCopy, normalizeValidIsoCountry } from './heroGeoCopy';
import {
  CORE_FEATURED_VARIANT_IDS,
  DEFAULT_CENTRAL_PRODUCTS,
  GLOBAL_DELIVERY_COPY,
  RENTAL_TERMS_SUMMARY,
  formatBdt,
} from './pricingConfig';

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type SupportedDomain = 'devsparksoft.com.bd' | 'dslink.cyou';

export interface DomainSeoConfig {
  domain: SupportedDomain;
  origin: string;
  brandName: string;
  legalName: string;
  title: string;
  description: string;
  keywords: string;
  h1En: string;
  h1Bn: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogSiteName: string;
  locale: string;
  alternateLocale: string;
  themeColor: string;
  phone: string;
  whatsappNumber: string;
  email: string;
  address: string;
  gscVerificationToken: string;
  jsonLd: Record<string, any>[];
}

export const GSC_VERIFICATION_CODE = 'google2d34e96e89254a29';
export const OFFICIAL_FAVICON_LOGO_URL = '/favicon-devspark.jpg';
export const OFFICIAL_HEADER_LOGO_URL = '/devspark-header-logo.svg';

export const DOMAIN_SEO_CONFIGS: Record<SupportedDomain, DomainSeoConfig> = {
  'devsparksoft.com.bd': {
    domain: 'devsparksoft.com.bd',
    origin: 'https://devsparksoft.com.bd',
    brandName: 'DEV SPARK SOFT LIMITED',
    legalName: 'DEV SPARK SOFT LIMITED',
    title: 'DEV SPARK SOFT LIMITED | DEVSPARK LINK & DSLINK — Starlink Kits, Enterprise Software & Telecom Bangladesh',
    description:
      'DEV SPARK SOFT LIMITED (devsparksoft.com.bd · Trade License DNCC/037306 · USA Alaska Entity #10237739) — Official operator of DEVSPARK LINK & DSLINK. Starlink Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 / BDT 21,500), and Standard 4X Rental (BDT 3,000 one-time fee; monthly plan separate).',
    keywords:
      'DEV SPARK SOFT LIMITED, DSLINK, DEVSPARK LINK, devsparksoft.com.bd, dslink.cyou, Starlink Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Mini Bangladesh, Starlink Rental Kit Bangladesh, Global Starlink Delivery, Enterprise Software Development Dhaka, RED POLICY ALERT Starlink, DNCC/037306, Alaska Entity 10237739',
    h1En: 'DEV SPARK SOFT LIMITED — Enterprise Software, Starlink Hardware & Telecom Infrastructure',
    h1Bn: 'ডেভ স্পার্ক সফট লিমিটেড (DEV SPARK SOFT LIMITED) — স্টারলিংক কিট, সফটওয়্যার ও টেলিকম সলিউশন',
    ogTitle: 'DEV SPARK SOFT LIMITED | DEVSPARK LINK & DSLINK Bangladesh',
    ogDescription:
      'Starlink Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 / BDT 21,500), and Standard 4X Rental (BDT 3,000 one-time fee) by DEV SPARK SOFT LIMITED.',
    ogImage: '/assets/marketing/dhaka-rooftop-hero-og.jpg',
    ogSiteName: 'DEV SPARK SOFT LIMITED — DEVSPARK LINK',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    themeColor: '#000000',
    phone: '+880 1326-370218',
    whatsappNumber: '+8801326370218',
    email: 'info@devsparksoft.com.bd',
    address: 'House 14, Road 7, Gulshan-1, Dhaka 1212, Bangladesh',
    gscVerificationToken: GSC_VERIFICATION_CODE,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://devsparksoft.com.bd/#organization',
        name: 'DEV SPARK SOFT LIMITED',
        legalName: 'DEV SPARK SOFT LIMITED',
        alternateName: ['DEVSPARK LINK', 'DSLINK'],
        url: 'https://devsparksoft.com.bd/',
        logo: OFFICIAL_FAVICON_LOGO_URL,
        image: OFFICIAL_FAVICON_LOGO_URL,
        taxID: 'DNCC/037306',
        identifier: [
          { '@type': 'PropertyValue', name: 'Bangladesh Trade License', value: 'DNCC/037306' },
          { '@type': 'PropertyValue', name: 'USA Registration', value: 'Alaska Entity #10237739' },
        ],
        description:
          'DEV SPARK SOFT LIMITED (operator of DEVSPARK LINK & DSLINK · Trade License DNCC/037306 · USA Alaska Entity #10237739) provides SpaceX Starlink hardware kits, transparent rental plans, enterprise software engineering, FinTech payment gateways, and telecom solutions in Bangladesh.',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'House 14, Road 7, Gulshan-1',
          addressLocality: 'Dhaka',
          postalCode: '1212',
          addressCountry: 'BD',
        },
        contactPoint: [
          {
            '@type': 'ContactPoint',
            telephone: '+880-1326-370218',
            email: 'info@devsparksoft.com.bd',
            contactType: 'customer support',
            areaServed: ['BD', 'MM', 'US'],
            availableLanguage: ['Bengali', 'Burmese', 'English'],
          },
          {
            '@type': 'ContactPoint',
            telephone: '+880-1326-370218',
            email: 'sales@devsparksoft.com.bd',
            contactType: 'sales',
            areaServed: ['BD', 'MM', 'US'],
            availableLanguage: ['Bengali', 'Burmese', 'English'],
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://devsparksoft.com.bd/#website',
        url: 'https://devsparksoft.com.bd/',
        name: 'DEV SPARK SOFT LIMITED — DEVSPARK LINK & DSLINK',
        publisher: {
          '@id': 'https://devsparksoft.com.bd/#organization',
        },
        inLanguage: ['bn-BD', 'my-MM', 'en-US'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ProfessionalService',
        '@id': 'https://devsparksoft.com.bd/#service',
        name: 'DEV SPARK SOFT LIMITED — DEVSPARK LINK & DSLINK',
        url: 'https://devsparksoft.com.bd/',
        image: OFFICIAL_FAVICON_LOGO_URL,
        telephone: '+880-1326-370218',
        priceRange: '৳৳৳',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'House 14, Road 7, Gulshan-1',
          addressLocality: 'Dhaka',
          postalCode: '1212',
          addressCountry: 'BD',
        },
        areaServed: [
          { '@type': 'Country', name: 'Bangladesh' },
          { '@type': 'Country', name: 'Myanmar' },
          { '@type': 'Country', name: 'United States' },
        ],
      },
    ],
  },
  'dslink.cyou': {
    domain: 'dslink.cyou',
    origin: 'https://dslink.cyou',
    brandName: 'DSLINK — DEVSPARK LINK',
    legalName: 'DEV SPARK SOFT LIMITED (DSLINK)',
    title: 'DSLINK (DEVSPARK LINK) — DEV SPARK SOFT LIMITED | Official Starlink Kit Sales & Satellite Internet BD',
    description:
      'Global Delivery Available — Worldwide Starlink Kit Shipping from DSLINK (DEV SPARK SOFT LIMITED). Starlink Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 / BDT 21,500), and Standard 4X Rental (BDT 3,000 one-time fee). Monthly Starlink subscription fees are separate.',
    keywords:
      'DSLINK, DEVSPARK LINK, DEV SPARK SOFT LIMITED, dslink.cyou, devsparksoft.com.bd, Starlink Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Mini Bangladesh, Starlink Rental Kit Bangladesh, Global Starlink Delivery, Satellite Internet Bangladesh, Buy Starlink Kit Dhaka',
    h1En: 'SpaceX Starlink Satellite Kits, Pricing & Global Delivery — DSLink',
    h1Bn: 'বাংলাদেশসহ বিশ্বব্যাপী Starlink Kit ডেলিভারি, সাশ্রয়ী প্রাইসিং ও টেকনিক্যাল সাপোর্ট',
    ogTitle: 'DSLINK (DEVSPARK LINK) — DEV SPARK SOFT LIMITED | Official Starlink Standard 4X & Mini Kit',
    ogDescription:
      'Order Starlink Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 / BDT 21,500), or Standard 4X Rental (BDT 3,000 one-time fee) from DSLINK / DEVSPARK LINK.',
    ogImage: '/assets/marketing/dhaka-rooftop-hero-og.jpg',
    ogSiteName: 'DSLINK — DEVSPARK LINK (DEV SPARK SOFT LIMITED)',
    locale: 'en_US',
    alternateLocale: 'bn_BD',
    themeColor: '#000000',
    phone: '+880 1326-370218',
    whatsappNumber: '+8801326370218',
    email: 'support@dslink.cyou',
    address: 'Level 4, Gulshan Avenue, Dhaka 1212, Bangladesh',
    gscVerificationToken: GSC_VERIFICATION_CODE,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://dslink.cyou/#organization',
        name: 'DSLINK — DEVSPARK LINK (DEV SPARK SOFT LIMITED)',
        legalName: 'DEV SPARK SOFT LIMITED',
        alternateName: ['DSLINK', 'DEVSPARK LINK', 'DEV SPARK SOFT LIMITED'],
        url: 'https://dslink.cyou/',
        logo: OFFICIAL_FAVICON_LOGO_URL,
        image: OFFICIAL_FAVICON_LOGO_URL,
        description:
          'Dedicated Starlink hardware distribution, satellite broadband plans, rooftop alignment, and enterprise internet solutions across all 64 districts of Bangladesh by DSLINK / DEVSPARK LINK (DEV SPARK SOFT LIMITED).',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+880-1326-370218',
          contactType: 'sales',
          areaServed: ['BD', 'MM', 'US'],
          availableLanguage: ['Bengali', 'Burmese', 'English'],
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://dslink.cyou/#website',
        url: 'https://dslink.cyou/',
        name: 'DSLINK (DEVSPARK LINK) — DEV SPARK SOFT LIMITED',
        publisher: {
          '@id': 'https://dslink.cyou/#organization',
        },
        inLanguage: ['en', 'bn', 'my', 'zh-Hans'],
      },
    ],
  },
};

function absoluteAssetUrl(origin: string, pathOrUrl: string): string {
  if (!pathOrUrl) return `${origin}/assets/marketing/dhaka-rooftop-hero-og.jpg`;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

function buildOfferSchema(
  origin: string,
  productId: string,
  offerUrlPath: string,
  sellerName: string
): Record<string, any> | null {
  const prod = DEFAULT_CENTRAL_PRODUCTS[productId];
  if (!prod) return null;
  const availability =
    prod.active && prod.stock > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';
  return {
    '@type': 'Offer',
    name: prod.name,
    url: `${origin}${offerUrlPath}`,
    priceCurrency: 'BDT',
    price: String(prod.price),
    itemCondition: 'https://schema.org/NewCondition',
    availability,
    seller: {
      '@type': 'Organization',
      name: sellerName,
    },
  };
}

/**
 * Generates accurate Product / Offer and Rental Service structured data directly
 * from the server catalog (DEFAULT_CENTRAL_PRODUCTS).
 * - Never includes unverified aggregateRating or review counts
 * - Never publishes crossed-out reference prices as Offer price
 * - Keeps Starlink Standard 4X Rental modeled as a Service (distinct from hardware purchase Product)
 */
export function buildCatalogSchemasForRoute(
  domain: SupportedDomain,
  normalizedBasePath: string,
  locale: PublishedSeoLanguage
): Record<string, any>[] {
  const config = DOMAIN_SEO_CONFIGS[domain];
  const origin = config.origin;
  const sellerName = config.legalName;

  const stdBd = DEFAULT_CENTRAL_PRODUCTS['starlink-standard-4x-bd-residential'];
  const stdGlobal = DEFAULT_CENTRAL_PRODUCTS['starlink-standard-4x'];
  const miniBd = DEFAULT_CENTRAL_PRODUCTS['starlink-mini-bd-residential'];
  const miniGlobal = DEFAULT_CENTRAL_PRODUCTS['starlink-mini-kit'];
  const rental = DEFAULT_CENTRAL_PRODUCTS['starlink-rental-kit'];

  const stdPath = buildLocalePath('/kits/starlink-standard-4x', locale);
  const miniPath = buildLocalePath('/kits/starlink-mini-kit', locale);
  const rentalPath = buildLocalePath('/rental', locale);

  const buildStandard4xProduct = () => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${origin}/kits/starlink-standard-4x#product`,
    name: stdGlobal.name,
    category: stdGlobal.variantLabel || 'ROAM UNLIMITED',
    image: [
      absoluteAssetUrl(origin, stdGlobal.image),
      absoluteAssetUrl(origin, stdBd.image),
    ],
    description: `${stdGlobal.description} Bangladesh Residential Purchase variant is also available at BDT ${stdBd.price.toLocaleString('en-US')}.`,
    sku: 'DSL-SL-STD4X',
    brand: { '@type': 'Brand', name: 'Starlink' },
    offers: [
      buildOfferSchema(origin, 'starlink-standard-4x', stdPath, sellerName),
      buildOfferSchema(origin, 'starlink-standard-4x-bd-residential', `${stdPath}?variant=bd-residential`, sellerName),
    ].filter(Boolean),
  });

  const buildMiniProduct = () => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${origin}/kits/starlink-mini-kit#product`,
    name: 'Starlink Mini Portable Satellite Internet Kit',
    image: [
      absoluteAssetUrl(origin, miniBd.image),
      absoluteAssetUrl(origin, miniGlobal.image),
    ],
    description:
      'Compact Starlink Mini hardware purchase with integrated Wi-Fi router available in Bangladesh Residential Purchase (BDT 9,500) and Global Roam Purchase (BDT 21,500). Monthly Starlink subscription is separate.',
    sku: 'DSL-SL-MINI',
    brand: { '@type': 'Brand', name: 'Starlink' },
    offers: [
      buildOfferSchema(origin, 'starlink-mini-bd-residential', `${miniPath}?variant=bd-residential`, sellerName),
      buildOfferSchema(origin, 'starlink-mini-kit', miniPath, sellerName),
    ].filter(Boolean),
  });

  const buildRentalService = () => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${origin}/rental#service`,
    name: rental.name,
    serviceType: 'Starlink Hardware Equipment Rental',
    image: absoluteAssetUrl(origin, rental.image),
    description: rental.description,
    areaServed: { '@type': 'Country', name: 'Bangladesh' },
    provider: {
      '@type': 'Organization',
      name: sellerName,
      url: `${origin}/`,
    },
    offers: {
      '@type': 'Offer',
      name: 'Starlink Standard 4X — Rental (One-Time Rental Kit Fee; Monthly Subscription Separate)',
      url: `${origin}${rentalPath}`,
      priceCurrency: 'BDT',
      price: String(rental.price),
      availability:
        rental.active && rental.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      description: RENTAL_TERMS_SUMMARY.en.join(' · '),
    },
  });

  if (
    normalizedBasePath === '/kits/starlink-standard-4x' ||
    normalizedBasePath === '/products/starlink-standard-4x' ||
    normalizedBasePath === '/kits/starlink-standard-4x-bd-residential'
  ) {
    return [buildStandard4xProduct()];
  }
  if (
    normalizedBasePath === '/kits/starlink-mini-kit' ||
    normalizedBasePath === '/products/starlink-mini-kit' ||
    normalizedBasePath === '/kits/starlink-mini-bd-residential'
  ) {
    return [buildMiniProduct()];
  }
  if (
    normalizedBasePath === '/rental' ||
    normalizedBasePath === '/rental-plan' ||
    normalizedBasePath === '/rent'
  ) {
    return [buildRentalService()];
  }
  if (
    normalizedBasePath === '/' ||
    normalizedBasePath === '/kits' ||
    normalizedBasePath === '/products'
  ) {
    return [buildStandard4xProduct(), buildMiniProduct(), buildRentalService()];
  }
  return [];
}

/**
 * Resolves which domain should be served based on hostname, optional query override, and pathname.
 * Ensures devsparksoft.com.bd and dslink.cyou always resolve to their own independent experience.
 */
export function resolveDomainFromRequest(
  hostnameInput?: string | null,
  pathnameInput?: string | null,
  queryDomainInput?: string | null
): SupportedDomain {
  const queryDomain = (queryDomainInput || '').toLowerCase().trim();
  if (queryDomain === 'devsparksoft.com.bd' || queryDomain === 'devsparksoft') {
    return 'devsparksoft.com.bd';
  }
  if (queryDomain === 'dslink.cyou' || queryDomain === 'dslink') {
    return 'dslink.cyou';
  }

  const pathname = (pathnameInput || '').toLowerCase().trim();
  if (pathname === '/devsparksoft' || pathname.startsWith('/devsparksoft/')) {
    return 'devsparksoft.com.bd';
  }
  if (pathname === '/dslink' || pathname.startsWith('/dslink/')) {
    return 'dslink.cyou';
  }

  const host = (hostnameInput || '').toLowerCase().split(':')[0].trim();
  if (host === 'devsparksoft.com.bd' || host === 'www.devsparksoft.com.bd' || host.endsWith('.devsparksoft.com.bd')) {
    return 'devsparksoft.com.bd';
  }
  if (host === 'dslink.cyou' || host === 'www.dslink.cyou' || host.endsWith('.dslink.cyou')) {
    return 'dslink.cyou';
  }

  // Default in preview environment if no query/path specified
  return 'dslink.cyou';
}

export function isPreviewEnvironment(hostnameInput?: string | null): boolean {
  const host = (hostnameInput || '').toLowerCase().split(':')[0].trim();
  return (
    !host ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host.endsWith('.run.app') ||
    host.endsWith('.vercel.app')
  );
}

export function normalizeCanonicalPath(pathname: string): string {
  if (!pathname || pathname === '/' || pathname === '/devsparksoft' || pathname === '/dslink') {
    return '/';
  }
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '');
  return clean.startsWith('/') ? clean : `/${clean}`;
}

export function getCanonicalUrl(domain: SupportedDomain, pathname: string = '/'): string {
  const config = DOMAIN_SEO_CONFIGS[domain];
  const normalizedPath = normalizeCanonicalPath(pathname);
  return `${config.origin}${normalizedPath}`;
}

export function generateRobotsTxt(domain: SupportedDomain): string {
  const origin =
    domain === 'devsparksoft.com.bd' ? 'https://devsparksoft.com.bd' : 'https://dslink.cyou';

  // Public transactional routes (/cart, /checkout, /promos, /track) are intentionally NOT Disallowed
  // so crawlers can fetch and obey their <meta name="robots" content="noindex, nofollow"> and X-Robots-Tag headers.
  return [
    'User-agent: *',
    'Allow: /',
    'Allow: /bn',
    'Allow: /my',
    'Allow: /zh-hans',
    'Allow: /resell',
    'Allow: /resell/authorized-retailer',
    'Allow: /resell/business-partnership',
    'Allow: /assets/',
    'Disallow: /admin',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /account',
    'Disallow: /account/',
    'Disallow: /reseller',
    'Disallow: /reseller/',
    'Disallow: /resell/confirmation',
    'Disallow: /invoice',
    'Disallow: /invoice/',
    'Disallow: /invoices',
    'Disallow: /invoices/',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    '',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export interface SitemapBaseEntry {
  path: string;
  priority: string;
  changefreq: string;
}

/**
 * Public, canonical, indexable base pages included in the XML sitemap.
 * Private pages, account dashboards, admin routes, and checkout flows are excluded.
 */
export function getIndexableSitemapBasePages(domain: SupportedDomain): SitemapBaseEntry[] {
  if (domain === 'devsparksoft.com.bd') {
    return [
      { path: '/', priority: '1.0', changefreq: 'daily' },
      { path: '/kits', priority: '0.95', changefreq: 'daily' },
      { path: '/kits/starlink-standard-4x', priority: '0.95', changefreq: 'weekly' },
      { path: '/kits/starlink-mini-kit', priority: '0.95', changefreq: 'weekly' },
      { path: '/rental', priority: '0.95', changefreq: 'weekly' },
      { path: '/resell', priority: '0.95', changefreq: 'weekly' },
      { path: '/resell/authorized-retailer', priority: '0.9', changefreq: 'weekly' },
      { path: '/resell/business-partnership', priority: '0.9', changefreq: 'weekly' },
      { path: '/starlink-bangladesh', priority: '0.9', changefreq: 'weekly' },
      { path: '/starlink-myanmar', priority: '0.9', changefreq: 'weekly' },
      { path: '/worldwide-delivery', priority: '0.9', changefreq: 'weekly' },
      { path: '/roaming-packages', priority: '0.85', changefreq: 'weekly' },
      { path: '/warranty', priority: '0.85', changefreq: 'weekly' },
      { path: '/money-back', priority: '0.85', changefreq: 'weekly' },
      { path: '/Legal', priority: '0.85', changefreq: 'weekly' },
      ...LEGAL_POLICIES.map((p) => ({ path: p.path, priority: '0.75', changefreq: 'monthly' })),
      { path: '/rental-policy', priority: '0.85', changefreq: 'weekly' },
      { path: '/red-policy-alert', priority: '0.85', changefreq: 'weekly' },
      { path: '/price-syndicate-alert', priority: '0.85', changefreq: 'weekly' },
      { path: '/services', priority: '0.85', changefreq: 'weekly' },
      { path: '/privacy', priority: '0.6', changefreq: 'monthly' },
    ];
  }

  return [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/resell', priority: '0.95', changefreq: 'weekly' },
    { path: '/resell/authorized-retailer', priority: '0.9', changefreq: 'weekly' },
    { path: '/resell/business-partnership', priority: '0.9', changefreq: 'weekly' },
    { path: '/kits', priority: '0.95', changefreq: 'daily' },
    { path: '/kits/starlink-standard-4x', priority: '0.95', changefreq: 'weekly' },
    { path: '/kits/starlink-mini-kit', priority: '0.95', changefreq: 'weekly' },
    { path: '/packages', priority: '0.9', changefreq: 'weekly' },
    { path: '/rental', priority: '0.95', changefreq: 'weekly' },
    { path: '/starlink-bangladesh', priority: '0.9', changefreq: 'weekly' },
    { path: '/starlink-myanmar', priority: '0.9', changefreq: 'weekly' },
    { path: '/worldwide-delivery', priority: '0.9', changefreq: 'weekly' },
    { path: '/roaming-packages', priority: '0.85', changefreq: 'weekly' },
    { path: '/warranty', priority: '0.85', changefreq: 'weekly' },
    { path: '/money-back', priority: '0.85', changefreq: 'weekly' },
    { path: '/Legal', priority: '0.85', changefreq: 'weekly' },
    ...LEGAL_POLICIES.map((p) => ({ path: p.path, priority: '0.75', changefreq: 'monthly' })),
    { path: '/rental-policy', priority: '0.85', changefreq: 'weekly' },
    { path: '/red-policy-alert', priority: '0.85', changefreq: 'weekly' },
    { path: '/price-syndicate-alert', priority: '0.85', changefreq: 'weekly' },
    { path: '/offers', priority: '0.8', changefreq: 'weekly' },
    { path: '/image-gallery', priority: '0.75', changefreq: 'weekly' },
    { path: '/blog', priority: '0.8', changefreq: 'weekly' },
    { path: '/partnerships', priority: '0.75', changefreq: 'monthly' },
    { path: '/support', priority: '0.8', changefreq: 'weekly' },
    { path: '/faq', priority: '0.8', changefreq: 'weekly' },
    { path: '/privacy', priority: '0.6', changefreq: 'monthly' },
  ];
}

export function generateSitemapXml(domain: SupportedDomain): string {
  const lastmod = '2026-11-27';
  const defaultOrigin =
    domain === 'devsparksoft.com.bd' ? 'https://devsparksoft.com.bd' : 'https://dslink.cyou';
  const basePages = getIndexableSitemapBasePages(domain);

  const urlEntries: string[] = [];

  for (const page of basePages) {
    const isResellPage =
      page.path === '/resell' ||
      page.path === '/resell/authorized-retailer' ||
      page.path === '/resell/business-partnership';
    const pageOrigin = isResellPage ? 'https://devsparksoft.com.bd' : defaultOrigin;
    const alternates = buildHreflangLinks(pageOrigin, page.path)
      .map(
        (a) =>
          `    <xhtml:link rel="alternate" hreflang="${escapeHtmlAttr(a.hreflang)}" href="${escapeHtmlAttr(a.href)}" />`
      )
      .join('\n');

    for (const loc of PUBLISHED_SEO_LOCALES) {
      const localizedPath = buildLocalePath(page.path, loc.code);
      const locUrl = `${pageOrigin}${localizedPath}`;
      urlEntries.push(`  <url>
    <loc>${escapeHtmlAttr(locUrl)}</loc>
${alternates}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join('\n')}
</urlset>
`;
}

/**
 * Generates server-rendered semantic HTML for crawlers and initial paint so search engines
 * receive indexable translated page content for every published locale URL.
 */
export function generateServerRenderedBodyHtml(
  domain: SupportedDomain,
  pathname: string = '/',
  localeOverride?: PublishedSeoLanguage,
  visitorCountryCode?: string | null,
  isNotFound?: boolean
): string {
  const parsed = parseLocalePath(pathname);
  const locale: PublishedSeoLanguage = localeOverride || parsed.locale;
  const normalizedPath = parsed.basePath.toLowerCase();
  const seo = getLocalizedRouteSeo(domain, pathname, locale);
  const heroCopy = getHeroGeoCopy(locale, visitorCountryCode);
  const locLink = (p: string) => escapeHtmlAttr(buildLocalePath(p, locale));

  const languageNavLinks = seo.noindex
    ? ''
    : PUBLISHED_SEO_LOCALES.map((loc) => {
        const href = escapeHtmlAttr(buildLocalePath(parsed.basePath, loc.code));
        return `<a href="${href}" hreflang="${loc.hreflang}" class="underline underline-offset-4">${escapeHtmlAttr(loc.label)}</a>`;
      }).join(' · ');

  const socialFooterHtml = `<footer class="pt-6 border-t border-white/10 text-xs text-slate-300 flex flex-wrap gap-4">
    <a href="https://www.facebook.com/share/1AM85YcqNL/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook</a>
    <a href="https://www.instagram.com/dslinkbd?evlk=MXRiYzMzdndqeHNzNg%3D%3D&amp;utm_source=qr" target="_blank" rel="noopener noreferrer">Instagram</a>
    <a href="https://t.me/profwht" target="_blank" rel="noopener noreferrer">Telegram (@profwht)</a>
  </footer>`;

  if (isNotFound || !isKnownSiteRoute(pathname)) {
    return `
      <main id="main-content" class="min-h-screen bg-[#04070c] text-slate-100 px-6 py-16 max-w-3xl mx-auto space-y-6">
        <p class="text-xs font-mono uppercase tracking-wider text-cyan-300">DEVSPARK LINK (DSLINK) · HTTP 404</p>
        <h1 class="text-3xl font-bold text-white">Page Not Found (404)</h1>
        <p class="text-slate-300">${escapeHtmlAttr(seo.description)}</p>
        <nav aria-label="Recovery links" class="flex flex-wrap gap-3">
          <a href="${locLink('/')}" class="inline-flex items-center px-5 py-3 rounded-lg bg-cyan-400 text-[#04131a] font-bold">Back to Homepage</a>
          <a href="${locLink('/kits')}" class="inline-flex items-center px-5 py-3 rounded-lg border border-slate-600 text-white font-semibold">Browse Starlink Kits</a>
        </nav>
        ${socialFooterHtml}
      </main>
    `.trim();
  }

  if (
    normalizedPath === '/resell' ||
    normalizedPath === '/resell/authorized-retailer' ||
    normalizedPath === '/resell/business-partnership'
  ) {
    const isRetailer = normalizedPath === '/resell/authorized-retailer';
    const isPartner = normalizedPath === '/resell/business-partnership';
    const h1Text = isRetailer
      ? locale === 'bn'
        ? 'Starlink অথরাইজড রিটেইলার ইনকোয়ারি ও আবেদন'
        : locale === 'my'
        ? 'Starlink တရားဝင် လက်လီရောင်းချသူ စုံစမ်းမေးမြန်းခြင်း'
        : locale === 'zh-CN'
        ? 'Starlink 授权零售商咨询与申请'
        : 'Starlink Authorized Retailer Inquiry'
      : isPartner
      ? locale === 'bn'
        ? 'বাংলাদেশে Starlink বিজনেস পার্টনারশিপ ও বাল্ক ডিস্ট্রিবিউশন'
        : locale === 'my'
        ? 'ဘင်္ဂလားဒေ့ရှ်နှင့် နိုင်ငံတကာ Starlink စီးပွားရေး မိတ်ဖက်အစီအစဉ်'
        : locale === 'zh-CN'
        ? '孟加拉国及国际市场 Starlink 商业合作与批量分销'
        : 'Starlink Business Partnership in Bangladesh'
      : locale === 'bn'
      ? 'বাংলাদেশে Starlink রিসেলার আবেদন — ১৫% হার্ডওয়্যার ডিসকাউন্ট'
      : locale === 'my'
      ? 'ဘင်္ဂလားဒေ့ရှ် Starlink Reseller လျှောက်လွှာ — 15% လျှော့စျေး'
      : locale === 'zh-CN'
      ? '孟加拉国 Starlink 经销商申请 — 享 15% 硬件折扣'
      : 'Starlink Reseller Application in Bangladesh';

    const primaryBtnLabel = isRetailer
      ? 'Submit a Retailer Inquiry'
      : isPartner
      ? 'Submit a Partnership Inquiry'
      : 'Apply as a DSLink Reseller';

    const portalType = isRetailer
      ? 'authorized_retailer'
      : isPartner
      ? 'business_partnership'
      : 'reseller';

    const bodyParagraph = isRetailer
      ? 'Submit a Starlink authorized retailer application inquiry through DSLink. Note: DSLink receives the inquiry and coordinates hardware retail supply, while Starlink grants official Starlink authorization. Official badges or authorization claims are displayed only when DSLink has documented permission.'
      : isPartner
      ? 'Submit a Starlink business partnership inquiry for bulk Starlink hardware orders, regional distribution, and international shipping partnerships across Bangladesh, Myanmar, South & Southeast Asia, the Middle East, Europe, the USA, and global DHL/FedEx markets.'
      : 'Apply for Starlink reseller status with DSLink. Approved resellers receive a 15% discount on Starlink kits and accessories (paying 85% of public price), fixed subscription fees, custom customer selling prices, reseller-branded shipping labels & packing slips, and NPSB/bKash/Nagad/Rocket profit withdrawals after confirmed delivery and payment.';

    return `
      <div class="min-h-screen bg-white text-slate-900 px-6 py-10 max-w-5xl mx-auto space-y-6">
        <nav aria-label="Breadcrumb" class="text-xs text-slate-600">
          <a href="${locLink('/')}">Home</a> /
          <a href="${locLink('/resell')}">Resell</a>
          ${isRetailer ? ' / <span>Authorized Retailer</span>' : isPartner ? ' / <span>Business Partnership</span>' : ''}
        </nav>
        <h1 class="text-3xl font-bold text-slate-900">${escapeHtmlAttr(h1Text)}</h1>
        <p class="text-base text-slate-700">${escapeHtmlAttr(bodyParagraph)}</p>
        <div>
          <a href="/reseller/portal?type=${portalType}" class="inline-block px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold">${escapeHtmlAttr(primaryBtnLabel)}</a>
        </div>
        <nav aria-label="Application Hub Cross-Links" class="text-sm space-x-4">
          <a href="${locLink('/resell')}">Starlink Reseller Application</a> ·
          <a href="${locLink('/resell/authorized-retailer')}">Authorized Retailer Inquiry</a> ·
          <a href="${locLink('/resell/business-partnership')}">Business Partnership Inquiry</a>
        </nav>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (normalizedPath === '/legal') {
    const policyLinks = LEGAL_POLICIES.map((p) => {
      const title =
        locale === 'bn' ? p.titleBn : locale === 'my' ? p.titleMy : p.titleEn;
      const desc =
        locale === 'bn' ? p.shortDescBn : locale === 'my' ? p.shortDescMy : p.shortDescEn;
      return `<li><a href="${locLink(p.path)}">${escapeHtmlAttr(title)}</a>: ${escapeHtmlAttr(desc)}</li>`;
    }).join('\n');
    return `
      <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-neutral-400">DEV SPARK SOFT LIMITED · DSLINK</p>
        <h1 class="text-3xl font-bold text-white">${escapeHtmlAttr(seo.title)}</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <ul>${policyLinks}</ul>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (normalizedPath.startsWith('/legal/')) {
    const slug = normalizedPath.slice('/legal/'.length);
    const policy = resolveLegalPolicyBySlug(slug);
    if (policy) {
      const title =
        locale === 'bn' ? policy.titleBn : locale === 'my' ? policy.titleMy : policy.titleEn;
      const intro =
        locale === 'bn' ? policy.introBn : locale === 'my' ? policy.introMy : policy.introEn;
      const sectionsHtml = policy.sections
        .map((s) => {
          const heading =
            locale === 'bn' ? s.headingBn : locale === 'my' ? s.headingMy : s.headingEn;
          const bullets =
            locale === 'bn'
              ? s.bulletsBn || s.bulletsEn
              : locale === 'my'
              ? s.bulletsMy || s.bulletsEn
              : s.bulletsEn;
          return `<section><h2>${escapeHtmlAttr(heading)}</h2>${
            bullets ? `<ul>${bullets.map((b) => `<li>${escapeHtmlAttr(b)}</li>`).join('')}</ul>` : ''
          }</section>`;
        })
        .join('\n');
      return `
        <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
          <p class="text-xs font-mono text-neutral-400">DEV SPARK SOFT LIMITED · ${escapeHtmlAttr(policy.path)}</p>
          <h1 class="text-3xl font-bold text-white">${escapeHtmlAttr(title)}</h1>
          <p>${escapeHtmlAttr(intro)}</p>
          ${sectionsHtml}
          <p><a href="${locLink('/Legal')}">${escapeHtmlAttr(heroCopy.legalLabel)}</a></p>
          <nav aria-label="Language switcher">${languageNavLinks}</nav>
          ${socialFooterHtml}
        </div>
      `.trim();
    }
  }

  if (normalizedPath === '/faq') {
    const faqEntries = getLocalizedFaqEntries([...GENERAL_FAQ_ITEMS, ...RENTAL_FAQ_ITEMS], locale);
    const combinedFaqHtml = faqEntries
      .map(
        (item) =>
          `<div class="py-3 border-b border-white/10"><dt class="font-semibold text-white">${escapeHtmlAttr(item.question)}</dt><dd class="text-sm text-neutral-300 mt-1">${escapeHtmlAttr(item.answer)}</dd></div>`
      )
      .join('\n');
    return `
      <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-white">DEVSPARK LINK · FAQ</p>
        <h1 class="text-3xl font-bold text-white">${escapeHtmlAttr(seo.title)}</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <dl>${combinedFaqHtml}</dl>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (normalizedPath === '/kits' || normalizedPath === '/products') {
    const cardsHtml = CORE_FEATURED_VARIANT_IDS.map((id) => {
      const p = DEFAULT_CENTRAL_PRODUCTS[id];
      const href = locLink(p.detailUrl || `/kits/${p.id}`);
      return `<article class="p-4 border border-white/15 rounded-lg space-y-2">
        <img src="${escapeHtmlAttr(p.image)}" alt="${escapeHtmlAttr(p.imageAlt || p.name)}" width="400" height="300" />
        <h2><a href="${href}">${escapeHtmlAttr(p.name)}</a></h2>
        <p>${formatBdt(p.price)} BDT${p.referencePrice ? ` (Reference price: ${formatBdt(p.referencePrice)})` : ''}</p>
        <p>${escapeHtmlAttr(p.description)}</p>
      </article>`;
    }).join('\n');
    return `
      <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-5xl mx-auto space-y-6">
        <p class="text-xs font-mono text-neutral-400">DEVSPARK LINK (DSLINK) · STARLINK KITS IN BANGLADESH</p>
        <h1 class="text-3xl font-bold text-white">Starlink Kits in Bangladesh — Standard 4X, Starlink Mini &amp; Rental</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${cardsHtml}</div>
        <p class="text-xs text-neutral-400">${escapeHtmlAttr(GLOBAL_DELIVERY_COPY.disclaimerEn)}</p>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (
    normalizedPath === '/kits/starlink-standard-4x' ||
    normalizedPath === '/products/starlink-standard-4x' ||
    normalizedPath === '/kits/starlink-standard-4x-bd-residential'
  ) {
    const bd = DEFAULT_CENTRAL_PRODUCTS['starlink-standard-4x-bd-residential'];
    const gl = DEFAULT_CENTRAL_PRODUCTS['starlink-standard-4x'];
    return `
      <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-neutral-400">DEVSPARK LINK (DSLINK) · ROAM UNLIMITED &amp; BANGLADESH RESIDENTIAL</p>
        <h1 class="text-3xl font-bold text-white">Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500) &amp; BD Residential</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article class="p-4 border border-white/15 rounded-lg space-y-2">
            <img src="${escapeHtmlAttr(gl.image)}" alt="${escapeHtmlAttr(gl.imageAlt || gl.name)}" width="800" height="800" />
            <p class="text-xs font-mono uppercase">${escapeHtmlAttr(gl.variantLabel || 'ROAM UNLIMITED')}</p>
            <h2>${escapeHtmlAttr(gl.name)}</h2>
            <p>${formatBdt(gl.price)} BDT (Reference price: ${formatBdt(gl.referencePrice || 48000)})</p>
            <p>${escapeHtmlAttr(gl.description)}</p>
          </article>
          <article class="p-4 border border-white/15 rounded-lg space-y-2">
            <img src="${escapeHtmlAttr(bd.image)}" alt="${escapeHtmlAttr(bd.imageAlt || bd.name)}" width="800" height="800" />
            <p class="text-xs font-mono uppercase">${escapeHtmlAttr(bd.variantLabel || 'Bangladesh Residential Purchase')}</p>
            <h2>${escapeHtmlAttr(bd.name)}</h2>
            <p>${formatBdt(bd.price)} BDT (Reference price: ${formatBdt(bd.referencePrice || 48000)})</p>
            <p>${escapeHtmlAttr(bd.description)}</p>
          </article>
        </div>
        <p><a href="${locLink('/rental')}">Looking for Starlink Standard 4X Rental (BDT 3,000 one-time fee)? View Rental Offer</a></p>
        <p class="text-xs text-slate-300">${escapeHtmlAttr(GLOBAL_DELIVERY_COPY.disclaimerEn)}</p>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (
    normalizedPath === '/kits/starlink-mini-kit' ||
    normalizedPath === '/products/starlink-mini-kit' ||
    normalizedPath === '/kits/starlink-mini-bd-residential'
  ) {
    const bd = DEFAULT_CENTRAL_PRODUCTS['starlink-mini-bd-residential'];
    const gl = DEFAULT_CENTRAL_PRODUCTS['starlink-mini-kit'];
    return `
      <div class="min-h-screen bg-[#04070c] text-slate-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-cyan-300">DEVSPARK LINK (DSLINK) · STARLINK MINI</p>
        <h1 class="text-3xl font-bold text-white">Starlink Mini Price in Bangladesh — Residential &amp; Global Roam Purchase</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <article class="p-4 border border-white/15 rounded-lg space-y-2">
            <img src="${escapeHtmlAttr(bd.image)}" alt="${escapeHtmlAttr(bd.imageAlt || bd.name)}" width="800" height="800" />
            <h2>${escapeHtmlAttr(bd.name)}</h2>
            <p>${formatBdt(bd.price)} BDT (Reference price: ${formatBdt(bd.referencePrice || 26500)})</p>
            <p>${escapeHtmlAttr(bd.description)}</p>
          </article>
          <article class="p-4 border border-white/15 rounded-lg space-y-2">
            <img src="${escapeHtmlAttr(gl.image)}" alt="${escapeHtmlAttr(gl.imageAlt || gl.name)}" width="800" height="800" />
            <h2>${escapeHtmlAttr(gl.name)}</h2>
            <p>${formatBdt(gl.price)} BDT (Reference price: ${formatBdt(gl.referencePrice || 26500)})</p>
            <p>${escapeHtmlAttr(gl.description)}</p>
          </article>
        </div>
        <p class="text-xs text-slate-300">${escapeHtmlAttr(GLOBAL_DELIVERY_COPY.disclaimerEn)}</p>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (
    normalizedPath === '/rental' ||
    normalizedPath === '/rental-plan' ||
    normalizedPath === '/rent'
  ) {
    const rental = DEFAULT_CENTRAL_PRODUCTS['starlink-rental-kit'];
    const termsHtml = RENTAL_TERMS_SUMMARY.en
      .map((term) => `<li>${escapeHtmlAttr(term)}</li>`)
      .join('');
    return `
      <div class="min-h-screen bg-[#04070c] text-slate-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-cyan-300">DEVSPARK LINK (DSLINK) · STARLINK RENTAL IN BANGLADESH</p>
        <h1 class="text-3xl font-bold text-white">Starlink Standard 4X Rental in Bangladesh — BDT 3,000 One-Time Fee</h1>
        <img src="${escapeHtmlAttr(rental.image)}" alt="${escapeHtmlAttr(rental.imageAlt || rental.name)}" width="800" height="800" />
        <p>${escapeHtmlAttr(rental.description)}</p>
        <ul>${termsHtml}</ul>
        <p><a href="${locLink('/kits')}">Compare Starlink Standard 4X &amp; Starlink Mini Purchase Kits</a></p>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  if (normalizedPath !== '/' && normalizedPath !== '/devsparksoft' && normalizedPath !== '/dslink') {
    return `
      <div class="min-h-screen bg-black text-neutral-100 px-6 py-12 max-w-4xl mx-auto space-y-6">
        <p class="text-xs font-mono text-neutral-400">DEVSPARK LINK (DSLINK) · DEV SPARK SOFT LIMITED</p>
        <h1 class="text-3xl font-bold text-white">${escapeHtmlAttr(seo.title)}</h1>
        <p>${escapeHtmlAttr(seo.description)}</p>
        <p>${escapeHtmlAttr(heroCopy.serviceLine)}</p>
        <p>${escapeHtmlAttr(heroCopy.worldwideNote)}</p>
        <nav aria-label="Primary links">
          <a href="${locLink('/')}">Home</a> ·
          <a href="${locLink('/kits')}">Starlink Kits</a> ·
          <a href="${locLink('/rental')}">Starlink Rental Kit</a> ·
          <a href="${locLink('/resell')}">Resell &amp; Partner</a> ·
          <a href="${locLink('/worldwide-delivery')}">Worldwide Delivery</a> ·
          <a href="${locLink('/Legal')}">${escapeHtmlAttr(heroCopy.legalLabel)}</a> ·
          <a href="${locLink('/support')}">${escapeHtmlAttr(heroCopy.supportLabel)}</a>
        </nav>
        <nav aria-label="Language switcher">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </div>
    `.trim();
  }

  // Homepage semantic initial HTML (uses localized country-aware hero copy + all 5 catalog offers)
  const homeOfferCardsHtml = CORE_FEATURED_VARIANT_IDS.map((id) => {
    const p = DEFAULT_CENTRAL_PRODUCTS[id];
    const href = locLink(p.detailUrl || `/kits/${p.id}`);
    return `<a href="${href}" class="p-4 border border-white/20 rounded-lg block">
      <img src="${escapeHtmlAttr(p.image)}" alt="${escapeHtmlAttr(p.imageAlt || p.name)}" width="320" height="240" />
      <h2>${escapeHtmlAttr(p.name)}</h2>
      <p>${formatBdt(p.price)} BDT${p.category === 'rental' ? ' One-Time Fee' : ''}</p>
      <p>${escapeHtmlAttr(p.variantLabel || '')}</p>
    </a>`;
  }).join('\n');

  return `
    <div class="min-h-screen bg-black text-neutral-100">
      <header class="flex items-center justify-between gap-8 px-6 py-4 border-b border-white/15 max-w-[1280px] mx-auto">
        <a href="${locLink('/')}" class="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0">DEVSPARK LINK (DSLINK)</a>
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-300" aria-label="Main Navigation">
          <a href="${locLink('/kits')}" class="hover:text-white">Starlink Kits</a>
          <a href="${locLink('/rental')}" class="hover:text-white">Starlink Rental Kit</a>
          <a href="${locLink('/roaming-packages')}" class="hover:text-white">Roaming</a>
          <a href="${locLink('/resell')}" class="hover:text-white">Resell &amp; Partner</a>
          <a href="${locLink('/worldwide-delivery')}" class="hover:text-white">Worldwide Delivery</a>
          <a href="${locLink('/Legal')}" class="hover:text-white">${escapeHtmlAttr(heroCopy.legalLabel)}</a>
        </nav>
      </header>
      <main class="max-w-[1280px] mx-auto px-6 py-16 space-y-12">
        <section aria-labelledby="dslink-hero-heading" class="space-y-4">
          <h1 id="dslink-hero-heading" data-ssr-hero-heading="true" class="text-4xl md:text-5xl font-bold text-white tracking-tight">${escapeHtmlAttr(heroCopy.heading)}</h1>
          <p data-ssr-hero-description="true" class="text-base text-slate-200 max-w-3xl">${escapeHtmlAttr(heroCopy.description)}</p>
          <p class="text-sm text-neutral-200 max-w-3xl">${escapeHtmlAttr(heroCopy.serviceLine)}</p>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${homeOfferCardsHtml}
          </div>
          <p class="text-xs text-neutral-300 max-w-3xl">${escapeHtmlAttr(heroCopy.worldwideNote)} <a href="${locLink('/Legal')}">${escapeHtmlAttr(heroCopy.legalLabel)}</a> · <a href="${locLink('/support')}">${escapeHtmlAttr(heroCopy.supportLabel)}</a></p>
        </section>
        <nav aria-label="Language switcher" class="text-xs text-neutral-400">${languageNavLinks}</nav>
        ${socialFooterHtml}
      </main>
    </div>
  `.trim();
}

export interface ServerVisitorCountry {
  countryCode: string | null;
  source: string;
}

/**
 * Injects locale-URL-driven SEO <head> tags and server-rendered <body> markup.
 * SEO metadata (title, description, canonical, hreflang, OG) is strictly determined
 * by the locale URL and NEVER changes based on visitor IP country.
 */
export function buildDomainHtmlDocument(
  baseHtml: string,
  domain: SupportedDomain,
  pathname: string = '/',
  visitorCountry?: ServerVisitorCountry,
  options?: { isNotFound?: boolean }
): string {
  const config = DOMAIN_SEO_CONFIGS[domain];
  const parsed = parseLocalePath(pathname);
  const normalizedBasePath = parsed.basePath.toLowerCase();
  const isNotFound = Boolean(options?.isNotFound) || !isKnownSiteRoute(pathname);

  // SEO metadata is derived strictly from the locale URL (never from visitor IP)
  const localizedSeo = getLocalizedRouteSeo(domain, pathname);
  const canonicalUrl = localizedSeo.canonicalUrl;

  // Country-level geolocation only affects homepage hero body copy (never head metadata)
  const safeVisitorCountry: ServerVisitorCountry = {
    countryCode: normalizeValidIsoCountry(visitorCountry?.countryCode || null),
    source: visitorCountry?.source || 'unavailable',
  };

  const ssrBody = generateServerRenderedBodyHtml(
    domain,
    pathname,
    localizedSeo.language,
    safeVisitorCountry.countryCode,
    isNotFound
  );

  const pageTitle = localizedSeo.title;
  const pageDescription = localizedSeo.description;
  const pageKeywords = localizedSeo.keywords;
  const isLegalCenter = normalizedBasePath === '/legal';
  const legalSubPolicy = normalizedBasePath.startsWith('/legal/')
    ? resolveLegalPolicyBySlug(normalizedBasePath.slice('/legal/'.length))
    : null;
  const isRedPolicy =
    normalizedBasePath === '/red-policy-alert' ||
    normalizedBasePath === '/policy-alert' ||
    normalizedBasePath === '/terms/red-policy-alert';
  const isPriceSyndicate =
    normalizedBasePath === '/price-syndicate-alert' ||
    normalizedBasePath === '/syndicate-alert' ||
    normalizedBasePath === '/rental-kit-alert';
  const isRentalPolicy =
    normalizedBasePath === '/rental-policy' ||
    normalizedBasePath === '/terms/rental' ||
    normalizedBasePath === '/terms/rental-policy';
  const isRental =
    normalizedBasePath === '/rental' ||
    normalizedBasePath === '/rental-plan' ||
    normalizedBasePath === '/rent';
  const isFaqPage = normalizedBasePath === '/faq';

  const isArticleRoute =
    !isNotFound &&
    (localizedSeo.isArticle ||
      isRedPolicy ||
      isPriceSyndicate ||
      isRentalPolicy ||
      isLegalCenter ||
      Boolean(legalSubPolicy));

  const catalogSchemas =
    isNotFound || localizedSeo.noindex
      ? []
      : buildCatalogSchemasForRoute(domain, normalizedBasePath, localizedSeo.language);

  const pageSchemas =
    isNotFound || localizedSeo.noindex
      ? []
      : isFaqPage
      ? [
          ...config.jsonLd,
          buildFaqPageJsonLd(
            getLocalizedFaqEntries(
              [...GENERAL_FAQ_ITEMS, ...RENTAL_FAQ_ITEMS],
              localizedSeo.language
            ),
            { inLanguage: localizedSeo.inLanguage, pageUrl: canonicalUrl }
          ),
        ]
      : isRental || isRentalPolicy
      ? [
          ...config.jsonLd,
          ...catalogSchemas,
          buildFaqPageJsonLd(
            getLocalizedFaqEntries(RENTAL_FAQ_ITEMS, localizedSeo.language),
            { inLanguage: localizedSeo.inLanguage, pageUrl: canonicalUrl }
          ),
        ]
      : normalizedBasePath === '/'
      ? [
          ...config.jsonLd,
          ...catalogSchemas,
          buildFaqPageJsonLd(
            getLocalizedFaqEntries(RENTAL_FAQ_ITEMS, localizedSeo.language),
            { inLanguage: localizedSeo.inLanguage, pageUrl: canonicalUrl }
          ),
        ]
      : [...config.jsonLd, ...catalogSchemas];

  const isResellSubpage =
    normalizedBasePath === '/resell/authorized-retailer' ||
    normalizedBasePath === '/resell/business-partnership';
  const isResellRoot = normalizedBasePath === '/resell';
  const isKitDetailSubpage =
    normalizedBasePath.startsWith('/kits/') || normalizedBasePath.startsWith('/products/');
  const breadcrumbOrigin =
    isResellRoot || isResellSubpage ? 'https://devsparksoft.com.bd' : config.origin;

  const breadcrumbSchema =
    !isNotFound && !localizedSeo.noindex && normalizedBasePath !== '/'
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: isResellSubpage
              ? [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: `${breadcrumbOrigin}${buildLocalePath('/', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Resell',
                    item: `${breadcrumbOrigin}${buildLocalePath('/resell', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: pageTitle.split('|')[0].trim(),
                    item: canonicalUrl,
                  },
                ]
              : isKitDetailSubpage
              ? [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: `${breadcrumbOrigin}${buildLocalePath('/', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Starlink Kits',
                    item: `${breadcrumbOrigin}${buildLocalePath('/kits', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: pageTitle.split('|')[0].trim(),
                    item: canonicalUrl,
                  },
                ]
              : legalSubPolicy
              ? [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: `${breadcrumbOrigin}${buildLocalePath('/', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Legal & Policies',
                    item: `${breadcrumbOrigin}${buildLocalePath('/Legal', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 3,
                    name: pageTitle.split('|')[0].trim(),
                    item: canonicalUrl,
                  },
                ]
              : [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Home',
                    item: `${breadcrumbOrigin}${buildLocalePath('/', localizedSeo.language)}`,
                  },
                  {
                    '@type': 'ListItem',
                    position: 2,
                    name: pageTitle.split('|')[0].trim(),
                    item: canonicalUrl,
                  },
                ],
          },
        ]
      : [];

  const jsonLdScripts = [...pageSchemas, ...breadcrumbSchema]
    .map(
      (schema) =>
        `<script type="application/ld+json" data-domain-seo="true">\n${JSON.stringify(schema, null, 2)}\n</script>`
    )
    .join('\n    ');

  const hreflangTags =
    isNotFound || localizedSeo.noindex
      ? ''
      : localizedSeo.hreflangLinks
          .map(
            (link) =>
              `<link rel="alternate" hreflang="${escapeHtmlAttr(link.hreflang)}" href="${escapeHtmlAttr(link.href)}" />`
          )
          .join('\n    ');

  const ogLocaleAlternateTags = localizedSeo.ogLocaleAlternates
    .map((loc) => `<meta property="og:locale:alternate" content="${escapeHtmlAttr(loc)}" />`)
    .join('\n    ');

  const safeTitle = escapeHtmlAttr(pageTitle);
  const safeDescription = escapeHtmlAttr(pageDescription);
  const safeKeywords = escapeHtmlAttr(pageKeywords);
  const safeCanonical = escapeHtmlAttr(canonicalUrl);
  const robotsValue =
    isNotFound || localizedSeo.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const isSquareProductOg =
    normalizedBasePath === '/kits/starlink-standard-4x' ||
    normalizedBasePath === '/products/starlink-standard-4x' ||
    normalizedBasePath === '/kits/starlink-standard-4x-bd-residential' ||
    normalizedBasePath === '/kits/starlink-mini-kit' ||
    normalizedBasePath === '/products/starlink-mini-kit' ||
    normalizedBasePath === '/kits/starlink-mini-bd-residential' ||
    isRental;

  const routeOgImage =
    normalizedBasePath === '/kits/starlink-standard-4x' ||
    normalizedBasePath === '/products/starlink-standard-4x'
      ? '/assets/products/starlink-standard-4x-roam-unlimited.jpg'
      : normalizedBasePath === '/kits/starlink-standard-4x-bd-residential'
      ? '/assets/products/starlink-standard-4x-bd-residential.jpg'
      : normalizedBasePath === '/kits/starlink-mini-kit' ||
        normalizedBasePath === '/products/starlink-mini-kit'
      ? '/assets/products/starlink-mini-global-roam.jpg'
      : normalizedBasePath === '/kits/starlink-mini-bd-residential'
      ? '/assets/products/starlink-mini-bd-residential.jpg'
      : isRental
      ? '/assets/products/starlink-standard-4x-rental.jpg'
      : config.ogImage;

  const ogImageWidth = isSquareProductOg ? '1024' : '1280';
  const ogImageHeight = isSquareProductOg ? '1024' : '720';

  const ogImageUrl = routeOgImage.startsWith('http')
    ? routeOgImage
    : `${config.origin}${routeOgImage}`;

  const seoHeadBlock = `<!-- Primary Multilingual SEO Meta Tags (${config.domain} · ${localizedSeo.htmlLang}) -->
    <title>${safeTitle}</title>
    <meta name="description" content="${safeDescription}" />
    <meta name="keywords" content="${safeKeywords}" />
    <meta http-equiv="content-language" content="${escapeHtmlAttr(localizedSeo.htmlLang)}" />
    <meta name="author" content="DEVSPARK LINK BY DEV SPARK SOFT LIMITED (DNCC/037306)" />
    <meta name="robots" content="${robotsValue}" />
    <meta name="googlebot" content="${robotsValue}" />
    <meta name="google-site-verification" content="${config.gscVerificationToken}" />
    <meta name="theme-color" content="${config.themeColor}" />
    <meta name="application-name" content="${escapeHtmlAttr(config.brandName)}" />
    <meta name="apple-mobile-web-app-title" content="${escapeHtmlAttr(config.brandName)}" />
    ${isNotFound ? '' : `<link rel="canonical" href="${safeCanonical}" />`}
    ${hreflangTags}

    <!-- Favicon & App Icons -->
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/jpeg" href="/favicon-devspark.jpg" />
    <link rel="shortcut icon" type="image/jpeg" href="/favicon-devspark.jpg" />
    <link rel="apple-touch-icon" href="/favicon-devspark.jpg" />
    <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
    <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png" />

    <!-- OpenGraph / Facebook / WhatsApp Meta Tags -->
    <meta property="og:type" content="${isArticleRoute ? 'article' : 'website'}" />
    <meta property="og:site_name" content="${escapeHtmlAttr(config.ogSiteName)}" />
    <meta property="og:url" content="${safeCanonical}" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${escapeHtmlAttr(ogImageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtmlAttr(ogImageUrl)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="${ogImageWidth}" />
    <meta property="og:image:height" content="${ogImageHeight}" />
    <meta property="og:image:alt" content="${safeTitle}" />
    <meta property="og:locale" content="${escapeHtmlAttr(localizedSeo.ogLocale)}" />
    ${ogLocaleAlternateTags}

    <!-- Twitter / X Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${safeCanonical}" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${escapeHtmlAttr(ogImageUrl)}" />
    <meta name="twitter:image:alt" content="${safeTitle}" />

    <!-- Schema.org JSON-LD Structured Data -->
    ${jsonLdScripts}`;

  let html = baseHtml;
  html = html.replace(
    /<html([^>]*)\blang="[^"]*"([^>]*)>/i,
    `<html$1lang="${localizedSeo.htmlLang}"$2>`
  );
  if (html.includes('<!-- SEO_HEAD_START -->') && html.includes('<!-- SEO_HEAD_END -->')) {
    html = html.replace(
      /<!-- SEO_HEAD_START -->[\s\S]*?<!-- SEO_HEAD_END -->/,
      `<!-- SEO_HEAD_START -->\n    ${seoHeadBlock}\n    <!-- SEO_HEAD_END -->`
    );
  }

  // Inject ONLY country-level visitor code (never raw IP) so client hydrates matching hero copy
  const visitorCountryScript = `window.__VISITOR_COUNTRY__ = ${JSON.stringify(safeVisitorCountry)};`;
  const domainBootScript = `<script>window.__INITIAL_DOMAIN__ = "${config.domain}";${visitorCountryScript}</script>`;
  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>/,
    `${domainBootScript}\n    <div id="root">${ssrBody}</div>`
  );

  return html;
}
