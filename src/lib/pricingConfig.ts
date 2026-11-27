import { useEffect, useState, useCallback } from 'react';

export type ProductVariantType =
  | 'bd_residential'
  | 'global'
  | 'global_roam'
  | 'rental'
  | 'enterprise'
  | 'accessory';

export interface CentralProductPrice {
  id: string;
  name: string;
  nameBn: string;
  shortName?: string;
  variantLabel?: string;
  variantType?: ProductVariantType;
  category: 'rental' | 'purchase' | 'accessory';
  price: number;
  /** Crossed-out reference price shown on artwork (display only — never used as sale price or in structured data) */
  referencePrice?: number;
  billingType: 'one-time' | 'purchase';
  codEligible: boolean;
  globalDeliveryAvailable: boolean;
  description: string;
  descriptionBn: string;
  /** Concise card copy focused on kit and key purchase/subscription condition without duplicated price */
  cardSummary?: string;
  cardSummaryBn?: string;
  image: string;
  imageAlt?: string;
  detailUrl?: string;
  stock: number;
  active: boolean;
}

export interface CentralPricingSnapshot {
  version: number;
  updatedAt: string;
  currency: 'BDT';
  currencySymbol: '৳';
  products: Record<string, CentralProductPrice>;
}

export const RENTAL_TERMS_SUMMARY = {
  oneTimeFeeBdt: 3000,
  en: [
    'BDT 3,000 one-time rental kit fee (hardware ownership is not transferred)',
    'Monthly Starlink subscription is separate',
    'Fixed location only (registered Bangladesh service address)',
    'Residential plan only',
    'Up to 5 TB/month fair usage limit',
    'No travel or roaming supported on rental kits',
    'No Cash on Delivery (COD) — advance Bangla QR / bank / MFS payment required',
  ],
  bn: [
    '৳৩,০০০ এককালীন রেন্টাল কিট ফি (কিটের মালিকানা হস্তান্তর হয় না)',
    'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য',
    'শুধুমাত্র ফিক্সড লোকেশনে ব্যবহারযোগ্য',
    'শুধুমাত্র Residential প্ল্যানের জন্য প্রযোজ্য',
    'মাসিক সর্বোচ্চ ৫ টিবি (5 TB/month) পর্যন্ত ব্যবহার সীমা',
    'রেন্টাল কিটে ট্রাভেল বা রোমিং সুবিধা নেই',
    'Cash on Delivery (COD) প্রযোজ্য নয় — অগ্রিম Bangla QR / ব্যাংক / MFS পেমেন্ট প্রয়োজন',
  ],
} as const;

export const GLOBAL_DELIVERY_COPY = {
  headlineEn: 'Global Delivery Available — Worldwide Starlink Kit Shipping',
  headlineBn: 'Global Delivery Available — বাংলাদেশসহ বিশ্বব্যাপী Starlink Kit ডেলিভারি সুবিধা!',
  headlineMy: 'Global Delivery Available — ကမ္ဘာတစ်ဝှမ်း Starlink Kit ပို့ဆောင်ပေးခြင်း',
  disclaimerEn:
    'Worldwide delivery refers to Starlink hardware kit shipping. Starlink activation and roaming availability depend on the destination country, local regulations, and official Starlink service plans.',
  disclaimerBn:
    'বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই। স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য।',
  disclaimerMy:
    'နိုင်ငံတကာသို့ ပို့ဆောင်ပေးနိုင်သော်လည်း နိုင်ငံတိုင်းတွင် Starlink ဖွင့်လှစ်အသုံးပြုနိုင်မည်ဟု အာမမခံပါ။ ဒေသဆိုင်ရာ စည်းမျဉ်းများနှင့် Starlink မူဝါဒများ အကျုံးဝင်ပါသည်။',
  codEligibleNoteEn:
    'Cash on Delivery (COD) is available only in eligible areas of Bangladesh for outright kit purchases (check & verify activation before paying).',
  codEligibleNoteBn:
    'Cash on Delivery (COD): প্রযোজ্য এলাকায় (বাংলাদেশের ৬৪ জেলায় স্থায়ী কিট ক্রয়ে) পণ্য হাতে পেয়ে চেক ও অ্যাক্টিভেশন যাচাই করে পেমেন্ট করার সুবিধা।',
  codEligibleNoteMy:
    'Cash on Delivery (COD) ကို ဘင်္ဂလားဒေ့ရှ်နိုင်ငံအတွင်း သတ်မှတ်ဧရိယာများရှိ အပြီးအပိုင် ဝယ်ယူမှုများတွင်သာ ရရှိနိုင်ပါသည်။',
  subscriptionSeparateEn: 'Monthly Starlink subscription fees are separate.',
  subscriptionSeparateBn: 'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
  subscriptionSeparateMy: 'လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
  rentalOwnershipNoteEn:
    'The BDT 3,000 Standard 4X Rental fee is a one-time charge (hardware ownership is not transferred). Fixed location only, Residential plan only, up to 5 TB/month, no travel or roaming, no COD, and monthly Starlink subscription is separate.',
  rentalOwnershipNoteBn:
    'Standard 4X Rental Kit-এর ৩,০০০ টাকা এককালীন চার্জ (কিটের মালিকানা হস্তান্তর হয় না)। শুধুমাত্র ফিক্সড লোকেশন ও Residential প্ল্যান, সর্বোচ্চ ৫ টিবি/মাস, কোনো ট্রাভেল/রোমিং বা COD নেই, এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদা।',
  rentalOwnershipNoteMy:
    'Standard 4X Rental Kit ကြေး ৳3,000 သည် တစ်ကြိမ်သာ ပေးဆောင်ရသောကြေးဖြစ်ပြီး စက်ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ။ Fixed location နှင့် Residential plan အတွက်သာဖြစ်ပြီး 5 TB/month ကန့်သတ်ချက်ရှိကာ Roaming နှင့် COD မရနိုင်ပါ။',
} as const;

export const COD_ELIGIBLE_BD_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
  'Comilla',
  'Coxs Bazar',
  "Cox's Bazar",
  'Bogura',
  'Jessore',
  'Jashore',
  'Other',
];

export function isCodEligibleLocation(districtOrCountry?: string, isRental = false): boolean {
  if (isRental) return false;
  const val = (districtOrCountry || '').trim().toLowerCase();
  if (!val) return true; // default Dhaka, Bangladesh
  const nonBdHints = [
    'international',
    'worldwide',
    'global',
    'usa',
    'united states',
    'uk',
    'united kingdom',
    'myanmar',
    'india',
    'uae',
    'dubai',
    'saudi',
    'qatar',
    'singapore',
    'malaysia',
    'canada',
    'australia',
    'europe',
    'germany',
    'france',
    'japan',
    'africa',
  ];
  if (nonBdHints.some((hint) => val.includes(hint))) return false;
  return true;
}

export const CORE_FEATURED_VARIANT_IDS = [
  'starlink-standard-4x-bd-residential',
  'starlink-mini-bd-residential',
  'starlink-standard-4x',
  'starlink-mini-kit',
  'starlink-rental-kit',
] as const;

export const DEFAULT_CENTRAL_PRODUCTS: Record<string, CentralProductPrice> = {
  'starlink-standard-4x-bd-residential': {
    id: 'starlink-standard-4x-bd-residential',
    name: 'Starlink Standard 4X — Bangladesh Residential Purchase',
    nameBn: 'Starlink Standard 4X — বাংলাদেশ রেসিডেন্সিয়াল (ক্রয়)',
    shortName: 'Standard 4X (BD Residential)',
    variantLabel: 'Bangladesh Residential Purchase',
    variantType: 'bd_residential',
    category: 'purchase',
    price: 12500,
    referencePrice: 48000,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: false,
    description:
      'Starlink Standard 4X (Gen 3 Wi-Fi 6) kit for Bangladesh Residential purchase at BDT 12,500 (reference price BDT 48,000). FREE delivery & COD across Bangladesh. Monthly Starlink subscription is separate.',
    descriptionBn:
      'বাংলাদেশ রেসিডেন্সিয়াল ব্যবহারের জন্য Starlink Standard 4X (Gen 3 Wi-Fi 6) — মূল্য ৳১২,৫০০ (রেফারেন্স মূল্য ৳৪৮,০০০)। বাংলাদেশে ফ্রি ডেলিভারি ও COD সুবিধা। মাসিক Starlink সাবস্ক্রিপশন আলাদা।',
    cardSummary:
      'Gen 3 Wi-Fi 6 kit for Bangladesh Residential use. Free BD delivery & COD. Monthly Starlink subscription billed separately.',
    cardSummaryBn:
      'বাংলাদেশ রেসিডেন্সিয়াল ব্যবহারের জন্য Gen 3 Wi-Fi 6 কিট। ফ্রি ডেলিভারি ও COD। মাসিক সাবস্ক্রিপশন আলাদা।',
    image: '/assets/products/starlink-standard-4x-bd-residential.jpg',
    imageAlt:
      'Starlink Standard 4X Bangladesh Residential Purchase hardware kit offered at BDT 12,500 by DSLink',
    detailUrl: '/kits/starlink-standard-4x?variant=bd-residential',
    stock: 40,
    active: true,
  },
  'starlink-mini-bd-residential': {
    id: 'starlink-mini-bd-residential',
    name: 'Starlink Mini — Bangladesh Residential Purchase',
    nameBn: 'Starlink Mini — বাংলাদেশ রেসিডেন্সিয়াল (ক্রয়)',
    shortName: 'Starlink Mini (BD Residential)',
    variantLabel: 'Bangladesh Residential Purchase',
    variantType: 'bd_residential',
    category: 'purchase',
    price: 9500,
    referencePrice: 26500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: false,
    description:
      'Compact Starlink Mini kit with integrated Wi-Fi router for Bangladesh Residential purchase at BDT 9,500 (reference price BDT 26,500). FREE delivery & COD across Bangladesh. Monthly Starlink subscription is separate.',
    descriptionBn:
      'বাংলাদেশ রেসিডেন্সিয়াল ব্যবহারের জন্য Starlink Mini কিট — মূল্য ৳৯,৫০০ (রেফারেন্স মূল্য ৳২৬,৫০০)। বাংলাদেশে ফ্রি ডেলিভারি ও COD সুবিধা। মাসিক Starlink সাবস্ক্রিপশন আলাদা।',
    cardSummary:
      'Compact portable dish with built-in Wi-Fi router for Bangladesh Residential use. Free BD delivery & COD. Monthly subscription separate.',
    cardSummaryBn:
      'বিল্ট-ইন Wi-Fi রাউটারসহ কম্প্যাক্ট বাংলাদেশ রেসিডেন্সিয়াল কিট। ফ্রি ডেলিভারি ও COD। মাসিক সাবস্ক্রিপশন আলাদা।',
    image: '/assets/products/starlink-mini-bd-residential.jpg',
    imageAlt:
      'Starlink Mini Bangladesh Residential Purchase portable satellite kit offered at BDT 9,500 by DSLink',
    detailUrl: '/kits/starlink-mini-kit?variant=bd-residential',
    stock: 35,
    active: true,
  },
  'starlink-standard-4x': {
    id: 'starlink-standard-4x',
    name: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet',
    nameBn: 'Starlink Standard 4X USA Kit + Roam Unlimited Internet',
    shortName: 'Standard 4X USA Kit + Roam Unlimited',
    variantLabel: 'ROAM UNLIMITED',
    variantType: 'global',
    category: 'purchase',
    price: 41500,
    referencePrice: 48000,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Starlink Standard 4X USA Kit for use with the Starlink Roam Unlimited internet plan. The kit costs BDT 41,500. An active Roam Unlimited subscription is required and billed separately. Use Starlink while traveling in supported destinations, subject to local authorization, coverage, and Starlink’s roaming terms. Planning to use the kit in Myanmar, Thailand, Japan, Iran, Russia, or Ukraine? Contact DSLink before ordering so we can check availability for your exact destination.',
    descriptionBn:
      'Starlink Roam Unlimited ইন্টারনেট প্ল্যানের সাথে ব্যবহারের জন্য Starlink Standard 4X USA Kit — কিটের মূল্য ৳৪১,৫০০। একটি সক্রিয় Roam Unlimited সাবস্ক্রিপশন প্রয়োজন যা আলাদাভাবে বিল করা হয়। সমর্থিত গন্তব্যে ভ্রমণের সময় Starlink ব্যবহার করা যাবে (স্থানীয় অনুমোদন, কভারেজ ও Starlink-এর রোমিং শর্তাবলি প্রযোজ্য)। মিয়ানমার, থাইল্যান্ড, জাপান, ইরান, রাশিয়া বা ইউক্রেনে ব্যবহার করতে চাইলে অর্ডার করার আগে DSLink-এর সাথে যোগাযোগ করুন।',
    cardSummary:
      'USA Kit for Starlink Roam Unlimited travel use. Active Roam Unlimited subscription required and billed separately. Check destination rules on product page.',
    cardSummaryBn:
      'Starlink Roam Unlimited ভ্রমণ প্ল্যানের জন্য USA Kit। সক্রিয় Roam Unlimited সাবস্ক্রিপশন আলাদাভাবে বিল করা হয়। গন্তব্য শর্ত বিস্তারিত পেজে দেখুন।',
    image: '/assets/products/starlink-standard-4x-roam-unlimited.jpg',
    imageAlt:
      'Starlink Standard 4X USA Kit + Roam Unlimited Internet offered at BDT 41,500 by DSLink',
    detailUrl: '/kits/starlink-standard-4x',
    stock: 35,
    active: true,
  },
  'starlink-mini-kit': {
    id: 'starlink-mini-kit',
    name: 'Starlink Mini — Global Roam Purchase',
    nameBn: 'Starlink Mini — গ্লোবাল রোম পারচেজ (ক্রয়)',
    shortName: 'Starlink Mini (Global Roam)',
    variantLabel: 'Global Roam Purchase',
    variantType: 'global_roam',
    category: 'purchase',
    price: 21500,
    referencePrice: 26500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Ultra-portable Starlink Mini Global Roam Purchase kit with integrated Wi-Fi router at BDT 21,500 (reference price BDT 26,500). Ships free with COD in Bangladesh and worldwide via DHL Express / FedEx (activation and roaming depend on destination and plan). Monthly subscription is separate.',
    descriptionBn:
      'আল্ট্রা-পোর্টেবল Starlink Mini গ্লোবাল রোম পারচেজ (বিল্ট-ইন Wi-Fi রাউটারসহ) — মূল্য ৳২১,৫০০ (রেফারেন্স মূল্য ৳২৬,৫০০)। বাংলাদেশে ফ্রি ডেলিভারি ও COD এবং বিশ্বব্যাপী DHL/FedEx শিপিং। মাসিক সাবস্ক্রিপশন আলাদা।',
    cardSummary:
      'Portable dish with integrated Wi-Fi for Global Roam travel. Ships BD (COD) & worldwide (DHL/FedEx). Monthly subscription separate.',
    cardSummaryBn:
      'বিল্ট-ইন Wi-Fi সহ পোর্টেবল গ্লোবাল রোম কিট। বাংলাদেশ (COD) ও বিশ্বব্যাপী DHL/FedEx শিপিং। মাসিক সাবস্ক্রিপশন আলাদা।',
    image: '/assets/products/starlink-mini-global-roam.jpg',
    imageAlt:
      'Starlink Mini Global Roam Purchase portable satellite kit offered at BDT 21,500 by DSLink',
    detailUrl: '/kits/starlink-mini-kit',
    stock: 25,
    active: true,
  },
  'starlink-rental-kit': {
    id: 'starlink-rental-kit',
    name: 'Starlink Standard 4X — Rental',
    nameBn: 'Starlink Standard 4X — রেন্টাল কিট (এককালীন ফি)',
    shortName: 'Standard 4X Rental',
    variantLabel: 'Rental — One-Time Fee',
    variantType: 'rental',
    category: 'rental',
    price: 3000,
    billingType: 'one-time',
    codEligible: false,
    globalDeliveryAvailable: false,
    description:
      'Starlink Standard 4X Rental Kit — BDT 3,000 one-time fee (hardware ownership is not transferred). Separate monthly Starlink subscription, fixed location only, Residential plan only, up to 5 TB/month, no travel or roaming, and no COD.',
    descriptionBn:
      'Starlink Standard 4X রেন্টাল কিট — এককালীন ৳৩,০০০ ফি (মালিকানা হস্তান্তর হয় না)। আলাদা মাসিক Starlink সাবস্ক্রিপশন, শুধুমাত্র ফিক্সড লোকেশন ও Residential প্ল্যান, সর্বোচ্চ ৫ টিবি/মাস, কোনো ট্রাভেল/রোমিং বা COD নেই।',
    cardSummary:
      'Fixed-location Residential rental in Bangladesh (up to 5 TB/month). Monthly subscription separate. No roaming, no COD, ownership retained.',
    cardSummaryBn:
      'বাংলাদেশে ফিক্সড লোকেশন Residential রেন্টাল (সর্বোচ্চ ৫ টিবি/মাস)। মাসিক প্ল্যান আলাদা। রোমিং বা COD নেই।',
    image: '/assets/products/starlink-standard-4x-rental.jpg',
    imageAlt:
      'Starlink Standard 4X Rental kit in Bangladesh with BDT 3,000 one-time fee, fixed location Residential plan up to 5 TB per month',
    detailUrl: '/rental',
    stock: 50,
    active: true,
  },
  'starlink-high-performance': {
    id: 'starlink-high-performance',
    name: 'Starlink Flat High Performance Kit',
    nameBn: 'Starlink Flat High Performance এন্টারপ্রাইজ কিট',
    variantLabel: 'Enterprise Hardware Purchase',
    variantType: 'enterprise',
    category: 'purchase',
    price: 145000,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Heavy-duty Flat High Performance kit for maritime, enterprise, ISP backhaul, and in-motion connectivity.',
    descriptionBn:
      'কর্পোরেট, আইএসপি, জাহাজ ও চলমান যানবাহনের জন্য হেভি-ডিউটি ফ্ল্যাট হাই-পারফরম্যান্স স্টারলিংক কিট।',
    image: 'https://starlink.com/public-files/Starlink_HighPerformance_Hero_500x500.png',
    imageAlt: 'Starlink Flat High Performance enterprise satellite terminal kit',
    detailUrl: '/kits/starlink-high-performance',
    stock: 8,
    active: true,
  },
  'router-mini': {
    id: 'router-mini',
    name: 'Router Mini | WiFi 5 Mesh Extender',
    nameBn: 'Router Mini | WiFi 5 মেশ এক্সটেন্ডার',
    variantLabel: 'Official Accessory',
    variantType: 'accessory',
    category: 'accessory',
    price: 9500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Compact auxiliary WiFi router mesh node for extending Starlink coverage.',
    descriptionBn: 'স্টারলিংক নেটওয়ার্ক কভারেজ বাড়ানোর জন্য কম্প্যাক্ট WiFi 5 মেশ রাউটার।',
    image: 'https://starlink.com/public-files/500x500-Router_Mini_WiFi.png',
    imageAlt: 'Starlink Router Mini WiFi 5 mesh extender',
    detailUrl: '/kits/router-mini',
    stock: 20,
    active: true,
  },
  'router-3': {
    id: 'router-3',
    name: 'Gen 3 Tri-Band Wi-Fi 6 Router',
    nameBn: 'Gen 3 ট্রাই-ব্যান্ড Wi-Fi 6 রাউটার',
    variantLabel: 'Official Accessory',
    variantType: 'accessory',
    category: 'accessory',
    price: 14500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Tri-Band Wi-Fi 6 Router with two gigabit Ethernet ports.',
    descriptionBn: '২টি গিগাবিট ল্যান পোর্টসহ ট্রাই-ব্যান্ড Wi-Fi 6 রাউটার।',
    image: 'https://starlink.com/public-files/500x500-Router_Gen3.png',
    imageAlt: 'Starlink Gen 3 Tri-Band Wi-Fi 6 Router',
    detailUrl: '/kits/router-3',
    stock: 15,
    active: true,
  },
  'ethernet-adapter': {
    id: 'ethernet-adapter',
    name: 'Starlink Ethernet Adapter',
    nameBn: 'স্টারলিংক ইথারনেট অ্যাডাপ্টার',
    variantLabel: 'Official Accessory',
    variantType: 'accessory',
    category: 'accessory',
    price: 5500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Wired Gigabit RJ45 Ethernet adapter for direct LAN connections.',
    descriptionBn: 'সরাসরি তারযুক্ত গিগাবিট ল্যান সংযোগের জন্য ইথারনেট অ্যাডাপ্টার।',
    image: 'https://starlink.com/public-files/accessories_ethernet_adapter_500x500.png',
    imageAlt: 'Starlink wired Gigabit RJ45 Ethernet adapter',
    detailUrl: '/kits/ethernet-adapter',
    stock: 25,
    active: true,
  },
  'cable-15m': {
    id: 'cable-15m',
    name: 'Starlink 15m Shielded Cable',
    nameBn: 'স্টারলিংক ১৫ মিটার শিল্ডেড কেবল',
    variantLabel: 'Official Accessory',
    variantType: 'accessory',
    category: 'accessory',
    price: 6500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: '15m weatherproof outdoor Starlink replacement cable.',
    descriptionBn: '১৫ মিটার ওয়েদারপ্রুফ আউটডোর স্টারলিংক কেবল।',
    image: 'https://starlink.com/public-files/accessories_standard_cable_500x500.png',
    imageAlt: 'Starlink 15 meter weatherproof outdoor cable',
    detailUrl: '/kits/cable-15m',
    stock: 20,
    active: true,
  },
  'cable-30m': {
    id: 'cable-30m',
    name: 'Starlink 30m Extended Cable',
    nameBn: 'স্টারলিংক ৩০ মিটার এক্সটেন্ডেড কেবল',
    variantLabel: 'Official Accessory',
    variantType: 'accessory',
    category: 'accessory',
    price: 11500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: '30m weatherproof outdoor extended Starlink cable.',
    descriptionBn: '৩০ মিটার ওয়েদারপ্রুফ এক্সটেন্ডেড স্টারলিংক কেবল।',
    image: 'https://starlink.com/public-files/accessories_standard_cable_500x500.png',
    imageAlt: 'Starlink 30 meter extended outdoor cable',
    detailUrl: '/kits/cable-30m',
    stock: 15,
    active: true,
  },
};

export function createDefaultPricingSnapshot(): CentralPricingSnapshot {
  const products: Record<string, CentralProductPrice> = {};
  for (const [key, item] of Object.entries(DEFAULT_CENTRAL_PRODUCTS)) {
    products[key] = { ...item };
  }
  return {
    version: 3,
    updatedAt: new Date().toISOString(),
    currency: 'BDT',
    currencySymbol: '৳',
    products,
  };
}

export const PRICING_UPDATED_EVENT = 'dslink-pricing-updated';
const PRICING_STORAGE_KEY = 'dslink_central_pricing_cache_v3';

let livePricingSnapshot: CentralPricingSnapshot = createDefaultPricingSnapshot();
let hasFetchedInitialPricing = false;
let inflightPricingRequest: Promise<CentralPricingSnapshot> | null = null;

function mergePricingSnapshot(incoming?: Partial<CentralPricingSnapshot> | null): CentralPricingSnapshot {
  const base = createDefaultPricingSnapshot();
  if (incoming && incoming.products && typeof incoming.products === 'object') {
    for (const [id, prod] of Object.entries(incoming.products)) {
      if (!prod || typeof prod !== 'object') continue;
      const numericPrice = Number(prod.price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) continue;
      if (base.products[id]) {
        const canonical = base.products[id];
        base.products[id] = {
          ...canonical,
          ...prod,
          id,
          price: Math.round(numericPrice),
          // Preserve verified local artwork paths for the core 5 catalog variants
          image: canonical.image.startsWith('/assets/products/')
            ? canonical.image
            : String(prod.image || canonical.image),
          imageAlt: canonical.imageAlt || prod.imageAlt,
          cardSummary: canonical.cardSummary || prod.cardSummary,
          cardSummaryBn: canonical.cardSummaryBn || prod.cardSummaryBn,
          referencePrice: canonical.referencePrice ?? prod.referencePrice,
          variantLabel: canonical.variantLabel || prod.variantLabel,
          variantType: canonical.variantType || prod.variantType,
        };
      } else {
        base.products[id] = {
          id,
          name: String(prod.name || id),
          nameBn: String(prod.nameBn || prod.name || id),
          category: prod.category || 'purchase',
          price: Math.round(numericPrice),
          billingType: prod.billingType || 'purchase',
          codEligible: prod.codEligible !== false,
          globalDeliveryAvailable: prod.globalDeliveryAvailable !== false,
          description: String(prod.description || ''),
          descriptionBn: String(prod.descriptionBn || prod.description || ''),
          image: String(prod.image || ''),
          stock: Number(prod.stock) || 10,
          active: prod.active !== false,
        };
      }
    }
  }
  return {
    ...base,
    version: Number(incoming?.version) || base.version,
    updatedAt: incoming?.updatedAt || new Date().toISOString(),
  };
}

export function getCachedCentralPricing(): CentralPricingSnapshot {
  return livePricingSnapshot;
}

export function getCentralProduct(productId: string): CentralProductPrice | undefined {
  const raw = (productId || '').trim();
  const key = raw.toLowerCase();
  if (livePricingSnapshot.products[raw]) return livePricingSnapshot.products[raw];
  if (livePricingSnapshot.products[key]) return livePricingSnapshot.products[key];
  if (key.includes('rental')) return livePricingSnapshot.products['starlink-rental-kit'];
  if ((key.includes('standard') || key.includes('4x')) && (key.includes('bd') || key.includes('residential'))) {
    return livePricingSnapshot.products['starlink-standard-4x-bd-residential'];
  }
  if (key.includes('mini') && !key.includes('router') && (key.includes('bd') || key.includes('residential'))) {
    return livePricingSnapshot.products['starlink-mini-bd-residential'];
  }
  if (key === 'starlink-standard-4x' || key.includes('standard-4x') || key === 'standard_4x') {
    return livePricingSnapshot.products['starlink-standard-4x'];
  }
  if (key === 'starlink-mini-kit' || key.includes('mini-kit') || key === 'mini') {
    return livePricingSnapshot.products['starlink-mini-kit'];
  }
  return undefined;
}

export function getCentralProductPrice(productId: string, fallbackPrice?: number): number {
  const matched = getCentralProduct(productId);
  if (matched && Number.isFinite(matched.price)) return matched.price;
  if (typeof fallbackPrice === 'number' && Number.isFinite(fallbackPrice)) return fallbackPrice;
  return 0;
}

function broadcastPricingUpdate(snapshot: CentralPricingSnapshot) {
  livePricingSnapshot = snapshot;
  if (typeof window !== 'undefined') {
    (window as any).__DSLINK_PRICING__ = snapshot;
    try {
      window.localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore storage quota restrictions
    }
    window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: snapshot }));
  }
}

export async function fetchCentralPricing(force = false): Promise<CentralPricingSnapshot> {
  if (typeof window === 'undefined') return livePricingSnapshot;
  if (!force && hasFetchedInitialPricing && inflightPricingRequest === null) {
    return livePricingSnapshot;
  }
  if (inflightPricingRequest && !force) return inflightPricingRequest;

  inflightPricingRequest = fetch('/api/pricing', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Pricing API ${res.status}`);
      const json = await res.json();
      const merged = mergePricingSnapshot(json?.pricing || json);
      hasFetchedInitialPricing = true;
      broadcastPricingUpdate(merged);
      return merged;
    })
    .catch(() => {
      hasFetchedInitialPricing = true;
      return livePricingSnapshot;
    })
    .finally(() => {
      inflightPricingRequest = null;
    });

  return inflightPricingRequest;
}

export async function syncAdminProductPriceToServer(
  productId: string,
  price: number,
  meta?: Partial<CentralProductPrice> & { adminEmail?: string }
): Promise<CentralPricingSnapshot> {
  const numericPrice = Math.max(0, Math.round(Number(price) || 0));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (meta?.adminEmail) {
    headers['x-admin-email'] = meta.adminEmail;
  }

  const res = await fetch(`/api/pricing/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      price: numericPrice,
      name: meta?.name,
      description: meta?.description,
      active: meta?.active,
      stock: meta?.stock,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.pricing) {
    const merged = mergePricingSnapshot(data.pricing);
    broadcastPricingUpdate(merged);
    return merged;
  }

  // Fallback local sync if server rejects or is offline during preview
  const next = mergePricingSnapshot({
    ...livePricingSnapshot,
    version: livePricingSnapshot.version + 1,
    updatedAt: new Date().toISOString(),
    products: {
      ...livePricingSnapshot.products,
      [productId]: {
        ...(livePricingSnapshot.products[productId] || {
          id: productId,
          name: meta?.name || productId,
          nameBn: meta?.name || productId,
          category: productId.includes('rental') ? 'rental' : 'purchase',
          price: numericPrice,
          billingType: productId.includes('rental') ? 'one-time' : 'purchase',
          codEligible: !productId.includes('rental'),
          globalDeliveryAvailable: !productId.includes('rental'),
          description: meta?.description || '',
          descriptionBn: meta?.description || '',
          image: '',
          stock: meta?.stock ?? 20,
          active: meta?.active ?? true,
        }),
        price: numericPrice,
      },
    },
  });
  broadcastPricingUpdate(next);
  return next;
}

export function formatBdt(amount: number): string {
  const safe = Math.max(0, Math.round(Number(amount) || 0));
  return `৳${safe.toLocaleString('en-US')}`;
}

export function formatBdtBn(amount: number): string {
  const formatted = formatBdt(amount);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return formatted.replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

// Attach global helpers so pre-compiled bundle & standalone pages read/write the exact same pricing store
if (typeof window !== 'undefined') {
  try {
    const cached = window.localStorage.getItem(PRICING_STORAGE_KEY);
    if (cached) {
      livePricingSnapshot = mergePricingSnapshot(JSON.parse(cached));
    }
  } catch {
    // ignore invalid cache
  }
  (window as any).__DSLINK_PRICING__ = livePricingSnapshot;
  (window as any).__DSLINK_GET_PRICE__ = getCentralProductPrice;
  (window as any).__DSLINK_FETCH_PRICING__ = fetchCentralPricing;
  (window as any).__DSLINK_UPDATE_PRICE__ = syncAdminProductPriceToServer;

  // Hydrate immediately from server on startup
  fetchCentralPricing(true);

  window.addEventListener('storage', (ev) => {
    if (ev.key === PRICING_STORAGE_KEY && ev.newValue) {
      try {
        const parsed = mergePricingSnapshot(JSON.parse(ev.newValue));
        livePricingSnapshot = parsed;
        (window as any).__DSLINK_PRICING__ = parsed;
        window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: parsed }));
      } catch {
        // ignore
      }
    }
  });
}

export function useCentralPricing() {
  const [pricing, setPricing] = useState<CentralPricingSnapshot>(() => getCachedCentralPricing());
  const [loading, setLoading] = useState<boolean>(!hasFetchedInitialPricing);

  useEffect(() => {
    let active = true;
    fetchCentralPricing().then((snap) => {
      if (active) {
        setPricing(snap);
        setLoading(false);
      }
    });

    const handleUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<CentralPricingSnapshot>).detail;
      if (detail) {
        setPricing(detail);
      } else {
        setPricing(getCachedCentralPricing());
      }
    };

    window.addEventListener(PRICING_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(PRICING_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const refreshPricing = useCallback(async () => {
    setLoading(true);
    const snap = await fetchCentralPricing(true);
    setPricing(snap);
    setLoading(false);
    return snap;
  }, []);

  const getPrice = useCallback(
    (productId: string, fallback?: number) => {
      const direct = pricing.products[productId];
      if (direct && Number.isFinite(direct.price)) return direct.price;
      return getCentralProductPrice(productId, fallback);
    },
    [pricing]
  );

  const getProduct = useCallback(
    (productId: string) => pricing.products[productId] || getCentralProduct(productId),
    [pricing]
  );

  return {
    pricing,
    loading,
    refreshPricing,
    getPrice,
    getProduct,
    rentalKitPrice: pricing.products['starlink-rental-kit']?.price ?? 3000,
    standard4xPrice: pricing.products['starlink-standard-4x']?.price ?? 41500,
    miniKitPrice: pricing.products['starlink-mini-kit']?.price ?? 21500,
    standard4xBdResidentialPrice:
      pricing.products['starlink-standard-4x-bd-residential']?.price ?? 12500,
    miniBdResidentialPrice:
      pricing.products['starlink-mini-bd-residential']?.price ?? 9500,
  };
}
