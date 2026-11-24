import type { AppLanguage } from '../lib/geoLanguage';

export type RentalFaqCategory = 'all' | '5tb_limit' | 'address' | 'payment';

export interface RentalFaqItem {
  id: string;
  category: Exclude<RentalFaqCategory, 'all'>;
  categoryBn: string;
  categoryMy: string;
  categoryEn: string;
  qBn: string;
  qMy: string;
  qEn: string;
  aBn: string;
  aMy: string;
  aEn: string;
}

export interface GeneralFaqItem {
  id: string;
  category: string;
  qBn: string;
  qMy: string;
  qEn: string;
  aBn: string;
  aMy: string;
  aEn: string;
}

export const RENTAL_FAQ_ITEMS: RentalFaqItem[] = [
  {
    id: 'usage-limit-5tb',
    category: '5tb_limit',
    categoryBn: '৫ টিবি ব্যবহার সীমা',
    categoryMy: '5 TB အသုံးပြုမှု ကန့်သတ်ချက်',
    categoryEn: '5TB Usage Limit',
    qBn: 'স্টারলিংক রেন্টাল কিটে মাসে সর্বোচ্চ কত ডেটা ব্যবহার করা যায়?',
    qMy: 'Starlink ငှားရမ်းစက်တွင် တစ်လလျှင် ဒေတာအများဆုံး မည်မျှအသုံးပြုနိုင်သနည်း။',
    qEn: 'What is the 5 TB monthly data usage limit on Starlink Rental Kits?',
    aBn: 'Starlink Standard 4X ও Starlink Mini উভয় রেন্টাল কিটেই প্রতি মাসে সর্বোচ্চ 5 TB (৫,০০০ জিবি) ব্যবহারের কঠোর সীমা প্রযোজ্য। একটি বিলিং সাইকেলে 5 TB-এর বেশি ডেটা ব্যবহার করা যাবে না। মাসিক ব্যবহার 5 TB-এর ভেতরে রাখলে নিরবচ্ছিন্ন হাই-স্পিড রেসিডেন্সিয়াল ইন্টারনেট চালু থাকবে।',
    aMy: 'Starlink Standard 4X နှင့် Starlink Mini ငှားရမ်းစက် နှစ်မျိုးလုံးတွင် တစ်လလျှင် အများဆုံး 5 TB (5,000 GB) အထိသာ အသုံးပြုနိုင်ပါသည်။ ငွေတောင်းခံသည့် စက်ဝန်းတစ်ခုအတွင်း 5 TB ထက်ပို၍ အသုံးမပြုနိုင်ပါ။',
    aEn: 'Both Starlink Standard 4X and Starlink Mini Rental Kits carry a strict 5 TB (5,000 GB) per month usage cap. You cannot exceed 5 TB within a single monthly billing cycle. Keeping monthly usage within 5 TB guarantees uninterrupted high-speed residential connectivity.',
  },
  {
    id: 'usage-limit-plans',
    category: '5tb_limit',
    categoryBn: '৫ টিবি ব্যবহার সীমা',
    categoryMy: '5 TB အသုံးပြုမှု ကန့်သတ်ချက်',
    categoryEn: '5TB Usage Limit',
    qBn: 'Residential Lite ও Residential Unlimited—দুটি রেন্টাল প্ল্যানেই কি 5 TB সীমা ও পূর্ণ স্পিড পাওয়া যায়?',
    qMy: 'Residential Lite နှင့် Unlimited ပက်ကေ့ချ်နှစ်ခုလုံးတွင် 5 TB ကန့်သတ်ချက်ရှိပါသလား။',
    qEn: 'Does the 5 TB limit apply to both Residential Lite and Residential Unlimited rental plans?',
    aBn: 'হ্যাঁ। রেন্টাল কিটে Residential Lite (৳৪,২০০/মাস · ২০০ Mbps পর্যন্ত) অথবা Residential Unlimited (৳৬,০০০/মাস · ৪০০+ Mbps পর্যন্ত)—যেকোনো প্ল্যান নিলেই মাসে সর্বোচ্চ 5 TB লিমিট প্রযোজ্য হবে। প্রতি মাসে বিলিং সাইকেল রিনিউ হলে 5 TB কোটা নতুন করে রিসেট হয়।',
    aMy: 'ဟုတ်ကဲ့။ Residential Lite (৳၄,၂၀၀/လ · 200 Mbps) သို့မဟုတ် Residential Unlimited (৳၆,၀၀၀/လ · 400+ Mbps) မည်သည့်ပက်ကေ့ချ်ကိုမဆို ငှားရမ်းစက်တွင် တစ်လ 5 TB ကန့်သတ်ချက် အကျုံးဝင်ပြီး လစဉ်ငွေပေးချေမှု စက်ဝန်းအသစ်တွင် ပြန်လည်သတ်မှတ်ပေးပါသည်။',
    aEn: 'Yes. Whether you choose Residential Lite (৳4,200/mo, up to 200 Mbps) or Residential Unlimited (৳6,000/mo, up to 400+ Mbps) on a Rental Kit, the monthly 5 TB cap strictly applies and resets automatically on each monthly billing cycle.',
  },
  {
    id: 'usage-limit-exceed',
    category: '5tb_limit',
    categoryBn: '৫ টিবি ব্যবহার সীমা',
    categoryMy: '5 TB အသုံးပြုမှု ကန့်သတ်ချက်',
    categoryEn: '5TB Usage Limit',
    qBn: 'মাসে 5 TB-এর বেশি ব্যান্ডউইথ বা কর্পোরেট ব্যবহার প্রয়োজন হলে কী করব?',
    qMy: 'တစ်လလျှင် 5 TB ထက်ပို၍ အသုံးပြုရန် လိုအပ်ပါက မည်သို့လုပ်ဆောင်ရမည်နည်း။',
    qEn: 'What if I need more than 5 TB per month or business/roaming flexibility?',
    aBn: 'রেন্টাল কিট কেবল মাসে সর্বোচ্চ 5 TB রেসিডেন্সিয়াল ব্যবহারের জন্য সীমাবদ্ধ। আপনার বাসা, অফিস বা প্রতিষ্ঠানে মাসে 5 TB-এর বেশি ডেটা কিংবা রোমিং সুবিধা প্রয়োজন হলে রেন্টালের বদলে স্থায়ী মালিকানায় কিট (Standard 4X মাত্র ৳৪১,৫০০ বা Mini মাত্র ৳২১,৫০০) ক্রয় করতে পারেন।',
    aMy: 'ငှားရမ်းစက်များသည် တစ်လ 5 TB အိမ်သုံးအတွက်သာ ကန့်သတ်ထားပါသည်။ 5 TB ထက်ပိုမိုအသုံးပြုလိုပါက သို့မဟုတ် Roaming အသုံးပြုလိုပါက စက်ကို အပြီးအပိုင် ဝယ်ယူအသုံးပြုနိုင်ပါသည် (Standard 4X ৳၄၁,၅০০ / Mini ৳၂၁,৫০০)။',
    aEn: 'Rental Kits are strictly capped at 5 TB/month for residential use. If your home, office, or operation requires more than 5 TB monthly or roaming capability, you should purchase an outright kit instead (Standard 4X at ৳41,500 or Starlink Mini at ৳21,500).',
  },
  {
    id: 'address-first-location',
    category: 'address',
    categoryBn: 'রেজিস্ট্রেশন লোকেশন',
    categoryMy: 'မှတ်ပုံတင်လိပ်စာ စည်းကမ်း',
    categoryEn: 'Registration Address',
    qBn: 'রেন্টাল কিট কি শুধুমাত্র প্রথম নিবন্ধিত লোকেশনে ব্যবহার করতে হবে? বাইরে নিলে কী হবে?',
    qMy: 'ငှားရမ်းစက်ကို ပထမ မှတ်ပုံတင်ထားသော လိပ်စာတွင်သာ အသုံးပြုရမည်လား။',
    qEn: 'Must the Rental Kit only be used at the first registered residential address?',
    aBn: 'হ্যাঁ। রেন্টাল কিট শুধুমাত্র অর্ডারের সময় দেওয়া আপনার প্রথম নিবন্ধিত রেসিডেন্সিয়াল ঠিকানায় ব্যবহারযোগ্য। প্রথম নিবন্ধিত লোকেশনের বাইরে কিট চালু বা স্থানান্তর করে ব্যবহার করলে নেটওয়ার্কে সংযোগ স্বয়ংক্রিয়ভাবে Restricted হয়ে যাবে।',
    aMy: 'ဟုတ်ကဲ့။ အော်ဒါတင်စဉ် ပေးသွင်းထားသည့် ပထမ မှတ်ပုံတင်လိပ်စာတွင်သာ အသုံးပြုနိုင်ပါသည်။ မှတ်ပုံတင်လိပ်စာပြင်ပတွင် ဖွင့်လှစ်အသုံးပြုပါက ဝန်ဆောင်မှု Restricted ဖြစ်သွားပါမည်။',
    aEn: 'Yes. Rental Kits are strictly locked to the first registered residential location submitted at checkout. Powering on or operating the hardware outside that registered service address automatically puts the connection into Restricted status.',
  },
  {
    id: 'address-one-time-change',
    category: 'address',
    categoryBn: 'রেজিস্ট্রেশন লোকেশন',
    categoryMy: 'မှတ်ပုံတင်လိပ်စာ စည်းကမ်း',
    categoryEn: 'Registration Address',
    qBn: 'রেন্টাল চলাকালীন নিবন্ধিত সার্ভিস অ্যাড্রেস কতবার পরিবর্তন করা যাবে?',
    qMy: 'ငှားရမ်းကာလအတွင်း မှတ်ပုံတင်လိပ်စာကို ဘယ်နှစ်ကြိမ် ပြောင်းလဲခွင့်ရှိသနည်း။',
    qEn: 'How many times can I change my registered residential service address?',
    aBn: 'পুরো রেন্টাল মেয়াদে আপনি আপনার প্রথম নিবন্ধিত সার্ভিস অ্যাড্রেস সর্বোচ্চ ১ বার (একবার) পরিবর্তন করতে পারবেন। দ্বিতীয়বার ঠিকানা পরিবর্তনের কোনো সুযোগ নেই—তাই অর্ডার করার আগে জেলা, বাড়ি/রোড নম্বর ও সঠিক লোকেশন যাচাই করে নেওয়া জরুরি।',
    aMy: 'ငှားရမ်းသည့်ကာလတစ်ခုလုံးတွင် မှတ်ပုံတင်လိပ်စာကို အများဆုံး (၁) ကြိမ်သာ ပြောင်းလဲနိုင်ပါသည်။ ဒုတိယအကြိမ် ပြောင်းလဲခွင့် မရှိပါ။',
    aEn: 'You may update your registered residential service address ONLY ONCE (1 time) during the entire rental period. Because no second change is allowed, double-check your exact district, house/road details, and rooftop placement before ordering.',
  },
  {
    id: 'address-no-roaming-plans',
    category: 'address',
    categoryBn: 'রেজিস্ট্রেশন লোকেশন',
    categoryMy: 'မှတ်ပုံတင်လိပ်စာ စည်းကမ်း',
    categoryEn: 'Registration Address',
    qBn: 'রেন্টাল কিটে কি Roaming বা অন্য কোনো সার্ভিস প্যাকেজ চালু করা যাবে?',
    qMy: 'ငှားရမ်းစက်တွင် Roaming သို့မဟုတ် အခြားပက်ကေ့ချ်များ အသုံးပြုနိုင်ပါသလား။',
    qEn: 'Can I activate Roaming or any other Starlink package on a Rental Kit?',
    aBn: 'না। রেন্টাল কিটে Roaming (ভ্রাম্যমাণ/গ্লোবাল) সহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না। কেবল নির্দিষ্ট ঠিকানার Residential (৳৬,০০০/মাস) এবং Residential Lite (৳৪,২০০/মাস) প্যাকেজই অনুমোদিত।',
    aMy: 'မရပါ။ ငှားရမ်းစက်များတွင် Roaming အပါအဝင် အခြားမည်သည့်ပက်ကေ့ချ်ကိုမျှ အသုံးမပြုနိုင်ပါ။ Residential (৳၆,၀၀၀/လ) နှင့် Residential Lite (৳၄,၂၀၀/လ) ပက်ကေ့ချ်နှစ်မျိုးသာ ခွင့်ပြုထားပါသည်။',
    aEn: 'No. Roaming and all other package tiers are strictly unavailable on Rental Kits. Only fixed-address Residential Unlimited (৳6,000/mo) and Residential Lite (৳4,200/mo) plans can be used.',
  },
  {
    id: 'payment-free-kit-shipping',
    category: 'payment',
    categoryBn: 'সাবস্ক্রিপশন ও পেমেন্ট',
    categoryMy: 'လစဉ်ကြေးနှင့် ငွေပေးချေမှု',
    categoryEn: 'Subscription & Payment',
    qBn: 'Starlink Rental Kit-এর ৳৩,০০০ এককালীন চার্জ এবং মাসিক সাবস্ক্রিপশন বিলিং কীভাবে কাজ করে?',
    qMy: 'Starlink Rental Kit တစ်ကြိမ်ကြေး ৳3,000 နှင့် လစဉ်ကြေး ပေးချေမှုပုံစံ မည်သို့ရှိသနည်း။',
    qEn: 'How do the Starlink Rental Kit (৳3,000 One-Time Charge) and monthly subscription fees work?',
    aBn: 'Starlink Rental Kit (Standard 4X বা Mini)-এর এককালীন চার্জ মাত্র ৳৩,০০০ টাকা; কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না। মাসিক Starlink সাবস্ক্রিপশন ফি (Residential Lite ৳৪,২০০/মাস অথবা Residential Unlimited ৳৬,০০০/মাস) আলাদাভাবে প্রযোজ্য।',
    aMy: 'Starlink Rental Kit (Standard 4X သို့မဟုတ် Mini) ၏ တစ်ကြိမ်ကြေးမှာ ৳3,000 ဖြစ်ပြီး စက်ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ။ လစဉ် Starlink Subscription ကြေး (Lite ৳4,200 သို့မဟုတ် Unlimited ৳6,000) ကို သီးခြားပေးသွင်းရပါမည်။',
    aEn: 'The Starlink Rental Kit (Standard 4X or Mini) has a one-time charge of ৳3,000; hardware ownership is not transferred to the customer. Monthly Starlink subscription fees (Residential Lite ৳4,200/mo or Residential Unlimited ৳6,000/mo) apply separately.',
  },
  {
    id: 'payment-bangla-qr-no-cod',
    category: 'payment',
    categoryBn: 'সাবস্ক্রিপশন ও পেমেন্ট',
    categoryMy: 'လစဉ်ကြေးနှင့် ငွေပေးချေမှု',
    categoryEn: 'Subscription & Payment',
    qBn: 'রেন্টাল কিট অর্ডারে কি Cash on Delivery (COD) ব্যবহার করা যাবে?',
    qMy: 'ငှားရမ်းစက်အော်ဒါတွင် Cash on Delivery (COD) ရရှိနိုင်ပါသလား။',
    qEn: 'Is Cash on Delivery (COD) accepted for Rental Kit orders?',
    aBn: 'না। Starlink Rental Kit-এর এককালীন ৳৩,০০০ টাকা চার্জ শুধুমাত্র Bangla QR-এর মাধ্যমে পরিশোধ করতে হবে—রেন্টালে Cash on Delivery (COD) প্রযোজ্য নয়। অফিশিয়াল Bangla QR কোড স্ক্যান করে bKash, Nagad, Rocket বা যেকোনো ব্যাংক অ্যাপে পেমেন্ট করে TrxID সাবমিট করতে হবে। (স্থায়ী কিট ক্রয়ে প্রযোজ্য এলাকায় COD চালু আছে।)',
    aMy: 'မရပါ။ Starlink Rental Kit တစ်ကြိမ်ကြေး ৳3,000 ကို Bangla QR ဖြင့်သာ ပေးချေနိုင်ပြီး COD မရရှိနိုင်ပါ။ bKash, Nagad, Rocket သို့မဟုတ် ဘဏ်အက်ပ်ဖြင့် Bangla QR ငွေလွှဲပြီး TrxID ထည့်သွင်း၍ အော်ဒါတင်ရပါမည်။',
    aEn: 'No. The ৳3,000 one-time charge for Starlink Rental Kits is paid via Bangla QR ONLY (bKash, Nagad, Rocket, or any bank app) — Cash on Delivery (COD) is not available for Rental Kits. (Outright kit purchases support COD in eligible Bangladesh areas.)',
  },
  {
    id: 'payment-renewal-cancellation',
    category: 'payment',
    categoryBn: 'সাবস্ক্রিপশন ও পেমেন্ট',
    categoryMy: 'လစဉ်ကြေးနှင့် ငွေပေးချေမှု',
    categoryEn: 'Subscription & Payment',
    qBn: 'মাসিক সাবস্ক্রিপশন রিনিউয়াল এবং রেন্টাল বাতিল করলে কিট ফেরতের প্রক্রিয়া কী?',
    qMy: 'လစဉ်ကြေးသက်တမ်းတိုးခြင်းနှင့် ငှားရမ်းမှုပယ်ဖျက်လျှင် စက်ပြန်ပို့ခြင်း မည်သို့လုပ်ဆောင်ရမည်နည်း။',
    qEn: 'How do monthly subscription renewals and hardware returns on cancellation work?',
    aBn: 'প্রতি মাসের বিলিং তারিখের আগে আপনার নির্বাচিত সাবস্ক্রিপশন ফি পরিশোধ করলে সার্ভিস সচল থাকবে (রেন্টালে সার্ভিস Pause অপশন প্রযোজ্য নয়)। আপনি যেকোনো সময় রেন্টাল বাতিল করতে পারবেন, তবে বাতিলের ক্ষেত্রে সম্পূর্ণ কিট (ডিশ, রাউটার, কেবল ও পাওয়ার সাপ্লাই) অক্ষত অবস্থায় ফেরত দেওয়া বাধ্যতামূলক।',
    aMy: 'လစဉ်ငွေပေးချေမှုရက်မတိုင်မီ လစဉ်ကြေးပေးသွင်းပါက ဝန်ဆောင်မှု ဆက်လက်အသုံးပြုနိုင်မည် (Pause လုပ်၍မရပါ)။ ဝန်ဆောင်မှုပယ်ဖျက်လိုပါက စက်ပစ္စည်းအစုံအလင်ကို ပြန်လည်ပေးအပ်ရန် မဖြစ်မနေလိုအပ်ပါသည်။',
    aEn: 'Renew your selected Residential subscription fee ahead of each monthly billing date to maintain service (service Pause is unavailable on Rental Kits). You may cancel anytime, provided the complete hardware kit (dish, router, power supply, and cables) is returned in intact condition, stopping future subscription billing.',
  },
];

export const GENERAL_FAQ_ITEMS: GeneralFaqItem[] = [
  {
    id: 'what-is-devspark-link',
    category: 'General',
    qBn: 'DEVSPARK LINK (DSLink) কী এবং এর কাজ কী?',
    qMy: 'DEVSPARK LINK (DSLink) ဆိုတာ ဘာလဲ။',
    qEn: 'What is DEVSPARK LINK (DSLink)?',
    aBn: 'DEVSPARK LINK (DSLink) হলো DEV SPARK SOFT LIMITED (devsparksoft.com.bd) পরিচালিত Starlink Kit Sales, Rental, Global Delivery & Technical Support প্ল্যাটফর্ম। আমরা আসল স্টারলিংক হার্ডওয়্যার কিট (Standard Kit 4X ৳৪১,৫০০ ও Mini Kit ৳২১,৫০০), রেন্টাল কিট (৳৩,০০০ এককালীন চার্জ) এবং ২৪/৭ টেকনিক্যাল সাপোর্ট প্রদান করি।',
    aMy: 'DEVSPARK LINK (DSLink) သည် DEV SPARK SOFT LIMITED (devsparksoft.com.bd) မှ လည်ပတ်နေသော Starlink Kit ရောင်းချခြင်း၊ ငှားရမ်းခြင်း၊ ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ခြင်းနှင့် 24/7 နည်းပညာဝန်ဆောင်မှုပေးနေသော ပလက်ဖောင်းဖြစ်ပါသည်။',
    aEn: 'DEVSPARK LINK (DSLink) is operated by DEV SPARK SOFT LIMITED (devsparksoft.com.bd), providing genuine Starlink hardware sales (Standard Kit 4X ৳41,500 & Mini Kit ৳21,500), Rental Kits (৳3,000 One-Time Charge), Global Delivery, and 24/7 technical support.',
  },
  {
    id: 'available-starlink-kits',
    category: 'Hardware',
    qBn: 'DSLink-এ কোন কোন স্টারলিংক কিট ও মূল্য তালিকা পাওয়া যাচ্ছে?',
    qMy: 'DSLink တွင် Starlink စက်ပစ္စည်း မည်သည့်မော်ဒယ်နှင့် စျေးနှုန်းများ ရရှိနိုင်သနည်း။',
    qEn: 'What Starlink kits and official prices are available at DSLink?',
    aBn: 'আমাদের অফিশিয়াল মূল্য: Starlink Rental Kit — মাত্র ৳৩,০০০ টাকা (এককালীন চার্জ), Starlink Standard Kit 4X (ক্রয়) — মাত্র ৳৪১,৫০০ টাকা এবং Starlink Mini Kit (ক্রয়) — মাত্র ৳২১,৫০০ টাকা। মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    aMy: 'တရားဝင် စျေးနှုန်းများ: Starlink Rental Kit — ৳3,000 (တစ်ကြိမ်ကြေး)၊ Starlink Standard Kit 4X (ဝယ်ယူရန်) — ৳41,500 နှင့် Starlink Mini Kit (ဝယ်ယူရန်) — ৳21,500 ဖြစ်ပါသည်။ လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
    aEn: 'Official hardware pricing: Starlink Rental Kit — ৳3,000 (One-Time Charge), Starlink Standard Kit 4X (Purchase) — ৳41,500, and Starlink Mini Kit (Purchase) — ৳21,500. Monthly Starlink subscription fees are separate.',
  },
  {
    id: 'monthly-service-packages',
    category: 'Packages',
    qBn: 'মাসিক ইন্টারনেট প্যাকেজের খরচ কত?',
    qMy: 'လစဉ် အင်တာနက် ပက်ကေ့ချ် ဈေးနှုန်းများ မည်မျှရှိသနည်း။',
    qEn: 'How much are the monthly service packages?',
    aBn: 'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য: Residential Lite ৳৪,২০০/মাস (২০০ Mbps পর্যন্ত) এবং Residential Unlimited ৳৬,০০০/মাস (৪০০+ Mbps পর্যন্ত)। নিজস্ব কেনা কিটে Roam 50GB ৳৬,০০০/মাস ও Roam Unlimited ৳১২,০০০/মাস পাওয়া যায়।',
    aMy: 'လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်: Residential Lite ৳4,200/လ (200 Mbps အထိ) နှင့် Residential Unlimited ৳6,000/လ (400+ Mbps အထိ)။ ကိုယ်ပိုင်ဝယ်ယူထားသောစက်များတွင် Roam ပက်ကေ့ချ်များလည်း အသုံးပြုနိုင်ပါသည်။',
    aEn: 'Monthly Starlink subscription fees are separate: Residential Lite starts at ৳4,200/month (up to 200 Mbps) and Residential Unlimited is ৳6,000/month (up to 400+ Mbps). Outright purchased kits also support Roam 50GB (৳6,000/mo) and Roam Unlimited (৳12,000/mo).',
  },
  {
    id: 'nationwide-delivery-cod',
    category: 'Delivery',
    qBn: 'বিশ্বব্যাপী ডেলিভারি (Global Delivery) ও ক্যাশ অন ডেলিভারি (COD) কীভাবে কাজ করে?',
    qMy: 'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး (Global Delivery) နှင့် Cash on Delivery (COD) မည်သို့အလုပ်လုပ်သနည်း။',
    qEn: 'How do Global Delivery and Cash on Delivery (COD) work?',
    aBn: 'Global Delivery Available — বাংলাদেশসহ বিশ্বব্যাপী Starlink Standard Kit 4X (৳৪১,৫০০) ও Mini Kit (৳২১,৫০০) ডেলিভারি সুবিধা রয়েছে। তবে বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই (স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য)। প্রযোজ্য এলাকায় (বাংলাদেশে স্থায়ী কিট ক্রয়ে) পণ্য হাতে পেয়ে চেক ও অ্যাক্টিভেশন যাচাই করে Cash on Delivery (COD) পেমেন্ট করার সুবিধা রয়েছে। রেন্টাল কিটের ৳৩,০০০ এককালীন চার্জ শুধু Bangla QR-এ প্রদেয়।',
    aMy: 'Global Delivery Available — ဘင်္ဂလားဒေ့ရှ်နှင့် ကမ္ဘာတစ်ဝှမ်းသို့ Starlink Standard Kit 4X (৳41,500) နှင့် Mini Kit (৳21,500) ပို့ဆောင်ပေးပါသည်။ နိုင်ငံတိုင်းတွင် Starlink ဖွင့်လှစ်အသုံးပြုနိုင်မည်ဟု အာမမခံပါ (ဒေသဆိုင်ရာ ဥပဒေနှင့် Starlink မူဝါဒများ အကျုံးဝင်ပါသည်)။ Cash on Delivery (COD) ကို ဘင်္ဂလားဒေ့ရှ် သတ်မှတ်ဧရိယာများရှိ အပြီးအပိုင် ဝယ်ယူမှုများတွင်သာ ရရှိနိုင်ပြီး Rental Kit ৳3,000 ကို Bangla QR ဖြင့်သာ ပေးချေရမည်။',
    aEn: 'Global Delivery Available — Worldwide Starlink Kit Shipping for Starlink Standard Kit 4X (৳41,500) and Starlink Mini Kit (৳21,500). International delivery availability does not guarantee Starlink activation or roaming support in every country (local regulations and Starlink policies apply). Cash on Delivery (COD) is available only in eligible areas of Bangladesh for outright purchases. Starlink Rental Kit (৳3,000 One-Time Charge) is paid via Bangla QR only.',
  },
];

export interface LocalizedFaqEntry {
  id?: string;
  category?: string;
  question: string;
  answer: string;
}

function toFaqAnchorSlug(input: string, index: number): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || `q-${index + 1}`;
}

export function getLocalizedFaqEntries(
  items: Array<{
    id?: string;
    category?: string;
    categoryBn?: string;
    categoryMy?: string;
    categoryEn?: string;
    qBn: string;
    qMy: string;
    qEn: string;
    aBn: string;
    aMy: string;
    aEn: string;
  }>,
  language: AppLanguage
): LocalizedFaqEntry[] {
  return items.map((item, idx) => {
    const localizedCategory =
      language === 'bn'
        ? item.categoryBn || item.category
        : language === 'my'
          ? item.categoryMy || item.category
          : item.categoryEn || item.category;

    return {
      id: item.id || toFaqAnchorSlug(item.qEn, idx),
      category: localizedCategory,
      question: language === 'bn' ? item.qBn : language === 'my' ? item.qMy : item.qEn,
      answer: language === 'bn' ? item.aBn : language === 'my' ? item.aMy : item.aEn,
    };
  });
}

export function buildQuestionJsonLd(
  entry: LocalizedFaqEntry,
  index: number,
  options?: { inLanguage?: string; pageUrl?: string }
): Record<string, any> {
  const slug = entry.id || toFaqAnchorSlug(entry.question, index);
  const baseUrl = options?.pageUrl ? options.pageUrl.split('#')[0] : undefined;
  const questionAnchorUrl = baseUrl ? `${baseUrl}#faq-${slug}` : undefined;

  const acceptedAnswer: Record<string, any> = {
    '@type': 'Answer',
    text: entry.answer,
    author: {
      '@type': 'Organization',
      name: 'DEV SPARK SOFT LIMITED',
    },
  };

  if (questionAnchorUrl) {
    acceptedAnswer['@id'] = `${questionAnchorUrl}-answer`;
  }
  if (options?.inLanguage) {
    acceptedAnswer.inLanguage = options.inLanguage;
  }

  const questionNode: Record<string, any> = {
    '@type': 'Question',
    position: index + 1,
    name: entry.question,
    answerCount: 1,
    acceptedAnswer,
  };

  if (questionAnchorUrl) {
    questionNode['@id'] = questionAnchorUrl;
    questionNode.url = questionAnchorUrl;
  }
  if (options?.inLanguage) {
    questionNode.inLanguage = options.inLanguage;
  }
  if (entry.category) {
    questionNode.about = {
      '@type': 'Thing',
      name: entry.category,
    };
  }

  return questionNode;
}

export function buildFaqPageJsonLd(
  entries: LocalizedFaqEntry[],
  options?: { inLanguage?: string; pageUrl?: string }
): Record<string, any> {
  const baseUrl = options?.pageUrl ? options.pageUrl.split('#')[0] : undefined;

  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map((entry, index) =>
      buildQuestionJsonLd(entry, index, {
        inLanguage: options?.inLanguage,
        pageUrl: baseUrl,
      })
    ),
  };

  if (options?.inLanguage) {
    schema.inLanguage = options.inLanguage;
  }
  if (baseUrl) {
    schema.url = baseUrl;
    schema['@id'] = `${baseUrl}#faq`;
  }

  return schema;
}
