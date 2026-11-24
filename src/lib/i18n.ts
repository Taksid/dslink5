import { resolveCurrencyFromCountry } from './currencyConfig';
import { normalizeCountryCode, SHIPPING_COUNTRY_MAP } from './shippingConfig';

export type AppLanguage =
  | 'en'
  | 'bn'
  | 'my'
  | 'ru'
  | 'uk'
  | 'zh-CN'
  | 'zh-TW'
  | 'th'
  | 'ko'
  | 'hi'
  | 'ar'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt'
  | 'ja'
  | 'ms'
  | 'id'
  | 'tr'
  | 'it'
  | 'vi';

export interface LanguageMetadata {
  code: AppLanguage;
  short: string;
  label: string;
  englishName: string;
  hreflang: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: LanguageMetadata[] = [
  { code: 'en', short: 'EN', label: 'English', englishName: 'English', hreflang: 'en', dir: 'ltr' },
  { code: 'bn', short: 'বাং', label: 'বাংলা', englishName: 'Bengali', hreflang: 'bn-BD', dir: 'ltr' },
  { code: 'my', short: 'မြန်', label: 'မြန်မာ', englishName: 'Burmese', hreflang: 'my-MM', dir: 'ltr' },
  { code: 'ru', short: 'RU', label: 'Русский', englishName: 'Russian', hreflang: 'ru-RU', dir: 'ltr' },
  { code: 'uk', short: 'UK', label: 'Українська', englishName: 'Ukrainian', hreflang: 'uk-UA', dir: 'ltr' },
  { code: 'zh-CN', short: '简体', label: '中文 (简体)', englishName: 'Chinese Simplified', hreflang: 'zh-CN', dir: 'ltr' },
  { code: 'zh-TW', short: '繁體', label: '中文 (繁體)', englishName: 'Chinese Traditional', hreflang: 'zh-HK', dir: 'ltr' },
  { code: 'th', short: 'TH', label: 'ไทย', englishName: 'Thai', hreflang: 'th-TH', dir: 'ltr' },
  { code: 'ko', short: 'KO', label: '한국어', englishName: 'Korean', hreflang: 'ko-KR', dir: 'ltr' },
  { code: 'hi', short: 'HI', label: 'हिन्दी', englishName: 'Hindi', hreflang: 'hi-IN', dir: 'ltr' },
  { code: 'ar', short: 'AR', label: 'العربية', englishName: 'Arabic', hreflang: 'ar', dir: 'rtl' },
  { code: 'fr', short: 'FR', label: 'Français', englishName: 'French', hreflang: 'fr', dir: 'ltr' },
  { code: 'de', short: 'DE', label: 'Deutsch', englishName: 'German', hreflang: 'de', dir: 'ltr' },
  { code: 'es', short: 'ES', label: 'Español', englishName: 'Spanish', hreflang: 'es', dir: 'ltr' },
  { code: 'pt', short: 'PT', label: 'Português', englishName: 'Portuguese', hreflang: 'pt', dir: 'ltr' },
  { code: 'ja', short: 'JA', label: '日本語', englishName: 'Japanese', hreflang: 'ja-JP', dir: 'ltr' },
  { code: 'ms', short: 'MS', label: 'Bahasa Melayu', englishName: 'Malay', hreflang: 'ms-MY', dir: 'ltr' },
  { code: 'id', short: 'ID', label: 'Bahasa Indonesia', englishName: 'Indonesian', hreflang: 'id-ID', dir: 'ltr' },
  { code: 'tr', short: 'TR', label: 'Türkçe', englishName: 'Turkish', hreflang: 'tr-TR', dir: 'ltr' },
  { code: 'it', short: 'IT', label: 'Italiano', englishName: 'Italian', hreflang: 'it-IT', dir: 'ltr' },
  { code: 'vi', short: 'VI', label: 'Tiếng Việt', englishName: 'Vietnamese', hreflang: 'vi-VN', dir: 'ltr' },
];

export const LANGUAGE_LABELS: Record<AppLanguage, LanguageMetadata> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l])
) as Record<AppLanguage, LanguageMetadata>;

const VALID_LANG_SET = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code));

export function normalizeAppLanguage(raw?: string | null): AppLanguage | null {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (VALID_LANG_SET.has(cleaned)) return cleaned as AppLanguage;
  const lower = cleaned.toLowerCase();
  if (lower === 'zh-cn' || lower === 'zh-hans' || lower === 'zh-sg' || lower === 'zh') return 'zh-CN';
  if (lower === 'zh-tw' || lower === 'zh-hk' || lower === 'zh-hant' || lower === 'zh-mo') return 'zh-TW';
  const base = lower.split(/[-_]/)[0];
  if (base === 'bn') return 'bn';
  if (base === 'my' || base === 'bur') return 'my';
  if (base === 'en') return 'en';
  if (base === 'ru') return 'ru';
  if (base === 'uk' || base === 'ua') return 'uk';
  if (base === 'th') return 'th';
  if (base === 'ko') return 'ko';
  if (base === 'hi') return 'hi';
  if (base === 'ar') return 'ar';
  if (base === 'fr') return 'fr';
  if (base === 'de') return 'de';
  if (base === 'es') return 'es';
  if (base === 'pt') return 'pt';
  if (base === 'ja') return 'ja';
  if (base === 'ms') return 'ms';
  if (base === 'id') return 'id';
  if (base === 'tr') return 'tr';
  if (base === 'it') return 'it';
  if (base === 'vi') return 'vi';
  return null;
}

export function detectLanguageFromBrowserList(languages?: readonly string[] | null): AppLanguage | null {
  if (!languages || languages.length === 0) return null;
  for (const tag of languages) {
    const matched = normalizeAppLanguage(tag);
    if (matched) return matched;
  }
  return null;
}

const COUNTRY_TO_LANGUAGE_FALLBACK: Record<string, AppLanguage> = {
  BD: 'bn',
  MM: 'my',
  CN: 'zh-CN',
  HK: 'zh-TW',
  TW: 'zh-TW',
  MO: 'zh-TW',
  TH: 'th',
  KR: 'ko',
  JP: 'ja',
  IN: 'hi',
  NP: 'hi',
  MY: 'ms',
  BN: 'ms',
  ID: 'id',
  VN: 'vi',
  RU: 'ru',
  BY: 'ru',
  KZ: 'ru',
  KG: 'ru',
  UA: 'uk',
  TR: 'tr',
  AZ: 'tr',
  DE: 'de',
  AT: 'de',
  CH: 'de',
  LI: 'de',
  FR: 'fr',
  BE: 'fr',
  LU: 'fr',
  MC: 'fr',
  SN: 'fr',
  CI: 'fr',
  CM: 'fr',
  IT: 'it',
  SM: 'it',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  CL: 'es',
  PE: 'es',
  VE: 'es',
  EC: 'es',
  GT: 'es',
  CU: 'es',
  BO: 'es',
  DO: 'es',
  HN: 'es',
  PY: 'es',
  SV: 'es',
  NI: 'es',
  CR: 'es',
  PA: 'es',
  UY: 'es',
  PT: 'pt',
  BR: 'pt',
  AO: 'pt',
  MZ: 'pt',
  AE: 'ar',
  SA: 'ar',
  QA: 'ar',
  KW: 'ar',
  OM: 'ar',
  BH: 'ar',
  EG: 'ar',
  JO: 'ar',
  LB: 'ar',
  IQ: 'ar',
  MA: 'ar',
  DZ: 'ar',
  TN: 'ar',
  LY: 'ar',
  SD: 'ar',
  YE: 'ar',
  SY: 'ar',
};

export function detectLanguageFromCountry(countryCode?: string | null): AppLanguage {
  if (!countryCode || countryCode === 'UNKNOWN') return 'en';
  const cc = normalizeCountryCode(countryCode);
  const country = SHIPPING_COUNTRY_MAP[cc];
  if (country?.defaultLanguage) {
    const normalized = normalizeAppLanguage(country.defaultLanguage);
    if (normalized) return normalized;
  }
  if (COUNTRY_TO_LANGUAGE_FALLBACK[cc]) {
    return COUNTRY_TO_LANGUAGE_FALLBACK[cc];
  }
  return 'en';
}

/**
 * Deterministic resolver enforcing Part 4 + Part 10.25 rules:
 * Language Priority:
 *   1. Manual selection
 *   2. Saved account preference
 *   3. Saved browser preference
 *   4. Browser default language (navigator.languages / navigator.language) — takes priority over IP!
 *   5. IP country fallback
 *   6. English fallback
 *
 * Currency Priority (completely independent of language!):
 *   1. Manual currency override
 *   2. Saved account currency
 *   3. Saved browser currency
 *   4. IP-detected country currency
 *   5. BDT fallback
 */
export function resolveLanguageAndCurrency(input: {
  manualLanguage?: string | null;
  accountLanguage?: string | null;
  savedLanguage?: string | null;
  browserLanguages?: readonly string[] | null;
  ipCountryCode?: string | null;
  manualCurrency?: string | null;
  accountCurrency?: string | null;
  savedCurrency?: string | null;
}): { language: AppLanguage; currency: string; dir: 'ltr' | 'rtl' } {
  const language: AppLanguage =
    normalizeAppLanguage(input.manualLanguage) ||
    normalizeAppLanguage(input.accountLanguage) ||
    normalizeAppLanguage(input.savedLanguage) ||
    detectLanguageFromBrowserList(input.browserLanguages) ||
    (input.ipCountryCode && input.ipCountryCode !== 'UNKNOWN'
      ? detectLanguageFromCountry(input.ipCountryCode)
      : null) ||
    'en';

  const currency =
    (input.manualCurrency && input.manualCurrency.toUpperCase()) ||
    (input.accountCurrency && input.accountCurrency.toUpperCase()) ||
    (input.savedCurrency && input.savedCurrency.toUpperCase()) ||
    resolveCurrencyFromCountry(input.ipCountryCode) ||
    'BDT';

  const dir = LANGUAGE_LABELS[language]?.dir || 'ltr';
  return { language, currency, dir };
}

export type TranslationKey =
  | 'hero.headline'
  | 'hero.subtitle'
  | 'hero.ctaBuy'
  | 'hero.ctaRent'
  | 'hero.ctaRoaming'
  | 'hero.ctaDelivery'
  | 'nav.home'
  | 'nav.kits'
  | 'nav.packages'
  | 'nav.rental'
  | 'nav.resell'
  | 'nav.roaming'
  | 'nav.delivery'
  | 'nav.warranty'
  | 'nav.legal'
  | 'nav.support'
  | 'nav.track'
  | 'nav.cart'
  | 'pricing.standard4x'
  | 'pricing.miniKit'
  | 'pricing.rentalKit'
  | 'pricing.oneTime'
  | 'pricing.subscriptionSeparate'
  | 'pricing.buyNow'
  | 'pricing.rentNow'
  | 'pricing.addToCart'
  | 'shipping.bdHeadline'
  | 'shipping.bdCompact'
  | 'shipping.intlHeadline'
  | 'shipping.intlCompact'
  | 'shipping.selectCountry'
  | 'shipping.codAvailable'
  | 'shipping.prepaidOnly'
  | 'shipping.free'
  | 'warranty.title'
  | 'warranty.subtitle'
  | 'warranty.disclaimer'
  | 'refund.title'
  | 'refund.subtitle'
  | 'refund.rentalExcluded'
  | 'footer.language'
  | 'footer.country'
  | 'footer.currency'
  | 'footer.preferencesTitle'
  | 'legal.centerTitle'
  | 'legal.backToCenter'
  | 'legal.readDetails'
  | 'legal.searchPlaceholder'
  | 'company.operatedByPrefix'
  | 'company.operatedBySuffix'
  | 'company.aboutHeading'
  | 'company.aboutDescription'
  | 'company.visitButton';

const EN_DICT: Record<TranslationKey, string> = {
  'hero.headline': 'Starlink Kits in Bangladesh, Myanmar & Worldwide',
  'hero.subtitle':
    'Purchase Starlink Standard Kit 4X (৳41,500), Starlink Mini Kit (৳21,500), or rent a Starlink Kit (৳3,000 one-time). FREE delivery & COD across Bangladesh, DHL/FedEx worldwide shipping (৳2,500), 24-month DSLink replacement warranty, and 90-day roaming money-back guarantee.',
  'hero.ctaBuy': 'Buy Now',
  'hero.ctaRent': 'Rent Now',
  'hero.ctaRoaming': 'Explore Roaming',
  'hero.ctaDelivery': 'Worldwide Delivery',
  'nav.home': 'Home',
  'nav.kits': 'Starlink Kits',
  'nav.packages': 'Packages',
  'nav.rental': 'Rental',
  'nav.resell': 'Resell & Partner',
  'nav.roaming': 'Roaming',
  'nav.delivery': 'Worldwide Delivery',
  'nav.warranty': 'Warranty',
  'nav.legal': 'Legal',
  'nav.support': 'Support',
  'nav.track': 'Track Order',
  'nav.cart': 'Cart',
  'pricing.standard4x': 'Starlink Standard Kit 4X (Purchase)',
  'pricing.miniKit': 'Starlink Mini Kit (Purchase)',
  'pricing.rentalKit': 'Starlink Rental Kit',
  'pricing.oneTime': 'One-Time Charge',
  'pricing.subscriptionSeparate': 'Monthly Starlink subscriptions are charged separately.',
  'pricing.buyNow': 'Buy Now',
  'pricing.rentNow': 'Rent Now',
  'pricing.addToCart': 'Add to Cart',
  'shipping.bdHeadline': 'FREE Delivery Across Bangladesh | Cash on Delivery Available',
  'shipping.bdCompact': 'FREE Delivery (৳0) | COD Available | Steadfast / Pathao',
  'shipping.intlHeadline': 'Worldwide Delivery via DHL / FedEx — Shipping ৳2,500',
  'shipping.intlCompact': 'Worldwide Shipping ৳2,500 | DHL / FedEx | Prepaid Only',
  'shipping.selectCountry': 'Delivery Country',
  'shipping.codAvailable': 'Cash on Delivery (COD) Available',
  'shipping.prepaidOnly': 'Advance Payment Only (COD Not Available)',
  'shipping.free': 'FREE',
  'warranty.title': '24-Month DSLink Replacement Warranty — Purchase & Rental Kits',
  'warranty.subtitle':
    'Register your KIT serial number, verify eligibility, and request a replacement with photo/video evidence.',
  'warranty.disclaimer':
    'Provided directly by DSLink (DEV SPARK SOFT LIMITED) under DSLink warranty terms — separate from official SpaceX/Starlink manufacturer warranty.',
  'refund.title': '90-Day Roaming Money-Back Guarantee',
  'refund.subtitle':
    'Available exclusively for qualifying purchased Starlink Kits paired with an eligible DSLink roaming package.',
  'refund.rentalExcluded': 'Rental Kits are NOT eligible for the 90-Day Roaming Money-Back Guarantee.',
  'footer.language': 'Language',
  'footer.country': 'Country',
  'footer.currency': 'Currency',
  'footer.preferencesTitle': 'Region, Language & Currency',
  'legal.centerTitle': 'DevSparkSoft — Legal & Policies',
  'legal.backToCenter': 'Back to Legal Center',
  'legal.readDetails': 'Read Details',
  'legal.searchPlaceholder': 'Search policies, warranty, shipping, rental...',
  'company.operatedByPrefix': 'DSLink is operated by ',
  'company.operatedBySuffix': '.',
  'company.aboutHeading': 'About Dev Spark Soft Limited',
  'company.aboutDescription':
    'Dev Spark Soft Limited operates DSLink, a Bangladesh-based business offering Starlink kits and customer support.',
  'company.visitButton': 'Visit Dev Spark Soft Limited',
};

const PARTIAL_TRANSLATIONS: Partial<Record<AppLanguage, Partial<Record<TranslationKey, string>>>> = {
  bn: {
    'hero.headline': 'বাংলাদেশ, মিয়ানমার ও বিশ্বব্যাপী Starlink কিট',
    'hero.subtitle':
      'Starlink Standard Kit 4X (৳৪১,৫০০), Starlink Mini Kit (৳২১,৫০০) ক্রয় করুন অথবা Starlink Rental Kit (৳৩,০০০ এককালীন চার্জ) নিন। বাংলাদেশে ফ্রি ডেলিভারি ও COD, বিশ্বব্যাপী DHL/FedEx ডেলিভারি (৳২,৫০০), ২৪ মাসের রিপ্লেসমেন্ট ওয়ারেন্টি ও ৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি।',
    'hero.ctaBuy': 'এখনই কিনুন',
    'hero.ctaRent': 'রেন্টাল নিন',
    'hero.ctaRoaming': 'রোমিং প্যাকেজ',
    'hero.ctaDelivery': 'বিশ্বব্যাপী ডেলিভারি',
    'nav.home': 'হোম',
    'nav.kits': 'স্টারলিংক কিটস',
    'nav.packages': 'প্যাকেজসমূহ',
    'nav.rental': 'রেন্টাল',
    'nav.resell': 'রিসেল ও পার্টনার',
    'nav.roaming': 'রোমিং',
    'nav.delivery': 'গ্লোবাল ডেলিভারি',
    'nav.warranty': 'ওয়ারেন্টি',
    'nav.legal': 'নীতিমালা',
    'nav.support': 'সাপোর্ট',
    'nav.track': 'অর্ডার ট্র্যাক',
    'nav.cart': 'কার্ট',
    'pricing.standard4x': 'Starlink Standard Kit 4X (ক্রয়)',
    'pricing.miniKit': 'Starlink Mini Kit (ক্রয়)',
    'pricing.rentalKit': 'Starlink Rental Kit',
    'pricing.oneTime': 'এককালীন চার্জ',
    'pricing.subscriptionSeparate': 'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    'pricing.buyNow': 'এখনই কিনুন',
    'pricing.rentNow': 'রেন্ট করুন',
    'pricing.addToCart': 'কার্টে যোগ করুন',
    'shipping.bdHeadline': 'সারাদেশে ফ্রি ডেলিভারি (৳০) | ক্যাশ অন ডেলিভারি (COD) সুবিধা',
    'shipping.bdCompact': 'ফ্রি ডেলিভারি (৳০) | COD প্রযোজ্য | Steadfast / Pathao',
    'shipping.intlHeadline': 'বিশ্বব্যাপী DHL / FedEx ডেলিভারি — শিপিং ৳২,৫০০',
    'shipping.intlCompact': 'আন্তর্জাতিক শিপিং ৳২,৫০০ | DHL / FedEx | অগ্রিম পেমেন্ট',
    'shipping.selectCountry': 'ডেলিভারি দেশ নির্বাচন করুন',
    'shipping.codAvailable': 'ক্যাশ অন ডেলিভারি (COD) চালু আছে',
    'shipping.prepaidOnly': 'শুধুমাত্র অগ্রিম পেমেন্ট (COD প্রযোজ্য নয়)',
    'shipping.free': 'ফ্রি (৳০)',
    'warranty.title': '২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি — ক্রয় ও রেন্টাল কিট',
    'warranty.subtitle': 'আপনার KIT সিরিয়াল নম্বর রেজিস্টার ও যাচাই করুন এবং প্রমাণসহ রিপ্লেসমেন্ট আবেদন করুন।',
    'warranty.disclaimer': 'এটি DEV SPARK SOFT LIMITED (DSLink)-এর নিজস্ব রিপ্লেসমেন্ট ওয়ারেন্টি; অফিসিয়াল SpaceX/Starlink ম্যানুফ্যাকচারার ওয়ারেন্টি থেকে স্বতন্ত্র।',
    'refund.title': '৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি',
    'refund.subtitle': 'শুধুমাত্র যোগ্য ক্রয়কৃত Starlink Kit ও নির্ধারিত রোমিং প্যাকেজের জন্য প্রযোজ্য।',
    'refund.rentalExcluded': 'রেন্টাল কিট ৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টির আওতায় পড়ে না।',
    'footer.language': 'ভাষা (Language)',
    'footer.country': 'দেশ (Country)',
    'footer.currency': 'মুদ্রা (Currency)',
    'footer.preferencesTitle': 'অঞ্চল, ভাষা ও মুদ্রা',
    'legal.centerTitle': 'DevSparkSoft — লিগ্যাল ও নীতিমালা কেন্দ্র',
    'legal.backToCenter': 'লিগ্যাল সেন্টারে ফিরুন',
    'legal.readDetails': 'বিস্তারিত পড়ুন',
    'legal.searchPlaceholder': 'নীতিমালা, ওয়ারেন্টি, শিপিং বা রেন্টাল খুঁজুন...',
    'company.operatedByPrefix': 'DSLink পরিচালনা করে ',
    'company.operatedBySuffix': '।',
    'company.aboutHeading': 'Dev Spark Soft Limited সম্পর্কে',
    'company.aboutDescription':
      'Dev Spark Soft Limited পরিচালনা করে DSLink — বাংলাদেশভিত্তিক একটি প্রতিষ্ঠান যা Starlink কিট ও কাস্টমার সাপোর্ট প্রদান করে।',
    'company.visitButton': 'Dev Spark Soft Limited ভিজিট করুন',
  },
  my: {
    'hero.headline': 'ဘင်္ဂလားဒေ့ရှ်၊ မြန်မာနှင့် ကမ္ဘာတစ်ဝှမ်း Starlink Kit များ',
    'hero.subtitle':
      'Starlink Standard Kit 4X (৳41,500)၊ Starlink Mini Kit (৳21,500) ဝယ်ယူရန် သို့မဟုတ် Starlink Rental Kit (৳3,000 တစ်ကြိမ်ကြေး) ငှားရမ်းရန်။ မြန်မာနှင့် ကမ္ဘာတစ်ဝှမ်း DHL/FedEx ပို့ဆောင်ခ ৳2,500၊ ၂၄ လ အစားထိုးအာမခံနှင့် ရက် ၉၀ Roaming ငွေပြန်အမ်းအာမခံ။',
    'hero.ctaBuy': 'ယခုဝယ်ယူရန်',
    'hero.ctaRent': 'ငှားရမ်းရန်',
    'hero.ctaRoaming': 'Roaming ပက်ကေ့ချ်',
    'hero.ctaDelivery': 'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး',
    'nav.home': 'ပင်မစာမျက်နှာ',
    'nav.kits': 'Starlink စက်များ',
    'nav.packages': 'ပက်ကေ့ချ်များ',
    'nav.rental': 'ငှားရမ်းခြင်း',
    'nav.resell': 'Resell & Partner',
    'nav.roaming': 'Roaming',
    'nav.delivery': 'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး',
    'nav.warranty': 'အာမခံ',
    'nav.legal': 'မူဝါဒများ',
    'nav.support': 'အကူအညီ',
    'nav.track': 'မှာယူမှုစစ်ရန်',
    'nav.cart': 'ဈေးခြင်း',
    'pricing.buyNow': 'ဝယ်ယူရန်',
    'pricing.rentNow': 'ငှားရမ်းရန်',
    'pricing.addToCart': 'ဈေးခြင်းထဲထည့်ရန်',
    'shipping.selectCountry': 'ပို့ဆောင်မည့်နိုင်ငံ',
    'warranty.title': '၂၄ လ DSLink အစားထိုးအာမခံ — ဝယ်ယူမှုနှင့် ငှားရမ်းစက်များ',
    'refund.title': 'ရက် ၉၀ Roaming ငွေပြန်အမ်း အာမခံ',
    'footer.language': 'ဘာသာစကား',
    'footer.country': 'နိုင်ငံ',
    'footer.currency': 'ငွေကြေး',
    'footer.preferencesTitle': 'ဒေသ၊ ဘာသာစကားနှင့် ငွေကြေး',
    'legal.centerTitle': 'DevSparkSoft — ဥပဒေနှင့် မူဝါဒ စင်တာ',
    'legal.backToCenter': 'မူဝါဒ စင်တာသို့ ပြန်သွားရန်',
    'legal.readDetails': 'အသေးစိတ်ဖတ်ရန်',
    'company.operatedByPrefix': 'DSLink ကို ',
    'company.operatedBySuffix': ' မှ လည်ပတ်ဆောင်ရွက်ပါသည်။',
    'company.aboutHeading': 'Dev Spark Soft Limited အကြောင်း',
    'company.aboutDescription':
      'Dev Spark Soft Limited သည် Starlink စက်ပစ္စည်းများနှင့် ဖောက်သည်ဝန်ဆောင်မှုပေးသော ဘင်္ဂလားဒေ့ရှ်အခြေစိုက် DSLink ကို လည်ပတ်ဆောင်ရွက်ပါသည်။',
    'company.visitButton': 'Dev Spark Soft Limited ဝဘ်ဆိုက်သို့ ဝင်ရောက်ရန်',
  },
  ru: {
    'hero.headline': 'Комплекты Starlink в Бангладеш, Мьянме и по всему миру',
    'hero.subtitle':
      'Купите Starlink Standard Kit 4X (৳41,500), Starlink Mini Kit (৳21,500) или арендуйте комплект (৳3,000 разово). Международная доставка DHL / FedEx (৳2,500), 24-месячная гарантия замены DSLink и 90-дневная гарантия возврата средств для роуминга.',
    'hero.ctaBuy': 'Купить сейчас',
    'hero.ctaRent': 'Арендовать',
    'hero.ctaRoaming': 'Тарифы роуминга',
    'hero.ctaDelivery': 'Доставка по миру',
    'nav.home': 'Главная',
    'nav.kits': 'Комплекты Starlink',
    'nav.packages': 'Тарифы',
    'nav.rental': 'Аренда',
    'nav.roaming': 'Роуминг',
    'nav.delivery': 'Доставка',
    'nav.warranty': 'Гарантия',
    'nav.legal': 'Политики',
    'nav.support': 'Поддержка',
    'nav.track': 'Отследить заказ',
    'nav.cart': 'Корзина',
    'pricing.buyNow': 'Купить',
    'pricing.rentNow': 'Арендовать',
    'pricing.addToCart': 'В корзину',
    'shipping.selectCountry': 'Страна доставки',
    'shipping.prepaidOnly': 'Только предоплата (наложенный платеж недоступен)',
    'warranty.title': '24-месячная гарантия замены DSLink — Покупка и Аренда',
    'refund.title': '90-дневная гарантия возврата средств за роуминг',
    'refund.rentalExcluded': 'Арендованные комплекты НЕ подпадают под 90-дневную гарантию возврата средств.',
    'footer.language': 'Язык',
    'footer.country': 'Страна',
    'footer.currency': 'Валюта',
    'footer.preferencesTitle': 'Регион, язык и валюта',
    'legal.centerTitle': 'DevSparkSoft — Правовая информация и политики',
    'legal.backToCenter': 'Назад в правовой центр',
    'legal.readDetails': 'Подробнее',
    'legal.searchPlaceholder': 'Поиск политик, гарантии, доставки...',
  },
  uk: {
    'hero.headline': 'Комплекти Starlink у Бангладеш, Мʼянмі та по всьому світу',
    'hero.subtitle':
      'Придбайте Starlink Standard Kit 4X (৳41,500), Starlink Mini Kit (৳21,500) або орендуйте комплект (৳3,000 одноразово). Міжнародна доставка DHL / FedEx (৳2,500), 24-місячна гарантія заміни DSLink та 90-денна гарантія повернення коштів для роумінгу.',
    'hero.ctaBuy': 'Купити зараз',
    'hero.ctaRent': 'Орендувати',
    'hero.ctaRoaming': 'Роумінг-пакети',
    'hero.ctaDelivery': 'Світова доставка',
    'nav.home': 'Головна',
    'nav.kits': 'Комплекти Starlink',
    'nav.packages': 'Пакети',
    'nav.rental': 'Оренда',
    'nav.roaming': 'Роумінг',
    'nav.delivery': 'Доставка',
    'nav.warranty': 'Гарантія',
    'nav.legal': 'Політики',
    'nav.support': 'Підтримка',
    'nav.track': 'Відстежити замовлення',
    'nav.cart': 'Кошик',
    'pricing.buyNow': 'Купити',
    'pricing.rentNow': 'Орендувати',
    'pricing.addToCart': 'До кошика',
    'shipping.selectCountry': 'Країна доставки',
    'warranty.title': '24-місячна гарантія заміни DSLink — Покупка та Оренда',
    'refund.title': '90-денна гарантія повернення коштів за роумінг',
    'refund.rentalExcluded': 'Орендовані комплекти НЕ підпадають під 90-денну гарантію повернення коштів.',
    'footer.language': 'Мова',
    'footer.country': 'Країна',
    'footer.currency': 'Валюта',
    'footer.preferencesTitle': 'Регіон, мова та валюта',
    'legal.centerTitle': 'DevSparkSoft — Правовий центр і політики',
    'legal.backToCenter': 'Назад до правового центру',
    'legal.readDetails': 'Детальніше',
    'legal.searchPlaceholder': 'Пошук політик, гарантії, доставки...',
  },
  'zh-CN': {
    'hero.headline': '孟加拉国、缅甸及全球 Starlink 套件',
    'hero.subtitle':
      '购买 Starlink Standard Kit 4X (৳41,500)、Starlink Mini Kit (৳21,500) 或租赁套件 (৳3,000 一次性费用)。DHL / FedEx 全球直邮 (৳2,500)，24 个月 DSLink 更换保修及 90 天漫游退款保障。',
    'hero.ctaBuy': '立即购买',
    'hero.ctaRent': '立即租赁',
    'hero.ctaRoaming': '探索漫游套餐',
    'hero.ctaDelivery': '全球配送',
    'nav.home': '首页',
    'nav.kits': 'Starlink 套件',
    'nav.rental': '租赁',
    'nav.roaming': '漫游套餐',
    'nav.delivery': '全球配送',
    'nav.warranty': '保修',
    'nav.legal': '政策条款',
    'nav.support': '技术支持',
    'nav.cart': '购物车',
    'pricing.buyNow': '立即购买',
    'pricing.rentNow': '立即租赁',
    'pricing.addToCart': '加入购物车',
    'shipping.selectCountry': '配送国家/地区',
    'warranty.title': '24 个月 DSLink 更换保修 — 购买及租赁套件',
    'refund.title': '90 天漫游退款保障',
    'footer.language': '语言',
    'footer.country': '国家/地区',
    'footer.currency': '货币',
    'footer.preferencesTitle': '地区、语言与货币',
    'legal.centerTitle': 'DevSparkSoft — 法律与政策中心',
    'legal.backToCenter': '返回政策中心',
    'legal.readDetails': '查看详情',
  },
  'zh-TW': {
    'hero.headline': '孟加拉、緬甸及全球 Starlink 套件',
    'hero.ctaBuy': '立即購買',
    'hero.ctaRent': '立即租賃',
    'hero.ctaRoaming': '漫遊方案',
    'hero.ctaDelivery': '全球配送',
    'footer.language': '語言',
    'footer.country': '國家/地區',
    'footer.currency': '貨幣',
    'legal.centerTitle': 'DevSparkSoft — 法律與政策中心',
  },
  th: {
    'hero.headline': 'ชุดอุปกรณ์ Starlink ในบังกลาเทศ เมียนมา และทั่วโลก',
    'hero.ctaBuy': 'ซื้อเลย',
    'hero.ctaRent': 'เช่าชุดอุปกรณ์',
    'hero.ctaRoaming': 'แพ็กเกจโรมมิ่ง',
    'hero.ctaDelivery': 'จัดส่งทั่วโลก',
    'footer.language': 'ภาษา',
    'footer.country': 'ประเทศ',
    'footer.currency': 'สกุลเงิน',
    'legal.centerTitle': 'DevSparkSoft — ศูนย์กฎหมายและนโยบาย',
  },
  ko: {
    'hero.headline': '방글라데시, 미얀마 및 전 세계 Starlink 키트',
    'hero.ctaBuy': '지금 구매',
    'hero.ctaRent': '지금 대여',
    'hero.ctaRoaming': '로밍 요금제',
    'hero.ctaDelivery': '해외 배송',
    'footer.language': '언어',
    'footer.country': '국가',
    'footer.currency': '통화',
    'legal.centerTitle': 'DevSparkSoft — 법률 및 정책 센터',
  },
  hi: {
    'hero.headline': 'बांग्लादेश, म्यांमार और विश्वभर में Starlink किट',
    'hero.ctaBuy': 'अभी खरीदें',
    'hero.ctaRent': 'किराए पर लें',
    'hero.ctaRoaming': 'रोमिंग पैकेज',
    'hero.ctaDelivery': 'विश्वव्यापी डिलीवरी',
    'footer.language': 'भाषा',
    'footer.country': 'देश',
    'footer.currency': 'मुद्रा',
    'legal.centerTitle': 'DevSparkSoft — कानूनी और नीति केंद्र',
  },
  ar: {
    'hero.headline': 'أجهزة Starlink في بنغلاديش وميانمار وجميع أنحاء العالم',
    'hero.subtitle':
      'اشترِ Starlink Standard Kit 4X أو Starlink Mini Kit أو استأجر جهاز Starlink مع شحن عالمي عبر DHL / FedEx وضمان استبدال DSLink لمدة 24 شهراً.',
    'hero.ctaBuy': 'اشترِ الآن',
    'hero.ctaRent': 'استأجر الآن',
    'hero.ctaRoaming': 'باقات التجوال',
    'hero.ctaDelivery': 'الشحن العالمي',
    'nav.home': 'الرئيسية',
    'nav.kits': 'أجهزة Starlink',
    'nav.rental': 'التأجير',
    'nav.warranty': 'الضمان',
    'nav.legal': 'السياسات',
    'nav.support': 'الدعم',
    'nav.cart': 'السلة',
    'shipping.selectCountry': 'بلد التوصيل',
    'warranty.title': 'ضمان استبدال DSLink لمدة 24 شهراً — الشراء والتأجير',
    'refund.title': 'ضمان استرداد الأموال للتجوال لمدة 90 يوماً',
    'footer.language': 'اللغة',
    'footer.country': 'الدولة',
    'footer.currency': 'العملة',
    'footer.preferencesTitle': 'المنطقة واللغة والعملة',
    'legal.centerTitle': 'DevSparkSoft — مركز السياسات والقانون',
    'legal.backToCenter': 'العودة إلى مركز السياسات',
    'legal.readDetails': 'قراءة التفاصيل',
  },
  fr: {
    'hero.headline': 'Kits Starlink au Bangladesh, au Myanmar et dans le monde entier',
    'hero.ctaBuy': 'Acheter',
    'hero.ctaRent': 'Louer',
    'hero.ctaRoaming': 'Forfaits Itinérance',
    'hero.ctaDelivery': 'Livraison Mondiale',
    'footer.language': 'Langue',
    'footer.country': 'Pays',
    'footer.currency': 'Devise',
    'legal.centerTitle': 'DevSparkSoft — Mentions légales et politiques',
  },
  de: {
    'hero.headline': 'Starlink-Kits in Bangladesch, Myanmar & weltweit',
    'hero.ctaBuy': 'Jetzt kaufen',
    'hero.ctaRent': 'Jetzt mieten',
    'hero.ctaRoaming': 'Roaming-Pakete',
    'hero.ctaDelivery': 'Weltweiter Versand',
    'footer.language': 'Sprache',
    'footer.country': 'Land',
    'footer.currency': 'Währung',
    'legal.centerTitle': 'DevSparkSoft — Rechtliches & Richtlinien',
  },
  es: {
    'hero.headline': 'Kits Starlink en Bangladés, Myanmar y en todo el mundo',
    'hero.ctaBuy': 'Comprar ahora',
    'hero.ctaRent': 'Alquilar ahora',
    'hero.ctaRoaming': 'Planes de Roaming',
    'hero.ctaDelivery': 'Envío Mundial',
    'footer.language': 'Idioma',
    'footer.country': 'País',
    'footer.currency': 'Moneda',
    'legal.centerTitle': 'DevSparkSoft — Centro Legal y Políticas',
  },
  pt: {
    'hero.headline': 'Kits Starlink em Bangladesh, Mianmar e no mundo todo',
    'hero.ctaBuy': 'Comprar agora',
    'hero.ctaRent': 'Alugar agora',
    'hero.ctaRoaming': 'Planos de Roaming',
    'hero.ctaDelivery': 'Entrega Mundial',
    'footer.language': 'Idioma',
    'footer.country': 'País',
    'footer.currency': 'Moeda',
    'legal.centerTitle': 'DevSparkSoft — Centro Legal e Políticas',
  },
  ja: {
    'hero.headline': 'バングラデシュ・ミャンマー・世界対応 Starlink キット',
    'hero.ctaBuy': '今すぐ購入',
    'hero.ctaRent': 'レンタルする',
    'hero.ctaRoaming': 'ローミングプラン',
    'hero.ctaDelivery': '海外配送',
    'footer.language': '言語',
    'footer.country': '国・地域',
    'footer.currency': '通貨',
    'legal.centerTitle': 'DevSparkSoft — 規約・ポリシーセンター',
  },
  ms: {
    'hero.headline': 'Kit Starlink di Bangladesh, Myanmar & Seluruh Dunia',
    'hero.ctaBuy': 'Beli Sekarang',
    'hero.ctaRent': 'Sewa Sekarang',
    'hero.ctaRoaming': 'Pakej Perayauan',
    'hero.ctaDelivery': 'Penghantaran Seluruh Dunia',
    'footer.language': 'Bahasa',
    'footer.country': 'Negara',
    'footer.currency': 'Mata Wang',
  },
  id: {
    'hero.headline': 'Kit Starlink di Bangladesh, Myanmar & Seluruh Dunia',
    'hero.ctaBuy': 'Beli Sekarang',
    'hero.ctaRent': 'Sewa Sekarang',
    'hero.ctaRoaming': 'Paket Roaming',
    'hero.ctaDelivery': 'Pengiriman Global',
    'footer.language': 'Bahasa',
    'footer.country': 'Negara',
    'footer.currency': 'Mata Uang',
  },
  tr: {
    'hero.headline': 'Bangladeş, Myanmar ve Dünya Çapında Starlink Kitleri',
    'hero.ctaBuy': 'Hemen Satın Al',
    'hero.ctaRent': 'Hemen Kirala',
    'hero.ctaRoaming': 'Roaming Paketleri',
    'hero.ctaDelivery': 'Dünya Çapında Kargo',
    'footer.language': 'Dil',
    'footer.country': 'Ülke',
    'footer.currency': 'Para Birimi',
  },
  it: {
    'hero.headline': 'Kit Starlink in Bangladesh, Myanmar e in tutto il mondo',
    'hero.ctaBuy': 'Acquista ora',
    'hero.ctaRent': 'Noleggia ora',
    'hero.ctaRoaming': 'Piani Roaming',
    'hero.ctaDelivery': 'Spedizione Globale',
    'footer.language': 'Lingua',
    'footer.country': 'Paese',
    'footer.currency': 'Valuta',
  },
  vi: {
    'hero.headline': 'Bộ thiết bị Starlink tại Bangladesh, Myanmar & Toàn cầu',
    'hero.ctaBuy': 'Mua ngay',
    'hero.ctaRent': 'Thuê ngay',
    'hero.ctaRoaming': 'Gói Chuyển vùng',
    'hero.ctaDelivery': 'Giao hàng Toàn cầu',
    'footer.language': 'Ngôn ngữ',
    'footer.country': 'Quốc gia',
    'footer.currency': 'Tiền tệ',
  },
};

export function translateKey(lang: AppLanguage, key: TranslationKey, fallback?: string): string {
  return PARTIAL_TRANSLATIONS[lang]?.[key] || EN_DICT[key] || fallback || key;
}
