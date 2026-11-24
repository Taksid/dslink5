export type LegalPolicySlug =
  | 'rental-policy'
  | 'shipping-policy'
  | 'payment-policy'
  | 'subscription-policy'
  | 'location-policy'
  | 'fair-usage-policy'
  | 'restriction-policy'
  | 'return-policy'
  | 'cancellation-policy'
  | 'privacy-policy'
  | 'terms';

export type LegalIconKey =
  | 'file-check'
  | 'truck'
  | 'qr-code'
  | 'credit-card'
  | 'map-pin'
  | 'database'
  | 'shield-alert'
  | 'rotate-ccw'
  | 'x-circle'
  | 'lock'
  | 'scale';

export interface PolicySectionBlock {
  headingBn: string;
  headingMy: string;
  headingEn: string;
  paragraphsBn?: string[];
  paragraphsMy?: string[];
  paragraphsEn?: string[];
  bulletsBn?: string[];
  bulletsMy?: string[];
  bulletsEn?: string[];
}

export interface LegalPolicyDocument {
  slug: LegalPolicySlug;
  path: `/Legal/${LegalPolicySlug}`;
  icon: LegalIconKey;
  effectiveDateBn: string;
  effectiveDateMy: string;
  effectiveDateEn: string;
  lastUpdatedBn: string;
  lastUpdatedMy: string;
  lastUpdatedEn: string;
  titleBn: string;
  titleMy: string;
  titleEn: string;
  shortDescBn: string;
  shortDescMy: string;
  shortDescEn: string;
  metaTitle: string;
  metaDescription: string;
  introBn: string;
  introMy: string;
  introEn: string;
  sections: PolicySectionBlock[];
  conditionsBn: string[];
  conditionsMy: string[];
  conditionsEn: string[];
  relatedSlugs: LegalPolicySlug[];
}

export const LEGAL_EFFECTIVE_DATES = {
  effectiveDateBn: '৬ অক্টোবর, ২০২৬',
  effectiveDateMy: '၆ အောက်တိုဘာ ၂၀၂၆',
  effectiveDateEn: '6 October 2026',
  lastUpdatedBn: '১৮ নভেম্বর, ২০২৬',
  lastUpdatedMy: '၁၈ နိုဝင်ဘာ ၂၀၂၆',
  lastUpdatedEn: '18 November 2026',
};

export const LEGAL_POLICIES: LegalPolicyDocument[] = [
  {
    slug: 'rental-policy',
    path: '/Legal/rental-policy',
    icon: 'file-check',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'স্টারলিংক রেন্টাল কিট নীতিমালা (Rental Kit Policy)',
    titleMy: 'Starlink ငှားရမ်းစက် မူဝါဒ (Rental Kit Policy)',
    titleEn: 'Starlink Rental Kit Policy',
    shortDescBn: 'রেন্টাল কিট ৳৩,০০০ এককালীন চার্জ, মালিকানা ও ব্যবহারের শর্তাবলি।',
    shortDescMy: 'ငှားရမ်းစက် တစ်ကြိမ်ကြေး ৳၃,၀၀၀၊ ပိုင်ဆိုင်မှုနှင့် စည်းကမ်းများ။',
    shortDescEn: 'Rental Kit ৳3,000 one-time charge, ownership retention, and compliance rules.',
    metaTitle: 'Starlink Rental Kit Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Review DevSparkSoft Starlink Rental Kit Policy: ৳3,000 one-time charge, ownership terms, separate monthly subscription fees, and hardware return obligations.',
    introBn:
      'DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) গ্রাহকদের জন্য Starlink Standard 4X ও Starlink Mini রেন্টাল কিট প্রোগ্রাম পরিচালনা করে। Rental Kit-এর এককালীন চার্জ ৳৩,০০০ টাকা; কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    introMy:
      'DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) သည် Starlink Standard 4X နှင့် Starlink Mini ငှားရမ်းစက် အစီအစဉ်ကို ပံ့ပိုးပေးပါသည်။ တစ်ကြိမ်ကြေး ৳၃,၀၀၀ ဖြစ်ပြီး ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ။',
    introEn:
      'DEV SPARK SOFT LIMITED (operating DEVSPARK LINK / DSLINK) administers the Starlink Standard 4X and Starlink Mini Rental Kit program. The one-time rental kit charge is ৳3,000; hardware ownership is not transferred to the customer and monthly Starlink subscription fees apply separately.',
    sections: [
      {
        headingBn: '১. রেন্টাল কিট চার্জ (৳৩,০০০ এককালীন)',
        headingMy: '၁။ ငှားရမ်းစက် တစ်ကြိမ်ကြေး (৳၃,၀၀၀)',
        headingEn: '1. Rental Kit One-Time Charge (৳3,000)',
        bulletsBn: [
          'Starlink Rental Kit-এর এককালীন চার্জ (One-Time Charge) মাত্র ৳৩,০০০ টাকা।',
          'চেকআউটে bKash, Nagad, Rocket বা যেকোনো ব্যাংক অ্যাপ দিয়ে Bangla QR স্ক্যান করে ৳৩,০০০ টাকা পেমেন্ট করে অর্ডার সাবমিট করা যায়।',
          'Transaction ID দিয়ে “আমি পেমেন্ট করেছি” বাটনে ক্লিক করার পর অ্যাডমিন ম্যানুয়ালি যাচাই করে অর্ডার কনফার্ম করেন।',
          'মাসিক Starlink সাবস্ক্রিপশন ফি (Residential Lite বা Residential Unlimited) আলাদাভাবে প্রযোজ্য।',
        ],
        bulletsMy: [
          'Starlink ငှားရမ်းစက်၏ တစ်ကြိမ်ကြေးမှာ ৳၃,၀၀၀ ဖြစ်ပါသည်။',
          'bKash, Nagad, Rocket သို့မဟုတ် Bank App ဖြင့် Bangla QR စကင်ဖတ်ပြီး ৳၃,၀၀၀ ပေးချေ၍ အော်ဒါတင်နိုင်ပါသည်။',
          'Transaction ID ဖြည့်သွင်းပြီးနောက် Admin မှ ကိုယ်တိုင်စစ်ဆေး အတည်ပြုပေးပါမည်။',
          'လစဉ် Starlink Subscription ကြေးကို သီးခြားပေးသွင်းရပါမည်။',
        ],
        bulletsEn: [
          'The Starlink Rental Kit carries a one-time charge of ৳3,000.',
          'Customers pay ৳3,000 at checkout via Bangla QR (bKash, Nagad, Rocket, or any Bank app) and submit their Transaction ID.',
          'After clicking “I Have Paid”, our team manually verifies the Transaction ID and confirms the order.',
          'Monthly Starlink subscription fees (Residential Lite or Residential Unlimited) apply separately.',
        ],
      },
      {
        headingBn: '২. মালিকানা ও হস্তান্তর নিষেধাজ্ঞা',
        headingMy: '၂။ ပိုင်ဆိုင်မှုနှင့် လွှဲပြောင်းခွင့် ကန့်သတ်ချက်',
        headingEn: '2. Hardware Ownership & Transfer Prohibition',
        bulletsBn: [
          'রেন্টাল কিটের স্থায়ী মালিকানা DEV SPARK SOFT LIMITED-এর অধীনে সংরক্ষিত থাকে; এটি গ্রাহকের কাছে হস্তান্তরিত হয় না।',
          'রেন্টাল কিট বিক্রি, তৃতীয় পক্ষের কাছে হস্তান্তর, সাব-রেন্ট বা হার্ডওয়্যার পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ।',
          'ভুল বা অসত্য পরিচয় বা ঠিকানা দিলে রেন্টাল অর্ডার বাতিল করার অধিকার DevSparkSoft সংরক্ষণ করে।',
        ],
        bulletsMy: [
          'ငှားရမ်းစက်၏ အပြီးအပိုင် ပိုင်ဆိုင်မှုသည် DEV SPARK SOFT LIMITED တွင်သာ တည်ရှိပြီး ဝယ်ယူသူထံ လွှဲပြောင်းခြင်းမရှိပါ။',
          'စက်ကို ရောင်းချခြင်း၊ အခြားသူထံ လွှဲပြောင်းခြင်း၊ ထပ်ဆင့်ငှားရမ်းခြင်း သို့မဟုတ် ပြုပြင်ပြောင်းလဲခြင်း လုံးဝခွင့်မပြုပါ။',
          'မှားယွင်းသော လိပ်စာ သို့မဟုတ် အချက်အလက်များ ပေးသွင်းပါက အော်ဒါပယ်ဖျက်ခွင့်ရှိပါသည်။',
        ],
        bulletsEn: [
          'Permanent hardware ownership remains with DEV SPARK SOFT LIMITED and does not transfer to the renter.',
          'Selling, transferring to third parties, sub-renting, or modifying rental hardware is strictly prohibited.',
          'Orders containing false, incomplete, or unverifiable identity or service location details may be cancelled.',
        ],
      },
    ],
    conditionsBn: [
      'মাসে 5 TB-এর বেশি ডেটা ব্যবহার করা যাবে না।',
      'শুধুমাত্র প্রথম নিবন্ধিত লোকেশনে ব্যবহার করতে হবে; বাইরে ব্যবহার করলে সার্ভিস Restricted হবে।',
      'রোমিংসহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না — শুধুমাত্র Residential ও Residential Lite প্রযোজ্য।',
      'রেন্টাল সাবস্ক্রিপশন বাতিল হলে সম্পূর্ণ কিট অক্ষত অবস্থায় ফেরত দিতে হবে।',
      'এই নীতিমালা DevSparkSoft-এর নিজস্ব রেন্টাল ও সাপোর্ট শর্তাবলি; এটি Starlink-এর নিজস্ব অফিশিয়াল নীতিমালা নয়।',
    ],
    conditionsMy: [
      'တစ်လလျှင် 5 TB ထက်ပို၍ အသုံးမပြုနိုင်ပါ။',
      'ပထမမှတ်ပုံတင်လိပ်စာတွင်သာ အသုံးပြုရမည်ဖြစ်ပြီး ပြင်ပတွင်သုံးပါက Restricted ဖြစ်မည်။',
      'Roaming နှင့် အခြားပက်ကေ့ချ်များ မရရှိနိုင်ဘဲ Residential နှင့် Lite သာ အသုံးပြုနိုင်သည်။',
      'ဝန်ဆောင်မှုပယ်ဖျက်လျှင် စက်ပစ္စည်းအစုံအလင်ကို ပြန်လည်ပေးအပ်ရမည်။',
      'ဤစည်းကမ်းများသည် DevSparkSoft ၏ ကိုယ်ပိုင်ငှားရမ်းမှု စည်းမျဉ်းများဖြစ်ပြီး Starlink ၏ တရားဝင်မူဝါဒ မဟုတ်ပါ။',
    ],
    conditionsEn: [
      'Monthly data consumption cannot exceed 5 TB per billing cycle.',
      'Hardware may only be used at the first registered location; outside operation triggers Restricted status.',
      'Roaming and other package tiers are unavailable — only Residential and Residential Lite plans apply.',
      'Returning the complete hardware kit in working condition is mandatory upon rental cancellation.',
      'These are DevSparkSoft store rental compliance terms and are not presented as Starlink’s own official rules.',
    ],
    relatedSlugs: ['shipping-policy', 'payment-policy', 'location-policy', 'cancellation-policy'],
  },
  {
    slug: 'shipping-policy',
    path: '/Legal/shipping-policy',
    icon: 'truck',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'শিপিং ও ডেলিভারি নীতিমালা (Shipping & Delivery Policy)',
    titleMy: 'ပို့ဆောင်ရေး မူဝါဒ (Shipping & Delivery Policy)',
    titleEn: 'Shipping & Delivery Policy',
    shortDescBn: 'বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি, COD সুবিধা ও আন্তর্জাতিক অ্যাক্টিভেশন শর্তাবলি।',
    shortDescMy: 'ဘင်္ဂလားဒေ့ရှ်နှင့် ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး၊ COD နှင့် အသုံးပြုမှု စည်းကမ်းများ။',
    shortDescEn: 'Bangladesh & Global Delivery, Cash on Delivery (COD) areas, and international activation notes.',
    metaTitle: 'Shipping & Global Delivery Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Bangladesh and global Starlink kit delivery terms, Cash on Delivery (COD) availability, rental QR dispatch, and local regulatory activation disclaimers.',
    introBn:
      'DSLink (DEV SPARK SOFT LIMITED) এখন বাংলাদেশসহ বিশ্বের বিভিন্ন দেশে Starlink Standard Kit 4X ও Starlink Mini Kit ডেলিভারি সুবিধা প্রদান করছে। প্রযোজ্য এলাকায় Cash on Delivery (COD) এবং আন্তর্জাতিক ডেলিভারির শর্তাবলি নিচে উল্লেখ করা হলো।',
    introMy:
      'DSLink (DEV SPARK SOFT LIMITED) သည် ဘင်္ဂလားဒေ့ရှ်နှင့် ကမ္ဘာ့နိုင်ငံအသီးသီးသို့ Starlink Standard Kit 4X နှင့် Mini Kit များ ပို့ဆောင်ပေးနေပါသည်။',
    introEn:
      'DSLink (DEV SPARK SOFT LIMITED) delivers Starlink Standard Kit 4X and Starlink Mini Kit across Bangladesh and worldwide. Delivery timelines, Cash on Delivery (COD) areas, and international activation notices are detailed below.',
    sections: [
      {
        headingBn: '১. বিশ্বব্যাপী ডেলিভারি (Global Delivery Available)',
        headingMy: '၁။ ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး (Global Delivery)',
        headingEn: '1. Global Delivery & Unsupported Roaming Regions',
        bulletsBn: [
          'বাংলাদেশসহ বিশ্বের বিভিন্ন দেশে Starlink Standard Kit 4X (৳৪১,৫০০) ও Starlink Mini Kit (৳২১,৫০০) ডেলিভারি অর্ডার করা যায়।',
          'যেসব দেশে Starlink Roaming Service আনুষ্ঠানিকভাবে সাপোর্টেড নয়, সেসব দেশেও কিট ডেলিভারির বিষয়ে আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করতে পারবেন।',
          'বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই। স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য।',
        ],
        bulletsMy: [
          'ဘင်္ဂလားဒေ့ရှ်အပါအဝင် နိုင်ငံအသီးသီးသို့ Starlink Standard Kit 4X နှင့် Mini Kit များ မှာယူနိုင်ပါသည်။',
          'Starlink Roaming တရားဝင်မရရှိသေးသော နိုင်ငံများအတွက်လည်း ပို့ဆောင်ရေး ဆက်သွယ်မေးမြန်းနိုင်ပါသည်။',
          'နိုင်ငံတိုင်းတွင် Starlink အသုံးပြုနိုင်မည်ဟု အာမမခံနိုင်ပါ။ ဒေသဆိုင်ရာ ဥပဒေနှင့် Starlink မူဝါဒများ အကျုံးဝင်ပါသည်။',
        ],
        bulletsEn: [
          'Starlink Standard Kit 4X (৳41,500) and Starlink Mini Kit (৳21,500) can be ordered for delivery across Bangladesh and internationally.',
          'Customers in countries where Starlink Roaming Service is not officially supported may still contact our team regarding hardware delivery.',
          'While global hardware delivery is available, Starlink activation or roaming availability is not guaranteed in every country; local regulations and official Starlink policies apply.',
        ],
      },
      {
        headingBn: '২. Cash on Delivery (COD) ও রেন্টাল কিট ডেলিভারি',
        headingMy: '၂။ Cash on Delivery (COD) နှင့် ငှားရမ်းစက် ပို့ဆောင်ရေး',
        headingEn: '2. Cash on Delivery (COD) & Rental Kit Dispatch',
        bulletsBn: [
          'Cash on Delivery (COD): প্রযোজ্য এলাকায় (বাংলাদেশে স্থায়ী কিট ক্রয়ে) পণ্য হাতে পেয়ে চেক ও অ্যাক্টিভেশন যাচাই করে পেমেন্ট করার সুবিধা রয়েছে।',
          'ঢাকা মেট্রো: সাধারণত ২৪–৪৮ ঘণ্টা; ঢাকার বাইরে ৬৪ জেলায় ২–৪ কর্মদিবসের মধ্যে ডেলিভারি পৌঁছায়।',
          'রেন্টাল কিট অর্ডারে (৳৩,০০০ এককালীন চার্জ) bKash, Nagad, Rocket বা ব্যাংক অ্যাপ দিয়ে Bangla QR পেমেন্ট ও অ্যাডমিন ভেরিফিকেশনের পর ডিসপ্যাচ শুরু হয়।',
        ],
        bulletsMy: [
          'Cash on Delivery (COD): သတ်မှတ်ဧရိယာများတွင် စက်လက်ခံစစ်ဆေးပြီးမှ ငွေပေးချေနိုင်ပါသည်။',
          'ဒါကာမြို့တွင်း ၂၄–၄၈ နာရီ၊ ၆၄ ခရိုင်သို့ ၂–၄ ရက်အတွင်း ပို့ဆောင်ပေးပါသည်။',
          'ငှားရမ်းစက် အော်ဒါများတွင် ৳3,000 QR ငွေပေးချေမှု TrxID စစ်ဆေးအတည်ပြုပြီးနောက် ပို့ဆောင်ပေးပါမည်။',
        ],
        bulletsEn: [
          'Cash on Delivery (COD): Available only in eligible areas of Bangladesh for outright kit purchases so you can inspect and verify activation before paying.',
          'Inside Dhaka Metro: Typical delivery within 24–48 hours; outside Dhaka (64 districts): 2–4 business days.',
          'For Rental Kit orders (৳3,000 one-time charge), dispatch starts after manual admin verification of the submitted Bangla QR Transaction ID.',
        ],
      },
    ],
    conditionsBn: [
      'বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই। স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য।',
      'রেন্টাল কিট অর্ডারে Bangla QR TrxID ম্যানুয়াল ভেরিফিকেশন সম্পন্ন হওয়ার পর ডিসপ্যাচ প্রক্রিয়া শুরু হয়।',
      'ডেলিভারি গ্রহণের সময় গ্রাহককে বৈধ পরিচয় ও সঠিক ঠিকানায় উপস্থিত থাকতে হবে।',
    ],
    conditionsMy: [
      'နိုင်ငံတိုင်းတွင် Starlink အသုံးပြုခွင့် အာမမခံပါ — ဒေသဆိုင်ရာ ဥပဒေနှင့် Starlink မူဝါဒများ အကျုံးဝင်ပါသည်။',
      'QR TrxID ကို Admin မှ ကိုယ်တိုင်စစ်ဆေးပြီးမှသာ ပို့ဆောင်မှု စတင်ပါမည်။',
      'စက်လက်ခံချိန်တွင် ဝယ်ယူသူကိုယ်တိုင် ရှိနေရပါမည်။',
    ],
    conditionsEn: [
      'Global hardware delivery does not guarantee Starlink activation or roaming service in every jurisdiction; local laws and Starlink policies apply.',
      'Rental kit dispatch begins after manual verification of your submitted QR Transaction ID.',
      'The recipient must be available at the provided address with verifiable contact details upon arrival.',
    ],
    relatedSlugs: ['payment-policy', 'rental-policy', 'location-policy', 'cancellation-policy'],
  },
  {
    slug: 'payment-policy',
    path: '/Legal/payment-policy',
    icon: 'qr-code',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'Bangla QR পেমেন্ট নীতিমালা (Payment Policy)',
    titleMy: 'Bangla QR ငွေပေးချေမှု မူဝါဒ (Payment Policy)',
    titleEn: 'Bangla QR Payment Policy',
    shortDescBn: 'রেন্টাল কিটে (৳৩,০০০) শুধুমাত্র Bangla QR গ্রহণযোগ্য; COD প্রযোজ্য নয়।',
    shortDescMy: 'ငှားရမ်းစက် (৳3,000) အတွက် Bangla QR တစ်မျိုးတည်းသာ လက်ခံပြီး COD မရပါ။',
    shortDescEn: 'Bangla QR only for Starlink Rental Kits (৳3,000 one-time charge); no COD.',
    metaTitle: 'Bangla QR Payment Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'DevSparkSoft Bangla QR Payment Policy for Starlink Rental Kits: Bangla QR TrxID verification required for the ৳3,000 one-time charge; COD unavailable on Rental Kits.',
    introBn:
      'Starlink Rental Kit অর্ডারের নিরাপত্তা ও দ্রুত ডিসপ্যাচ নিশ্চিত করতে DevSparkSoft শুধুমাত্র Bangla QR পেমেন্ট গ্রহণ করে। এই পেমেন্ট নীতিমালা রেন্টাল অর্ডার এবং স্থায়ী কিট ক্রয়ের পার্থক্য স্পষ্ট করে।',
    introMy:
      'Starlink ငှားရမ်းစက် အော်ဒါများအတွက် DevSparkSoft သည် Bangla QR ငွေပေးချေမှု တစ်မျိုးတည်းကိုသာ လက်ခံပါသည်။',
    introEn:
      'To ensure verified order fulfillment for Starlink Rental Kits, DevSparkSoft exclusively accepts Bangla QR payments at rental checkout. This policy outlines payment verification and accepted methods.',
    sections: [
      {
        headingBn: '১. রেন্টাল অর্ডারে শুধুমাত্র Bangla QR প্রযোজ্য',
        headingMy: '၁။ ငှားရမ်းစက်အတွက် Bangla QR တစ်မျိုးတည်းသာ',
        headingEn: '1. Bangla QR Only for Rental Orders',
        bulletsBn: [
          'Starlink Rental Kit-এর এককালীন ৳৩,০০০ টাকা চার্জ শুধুমাত্র অফিশিয়াল Bangla QR কোডের মাধ্যমে পরিশোধ করতে হবে।',
          'গ্রাহক bKash, Nagad, Rocket অথবা যেকোনো Bangla QR সমর্থিত ব্যাংক অ্যাপ দিয়ে পেমেন্ট করতে পারবেন।',
          'পেমেন্ট সম্পন্ন করার পর ব্যবহৃত অ্যাপ/ব্যাংকের নাম এবং সঠিক Transaction ID (TrxID) চেকআউট ফরমে জমা দেওয়া বাধ্যতামূলক।',
        ],
        bulletsMy: [
          'Starlink ငှားရမ်းစက် တစ်ကြိမ်ကြေး ৳3,000 ကို Bangla QR ဖြင့်သာ ပေးချေရပါမည်။',
          'bKash, Nagad, Rocket သို့မဟုတ် Bangla QR ရရှိသော ဘဏ်အက်ပ်များဖြင့် ပေးချေနိုင်ပါသည်။',
          'ငွေပေးချေပြီးနောက် App/ဘဏ်အမည်နှင့် Transaction ID (TrxID) ကို ဖြည့်သွင်းရပါမည်။',
        ],
        bulletsEn: [
          'The ৳3,000 one-time charge for Starlink Rental Kits must be paid via the official Bangla QR code.',
          'You may pay using bKash, Nagad, Rocket, or any Bangla QR-enabled Bangladeshi banking app.',
          'Entering the sender app/bank name and valid Transaction ID (TrxID) on the checkout form is mandatory.',
        ],
      },
      {
        headingBn: '২. রেন্টাল কিটে COD প্রযোজ্য নয়',
        headingMy: '၂။ ငှားရမ်းမှုတွင် COD မရပါ',
        headingEn: '2. Cash on Delivery (COD) Unavailable on Rental',
        bulletsBn: [
          'রেন্টাল কিট অর্ডারে Cash on Delivery (COD) অ্যাভেইলেবল নয়।',
          'COD অর্ডার শুধুমাত্র প্রযোজ্য এলাকায় (বাংলাদেশে স্থায়ী মালিকানায় Standard Kit 4X ৳৪১,৫০০ / Mini Kit ৳২১,৫০০ ক্রয়ে) চালু রয়েছে।',
        ],
        bulletsMy: [
          'ငှားရမ်းစက် အော်ဒါများတွင် Cash on Delivery (COD) မရရှိနိုင်ပါ။',
          'COD ကို သတ်မှတ်ဧရိယာများရှိ အပြီးအပိုင်ဝယ်ယူမှု (Standard 4X ৳41,500 / Mini ৳21,500) တွင်သာ အသုံးပြုနိုင်သည်။',
        ],
        bulletsEn: [
          'Cash on Delivery (COD) is NOT available for Starlink Rental Kit orders.',
          'COD is available only in eligible areas of Bangladesh for outright hardware purchases (Standard Kit 4X ৳41,500 / Mini Kit ৳21,500).',
        ],
      },
    ],
    conditionsBn: [
      'ভুয়া বা যাচাই-অযোগ্য TrxID সাবমিট করলে অর্ডার বাতিল হবে।',
      'আগের কোনো ৩ মাস ফ্রি বা প্রমোশনাল ক্রেডিট অফার বর্তমানে চালু নেই।',
      'চেকআউটের ৳৩,০০০ এককালীন রেন্টাল চার্জের সাথে মাসিক সাবস্ক্রিপশন ফি যুক্ত হয় না — মাসিক সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    ],
    conditionsMy: [
      'မှားယွင်းသော သို့မဟုတ် အတည်ပြုမရသော TrxID တင်သွင်းပါက အော်ဒါပယ်ဖျက်မည်။',
      'ယခင် ၃ လအခမဲ့ ပရိုမိုးရှင်းများ မရှိတော့ပါ။',
      'တစ်ကြိမ်ကြေး ৳3,000 တွင် လစဉ်ကြေး မပါဝင်ပါ — လစဉ်ကြေး သီးခြားပေးဆောင်ရမည်။',
    ],
    conditionsEn: [
      'Submitting invalid or unverifiable TrxIDs will result in order cancellation.',
      'No 3-month free service or unapproved promotional credit offers apply.',
      'Rental checkout collects only the ৳3,000 one-time charge; monthly Starlink subscription fees are separate.',
    ],
    relatedSlugs: ['shipping-policy', 'subscription-policy', 'rental-policy', 'return-policy'],
  },
  {
    slug: 'subscription-policy',
    path: '/Legal/subscription-policy',
    icon: 'credit-card',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'মাসিক সাবস্ক্রিপশন ও বিলিং নীতিমালা (Subscription Policy)',
    titleMy: 'လစဉ်ကြေးနှင့် ငွေတောင်းခံမှု မူဝါဒ (Subscription Policy)',
    titleEn: 'Monthly Subscription & Billing Policy',
    shortDescBn: 'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য — Residential (৳৬,০০০) বা Lite (৳৪,২০০)।',
    shortDescMy: 'လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည် — Residential (৳6,000) သို့မဟုတ် Lite (৳4,200)။',
    shortDescEn: 'Monthly Starlink subscription fees are separate: Residential Lite (৳4,200) or Unlimited (৳6,000).',
    metaTitle: 'Monthly Subscription & Billing Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Monthly Starlink subscription fees apply separately from hardware pricing: Residential Lite ৳4,200/month and Residential Unlimited ৳6,000/month billing rules.',
    introBn:
      'Starlink হার্ডওয়্যার ক্রয় কিংবা রেন্টাল কিটের সাথে মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য। গ্রাহককে কেবল নির্বাচিত ইন্টারনেট প্যাকেজের মাসিক সাবস্ক্রিপশন ফি পরিশোধ করতে হয়।',
    introMy:
      'Starlink စက်ဝယ်ယူမှု သို့မဟုတ် ငှားရမ်းမှုအားလုံးအတွက် လစဉ် Starlink Subscription ကြေးကို သီးခြားပေးသွင်းရမည်။',
    introEn:
      'Monthly Starlink subscription fees are separate from hardware purchase and rental kit charges. Recurring monthly billing consists of the selected internet subscription package fee.',
    sections: [
      {
        headingBn: '১. অনুমোদিত মাসিক সাবস্ক্রিপশন প্যাকেজ ও মূল্য',
        headingMy: '၁။ ခွင့်ပြုထားသော လစဉ်ပက်ကေ့ချ်နှင့် စျေးနှုန်းများ',
        headingEn: '1. Eligible Monthly Subscription Plans & Pricing',
        bulletsBn: [
          'Residential Lite প্যাকেজ: মাসে ৳৪,২০০ টাকা (২০০ Mbps পর্যন্ত গতি)।',
          'Residential Unlimited প্যাকেজ: মাসে ৳৬,০০০ টাকা (৪০০+ Mbps পর্যন্ত গতি)।',
          'প্রাথমিক ৳৩,০০০ রেন্টাল কিট এককালীন চার্জের সাথে মাসিক সাবস্ক্রিপশন ফি স্বয়ংক্রিয়ভাবে যোগ করা হয় না — এটি আলাদাভাবে প্রযোজ্য।',
        ],
        bulletsMy: [
          'Residential Lite: တစ်လ ৳4,200 (200 Mbps အထိ)။',
          'Residential Unlimited: တစ်လ ৳6,000 (400+ Mbps အထိ)။',
          'တစ်ကြိမ်ကြေး ৳3,000 တွင် လစဉ်ကြေး မပါဝင်ဘဲ သီးခြားပေးဆောင်ရပါမည်။',
        ],
        bulletsEn: [
          'Residential Lite Subscription: ৳4,200/month (up to 200 Mbps).',
          'Residential Unlimited Subscription: ৳6,000/month (up to 400+ Mbps).',
          'Monthly Starlink subscription fees are billed separately and are not bundled into the ৳3,000 one-time Rental Kit charge.',
        ],
      },
      {
        headingBn: '২. বিলিং সাইকেল, রিনিউয়াল ও সাসপেনশন',
        headingMy: '၂။ ငွေပေးချေမှု စက်ဝန်းနှင့် သက်တမ်းတိုးခြင်း',
        headingEn: '2. Billing Cycle, Renewal & Service Pause Rules',
        bulletsBn: [
          'নিরবচ্ছিন্ন ইন্টারনেট চালু রাখতে প্রতি বিলিং তারিখের আগে মাসিক সাবস্ক্রিপশন ফি পরিশোধ করতে হবে।',
          'নির্ধারিত সময়ের মধ্যে বিল পরিশোধ না করলে সংযোগ সাময়িকভাবে স্থগিত (Suspended) হতে পারে।',
          'রেন্টাল কিটে সার্ভিস Pause অপশন প্রযোজ্য নয়; সংযোগ রাখতে মাসিক সাবস্ক্রিপশন সচল রাখতে হবে অথবা কিট ফেরত দিয়ে বাতিল করতে হবে।',
        ],
        bulletsMy: [
          'ဝန်ဆောင်မှု ဆက်လက်အသုံးပြုနိုင်ရန် လစဉ်ငွေပေးချေရက်မတိုင်မီ လစဉ်ကြေး ပေးသွင်းရမည်။',
          'အချိန်မီမပေးသွင်းပါက ဝန်ဆောင်မှု ယာယီရပ်ဆိုင်းနိုင်ပါသည်။',
          'ငှားရမ်းစက်များတွင် Service Pause ပြုလုပ်၍မရပါ။',
        ],
        bulletsEn: [
          'Monthly subscription payments must be settled ahead of each billing cycle to maintain active connectivity.',
          'Failure to pay on time may result in temporary service suspension.',
          'Service Pause is not available on Rental Kits; customers must keep billing active or cancel and return the complete kit.',
        ],
      },
    ],
    conditionsBn: [
      'রোমিং (Roaming) সহ অন্য কোনো নন-রেসিডেন্সিয়াল প্যাকেজ রেন্টাল কিটে অ্যাক্টিভ করা যাবে না।',
      'উভয় প্যাকেজেই মাসে সর্বোচ্চ 5 TB ফেয়ার ইউসেজ ডেটা সীমা প্রযোজ্য।',
      'সার্ভিস বাতিল করলে সম্পূর্ণ কিট ফেরত দেওয়ার পর পরবর্তী মাসিক বিলিং বন্ধ হবে।',
    ],
    conditionsMy: [
      'Roaming အပါအဝင် အခြားပက်ကေ့ချ်များ ပြောင်းလဲအသုံးပြုခွင့်မရှိပါ။',
      'ပက်ကေ့ချ်နှစ်ခုလုံးတွင် တစ်လ 5 TB ကန့်သတ်ချက်ရှိပါသည်။',
      'စက်ပြန်လည်ပေးအပ်ပြီးမှသာ လစဉ်ကြေးကောက်ခံမှု ရပ်တန့်မည်။',
    ],
    conditionsEn: [
      'Roaming and non-residential packages cannot be activated on Rental Kits.',
      'A 5 TB/month usage cap applies across both Residential Lite and Residential Unlimited rental subscriptions.',
      'Recurring subscription charges stop only after completing cancellation and returning the entire kit.',
    ],
    relatedSlugs: ['payment-policy', 'fair-usage-policy', 'restriction-policy', 'cancellation-policy'],
  },
  {
    slug: 'location-policy',
    path: '/Legal/location-policy',
    icon: 'map-pin',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'নিবন্ধিত লোকেশন ও ঠিকানা পরিবর্তন নীতিমালা (Location Policy)',
    titleMy: 'မှတ်ပုံတင်လိပ်စာနှင့် ပြောင်းလဲခြင်း မူဝါဒ (Location Policy)',
    titleEn: 'Registered Location & Address Change Policy',
    shortDescBn: 'শুধু প্রথম নিবন্ধিত লোকেশনে ব্যবহারযোগ্য; বাইরে Restricted; ১ বার বদলের সুযোগ।',
    shortDescMy: 'ပထမမှတ်ပုံတင်လိပ်စာတွင်သာ သုံးနိုင်ပြီး လိပ်စာ (၁) ကြိမ်သာ ပြောင်းခွင့်ရှိသည်။',
    shortDescEn: 'First registered location lock (Restricted outside) and 1-time address change limit.',
    metaTitle: 'Registered Location & Address Change Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Location lock policy for Starlink Rental Kits: operable only at the first registered address, Restricted status if moved outside, and strictly 1-time address change allowance.',
    introBn:
      'রেন্টাল কিটসমূহ নির্ধারিত রেসিডেন্সিয়াল সার্ভিস ঠিকানায় জিও-লক করা থাকে। অর্ডার দেওয়ার আগে এবং ব্যবহারের সময় সকল গ্রাহককে নিচের লোকেশন ও ঠিকানা পরিবর্তনের নিয়ম মেনে চলতে হবে।',
    introMy:
      'ငှားရမ်းစက်များသည် သတ်မှတ်ထားသော ပထမလိပ်စာတွင်သာ ချိတ်ဆက်ထားပါသည်။',
    introEn:
      'Starlink Rental Kits are geo-locked to the residential service address registered during checkout. All rental customers must adhere to the following fixed-location and address-update rules.',
    sections: [
      {
        headingBn: '১. প্রথম নিবন্ধিত লোকেশন বাধ্যতামূলক (First Location Lock)',
        headingMy: '၁။ ပထမမှတ်ပုံတင်လိပ်စာတွင်သာ အသုံးပြုရန်',
        headingEn: '1. First Registered Service Location Lock',
        bulletsBn: [
          'অর্ডারের সময় জমা দেওয়া প্রথম নিবন্ধিত লোকেশনেই (বাড়ি, রোড, থানা/জেলা) রেন্টাল কিট স্থাপন ও ব্যবহার করতে হবে।',
          'প্রথম নিবন্ধিত লোকেশনের বাইরে কিট সরিয়ে বা ভ্রমণে চালু করলে সংযোগ স্বয়ংক্রিয়ভাবে Restricted হয়ে যাবে।',
        ],
        bulletsMy: [
          'အော်ဒါတင်စဉ် ဖြည့်သွင်းခဲ့သည့် ပထမမှတ်ပုံတင်လိပ်စာတွင်သာ တပ်ဆင်အသုံးပြုရမည်။',
          'မှတ်ပုံတင်လိပ်စာပြင်ပသို့ ရွှေ့ပြောင်းဖွင့်လှစ်ပါက ဝန်ဆောင်မှု Restricted ဖြစ်သွားပါမည်။',
        ],
        bulletsEn: [
          'Hardware must be installed and operated exclusively at the first registered address submitted at checkout.',
          'Powering on or relocating the kit outside that registered service zone automatically causes the connection to become Restricted.',
        ],
      },
      {
        headingBn: '২. সর্বোচ্চ ১ বার অ্যাড্রেস পরিবর্তন (1-Time Address Change)',
        headingMy: '၂။ လိပ်စာ (၁) ကြိမ်သာ ပြောင်းလဲခွင့်',
        headingEn: '2. Strictly 1-Time Address Change Allowance',
        bulletsBn: [
          'পুরো রেন্টাল মেয়াদে গ্রাহক নিবন্ধিত সার্ভিস অ্যাড্রেস সর্বোচ্চ একবার (১ বার) পরিবর্তন করার সুযোগ পাবেন।',
          'একবার অ্যাড্রেস পরিবর্তন করার পর দ্বিতীয়বার কোনো ঠিকানা পরিবর্তনের আবেদন গ্রহণ করা হবে না।',
          'ভুল বা ভুয়া ঠিকানা দিলে অর্ডার বাতিল হতে পারে, তাই চেকআউটে সঠিক জেলা ও পূর্ণ ঠিকানা নিশ্চিত করুন।',
        ],
        bulletsMy: [
          'ငှားရမ်းကာလတစ်ခုလုံးတွင် လိပ်စာကို အများဆုံး (၁) ကြိမ်သာ ပြောင်းလဲခွင့်ရှိပါသည်။',
          'ဒုတိယအကြိမ် ထပ်မံပြောင်းလဲခွင့် မရှိပါ။',
          'မှားယွင်းသောလိပ်စာ ပေးသွင်းပါက အော်ဒါပယ်ဖျက်နိုင်ပါသည်။',
        ],
        bulletsEn: [
          'Customers are allowed ONLY ONE (1) service address update throughout the entire rental term.',
          'No second address transfer or relocation request will be approved after using your 1-time change.',
          'Verify your exact district, house/road number, and rooftop line-of-sight prior to submitting your order.',
        ],
      },
    ],
    conditionsBn: [
      'অ্যাড্রেস পরিবর্তনের জন্য পূর্বানুমোদন ও ভেরিফিকেশন প্রয়োজন হয় (১ বারের বেশি নয়)।',
      'নিবন্ধিত লোকেশনের বাইরে ব্যবহারের ফলে সার্ভিস Restricted হলে তার দায় গ্রাহকের ওপর বর্তাবে।',
      'রেন্টাল কিটে ভ্রাম্যমাণ বা রোমিং ব্যবহার অনুমোদিত নয়।',
    ],
    conditionsMy: [
      'လိပ်စာ (၁) ကြိမ်ပြောင်းလဲရန် ကြိုတင်အတည်ပြုချက် လိုအပ်ပါသည်။',
      'လိပ်စာပြင်ပအသုံးပြု၍ Restricted ဖြစ်ပါက ဝယ်ယူသူ၏ တာဝန်သာဖြစ်သည်။',
      'ငှားရမ်းစက်တွင် ရွေ့လျားအသုံးပြုခြင်း (Roaming) ခွင့်မပြုပါ။',
    ],
    conditionsEn: [
      'Your single 1-time address update requires customer support verification before relocating hardware.',
      'DevSparkSoft is not liable for Restricted outages caused by moving a Rental Kit outside its registered address.',
      'Portable travel or in-motion use is not permitted under Rental Kit terms.',
    ],
    relatedSlugs: ['restriction-policy', 'rental-policy', 'fair-usage-policy', 'cancellation-policy'],
  },
  {
    slug: 'fair-usage-policy',
    path: '/Legal/fair-usage-policy',
    icon: 'database',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'ফেয়ার ইউসেজ ও ডেটা লিমিট নীতিমালা (Fair Usage & 5TB Policy)',
    titleMy: 'မျှတစွာ အသုံးပြုမှုနှင့် 5 TB ဒေတာမူဝါဒ (Fair Usage Policy)',
    titleEn: 'Fair Usage & Data Limit Policy',
    shortDescBn: 'রেন্টাল কিটে মাসে সর্বোচ্চ 5 TB ডেটা সীমা ও ফেয়ার ইউসেজ নিয়ম।',
    shortDescMy: 'ငှားရမ်းစက်တွင် တစ်လ 5 TB အများဆုံး ဒေတာကန့်သတ်ချက်နှင့် စည်းကမ်းများ။',
    shortDescEn: 'Strict 5 TB/month fair usage limit for Rental Kits and bandwidth guidelines.',
    metaTitle: 'Fair Usage & Data Limit Policy (5TB) | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Fair Usage and 5 TB monthly data cap policy for DevSparkSoft Starlink Rental Kits across Residential Lite and Residential Unlimited subscriptions.',
    introBn:
      'সকল গ্রাহকের জন্য স্থিতিশীল ও উচ্চগতির রেসিডেন্সিয়াল ব্রডব্যান্ড নিশ্চিত করতে DevSparkSoft রেন্টাল কিটের ওপর মাসিক 5 TB ডেটা সীমা ও ফেয়ার ইউসেজ নীতিমালা কার্যকর রাখে।',
    introMy:
      'အသုံးပြုသူအားလုံး မြန်နှုန်းမြင့် တည်ငြိမ်သော အင်တာနက်ရရှိစေရန် ငှားရမ်းစက်များတွင် တစ်လ 5 TB ကန့်သတ်ချက် ချမှတ်ထားပါသည်။',
    introEn:
      'To preserve stable residential network quality across the rental fleet, DevSparkSoft enforces a monthly 5 TB Fair Usage Policy on all Starlink Rental Kits.',
    sections: [
      {
        headingBn: '১. মাসিক 5 TB সর্বোচ্চ ডেটা সীমা (Cannot Exceed 5 TB)',
        headingMy: '၁။ တစ်လလျှင် 5 TB အများဆုံး ကန့်သတ်ချက်',
        headingEn: '1. Monthly 5 TB Maximum Usage Cap',
        bulletsBn: [
          'Starlink Standard 4X ও Starlink Mini — উভয় রেন্টাল কিটেই প্রতি মাসে ৫ টিবি (5 TB / ৫,০০০ জিবি)-এর বেশি ডেটা ব্যবহার করা যাবে না।',
          'এই 5 TB সীমা Residential Lite (৳৪,২০০/মাস) এবং Residential Unlimited (৳৬,০০০/মাস) — উভয় রেন্টাল প্ল্যানেই প্রযোজ্য।',
          'প্রতি মাসে বিলিং সাইকেল রিনিউ হলে মাসিক ডেটা কাউন্টার নতুন করে শুরু হয়।',
        ],
        bulletsMy: [
          'Standard 4X နှင့် Starlink Mini နှစ်မျိုးလုံးတွင် တစ်လလျှင် 5 TB (5,000 GB) ထက်ပို၍ အသုံးမပြုနိုင်ပါ။',
          'ဤ 5 TB ကန့်သတ်ချက်သည် Residential Lite နှင့် Unlimited နှစ်မျိုးလုံးတွင် အကျုံးဝင်သည်။',
          'လစဉ် ငွေပေးချေမှု စက်ဝန်းအသစ်တွင် ဒေတာပမာဏ ပြန်လည်စတင်ပါသည်။',
        ],
        bulletsEn: [
          'Monthly data usage CANNOT exceed 5 TB (5,000 GB) per billing cycle on either Standard 4X or Starlink Mini Rental Kits.',
          'The 5 TB cap applies equally to both Residential Lite (৳4,200/mo) and Residential Unlimited (৳6,000/mo) rental plans.',
          'Data allowance counters reset automatically upon each monthly subscription renewal date.',
        ],
      },
      {
        headingBn: '২. সীমা অতিক্রম করলে করণীয় ও বাণিজ্যিক নিষেধাজ্ঞা',
        headingMy: '၂။ ကန့်သတ်ချက် ကျော်လွန်ခြင်းနှင့် စီးပွားဖြစ်သုံးစွဲမှု',
        headingEn: '2. Over-Limit Enforcement & Commercial Bandwidth',
        bulletsBn: [
          'মাসে 5 TB সীমা অতিক্রম করলে সংযোগের গতি সীমিত (Throttled) বা সাময়িকভাবে স্থগিত করা হতে পারে।',
          'রেন্টাল কিট ব্যবহার করে ISP রিসেলিং, হটস্পট বিজনেস বা অতিরিক্ত ব্যান্ডউইথ পুনর্বিক্রয় সম্পূর্ণ নিষিদ্ধ।',
          'মাসে 5 TB-এর বেশি প্রয়োজন হলে স্থায়ী মালিকানায় Standard 4X (৳৪১,৫০০) বা Mini (৳২১,৫০০) কিট ক্রয় করার পরামর্শ দেওয়া হয়।',
        ],
        bulletsMy: [
          'တစ်လ 5 TB ကျော်လွန်ပါက မြန်နှုန်းလျှော့ချခြင်း သို့မဟုတ် ယာယီရပ်ဆိုင်းခြင်း ဖြစ်နိုင်ပါသည်။',
          'ISP ပြန်လည်ရောင်းချခြင်း သို့မဟုတ် စီးပွားဖြစ် Hotspot ဖြန့်ဝေခြင်း မပြုရပါ။',
          '5 TB ထက်ပိုလိုအပ်ပါက စက်ကို အပြီးအပိုင် ဝယ်ယူရန် အကြံပြုပါသည်။',
        ],
        bulletsEn: [
          'Exceeding 5 TB in a billing cycle may trigger bandwidth throttling or temporary suspension.',
          'Reselling bandwidth, running commercial ISP distribution, or operating public paid hotspots on a Rental Kit is prohibited.',
          'For heavy >5 TB/month workloads, customers are advised to purchase an outright hardware kit (Standard 4X ৳41,500 / Mini ৳21,500).',
        ],
      },
    ],
    conditionsBn: [
      'মাসে 5 TB সীমায় আপলোড এবং ডাউনলোড উভয় ট্র্যাফিক অন্তর্ভুক্ত থাকে।',
      'স্বচ্ছ ব্যবহারের মধ্যে থাকলে ২০০ Mbps (Lite) ও ৪০০+ Mbps (Unlimited) পর্যন্ত স্বাভাবিক স্পিড পাওয়া যায়।',
    ],
    conditionsMy: [
      '5 TB ကန့်သတ်ချက်တွင် Upload နှင့် Download ဒေတာနှစ်မျိုးလုံး ပါဝင်ပါသည်။',
      'သတ်မှတ်ချက်အတွင်း အသုံးပြုပါက ပုံမှန်အမြန်နှုန်း ရရှိပါမည်။',
    ],
    conditionsEn: [
      'Both download and upload traffic count toward the 5 TB monthly threshold.',
      'Full residential speeds (up to 200 Mbps on Lite and 400+ Mbps on Unlimited) apply while within the 5 TB limit.',
    ],
    relatedSlugs: ['subscription-policy', 'restriction-policy', 'rental-policy'],
  },
  {
    slug: 'restriction-policy',
    path: '/Legal/restriction-policy',
    icon: 'shield-alert',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'দেশ, ব্যবসা ও সার্ভিস বিধিনিষেধ নীতিমালা (Restriction Policy)',
    titleMy: 'နိုင်ငံ၊ စီးပွားရေးနှင့် ဝန်ဆောင်မှု ကန့်သတ်ချက် မူဝါဒ (Restriction Policy)',
    titleEn: 'Country, Business & Service Restrictions Policy',
    shortDescBn: 'রোমিংসহ অন্য প্যাকেজ নিষিদ্ধ, দেশভিত্তিক ও বাণিজ্যিক ব্যবহার সীমাবদ্ধতা।',
    shortDescMy: 'Roaming မရရှိခြင်း၊ နိုင်ငံနှင့် စီးပွားဖြစ် အသုံးပြုမှု ကန့်သတ်ချက်များ။',
    shortDescEn: 'No Roaming/other packages (Residential & Lite only), Bangladesh region rules & compliance.',
    metaTitle: 'Country, Business & Service Restrictions Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Country, package, and service restriction policy for Starlink Rental Kits and hardware sold by DevSparkSoft: Residential & Lite only, no Roaming, Bangladesh region compliance.',
    introBn:
      'বাংলাদেশে স্যাটেলাইট ইন্টারনেট পরিচালনা ও গ্রাহকদের অ্যাকাউন্ট নিরাপত্তার স্বার্থে নিচের সার্ভিস, প্যাকেজ ও দেশভিত্তিক বিধিনিষেধসমূহ প্রযোজ্য।',
    introMy:
      'ဘင်္ဂလားဒေ့ရှ်နှင့် ဒေသတွင်း ဝန်ဆောင်မှု လုံခြုံရေးအတွက် အောက်ပါ ကန့်သတ်ချက်များ အကျုံးဝင်ပါသည်။',
    introEn:
      'To protect account integrity and comply with regional operational frameworks, the following package, geographic, and commercial service restrictions apply to DevSparkSoft rental and hardware services.',
    sections: [
      {
        headingBn: '১. রোমিংসহ অন্য প্যাকেজ নিষেধাজ্ঞা (Residential ও Lite মাত্র)',
        headingMy: '၁။ Roaming နှင့် အခြားပက်ကေ့ချ်များ တားမြစ်ချက်',
        headingEn: '1. No Roaming or Other Packages Allowed',
        bulletsBn: [
          'রেন্টাল কিটে রোমিং (Roaming Mobile/Regional/Global), Priority বা অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না।',
          'কেবল অনুমোদিত Residential (৳৬,০০০/মাস) এবং Residential Lite (৳৪,২০০/মাস) প্যাকেজ ব্যবহারযোগ্য।',
        ],
        bulletsMy: [
          'ငှားရမ်းစက်တွင် Roaming နှင့် Priority အပါအဝင် အခြားမည်သည့်ပက်ကေ့ချ်မျှ အသုံးမပြုနိုင်ပါ။',
          'ခွင့်ပြုထားသော Residential (৳၆,০০০) နှင့် Residential Lite (৳၄,২০০) သာ သုံးနိုင်သည်။',
        ],
        bulletsEn: [
          'Roaming (Regional/Global/Mobile), Business Priority, and all other non-eligible plans cannot be activated on Rental Kits.',
          'ONLY fixed-address Residential Unlimited (৳6,000/mo) and Residential Lite (৳4,200/mo) plans are eligible.',
        ],
      },
      {
        headingBn: '২. দেশ ও আঞ্চলিক বিধিনিষেধ ও অবৈধ হস্তান্তর',
        headingMy: '၂။ နိုင်ငံအလိုက် ကန့်သတ်ချက်နှင့် တရားမဝင် လွှဲပြောင်းခြင်း',
        headingEn: '2. Country / Regional Compliance & Grey-Market Protection',
        bulletsBn: [
          'রেন্টাল কিট শুধুমাত্র বাংলাদেশে অনুমোদিত প্রথম নিবন্ধিত লোকেশনে ব্যবহারযোগ্য; দেশের বাইরে বা অন্য অঞ্চলে নিলে সার্ভিস Restricted হয়ে যাবে।',
          'রেন্টাল কিট রিসেল, অননুমোদিত রপ্তানি, সাব-লিজিং বা সিন্ডিকেট কারসাজিতে ব্যবহার সম্পূর্ণ নিষিদ্ধ।',
          'বিদেশি অ্যাকাউন্ট-লকড বা গ্রে-মার্কেট কিট এড়িয়ে অফিসিয়াল ইনভয়েসযুক্ত ভেরিফায়েড হার্ডওয়্যার ব্যবহার নিশ্চিত করতে DevSparkSoft কমপ্লায়েন্স অনুসরণ করে।',
        ],
        bulletsMy: [
          'ငှားရမ်းစက်ကို ဘင်္ဂလားဒေ့ရှ်ရှိ ပထမမှတ်ပုံတင်လိပ်စာတွင်သာ အသုံးပြုနိုင်ပြီး ပြင်ပတွင်သုံးပါက Restricted ဖြစ်မည်။',
          'တရားမဝင် ပြန်လည်ရောင်းချခြင်းနှင့် နိုင်ငံခြားသို့ တင်ပို့ခြင်း လုံးဝတားမြစ်ထားသည်။',
        ],
        bulletsEn: [
          'Rental hardware is strictly restricted to its verified Bangladeshi service location; cross-border relocation or unauthorized movement results in Restricted service status.',
          'Unauthorized resale, sub-leasing, cross-border export, or commercial syndicate arbitrage is prohibited.',
          'All terms reflect DevSparkSoft’s independent store and rental compliance framework and are not represented as official SpaceX/Starlink corporate policies.',
        ],
      },
    ],
    conditionsBn: [
      'নিবন্ধিত লোকেশনের বাইরে ব্যবহার করলে সার্ভিস স্বয়ংক্রিয়ভাবে Restricted হতে পারে।',
      'কোনো নীতিমালা ভঙ্গ হলে DevSparkSoft রেন্টাল চুক্তি বাতিল ও হার্ডওয়্যার ফেরত নেওয়ার অধিকার রাখে।',
    ],
    conditionsMy: [
      'မှတ်ပုံတင်လိပ်စာပြင်ပတွင် သုံးစွဲပါက Restricted ဖြစ်နိုင်ပါသည်။',
      'စည်းကမ်းချိုးဖောက်ပါက ငှားရမ်းမှု ပယ်ဖျက်ပြီး စက်ပြန်လည်သိမ်းယူခွင့် ရှိပါသည်။',
    ],
    conditionsEn: [
      'Operating outside the registered service location triggers Restricted status.',
      'DevSparkSoft reserves the right to terminate rental access and recall hardware upon policy violations.',
    ],
    relatedSlugs: ['location-policy', 'fair-usage-policy', 'rental-policy', 'terms'],
  },
  {
    slug: 'return-policy',
    path: '/Legal/return-policy',
    icon: 'rotate-ccw',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'রিটার্ন, রিফান্ড ও রিপ্লেসমেন্ট নীতিমালা (Return, Refund & Replacement Policy)',
    titleMy: 'ပြန်ပို့ခြင်း၊ ငွေပြန်အမ်းခြင်းနှင့် အစားထိုးခြင်း မူဝါဒ (Return & Refund Policy)',
    titleEn: 'Return, Refund & Replacement Policy',
    shortDescBn: 'ক্রয়কৃত কিটে ৩০ দিনের রিফান্ড অঙ্গীকার, ২৪ মাসের রিপ্লেসমেন্ট সাপোর্ট ও শর্ত।',
    shortDescMy: 'ဝယ်ယူထားသော စက်များအတွက် ရက် ၃၀ ငွေပြန်အမ်းခြင်းနှင့် ၂၄ လ အစားထိုးပံ့ပိုးမှု။',
    shortDescEn: '30-Day Refund Commitment and 24-Month Replacement Support for purchased kits.',
    metaTitle: 'Return, Refund & Replacement Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Review DevSparkSoft 30-Day Refund Commitment, 24-Month Replacement Support for purchased Starlink hardware, and clear distinction from Starlink factory warranties.',
    introBn:
      'DEVSPARK LINK (DEV SPARK SOFT LIMITED) থেকে স্থায়ী মালিকানায় ক্রয়কৃত (Outright Purchase) Starlink Standard 4X (৳৪১,৫০০) ও Starlink Mini (৳২১,৫০০) কিটে স্বচ্ছ ইনভয়েসসহ আমাদের নিজস্ব বিক্রয়-পরবর্তী রিটার্ন, রিফান্ড ও রিপ্লেসমেন্ট সাপোর্ট প্রযোজ্য।',
    introMy:
      'DEVSPARK LINK မှ အပြီးအပိုင် ဝယ်ယူထားသော Starlink စက်ပစ္စည်းများအတွက် ကျွန်ုပ်တို့၏ ရောင်းချပြီးနောက် ဝန်ဆောင်မှုနှင့် အစားထိုးလဲလှယ်ခြင်း စည်းကမ်းများ ဖြစ်ပါသည်။',
    introEn:
      'Outright Starlink hardware purchases (Standard 4X ৳41,500 and Mini ৳21,500) from DEVSPARK LINK include our store-backed 30-Day Refund Commitment and 24-Month Replacement Support alongside Official Sales Invoices.',
    sections: [
      {
        headingBn: '১. ২৪ মাস রিপ্লেসমেন্ট সাপোর্ট (লিখিত শর্ত প্রযোজ্য)',
        headingMy: '၁။ ၂၄ လ အစားထိုးလဲလှယ်မှု ပံ့ပိုးခြင်း',
        headingEn: '1. 24-Month Replacement Support (Store After-Sales)',
        bulletsBn: [
          'ক্রয়কৃত অরিজিনাল কিটে যান্ত্রিক ত্রুটি দেখা দিলে লিখিত ইনভয়েস ও সিরিয়াল ভেরিফিকেশন সাপেক্ষে ২৪ মাসের রিপ্লেসমেন্ট সাপোর্ট প্রদান করা হয়।',
          'রেন্টাল কিটের ক্ষেত্রে রেন্টাল চলাকালীন হার্ডওয়্যার ত্রুটিতে বিনামূল্যে টেকনিক্যাল/রিপ্লেসমেন্ট সাপোর্ট প্রযোজ্য (বিকৃত বা ভাঙা না হলে)।',
          'গুরুত্বপূর্ণ: এটি DEV SPARK SOFT LIMITED-এর নিজস্ব বিক্রয়-পরবর্তী সেবা; এটি Starlink/SpaceX-এর নিজস্ব ফ্যাক্টরি ওয়ারেন্টি হিসেবে উপস্থাপিত নয়।',
        ],
        bulletsMy: [
          'တရားဝင် ဘောက်ချာဖြင့် ဝယ်ယူထားသော စက်များတွင် စက်ပိုင်းဆိုင်ရာ ချို့ယွင်းချက်အတွက် ၂၄ လ အစားထိုးပံ့ပိုးမှု ပေးပါသည်။',
          'ဤဝန်ဆောင်မှုသည် DevSparkSoft ၏ ကိုယ်ပိုင် အရောင်းအပြီး ဝန်ဆောင်မှုဖြစ်ပြီး Starlink ၏ စက်ရုံအာမခံ မဟုတ်ပါ။',
        ],
        bulletsEn: [
          'Eligible purchased hardware experiencing manufacturing defects is covered by 24-Month Replacement Support subject to Official Sales Invoice and serial verification.',
          'During active rental terms, non-damaged hardware malfunctions receive complimentary technical/unit replacement support.',
          'Important Notice: This 24-month coverage is DevSparkSoft’s independent store after-sales support program and is not presented as SpaceX/Starlink’s official manufacturer warranty.',
        ],
      },
      {
        headingBn: '২. ৩০ দিনের রিফান্ড অঙ্গীকার ও রিটার্ন শর্ত',
        headingMy: '২။ ရက် ၃၀ ငွေပြန်အမ်း အာမခံချက်နှင့် စည်းကမ်းများ',
        headingEn: '2. 30-Day Refund Commitment & Return Conditions',
        bulletsBn: [
          'স্থায়ীভাবে কেনা কিট অক্ষত বক্স, সিরিয়াল মিল ও সকল এক্সেসরিজসহ ৩০ দিনের রিফান্ড অঙ্গীকারের আওতায় রিটার্ন যাচাইযোগ্য।',
          'ভৌত আঘাত, পানিতে পড়া, বাজ পড়া বা অননুমোদিত মেরামতের কারণে ক্ষতিগ্রস্ত ডিভাইস রিটার্ন বা রিপ্লেসমেন্টের আওতায় পড়বে না।',
          'Starlink Rental Kit-এর ৳৩,০০০ এককালীন চার্জ কুরিয়ার ডিসপ্যাচের পর অফেরতযোগ্য (যদি স্টক বা অ্যাড্রেস কারণে DevSparkSoft কর্তৃক ডিসপ্যাচের আগে বাতিল হয় তবে পূর্ণ রিফান্ড প্রযোজ্য)।',
        ],
        bulletsMy: [
          'ဝယ်ယူထားသော စက်ကို မူလဘူးနှင့် ပစ္စည်းအစုံအလင်အတိုင်း ရက် ၃၀ အတွင်း ပြန်လည်စစ်ဆေး ငွေပြန်အမ်းနိုင်ပါသည်။',
          'ရုပ်ပိုင်းဆိုင်ရာ ထိခိုက်ပျက်စီးမှု သို့မဟုတ် ရေဝင်ခြင်းများ အကျုံးမဝင်ပါ။',
          'Starlink Rental Kit တစ်ကြိမ်ကြေး ৳3,000 သည် ပစ္စည်းထုတ်ပိုးပို့ဆောင်ပြီးနောက် ပြန်အမ်း၍မရပါ။',
        ],
        bulletsEn: [
          'Eligible outright purchased kits returned intact with matching serial number, original box, and all accessories qualify for inspection under our 30-Day Refund Commitment.',
          'Physical impact damage, water ingress, lightning surge, or unauthorized opening voids replacement/refund eligibility.',
          'The ৳3,000 one-time Rental Kit charge is non-refundable once courier dispatch has occurred (full refund applies if cancelled prior to dispatch due to service unavailability).',
        ],
      },
    ],
    conditionsBn: [
      'প্রতিটি ক্রয়ে অফিশিয়াল সেলস ইনভয়েস সংরক্ষণ করা আবশ্যক।',
      'রিফান্ড অনুমোদিত হলে ৭–১০ কর্মদিবসের মধ্যে নির্ধারিত মাধ্যমে ফেরত দেওয়া হয়।',
    ],
    conditionsMy: [
      'တရားဝင် အရောင်းဘောက်ချာကို သိမ်းဆည်းထားရန် လိုအပ်ပါသည်။',
      'ငွေပြန်အမ်းမှု အတည်ပြုပြီး အလုပ်လုပ်ရက် ၇–၁၀ ရက်အတွင်း ပြန်လည်လွှဲပေးပါမည်။',
    ],
    conditionsEn: [
      'Retaining the Official Sales Invoice is mandatory for any return or replacement request.',
      'Approved hardware refunds are processed within 7–10 business days via verified bank or MFS transfer.',
    ],
    relatedSlugs: ['cancellation-policy', 'shipping-policy', 'payment-policy', 'terms'],
  },
  {
    slug: 'cancellation-policy',
    path: '/Legal/cancellation-policy',
    icon: 'x-circle',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'রেন্টাল বাতিল ও কিট ফেরত নীতিমালা (Rental Cancellation & Kit Return Policy)',
    titleMy: 'ငှားရမ်းမှု ပယ်ဖျက်ခြင်းနှင့် စက်ပြန်ပို့ခြင်း မူဝါဒ (Cancellation Policy)',
    titleEn: 'Rental Cancellation & Kit Return Policy',
    shortDescBn: 'সার্ভিস বাতিল প্রক্রিয়া এবং ডিশ, রাউটার, কেবল ও পাওয়ার সাপ্লাই ফেরতের শর্ত।',
    shortDescMy: 'ငှားရမ်းမှု ရပ်ဆိုင်းခြင်းနှင့် စက်ပစ္စည်းအစုံအလင် ပြန်ပို့ရမည့် စည်းကမ်းများ။',
    shortDescEn: 'How to cancel a rental subscription and mandatory complete hardware kit return rules.',
    metaTitle: 'Rental Cancellation & Kit Return Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Rental cancellation workflow and mandatory return guidelines for Starlink Rental Kits (Dish, Router, Cable, Power Supply) at DevSparkSoft.',
    introBn:
      'গ্রাহক যেকোনো সময় রেন্টাল সাবস্ক্রিপশন বাতিল করতে পারেন। যেহেতু রেন্টাল কিটের মালিকানা DevSparkSoft-এর, তাই বাতিলের পর সম্পূর্ণ হার্ডওয়্যার নির্দিষ্ট সময়ের মধ্যে ফেরত দেওয়া বাধ্যতামূলক।',
    introMy:
      'အသုံးပြုသူများသည် ငှားရမ်းမှုကို အချိန်မရွေး ပယ်ဖျက်နိုင်ပြီး စက်ပစ္စည်းအစုံအလင်ကို ပြန်လည်ပေးအပ်ရန် လိုအပ်ပါသည်။',
    introEn:
      'Customers may request rental cancellation at any time. Because hardware ownership remains with DevSparkSoft, returning the complete kit in working condition is required to close the rental account.',
    sections: [
      {
        headingBn: '১. সম্পূর্ণ কিট ও এক্সেসরিজ ফেরত দেওয়া বাধ্যতামূলক',
        headingMy: '၁။ စက်ပစ္စည်းအစုံအလင် ပြန်လည်ပေးအပ်ခြင်း',
        headingEn: '1. Mandatory Complete Hardware Kit Return',
        bulletsBn: [
          'সার্ভিস বন্ধ বা বাতিল হলে নির্দিষ্ট সময়ের মধ্যে সম্পূর্ণ কিট — Starlink Dish, Wi-Fi Router / Stand, Power Cable এবং Power Supply — ফেরত দিতে হবে।',
          'সব ডিভাইস সচল ও ভালো অবস্থায় এবং আসল সিরিয়াল নম্বরসহ ফেরত দিতে হবে।',
        ],
        bulletsMy: [
          'ဝန်ဆောင်မှုပယ်ဖျက်လျှင် Starlink Dish, Router/Stand, Cable နှင့် Power Supply အားလုံးကို ပြန်ပို့ရပါမည်။',
          'စက်ပစ္စည်းများ ကောင်းမွန်သော အခြေအနေနှင့် မူလစီးရီးနံပါတ်အတိုင်း ဖြစ်ရပါမည်။',
        ],
        bulletsEn: [
          'Upon cancellation, the complete kit — Dish, Router/Stand, Cable, and Power Supply — must be returned within the instructed return window.',
          'All components must match the dispatched serial numbers and arrive in intact, working condition.',
        ],
      },
      {
        headingBn: '২. ক্ষতিগ্রস্ত বা অ-ফেরতকৃত কিটের চার্জ',
        headingMy: '၂။ ပျက်စီးမှု သို့မဟုတ် ပြန်မပို့သည့်အခါ ကုန်ကျစရိတ်',
        headingEn: '2. Damaged or Unreturned Equipment Charges',
        bulletsBn: [
          'ক্ষতিগ্রস্ত অবস্থায় কিট বা এক্সেসরিজ ফেরত দিলে মেরামত বা প্রতিস্থাপন খরচ গ্রাহককে বহন করতে হবে।',
          'নির্ধারিত সময়ের মধ্যে কিট ফেরত না দিলে সম্পূর্ণ ডিভাইসের বর্তমান বাজারমূল্য অনুযায়ী চার্জ আরোপিত হতে পারে এবং আইনি পদক্ষেপ নেওয়া হতে পারে।',
        ],
        bulletsMy: [
          'ပျက်စီးနေသော ပစ္စည်းများအတွက် ပြင်ဆင်ခ သို့မဟုတ် အစားထိုးခ ကျသင့်ပါမည်။',
          'သတ်မှတ်ရက်အတွင်း ပြန်မပို့ပါက စက်တန်ဖိုးအပြည့် ပေးလျော်ရမည်။',
        ],
        bulletsEn: [
          'Customers are responsible for repair or missing-accessory replacement costs if hardware returns damaged.',
          'Failure to return the kit within the deadline may incur full retail replacement value recovery charges.',
        ],
      },
    ],
    conditionsBn: [
      'বাতিলকরণের আগে +880 1326-370218 বা support@devsparksoft.com.bd-এ রিটার্ন রিকোয়েস্ট নিশ্চিত করুন।',
      'রিটার্ন যাচাই সম্পন্ন হলে পরবর্তী মাসিক সাবস্ক্রিপশন বিলিং স্থায়ীভাবে বন্ধ করা হবে।',
    ],
    conditionsMy: [
      'ပယ်ဖျက်ရန် +880 1326-370218 သို့မဟုတ် support@devsparksoft.com.bd သို့ ဆက်သွယ်ပါ။',
      'စက်ပြန်ရောက်ရှိ စစ်ဆေးပြီးမှသာ လစဉ်ကြေး ရပ်တန့်ပါမည်။',
    ],
    conditionsEn: [
      'Notify +880 1326-370218 or support@devsparksoft.com.bd to schedule your pickup/drop-off return.',
      'Monthly subscription billing ceases only once kit return inspection is confirmed.',
    ],
    relatedSlugs: ['rental-policy', 'return-policy', 'subscription-policy', 'location-policy'],
  },
  {
    slug: 'privacy-policy',
    path: '/Legal/privacy-policy',
    icon: 'lock',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'গোপনীয়তা নীতিমালা (Privacy Policy)',
    titleMy: 'ကိုယ်ရေးအချက်အလက် လုံခြုံရေး မူဝါဒ (Privacy Policy)',
    titleEn: 'Privacy Policy',
    shortDescBn: 'গ্রাহকের তথ্য সংগ্রহ, লোকেশন ডেটা, কুকিজ ও ডেটা মুছে ফেলার অধিকার।',
    shortDescMy: 'ကိုယ်ရေးအချက်အလက် စုဆောင်းခြင်း၊ Cookie နှင့် အချက်အလက် ဖျက်ပိုင်ခွင့်။',
    shortDescEn: 'How DevSparkSoft collects, protects, and lets you manage or delete your personal data.',
    metaTitle: 'Privacy Policy | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Privacy Policy for DEV SPARK SOFT LIMITED (devsparksoft.com.bd & DEVSPARK LINK): personal data usage, cookies, IP language detection, and data deletion rights.',
    introBn:
      'DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) গ্রাহকের ব্যক্তিগত তথ্য, অর্ডার বিবরণ, নিবন্ধিত সার্ভিস ঠিকানা ও পেমেন্ট তথ্য সর্বোচ্চ গোপনীয়তা ও নিরাপত্তার সাথে সংরক্ষণ করে।',
    introMy:
      'DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) သည် ဝယ်ယူသူများ၏ ကိုယ်ရေးအချက်အလက်များကို လုံခြုံစွာ ထိန်းသိမ်းစောင့်ရှောက်ပါသည်။',
    introEn:
      'This Privacy Policy describes how DEV SPARK SOFT LIMITED (operating DEVSPARK LINK / DSLINK) collects, uses, and safeguards customer information across our website and Starlink order/rental services.',
    sections: [
      {
        headingBn: '১. সংগৃহীত তথ্য ও ব্যবহারের উদ্দেশ্য',
        headingMy: '၁။ စုဆောင်းသော အချက်အလက်များနှင့် အသုံးပြုပုံ',
        headingEn: '1. Information Collection and Use',
        bulletsBn: [
          'চেকআউটে প্রদত্ত নাম, মোবাইল নম্বর, ইমেইল, জেলা, প্রথম নিবন্ধিত লোকেশন ও Bangla QR TrxID শুধুমাত্র অর্ডার প্রসেসিং, ডেলিভারি, ইনভয়েস ও সাপোর্ট প্রদানের জন্য ব্যবহৃত হয়।',
          'ওয়েবসাইটের ভাষা ও আঞ্চলিক সেটিংস স্বয়ংক্রিয়ভাবে নির্ধারণের জন্য ডিভাইসের IP ঠিকানা, ভিজিটকৃত পেজ এবং মোবাইল/ব্রাউজার সিস্টেম তথ্য সাময়িকভাবে প্রক্রিয়াকরণ করা হয়।',
        ],
        bulletsMy: [
          'အမည်၊ ဖုန်းနံပါတ်၊ အီးမေးလ်၊ လိပ်စာနှင့် Bangla QR TrxID တို့ကို အော်ဒါပို့ဆောင်ရေးနှင့် ဝန်ဆောင်မှုအတွက်သာ အသုံးပြုပါသည်။',
          'ဘာသာစကား အလိုအလျောက် ပြောင်းလဲရန် IP လိပ်စာနှင့် စနစ်အချက်အလက်များကို ယာယီအသုံးပြုပါသည်။',
        ],
        bulletsEn: [
          'Checkout fields (full name, phone number, email, district, first registered address, and Bangla QR TrxID) are used strictly for order verification, delivery, invoicing, and customer support.',
          'Device IP geolocation, visited pages, timestamps, and browser/OS metadata may be processed to support security, localization (language detection), and analytics.',
        ],
      },
      {
        headingBn: '২. কুকিজ, ট্র্যাকিং ও আপনার ডেটা অধিকার',
        headingMy: '၂။ Cookie များနှင့် သင့်အချက်အလက် အခွင့်အရေးများ',
        headingEn: '2. Cookies & Your Data Privacy Rights',
        bulletsBn: [
          'অ্যাপ ও ওয়েবসাইটে কার্যকরী সুবিধা ও ভাষা পছন্দ (LocalStorage) সংরক্ষণে কুকিজ বা স্টোরেজ প্রযুক্তি ব্যবহৃত হতে পারে।',
          'আপনি যেকোনো সময় support@devsparksoft.com.bd ঠিকানায় ইমেইল করে অথবা /delete-data পেজ ব্যবহার করে আপনার ব্যক্তিগত তথ্য সংশোধন বা স্থায়ীভাবে মুছে ফেলার অনুরোধ করতে পারেন।',
          'ক্যালিফোর্নিয়া/আন্তর্জাতিক প্রাইভেসি অধিকার (CCPA/CPRA) অনুযায়ী ব্যক্তিগত তথ্য বিক্রয় বা শেয়ারিং থেকে অপ্ট-আউট করার অধিকার আপনার রয়েছে।',
        ],
        bulletsMy: [
          'ဘာသာစကား ရွေးချယ်မှုနှင့် စနစ်လုပ်ဆောင်ချက်အတွက် Cookie/Storage များ အသုံးပြုနိုင်ပါသည်။',
          'support@devsparksoft.com.bd သို့ ဆက်သွယ်၍ သင့်အချက်အလက်များကို ပြင်ဆင်ခြင်း သို့မဟုတ် ဖျက်သိမ်းခြင်း တောင်းဆိုနိုင်ပါသည်။',
        ],
        bulletsEn: [
          'Essential storage/cookies preserve language preferences and checkout state; non-essential tracking requires consent where mandated by law.',
          'You may request access, correction, or deletion of your personal data anytime by emailing support@devsparksoft.com.bd or visiting /delete-data.',
          'CCPA/CPRA rights (including non-discrimination and right to know/delete) are respected upon written request to support@devsparksoft.com.bd.',
        ],
      },
    ],
    conditionsBn: [
      'DevSparkSoft গ্রাহকের ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করে না।',
      'ইনভয়েস ও আইনি কমপ্লায়েন্সের স্বার্থে অর্ডার রেকর্ড নিরাপদ ডাটাবেসে সংরক্ষিত থাকে।',
    ],
    conditionsMy: [
      'DevSparkSoft သည် ဝယ်ယူသူအချက်အလက်များကို ပြင်ပသို့ ရောင်းချခြင်း မရှိပါ။',
      'တရားဝင် ဘောက်ချာမှတ်တမ်းများကို လုံခြုံစွာ သိမ်းဆည်းထားပါသည်။',
    ],
    conditionsEn: [
      'DevSparkSoft does not sell customer personal information to third parties.',
      'Order and invoice records are retained securely as required for tax and warranty support.',
    ],
    relatedSlugs: ['terms', 'payment-policy', 'rental-policy'],
  },
  {
    slug: 'terms',
    path: '/Legal/terms',
    icon: 'scale',
    ...LEGAL_EFFECTIVE_DATES,
    titleBn: 'সাধারণ শর্তাবলি ও ব্যবহারের নিয়ম (Terms & Conditions)',
    titleMy: 'စည်းကမ်းချက်များ (Terms & Conditions)',
    titleEn: 'Terms & Conditions',
    shortDescBn: 'DEV SPARK SOFT LIMITED ওয়েবসাইট, অর্ডার, রেন্টাল ও আইনি শর্তাবলি।',
    shortDescMy: 'DEV SPARK SOFT LIMITED ဝဘ်ဆိုဒ်၊ အော်ဒါနှင့် ဝန်ဆောင်မှု စည်းကမ်းချက်များ။',
    shortDescEn: 'General website use, commercial order terms, entity disclosures, and store policies.',
    metaTitle: 'Terms & Conditions | DevSparkSoft — Legal & Policies',
    metaDescription:
      'Read DevSparkSoft Terms & Conditions governing DEVSPARK LINK hardware sales, Starlink Rental Kits (৳3,000 one-time charge), Global Delivery, billing, and entity registration (DNCC/037306).',
    introBn:
      'devsparksoft.com.bd এবং DEVSPARK LINK (DSLINK) ওয়েবসাইট ব্যবহার বা কোনো স্টারলিংক কিট/রেন্টাল অর্ডার সম্পন্ন করার মাধ্যমে আপনি DEV SPARK SOFT LIMITED-এর নিচের সাধারণ শর্তাবলির সাথে সম্মত হচ্ছেন।',
    introMy:
      'devsparksoft.com.bd နှင့် DEVSPARK LINK ဝန်ဆောင်မှုများကို အသုံးပြုခြင်းဖြင့် DEV SPARK SOFT LIMITED ၏ အောက်ပါ စည်းကမ်းချက်များကို သဘောတူညီပြီးဖြစ်ပါသည်။',
    introEn:
      'By browsing devsparksoft.com.bd / dslink.cyou or placing an outright purchase or rental order with DEVSPARK LINK (DSLINK), you agree to these Terms & Conditions operated by DEV SPARK SOFT LIMITED.',
    sections: [
      {
        headingBn: '১. প্রতিষ্ঠানের পরিচয় ও স্বাধীন বাণিজ্যিক শর্ত',
        headingMy: '၁။ ကုမ္ပဏီ မှတ်ပုံတင်နှင့် လွတ်လပ်သော စည်းကမ်းချက်များ',
        headingEn: '1. Corporate Identity & Independent Store Terms',
        bulletsBn: [
          'পরিচালনাকারী প্রতিষ্ঠান: DEV SPARK SOFT LIMITED · ট্রেড লাইসেন্স: DNCC/037306 · USA Registration: Alaska Entity #10237739।',
          'এই ওয়েবসাইটে বর্ণিত মূল্য, ডেলিভারি, বাংলা QR, রেন্টাল, রিফান্ড ও রিপ্লেসমেন্ট সাপোর্ট DevSparkSoft-এর নিজস্ব বাণিজ্যিক শর্ত; এগুলো SpaceX বা Starlink-এর নিজস্ব অফিশিয়াল নীতিমালা হিসেবে গণ্য হবে না।',
        ],
        bulletsMy: [
          'လုပ်ငန်းအမည်: DEV SPARK SOFT LIMITED · Trade License: DNCC/037306 · Alaska Entity #10237739။',
          'စျေးနှုန်း၊ ပို့ဆောင်ခ၊ ငှားရမ်းခြင်းနှင့် ပြန်အမ်းငွေ စည်းကမ်းများသည် DevSparkSoft ၏ ကိုယ်ပိုင်စည်းမျဉ်းများဖြစ်ပြီး SpaceX/Starlink ၏ တရားဝင်မူဝါဒ မဟုတ်ပါ။',
        ],
        bulletsEn: [
          'Operated by DEV SPARK SOFT LIMITED (Bangladesh Trade License: DNCC/037306 · USA Registration: Alaska Entity #10237739).',
          'All commercial pricing, Bangla QR rules, 5 TB rental limits, and after-sales replacement offers are DevSparkSoft store policies and are not represented as SpaceX/Starlink’s own official corporate policies.',
        ],
      },
      {
        headingBn: '২. ক্রয় বনাম রেন্টাল ও মূল্য নির্ধারণ',
        headingMy: '၂။ ဝယ်ယူမှုနှင့် ငှားရမ်းမှု စျေးနှုန်းသတ်မှတ်ချက်',
        headingEn: '2. Outright Purchase vs Rental Kit Pricing & Terms',
        bulletsBn: [
          'স্থায়ী মালিকানায় কিট ক্রয়: Starlink Standard Kit 4X মাত্র ৳৪১,৫০০ এবং Starlink Mini Kit মাত্র ৳২১,৫০০ (প্রযোজ্য এলাকায় COD এবং বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি সুবিধা)।',
          'Starlink Rental Kit: এককালীন চার্জ মাত্র ৳৩,০০০ টাকা (Bangla QR-এ প্রদেয়; COD প্রযোজ্য নয়)। কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না।',
          'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য। রেন্টালে 5 TB মাসিক সীমা, প্রথম নিবন্ধিত লোকেশন (বাইরে Restricted), ১ বার অ্যাড্রেস পরিবর্তন ও রোমিং-বিহীন ব্যবহার বাধ্যতামূলক।',
        ],
        bulletsMy: [
          'အပြီးအပိုင်ဝယ်ယူခြင်း: Standard Kit 4X ৳41,500 နှင့် Mini Kit ৳21,500 (Global Delivery နှင့် သတ်မှတ်ဧရိယာ COD)။',
          'Starlink Rental Kit: တစ်ကြိမ်ကြေး ৳3,000 (Bangla QR သီးသန့် · ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ)။ လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
        ],
        bulletsEn: [
          'Outright Purchase Pricing: Starlink Standard Kit 4X (Purchase) at ৳41,500 and Starlink Mini Kit (Purchase) at ৳21,500. Global Delivery Available; COD available only in eligible areas of Bangladesh.',
          'Starlink Rental Kit Pricing: ৳3,000 (One-Time Charge) paid via Bangla QR ONLY (no COD). Hardware ownership is not transferred to the customer.',
          'Monthly Starlink subscription fees are separate. Rental compliance rules (5 TB monthly cap, first location lock, 1x address change, no Roaming) apply to every rental activation.',
        ],
      },
    ],
    conditionsBn: [
      'DevSparkSoft যেকোনো অর্ডার যাচাই, স্থগিত বা বাতিল করার অধিকার সংরক্ষণ করে যদি তথ্য অসত্য হয় বা পেমেন্ট TrxID প্রমাণিত না হয়।',
      'যেকোনো নীতিমালা আপডেট বা যোগাযোগের জন্য: info@devsparksoft.com.bd / +880 1326-370218।',
    ],
    conditionsMy: [
      'မှားယွင်းသော အချက်အလက် သို့မဟုတ် TrxID အတည်မပြုနိုင်ပါက အော်ဒါပယ်ဖျက်ခွင့် ရှိပါသည်။',
      'ဆက်သွယ်ရန်: info@devsparksoft.com.bd / +880 1326-370218။',
    ],
    conditionsEn: [
      'DevSparkSoft reserves the right to hold or cancel orders failing identity, address, or TrxID verification.',
      'For official inquiries or compliance support: info@devsparksoft.com.bd or +880 1326-370218.',
    ],
    relatedSlugs: ['rental-policy', 'payment-policy', 'privacy-policy', 'return-policy'],
  },
];

export const LEGAL_POLICY_MAP: Record<LegalPolicySlug, LegalPolicyDocument> = LEGAL_POLICIES.reduce(
  (acc, doc) => {
    acc[doc.slug] = doc;
    return acc;
  },
  {} as Record<LegalPolicySlug, LegalPolicyDocument>
);

export function resolveLegalPolicyBySlug(rawSlug?: string | null): LegalPolicyDocument | null {
  if (!rawSlug) return null;
  const clean = rawSlug.trim().toLowerCase().replace(/^\/+|\/+$/g, '') as LegalPolicySlug;
  return LEGAL_POLICY_MAP[clean] || null;
}

export interface CheckoutOneLineAlert {
  id: string;
  labelBn: string;
  labelMy: string;
  labelEn: string;
  noticeBn: string;
  noticeMy: string;
  noticeEn: string;
  ctaBn: string;
  ctaMy: string;
  ctaEn: string;
  href: `/Legal/${LegalPolicySlug}`;
}

export const CHECKOUT_ONE_LINE_ALERTS: CheckoutOneLineAlert[] = [
  {
    id: 'rental-policy',
    labelBn: 'Rental Policy',
    labelMy: 'Rental Policy',
    labelEn: 'Rental Policy',
    noticeBn: 'রেন্টাল কিটের শর্ত প্রযোজ্য।',
    noticeMy: 'ငှားရမ်းစက် စည်းကမ်းချက်များ အကျုံးဝင်သည်။',
    noticeEn: 'Rental Kit hardware terms apply.',
    ctaBn: 'বিস্তারিত নীতিমালা দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'বিস্তারিত নীতিমালা দেখুন',
    href: '/Legal/rental-policy',
  },
  {
    id: 'shipping-policy',
    labelBn: 'Shipping Policy',
    labelMy: 'Shipping Policy',
    labelEn: 'Shipping Policy',
    noticeBn: 'শিপিং চার্জ ও ডেলিভারি শর্ত প্রযোজ্য।',
    noticeMy: 'ပို့ဆောင်ခနှင့် ပို့ဆောင်ရေး စည်းကမ်းများ အကျုံးဝင်သည်။',
    noticeEn: 'Shipping charges & delivery terms apply.',
    ctaBn: 'বিস্তারিত দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'View details',
    href: '/Legal/shipping-policy',
  },
  {
    id: 'payment-policy',
    labelBn: 'Payment Policy',
    labelMy: 'Payment Policy',
    labelEn: 'Payment Policy',
    noticeBn: 'শুধুমাত্র Bangla QR পেমেন্ট গ্রহণযোগ্য।',
    noticeMy: 'Bangla QR ငွေပေးချေမှု တစ်မျိုးတည်းသာ လက်ခံသည်။',
    noticeEn: 'Only Bangla QR payment is accepted (no COD).',
    ctaBn: 'বিস্তারিত দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'View details',
    href: '/Legal/payment-policy',
  },
  {
    id: 'location-policy',
    labelBn: 'Location Policy',
    labelMy: 'Location Policy',
    labelEn: 'Location Policy',
    noticeBn: 'নিবন্ধিত লোকেশন ও ঠিকানা পরিবর্তনের শর্ত প্রযোজ্য।',
    noticeMy: 'မှတ်ပုံတင်လိပ်စာနှင့် ပြောင်းလဲခြင်း စည်းကမ်းများ အကျုံးဝင်သည်။',
    noticeEn: 'Registered location lock & 1-time address change apply.',
    ctaBn: 'বিস্তারিত দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'View details',
    href: '/Legal/location-policy',
  },
  {
    id: 'fair-usage-policy',
    labelBn: 'Fair Usage Policy',
    labelMy: 'Fair Usage Policy',
    labelEn: 'Fair Usage Policy',
    noticeBn: 'ডেটা ব্যবহার ও ফেয়ার ইউসেজ নীতিমালা প্রযোজ্য।',
    noticeMy: 'ဒေတာအသုံးပြုမှုနှင့် Fair Usage မူဝါဒ အကျုံးဝင်သည်။',
    noticeEn: '5 TB monthly data limit & fair usage policy apply.',
    ctaBn: 'বিস্তারিত দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'View details',
    href: '/Legal/fair-usage-policy',
  },
  {
    id: 'restriction-policy',
    labelBn: 'Service Restriction Policy',
    labelMy: 'Service Restriction Policy',
    labelEn: 'Service Restriction Policy',
    noticeBn: 'সার্ভিস ও দেশভিত্তিক বিধিনিষেধ প্রযোজ্য।',
    noticeMy: 'ဝန်ဆောင်မှုနှင့် နိုင်ငံအလိုက် ကန့်သတ်ချက်များ အကျုံးဝင်သည်။',
    noticeEn: 'Package (Residential & Lite only) & country restrictions apply.',
    ctaBn: 'বিস্তারিত দেখুন',
    ctaMy: 'အသေးစိတ်ကြည့်ရန်',
    ctaEn: 'View details',
    href: '/Legal/restriction-policy',
  },
];
