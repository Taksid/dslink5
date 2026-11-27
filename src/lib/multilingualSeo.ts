import { resolveLegalPolicyBySlug } from '../data/legalPolicies';
import { AppLanguage, LANGUAGE_LABELS, normalizeAppLanguage } from './i18n';
import {
  PUBLISHED_SEO_LOCALES,
  PublishedSeoLanguage,
  buildLocalePath,
  getPublishedLocaleConfig,
  isKnownSiteRoute,
  isPrivateOrNonIndexablePath,
  parseLocalePath,
} from './localeRouting';
import { DEFAULT_CENTRAL_PRODUCTS, formatBdt } from './pricingConfig';

export interface LocaleSeoMeta {
  code: AppLanguage;
  htmlLang: string;
  hreflang: string;
  shortHreflang: string;
  ogLocale: string;
  inLanguage: string;
  languageName: string;
}

export function getLocaleSeoMeta(lang: AppLanguage): LocaleSeoMeta {
  const pub = getPublishedLocaleConfig(lang);
  if (lang === 'en' || lang === 'bn' || lang === 'my' || lang === 'zh-CN') {
    return {
      code: pub.code,
      htmlLang: pub.htmlLang,
      hreflang: pub.hreflang,
      shortHreflang: pub.hreflang,
      ogLocale: pub.ogLocale,
      inLanguage: pub.hreflang,
      languageName: pub.englishName,
    };
  }
  const meta = LANGUAGE_LABELS[lang] || LANGUAGE_LABELS.en;
  return {
    code: meta.code,
    htmlLang: meta.code,
    hreflang: meta.hreflang,
    shortHreflang: meta.code.split('-')[0],
    ogLocale: 'en_US',
    inLanguage: meta.hreflang,
    languageName: meta.englishName,
  };
}

export interface HreflangEntry {
  hreflang: string;
  href: string;
}

export interface LocalizedRouteSeo {
  language: PublishedSeoLanguage;
  htmlLang: string;
  title: string;
  description: string;
  keywords: string;
  ogLocale: string;
  ogLocaleAlternates: string[];
  inLanguage: string;
  /** Locale-stripped base path (e.g. '/', '/rental') */
  basePath: string;
  /** Full canonical path including locale prefix (e.g. '/', '/bn', '/zh-hans/rental') */
  canonicalPath: string;
  /** Absolute self-referencing canonical URL */
  canonicalUrl: string;
  /** Reciprocal hreflang links for published live translations only, plus x-default */
  hreflangLinks: HreflangEntry[];
  isArticle: boolean;
  noindex: boolean;
}

export function normalizeSeoLanguage(lang?: string | null): PublishedSeoLanguage {
  const normalized = normalizeAppLanguage(lang);
  if (normalized === 'bn' || normalized === 'my' || normalized === 'zh-CN' || normalized === 'en') {
    return normalized;
  }
  return 'en';
}

/**
 * Builds reciprocal hreflang links ONLY for live, indexable, published translations
 * (en, bn, my, zh-Hans) plus x-default pointing to the default English URL.
 * Uses clean path-based canonical locale URLs — never query parameters or visitor IP.
 */
export function buildHreflangLinks(origin: string, canonicalBasePath: string): HreflangEntry[] {
  const cleanOrigin = origin.replace(/\/+$/, '');
  const { basePath } = parseLocalePath(canonicalBasePath);
  const normalizedBase = basePath === '/' ? '/' : basePath.replace(/\/+$/, '');

  const entries: HreflangEntry[] = PUBLISHED_SEO_LOCALES.map((loc) => {
    const localizedPath = buildLocalePath(normalizedBase, loc.code);
    return {
      hreflang: loc.hreflang,
      href: `${cleanOrigin}${localizedPath}`,
    };
  });

  const defaultPath = buildLocalePath(normalizedBase, 'en');
  entries.push({
    hreflang: 'x-default',
    href: `${cleanOrigin}${defaultPath}`,
  });

  return entries;
}

interface MultilingualSeoEntry {
  title: Record<PublishedSeoLanguage, string>;
  description: Record<PublishedSeoLanguage, string>;
  keywords: Record<PublishedSeoLanguage, string>;
  isArticle?: boolean;
}

const ROUTE_SEO_CATALOG: Record<string, MultilingualSeoEntry> = {
  home_dslink: {
    title: {
      en: 'DSLink — Starlink Kits in Bangladesh: Standard 4X, Starlink Mini & Rental',
      bn: 'DSLink — বাংলাদেশে Starlink কিট: Standard 4X, Starlink Mini ও রেন্টাল',
      my: 'DSLink — ဘင်္ဂလားဒေ့ရှ် Starlink Kit များ: Standard 4X၊ Starlink Mini နှင့် ငှားရမ်းခြင်း',
      'zh-CN': 'DSLink — 孟加拉国 Starlink 套件：Standard 4X、Starlink Mini 与租赁',
    },
    description: {
      en: 'Shop Starlink kits in Bangladesh from DSLink: Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 BD Residential / BDT 21,500 Global Roam), and Standard 4X Rental (BDT 3,000 one-time fee; monthly plan separate).',
      bn: 'DSLink থেকে বাংলাদেশে Starlink কিট অর্ডার করুন: Standard 4X (৳১২,৫০০ BD রেসিডেন্সিয়াল / ৳৪১,৫০০ USA Kit + Roam Unlimited), Starlink Mini (৳৯,৫০০ BD রেসিডেন্সিয়াল / ৳২১,৫০০ গ্লোবাল রোম) ও Standard 4X রেন্টাল (৳৩,০০০ এককালীন ফি; মাসিক প্ল্যান আলাদা)।',
      my: 'DSLink မှ Starlink Standard 4X (BDT 12,500 BD Residential / BDT 41,500 USA Kit + Roam Unlimited)၊ Starlink Mini (BDT 9,500 BD Residential / BDT 21,500 Global Roam) နှင့် Standard 4X Rental (BDT 3,000 တစ်ကြိမ်ကြေး၊ လစဉ်ကြေးသီးခြား) များကို မှာယူနိုင်ပါသည်။',
      'zh-CN': '在 DSLink 订购孟加拉国 Starlink 套件：Standard 4X（孟加拉住宅版 BDT 12,500 / 美国版 Roam Unlimited BDT 41,500）、Starlink Mini（孟加拉住宅版 BDT 9,500 / 全球漫游版 BDT 21,500）及 Standard 4X 租赁（BDT 3,000 一次性费用，月费另计）。',
    },
    keywords: {
      en: 'Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X price, Starlink Mini price in Bangladesh, Starlink rental in Bangladesh, DSLink, DEVSPARK LINK, Dev Spark Soft Limited',
      bn: 'বাংলাদেশে Starlink কিট, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X দাম, Starlink Mini দাম বাংলাদেশ, Starlink রেন্টাল বাংলাদেশ, DSLink, DEVSPARK LINK',
      my: 'Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X price, Starlink Mini price, Starlink rental, DSLink',
      'zh-CN': '孟加拉国 Starlink 套件, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X 价格, Starlink Mini 价格, Starlink 租赁, DSLink',
    },
  },
  home_devsparksoft: {
    title: {
      en: 'DevSpark Link (DSLink) — Starlink Kits in Bangladesh, Mini, Standard 4X & Rental | Dev Spark Soft Limited',
      bn: 'DevSpark Link (DSLink) — বাংলাদেশে Starlink কিট, Mini, Standard 4X ও রেন্টাল | Dev Spark Soft Limited',
      my: 'DevSpark Link (DSLink) — Starlink Standard 4X၊ Starlink Mini နှင့် ငှားရမ်းခြင်း | Dev Spark Soft Limited',
      'zh-CN': 'DevSpark Link (DSLink) — 孟加拉国 Starlink 套件、Standard 4X、Mini 与租赁 | Dev Spark Soft Limited',
    },
    description: {
      en: 'Dev Spark Soft Limited (devsparksoft.com.bd) operates DevSpark Link (DSLink): Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini (BDT 9,500 / BDT 21,500), and Standard 4X Rental (BDT 3,000 one-time fee; monthly subscription separate).',
      bn: 'Dev Spark Soft Limited (devsparksoft.com.bd) পরিচালিত DSLink-এ পাচ্ছেন Starlink Standard 4X (৳১২,৫০০ BD রেসিডেন্সিয়াল / ৳৪১,৫০০ USA Kit + Roam Unlimited), Starlink Mini (৳৯,৫০০ BD রেসিডেন্সিয়াল / ৳২১,৫০০ গ্লোবাল রোম) এবং Standard 4X রেন্টাল (৳৩,০০০ এককালীন ফি; মাসিক সাবস্ক্রিপশন আলাদা)।',
      my: 'Dev Spark Soft Limited (devsparksoft.com.bd) ၏ DSLink တွင် Starlink Standard 4X USA Kit + Roam Unlimited (BDT 41,500)၊ Starlink Mini နှင့် Standard 4X Rental (BDT 3,000 တစ်ကြိမ်ကြေး၊ လစဉ်ကြေးသီးခြား) များကို မှာယူနိုင်ပါသည်။',
      'zh-CN': 'Dev Spark Soft Limited（devsparksoft.com.bd）运营 DSLink，提供孟加拉国住宅版 Standard 4X（BDT 12,500）、Starlink Standard 4X USA Kit + Roam Unlimited（BDT 41,500）、Starlink Mini 硬件及 Standard 4X 租赁（BDT 3,000 一次性费用，月费另计）。',
    },
    keywords: {
      en: 'Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Dev Spark Soft Limited, devsparksoft.com.bd, DSLink, Starlink Standard 4X price, Starlink Mini price in Bangladesh, Starlink rental in Bangladesh, DNCC/037306',
      bn: 'বাংলাদেশে Starlink কিট, Starlink Standard 4X USA Kit Roam Unlimited, Dev Spark Soft Limited, DSLink, Starlink Standard 4X দাম, Starlink Mini দাম, Starlink রেন্টাল, DNCC/037306',
      my: 'Dev Spark Soft Limited, DSLink, Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Mini, DNCC/037306',
      'zh-CN': 'Dev Spark Soft Limited, DSLink, 孟加拉国 Starlink 套件, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Mini, DNCC/037306',
    },
  },
  kits: {
    title: {
      en: 'Starlink Kits in Bangladesh — Standard 4X, Starlink Mini & Rental Prices | DSLink',
      bn: 'বাংলাদেশে Starlink কিট — Standard 4X, Starlink Mini ও রেন্টাল দাম | DSLink',
      my: 'Starlink Kits in Bangladesh — Standard 4X၊ Starlink Mini နှင့် ငှားရမ်းခ | DSLink',
      'zh-CN': '孟加拉国 Starlink 套件目录 — Standard 4X、Starlink Mini 与租赁价格 | DSLink',
    },
    description: {
      en: 'Compare Starlink kits in Bangladesh at DSLink: Standard 4X BD Residential (BDT 12,500), Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500), Starlink Mini BD Residential (BDT 9,500) & Global Roam (BDT 21,500), and Standard 4X Rental (BDT 3,000 one-time fee; monthly plan separate).',
      bn: 'DSLink-এ বাংলাদেশে Starlink কিটের দাম তুলনা করুন: Standard 4X BD রেসিডেন্সিয়াল (৳১২,৫০০), Standard 4X USA Kit + Roam Unlimited (৳৪১,৫০০), Starlink Mini BD রেসিডেন্সিয়াল (৳৯,৫০০) ও গ্লোবাল রোম (৳২১,৫০০), এবং Standard 4X রেন্টাল (৳৩,০০০ এককালীন ফি; মাসিক প্ল্যান আলাদা)।',
      my: 'DSLink တွင် Starlink Standard 4X BD Residential (BDT 12,500)၊ Starlink Standard 4X USA Kit + Roam Unlimited (BDT 41,500)၊ Starlink Mini (BDT 9,500 / 21,500) နှင့် Standard 4X Rental (BDT 3,000 တစ်ကြိမ်ကြေး) ဈေးနှုန်းများကို နှိုင်းယှဉ်ဝယ်ယူပါ။',
      'zh-CN': '在 DSLink 对比孟加拉国 Starlink 套件：Standard 4X 住宅版 BDT 12,500 / USA Kit + Roam Unlimited BDT 41,500；Starlink Mini 住宅版 BDT 9,500 / 全球漫游版 BDT 21,500；Standard 4X 租赁 BDT 3,000 一次性费用（月费另计）。',
    },
    keywords: {
      en: 'Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X price, Starlink Mini price in Bangladesh, Starlink rental in Bangladesh, buy Starlink Bangladesh, DSLink',
      bn: 'বাংলাদেশে Starlink কিট, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X দাম, Starlink Mini দাম বাংলাদেশ, Starlink রেন্টাল, DSLink',
      my: 'Starlink kits in Bangladesh, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X price, Starlink Mini price, DSLink',
      'zh-CN': '孟加拉国 Starlink 套件, Starlink Standard 4X USA Kit Roam Unlimited, Starlink Standard 4X 价格, Starlink Mini 价格, DSLink',
    },
  },
  kit_standard_4x: {
    title: {
      en: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500) & BD Residential (BDT 12,500) | DSLink',
      bn: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet (৳৪১,৫০০) ও BD রেসিডেন্সিয়াল (৳১২,৫০০) | DSLink',
      my: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500) နှင့် BD Residential (BDT 12,500) | DSLink',
      'zh-CN': 'Starlink Standard 4X USA Kit + Roam Unlimited Internet（BDT 41,500）与孟加拉住宅版（BDT 12,500）| DSLink',
    },
    description: {
      en: 'Order the Starlink Standard 4X USA Kit + Roam Unlimited Internet at BDT 41,500 (active Roam Unlimited subscription required and billed separately; travel coverage subject to local authorization and Starlink roaming terms) or Bangladesh Residential Purchase at BDT 12,500 from DSLink.',
      bn: 'DSLink-এ Starlink Standard 4X USA Kit + Roam Unlimited Internet অর্ডার করুন ৳৪১,৫০০ (সক্রিয় Roam Unlimited সাবস্ক্রিপশন আলাদাভাবে বিল করা হয়; ভ্রমণ কভারেজ স্থানীয় অনুমোদন ও Starlink শর্তাবলি সাপেক্ষ) অথবা বাংলাদেশ রেসিডেন্সিয়াল ৳১২,৫০০।',
      my: 'DSLink တွင် Starlink Standard 4X USA Kit + Roam Unlimited Internet (BDT 41,500 — Roam Unlimited လစဉ်ကြေး သီးခြားပေးဆောင်ရမည်) သို့မဟုတ် BD Residential (BDT 12,500) ဖြင့် ဝယ်ယူနိုင်ပါသည်။',
      'zh-CN': '在 DSLink 订购 Starlink Standard 4X USA Kit + Roam Unlimited Internet（BDT 41,500，需另行付费订阅 Roam Unlimited 套餐，旅行使用受当地授权与漫游条款约束）或孟加拉国住宅购买版（BDT 12,500）。',
    },
    keywords: {
      en: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet, ROAM UNLIMITED, Starlink Standard 4X price, Starlink Standard 4X Bangladesh Residential, Starlink Gen 3 Bangladesh, DSLink',
      bn: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet, ROAM UNLIMITED, Starlink Standard 4X দাম, Starlink Standard 4X বাংলাদেশ রেসিডেন্সিয়াল, DSLink',
      my: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet, ROAM UNLIMITED, Starlink Standard 4X price, Starlink Gen 3, DSLink',
      'zh-CN': 'Starlink Standard 4X USA Kit + Roam Unlimited Internet, ROAM UNLIMITED, Starlink Standard 4X 价格, Starlink 孟加拉住宅版, DSLink',
    },
  },
  kit_mini: {
    title: {
      en: 'Starlink Mini Price in Bangladesh — BDT 9,500 Residential & BDT 21,500 Global Roam | DSLink',
      bn: 'বাংলাদেশে Starlink Mini দাম — ৳৯,৫০০ রেসিডেন্সিয়াল ও ৳২১,৫০০ গ্লোবাল রোম | DSLink',
      my: 'Starlink Mini ဈေးနှုန်း — BDT 9,500 BD Residential နှင့် BDT 21,500 Global Roam | DSLink',
      'zh-CN': '孟加拉国 Starlink Mini 价格 — 住宅版 BDT 9,500 / 全球漫游版 BDT 21,500 | DSLink',
    },
    description: {
      en: 'Order Starlink Mini from DSLink: Bangladesh Residential Purchase at BDT 9,500 (free BD delivery & COD) or Global Roam Purchase at BDT 21,500 (worldwide DHL/FedEx hardware shipping; activation and roaming availability depend on destination and Starlink plan). Monthly plan separate.',
      bn: 'DSLink থেকে Starlink Mini অর্ডার করুন: বাংলাদেশ রেসিডেন্সিয়াল ৳৯,৫০০ (ফ্রি ডেলিভারি ও COD) অথবা গ্লোবাল রোম পারচেজ ৳২১,৫০০ (বিশ্বব্যাপী DHL/FedEx শিপিং; অ্যাক্টিভেশন ও রোমিং গন্তব্য ও প্ল্যানের ওপর নির্ভরশীল)। মাসিক প্ল্যান আলাদা।',
      my: 'DSLink မှ Starlink Mini ကို BD Residential (BDT 9,500) သို့မဟုတ် Global Roam Purchase (BDT 21,500) ဖြင့် မှာယူနိုင်ပါသည်။ လစဉ် Starlink ကြေး သီးခြားဖြစ်ပါသည်။',
      'zh-CN': '在 DSLink 订购 Starlink Mini：孟加拉国住宅购买版 BDT 9,500（免费配送与货到付款），全球漫游购买版 BDT 21,500（支持全球 DHL/FedEx 硬件配送，激活与漫游视目的地和官方套餐而定）。月费另计。',
    },
    keywords: {
      en: 'Starlink Mini price in Bangladesh, Starlink Mini BD Residential, Starlink Mini Global Roam, portable Starlink Bangladesh, DSLink',
      bn: 'Starlink Mini দাম বাংলাদেশ, Starlink Mini রেসিডেন্সিয়াল, Starlink Mini গ্লোবাল রোম, DSLink',
      my: 'Starlink Mini price in Bangladesh, Starlink Mini Global Roam, DSLink',
      'zh-CN': '孟加拉国 Starlink Mini 价格, Starlink Mini 全球漫游, 便携 Starlink, DSLink',
    },
  },
  packages: {
    title: {
      en: 'Starlink Monthly Internet Plans & Bill Payment Support | DSLink',
      bn: 'Starlink মাসিক ইন্টারনেট প্যাকেজ ও বিল পেমেন্ট সাপোর্ট | DSLink',
      my: 'Starlink လစဉ် အင်တာနက် ပက်ကေ့ချ်များနှင့် ဘေလ်ပေးချေမှု အကူအညီ | DSLink',
      'zh-CN': 'Starlink 月度网络套餐与账单代付支持 | DSLink',
    },
    description: {
      en: 'Compare Starlink Residential Lite, Residential Unlimited, Roam, and Business Priority monthly plans with DSLink monthly bill payment support and account guidance.',
      bn: 'Starlink Residential Lite, Residential Unlimited, Roam ও Business Priority মাসিক প্যাকেজ তুলনা করুন এবং DSLink-এর মাসিক বিল পেমেন্ট সাপোর্ট নিন।',
      my: 'Starlink Residential Lite၊ Residential Unlimited၊ Roam နှင့် Business Priority လစဉ်ပက်ကေ့ချ်များနှင့် DSLink လစဉ်ဘေလ်ပေးချေမှု အကူအညီကို ကြည့်ရှုပါ။',
      'zh-CN': '对比 Starlink Residential Lite、Residential Unlimited、Roam 和 Business Priority 月度套餐，并了解 DSLink 提供的月度账单代付支持。',
    },
    keywords: {
      en: 'Starlink monthly plans, Starlink bill payment support, Residential Lite, Residential Unlimited, DSLink',
      bn: 'Starlink মাসিক প্যাকেজ, স্টারলিংক বিল পেমেন্ট, Residential Lite, DSLink',
      my: 'Starlink လစဉ်ကြေး, Starlink ဘေလ်ပေးချေမှု, DSLink',
      'zh-CN': 'Starlink 月度套餐, Starlink 账单代付, DSLink',
    },
  },
  rental: {
    title: {
      en: 'Starlink Rental in Bangladesh — Standard 4X BDT 3,000 One-Time Fee | DSLink',
      bn: 'বাংলাদেশে Starlink রেন্টাল — Standard 4X মাত্র ৳৩,০০০ এককালীন ফি | DSLink',
      my: 'ဘင်္ဂလားဒေ့ရှ် Starlink ငှားရမ်းခြင်း — Standard 4X BDT 3,000 တစ်ကြိမ်ကြေး | DSLink',
      'zh-CN': '孟加拉国 Starlink 租赁 — Standard 4X 一次性费用 BDT 3,000 | DSLink',
    },
    description: {
      en: 'Starlink rental in Bangladesh from DSLink: Starlink Standard 4X Rental for a BDT 3,000 one-time fee (ownership not transferred). Monthly Starlink subscription is separate. Fixed location, Residential plan only, up to 5 TB/month, no travel or roaming, and no COD.',
      bn: 'DSLink-এ বাংলাদেশে Starlink রেন্টাল: Standard 4X রেন্টাল কিটের এককালীন ফি ৳৩,০০০ (মালিকানা হস্তান্তর হয় না)। মাসিক Starlink সাবস্ক্রিপশন আলাদা। শুধুমাত্র ফিক্সড লোকেশন ও Residential প্ল্যান, সর্বোচ্চ ৫ টিবি/মাস, কোনো ট্রাভেল/রোমিং বা COD নেই।',
      my: 'DSLink မှ Starlink Standard 4X Rental — တစ်ကြိမ်ကြေး BDT 3,000 (စက်ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ)။ လစဉ် Starlink ကြေး သီးခြားဖြစ်ပြီး Fixed location၊ Residential plan သီးသန့်၊ 5 TB/month အထိဖြစ်ကာ Roaming နှင့် COD မရနိုင်ပါ။',
      'zh-CN': 'DSLink 孟加拉国 Starlink 租赁：Starlink Standard 4X 套件租赁仅需 BDT 3,000 一次性费用（不转移硬件所有权），月度 Starlink 订阅费另计。仅限孟加拉国固定地址与 Residential 套餐，每月最高 5 TB，不支持旅行漫游，不支持货到付款（COD）。',
    },
    keywords: {
      en: 'Starlink rental in Bangladesh, Starlink Standard 4X rental, Starlink rental BDT 3000, fixed location Residential Starlink rental, DSLink',
      bn: 'বাংলাদেশে Starlink রেন্টাল, Starlink Standard 4X রেন্টাল, ৳৩০০০ রেন্টাল কিট, DSLink',
      my: 'Starlink rental in Bangladesh, Starlink Standard 4X rental, DSLink',
      'zh-CN': '孟加拉国 Starlink 租赁, Starlink Standard 4X 租赁, DSLink',
    },
  },
  starlink_bangladesh: {
    title: {
      en: 'Starlink Kits in Bangladesh — Free Delivery, COD & Rentals | DSLink',
      bn: 'বাংলাদেশে Starlink কিট — ফ্রি ডেলিভারি, COD ও রেন্টাল | DSLink',
      my: 'ဘင်္ဂလားဒေ့ရှ် Starlink Kit — အခမဲ့ပို့ဆောင်မှုနှင့် COD | DSLink',
      'zh-CN': '孟加拉国 Starlink 套件 — 免费配送、货到付款与租赁 | DSLink',
    },
    description: {
      en: 'Order Starlink Standard Kit 4X, Starlink Mini Kit, or Starlink Rental Kit across all 64 districts of Bangladesh with free delivery, COD on purchases, and monthly bill payment support.',
      bn: 'বাংলাদেশের ৬৪ জেলায় ফ্রি ডেলিভারি ও COD সুবিধায় Starlink Standard Kit 4X, Mini Kit এবং Starlink Rental Kit অর্ডার করুন; সাথে রয়েছে মাসিক বিল পেমেন্ট সাপোর্ট।',
      my: 'ဘင်္ဂလားဒေ့ရှ် ၆၄ ခရိုင်လုံးသို့ အခမဲ့ပို့ဆောင်မှုနှင့် COD ဖြင့် Starlink Standard Kit 4X၊ Mini Kit နှင့် Rental Kit များ မှာယူနိုင်ပါသည်။',
      'zh-CN': '面向孟加拉国全部 64 个区订购 Starlink Standard Kit 4X、Mini Kit 或租赁套件，享受免费配送、购买货到付款及月度账单支持。',
    },
    keywords: {
      en: 'Starlink Bangladesh, Starlink free delivery Bangladesh, Starlink COD BD, DSLink',
      bn: 'Starlink Bangladesh, স্টারলিংক বাংলাদেশ ফ্রি ডেলিভারি, COD, DSLink',
      my: 'Starlink Bangladesh, DSLink Bangladesh',
      'zh-CN': '孟加拉国 Starlink, Starlink 免费配送, DSLink',
    },
  },
  starlink_myanmar: {
    title: {
      en: 'Starlink Kits for Myanmar — Express DHL & FedEx Shipping | DSLink',
      bn: 'মিয়ানমারে Starlink কিট শিপিং — DHL ও FedEx ডেলিভারি | DSLink',
      my: 'မြန်မာနိုင်ငံအတွက် Starlink Kit ပို့ဆောင်ရေး — DHL နှင့် FedEx | DSLink',
      'zh-CN': '缅甸 Starlink 套件配送 — DHL 与 FedEx 国际快递 | DSLink',
    },
    description: {
      en: 'Order Starlink Standard Kit 4X and Starlink Mini Kit with express DHL/FedEx kit shipping to Myanmar, setup guidance, roaming support, and monthly bill payment assistance from DSLink.',
      bn: 'DSLink থেকে মিয়ানমারে DHL/FedEx এক্সপ্রেস কিট শিপিংয়ে Starlink Standard Kit 4X ও Mini Kit অর্ডার করুন; সাথে সেটআপ, রোমিং ও মাসিক বিল পেমেন্ট সাপোর্ট।',
      my: 'မြန်မာနိုင်ငံသို့ DHL Express / FedEx ဖြင့် Starlink Standard Kit 4X နှင့် Starlink Mini Kit များ ပို့ဆောင်ပေးနေပြီး တပ်ဆင်မှုနှင့် လစဉ်ဘေလ် အကူအညီ ရရှိနိုင်ပါသည်။',
      'zh-CN': '通过 DSLink 订购寄往缅甸的 Starlink Standard Kit 4X 和 Mini Kit，提供 DHL/FedEx 国际快递配送、安装指导、漫游支持及月度账单协助。',
    },
    keywords: {
      en: 'Starlink Myanmar, Starlink kit shipping Myanmar, DHL FedEx Myanmar, DSLink',
      bn: 'Starlink Myanmar, মিয়ানমার স্টারলিংক শিপিং, DSLink',
      my: 'Starlink Myanmar, မြန်မာ Starlink ပို့ဆောင်ရေး, DHL FedEx Myanmar, DSLink',
      'zh-CN': '缅甸 Starlink, Starlink 缅甸配送, DHL FedEx 缅甸, DSLink',
    },
  },
  worldwide_delivery: {
    title: {
      en: 'Worldwide Starlink Kit Shipping — Bangladesh, USA & Global | DSLink',
      bn: 'বিশ্বব্যাপী Starlink কিট শিপিং — বাংলাদেশ, যুক্তরাষ্ট্র ও গ্লোবাল | DSLink',
      my: 'ကမ္ဘာတစ်ဝှမ်း Starlink Kit ပို့ဆောင်ရေး — DHL နှင့် FedEx | DSLink',
      'zh-CN': 'Starlink 套件全球配送 — 孟加拉国、美国及全球目的地 | DSLink',
    },
    description: {
      en: 'DSLink ships Starlink Standard Kit 4X and Starlink Mini Kit across Bangladesh (free delivery & COD) and worldwide via DHL/FedEx. Note: activation and roaming depend on destination and plan.',
      bn: 'DSLink বাংলাদেশে ফ্রি ডেলিভারি ও COD এবং বিশ্বব্যাপী DHL/FedEx-এর মাধ্যমে Starlink Standard Kit 4X ও Mini Kit শিপিং করে। অ্যাক্টিভেশন ও রোমিং গন্তব্য ও প্ল্যানের ওপর নির্ভরশীল।',
      my: 'DSLink သည် ဘင်္ဂလားဒေ့ရှ်အတွင်း အခမဲ့ပို့ဆောင်မှုနှင့် ကမ္ဘာတစ်ဝှမ်း DHL/FedEx ဖြင့် Starlink Kit များ ပို့ဆောင်ပေးပါသည်။ Activation နှင့် Roaming သည် နိုင်ငံနှင့် ပက်ကေ့ချ်ပေါ် မူတည်ပါသည်။',
      'zh-CN': 'DSLink 通过孟加拉国免费配送及 DHL/FedEx 国际快递向全球配送 Starlink Standard Kit 4X 和 Mini Kit。注：激活与漫游取决于目的地及所选套餐。',
    },
    keywords: {
      en: 'worldwide Starlink kit shipping, Starlink DHL FedEx delivery, international Starlink shipping, DSLink',
      bn: 'বিশ্বব্যাপী Starlink শিপিং, DHL FedEx Starlink, DSLink',
      my: 'ကမ္ဘာတစ်ဝှမ်း Starlink ပို့ဆောင်ရေး, DHL FedEx Starlink, DSLink',
      'zh-CN': 'Starlink 全球配送, Starlink 国际快递, DHL FedEx, DSLink',
    },
  },
  roaming_packages: {
    title: {
      en: 'Starlink Roaming Packages & 90-Day Guarantee | DSLink',
      bn: 'Starlink রোমিং প্যাকেজ ও ৯০ দিনের মানি-ব্যাক গ্যারান্টি | DSLink',
      my: 'Starlink Roaming ပက်ကေ့ချ်များနှင့် ရက် ၉၀ အာမခံ | DSLink',
      'zh-CN': 'Starlink 漫游套餐与 90 天退款保障 | DSLink',
    },
    description: {
      en: 'Explore Starlink roaming plans, monthly bill payment support, and the 90-day roaming money-back guarantee for qualifying purchased Starlink kits from DSLink.',
      bn: 'ক্রয়কৃত Starlink কিটের জন্য রোমিং প্যাকেজ, মাসিক বিল পেমেন্ট সাপোর্ট এবং যোগ্য অর্ডারে ৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি সম্পর্কে জানুন।',
      my: 'ဝယ်ယူထားသော Starlink Kit များအတွက် Roaming ပက်ကေ့ချ်များ၊ လစဉ်ဘေလ် အကူအညီနှင့် ရက် ၉၀ ငွေပြန်အမ်း အာမခံအကြောင်း လေ့လာပါ။',
      'zh-CN': '了解 DSLink 针对符合条件的购买套件提供的 Starlink 漫游套餐、月度账单代付支持及 90 天漫游退款保障。',
    },
    keywords: {
      en: 'Starlink roaming packages, 90-day roaming guarantee, Starlink bill payment support, DSLink',
      bn: 'Starlink রোমিং প্যাকেজ, ৯০ দিনের গ্যারান্টি, DSLink',
      my: 'Starlink Roaming ပက်ကေ့ချ်, ရက် ၉၀ အာမခံ, DSLink',
      'zh-CN': 'Starlink 漫游套餐, 90 天退款保障, DSLink',
    },
  },
  warranty: {
    title: {
      en: '24-Month DSLink Replacement Warranty — Purchase & Rental Kits',
      bn: '২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি — ক্রয় ও রেন্টাল কিট',
      my: '၂၄ လ DSLink အစားထိုးအာမခံ — ဝယ်ယူမှုနှင့် ငှားရမ်းစက်များ',
      'zh-CN': '24 个月 DSLink 更换保修 — 购买与租赁套件',
    },
    description: {
      en: 'Register your Starlink kit serial number, verify 24-month DSLink replacement warranty coverage for purchased and rental kits, and submit warranty claims online.',
      bn: 'আপনার Starlink কিটের সিরিয়াল নম্বর রেজিস্টার করুন, ক্রয়কৃত ও রেন্টাল কিটের ২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি যাচাই করুন এবং অনলাইনে ক্লেইম জমা দিন।',
      my: 'သင်၏ Starlink Kit Serial ကို စာရင်းသွင်းပြီး ဝယ်ယူမှုနှင့် ငှားရမ်းစက်များအတွက် ၂၄ လ DSLink အစားထိုးအာမခံကို စစ်ဆေးလျှောက်ထားနိုင်ပါသည်။',
      'zh-CN': '登记您的 Starlink 套件序列号，查询购买与租赁套件的 24 个月 DSLink 更换保修范围，并在线提交保修申请。',
    },
    keywords: {
      en: 'DSLink 24-month replacement warranty, Starlink warranty registration, rental kit warranty',
      bn: '২৪ মাসের ওয়ারেন্টি, DSLink রিপ্লেসমেন্ট ওয়ারেন্টি, স্টারলিংক ওয়ারেন্টি',
      my: '၂၄ လ အာမခံ, DSLink Warranty',
      'zh-CN': 'DSLink 24 个月更换保修, Starlink 保修登记',
    },
  },
  legal: {
    title: {
      en: 'DevSparkSoft & DSLink — Legal Center & Store Policies',
      bn: 'DevSparkSoft ও DSLink — লিগ্যাল ও নীতিমালা কেন্দ্র',
      my: 'DevSparkSoft နှင့် DSLink — ဥပဒေနှင့် မူဝါဒ စင်တာ',
      'zh-CN': 'DevSparkSoft 与 DSLink — 法律与商店政策中心',
    },
    description: {
      en: 'Official DSLink and Dev Spark Soft Limited policies covering kit shipping, Starlink rentals, Bangla QR payment, monthly billing, 24-month warranty, roaming refunds, and privacy.',
      bn: 'DSLink ও Dev Spark Soft Limited-এর অফিসিয়াল নীতিমালা: কিট শিপিং, রেন্টাল পলিসি, Bangla QR পেমেন্ট, মাসিক বিল, ২৪ মাসের ওয়ারেন্টি, রিফান্ড ও প্রাইভেসি।',
      my: 'DSLink နှင့် Dev Spark Soft Limited ၏ တရားဝင်မူဝါဒများ — ပို့ဆောင်ရေး၊ ငှားရမ်းခြင်း၊ Bangla QR ငွေပေးချေမှု၊ အာမခံနှင့် ကိုယ်ရေးလုံခြုံမှု။',
      'zh-CN': '查看 DSLink 及 Dev Spark Soft Limited 官方政策，涵盖硬件配送、Starlink 租赁、Bangla QR 支付、月度账单、24 个月保修、漫游退款与隐私条款。',
    },
    keywords: {
      en: 'DSLink legal policies, DevSparkSoft policies, rental policy, shipping policy, warranty policy',
      bn: 'DSLink নীতিমালা, রেন্টাল পলিসি, শিপিং পলিসি, ওয়ারেন্টি পলিসি',
      my: 'DSLink မူဝါဒများ, ငှားရမ်းခြင်း မူဝါဒ, ပို့ဆောင်ရေး မူဝါဒ',
      'zh-CN': 'DSLink 法律政策, 租赁政策, 配送政策, 保修政策',
    },
    isArticle: true,
  },
  rental_policy: {
    title: {
      en: 'Starlink Rental Kit Policy — Terms, 5TB Cap & Restrictions | DSLink',
      bn: 'Starlink রেন্টাল কিট নীতিমালা — শর্তাবলি ও বিধিনিষেধ | DSLink',
      my: 'Starlink ငှားရမ်းစက် မူဝါဒနှင့် ကန့်သတ်ချက်များ | DSLink',
      'zh-CN': 'Starlink 租赁套件政策 — 条款、5TB 限制与使用规定 | DSLink',
    },
    description: {
      en: 'Read DSLink Starlink Rental Kit terms: ৳3,000 one-time Bangla QR charge, ownership retention, separate monthly Starlink subscription, 5TB fair usage cap, and location rules.',
      bn: 'Starlink Rental Kit-এর সম্পূর্ণ শর্তাবলি: ৳৩,০০০ এককালীন Bangla QR চার্জ, মালিকানা নীতি, আলাদা মাসিক সাবস্ক্রিপশন ফি, ৫ টিবি ডেটা লিমিট ও লোকেশন নিয়ম।',
      my: 'Starlink Rental Kit စည်းကမ်းချက်များ — တစ်ကြိမ်ကြေး ৳3,000 (Bangla QR)၊ ပိုင်ဆိုင်မှုမူဝါဒ၊ သီးခြားလစဉ်ကြေးနှင့် 5TB ကန့်သတ်ချက်။',
      'zh-CN': '了解 DSLink Starlink 租赁套件完整条款：৳3,000 一次性 Bangla QR 费用、所有权说明、独立月度订阅费、5TB 公平使用上限及注册地址限制。',
    },
    keywords: {
      en: 'Starlink rental policy, 5TB rental limit, Bangla QR, DSLink',
      bn: 'স্টারলিংক রেন্টাল পলিসি, 5TB লিমিট, Bangla QR, DSLink',
      my: 'Starlink ငှားရမ်းခြင်း မူဝါဒ, 5TB ကန့်သတ်ချက်, DSLink',
      'zh-CN': 'Starlink 租赁政策, 5TB 限制, DSLink',
    },
    isArticle: true,
  },
  red_policy_alert: {
    title: {
      en: 'RED POLICY ALERT: Starlink Buyer Safety Guide | DSLink',
      bn: 'RED POLICY ALERT: Starlink কেনার আগে ক্রেতা সতর্কতা | DSLink',
      my: 'RED POLICY ALERT: Starlink မဝယ်ယူမီ သတိပြုရန် | DSLink',
      'zh-CN': 'RED POLICY ALERT：Starlink 购买安全指南 | DSLink',
    },
    description: {
      en: 'Avoid restricted Starlink kits and account bans. Learn how DSLink provides verified Starlink Standard Kit 4X and Mini Kit hardware with official invoice and after-sales support.',
      bn: 'সন্দেহজনক Restricted Starlink Kit ও Account Ban থেকে নিরাপদ থাকুন। DSLink-এর ভেরিফায়েড Standard 4X ও Mini কিট এবং বিক্রয়-পরবর্তী সেবা সম্পর্কে জানুন।',
      my: 'Restricted Starlink Kit နှင့် Account Ban အန္တရာယ်မှ ကာကွယ်ရန် DSLink ၏ စစ်မှန်သော စက်ပစ္စည်းနှင့် အာမခံအချက်အလက်များကို ဖတ်ရှုပါ။',
      'zh-CN': '防范受限 Starlink 套件与账号封禁风险。了解 DSLink 如何提供经过验证的 Starlink Standard Kit 4X 与 Mini Kit、正规发票及售后支持。',
    },
    keywords: {
      en: 'RED POLICY ALERT, restricted Starlink kit, verified Starlink kit, DSLink',
      bn: 'RED POLICY ALERT, Restricted Starlink Kit, DSLink',
      my: 'RED POLICY ALERT, Restricted Starlink Kit, DSLink',
      'zh-CN': 'RED POLICY ALERT, Starlink 购买指南, DSLink',
    },
    isArticle: true,
  },
  price_syndicate_alert: {
    title: {
      en: 'Starlink Price Syndicate Alert: Rental vs Purchased Kits | DSLink',
      bn: 'Starlink Price Syndicate Alert: রেন্টাল বনাম নতুন কিট সতর্কতা | DSLink',
      my: 'Starlink Price Syndicate Alert: စက်အသစ်နှင့် ငှားရမ်းစက် ကွာခြားချက် | DSLink',
      'zh-CN': 'Starlink 价格警示：租赁套件与买断套件区别说明 | DSLink',
    },
    description: {
      en: 'Consumer advisory explaining ownership, recurring fees, roaming limits, and transfer differences between permanently purchased Starlink kits and Starlink rental kits.',
      bn: 'নতুন কেনা Starlink কিট ও রেন্টাল কিটের মালিকানা, মাসিক ফি, রোমিং এবং ট্রান্সফার পার্থক্য সম্পর্কে ক্রেতা সচেতনতা গাইড।',
      my: 'ဝယ်ယူထားသော Starlink စက်အသစ်နှင့် ငှားရမ်းစက် (Rental Kit) ၏ ပိုင်ဆိုင်မှု၊ လစဉ်ကြေးနှင့် ကန့်သတ်ချက်များကို နှိုင်းယှဉ်ဖတ်ရှုပါ။',
      'zh-CN': '消费者提示：详解买断 Starlink 套件与租赁套件在所有权、月费、漫游限制和过户规则上的关键差异。',
    },
    keywords: {
      en: 'Starlink price syndicate alert, rental vs purchased Starlink kit, DSLink',
      bn: 'Starlink Price Syndicate Alert, রেন্টাল বনাম ক্রয়কৃত কিট, DSLink',
      my: 'Starlink Price Syndicate Alert, Rental vs Purchased Kit, DSLink',
      'zh-CN': 'Starlink 租赁与买断区别, 消费警示, DSLink',
    },
    isArticle: true,
  },
  faq: {
    title: {
      en: 'Starlink FAQ — Kit Shipping, Rentals, Warranty & Bill Support | DSLink',
      bn: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ) — শিপিং, রেন্টাল, ওয়ারেন্টি ও বিল সাপোর্ট | DSLink',
      my: 'အမေးများသော မေးခွန်းများ (FAQ) — ပို့ဆောင်ရေး၊ ငှားရမ်းခြင်းနှင့် အာမခံ | DSLink',
      'zh-CN': 'Starlink 常见问题 (FAQ) — 配送、租赁、保修与账单支持 | DSLink',
    },
    description: {
      en: 'Answers to common questions about ordering Starlink Standard Kit 4X and Mini Kit, worldwide kit shipping, Starlink rentals, monthly bill payment support, and 24-month warranty.',
      bn: 'Starlink Standard Kit 4X ও Mini Kit অর্ডার, বিশ্বব্যাপী কিট শিপিং, স্টারলিংক রেন্টাল, মাসিক বিল পেমেন্ট সাপোর্ট ও ২৪ মাসের ওয়ারেন্টি সম্পর্কিত সকল প্রশ্নের উত্তর।',
      my: 'Starlink Standard Kit 4X နှင့် Mini Kit မှာယူခြင်း၊ ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး၊ ငှားရမ်းခြင်း၊ လစဉ်ဘေလ် အကူအညီနှင့် ၂၄ လ အာမခံ မေးခွန်းအဖြေများ။',
      'zh-CN': '解答关于订购 Starlink Standard Kit 4X 与 Mini Kit、全球套件配送、设备租赁、月度账单代付支持及 24 个月保修的常见问题。',
    },
    keywords: {
      en: 'Starlink FAQ, DSLink FAQ, Starlink shipping FAQ, Starlink rental FAQ, monthly bill payment FAQ',
      bn: 'Starlink FAQ, DSLink প্রশ্নোত্তর, স্টারলিংক শিপিং ও রেন্টাল FAQ',
      my: 'Starlink FAQ, DSLink FAQ, ပို့ဆောင်ရေးနှင့် ငှားရမ်းခြင်း FAQ',
      'zh-CN': 'Starlink 常见问题, DSLink FAQ, 配送与保修解答',
    },
  },
  support: {
    title: {
      en: 'DSLink Support — Starlink Setup, Shipping & Monthly Bill Assistance',
      bn: 'DSLink সাপোর্ট — স্টারলিংক সেটআপ, শিপিং ও মাসিক বিল সহায়তা',
      my: 'DSLink အကူအညီ — Starlink တပ်ဆင်မှု၊ ပို့ဆောင်ရေးနှင့် လစဉ်ဘေလ် ဝန်ဆောင်မှု',
      'zh-CN': 'DSLink 客户支持 — Starlink 安装、配送与月度账单协助',
    },
    description: {
      en: 'Contact DSLink via WhatsApp or email for Starlink Standard Kit 4X and Mini Kit shipping inquiries, setup troubleshooting, rental guidance, and monthly bill payment support.',
      bn: 'Starlink Standard Kit 4X ও Mini Kit শিপিং, সেটআপ সহায়তা, রেন্টাল তথ্য এবং মাসিক বিল পেমেন্ট সাপোর্টের জন্য WhatsApp বা ইমেইলে DSLink টিমের সাথে যোগাযোগ করুন।',
      my: 'Starlink Kit ပို့ဆောင်ရေး၊ တပ်ဆင်မှုအကူအညီ၊ ငှားရမ်းခြင်းနှင့် လစဉ်ဘေလ်ပေးချေမှုအတွက် DSLink သို့ WhatsApp သို့မဟုတ် Email ဖြင့် ဆက်သွယ်ပါ။',
      'zh-CN': '通过 WhatsApp 或电子邮件联系 DSLink，获取 Starlink Standard Kit 4X 与 Mini Kit 配送咨询、安装排障、租赁说明及月度账单代付支持。',
    },
    keywords: {
      en: 'DSLink support, Starlink technical support, Starlink setup help, monthly bill payment support',
      bn: 'DSLink সাপোর্ট, স্টারলিংক টেকনিক্যাল সাপোর্ট, বিল পেমেন্ট সাপোর্ট',
      my: 'DSLink အကူအညီ, Starlink နည်းပညာအကူအညီ',
      'zh-CN': 'DSLink 客户支持, Starlink 技术支持, 账单代付协助',
    },
  },
  privacy: {
    title: {
      en: 'Privacy Policy — DSLink & Dev Spark Soft Limited',
      bn: 'প্রাইভেসি পলিসি — DSLink ও Dev Spark Soft Limited',
      my: 'ကိုယ်ရေးလုံခြုံမှု မူဝါဒ (Privacy Policy) — DSLink',
      'zh-CN': '隐私政策 — DSLink 与 Dev Spark Soft Limited',
    },
    description: {
      en: 'Learn how DSLink and Dev Spark Soft Limited handle order details, shipping information, and privacy protections without storing raw visitor IP addresses for geo copy.',
      bn: 'DSLink ও Dev Spark Soft Limited কীভাবে অর্ডার ও শিপিং তথ্য সুরক্ষিত রাখে এবং গ্রাহকের প্রাইভেসি নীতিমালা অনুসরণ করে তা জানুন।',
      my: 'DSLink နှင့် Dev Spark Soft Limited ၏ ဖောက်သည်အချက်အလက် လုံခြုံရေးနှင့် ကိုယ်ရေးလုံခြုံမှု မူဝါဒကို ဖတ်ရှုပါ။',
      'zh-CN': '了解 DSLink 与 Dev Spark Soft Limited 如何保护您的订单与配送信息，以及我们的隐私数据合规承诺。',
    },
    keywords: {
      en: 'DSLink privacy policy, Dev Spark Soft Limited privacy',
      bn: 'DSLink প্রাইভেসি পলিসি, Dev Spark Soft Limited',
      my: 'DSLink Privacy Policy',
      'zh-CN': 'DSLink 隐私政策, Dev Spark Soft Limited',
    },
    isArticle: true,
  },
  offers: {
    title: {
      en: 'Special Starlink Kit Offers & Promotions | DSLink',
      bn: 'স্টারলিংক কিট বিশেষ অফার ও প্রমোশন | DSLink',
      my: 'Starlink Kit အထူးကမ်းလှမ်းချက်များနှင့် ပရိုမိုးရှင်း | DSLink',
      'zh-CN': 'Starlink 套件特惠活动与促销 | DSLink',
    },
    description: {
      en: 'Check current DSLink offers on Starlink Standard Kit 4X, Starlink Mini Kit, and Starlink Rental Kit with Bangladesh free delivery and worldwide DHL/FedEx shipping.',
      bn: 'Starlink Standard Kit 4X, Starlink Mini Kit এবং Starlink Rental Kit-এ DSLink-এর বিশেষ অফার, ফ্রি বাংলাদেশ ডেলিভারি ও বিশ্বব্যাপী শিপিং দেখুন।',
      my: 'Starlink Standard Kit 4X၊ Mini Kit နှင့် Rental Kit များအတွက် DSLink ၏ အထူးလျှော့စျေးနှင့် ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး အစီအစဉ်များကို ကြည့်ရှုပါ။',
      'zh-CN': '查看 DSLink 针对 Starlink Standard Kit 4X、Starlink Mini Kit 和租赁套件的最新特惠活动，支持全球 DHL/FedEx 配送。',
    },
    keywords: {
      en: 'Starlink kit offers, DSLink promotions, Starlink discount Bangladesh',
      bn: 'স্টারলিংক অফার, DSLink প্রমোশন',
      my: 'Starlink အထူးလျှော့စျေး, DSLink Offers',
      'zh-CN': 'Starlink 优惠活动, DSLink 促销',
    },
  },
  image_gallery: {
    title: {
      en: 'Starlink Installation Gallery — Standard 4X & Mini Setups | DSLink',
      bn: 'স্টারলিংক ইনস্টলেশন গ্যালারি — Standard 4X ও Mini সেটআপ | DSLink',
      my: 'Starlink တပ်ဆင်မှု ဓာတ်ပုံပြခန်း — Standard 4X နှင့် Mini | DSLink',
      'zh-CN': 'Starlink 实景安装图库 — Standard 4X 与 Mini 部署案例 | DSLink',
    },
    description: {
      en: 'View real-world Starlink Standard Kit 4X and Starlink Mini Kit rooftop, field, and enterprise deployments delivered and supported by DSLink.',
      bn: 'DSLink কর্তৃক সরবরাহকৃত ও সেটআপকৃত Starlink Standard Kit 4X এবং Starlink Mini Kit-এর বাস্তব ইনস্টলেশন ও ফিল্ড ডিপ্লয়মেন্ট ছবি দেখুন।',
      my: 'DSLink မှ ပို့ဆောင်တပ်ဆင်ပေးထားသော Starlink Standard Kit 4X နှင့် Mini Kit တပ်ဆင်မှု ဓာတ်ပုံများကို ကြည့်ရှုပါ။',
      'zh-CN': '浏览由 DSLink 配送并提供技术支持的 Starlink Standard Kit 4X 与 Starlink Mini Kit 屋顶、野外及企业级实景安装案例。',
    },
    keywords: {
      en: 'Starlink installation gallery, DSLink setups, Starlink Bangladesh photos',
      bn: 'স্টারলিংক গ্যালারি, DSLink সেটআপ ছবি',
      my: 'Starlink ဓာတ်ပုံပြခန်း, DSLink Gallery',
      'zh-CN': 'Starlink 安装图库, DSLink 案例',
    },
  },
  blog: {
    title: {
      en: 'DSLink Official Blog — Starlink Setup Guides, Roaming & News',
      bn: 'DSLink অফিশিয়াল ব্লগ — স্টারলিংক সেটআপ গাইড, রোমিং ও আপডেট',
      my: 'DSLink တရားဝင် ဘလော့ဂ် — Starlink တပ်ဆင်မှု လမ်းညွှန်နှင့် သတင်းများ',
      'zh-CN': 'DSLink 官方博客 — Starlink 安装指南、漫游评测与资讯',
    },
    description: {
      en: 'Read technical guides, Starlink Standard 4X vs Mini comparisons, roaming tips, and satellite internet insights from the DSLink engineering desk.',
      bn: 'DSLink ইঞ্জিনিয়ারিং ডেস্ক থেকে Starlink Standard 4X বনাম Mini তুলনা, সেটআপ গাইড, রোমিং টিপস ও স্যাটেলাইট ইন্টারনেট বিষয়ক আর্টিকেল পড়ুন।',
      my: 'Starlink Standard 4X နှင့် Mini နှိုင်းယှဉ်ချက်၊ တပ်ဆင်မှု လမ်းညွှန်နှင့် Roaming အချက်အလက်များကို DSLink ဘလော့ဂ်တွင် ဖတ်ရှုပါ။',
      'zh-CN': '阅读来自 DSLink 工程团队的 Starlink Standard 4X 与 Mini 对比评测、安装指南、漫游技巧及卫星互联网资讯。',
    },
    keywords: {
      en: 'DSLink blog, Starlink setup guide, Starlink Standard 4X vs Mini',
      bn: 'DSLink ব্লগ, স্টারলিংক সেটআপ গাইড',
      my: 'DSLink ဘလော့ဂ်, Starlink လမ်းညွှန်',
      'zh-CN': 'DSLink 博客, Starlink 安装指南',
    },
    isArticle: true,
  },
  partnerships: {
    title: {
      en: 'DSLink Partnerships & Affiliate Program — Enterprise & Resellers',
      bn: 'DSLink পার্টনারশিপ ও অ্যাফিলিয়েট প্রোগ্রাম — এন্টারপ্রাইজ ও রিসেলার',
      my: 'DSLink မိတ်ဖက်နှင့် Affiliate အစီအစဉ် — လုပ်ငန်းနှင့် ပြန်လည်ရောင်းချသူများ',
      'zh-CN': 'DSLink 合作伙伴与联盟计划 — 企业采购与渠道合作',
    },
    description: {
      en: 'Partner with DSLink and Dev Spark Soft Limited for bulk Starlink kit procurement, enterprise deployments, ISP integration, and regional affiliate referrals.',
      bn: 'বাল্ক Starlink কিট সংগ্রহ, এন্টারপ্রাইজ ডিপ্লয়মেন্ট, ISP ইন্টিগ্রেশন এবং অ্যাফিলিয়েট পার্টনারশিপের জন্য DSLink ও Dev Spark Soft Limited-এর সাথে যুক্ত হোন।',
      my: 'Starlink Kit အမြောက်အမြား မှာယူခြင်း၊ Enterprise တပ်ဆင်ခြင်းနှင့် မိတ်ဖက်အစီအစဉ်အတွက် DSLink နှင့် လက်တွဲဆောင်ရွက်ပါ။',
      'zh-CN': '与 DSLink 及 Dev Spark Soft Limited 建立合作，获取批量 Starlink 套件采购、企业级部署及区域渠道联盟支持。',
    },
    keywords: {
      en: 'DSLink partnerships, Starlink affiliate program, enterprise Starlink deployment',
      bn: 'DSLink পার্টনারশিপ, স্টারলিংক অ্যাফিলিয়েট',
      my: 'DSLink မိတ်ဖက်အစီအစဉ်, Starlink Affiliate',
      'zh-CN': 'DSLink 合作伙伴, Starlink 企业采购',
    },
  },
  resell: {
    title: {
      en: 'Starlink Reseller Application in Bangladesh | DSLink',
      bn: 'বাংলাদেশে Starlink রিসেলার আবেদন (১৫% ডিসকাউন্ট) | DSLink',
      my: 'ဘင်္ဂလားဒေ့ရှ် Starlink Reseller လျှောက်လွှာ | DSLink',
      'zh-CN': '孟加拉国 Starlink 经销商申请 (享 15% 硬件折扣) | DSLink',
    },
    description: {
      en: 'Apply for Starlink reseller status with DSLink in Bangladesh. Approved resellers get a 15% discount on Starlink kits and accessories, fixed subscription fees, custom selling prices, reseller-branded shipping, and NPSB/MFS withdrawals.',
      bn: 'বাংলাদেশে DSLink Starlink রিসেলার হিসেবে আবেদন করুন। অনুমোদিত রিসেলাররা Starlink কিট ও অ্যাক্সেসরিজে ১৫% ডিসকাউন্ট, ফিক্সড সাবস্ক্রিপশন ফি, কাস্টম বিক্রয়মূল্য, রিসেলার-ব্র্যান্ডেড শিপিং এবং ডেলিভারি ও পেমেন্ট নিশ্চিতের পর উইথড্র সুবিধা পান।',
      my: 'DSLink တွင် Starlink Reseller အဖြစ် လျှောက်ထားပါ။ အတည်ပြုပြီးသော Reseller များသည် Starlink Kit နှင့် ဆက်စပ်ပစ္စည်းများတွင် 15% လျှော့စျေး၊ သတ်မှတ်ထားသော လစဉ်ကြေး၊ ကိုယ်ပိုင်ရောင်းစျေးနှင့် Reseller တံဆိပ်ဖြင့် ပို့ဆောင်ပေးမှု ရရှိပါမည်။',
      'zh-CN': '在孟加拉国申请成为 DSLink Starlink 经销商（apply for Starlink reseller）。获批经销商可享 Starlink 套件与配件 15% 折扣（85 折）、固定订阅套餐费、自定义客户售价、经销商品牌发货标签及确认交付与付款后的提现结算。',
    },
    keywords: {
      en: 'apply for Starlink reseller, Starlink Reseller Application in Bangladesh, DSLink reseller portal, Starlink wholesale discount Bangladesh, reseller branded shipping',
      bn: 'apply for Starlink reseller, স্টারলিংক রিসেলার আবেদন বাংলাদেশ, DSLink রিসেলার পোর্টাল, ১৫% ডিসকাউন্ট',
      my: 'apply for Starlink reseller, Starlink Reseller Application, DSLink Reseller',
      'zh-CN': 'apply for Starlink reseller, Starlink 经销商申请, DSLink 经销商门户',
    },
  },
  resell_authorized_retailer: {
    title: {
      en: 'Starlink Authorized Retailer Inquiry | DSLink',
      bn: 'Starlink অথরাইজড রিটেইলার ইনকোয়ারি ও আবেদন | DSLink',
      my: 'Starlink တရားဝင် လက်လီရောင်းချသူ စုံစမ်းမေးမြန်းခြင်း | DSLink',
      'zh-CN': 'Starlink 授权零售商咨询与申请 | DSLink',
    },
    description: {
      en: 'Submit a Starlink authorized retailer application inquiry through DSLink. DSLink receives your retail hardware inquiry while Starlink grants official Starlink authorization.',
      bn: 'DSLink-এর মাধ্যমে Starlink হার্ডওয়্যার খুচরা বিক্রয়ের জন্য রিটেইলার ইনকোয়ারি জমা দিন। DSLink আপনার ইনকোয়ারি গ্রহণ করে এবং অফিশিয়াল Starlink অথরাইজেশন প্রদান করে Starlink।',
      my: 'DSLink မှတစ်ဆင့် Starlink လက်လီရောင်းချခွင့် (Starlink authorized retailer application) စုံစမ်းမေးမြန်းနိုင်ပါသည်။ DSLink သည် စုံစမ်းမှုကို လက်ခံပြီး တရားဝင်ခွင့်ပြုချက်ကို Starlink မှ ပေးအပ်ပါသည်။',
      'zh-CN': '通过 DSLink 提交 Starlink 授权零售商申请咨询（Starlink authorized retailer application）。DSLink 接收您的零售渠道咨询，官方 Starlink 授权由 Starlink 授予。',
    },
    keywords: {
      en: 'Starlink authorized retailer application, Starlink Authorized Retailer Inquiry, Starlink hardware retail Bangladesh, DSLink retailer inquiry',
      bn: 'Starlink authorized retailer application, স্টারলিংক অথরাইজড রিটেইলার ইনকোয়ারি, DSLink রিটেইলার',
      my: 'Starlink authorized retailer application, Starlink Retailer Inquiry, DSLink',
      'zh-CN': 'Starlink authorized retailer application, Starlink 授权零售商咨询, DSLink',
    },
  },
  resell_business_partnership: {
    title: {
      en: 'Starlink Business Partnership in Bangladesh | DSLink',
      bn: 'বাংলাদেশে Starlink বিজনেস পার্টনারশিপ ও বাল্ক ডিস্ট্রিবিউশন | DSLink',
      my: 'ဘင်္ဂလားဒေ့ရှ်နှင့် နိုင်ငံတကာ Starlink စီးပွားရေး မိတ်ဖက်အစီအစဉ် | DSLink',
      'zh-CN': '孟加拉国及国际市场 Starlink 商业合作与批量分销 | DSLink',
    },
    description: {
      en: 'Submit a Starlink business partnership inquiry with DSLink for bulk hardware orders, regional distribution, and international shipping partnerships across Bangladesh, South Asia, and global markets.',
      bn: 'বাল্ক Starlink হার্ডওয়্যার অর্ডার, ডিস্ট্রিবিউশন এবং আন্তর্জাতিক শিপিং পার্টনারশিপের জন্য DSLink-এ Starlink বিজনেস পার্টনারশিপ ইনকোয়ারি জমা দিন।',
      my: 'Starlink စက်ပစ္စည်း အမြောက်အမြား မှာယူခြင်း၊ ဖြန့်ဖြူးခြင်းနှင့် နိုင်ငံတကာ ပို့ဆောင်ရေး မိတ်ဖက်အစီအစဉ်များ (Starlink business partnership) အတွက် DSLink သို့ ဆက်သွယ်ပါ။',
      'zh-CN': '向 DSLink 提交 Starlink 商业合作咨询（Starlink business partnership），洽谈批量硬件采购、区域分销及面向孟加拉国与国际市场的物流配送合作。',
    },
    keywords: {
      en: 'Starlink business partnership, Starlink Business Partnership in Bangladesh, bulk Starlink hardware orders, Starlink distribution partnership, DSLink',
      bn: 'Starlink business partnership, স্টারলিংক বিজনেস পার্টনারশিপ বাংলাদেশ, বাল্ক হার্ডওয়্যার অর্ডার, DSLink',
      my: 'Starlink business partnership, Starlink စီးပွားရေး မိတ်ဖက်, DSLink',
      'zh-CN': 'Starlink business partnership, Starlink 商业合作, 批量硬件采购, DSLink',
    },
  },
  money_back: {
    title: {
      en: '90-Day Roaming Money-Back Guarantee & Refund Policy | DSLink',
      bn: '৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি ও রিফান্ড নীতিমালা | DSLink',
      my: 'ရက် ၉၀ Roaming ငွေပြန်အမ်း အာမခံနှင့် ပြန်အမ်းငွေ မူဝါဒ | DSLink',
      'zh-CN': '90 天漫游退款保障与退款政策 | DSLink',
    },
    description: {
      en: 'Review DSLink 90-day roaming money-back guarantee eligibility, return inspection terms, and claim instructions for qualifying purchased Starlink kits.',
      bn: 'যোগ্য ক্রয়কৃত Starlink কিটের জন্য DSLink-এর ৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি শর্তাবলি, রিটার্ন যাচাই ও রিফান্ড আবেদন প্রক্রিয়া জানুন।',
      my: 'ဝယ်ယူထားသော Starlink Kit များအတွက် DSLink ၏ ရက် ၉၀ Roaming ငွေပြန်အမ်း အာမခံ စည်းကမ်းချက်များနှင့် လျှောက်ထားပုံကို ဖတ်ရှုပါ။',
      'zh-CN': '查看 DSLink 针对符合条件的买断 Starlink 套件提供的 90 天漫游退款保障资格、退货检查条款及退款申请流程。',
    },
    keywords: {
      en: 'Starlink 90-day money-back guarantee, DSLink refund policy, Starlink kit return Bangladesh',
      bn: '৯০ দিনের মানি-ব্যাক গ্যারান্টি, DSLink রিফান্ড নীতিমালা, Starlink রিটার্ন',
      my: 'ရက် ၉၀ ငွေပြန်အမ်း အာမခံ, DSLink Refund Policy',
      'zh-CN': 'Starlink 90 天退款保障, DSLink 退款政策',
    },
  },
  services: {
    title: {
      en: 'Enterprise Software, Telecom & Starlink Integration Services | Dev Spark Soft Limited',
      bn: 'এন্টারপ্রাইজ সফটওয়্যার, টেলিকম ও Starlink ইন্টিগ্রেশন সার্ভিস | Dev Spark Soft Limited',
      my: 'Enterprise Software၊ Telecom နှင့် Starlink ဝန်ဆောင်မှုများ | Dev Spark Soft Limited',
      'zh-CN': '企业软件开发、电信工程与 Starlink 集成服务 | Dev Spark Soft Limited',
    },
    description: {
      en: 'Dev Spark Soft Limited delivers Starlink enterprise deployments, network failover architecture, custom software engineering, and FinTech payment integrations in Bangladesh.',
      bn: 'Dev Spark Soft Limited বাংলাদেশে Starlink এন্টারপ্রাইজ ডিপ্লয়মেন্ট, নেটওয়ার্ক ব্যাকআপ, কাস্টম সফটওয়্যার ইঞ্জিনিয়ারিং ও ফিনটেক পেমেন্ট ইন্টিগ্রেশন সার্ভিস প্রদান করে।',
      my: 'Dev Spark Soft Limited သည် Starlink Enterprise တပ်ဆင်ခြင်း၊ ကွန်ရက်ချိတ်ဆက်ခြင်းနှင့် Software Engineering ဝန်ဆောင်မှုများ ပေးအပ်ပါသည်။',
      'zh-CN': 'Dev Spark Soft Limited 在孟加拉国提供 Starlink 企业级部署、网络容灾架构、定制软件工程及金融科技支付集成服务。',
    },
    keywords: {
      en: 'Dev Spark Soft Limited services, Starlink enterprise deployment Bangladesh, enterprise software Dhaka, telecom integration',
      bn: 'Dev Spark Soft Limited সার্ভিস, Starlink এন্টারপ্রাইজ ডিপ্লয়মেন্ট, সফটওয়্যার ডেভেলপমেন্ট ঢাকা',
      my: 'Dev Spark Soft Limited services, Starlink Enterprise Bangladesh',
      'zh-CN': 'Dev Spark Soft Limited 服务, Starlink 企业部署, 孟加拉软件开发',
    },
  },
  not_found: {
    title: {
      en: 'Page Not Found (404) | DevSpark Link (DSLink)',
      bn: 'পৃষ্ঠা পাওয়া যায়নি (404) | DevSpark Link (DSLink)',
      my: 'စာမျက်နှာ မတွေ့ပါ (404) | DevSpark Link (DSLink)',
      'zh-CN': '页面未找到 (404) | DevSpark Link (DSLink)',
    },
    description: {
      en: 'The page you requested could not be found on DevSpark Link (DSLink). Browse our Starlink kits, rental offer, or contact support.',
      bn: 'আপনার অনুরোধ করা পৃষ্ঠাটি DevSpark Link (DSLink)-এ পাওয়া যায়নি। আমাদের Starlink কিট, রেন্টাল অফার বা সাপোর্ট পেজ দেখুন।',
      my: 'သင်ရှာဖွေနေသော စာမျက်နှာကို DevSpark Link (DSLink) တွင် မတွေ့ပါ။ Starlink Kit များနှင့် ငှားရမ်းခြင်း စာမျက်နှာသို့ ပြန်သွားပါ။',
      'zh-CN': '您在 DevSpark Link (DSLink) 上请求的页面不存在。请浏览我们的 Starlink 套件目录、租赁方案或联系支持团队。',
    },
    keywords: {
      en: '404, Page Not Found, DSLink',
      bn: '404, পৃষ্ঠা পাওয়া যায়নি, DSLink',
      my: '404, Page Not Found, DSLink',
      'zh-CN': '404, 页面未找到, DSLink',
    },
  },
};

/**
 * Resolves stable, IP-independent SEO metadata for a given domain and locale URL pathname.
 * Titles, descriptions, canonical URLs, and hreflang links depend strictly on the locale URL
 * (never on visitor IP country).
 */
export function getLocalizedRouteSeo(
  domain: 'devsparksoft.com.bd' | 'dslink.cyou',
  pathname: string = '/',
  explicitLangOverride?: string | null
): LocalizedRouteSeo {
  const parsed = parseLocalePath(pathname);
  const language: PublishedSeoLanguage = parsed.hasExplicitPrefix
    ? parsed.locale
    : explicitLangOverride
    ? normalizeSeoLanguage(explicitLangOverride)
    : parsed.locale;

  const localeMeta = getLocaleSeoMeta(language);
  const rawBasePath =
    parsed.basePath === '/devsparksoft' || parsed.basePath === '/dslink'
      ? '/'
      : parsed.basePath;
  const lowerPath = rawBasePath.toLowerCase();
  const isResellPublicRoute =
    lowerPath === '/resell' ||
    lowerPath === '/resell/authorized-retailer' ||
    lowerPath === '/resell/business-partnership';
  const origin =
    domain === 'devsparksoft.com.bd' || isResellPublicRoute
      ? 'https://devsparksoft.com.bd'
      : 'https://dslink.cyou';
  const isKnownRoute = isKnownSiteRoute(rawBasePath);
  const noindex = !isKnownRoute || isPrivateOrNonIndexablePath(rawBasePath);

  let canonicalBasePath = rawBasePath;
  let title = '';
  let description = '';
  let keywords = '';
  let isArticle = false;

  if (!isKnownRoute) {
    const entry = ROUTE_SEO_CATALOG.not_found;
    title = entry.title[language];
    description = entry.description[language];
    keywords = entry.keywords[language];
  } else if (lowerPath.startsWith('/legal/')) {
    const slug = lowerPath.slice('/legal/'.length);
    const policy = resolveLegalPolicyBySlug(slug);
    if (policy) {
      canonicalBasePath = policy.path;
      const localizedPolicyTitle =
        language === 'bn'
          ? policy.titleBn
          : language === 'my'
          ? policy.titleMy
          : policy.titleEn;
      const localizedShort =
        language === 'bn'
          ? policy.shortDescBn
          : language === 'my'
          ? policy.shortDescMy
          : policy.shortDescEn;
      const localizedIntro =
        language === 'bn'
          ? policy.introBn
          : language === 'my'
          ? policy.introMy
          : policy.introEn;

      if (language === 'zh-CN') {
        title = `${policy.titleEn} — DSLink 法律与政策中心`;
        description = `DSLink 官方政策条款：${policy.titleEn}。${policy.shortDescEn}`.slice(0, 180);
      } else {
        title = `${localizedPolicyTitle} | DSLink — DevSparkSoft`;
        description = `${localizedShort} ${localizedIntro}`.slice(0, 180);
      }
      keywords = `${policy.titleEn}, ${policy.titleBn}, DSLink Legal, DEV SPARK SOFT LIMITED`;
      isArticle = true;
    }
  }

  if (!title) {
    let entryKey: keyof typeof ROUTE_SEO_CATALOG =
      domain === 'devsparksoft.com.bd' ? 'home_devsparksoft' : 'home_dslink';

    if (lowerPath === '/resell') {
      canonicalBasePath = '/resell';
      entryKey = 'resell';
    } else if (lowerPath === '/resell/authorized-retailer') {
      canonicalBasePath = '/resell/authorized-retailer';
      entryKey = 'resell_authorized_retailer';
    } else if (lowerPath === '/resell/business-partnership') {
      canonicalBasePath = '/resell/business-partnership';
      entryKey = 'resell_business_partnership';
    } else if (lowerPath === '/starlink-bangladesh') {
      canonicalBasePath = '/starlink-bangladesh';
      entryKey = 'starlink_bangladesh';
    } else if (lowerPath === '/starlink-myanmar') {
      canonicalBasePath = '/starlink-myanmar';
      entryKey = 'starlink_myanmar';
    } else if (lowerPath === '/worldwide-delivery') {
      canonicalBasePath = '/worldwide-delivery';
      entryKey = 'worldwide_delivery';
    } else if (lowerPath === '/roaming-packages') {
      canonicalBasePath = '/roaming-packages';
      entryKey = 'roaming_packages';
    } else if (
      lowerPath === '/money-back' ||
      lowerPath === '/refund-claim' ||
      lowerPath === '/refund-policy' ||
      lowerPath === '/guarantee'
    ) {
      canonicalBasePath = '/money-back';
      entryKey = 'money_back';
    } else if (
      lowerPath === '/warranty' ||
      lowerPath === '/warranty-claim' ||
      lowerPath === '/warranty-policy'
    ) {
      canonicalBasePath = '/warranty';
      entryKey = 'warranty';
    } else if (lowerPath === '/legal') {
      canonicalBasePath = '/Legal';
      entryKey = 'legal';
    } else if (lowerPath === '/rental' || lowerPath === '/rental-plan' || lowerPath === '/rent') {
      canonicalBasePath = '/rental';
      entryKey = 'rental';
    } else if (
      lowerPath === '/rental-policy' ||
      lowerPath === '/terms/rental' ||
      lowerPath === '/terms/rental-policy'
    ) {
      canonicalBasePath = '/rental-policy';
      entryKey = 'rental_policy';
    } else if (
      lowerPath === '/red-policy-alert' ||
      lowerPath === '/policy-alert' ||
      lowerPath === '/terms/red-policy-alert'
    ) {
      canonicalBasePath = '/red-policy-alert';
      entryKey = 'red_policy_alert';
    } else if (
      lowerPath === '/price-syndicate-alert' ||
      lowerPath === '/syndicate-alert' ||
      lowerPath === '/rental-kit-alert'
    ) {
      canonicalBasePath = '/price-syndicate-alert';
      entryKey = 'price_syndicate_alert';
    } else if (
      lowerPath === '/kits/starlink-standard-4x' ||
      lowerPath === '/products/starlink-standard-4x' ||
      lowerPath === '/kits/starlink-standard-4x-bd-residential' ||
      lowerPath === '/products/starlink-standard-4x-bd-residential'
    ) {
      canonicalBasePath = '/kits/starlink-standard-4x';
      entryKey = 'kit_standard_4x';
    } else if (
      lowerPath === '/kits/starlink-mini-kit' ||
      lowerPath === '/products/starlink-mini-kit' ||
      lowerPath === '/kits/starlink-mini-bd-residential' ||
      lowerPath === '/products/starlink-mini-bd-residential'
    ) {
      canonicalBasePath = '/kits/starlink-mini-kit';
      entryKey = 'kit_mini';
    } else if (lowerPath.startsWith('/kits/') || lowerPath.startsWith('/products/')) {
      const slug = lowerPath.startsWith('/kits/')
        ? lowerPath.slice('/kits/'.length)
        : lowerPath.slice('/products/'.length);
      const matchedProd = DEFAULT_CENTRAL_PRODUCTS[slug];
      if (matchedProd) {
        canonicalBasePath = `/kits/${matchedProd.id}`;
        title = `${matchedProd.name} (${formatBdt(matchedProd.price)}) | DSLink`;
        description = matchedProd.description.slice(0, 180);
        keywords = `${matchedProd.name}, Starlink accessories Bangladesh, DSLink`;
      } else {
        canonicalBasePath = '/kits';
        entryKey = 'kits';
      }
    } else if (lowerPath === '/kits' || lowerPath === '/products') {
      canonicalBasePath = '/kits';
      entryKey = 'kits';
    } else if (lowerPath === '/services') {
      canonicalBasePath = '/services';
      entryKey = 'services';
    } else if (lowerPath === '/packages') {
      canonicalBasePath = '/packages';
      entryKey = 'packages';
    } else if (lowerPath === '/faq') {
      canonicalBasePath = '/faq';
      entryKey = 'faq';
    } else if (lowerPath === '/support') {
      canonicalBasePath = '/support';
      entryKey = 'support';
    } else if (lowerPath === '/privacy') {
      canonicalBasePath = '/privacy';
      entryKey = 'privacy';
    } else if (lowerPath === '/offers') {
      canonicalBasePath = '/offers';
      entryKey = 'offers';
    } else if (lowerPath === '/image-gallery' || lowerPath === '/gallery') {
      canonicalBasePath = '/image-gallery';
      entryKey = 'image_gallery';
    } else if (lowerPath === '/blog' || lowerPath.startsWith('/blog/')) {
      canonicalBasePath = lowerPath === '/blog' ? '/blog' : rawBasePath;
      entryKey = 'blog';
    } else if (
      lowerPath === '/partnerships' ||
      lowerPath === '/partnership' ||
      lowerPath === '/partners' ||
      lowerPath === '/affiliate'
    ) {
      canonicalBasePath = '/partnerships';
      entryKey = 'partnerships';
    }

    if (!title) {
      const entry = ROUTE_SEO_CATALOG[entryKey];
      title = entry.title[language];
      description = entry.description[language];
      keywords = entry.keywords[language];
      isArticle = Boolean(entry.isArticle);
    }
  }

  const canonicalPath = noindex ? rawBasePath : buildLocalePath(canonicalBasePath, language);
  const canonicalUrl = `${origin}${canonicalPath === '' ? '/' : canonicalPath}`;
  const hreflangLinks = noindex ? [] : buildHreflangLinks(origin, canonicalBasePath);
  const ogLocaleAlternates = PUBLISHED_SEO_LOCALES.map((l) => l.ogLocale).filter(
    (loc) => loc !== localeMeta.ogLocale
  );

  return {
    language,
    htmlLang: localeMeta.htmlLang,
    title,
    description,
    keywords,
    ogLocale: localeMeta.ogLocale,
    ogLocaleAlternates,
    inLanguage: localeMeta.inLanguage,
    basePath: canonicalBasePath,
    canonicalPath,
    canonicalUrl,
    hreflangLinks,
    isArticle,
    noindex,
  };
}
