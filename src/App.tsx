import React, { useState, useEffect } from 'react';
import { OriginalApp } from './lib/index-COMOowaA';
import { PromosCheckoutPage } from './pages/PromosCheckout';
import { RedPolicyAlertPage } from './pages/RedPolicyAlert';
import { PriceSyndicateAlertPage } from './pages/PriceSyndicateAlert';
import { RentalPlanPage } from './pages/RentalPlan';
import { RentalPolicyPage } from './pages/RentalPolicy';
import { LegalCenterPage } from './pages/LegalCenter';
import { LegalPolicyDetailPage } from './pages/LegalPolicyDetail';
import { WarrantyPortalPage } from './pages/WarrantyPortal';
import { RoamingGuaranteePage } from './pages/RoamingGuaranteePage';
import { WorldwideDeliveryPage } from './pages/WorldwideDeliveryPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { AdminGlobalHubPage } from './pages/AdminGlobalHub';
import { ResellPublicHubPage } from './pages/ResellPublicHubPage';
import { ResellerPortalPage } from './pages/ResellerPortalPage';
import { KitsCatalogPage } from './pages/KitsCatalogPage';
import { KitDetailPage } from './pages/KitDetailPage';
import { DSLinkPayPage } from './pages/DSLinkPayPage';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { SiteHeader } from './components/SiteHeader';
import { Footer } from './components/Footer';
import { useIpGeolocationLanguage } from './hooks/useIpGeolocationLanguage';
import {
  GSC_VERIFICATION_CODE,
  OFFICIAL_FAVICON_LOGO_URL,
  OFFICIAL_HEADER_LOGO_URL,
  SupportedDomain,
  resolveDomainFromRequest,
} from './lib/domainConfig';
import { getLocalizedRouteSeo } from './lib/multilingualSeo';
import { buildLocalePath, isKnownSiteRoute, parseLocalePath } from './lib/localeRouting';
import { LANGUAGE_LABELS } from './lib/i18n';
import './lib/pricingConfig';
import './lib/shippingConfig';
import './lib/currencyConfig';
import './lib/cartStore';

/**
 * BrandingFixer: Enforces official DEVSPARK LINK / DSLINK / DEV SPARK SOFT LIMITED
 * favicon, brand asset integrity, and smooth mobile/PWA vertical touch scrolling.
 */
function BrandingFixer() {
  useEffect(() => {
    let isMutating = false;

    const fixBranding = () => {
      if (isMutating) return;
      isMutating = true;
      try {
        // 0. Enforce updated official Favicon & Apple Touch Icon in <head>
        const iconSelectors = [
          'link[rel="icon"]:not([sizes]):not([type="image/svg+xml"])',
          'link[rel="shortcut icon"]',
          'link[rel="alternate icon"]',
          'link[rel="apple-touch-icon"]',
        ];
        iconSelectors.forEach((sel) => {
          const links = document.querySelectorAll(sel);
          links.forEach((link) => {
            if (link.getAttribute('href') !== OFFICIAL_FAVICON_LOGO_URL) {
              link.setAttribute('href', OFFICIAL_FAVICON_LOGO_URL);
              link.setAttribute('type', 'image/jpeg');
            }
          });
        });

        // 1. Replace any legacy WhatsApp/old favicon URLs in images dynamically without overwriting wordmark logos
        const images = document.querySelectorAll('img');
        images.forEach((img) => {
          const currentSrc = img.getAttribute('src') || '';
          const lowerSrc = currentSrc.toLowerCase();

          if (lowerSrc.includes('wvr3yrds')) {
            img.src = OFFICIAL_HEADER_LOGO_URL;
            img.alt = 'DEVSPARK LINK — DSLINK | DEV SPARK SOFT LIMITED';
            img.removeAttribute('srcset');
          }
        });

        // 2. Ensure Mobile & Standalone PWA vertical touch scrolling is never locked (without masking overflow)
        if (document.documentElement) {
          document.documentElement.style.overflowY = 'auto';
          document.documentElement.style.height = 'auto';
          document.documentElement.style.touchAction = 'pan-y pinch-zoom';
        }
        if (document.body) {
          document.body.style.overflowY = 'visible';
          document.body.style.height = 'auto';
          document.body.style.position = 'relative';
          document.body.style.touchAction = 'pan-y pinch-zoom';
        }
      } finally {
        isMutating = false;
      }
    };

    fixBranding();

    const observer = new MutationObserver(fixBranding);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'alt'],
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

export default function App() {
  const { language } = useIpGeolocationLanguage();
  const [currentPath, setCurrentPath] = useState(
    typeof window !== 'undefined' ? window.location.pathname : '/'
  );

  const parsedRoute = parseLocalePath(currentPath);

  // Normalize non-canonical prefixes like /en or /zh-cn on client navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (parsedRoute.canonicalRedirectPath) {
      const qs = window.location.search || '';
      const target = `${parsedRoute.canonicalRedirectPath}${qs}`;
      window.history.replaceState({}, '', target);
      setCurrentPath(parsedRoute.canonicalRedirectPath);
    }
  }, [parsedRoute.canonicalRedirectPath]);

  const navigateTo = (path: string) => {
    const localized = buildLocalePath(path, parsedRoute.locale);
    let targetUrl = localized;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const countrySim = params.get('country');
      if (countrySim && !localized.includes('?')) {
        targetUrl = `${localized}?country=${encodeURIComponent(countrySim)}`;
      }
    }
    window.history.pushState({}, '', targetUrl);
    setCurrentPath(localized);
    window.scrollTo(0, 0);
  };

  const activeDomain: SupportedDomain =
    typeof window !== 'undefined'
      ? resolveDomainFromRequest(
          window.location.hostname,
          window.location.pathname,
          new URLSearchParams(window.location.search).get('domain')
        )
      : 'dslink.cyou';

  useEffect(() => {
    let lastPath = window.location.pathname;

    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path !== lastPath) {
        lastPath = path;
        setCurrentPath(path);
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      setTimeout(handleLocationChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      setTimeout(handleLocationChange, 0);
    };

    const interval = setInterval(handleLocationChange, 300);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      clearInterval(interval);
    };
  }, []);

  const normalizedPath = parsedRoute.basePath.toLowerCase().replace(/\/+$/, '') || '/';

  // Sync stable, IP-independent multilingual SEO head tags per locale URL
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const seo = getLocalizedRouteSeo(activeDomain, currentPath);

    document.documentElement.lang = seo.htmlLang;
    document.documentElement.dir = LANGUAGE_LABELS[language]?.dir || 'ltr';
    document.title = seo.title;

    const upsertMeta = (attr: 'name' | 'property' | 'http-equiv', key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const robotsValue = seo.noindex
      ? 'noindex, nofollow'
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

    upsertMeta('name', 'description', seo.description);
    upsertMeta('name', 'keywords', seo.keywords);
    upsertMeta('name', 'robots', robotsValue);
    upsertMeta('name', 'googlebot', robotsValue);
    upsertMeta('http-equiv', 'content-language', seo.htmlLang);
    upsertMeta('name', 'google-site-verification', GSC_VERIFICATION_CODE);

    upsertMeta('property', 'og:type', seo.isArticle ? 'article' : 'website');
    upsertMeta('property', 'og:title', seo.title);
    upsertMeta('property', 'og:description', seo.description);
    upsertMeta('property', 'og:url', seo.canonicalUrl);
    upsertMeta('property', 'og:locale', seo.ogLocale);

    // Replace og:locale:alternate tags cleanly for published locales
    document.querySelectorAll('meta[property="og:locale:alternate"]').forEach((node) => node.remove());
    seo.ogLocaleAlternates.forEach((altLocale) => {
      const altEl = document.createElement('meta');
      altEl.setAttribute('property', 'og:locale:alternate');
      altEl.setAttribute('content', altLocale);
      document.head.appendChild(altEl);
    });

    upsertMeta('name', 'twitter:title', seo.title);
    upsertMeta('name', 'twitter:description', seo.description);
    upsertMeta('name', 'twitter:url', seo.canonicalUrl);

    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = seo.canonicalUrl;

    // Replace reciprocal hreflang alternate links cleanly (empty on private/noindex pages)
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((node) => node.remove());
    seo.hreflangLinks.forEach((entry) => {
      const linkEl = document.createElement('link');
      linkEl.setAttribute('rel', 'alternate');
      linkEl.setAttribute('hreflang', entry.hreflang);
      linkEl.setAttribute('href', entry.href);
      linkEl.setAttribute('data-seo-hreflang', 'true');
      document.head.appendChild(linkEl);
    });
  }, [activeDomain, currentPath, language]);

  const isLegalCenterRoute = normalizedPath === '/legal';
  const legalSubSlug = normalizedPath.startsWith('/legal/')
    ? normalizedPath.slice('/legal/'.length)
    : null;

  const checkIsRedPolicyRoute = () => {
    return (
      normalizedPath === '/red-policy-alert' ||
      normalizedPath === '/policy-alert' ||
      normalizedPath === '/terms/red-policy-alert'
    );
  };

  const checkIsPriceSyndicateRoute = () => {
    return (
      normalizedPath === '/price-syndicate-alert' ||
      normalizedPath === '/syndicate-alert' ||
      normalizedPath === '/rental-kit-alert'
    );
  };

  const checkIsPromoRoute = () => {
    if (typeof window === 'undefined') return false;
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    return (
      normalizedPath === '/promos' ||
      normalizedPath.startsWith('/promos/') ||
      search.includes('promo') ||
      hash.includes('promo')
    );
  };

  const checkIsRentalPolicyRoute = () => {
    return (
      normalizedPath === '/rental-policy' ||
      normalizedPath === '/terms/rental' ||
      normalizedPath === '/terms/rental-policy'
    );
  };

  const checkIsRentalRoute = () => {
    return (
      normalizedPath === '/rental' ||
      normalizedPath === '/rental-plan' ||
      normalizedPath === '/rent'
    );
  };

  const isRentalPolicyRoute = checkIsRentalPolicyRoute();
  const isRentalRoute = checkIsRentalRoute();
  const isRedPolicyRoute = checkIsRedPolicyRoute();
  const isPriceSyndicateRoute = checkIsPriceSyndicateRoute();
  const isPromoRoute = checkIsPromoRoute();
  const isWarrantyRoute =
    normalizedPath === '/warranty' ||
    normalizedPath === '/warranty-claim' ||
    normalizedPath === '/warranty-policy';
  const isRoamingRoute = normalizedPath === '/roaming-packages';
  const isRefundRoute =
    normalizedPath === '/money-back' ||
    normalizedPath === '/refund-claim' ||
    normalizedPath === '/refund-policy' ||
    normalizedPath === '/guarantee';
  const isWorldwideDeliveryRoute = normalizedPath === '/worldwide-delivery';
  const isBangladeshRoute = normalizedPath === '/starlink-bangladesh';
  const isMyanmarRoute = normalizedPath === '/starlink-myanmar';
  const isCartRoute = normalizedPath === '/cart' || normalizedPath === '/checkout';
  const rawPayPath = parsedRoute.basePath.replace(/\/+$/, '');
  const payToken = rawPayPath.toLowerCase().startsWith('/pay/')
    ? rawPayPath.slice('/pay/'.length).split('/')[0] || ''
    : null;
  const isPayRootRoute = normalizedPath === '/pay';
  const isAdminGlobalRoute = normalizedPath === '/admin/global';
  const isKitsCatalogRoute = normalizedPath === '/kits' || normalizedPath === '/products';
  const kitDetailProductId = normalizedPath.startsWith('/kits/')
    ? normalizedPath.slice('/kits/'.length)
    : normalizedPath.startsWith('/products/')
    ? normalizedPath.slice('/products/'.length)
    : null;

  // Public Resell Hub Routes (/resell, /resell/authorized-retailer, /resell/business-partnership)
  const isResellPublicHubRoute =
    normalizedPath === '/resell' ||
    normalizedPath === '/resell/authorized-retailer' ||
    normalizedPath === '/resell/business-partnership';

  const resellPageVariant: 'reseller' | 'authorized_retailer' | 'business_partnership' =
    normalizedPath === '/resell/authorized-retailer'
      ? 'authorized_retailer'
      : normalizedPath === '/resell/business-partnership'
      ? 'business_partnership'
      : 'reseller';

  // Private Reseller Portal Routes (/reseller, /reseller/portal, /reseller/dashboard, /reseller/login, /reseller/register, /reseller/reset-password, or retailer.devsparksoft.com.bd root)
  const isRetailerSubdomainRoot =
    typeof window !== 'undefined' &&
    window.location.hostname.toLowerCase().startsWith('retailer.') &&
    normalizedPath === '/';

  const isResellerPortalRoute =
    isRetailerSubdomainRoot ||
    normalizedPath === '/reseller' ||
    normalizedPath.startsWith('/reseller/');

  const isKnownCurrentRoute = isRetailerSubdomainRoot || isKnownSiteRoute(currentPath);
  const hideFloatingPwaButton =
    isCartRoute ||
    Boolean(payToken) ||
    isPayRootRoute ||
    isPromoRoute ||
    isRentalRoute ||
    isResellerPortalRoute ||
    isAdminGlobalRoute ||
    normalizedPath === '/admin' ||
    normalizedPath.startsWith('/admin/') ||
    normalizedPath.startsWith('/checkout');

  return (
    <>
      <BrandingFixer />
      <OfflineIndicator />
      {!hideFloatingPwaButton && <PWAInstallButton variant="floating" />}
      {!isKnownCurrentRoute ? (
        <div className="min-h-screen bg-[#04070c] text-slate-100 flex flex-col">
          <SiteHeader onNavigate={navigateTo} />
          <main
            id="main-content"
            className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-16 sm:py-24 flex flex-col justify-center space-y-6"
          >
            <span className="inline-flex w-fit items-center px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-mono font-bold uppercase tracking-wider">
              HTTP 404 · Not Found
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Page Not Found (404)
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              The page you requested could not be found on DevSpark Link (DSLink). Explore our Starlink kits, rental offer, or return to the homepage.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigateTo('/')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold text-sm transition-colors cursor-pointer"
              >
                Back to Homepage
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/kits')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0b0f17] hover:bg-slate-800 border border-slate-600 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Browse Starlink Kits
              </button>
              <button
                type="button"
                onClick={() => navigateTo('/rental')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0b0f17] hover:bg-slate-800 border border-slate-600 text-slate-200 font-semibold text-sm transition-colors cursor-pointer"
              >
                Starlink Rental Kit
              </button>
            </div>
          </main>
          <Footer />
        </div>
      ) : isResellPublicHubRoute ? (
        <ResellPublicHubPage
          variant={resellPageVariant}
          onNavigate={navigateTo}
        />
      ) : isResellerPortalRoute ? (
        <ResellerPortalPage onNavigate={navigateTo} />
      ) : isLegalCenterRoute ? (
        <LegalCenterPage
          onNavigate={navigateTo}
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : legalSubSlug ? (
        <LegalPolicyDetailPage
          slug={legalSubSlug}
          onNavigate={navigateTo}
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isWarrantyRoute ? (
        <WarrantyPortalPage onNavigate={navigateTo} />
      ) : isRoamingRoute ? (
        <RoamingGuaranteePage initialSection="roaming" onNavigate={navigateTo} />
      ) : isRefundRoute ? (
        <RoamingGuaranteePage initialSection="refund" onNavigate={navigateTo} />
      ) : isWorldwideDeliveryRoute ? (
        <WorldwideDeliveryPage regionMode="global" onNavigate={navigateTo} />
      ) : isBangladeshRoute ? (
        <WorldwideDeliveryPage regionMode="bangladesh" onNavigate={navigateTo} />
      ) : isMyanmarRoute ? (
        <WorldwideDeliveryPage regionMode="myanmar" onNavigate={navigateTo} />
      ) : isCartRoute ? (
        <CartCheckoutPage onNavigate={navigateTo} />
      ) : payToken !== null || isPayRootRoute ? (
        <DSLinkPayPage token={payToken || ''} onNavigate={navigateTo} />
      ) : isKitsCatalogRoute ? (
        <KitsCatalogPage
          onNavigate={navigateTo}
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : kitDetailProductId ? (
        <KitDetailPage
          productId={kitDetailProductId}
          onNavigate={navigateTo}
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isAdminGlobalRoute ? (
        <AdminGlobalHubPage onNavigate={navigateTo} />
      ) : isRentalPolicyRoute ? (
        <RentalPolicyPage
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isRentalRoute ? (
        <RentalPlanPage
          onNavigate={navigateTo}
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isPriceSyndicateRoute ? (
        <PriceSyndicateAlertPage
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isRedPolicyRoute ? (
        <RedPolicyAlertPage
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : isPromoRoute ? (
        <PromosCheckoutPage
          onBackToMainSite={() => navigateTo('/')}
        />
      ) : (
        <OriginalApp />
      )}
    </>
  );
}
