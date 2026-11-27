import React from 'react';
import { Globe, Coins, Languages } from 'lucide-react';
import { AppLanguage, SUPPORTED_LANGUAGES, useGeoLanguage } from '../lib/geoLanguage';
import { CURRENCY_LIST, useGlobalCurrency } from '../lib/currencyConfig';
import { SHIPPING_COUNTRIES, useSelectedShippingCountry } from '../lib/shippingConfig';
import { PUBLISHED_SEO_LOCALES, buildLocalePath } from '../lib/localeRouting';

export const GlobalFooterPreferences: React.FC = () => {
  const { language, setLanguage, t } = useGeoLanguage();
  const { currency, setCurrency, ratesSource, isEstimate } = useGlobalCurrency();
  const { countryCode, setCountryCode } = useSelectedShippingCountry();

  const currentPathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  return (
    <div
      id="dslink-footer-preferences"
      className="max-w-6xl mx-auto mb-8 rounded-xl border border-slate-700/70 bg-[#0b0f17] p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="text-xs sm:text-sm font-semibold text-white tracking-wide">
            {t('footer.preferencesTitle', 'Region, Language & Currency')}
          </div>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {isEstimate
              ? `Language, shipping country, and currency operate independently. Non-BDT prices are live ${ratesSource === 'live' ? 'market' : 'reference'} estimates; orders are validated against authoritative BDT pricing.`
              : 'Language, shipping country, and currency operate independently and persist across sessions without clearing your cart.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full lg:w-auto lg:min-w-[540px]">
          {/* Language Selector (Footer-Only per Global Spec) */}
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <Languages className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>{t('footer.language', 'Language')}</span>
            </span>
            <select
              aria-label="Select Website Language"
              data-testid="footer-language-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value as AppLanguage, true)}
              className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 hover:border-cyan-400/70 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-white outline-none cursor-pointer"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label} ({lang.englishName})
                </option>
              ))}
            </select>
          </label>

          {/* Shipping Country Selector */}
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <Globe className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>{t('footer.country', 'Country')}</span>
            </span>
            <select
              aria-label="Select Shipping Country"
              data-testid="footer-country-select"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 hover:border-cyan-400/70 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-white outline-none cursor-pointer"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code === 'BD' ? 'FREE' : c.carrierAvailable ? '৳2,500' : 'Inquiry'})
                </option>
              ))}
            </select>
          </label>

          {/* Currency Selector */}
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-200">
              <Coins className="w-3.5 h-3.5 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>{t('footer.currency', 'Currency')}</span>
            </span>
            <select
              aria-label="Select Display Currency"
              data-testid="footer-currency-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 hover:border-cyan-400/70 focus:border-cyan-400 rounded-lg px-2.5 py-2 text-xs sm:text-sm text-white outline-none font-mono cursor-pointer"
            >
              {CURRENCY_LIST.map((cur) => (
                <option key={cur.code} value={cur.code}>
                  {cur.code} ({cur.symbol.trim()}) — {cur.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Direct crawlable equivalent-page links for every published language */}
      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <nav
          aria-label="Published Language Versions"
          data-testid="published-locale-links"
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <span className="text-slate-300 font-mono uppercase tracking-wider text-xs">
            {t('footer.language', 'Language')}:
          </span>
          {PUBLISHED_SEO_LOCALES.map((loc) => {
            const href = buildLocalePath(currentPathname, loc.code);
            const isActive = language === loc.code;
            return (
              <a
                key={loc.code}
                href={href}
                hrefLang={loc.hreflang}
                lang={loc.htmlLang}
                data-testid={`locale-link-${loc.code}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  setLanguage(loc.code, true);
                }}
                className={
                  isActive
                    ? 'inline-flex items-center min-h-[36px] text-cyan-300 font-semibold underline underline-offset-4'
                    : 'inline-flex items-center min-h-[36px] text-slate-300 hover:text-cyan-200 transition-colors'
                }
              >
                {loc.label}
              </a>
            );
          })}
        </nav>

        <nav
          aria-label="Reseller & Partner Hub"
          data-testid="footer-resell-hub-links"
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-slate-200"
        >
          <a
            href={buildLocalePath('/resell', language)}
            className="text-emerald-300 hover:text-emerald-200 font-semibold transition-colors"
          >
            Reseller Application
          </a>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <a
            href={buildLocalePath('/resell/authorized-retailer', language)}
            className="hover:text-cyan-200 transition-colors"
          >
            Authorized Retailer Inquiry
          </a>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <a
            href={buildLocalePath('/resell/business-partnership', language)}
            className="hover:text-cyan-200 transition-colors"
          >
            Business Partnership
          </a>
          <span aria-hidden="true" className="text-slate-500">·</span>
          <a
            href="/reseller/portal"
            className="hover:text-cyan-200 transition-colors"
          >
            Reseller Portal
          </a>
        </nav>
      </div>
    </div>
  );
};

export default GlobalFooterPreferences;
