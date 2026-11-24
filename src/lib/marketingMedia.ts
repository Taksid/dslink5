import type { AppLanguage } from './i18n';

export type MarketingImageKey =
  | 'dhaka-rooftop-hero'
  | 'rural-bangladesh-family'
  | 'sundarbans-remote-deployment'
  | 'maritime-ocean-roaming'
  | 'coastal-community-support';

export interface MarketingMediaAsset {
  key: MarketingImageKey;
  basePath: string;
  width: number;
  height: number;
  aspectClass: string;
  /** Responsive object-position tuned so both people and Starlink kits stay visible on mobile & desktop */
  objectPositionClass: string;
  widths: number[];
  mobileCropWidths?: number[];
  fallbackSrc: string;
  alt: {
    en: string;
    bn: string;
    my: string;
  };
  caption: {
    en: string;
    bn: string;
    my: string;
  };
  locationLabel: {
    en: string;
    bn: string;
    my: string;
  };
}

export const MARKETING_OG_IMAGE_URL = '/assets/marketing/dhaka-rooftop-hero-og.jpg';

export const MARKETING_MEDIA: Record<MarketingImageKey, MarketingMediaAsset> = {
  'dhaka-rooftop-hero': {
    key: 'dhaka-rooftop-hero',
    basePath: '/assets/marketing/dhaka-rooftop-hero',
    width: 1600,
    height: 900,
    aspectClass: 'aspect-[16/9]',
    objectPositionClass: 'object-[68%_42%] md:object-[55%_45%]',
    widths: [800, 1200, 1600],
    mobileCropWidths: [480, 720],
    fallbackSrc: '/assets/marketing/dhaka-rooftop-hero-1200.webp',
    alt: {
      en: 'DevSpark Link engineer consulting a business client on a Dhaka twilight rooftop terrace beside Starlink Mini, Standard 4X, and Flat High Performance kits',
      bn: 'ঢাকার সন্ধ্যাকালীন রুফটপে Starlink Mini, Standard 4X ও Flat High Performance কিটের পাশে DevSpark Link ইঞ্জিনিয়ার ও ক্লায়েন্ট',
      my: 'ဒါကာမြို့ ခေါင်မိုးထပ်တွင် Starlink Mini၊ Standard 4X နှင့် Flat High Performance စက်များဘေး၌ DevSpark Link အင်ဂျင်နီယာနှင့် ဖောက်သည်',
    },
    caption: {
      en: 'Enterprise & Rooftop Starlink Deployments — Dhaka Skyline',
      bn: 'এন্টারপ্রাইজ ও রুফটপ স্টারলিংক ডিপ্লয়মেন্ট — ঢাকা স্কাইলাইন',
      my: 'မြို့ပြနှင့် စီးပွားရေးလုပ်ငန်းသုံး Starlink တပ်ဆင်မှု — ဒါကာ',
    },
    locationLabel: {
      en: 'Dhaka, Bangladesh',
      bn: 'ঢাকা, বাংলাদেশ',
      my: 'ဒါကာ၊ ဘင်္ဂလားဒေ့ရှ်',
    },
  },
  'rural-bangladesh-family': {
    key: 'rural-bangladesh-family',
    basePath: '/assets/marketing/rural-bangladesh-family',
    width: 1280,
    height: 720,
    aspectClass: 'aspect-[16/9]',
    objectPositionClass: 'object-[62%_38%] sm:object-center',
    widths: [480, 800, 1280],
    fallbackSrc: '/assets/marketing/rural-bangladesh-family-800.webp',
    alt: {
      en: 'DevSpark Link technician demonstrating Starlink connectivity to a smiling rural family in a Bangladesh village courtyard beside three Starlink kits',
      bn: 'বাংলাদেশের গ্রামীণ বাড়ির উঠোনে তিনটি স্টারলিংক কিটের পাশে পরিবারকে সংযোগ বুঝিয়ে দিচ্ছেন DevSpark Link টেকনিশিয়ান',
      my: 'ဘင်္ဂလားဒေ့ရှ် ကျေးလက်မိသားစုနှင့်အတူ Starlink စက်သုံးမျိုးဘေးတွင် ချိတ်ဆက်မှုရှင်းပြနေသော DevSpark Link ပညာရှင်',
    },
    caption: {
      en: 'Rural Bangladesh Home & Rental Kit Connectivity',
      bn: 'গ্রামীণ বাংলাদেশ হোম ও রেন্টাল কিট কানেক্টিভিটি',
      my: 'ကျေးလက်နေအိမ်နှင့် ငှားရမ်းခြင်း Starlink ချိတ်ဆက်မှု',
    },
    locationLabel: {
      en: 'Rural Bangladesh',
      bn: 'গ্রামীণ বাংলাদেশ',
      my: 'ကျေးလက် ဘင်္ဂလားဒေ့ရှ်',
    },
  },
  'sundarbans-remote-deployment': {
    key: 'sundarbans-remote-deployment',
    basePath: '/assets/marketing/sundarbans-remote-deployment',
    width: 1280,
    height: 720,
    aspectClass: 'aspect-[16/9]',
    objectPositionClass: 'object-[64%_35%] sm:object-center',
    widths: [480, 800, 1280],
    fallbackSrc: '/assets/marketing/sundarbans-remote-deployment-800.webp',
    alt: {
      en: 'Forest ranger reviewing a map with a DevSpark Link engineer at a Sundarbans mangrove river outpost alongside Starlink Mini, Standard 4X, and Flat High Performance terminals',
      bn: 'সুন্দরবনের নদীর পাড়ে ফরেস্ট রেঞ্জারের সাথে ম্যাপ দেখছেন DevSpark Link ইঞ্জিনিয়ার, সামনে স্টারলিংক মিনি, স্ট্যান্ডার্ড ৪X ও হাই পারফরম্যান্স কিট',
      my: 'ဆွန်ဒါဘန် မြစ်ကမ်းစခန်းတွင် သစ်တောအရာရှိနှင့်အတူ Starlink စက်များဘေး၌ မြေပုံကြည့်နေသော DevSpark Link အင်ဂျင်နီယာ',
    },
    caption: {
      en: 'Off-Grid Remote & Cross-Border Field Deployments',
      bn: 'অফ-গ্রিড দূরবর্তী এলাকা ও ক্রস-বর্ডার ফিল্ড ডিপ্লয়মেন্ট',
      my: 'ဝေးလံခေါင်သီသော ဒေသနှင့် နိုင်ငံတကာ ပို့ဆောင်တပ်ဆင်မှု',
    },
    locationLabel: {
      en: 'Sundarbans & Remote Sites',
      bn: 'সুন্দরবন ও দুর্গম অঞ্চল',
      my: 'ဆွန်ဒါဘန်နှင့် ဝေးလံဒေသများ',
    },
  },
  'maritime-ocean-roaming': {
    key: 'maritime-ocean-roaming',
    basePath: '/assets/marketing/maritime-ocean-roaming',
    width: 1280,
    height: 720,
    aspectClass: 'aspect-[16/9]',
    objectPositionClass: 'object-[64%_35%] sm:object-center',
    widths: [480, 800, 1280],
    fallbackSrc: '/assets/marketing/maritime-ocean-roaming-800.webp',
    alt: {
      en: 'Ship captain speaking with a DevSpark Link marine specialist on an open-ocean vessel deck at sunset next to mounted Starlink satellite terminals',
      bn: 'সমুদ্রগামী জাহাজের ডেকে ক্যাপ্টেনের সাথে স্টারলিংক মেরিটাইম ও রোমিং সলিউশন নিয়ে আলোচনা করছেন DevSpark Link স্পেশালিস্ট',
      my: 'ပင်လယ်ပြင် သင်္ဘောကုန်းပတ်ပေါ်တွင် ကပ္ပတိန်နှင့် Starlink ပင်လယ်ရေကြောင်း Roaming စက်များကို စစ်ဆေးနေသော DevSpark Link ပညာရှင်',
    },
    caption: {
      en: 'Maritime Vessels & Global Roaming Packages',
      bn: 'মেরিটাইম ভেসেল ও গ্লোবাল রোমিং প্যাকেজ',
      my: 'ပင်လယ်ရေကြောင်းနှင့် နိုင်ငံတကာ Roaming ပက်ကေ့ချ်များ',
    },
    locationLabel: {
      en: 'Bay of Bengal & Offshore',
      bn: 'বঙ্গোপসাগর ও মেরিটাইম',
      my: 'ပင်လယ်ရေကြောင်းနှင့် ကမ်းလွန်',
    },
  },
  'coastal-community-support': {
    key: 'coastal-community-support',
    basePath: '/assets/marketing/coastal-community-support',
    width: 1280,
    height: 720,
    aspectClass: 'aspect-[16/9]',
    objectPositionClass: 'object-[60%_42%] sm:object-center',
    widths: [480, 800, 1280],
    fallbackSrc: '/assets/marketing/coastal-community-support-800.webp',
    alt: {
      en: 'DevSpark Link technician speaking with a coastal fishing family on a Bangladesh beach at dusk beside Starlink Mini, Standard 4X, and Flat High Performance hardware',
      bn: 'উপকূলীয় সৈকতে সন্ধ্যার আলোয় তিনটি স্টারলিংক কিটের পাশে স্থানীয় পরিবারের সাথে কথা বলছেন DevSpark Link টেকনিশিয়ান',
      my: 'ကမ်းခြေညနေခင်းတွင် Starlink စက်များဘေး၌ ဒေသခံမိသားစုနှင့် ဆွေးနွေးနေသော DevSpark Link ပညာရှင်',
    },
    caption: {
      en: 'Dedicated Local Technical Support & 24-Month Warranty',
      bn: 'ডেডিকেটেড লোকাল টেকনিক্যাল সাপোর্ট ও ২৪ মাসের ওয়ারেন্টি',
      my: 'ဒေသတွင်း နည်းပညာပံ့ပိုးမှုနှင့် ၂၄ လ အစားထိုးအာမခံ',
    },
    locationLabel: {
      en: 'Coastal Bangladesh',
      bn: 'উপকূলীয় বাংলাদেশ',
      my: 'ကမ်းရိုးတန်း ဘင်္ဂလားဒေ့ရှ်',
    },
  },
};

export function buildSrcSet(basePath: string, widths: number[], ext: 'avif' | 'webp'): string {
  return widths.map((w) => `${basePath}-${w}.${ext} ${w}w`).join(', ');
}

export function getLocalizedMediaText(
  entry: { en: string; bn: string; my: string },
  language: AppLanguage | string
): string {
  if (language === 'bn') return entry.bn;
  if (language === 'my') return entry.my;
  return entry.en;
}
