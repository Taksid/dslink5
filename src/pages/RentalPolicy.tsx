import React, { useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Database,
  Globe,
  MapPin,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import { RentalFaqSection } from '../components/RentalFaqSection';
import { OFFICIAL_HEADER_LOGO_URL } from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';
import { formatBdt, formatBdtBn, useCentralPricing } from '../lib/pricingConfig';

interface RentalPolicyPageProps {
  onBackToMainSite?: () => void;
}

export const RENTAL_TERMS_SECTIONS = [
  {
    code: 'A',
    titleBn: 'A. First Registered Location & 1-Time Address Change Policy',
    titleEn: 'A. First Registered Location & 1-Time Address Change Policy',
    itemsBn: [
      '১. Starlink Standard 4X ও Starlink Mini Rental Kit শুধুমাত্র প্রথম নিবন্ধিত লোকেশনে (First Registered Location) ব্যবহার করতে হবে।',
      '২. নিবন্ধিত লোকেশনের বাইরে ডিভাইসটি ব্যবহার করলে সংযোগ স্বয়ংক্রিয়ভাবে Restricted হয়ে যাবে।',
      '৩. সম্পূর্ণ রেন্টাল মেয়াদে নিবন্ধিত সার্ভিস অ্যাড্রেস সর্বোচ্চ একবার (১ বার) পরিবর্তন করা যাবে।',
      '৪. রেন্টাল কিটে রোমিংসহ (Roaming) অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না — কেবল Residential এবং Residential Lite প্যাকেজই ব্যবহারযোগ্য।',
      '৫. ভুল বা ভুয়া ঠিকানা প্রদান করলে রেন্টাল অর্ডার বাতিল হতে পারে।',
    ],
    itemsEn: [
      '1. Starlink Standard 4X and Starlink Mini Rental Kits may ONLY be used at the first registered location.',
      '2. Using or moving the kit outside its registered location will cause the service to become Restricted.',
      '3. The registered service address can be changed only ONCE (1 time) throughout the rental.',
      '4. Roaming and all other non-eligible plans cannot be used — ONLY Residential Unlimited and Residential Lite are permitted.',
      '5. Orders containing false or unverifiable addresses will be cancelled.',
    ],
  },
  {
    code: 'B',
    titleBn: 'B. Starlink Rental Kit One-Time Charge & Ownership Policy',
    titleEn: 'B. Starlink Rental Kit One-Time Charge & Ownership Policy',
    itemsBn: [
      '১. Starlink Rental Kit (Standard 4X বা Mini)-এর মূল্য মাত্র ৳৩,০০০ টাকা (এককালীন চার্জ / One-Time Charge)।',
      '২. Rental Kit-এর ৩,০০০ টাকা এককালীন চার্জ; কিটের স্থায়ী মালিকানা ক্রেতার কাছে হস্তান্তর হয় না।',
      '৩. সার্ভিস বন্ধ বা সাবস্ক্রিপশন বাতিল হলে সম্পূর্ণ ডিভাইস ফেরত দিতে হবে।',
      '৪. Rental Kit বিক্রি, হস্তান্তর, সাব-রেন্ট বা পরিবর্তন করা সম্পূর্ণ নিষিদ্ধ; ক্ষতিগ্রস্ত বা হারিয়ে গেলে নির্ধারিত ক্ষতিপূরণ প্রযোজ্য।',
    ],
    itemsEn: [
      '1. The Starlink Rental Kit (Standard 4X or Mini) is ৳3,000 (One-Time Charge).',
      '2. Hardware ownership does not transfer to the customer.',
      '3. The complete kit must be returned if service stops or subscription is cancelled.',
      '4. Selling, transferring, sub-renting, or modifying a Rental Kit is strictly prohibited; damage/loss penalties apply.',
    ],
  },
  {
    code: 'C',
    titleBn: 'C. One-Time Charge Payment (Bangla QR Only) & Separate Monthly Subscription',
    titleEn: 'C. One-Time Charge Payment (Bangla QR Only) & Separate Monthly Subscription',
    itemsBn: [
      '১. Starlink Rental Kit-এর এককালীন ৳৩,০০০ টাকা চার্জ শুধুমাত্র Bangla QR (bKash, Nagad, Rocket বা যেকোনো ব্যাংক অ্যাপ)-এর মাধ্যমে পরিশোধ করতে হবে।',
      '২. রেন্টাল কিট অর্ডারে Cash on Delivery (COD) প্রযোজ্য নয়।',
      '৩. মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য (Residential Lite ৳৪,২০০/মাস বা Residential Unlimited ৳৬,০০০/মাস)।',
      '৪. নির্ধারিত তারিখের মধ্যে মাসিক সাবস্ক্রিপশন ফি পরিশোধ না করলে সংযোগ সাময়িকভাবে স্থগিত হবে।',
    ],
    itemsEn: [
      '1. The one-time ৳3,000 Starlink Rental Kit charge must be paid via Bangla QR (bKash, Nagad, Rocket, or any bank app).',
      '2. Cash on Delivery (COD) is NOT available for Rental Kit orders.',
      '3. Monthly Starlink subscription fees are separate (Residential Lite ৳4,200/mo or Residential Unlimited ৳6,000/mo).',
      '4. Failure to pay the monthly subscription fee on time may suspend service.',
    ],
  },
  {
    code: 'D',
    titleBn: 'D. Rental Kit Return Policy',
    titleEn: 'D. Rental Kit Return Policy',
    itemsBn: [
      '১. সার্ভিস বাতিল হলে নির্দিষ্ট সময়ের মধ্যে সম্পূর্ণ কিট (Dish, Router/Stand, Cable, Power Supply) ফেরত দিতে হবে।',
      '২. ডিভাইস ভালো অবস্থায় এবং সব এক্সেসরিজসহ ফেরত দিতে হবে।',
      '৩. ক্ষতিগ্রস্ত অবস্থায় ফেরত দিলে মেরামত বা প্রতিস্থাপন খরচ গ্রাহককে বহন করতে হবে।',
      '৪. নির্ধারিত সময়ে ফেরত না দিলে সম্পূর্ণ ডিভাইস চার্জ আরোপ হতে পারে।',
    ],
    itemsEn: [
      '1. Upon cancellation, the full kit (Dish, Router/Stand, Cable, Power Supply) must be returned within the required window.',
      '2. Hardware must be returned in good working condition with all included accessories.',
      '3. Customers are responsible for repair or replacement costs if hardware returns damaged.',
      '4. Failure to return the kit within the deadline may incur full retail device replacement charges.',
    ],
  },
  {
    code: 'E',
    titleBn: 'E. 5 TB Monthly Limit & Restricted Package Notice',
    titleEn: 'E. 5 TB Monthly Limit & Restricted Package Notice',
    itemsBn: [
      '১. Standard 4X ও Starlink Mini — উভয় রেন্টাল কিটে মাসে 5 TB-এর বেশি ব্যবহার করা যাবে না।',
      '২. রেন্টাল কিটে রোমিংসহ (Roaming) অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না — শুধুমাত্র Residential ও Residential Lite প্যাকেজ ব্যবহারযোগ্য।',
      '৩. শুধুমাত্র প্রথম নিবন্ধিত লোকেশনে ব্যবহার করতে হবে; লোকেশনের বাইরে ব্যবহার করলে সার্ভিস Restricted হবে।',
      '৪. রেন্টাল চলাকালীন সর্বোচ্চ একবার (১ বার) অ্যাড্রেস পরিবর্তন করা যাবে।',
    ],
    itemsEn: [
      '1. Usage CANNOT exceed 5 TB per month on either Standard 4X or Starlink Mini Rental Kits.',
      '2. Roaming and all other packages are blocked — ONLY Residential Unlimited and Residential Lite plans can be used.',
      '3. Must be operated only at the first registered location; operating outside that location makes the kit/service Restricted.',
      '4. Registered service address may be changed ONCE (1 time) only.',
    ],
  },
  {
    code: 'F',
    titleBn: 'F. Restrictions & Payment Rules',
    titleEn: 'F. Restrictions & Payment Rules',
    itemsBn: [
      '• Starlink Rental Kit: ৳৩,০০০ এককালীন চার্জ (One-Time Charge) — Bangla QR-এ প্রদেয় (COD প্রযোজ্য নয়); মালিকানা হস্তান্তর হয় না।',
      '• মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
      '• মাসে 5 TB-এর বেশি ব্যবহার করা যাবে না।',
      '• প্রথম নিবন্ধিত লোকেশনের বাইরে ব্যবহার করলে সার্ভিস Restricted হবে (সর্বোচ্চ ১ বার অ্যাড্রেস পরিবর্তন)।',
      '• রোমিংসহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না (শুধুমাত্র Residential ও Lite)।',
      '• অবৈধ রিসেল, সাব-রেন্ট বা অননুমোদিত হস্তান্তর সম্পূর্ণ নিষিদ্ধ।',
    ],
    itemsEn: [
      '• Starlink Rental Kit: ৳3,000 One-Time Charge paid via Bangla QR (no COD); hardware ownership does not transfer.',
      '• Monthly Starlink subscription fees are separate.',
      '• Cannot exceed 5 TB monthly data usage.',
      '• Operating outside the first registered location results in Restricted status (1-time address change only).',
      '• Roaming and other plans cannot be used — strictly Residential & Residential Lite only.',
      '• Illegal resale or unauthorized third-party transfer is strictly forbidden.',
    ],
  },
];

export const RENTAL_RESTRICTIONS_POLICY = [
  {
    num: '1',
    titleBn: '1. 5 TB Monthly Data Limit (৫ টিবি-এর বেশি নয়)',
    titleEn: '1. 5 TB Monthly Data Limit (Cannot Exceed 5 TB)',
    icon: Database,
    bodyBn:
      'Starlink Standard 4X এবং Starlink Mini রেন্টাল কিটে মাসে ৫ টিবি (5 TB)-এর বেশি ডেটা ব্যবহার করা যাবে না। 5 TB সীমা অতিক্রম করলে সংযোগ সীমিত বা স্থগিত হতে পারে।',
    bodyEn:
      'Usage on both Standard 4X and Starlink Mini Rental Kits cannot exceed 5 TB per month. Exceeding 5 TB in a billing cycle will trigger speed limits or suspension.',
  },
  {
    num: '2',
    titleBn: '2. First Registered Location Only & Restriction Outside Location',
    titleEn: '2. First Registered Location Only (Restricted Outside)',
    icon: Globe,
    bodyBn:
      'রেন্টাল কিট শুধুমাত্র প্রথম নিবন্ধিত লোকেশনে ব্যবহার করা যাবে। প্রথম নিবন্ধিত লোকেশনের বাইরে কিট চালু বা ব্যবহার করলে সার্ভিস স্বয়ংক্রিয়ভাবে Restricted হয়ে যাবে।',
    bodyEn:
      'Rental Kits may ONLY be used at the first registered service location. Powering on or operating outside the registered location causes the connection to become Restricted.',
  },
  {
    num: '3',
    titleBn: '3. Only 1-Time Address Change Allowed (একবার অ্যাড্রেস পরিবর্তন)',
    titleEn: '3. Only 1-Time Address Change Allowed',
    icon: MapPin,
    bodyBn:
      'রেন্টাল সাবস্ক্রিপশন চলাকালীন গ্রাহক তার নিবন্ধিত ঠিকানা সর্বোচ্চ একবার (১ বার) পরিবর্তন করতে পারবেন। দ্বিতীয়বার ঠিকানা পরিবর্তনের কোনো সুযোগ নেই।',
    bodyEn:
      'Customers may change their registered service address ONLY ONCE (1 time) during the rental term. No further address changes are permitted afterward.',
  },
  {
    num: '4',
    titleBn: '4. Package & Roaming Restriction (Only Residential & Lite)',
    titleEn: '4. Eligible Packages: Residential & Lite Only (No Roaming)',
    icon: ShieldAlert,
    listBn: [
      '• রোমিং (Roaming) সহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না।',
      '• শুধুমাত্র Residential Unlimited (৳৬,০০০/মাস) এবং Residential Lite (৳৪,২০০/মাস) ব্যবহারযোগ্য।',
      '• মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
      '• প্রথম নিবন্ধিত লোকেশনের বাইরে ব্যবহার করলে সার্ভিস Restricted হবে।',
      '• রেন্টাল কিটে Pause অপশন ও অবৈধ হস্তান্তর প্রযোজ্য নয়।',
    ],
    listEn: [
      '• Roaming and all other service packages cannot be used on Rental Kits.',
      '• ONLY Residential Unlimited (৳6,000/mo) and Residential Lite (৳4,200/mo) plans are eligible.',
      '• Monthly Starlink subscription fees are separate.',
      '• Operating outside the first registered location results in Restricted status.',
      '• Service Pause, resale, or third-party transfer is prohibited.',
    ],
  },
  {
    num: '5',
    titleBn: '5. Starlink Rental Kit — ৳3,000 One-Time Charge (Bangla QR Only — No COD)',
    titleEn: '5. Starlink Rental Kit — ৳3,000 One-Time Charge (Bangla QR Only — No COD)',
    icon: ShieldCheck,
    listBn: [
      '• Starlink Rental Kit (Standard 4X বা Mini)-এর এককালীন চার্জ ৳৩,০০০ টাকা।',
      '• কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না।',
      '• পেমেন্ট শুধুমাত্র Bangla QR-এর মাধ্যমে গ্রহণ করা হয় — রেন্টাল কিটে COD প্রযোজ্য নয়।',
      '• মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য (Lite ৳৪,২০০/মাস বা Unlimited ৳৬,০০০/মাস)।',
      '• সার্ভিস বন্ধ করলে সম্পূর্ণ কিট ফেরত দেওয়া বাধ্যতামূলক।',
    ],
    listEn: [
      '• Starlink Rental Kit (Standard 4X or Mini) has a one-time charge of ৳3,000.',
      '• Hardware ownership does not transfer to the customer.',
      '• Payment is accepted via Bangla QR ONLY — COD is not available for Rental Kits.',
      '• Monthly Starlink subscription fees are separate (Lite ৳4,200/mo or Unlimited ৳6,000/mo).',
      '• Returning the complete hardware kit is mandatory upon service cancellation.',
    ],
  },
];

export const RentalPolicyPage: React.FC<RentalPolicyPageProps> = ({ onBackToMainSite }) => {
  const { language, t3 } = useGeoLanguage();
  const { rentalKitPrice } = useCentralPricing();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleGoHome = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onBackToMainSite) {
      onBackToMainSite();
    } else {
      window.history.pushState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans selection:bg-white selection:text-black">
      <header className="sticky top-0 z-40 border-b border-white/15 bg-black/95 backdrop-blur-md safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a href="/" onClick={handleGoHome} className="flex items-center shrink min-w-0">
              <img
                src={OFFICIAL_HEADER_LOGO_URL}
                alt="DEVSPARK LINK — DEV SPARK SOFT LIMITED"
                width={308}
                height={74}
                className="w-[136px] min-[375px]:w-[154px] sm:w-[178px] md:w-[194px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
              />
            </a>
            <span className="hidden md:inline-block text-xs font-mono uppercase tracking-widest text-neutral-400 border-l border-white/15 pl-3 truncate">
              Rental Policy & Restrictions
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="/Legal"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-[4px] text-xs font-medium text-neutral-200 bg-white/5 hover:bg-white/10 border border-white/15 transition-colors whitespace-nowrap"
            >
              {t3('সব নীতিমালা', 'မူဝါဒအားလုံး', 'Legal Center')}
            </a>

            <a
              href="/rental"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-[4px] text-xs font-bold text-black bg-white hover:bg-neutral-200 transition-colors whitespace-nowrap"
            >
              <span>{t3('রেন্টাল', 'ငှားရမ်းရန်', 'Rent')}</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Title & Context */}
        <header className="space-y-4 pb-8 border-b border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            <span>DEV SPARK SOFT LIMITED · OFFICIAL RENTAL COMPLIANCE DOCUMENT</span>
            <span>LAST UPDATED: 2026</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight font-display">
            {t3(
              'Starlink Rental Kit – Full Restriction & Usage Policy',
              'Starlink ငှားရမ်းခြင်း – အပြည့်အစုံ ကန့်သတ်ချက်နှင့် အသုံးပြုမှု မူဝါဒ',
              'Starlink Rental Kit – Full Restriction & Usage Policy'
            )}
          </h1>

          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
            {t3(
              `Starlink Rental Kit (${formatBdtBn(rentalKitPrice)} এককালীন চার্জ — কিটের মালিকানা হস্তান্তর হয় না, মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য; Bangla QR-এ প্রদেয়, COD নেই) অর্ডারের পূর্বে ৫ টিবি লিমিট, প্রথম নিবন্ধিত লোকেশনের বাইরে ব্যবহারে Restricted নীতি, ১ বার অ্যাড্রেস পরিবর্তন এবং কেবল Residential ও Lite প্যাকেজের শর্তসমূহ পড়ে নিন।`,
              `Starlink Rental Kit (${formatBdt(rentalKitPrice)} တစ်ကြိမ်သာ ပေးဆောင်ရမည် — ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ၊ လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်) မှာယူမီ 5 TB ကန့်သတ်ချက်၊ ပထမမှတ်ပုံတင်လိပ်စာပြင်ပသုံးလျှင် Restricted ဖြစ်ခြင်းနှင့် Residential/Lite မူဝါဒများကို ဖတ်ရှုပါ။`,
              `Review Starlink Rental Kit rules: ${formatBdt(rentalKitPrice)} One-Time Charge (hardware ownership does not transfer; paid via Bangla QR only, no COD), monthly Starlink subscription fees are separate (Residential & Lite only, no Roaming/other plans), max 5 TB/mo, restricted outside first registered location, and 1-time address change only.`
            )}
          </p>
        </header>

        {/* Part 1: Full Restriction & Usage Policy (1–6) */}
        <section className="space-y-6">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Part 01 · Restriction &amp; Compliance Rules
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t3(
                'ব্যবহারের সীমাবদ্ধতা, শিপিং ও লোকেশন নীতিমালা (১–৬)',
                'အသုံးပြုမှု ကန့်သတ်ချက်နှင့် မူဝါဒများ (၁–၆)',
                'Usage Restrictions, Shipping & Location Policy (1–6)'
              )}
            </h2>
          </div>

          <div className="bg-[#0a0a0a] border border-white/15 rounded-md divide-y divide-white/10">
            {RENTAL_RESTRICTIONS_POLICY.map((section) => {
              const IconComp = section.icon;
              return (
                <div key={section.num} className="p-6 sm:p-8 space-y-3">
                  <div className="flex items-center gap-3">
                    <IconComp className="w-5 h-5 text-white shrink-0" />
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {language === 'en' ? section.titleEn : section.titleBn}
                    </h3>
                  </div>

                  {'bodyBn' in section && section.bodyBn && (
                    <p className="text-sm text-neutral-300 leading-relaxed pl-8">
                      {language === 'en' ? section.bodyEn : section.bodyBn}
                    </p>
                  )}

                  {'listBn' in section && section.listBn && (
                    <ul className="space-y-2 text-sm text-neutral-300 leading-relaxed pl-8">
                      {(language === 'en' ? section.listEn! : section.listBn).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}

            {/* 6. Checkout Warning */}
            <div className="p-6 sm:p-8 bg-[#111113] space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-amber-300">
                  6. Checkout Warning (গুরুত্বপূর্ণ সতর্কতা)
                </h3>
              </div>
              <p className="text-sm text-neutral-200 leading-relaxed pl-8">
                {language === 'en'
                  ? `Starlink Rental Kits (Standard 4X & Starlink Mini) require a ${formatBdt(rentalKitPrice)} One-Time Charge paid via Bangla QR (COD is unavailable). Hardware ownership is not transferred, and monthly Starlink subscription fees are separate. Strict limits: 5 TB/month max, only works at the first registered location (outside use triggers Restricted status), no Roaming or other packages, and address change allowed once (1x) only.`
                  : `গুরুত্বপূর্ণ সতর্কতা: Starlink Rental Kit-এর এককালীন চার্জ ${formatBdtBn(rentalKitPrice)} টাকা (শুধুমাত্র Bangla QR-এ প্রদেয়; COD প্রযোজ্য নয়)। কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য। শর্ত: মাসে ৫ টিবি-এর বেশি ব্যবহার করা যাবে না, প্রথম নিবন্ধিত লোকেশনের বাইরে ব্যবহার করলে সার্ভিস Restricted হবে, রোমিংসহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না (কেবল Residential ও Lite), এবং অ্যাড্রেস সর্বোচ্চ ১ বার পরিবর্তন করা যাবে।`}
              </p>
            </div>
          </div>
        </section>

        {/* Part 2: Full Rental Terms and Conditions (A–F) */}
        <section className="space-y-6 pt-4">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
              Part 02 · Standard Rental Terms &amp; Conditions
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t3(
                'পূর্ণাঙ্গ রেন্টাল শর্তাবলি (Sections A–F)',
                'အပြည့်အစုံ ငှားရမ်းခြင်း စည်းကမ်းချက်များ (A–F)',
                'Full Rental Terms and Conditions (Sections A–F)'
              )}
            </h2>
          </div>

          <div className="bg-[#0a0a0a] border border-white/15 rounded-md divide-y divide-white/10">
            {RENTAL_TERMS_SECTIONS.map((sec) => (
              <div key={sec.code} className="p-6 sm:p-8 space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {language === 'en' ? sec.titleEn : sec.titleBn}
                </h3>
                <ul className="space-y-2 text-sm text-neutral-300 leading-relaxed">
                  {(language === 'en' ? sec.itemsEn : sec.itemsBn).map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <RentalFaqSection id="policy-rental-faq" showSearch={false} />

        {/* Bottom Actions */}
        <div className="p-6 sm:p-8 rounded-md bg-[#0a0a0a] border border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              {t3(
                `Starlink Rental Kit (${formatBdtBn(rentalKitPrice)} এককালীন চার্জ) অর্ডার করতে প্রস্তুত?`,
                `Starlink Rental Kit (${formatBdt(rentalKitPrice)} တစ်ကြိမ်သာ) မှာယူရန် အဆင်သင့်ဖြစ်ပြီလား?`,
                `Ready to Order a Starlink Rental Kit (${formatBdt(rentalKitPrice)} One-Time Charge)?`
              )}
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400">
              {t3(
                `Starlink Rental Kit — ${formatBdtBn(rentalKitPrice)} এককালীন চার্জ (Bangla QR, COD নেই) · মালিকানা হস্তান্তর হয় না · মাসিক সাবস্ক্রিপশন ফি আলাদা · 5 TB লিমিট · ১ বার অ্যাড্রেস পরিবর্তন।`,
                `Starlink Rental Kit — ${formatBdt(rentalKitPrice)} (Bangla QR) · ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ · လစဉ် Subscription သီးခြား · 5 TB ကန့်သတ်။`,
                `Starlink Rental Kit — ${formatBdt(rentalKitPrice)} One-Time Charge (Bangla QR Only, no COD) · Ownership not transferred · Monthly subscription separate · 5 TB limit · 1-time address change.`
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/rental"
              className="px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
            >
              <span>{t3('রেন্টাল চেকআউট ও প্রাপ্যতা যাচাই', 'ရရှိနိုင်မှု စစ်ဆေးရန်', 'Check Availability & Rent')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/kits"
              className="px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-white/10 border border-white/30 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t3('কেনার কিটসমূহ দেখুন', 'ဝယ်ယူရန် ကြည့်ရှုမည်', 'Browse Purchase Kits')}</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RentalPolicyPage;
