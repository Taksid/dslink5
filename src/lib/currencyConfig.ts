import { useCallback, useEffect, useState } from 'react';
import { normalizeCountryCode, SHIPPING_COUNTRY_MAP } from './shippingConfig';

export interface CurrencyMeta {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  fallbackRateFromBdt: number;
}

/**
 * ISO 4217 Currency Registry with verified fallback exchange rates (1 BDT -> Target Currency).
 * Live rates are refreshed from /api/exchange-rates and cached for 6 hours.
 */
export const CURRENCIES: Record<string, CurrencyMeta> = {
  BDT: { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', decimals: 0, fallbackRateFromBdt: 1 },
  MMK: { code: 'MMK', symbol: 'Ks', name: 'Myanmar Kyat', decimals: 0, fallbackRateFromBdt: 17.35 },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, fallbackRateFromBdt: 0.0595 },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, fallbackRateFromBdt: 0.0642 },
  TWD: { code: 'TWD', symbol: 'NT$', name: 'New Taiwan Dollar', decimals: 0, fallbackRateFromBdt: 0.265 },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', decimals: 2, fallbackRateFromBdt: 0.285 },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, fallbackRateFromBdt: 11.45 },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', decimals: 0, fallbackRateFromBdt: 0.785 },
  UAH: { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', decimals: 0, fallbackRateFromBdt: 0.342 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, fallbackRateFromBdt: 0.00825 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, fallbackRateFromBdt: 0.00648 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, fallbackRateFromBdt: 0.00762 },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 0, fallbackRateFromBdt: 0.705 },
  AED: { code: 'AED', symbol: 'AED ', name: 'UAE Dirham', decimals: 2, fallbackRateFromBdt: 0.0303 },
  SAR: { code: 'SAR', symbol: 'SAR ', name: 'Saudi Riyal', decimals: 2, fallbackRateFromBdt: 0.0309 },
  QAR: { code: 'QAR', symbol: 'QAR ', name: 'Qatari Riyal', decimals: 2, fallbackRateFromBdt: 0.03 },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', decimals: 2, fallbackRateFromBdt: 0.0365 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, fallbackRateFromBdt: 0.011 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, fallbackRateFromBdt: 1.26 },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2, fallbackRateFromBdt: 0.0115 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, fallbackRateFromBdt: 0.0127 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, fallbackRateFromBdt: 0.0139 },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', decimals: 0, fallbackRateFromBdt: 0.295 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', decimals: 0, fallbackRateFromBdt: 132 },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', decimals: 0, fallbackRateFromBdt: 210 },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', decimals: 0, fallbackRateFromBdt: 0.478 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', decimals: 2, fallbackRateFromBdt: 0.0475 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, fallbackRateFromBdt: 0.151 },
};

export const CURRENCY_LIST: CurrencyMeta[] = Object.values(CURRENCIES);

export const CURRENCY_STORAGE_KEY = 'dslink_currency';
export const CURRENCY_MANUAL_KEY = 'dslink_currency_manual';
export const CURRENCY_ACCOUNT_KEY = 'dslink_account_currency';
export const EXCHANGE_RATES_CACHE_KEY = 'dslink_exchange_rates_v1';
export const CURRENCY_CHANGE_EVENT = 'dslink-currency-change';

export interface ExchangeRatesSnapshot {
  base: 'BDT';
  rates: Record<string, number>;
  source: 'live' | 'fallback';
  updatedAt: string;
}

export function getFallbackRatesMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const [code, meta] of Object.entries(CURRENCIES)) {
    map[code] = meta.fallbackRateFromBdt;
  }
  return map;
}

export function normalizeCurrencyCode(code?: string | null): string {
  const c = (code || '').trim().toUpperCase();
  if (c && CURRENCIES[c]) return c;
  return 'BDT';
}

/**
 * Resolves the suggested ISO 4217 currency from a visitor's IP country code.
 * Operates completely independently of browser/UI language.
 */
export function resolveCurrencyFromCountry(countryCode?: string | null): string {
  if (!countryCode || countryCode === 'UNKNOWN') return 'BDT';
  const cc = normalizeCountryCode(countryCode);
  const country = SHIPPING_COUNTRY_MAP[cc];
  if (country?.currency && CURRENCIES[country.currency]) {
    return country.currency;
  }
  const euCountries = new Set([
    'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'HR',
  ]);
  if (euCountries.has(cc)) return 'EUR';
  return 'USD';
}

export function convertFromBdt(
  amountBdt: number,
  currencyCode: string,
  rates?: Record<string, number>
): { amount: number; rate: number; isEstimate: boolean } {
  const safeBdt = Number.isFinite(Number(amountBdt)) ? Number(amountBdt) : 0;
  const code = normalizeCurrencyCode(currencyCode);
  if (code === 'BDT') {
    return { amount: Math.round(safeBdt), rate: 1, isEstimate: false };
  }
  const meta = CURRENCIES[code] || CURRENCIES.USD;
  const rate =
    rates && Number.isFinite(rates[code]) && rates[code] > 0
      ? rates[code]
      : meta.fallbackRateFromBdt;
  const converted = safeBdt * rate;
  const factor = Math.pow(10, meta.decimals);
  return {
    amount: Math.round(converted * factor) / factor,
    rate,
    isEstimate: true,
  };
}

export function formatCurrencyAmount(
  amountBdt: number,
  currencyCode: string,
  rates?: Record<string, number>,
  options?: { includeEstimateLabel?: boolean; showBdtReference?: boolean }
): string {
  const code = normalizeCurrencyCode(currencyCode);
  const meta = CURRENCIES[code] || CURRENCIES.BDT;
  const { amount, isEstimate } = convertFromBdt(amountBdt, code, rates);
  const formattedNum = amount.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  const baseStr = `${meta.symbol}${formattedNum}`;
  if (!isEstimate) return baseStr;
  const estSuffix = options?.includeEstimateLabel ? ' est.' : '';
  const refSuffix = options?.showBdtReference
    ? ` (৳${Math.round(amountBdt).toLocaleString('en-US')})`
    : '';
  return `~${baseStr}${estSuffix}${refSuffix}`;
}

let liveRatesSnapshot: ExchangeRatesSnapshot = {
  base: 'BDT',
  rates: getFallbackRatesMap(),
  source: 'fallback',
  updatedAt: new Date().toISOString(),
};
let inflightRatesPromise: Promise<ExchangeRatesSnapshot> | null = null;
let hasFetchedRates = false;

export function getSavedCurrency(): string {
  if (typeof window === 'undefined') return 'BDT';
  try {
    const manualFlag = window.localStorage.getItem(CURRENCY_MANUAL_KEY) === '1';
    const stored = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    if (manualFlag && stored && CURRENCIES[stored]) return stored;

    const accountPref = window.localStorage.getItem(CURRENCY_ACCOUNT_KEY);
    if (accountPref && CURRENCIES[accountPref]) return accountPref;

    if (stored && CURRENCIES[stored]) return stored;

    const detectedGeo = (window as any).__DETECTED_GEO__;
    if (detectedGeo?.countryCode && detectedGeo.countryCode !== 'UNKNOWN') {
      return resolveCurrencyFromCountry(detectedGeo.countryCode);
    }
  } catch {
    // ignore
  }
  return 'BDT';
}

export function applyGlobalCurrency(currencyCode: string, isManual = true): string {
  const normalized = normalizeCurrencyCode(currencyCode);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CURRENCY_STORAGE_KEY, normalized);
      if (isManual) {
        window.localStorage.setItem(CURRENCY_MANUAL_KEY, '1');
      }
    } catch {
      // ignore
    }
    (window as any).__DSLINK_ACTIVE_CURRENCY__ = normalized;
    window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: normalized }));
  }
  return normalized;
}

export function applyIpSuggestedCurrency(countryCode?: string | null): string {
  if (typeof window === 'undefined') return resolveCurrencyFromCountry(countryCode);
  try {
    if (window.localStorage.getItem(CURRENCY_MANUAL_KEY) === '1') {
      return getSavedCurrency();
    }
    const accountPref = window.localStorage.getItem(CURRENCY_ACCOUNT_KEY);
    if (accountPref && CURRENCIES[accountPref]) {
      return applyGlobalCurrency(accountPref, false);
    }
  } catch {
    // ignore
  }
  const suggested = resolveCurrencyFromCountry(countryCode);
  return applyGlobalCurrency(suggested, false);
}

export async function fetchExchangeRates(force = false): Promise<ExchangeRatesSnapshot> {
  if (typeof window === 'undefined') return liveRatesSnapshot;
  if (!force && hasFetchedRates && !inflightRatesPromise) return liveRatesSnapshot;
  if (inflightRatesPromise && !force) return inflightRatesPromise;

  inflightRatesPromise = fetch('/api/exchange-rates', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Exchange rates API error');
      const data = await res.json();
      if (data?.rates && typeof data.rates === 'object') {
        liveRatesSnapshot = {
          base: 'BDT',
          rates: { ...getFallbackRatesMap(), ...data.rates },
          source: data.source === 'live' ? 'live' : 'fallback',
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        try {
          window.localStorage.setItem(EXCHANGE_RATES_CACHE_KEY, JSON.stringify(liveRatesSnapshot));
        } catch {
          // ignore
        }
        (window as any).__DSLINK_EXCHANGE_RATES__ = liveRatesSnapshot;
        window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: getSavedCurrency() }));
      }
      hasFetchedRates = true;
      return liveRatesSnapshot;
    })
    .catch(() => {
      hasFetchedRates = true;
      return liveRatesSnapshot;
    })
    .finally(() => {
      inflightRatesPromise = null;
    });

  return inflightRatesPromise;
}

if (typeof window !== 'undefined') {
  try {
    const cached = window.localStorage.getItem(EXCHANGE_RATES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed?.rates) {
        liveRatesSnapshot = {
          base: 'BDT',
          rates: { ...getFallbackRatesMap(), ...parsed.rates },
          source: parsed.source || 'fallback',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {
    // ignore
  }
  (window as any).__DSLINK_ACTIVE_CURRENCY__ = getSavedCurrency();
  (window as any).__DSLINK_EXCHANGE_RATES__ = liveRatesSnapshot;
  (window as any).__DSLINK_CURRENCY__ = {
    CURRENCIES,
    CURRENCY_LIST,
    getSavedCurrency,
    applyGlobalCurrency,
    resolveCurrencyFromCountry,
    convertFromBdt,
    formatPrice: (bdt: number, opts?: { includeEstimateLabel?: boolean; showBdtReference?: boolean }) =>
      formatCurrencyAmount(bdt, getSavedCurrency(), liveRatesSnapshot.rates, opts),
  };
  fetchExchangeRates(false);
}

export function useGlobalCurrency() {
  const [currency, setCurrencyState] = useState<string>(() => getSavedCurrency());
  const [ratesSnapshot, setRatesSnapshot] = useState<ExchangeRatesSnapshot>(() => liveRatesSnapshot);

  useEffect(() => {
    let active = true;
    fetchExchangeRates(false).then((snap) => {
      if (active) setRatesSnapshot(snap);
    });

    const handleChange = () => {
      setCurrencyState(getSavedCurrency());
      setRatesSnapshot({ ...liveRatesSnapshot });
    };

    window.addEventListener(CURRENCY_CHANGE_EVENT, handleChange);
    window.addEventListener('storage', handleChange);
    return () => {
      active = false;
      window.removeEventListener(CURRENCY_CHANGE_EVENT, handleChange);
      window.removeEventListener('storage', handleChange);
    };
  }, []);

  const setCurrency = useCallback((code: string) => {
    const applied = applyGlobalCurrency(code, true);
    setCurrencyState(applied);
  }, []);

  const formatPrice = useCallback(
    (amountBdt: number, options?: { includeEstimateLabel?: boolean; showBdtReference?: boolean }) =>
      formatCurrencyAmount(amountBdt, currency, ratesSnapshot.rates, options),
    [currency, ratesSnapshot.rates]
  );

  const convert = useCallback(
    (amountBdt: number) => convertFromBdt(amountBdt, currency, ratesSnapshot.rates),
    [currency, ratesSnapshot.rates]
  );

  return {
    currency,
    currencyMeta: CURRENCIES[currency] || CURRENCIES.BDT,
    setCurrency,
    rates: ratesSnapshot.rates,
    ratesSource: ratesSnapshot.source,
    ratesUpdatedAt: ratesSnapshot.updatedAt,
    isEstimate: currency !== 'BDT',
    formatPrice,
    convert,
  };
}
