import type { AppLanguage } from './i18n';

/**
 * Codes that proxies/CDNs sometimes emit when geolocation is unavailable,
 * anonymous (Tor), or regional rather than a sovereign/territory ISO-3166-1 alpha-2 country.
 */
const INVALID_COUNTRY_SENTINELS = new Set([
  'XX',
  'ZZ',
  'T1',
  'A1',
  'A2',
  'O1',
  'EU',
  'UN',
  'QO',
  'EZ',
  'XA',
  'XB',
  'AN',
  'AP',
]);

const displayNameCache = new Map<string, Intl.DisplayNames | null>();

function getRegionDisplayNames(localeTag: string): Intl.DisplayNames | null {
  if (displayNameCache.has(localeTag)) {
    return displayNameCache.get(localeTag) || null;
  }
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.DisplayNames === 'function') {
      const dn = new Intl.DisplayNames([localeTag], { type: 'region' });
      displayNameCache.set(localeTag, dn);
      return dn;
    }
  } catch {
    // Fallback below
  }
  displayNameCache.set(localeTag, null);
  return null;
}

/**
 * Curated fallback English names for common ISO-3166-1 alpha-2 codes
 * in case Intl.DisplayNames is unavailable in an older runtime.
 */
const FALLBACK_EN_COUNTRIES: Record<string, string> = {
  BD: 'Bangladesh',
  US: 'the USA',
  MM: 'Myanmar',
  CN: 'China',
  GB: 'the United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  JP: 'Japan',
  KR: 'South Korea',
  TH: 'Thailand',
  IN: 'India',
  SG: 'Singapore',
  MY: 'Malaysia',
  ID: 'Indonesia',
  VN: 'Vietnam',
  PH: 'the Philippines',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  DE: 'Germany',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'the Netherlands',
  TR: 'Türkiye',
  RU: 'Russia',
  UA: 'Ukraine',
  AE: 'the United Arab Emirates',
  SA: 'Saudi Arabia',
  QA: 'Qatar',
  BR: 'Brazil',
  ZA: 'South Africa',
  BA: 'Bosnia and Herzegovina',
  PK: 'Pakistan',
  NP: 'Nepal',
  LK: 'Sri Lanka',
  KH: 'Cambodia',
  LA: 'Laos',
};

/**
 * Validates and normalizes an ISO-3166-1 alpha-2 country code.
 * Returns null if the code is missing, malformed, a sentinel value (XX/T1/ZZ),
 * or not a recognized ISO region code.
 */
export function normalizeValidIsoCountry(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  if (INVALID_COUNTRY_SENTINELS.has(code)) return null;

  if (FALLBACK_EN_COUNTRIES[code]) return code;

  const enNames = getRegionDisplayNames('en');
  if (enNames) {
    try {
      const resolved = enNames.of(code);
      if (resolved && resolved.toUpperCase() !== code && !/unknown region/i.test(resolved)) {
        return code;
      }
      return null;
    } catch {
      return null;
    }
  }

  return null;
}

export interface HeroCountryOrder {
  /** Validated ISO-3166-1 alpha-2 visitor country code, or null when unknown/invalid */
  visitorCountryCode: string | null;
  /** True for BD, US, or missing/invalid country */
  isDefaultVariant: boolean;
  /** First country shown in heading & shipping description */
  primaryCountryCode: string;
  /** Second country shown in heading & shipping description */
  secondaryCountryCode: string;
}

/**
 * Single shared country ordering rule for both the homepage hero heading
 * and the hero shipping description:
 * - BD, US, missing, or invalid -> (BD, US)
 * - MM -> (MM, BD)
 * - CN -> (CN, BD)
 * - Any other valid ISO country X -> (X, BD)
 */
export function resolveHeroCountryOrder(countryCode?: string | null): HeroCountryOrder {
  const valid = normalizeValidIsoCountry(countryCode);
  if (!valid || valid === 'BD' || valid === 'US') {
    return {
      visitorCountryCode: valid,
      isDefaultVariant: true,
      primaryCountryCode: 'BD',
      secondaryCountryCode: 'US',
    };
  }

  return {
    visitorCountryCode: valid,
    isDefaultVariant: false,
    primaryCountryCode: valid,
    secondaryCountryCode: 'BD',
  };
}

/**
 * Exact curated localized names for key countries so grammar and script
 * match natural localized phrasing (e.g. "the USA", "Myanmar", "মিয়ানমার").
 */
const CURATED_COUNTRY_NAMES: Partial<Record<AppLanguage, Record<string, string>>> = {
  en: {
    BD: 'Bangladesh',
    US: 'the USA',
    MM: 'Myanmar',
    CN: 'China',
    GB: 'the United Kingdom',
    AE: 'the United Arab Emirates',
    NL: 'the Netherlands',
    PH: 'the Philippines',
    HK: 'Hong Kong',
    TW: 'Taiwan',
    MO: 'Macau',
    CD: 'the Democratic Republic of the Congo',
    CG: 'the Republic of the Congo',
    KR: 'South Korea',
  },
  bn: {
    BD: 'বাংলাদেশ',
    US: 'যুক্তরাষ্ট্র',
    MM: 'মিয়ানমার',
    CN: 'চীন',
    GB: 'যুক্তরাজ্য',
    AE: 'সংযুক্ত আরব আমিরাত',
    JP: 'জাপান',
    DE: 'জার্মানি',
    TH: 'থাইল্যান্ড',
    IN: 'ভারত',
    SG: 'সিঙ্গাপুর',
    MY: 'মালয়েশিয়া',
    BA: 'বসনিয়া ও হার্জেগোভিনা',
    CA: 'কানাডা',
    AU: 'অস্ট্রেলিয়া',
  },
  my: {
    BD: 'ဘင်္ဂလားဒေ့ရှ်',
    US: 'အမေရိကန်',
    MM: 'မြန်မာ',
    CN: 'တရုတ်',
    TH: 'ထိုင်း',
    SG: 'စင်ကာပူ',
    JP: 'ဂျပန်',
    GB: 'ယူကေ',
    DE: 'ဂျာမနီ',
    IN: 'အိန္ဒိယ',
  },
  'zh-CN': {
    BD: '孟加拉国',
    US: '美国',
    MM: '缅甸',
    CN: '中国',
    HK: '中国香港',
    TW: '中国台湾',
    JP: '日本',
    GB: '英国',
    DE: '德国',
    TH: '泰国',
    SG: '新加坡',
  },
  'zh-TW': {
    BD: '孟加拉',
    US: '美國',
    MM: '緬甸',
    CN: '中國',
  },
  ru: {
    BD: 'Бангладеш',
    US: 'США',
    MM: 'Мьянма',
    CN: 'Китай',
  },
  uk: {
    BD: 'Бангладеш',
    US: 'США',
    MM: 'Мʼянма',
    CN: 'Китай',
  },
  th: {
    BD: 'บังกลาเทศ',
    US: 'สหรัฐอเมริกา',
    MM: 'เมียนมา',
    CN: 'จีน',
  },
  ko: {
    BD: '방글라데시',
    US: '미국',
    MM: '미얀마',
    CN: '중국',
  },
  hi: {
    BD: 'बांग्लादेश',
    US: 'अमेरिका',
    MM: 'म्यांमार',
    CN: 'चीन',
  },
  ar: {
    BD: 'بنغلاديش',
    US: 'الولايات المتحدة',
    MM: 'ميانمار',
    CN: 'الصين',
  },
  fr: {
    BD: 'Bangladesh',
    US: 'États-Unis',
    MM: 'Myanmar',
    CN: 'Chine',
  },
  de: {
    BD: 'Bangladesch',
    US: 'den USA',
    MM: 'Myanmar',
    CN: 'China',
  },
  es: {
    BD: 'Bangladés',
    US: 'Estados Unidos',
    MM: 'Myanmar',
    CN: 'China',
  },
  pt: {
    BD: 'Bangladesh',
    US: 'Estados Unidos',
    MM: 'Mianmar',
    CN: 'China',
  },
  ja: {
    BD: 'バングラデシュ',
    US: 'アメリカ',
    MM: 'ミャンマー',
    CN: '中国',
  },
  ms: {
    BD: 'Bangladesh',
    US: 'Amerika Syarikat',
    MM: 'Myanmar',
    CN: 'China',
  },
  id: {
    BD: 'Bangladesh',
    US: 'Amerika Serikat',
    MM: 'Myanmar',
    CN: 'Tiongkok',
  },
  tr: {
    BD: 'Bangladeş',
    US: 'ABD',
    MM: 'Myanmar',
    CN: 'Çin',
  },
  it: {
    BD: 'Bangladesh',
    US: 'Stati Uniti',
    MM: 'Myanmar',
    CN: 'Cina',
  },
  vi: {
    BD: 'Bangladesh',
    US: 'Hoa Kỳ',
    MM: 'Myanmar',
    CN: 'Trung Quốc',
  },
};

const INTL_LOCALE_TAG: Record<AppLanguage, string> = {
  en: 'en',
  bn: 'bn',
  my: 'my',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  ru: 'ru',
  uk: 'uk',
  th: 'th',
  ko: 'ko',
  hi: 'hi',
  ar: 'ar',
  fr: 'fr',
  de: 'de',
  es: 'es',
  pt: 'pt',
  ja: 'ja',
  ms: 'ms',
  id: 'id',
  tr: 'tr',
  it: 'it',
  vi: 'vi',
};

/**
 * Resolves a localized country name for any valid ISO-3166-1 alpha-2 country code.
 */
export function getLocalizedCountryName(countryCode: string, lang: AppLanguage): string {
  const code = countryCode.toUpperCase().trim();
  const curated = CURATED_COUNTRY_NAMES[lang]?.[code];
  if (curated) return curated;

  const intlTag = INTL_LOCALE_TAG[lang] || 'en';
  const dn = getRegionDisplayNames(intlTag);
  if (dn) {
    try {
      const name = dn.of(code);
      if (name && name.toUpperCase() !== code) {
        // Clean parenthetical aliases like "Myanmar (Burma)" -> "Myanmar"
        return name.replace(/\s*\(Burma\)$/i, '').trim();
      }
    } catch {
      // fall through
    }
  }

  return (
    CURATED_COUNTRY_NAMES.en?.[code] ||
    FALLBACK_EN_COUNTRIES[code] ||
    code
  );
}

export interface HeroGeoCopy {
  order: HeroCountryOrder;
  primaryCountryName: string;
  secondaryCountryName: string;
  heading: string;
  description: string;
  serviceLine: string;
  worldwideNote: string;
  legalLabel: string;
  supportLabel: string;
  rentalCardTitle: string;
  rentalCardSub: string;
  standardCardTitle: string;
  miniCardTitle: string;
  purchaseCardSub: string;
}

interface HeroLanguageTemplate {
  heading: (primary: string, secondary: string) => string;
  description: (primary: string, secondary: string) => string;
  serviceLine: string;
  worldwideNote: string;
  legalLabel: string;
  supportLabel: string;
  rentalCardTitle: string;
  rentalCardSub: string;
  standardCardTitle: string;
  miniCardTitle: string;
  purchaseCardSub: string;
}

const HERO_TEMPLATES: Record<AppLanguage, HeroLanguageTemplate> = {
  en: {
    heading: (p, s) => `Starlink Kits in ${p}, ${s}, and Worldwide`,
    description: (p, s) =>
      `Order Starlink Standard Kit 4X and Starlink Mini Kit from DSLink. Contact us for shipping details for ${p}, ${s}, and other destinations, or for setup and technical support.`,
    serviceLine:
      'Kit purchases, Starlink rentals, and monthly bill payment support available.',
    worldwideNote:
      '“Worldwide” refers to Starlink kit shipping. Starlink activation and roaming availability depend on the destination country and service plan.',
    legalLabel: 'Legal & Policies',
    supportLabel: 'Support',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'One-Time Charge · Monthly Plan Separate',
    standardCardTitle: 'Standard Kit 4X (Purchase)',
    miniCardTitle: 'Starlink Mini Kit (Purchase)',
    purchaseCardSub: 'Global Delivery · Eligible-Area COD',
  },
  bn: {
    heading: (p, s) => `${p}, ${s}সহ বিশ্বব্যাপী Starlink কিট`,
    description: (p, s) =>
      `DSLink থেকে Starlink Standard Kit 4X ও Starlink Mini Kit অর্ডার করুন। ${p}, ${s}সহ অন্যান্য দেশে শিপিং তথ্য কিংবা সেটআপ ও টেকনিক্যাল সাপোর্টের জন্য আমাদের সাথে যোগাযোগ করুন।`,
    serviceLine:
      'কিট ক্রয়, স্টারলিংক রেন্টাল এবং মাসিক বিল পেমেন্ট সাপোর্ট পাওয়া যায়।',
    worldwideNote:
      '“বিশ্বব্যাপী” বলতে Starlink কিট শিপিং বোঝায়। Starlink অ্যাক্টিভেশন ও রোমিং সুবিধা গন্তব্য দেশ এবং সার্ভিস প্ল্যানের ওপর নির্ভর করে।',
    legalLabel: 'লিগ্যাল ও নীতিমালা',
    supportLabel: 'সাপোর্ট',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'One-Time Charge · মাসিক সাবস্ক্রিপশন আলাদা',
    standardCardTitle: 'Standard Kit 4X (Purchase)',
    miniCardTitle: 'Starlink Mini Kit (Purchase)',
    purchaseCardSub: 'Global Delivery · প্রযোজ্য এলাকায় COD',
  },
  my: {
    heading: (p, s) => `${p}၊ ${s}နှင့် ကမ္ဘာတစ်ဝှမ်း Starlink Kit များ`,
    description: (p, s) =>
      `DSLink မှ Starlink Standard Kit 4X နှင့် Starlink Mini Kit များကို မှာယူနိုင်ပါသည်။ ${p}၊ ${s}နှင့် အခြားနိုင်ငံများသို့ ပို့ဆောင်ရေးအသေးစိတ် သို့မဟုတ် တပ်ဆင်ခြင်းနှင့် နည်းပညာအကူအညီအတွက် ကျွန်ုပ်တို့ထံ ဆက်သွယ်ပါ။`,
    serviceLine:
      'Starlink Kit ဝယ်ယူခြင်း၊ ငှားရမ်းခြင်းနှင့် လစဉ်ဘေလ်ပေးချေမှု အကူအညီများ ရရှိနိုင်ပါသည်။',
    worldwideNote:
      '“ကမ္ဘာတစ်ဝှမ်း” ဆိုသည်မှာ Starlink Kit ပို့ဆောင်ရေးကို ဆိုလိုပါသည်။ Starlink Activation နှင့် Roaming ရရှိနိုင်မှုသည် ပို့ဆောင်မည့်နိုင်ငံနှင့် ပက်ကေ့ချ်ပေါ် မူတည်ပါသည်။',
    legalLabel: 'ဥပဒေနှင့် မူဝါဒများ',
    supportLabel: 'အကူအညီ',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'တစ်ကြိမ်ကြေး · လစဉ်ကြေး သီးခြား',
    standardCardTitle: 'Standard Kit 4X (ဝယ်ယူရန်)',
    miniCardTitle: 'Starlink Mini Kit (ဝယ်ယူရန်)',
    purchaseCardSub: 'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး · COD (သတ်မှတ်ဒေသ)',
  },
  'zh-CN': {
    heading: (p, s) => `${p}、${s}及全球 Starlink 套件`,
    description: (p, s) =>
      `通过 DSLink 订购 Starlink Standard Kit 4X 和 Starlink Mini Kit。如需了解寄往${p}、${s}及其他目的地的配送详情，或获取安装与技术支持，请联系我们。`,
    serviceLine: '提供 Starlink 套件购买、设备租赁及月度账单代付支持。',
    worldwideNote:
      '“全球”仅指 Starlink 硬件套件配送。Starlink 激活及漫游可用性取决于目的地国家/地区及所选服务套餐。',
    legalLabel: '法律与政策',
    supportLabel: '技术支持',
    rentalCardTitle: 'Starlink 租赁套件',
    rentalCardSub: '一次性费用 · 月度订阅另计',
    standardCardTitle: 'Standard Kit 4X（购买）',
    miniCardTitle: 'Starlink Mini Kit（购买）',
    purchaseCardSub: '全球配送 · 指定地区支持货到付款',
  },
  'zh-TW': {
    heading: (p, s) => `${p}、${s}及全球 Starlink 套件`,
    description: (p, s) =>
      `透過 DSLink 訂購 Starlink Standard Kit 4X 與 Starlink Mini Kit。如需了解寄往${p}、${s}及其他目的地的配送詳情，或取得安裝與技術支援，請聯繫我們。`,
    serviceLine: '提供 Starlink 套件購買、設備租賃與月度帳單代付支援。',
    worldwideNote:
      '「全球」僅指 Starlink 套件配送。Starlink 啟用與漫遊可用性取決於目的地與服務方案。',
    legalLabel: '法律與政策',
    supportLabel: '支援服務',
    rentalCardTitle: 'Starlink 租賃套件',
    rentalCardSub: '一次性費用 · 月費另計',
    standardCardTitle: 'Standard Kit 4X（購買）',
    miniCardTitle: 'Starlink Mini Kit（購買）',
    purchaseCardSub: '全球配送 · 指定地區貨到付款',
  },
  ru: {
    heading: (p, s) => `Комплекты Starlink: ${p}, ${s} и весь мир`,
    description: (p, s) =>
      `Закажите Starlink Standard Kit 4X и Starlink Mini Kit в DSLink. Свяжитесь с нами для уточнения доставки в ${p}, ${s} и другие страны, а также по вопросам настройки и техподдержки.`,
    serviceLine: 'Доступны покупка комплектов, аренда Starlink и помощь с ежемесячной оплатой счетов.',
    worldwideNote:
      '«По всему миру» относится к доставке оборудования. Активация Starlink и роуминг зависят от страны назначения и тарифа.',
    legalLabel: 'Политики',
    supportLabel: 'Поддержка',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Разовый платеж · Подписка отдельно',
    standardCardTitle: 'Standard Kit 4X (Покупка)',
    miniCardTitle: 'Starlink Mini Kit (Покупка)',
    purchaseCardSub: 'Доставка по миру · COD в доступных зонах',
  },
  uk: {
    heading: (p, s) => `Комплекти Starlink: ${p}, ${s} та весь світ`,
    description: (p, s) =>
      `Замовте Starlink Standard Kit 4X та Starlink Mini Kit у DSLink. Зв’яжіться з нами щодо доставки в ${p}, ${s} та інші країни, а також для налаштування й техпідтримки.`,
    serviceLine: 'Доступні купівля комплектів, оренда Starlink і підтримка щомісячної оплати рахунків.',
    worldwideNote:
      '«По всьому світу» стосується доставки комплектів. Активація Starlink та роумінг залежать від країни призначення й тарифу.',
    legalLabel: 'Політики',
    supportLabel: 'Підтримка',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Одноразовий платіж · Підписка окремо',
    standardCardTitle: 'Standard Kit 4X (Купівля)',
    miniCardTitle: 'Starlink Mini Kit (Купівля)',
    purchaseCardSub: 'Світова доставка · COD у доступних зонах',
  },
  th: {
    heading: (p, s) => `ชุดอุปกรณ์ Starlink ใน${p} ${s} และทั่วโลก`,
    description: (p, s) =>
      `สั่งซื้อ Starlink Standard Kit 4X และ Starlink Mini Kit จาก DSLink ติดต่อเราเพื่อสอบถามรายละเอียดการจัดส่งไปยัง${p} ${s} และประเทศอื่นๆ รวมถึงการติดตั้งและบริการช่วยเหลือด้านเทคนิค`,
    serviceLine: 'บริการจำหน่ายชุดอุปกรณ์ ให้เช่า Starlink และช่วยชำระค่าบริการรายเดือน',
    worldwideNote:
      'คำว่า “ทั่วโลก” หมายถึงการจัดส่งชุดอุปกรณ์ Starlink การเปิดใช้งานและโรมมิ่งขึ้นอยู่กับประเทศปลายทางและแพ็กเกจ',
    legalLabel: 'นโยบาย',
    supportLabel: 'ช่วยเหลือ',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'ค่าบริการครั้งเดียว · แพ็กเกจรายเดือนแยกต่างหาก',
    standardCardTitle: 'Standard Kit 4X (ซื้อขาด)',
    miniCardTitle: 'Starlink Mini Kit (ซื้อขาด)',
    purchaseCardSub: 'จัดส่งทั่วโลก · COD ในพื้นที่ที่รองรับ',
  },
  ko: {
    heading: (p, s) => `${p}, ${s} 및 전 세계 Starlink 키트`,
    description: (p, s) =>
      `DSLink에서 Starlink Standard Kit 4X 및 Starlink Mini Kit를 주문하세요. ${p}, ${s} 및 기타 국가 배송 안내와 설치·기술 지원이 필요하시면 문의해 주세요.`,
    serviceLine: '키트 구매, Starlink 대여 및 월간 요금 결제 지원이 가능합니다.',
    worldwideNote:
      '“전 세계”는 Starlink 키트 배송을 의미합니다. Starlink 활성화 및 로밍 이용 가능 여부는 목적지 국가와 요금제에 따라 달라집니다.',
    legalLabel: '법률 및 정책',
    supportLabel: '고객 지원',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: '일회성 요금 · 월간 구독 별도',
    standardCardTitle: 'Standard Kit 4X (구매)',
    miniCardTitle: 'Starlink Mini Kit (구매)',
    purchaseCardSub: '전 세계 배송 · 일부 지역 COD',
  },
  hi: {
    heading: (p, s) => `${p}, ${s} और विश्वभर में Starlink किट`,
    description: (p, s) =>
      `DSLink से Starlink Standard Kit 4X और Starlink Mini Kit ऑर्डर करें। ${p}, ${s} और अन्य देशों में शिपिंग विवरण या सेटअप व तकनीकी सहायता के लिए हमसे संपर्क करें।`,
    serviceLine: 'किट खरीद, Starlink रेंटल और मासिक बिल भुगतान सहायता उपलब्ध है।',
    worldwideNote:
      '“विश्वभर” से तात्पर्य Starlink किट शिपिंग से है। Starlink एक्टिवेशन और रोमिंग उपलब्धता गंतव्य देश और प्लान पर निर्भर करती है।',
    legalLabel: 'नीतियाँ',
    supportLabel: 'सहायता',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'एकमुश्त शुल्क · मासिक प्लान अलग',
    standardCardTitle: 'Standard Kit 4X (खरीद)',
    miniCardTitle: 'Starlink Mini Kit (खरीद)',
    purchaseCardSub: 'ग्लोबल डिलीवरी · पात्र क्षेत्रों में COD',
  },
  ar: {
    heading: (p, s) => `أجهزة Starlink في ${p} و${s} وجميع أنحاء العالم`,
    description: (p, s) =>
      `اطلب Starlink Standard Kit 4X وStarlink Mini Kit من DSLink. تواصل معنا لمعرفة تفاصيل الشحن إلى ${p} و${s} والوجهات الأخرى، أو للحصول على دعم الإعداد والدعم الفني.`,
    serviceLine: 'متوفر شراء الأجهزة وتأجير Starlink ودعم سداد الفواتير الشهرية.',
    worldwideNote:
      'يشير مصطلح «جميع أنحاء العالم» إلى شحن الأجهزة فقط؛ ويعتمد تفعيل Starlink والتجوال على الدولة الوجهة والباقة.',
    legalLabel: 'السياسات',
    supportLabel: 'الدعم',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'رسوم لمرة واحدة · الاشتراك الشهري منفصل',
    standardCardTitle: 'Standard Kit 4X (شراء)',
    miniCardTitle: 'Starlink Mini Kit (شراء)',
    purchaseCardSub: 'شحن عالمي · الدفع عند الاستلام للمناطق المؤهلة',
  },
  fr: {
    heading: (p, s) => `Kits Starlink : ${p}, ${s} et dans le monde entier`,
    description: (p, s) =>
      `Commandez le Starlink Standard Kit 4X et le Starlink Mini Kit chez DSLink. Contactez-nous pour les détails d’expédition vers ${p}, ${s} et d’autres destinations, ou pour l’installation et le support technique.`,
    serviceLine: 'Achat de kits, location Starlink et assistance au paiement des factures mensuelles disponibles.',
    worldwideNote:
      '« Dans le monde entier » désigne l’expédition du matériel. L’activation Starlink et l’itinérance dépendent du pays de destination et du forfait.',
    legalLabel: 'Mentions légales',
    supportLabel: 'Support',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Frais uniques · Abonnement mensuel séparé',
    standardCardTitle: 'Standard Kit 4X (Achat)',
    miniCardTitle: 'Starlink Mini Kit (Achat)',
    purchaseCardSub: 'Livraison mondiale · COD en zones éligibles',
  },
  de: {
    heading: (p, s) => `Starlink-Kits in ${p}, ${s} und weltweit`,
    description: (p, s) =>
      `Bestellen Sie das Starlink Standard Kit 4X und das Starlink Mini Kit bei DSLink. Kontaktieren Sie uns für Versanddetails nach ${p}, ${s} und andere Ziele sowie für Einrichtung und technischen Support.`,
    serviceLine: 'Kit-Kauf, Starlink-Miete und Unterstützung bei monatlichen Rechnungszahlungen verfügbar.',
    worldwideNote:
      '„Weltweit“ bezieht sich auf den Versand der Hardware-Kits. Aktivierung und Roaming von Starlink hängen vom Zielland und Tarif ab.',
    legalLabel: 'Rechtliches',
    supportLabel: 'Support',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Einmalige Gebühr · Monatlicher Tarif separat',
    standardCardTitle: 'Standard Kit 4X (Kauf)',
    miniCardTitle: 'Starlink Mini Kit (Kauf)',
    purchaseCardSub: 'Weltweiter Versand · COD in berechtigten Gebieten',
  },
  es: {
    heading: (p, s) => `Kits Starlink en ${p}, ${s} y en todo el mundo`,
    description: (p, s) =>
      `Pide Starlink Standard Kit 4X y Starlink Mini Kit en DSLink. Contáctanos para conocer detalles de envío a ${p}, ${s} y otros destinos, o para configuración y soporte técnico.`,
    serviceLine: 'Compra de kits, alquiler de Starlink y soporte para pagos mensuales disponibles.',
    worldwideNote:
      '«En todo el mundo» se refiere al envío del hardware. La activación de Starlink y el roaming dependen del país de destino y del plan.',
    legalLabel: 'Políticas',
    supportLabel: 'Soporte',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Cargo único · Plan mensual por separado',
    standardCardTitle: 'Standard Kit 4X (Compra)',
    miniCardTitle: 'Starlink Mini Kit (Compra)',
    purchaseCardSub: 'Envío global · COD en zonas elegibles',
  },
  pt: {
    heading: (p, s) => `Kits Starlink em ${p}, ${s} e no mundo todo`,
    description: (p, s) =>
      `Peça Starlink Standard Kit 4X e Starlink Mini Kit na DSLink. Fale conosco para detalhes de envio para ${p}, ${s} e outros destinos, ou para configuração e suporte técnico.`,
    serviceLine: 'Compra de kits, aluguel Starlink e suporte para pagamento de faturas mensais disponíveis.',
    worldwideNote:
      '“No mundo todo” refere-se ao envio dos kits. A ativação do Starlink e o roaming dependem do país de destino e do plano.',
    legalLabel: 'Políticas',
    supportLabel: 'Suporte',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Taxa única · Assinatura mensal separada',
    standardCardTitle: 'Standard Kit 4X (Compra)',
    miniCardTitle: 'Starlink Mini Kit (Compra)',
    purchaseCardSub: 'Entrega global · COD em áreas elegíveis',
  },
  ja: {
    heading: (p, s) => `${p}・${s}・世界対応 Starlink キット`,
    description: (p, s) =>
      `DSLinkでStarlink Standard Kit 4XおよびStarlink Mini Kitをご注文いただけます。${p}、${s}、その他地域への配送詳細や設置・技術サポートについてはお問い合わせください。`,
    serviceLine: 'キット購入、Starlinkレンタル、月額料金支払いサポートに対応しています。',
    worldwideNote:
      '「世界対応」はStarlinkキットの配送を指します。Starlinkのアクティベーションやローミングの可否は配送先の国とプランにより異なります。',
    legalLabel: 'ポリシー',
    supportLabel: 'サポート',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: '一回払い · 月額プラン別',
    standardCardTitle: 'Standard Kit 4X（購入）',
    miniCardTitle: 'Starlink Mini Kit（購入）',
    purchaseCardSub: '海外配送対応 · 対象地域COD可',
  },
  ms: {
    heading: (p, s) => `Kit Starlink di ${p}, ${s} dan Seluruh Dunia`,
    description: (p, s) =>
      `Tempah Starlink Standard Kit 4X dan Starlink Mini Kit daripada DSLink. Hubungi kami untuk maklumat penghantaran ke ${p}, ${s} dan destinasi lain, atau untuk bantuan pemasangan dan teknikal.`,
    serviceLine: 'Pembelian kit, sewaan Starlink dan sokongan pembayaran bil bulanan tersedia.',
    worldwideNote:
      '“Seluruh dunia” merujuk kepada penghantaran kit Starlink. Pengaktifan dan perayauan Starlink bergantung pada negara destinasi dan pelan.',
    legalLabel: 'Polisi',
    supportLabel: 'Sokongan',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Caj Sekali · Pelan Bulanan Berasingan',
    standardCardTitle: 'Standard Kit 4X (Beli)',
    miniCardTitle: 'Starlink Mini Kit (Beli)',
    purchaseCardSub: 'Penghantaran Global · COD Kawasan Layak',
  },
  id: {
    heading: (p, s) => `Kit Starlink di ${p}, ${s}, dan Seluruh Dunia`,
    description: (p, s) =>
      `Pesan Starlink Standard Kit 4X dan Starlink Mini Kit dari DSLink. Hubungi kami untuk detail pengiriman ke ${p}, ${s}, dan tujuan lainnya, atau untuk bantuan instalasi dan dukungan teknis.`,
    serviceLine: 'Tersedia pembelian kit, sewa Starlink, dan dukungan pembayaran tagihan bulanan.',
    worldwideNote:
      '“Seluruh dunia” merujuk pada pengiriman kit Starlink. Aktivasi dan ketersediaan roaming Starlink bergantung pada negara tujuan dan paket.',
    legalLabel: 'Kebijakan',
    supportLabel: 'Dukungan',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Biaya Sekali · Paket Bulanan Terpisah',
    standardCardTitle: 'Standard Kit 4X (Beli)',
    miniCardTitle: 'Starlink Mini Kit (Beli)',
    purchaseCardSub: 'Pengiriman Global · COD Area Tertentu',
  },
  tr: {
    heading: (p, s) => `${p}, ${s} ve Dünya Çapında Starlink Kitleri`,
    description: (p, s) =>
      `DSLink üzerinden Starlink Standard Kit 4X ve Starlink Mini Kit sipariş edin. ${p}, ${s} ve diğer ülkelere gönderim detayları veya kurulum ve teknik destek için bizimle iletişime geçin.`,
    serviceLine: 'Kit satın alma, Starlink kiralama ve aylık fatura ödeme desteği mevcuttur.',
    worldwideNote:
      '“Dünya çapında” ifadesi Starlink donanım gönderimini belirtir. Starlink aktivasyonu ve roaming erişimi hedef ülkeye ve plana bağlıdır.',
    legalLabel: 'Politikalar',
    supportLabel: 'Destek',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Tek Seferlik Ücret · Aylık Plan Ayrı',
    standardCardTitle: 'Standard Kit 4X (Satın Al)',
    miniCardTitle: 'Starlink Mini Kit (Satın Al)',
    purchaseCardSub: 'Küresel Kargo · Uygun Bölgelerde COD',
  },
  it: {
    heading: (p, s) => `Kit Starlink in ${p}, ${s} e in tutto il mondo`,
    description: (p, s) =>
      `Ordina Starlink Standard Kit 4X e Starlink Mini Kit su DSLink. Contattaci per i dettagli di spedizione verso ${p}, ${s} e altre destinazioni, oppure per configurazione e supporto tecnico.`,
    serviceLine: 'Acquisto kit, noleggio Starlink e supporto per il pagamento delle fatture mensili disponibili.',
    worldwideNote:
      '«In tutto il mondo» si riferisce alla spedizione dei kit. L’attivazione Starlink e il roaming dipendono dal Paese di destinazione e dal piano.',
    legalLabel: 'Policy',
    supportLabel: 'Supporto',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Quota Una Tantum · Piano Mensile Separato',
    standardCardTitle: 'Standard Kit 4X (Acquisto)',
    miniCardTitle: 'Starlink Mini Kit (Acquisto)',
    purchaseCardSub: 'Spedizione Globale · COD Aree Idonee',
  },
  vi: {
    heading: (p, s) => `Bộ thiết bị Starlink tại ${p}, ${s} và Toàn cầu`,
    description: (p, s) =>
      `Đặt mua Starlink Standard Kit 4X và Starlink Mini Kit tại DSLink. Liên hệ chúng tôi để biết chi tiết vận chuyển tới ${p}, ${s} và các điểm đến khác, hoặc nhận hỗ trợ lắp đặt và kỹ thuật.`,
    serviceLine: 'Hỗ trợ mua bộ thiết bị, thuê Starlink và thanh toán cước hàng tháng.',
    worldwideNote:
      '“Toàn cầu” chỉ việc vận chuyển bộ thiết bị Starlink. Khả năng kích hoạt và chuyển vùng Starlink phụ thuộc vào quốc gia đích và gói cước.',
    legalLabel: 'Chính sách',
    supportLabel: 'Hỗ trợ',
    rentalCardTitle: 'Starlink Rental Kit',
    rentalCardSub: 'Phí một lần · Gói cước tháng riêng',
    standardCardTitle: 'Standard Kit 4X (Mua)',
    miniCardTitle: 'Starlink Mini Kit (Mua)',
    purchaseCardSub: 'Giao hàng toàn cầu · COD khu vực hỗ trợ',
  },
};

/**
 * Computes all country-aware homepage hero copy from a single shared country order mapping.
 */
export function getHeroGeoCopy(
  lang: AppLanguage,
  visitorCountryCode?: string | null
): HeroGeoCopy {
  const order = resolveHeroCountryOrder(visitorCountryCode);
  const template = HERO_TEMPLATES[lang] || HERO_TEMPLATES.en;
  const primaryCountryName = getLocalizedCountryName(order.primaryCountryCode, lang);
  const secondaryCountryName = getLocalizedCountryName(order.secondaryCountryCode, lang);

  return {
    order,
    primaryCountryName,
    secondaryCountryName,
    heading: template.heading(primaryCountryName, secondaryCountryName),
    description: template.description(primaryCountryName, secondaryCountryName),
    serviceLine: template.serviceLine,
    worldwideNote: template.worldwideNote,
    legalLabel: template.legalLabel,
    supportLabel: template.supportLabel,
    rentalCardTitle: template.rentalCardTitle,
    rentalCardSub: template.rentalCardSub,
    standardCardTitle: template.standardCardTitle,
    miniCardTitle: template.miniCardTitle,
    purchaseCardSub: template.purchaseCardSub,
  };
}
