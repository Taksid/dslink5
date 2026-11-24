import { useCallback, useEffect, useState } from 'react';

export interface ShippingCountryConfig {
  code: string;
  name: string;
  nativeName: string;
  currency: string;
  defaultLanguage: string;
  region: 'bangladesh' | 'asia' | 'europe' | 'americas' | 'middle_east' | 'oceania' | 'africa';
  shippingFeeBdt: number;
  codAvailable: boolean;
  carrierAvailable: boolean;
  carriers: string[];
  estimatedDays: string;
  starlinkNote?: string;
}

export const BANGLADESH_SHIPPING_FEE_BDT = 0;
export const INTERNATIONAL_SHIPPING_FEE_BDT = 2500;

export const SHIPPING_COUNTRIES: ShippingCountryConfig[] = [
  {
    code: 'BD',
    name: 'Bangladesh',
    nativeName: 'বাংলাদেশ',
    currency: 'BDT',
    defaultLanguage: 'bn',
    region: 'bangladesh',
    shippingFeeBdt: BANGLADESH_SHIPPING_FEE_BDT,
    codAvailable: true,
    carrierAvailable: true,
    carriers: ['Steadfast Courier', 'Pathao Courier'],
    estimatedDays: '1–3 Business Days',
    starlinkNote: 'FREE Delivery across all 64 districts via Steadfast & Pathao. COD available for outright kit purchases.',
  },
  {
    code: 'MM',
    name: 'Myanmar',
    nativeName: 'မြန်မာ',
    currency: 'MMK',
    defaultLanguage: 'my',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–8 Business Days',
    starlinkNote: 'International dispatch via DHL Express / FedEx. Local regulations & official Starlink roaming/activation policies apply.',
  },
  {
    code: 'CN',
    name: 'China',
    nativeName: '中国',
    currency: 'CNY',
    defaultLanguage: 'zh-CN',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '5–9 Business Days',
    starlinkNote: 'Hardware delivery only where permitted by customs/carrier. Starlink activation is not guaranteed in unsupported jurisdictions.',
  },
  {
    code: 'HK',
    name: 'Hong Kong',
    nativeName: '香港',
    currency: 'HKD',
    defaultLanguage: 'zh-TW',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–6 Business Days',
  },
  {
    code: 'TW',
    name: 'Taiwan',
    nativeName: '台灣',
    currency: 'TWD',
    defaultLanguage: 'zh-TW',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'TH',
    name: 'Thailand',
    nativeName: 'ประเทศไทย',
    currency: 'THB',
    defaultLanguage: 'th',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–6 Business Days',
  },
  {
    code: 'KR',
    name: 'South Korea',
    nativeName: '대한민국',
    currency: 'KRW',
    defaultLanguage: 'ko',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'JP',
    name: 'Japan',
    nativeName: '日本',
    currency: 'JPY',
    defaultLanguage: 'ja',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'IN',
    name: 'India',
    nativeName: 'भारत',
    currency: 'INR',
    defaultLanguage: 'hi',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–6 Business Days',
  },
  {
    code: 'MY',
    name: 'Malaysia',
    nativeName: 'Malaysia',
    currency: 'MYR',
    defaultLanguage: 'ms',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–6 Business Days',
  },
  {
    code: 'SG',
    name: 'Singapore',
    nativeName: 'Singapore',
    currency: 'SGD',
    defaultLanguage: 'en',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–5 Business Days',
  },
  {
    code: 'ID',
    name: 'Indonesia',
    nativeName: 'Indonesia',
    currency: 'IDR',
    defaultLanguage: 'id',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'VN',
    name: 'Vietnam',
    nativeName: 'Việt Nam',
    currency: 'VND',
    defaultLanguage: 'vi',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'PH',
    name: 'Philippines',
    nativeName: 'Philippines',
    currency: 'PHP',
    defaultLanguage: 'en',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'RU',
    name: 'Russia',
    nativeName: 'Россия',
    currency: 'RUB',
    defaultLanguage: 'ru',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '7–14 Business Days',
    starlinkNote: 'Carrier availability and customs compliance are verified per shipment. Starlink activation is subject to official Starlink service terms.',
  },
  {
    code: 'UA',
    name: 'Ukraine',
    nativeName: 'Україна',
    currency: 'UAH',
    defaultLanguage: 'uk',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '6–12 Business Days',
  },
  {
    code: 'US',
    name: 'United States',
    nativeName: 'United States',
    currency: 'USD',
    defaultLanguage: 'en',
    region: 'americas',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'CA',
    name: 'Canada',
    nativeName: 'Canada',
    currency: 'CAD',
    defaultLanguage: 'en',
    region: 'americas',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'BR',
    name: 'Brazil',
    nativeName: 'Brasil',
    currency: 'BRL',
    defaultLanguage: 'pt',
    region: 'americas',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '5–9 Business Days',
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    currency: 'GBP',
    defaultLanguage: 'en',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'DE',
    name: 'Germany',
    nativeName: 'Deutschland',
    currency: 'EUR',
    defaultLanguage: 'de',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'FR',
    name: 'France',
    nativeName: 'France',
    currency: 'EUR',
    defaultLanguage: 'fr',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'ES',
    name: 'Spain',
    nativeName: 'España',
    currency: 'EUR',
    defaultLanguage: 'es',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'IT',
    name: 'Italy',
    nativeName: 'Italia',
    currency: 'EUR',
    defaultLanguage: 'it',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'TR',
    name: 'Türkiye',
    nativeName: 'Türkiye',
    currency: 'TRY',
    defaultLanguage: 'tr',
    region: 'europe',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nativeName: 'الإمارات العربية المتحدة',
    currency: 'AED',
    defaultLanguage: 'ar',
    region: 'middle_east',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '3–6 Business Days',
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nativeName: 'المملكة العربية السعودية',
    currency: 'SAR',
    defaultLanguage: 'ar',
    region: 'middle_east',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'QA',
    name: 'Qatar',
    nativeName: 'قطر',
    currency: 'QAR',
    defaultLanguage: 'ar',
    region: 'middle_east',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'AU',
    name: 'Australia',
    nativeName: 'Australia',
    currency: 'AUD',
    defaultLanguage: 'en',
    region: 'oceania',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '4–7 Business Days',
  },
  {
    code: 'NZ',
    name: 'New Zealand',
    nativeName: 'New Zealand',
    currency: 'NZD',
    defaultLanguage: 'en',
    region: 'oceania',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '5–8 Business Days',
  },
  {
    code: 'ZA',
    name: 'South Africa',
    nativeName: 'South Africa',
    currency: 'ZAR',
    defaultLanguage: 'en',
    region: 'africa',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: true,
    carriers: ['DHL Express', 'FedEx'],
    estimatedDays: '5–9 Business Days',
  },
  // Destinations where standard DHL/FedEx express delivery is restricted — show Delivery Inquiry instead of direct checkout
  {
    code: 'KP',
    name: 'North Korea',
    nativeName: '조선민주주의인민공화국',
    currency: 'USD',
    defaultLanguage: 'ko',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: false,
    carriers: [],
    estimatedDays: 'Carrier Inquiry Required',
    starlinkNote: 'Direct DHL Express / FedEx checkout is unavailable for this destination due to carrier and regulatory restrictions.',
  },
  {
    code: 'SY',
    name: 'Syria',
    nativeName: 'سوريا',
    currency: 'USD',
    defaultLanguage: 'ar',
    region: 'middle_east',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: false,
    carriers: [],
    estimatedDays: 'Carrier Inquiry Required',
    starlinkNote: 'Direct DHL Express / FedEx checkout is unavailable for this destination. Please submit a Delivery Inquiry.',
  },
  {
    code: 'IR',
    name: 'Iran',
    nativeName: 'ایران',
    currency: 'USD',
    defaultLanguage: 'en',
    region: 'middle_east',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: false,
    carriers: [],
    estimatedDays: 'Carrier Inquiry Required',
    starlinkNote: 'Direct DHL Express / FedEx checkout is unavailable for this destination. Please submit a Delivery Inquiry.',
  },
  {
    code: 'CU',
    name: 'Cuba',
    nativeName: 'Cuba',
    currency: 'USD',
    defaultLanguage: 'es',
    region: 'americas',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: false,
    carriers: [],
    estimatedDays: 'Carrier Inquiry Required',
    starlinkNote: 'Direct DHL Express / FedEx checkout is unavailable for this destination. Please submit a Delivery Inquiry.',
  },
  {
    code: 'AF',
    name: 'Afghanistan',
    nativeName: 'افغانستان',
    currency: 'USD',
    defaultLanguage: 'en',
    region: 'asia',
    shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    codAvailable: false,
    carrierAvailable: false,
    carriers: [],
    estimatedDays: 'Carrier Inquiry Required',
    starlinkNote: 'Standard express courier service is currently restricted. Please submit a Delivery Inquiry.',
  },
];

export const SHIPPING_COUNTRY_MAP: Record<string, ShippingCountryConfig> = Object.fromEntries(
  SHIPPING_COUNTRIES.map((c) => [c.code, c])
);

export function normalizeCountryCode(input?: string | null): string {
  const raw = (input || '').trim().toUpperCase();
  if (!raw) return 'BD';
  if (raw === 'BGD' || raw === 'BANGLADESH') return 'BD';
  if (raw === 'MMR' || raw === 'MYANMAR' || raw === 'BURMA') return 'MM';
  if (raw === 'USA' || raw === 'UNITED STATES' || raw === 'UNITED STATES OF AMERICA') return 'US';
  if (raw === 'UK' || raw === 'UNITED KINGDOM' || raw === 'GBR') return 'GB';
  if (raw === 'CHINA' || raw === 'CHN') return 'CN';
  if (raw === 'HONG KONG' || raw === 'HKG') return 'HK';
  if (raw === 'THAILAND' || raw === 'THA') return 'TH';
  if (raw === 'SOUTH KOREA' || raw === 'KOREA' || raw === 'KOR') return 'KR';
  if (raw === 'RUSSIA' || raw === 'RUS') return 'RU';
  if (raw === 'UKRAINE' || raw === 'UKR') return 'UA';
  if (raw === 'UAE' || raw === 'DUBAI' || raw === 'UNITED ARAB EMIRATES') return 'AE';
  if (raw === 'SAUDI ARABIA' || raw === 'KSA') return 'SA';
  if (raw === 'INDIA' || raw === 'IND') return 'IN';
  if (raw === 'JAPAN' || raw === 'JPN') return 'JP';
  if (raw === 'MALAYSIA' || raw === 'MYS') return 'MY';
  if (raw === 'SINGAPORE' || raw === 'SGP') return 'SG';
  if (raw === 'CANADA' || raw === 'CAN') return 'CA';
  if (raw === 'AUSTRALIA' || raw === 'AUS') return 'AU';
  if (raw === 'GERMANY' || raw === 'DEU') return 'DE';
  if (raw === 'FRANCE' || raw === 'FRA') return 'FR';
  if (raw === 'INTERNATIONAL' || raw === 'WORLDWIDE' || raw === 'GLOBAL') return 'US';
  if (SHIPPING_COUNTRY_MAP[raw]) return raw;
  // Match by name
  const byName = SHIPPING_COUNTRIES.find(
    (c) => c.name.toUpperCase() === raw || c.nativeName.toUpperCase() === raw
  );
  if (byName) return byName.code;
  return raw.length === 2 ? raw : 'US';
}

export function getCountryConfig(countryCode?: string | null): ShippingCountryConfig {
  const code = normalizeCountryCode(countryCode);
  return (
    SHIPPING_COUNTRY_MAP[code] || {
      code,
      name: code,
      nativeName: code,
      currency: 'USD',
      defaultLanguage: 'en',
      region: 'americas',
      shippingFeeBdt: code === 'BD' ? BANGLADESH_SHIPPING_FEE_BDT : INTERNATIONAL_SHIPPING_FEE_BDT,
      codAvailable: code === 'BD',
      carrierAvailable: true,
      carriers: code === 'BD' ? ['Steadfast Courier', 'Pathao Courier'] : ['DHL Express', 'FedEx'],
      estimatedDays: code === 'BD' ? '1–3 Business Days' : '5–10 Business Days',
    }
  );
}

/**
 * Authoritative Shipping Fee Calculator (strictly based on selected shipping country, NOT IP).
 * Bangladesh = ৳0 (FREE); Supported International = ৳2,500.
 */
export function calculateShipping(
  countryCode?: string | null,
  customInternationalFeeBdt = INTERNATIONAL_SHIPPING_FEE_BDT
): number {
  const code = normalizeCountryCode(countryCode);
  return code === 'BD' ? BANGLADESH_SHIPPING_FEE_BDT : customInternationalFeeBdt;
}

/**
 * Authoritative COD Eligibility Calculator (strictly based on selected shipping country, NOT IP).
 * COD is available ONLY inside Bangladesh for outright kit purchases (rental kits require Bangla QR).
 */
export function isCODAvailable(countryCode?: string | null, isRental = false): boolean {
  if (isRental) return false;
  const code = normalizeCountryCode(countryCode);
  return code === 'BD';
}

export function isCarrierSupported(countryCode?: string | null): boolean {
  return getCountryConfig(countryCode).carrierAvailable;
}

export function getCarriersForCountry(countryCode?: string | null): string[] {
  return getCountryConfig(countryCode).carriers;
}

export function getCompactShippingNotice(
  countryCode?: string | null,
  formattedIntlFee = '৳2,500'
): {
  mode: 'bangladesh' | 'international' | 'inquiry';
  headline: string;
  compactLine: string;
  carriers: string[];
  codAvailable: boolean;
  shippingFeeBdt: number;
} {
  const config = getCountryConfig(countryCode);
  if (config.code === 'BD') {
    return {
      mode: 'bangladesh',
      headline: 'FREE Delivery Across Bangladesh | Cash on Delivery Available',
      compactLine: 'FREE Delivery (৳0) | COD Available | Steadfast / Pathao',
      carriers: config.carriers,
      codAvailable: true,
      shippingFeeBdt: 0,
    };
  }
  if (!config.carrierAvailable) {
    return {
      mode: 'inquiry',
      headline: `Delivery Inquiry Required for ${config.name}`,
      compactLine: `DHL / FedEx unavailable for ${config.name} | Submit Delivery Inquiry`,
      carriers: [],
      codAvailable: false,
      shippingFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
    };
  }
  return {
    mode: 'international',
    headline: `Worldwide Delivery via DHL / FedEx — Shipping ${formattedIntlFee}`,
    compactLine: `Worldwide Shipping ${formattedIntlFee} | DHL / FedEx | Prepaid Only`,
    carriers: config.carriers,
    codAvailable: false,
    shippingFeeBdt: config.shippingFeeBdt,
  };
}

export const SHIPPING_COUNTRY_STORAGE_KEY = 'dslink_shipping_country';
export const SHIPPING_COUNTRY_EVENT = 'dslink-shipping-country-change';

export function getSavedShippingCountry(): string {
  if (typeof window === 'undefined') return 'BD';
  try {
    const saved = window.localStorage.getItem(SHIPPING_COUNTRY_STORAGE_KEY);
    if (saved) return normalizeCountryCode(saved);
  } catch {
    // ignore
  }
  return 'BD';
}

export function setGlobalShippingCountry(countryCode: string): string {
  const normalized = normalizeCountryCode(countryCode);
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SHIPPING_COUNTRY_STORAGE_KEY, normalized);
    } catch {
      // ignore
    }
    (window as any).__DSLINK_SHIPPING_COUNTRY__ = normalized;
    window.dispatchEvent(new CustomEvent(SHIPPING_COUNTRY_EVENT, { detail: normalized }));
  }
  return normalized;
}

if (typeof window !== 'undefined') {
  (window as any).__DSLINK_SHIPPING__ = {
    SHIPPING_COUNTRIES,
    calculateShipping,
    isCODAvailable,
    isCarrierSupported,
    getCarriersForCountry,
    getCountryConfig,
    getCompactShippingNotice,
    getSavedShippingCountry,
    setGlobalShippingCountry,
  };
}

export function useSelectedShippingCountry(initialCountry?: string) {
  const [countryCode, setCountryCodeState] = useState<string>(() =>
    initialCountry ? normalizeCountryCode(initialCountry) : getSavedShippingCountry()
  );

  useEffect(() => {
    const handler = (ev: Event) => {
      const next = (ev as CustomEvent<string>).detail || getSavedShippingCountry();
      setCountryCodeState(normalizeCountryCode(next));
    };
    window.addEventListener(SHIPPING_COUNTRY_EVENT, handler);
    return () => window.removeEventListener(SHIPPING_COUNTRY_EVENT, handler);
  }, []);

  const setCountryCode = useCallback((next: string) => {
    const normalized = setGlobalShippingCountry(next);
    setCountryCodeState(normalized);
  }, []);

  const countryConfig = getCountryConfig(countryCode);

  return {
    countryCode,
    setCountryCode,
    countryConfig,
    shippingFeeBdt: calculateShipping(countryCode),
    codAvailable: isCODAvailable(countryCode),
    carrierAvailable: isCarrierSupported(countryCode),
    carriers: getCarriersForCountry(countryCode),
  };
}
