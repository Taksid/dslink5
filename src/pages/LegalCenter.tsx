import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Database,
  FileCheck,
  Lock,
  MapPin,
  QrCode,
  RotateCcw,
  Scale,
  ShieldAlert,
  Truck,
  XCircle,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import {
  LegalPolicySearchBar,
  highlightPolicyText,
  matchesLegalPolicyQuery,
} from '../components/LegalPolicySearchBar';
import {
  LEGAL_POLICIES,
  LegalIconKey,
  LegalPolicyDocument,
} from '../data/legalPolicies';
import { OFFICIAL_HEADER_LOGO_URL } from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';

interface LegalCenterPageProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export function renderLegalPolicyIcon(icon: LegalIconKey, className = 'w-5 h-5') {
  switch (icon) {
    case 'file-check':
      return <FileCheck className={className} />;
    case 'truck':
      return <Truck className={className} />;
    case 'qr-code':
      return <QrCode className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'map-pin':
      return <MapPin className={className} />;
    case 'database':
      return <Database className={className} />;
    case 'shield-alert':
      return <ShieldAlert className={className} />;
    case 'rotate-ccw':
      return <RotateCcw className={className} />;
    case 'x-circle':
      return <XCircle className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'scale':
    default:
      return <Scale className={className} />;
  }
}

export const LegalCenterPage: React.FC<LegalCenterPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t3 } = useGeoLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = t3(
      'DevSparkSoft — লিগ্যাল ও নীতিমালা কেন্দ্র (Legal & Policies)',
      'DevSparkSoft — ဥပဒေနှင့် မူဝါဒ စင်တာ (Legal & Policies)',
      'DevSparkSoft — Legal & Policies'
    );
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) {
      descEl.setAttribute(
        'content',
        t3(
          'DevSparkSoft লিগ্যাল ও নীতিমালা কেন্দ্র: স্টারলিংক রেন্টাল কিট, শিপিং, Bangla QR পেমেন্ট, মাসিক সাবস্ক্রিপশন, নিবন্ধিত লোকেশন, ৫ টিবি ফেয়ার ইউসেজ, সার্ভিস বিধিনিষেধ, রিটার্ন, প্রাইভেসি ও শর্তাবলি।',
          'DevSparkSoft ဥပဒေနှင့် မူဝါဒ စင်တာ — Starlink ငှားရမ်းစက်၊ ပို့ဆောင်ရေး၊ Bangla QR ငွေပေးချေမှု၊ လစဉ်ကြေး၊ မှတ်ပုံတင်လိပ်စာ၊ 5 TB Fair Usage၊ ကန့်သတ်ချက်များနှင့် ကိုယ်ရေးလုံခြုံမှု မူဝါဒများ။',
          'DevSparkSoft Legal & Policy Center — Starlink Rental Kit Policy, Shipping, Bangla QR Payment, Monthly Subscription, Registered Location, Fair Usage, Restrictions, Return, Cancellation, Privacy & Terms.'
        )
      );
    }
  }, [language, t3]);

  const navigateTo = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (path === '/' && onBackToMainSite) {
      onBackToMainSite();
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const getTitle = (p: LegalPolicyDocument) =>
    language === 'my' ? p.titleMy : language === 'bn' ? p.titleBn : p.titleEn;

  const getShortDesc = (p: LegalPolicyDocument) =>
    language === 'my' ? p.shortDescMy : language === 'bn' ? p.shortDescBn : p.shortDescEn;

  const filteredPolicies = useMemo(() => {
    return LEGAL_POLICIES.filter((policy) => matchesLegalPolicyQuery(policy, searchQuery));
  }, [searchQuery]);

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans selection:bg-white selection:text-black flex flex-col">
      {/* Sticky Safe-Area Header */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-black/95 backdrop-blur-md safe-top">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-6 min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a
              href="/"
              onClick={(e) => navigateTo(e, '/')}
              className="flex items-center shrink min-w-0"
            >
              <img
                src={OFFICIAL_HEADER_LOGO_URL}
                alt="DEVSPARK LINK — DEV SPARK SOFT LIMITED"
                width={308}
                height={74}
                className="w-[136px] min-[375px]:w-[154px] sm:w-[178px] md:w-[194px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
              />
            </a>
            <span className="hidden md:inline-block text-[11px] font-mono uppercase tracking-widest text-neutral-400 border-l border-white/15 pl-3 truncate">
              {t3('লিগ্যাল ও নীতিমালা কেন্দ্র', 'ဥပဒေနှင့် မူဝါဒ စင်တာ', 'Legal & Policy Center')}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="/cart"
              onClick={(e) => navigateTo(e, '/cart')}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-[4px] border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              {t3('কার্ট', 'ခြင်းတောင်း', 'Cart')}
            </a>

            <a
              href="/rental"
              onClick={(e) => navigateTo(e, '/rental')}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-[4px] border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              {t3('রেন্টাল চেকআউট', 'ငှားရမ်းခြင်း', 'Rental Checkout')}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Hero / Masthead */}
        <section className="space-y-4 border-b border-white/10 pb-8">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
            DEV SPARK SOFT LIMITED · DEVSPARK LINK · DNCC/037306
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
            {t3(
              'DevSparkSoft — লিগ্যাল ও নীতিমালা কেন্দ্র',
              'DevSparkSoft — ဥပဒေနှင့် မူဝါဒ စင်တာ',
              'DevSparkSoft — Legal & Policies'
            )}
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed">
            {t3(
              'স্টারলিংক রেন্টাল কিট, শিপিং, Bangla QR পেমেন্ট, মাসিক সাবস্ক্রিপশন, নিবন্ধিত লোকেশন, ৫ টিবি ফেয়ার ইউসেজ, সার্ভিস বিধিনিষেধ, রিটার্ন ও প্রাইভেসি সংক্রান্ত সকল বিস্তারিত নীতিমালা এক জায়গায়।',
              'Starlink ငှားရမ်းစက်၊ ပို့ဆောင်ရေး၊ Bangla QR ငွေပေးချေမှု၊ လစဉ်ကြေး၊ မှတ်ပုံတင်လိပ်စာ၊ 5 TB Fair Usage၊ ကန့်သတ်ချက်များနှင့် ကိုယ်ရေးလုံခြုံမှု မူဝါဒအားလုံးကို တစ်နေရာတည်းတွင် ဖတ်ရှုနိုင်ပါသည်။',
              'Browse all DevSparkSoft store policies covering Starlink Rental Kits, shipping, Bangla QR payment, monthly billing, registered locations, 5 TB fair usage, service restrictions, returns, cancellation, privacy, and terms.'
            )}
          </p>

          {/* Live Policy Filter Search Bar */}
          <LegalPolicySearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            totalCount={LEGAL_POLICIES.length}
            resultCount={filteredPolicies.length}
            controlsId="legal-policy-grid"
            inputRef={searchInputRef}
          />
        </section>

        {/* Policy Cards Grid — non-matching cards are hidden live */}
        <section id="legal-policy-grid" aria-label="Legal policy directory">
          {filteredPolicies.length === 0 ? (
            <div className="rounded-[4px] border border-white/15 bg-[#0d0d10] p-8 text-center space-y-3">
              <p className="text-sm text-neutral-300">
                {t3(
                  `“${searchQuery.trim()}” অনুসন্ধানের সাথে মিলে যাওয়া কোনো নীতিমালা পাওয়া যায়নি।`,
                  `“${searchQuery.trim()}” နှင့် ကိုက်ညီသော မူဝါဒ မတွေ့ပါ။`,
                  `No policies matched “${searchQuery.trim()}”.`
                )}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center px-4 py-2 rounded-[4px] bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                {t3('সব নীতিমালা দেখুন', 'မူဝါဒအားလုံး ကြည့်ရန်', 'Show All Policies')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredPolicies.map((policy) => (
                <a
                  key={policy.slug}
                  href={policy.path}
                  onClick={(e) => navigateTo(e, policy.path)}
                  className="group min-w-0 flex flex-col justify-between rounded-[4px] border border-white/15 bg-[#0b0b0e] hover:bg-[#111116] hover:border-white/35 p-5 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-[4px] border border-white/15 bg-white/5 flex items-center justify-center text-white shrink-0">
                        {renderLegalPolicyIcon(policy.icon, 'w-5 h-5')}
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 truncate">
                        {policy.path}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-white leading-snug group-hover:text-white">
                      {highlightPolicyText(getTitle(policy), searchQuery)}
                    </h2>

                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      {highlightPolicyText(getShortDesc(policy), searchQuery)}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-medium text-white">
                    <span>
                      {t3('বিস্তারিত পড়ুন', 'အသေးစိတ်ဖတ်ရန်', 'Read Details')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Independent Policy Notice */}
        <section className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <h2 className="text-sm font-semibold text-white">
              {t3(
                'স্বতন্ত্র স্টোর নীতিমালা ঘোষণা',
                'သီးခြား စတိုးမူဝါဒ အသိပေးချက်',
                'Independent Store Policy Disclosure'
              )}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              {t3(
                'এই পেজের সকল নীতিমালা DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK · devsparksoft.com.bd)-এর নিজস্ব বাণিজ্যিক ও সার্ভিস শর্তাবলি। এগুলো স্পেসএক্স বা স্টারলিংকের অফিসিয়াল কর্পোরেট রুলবুক হিসেবে উপস্থাপিত নয়।',
                'ဤမူဝါဒများသည် DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) ၏ ကိုယ်ပိုင်စီးပွားရေးနှင့် ဝန်ဆောင်မှု စည်းကမ်းများသာ ဖြစ်ပြီး SpaceX သို့မဟုတ် Starlink ၏ တရားဝင်မူဝါဒအဖြစ် ဖော်ပြခြင်းမဟုတ်ပါ။',
                'All policies published in this Legal Center govern orders and services provided by DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK). They are DevSparkSoft store policies and are not presented as official SpaceX or Starlink corporate rules.'
              )}
            </p>
          </div>
          <a
            href="/rental"
            onClick={(e) => navigateTo(e, '/rental')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors shrink-0 whitespace-nowrap"
          >
            <span>{t3('রেন্টাল চেকআউটে ফিরুন', 'ငှားရမ်းခြင်းသို့ ပြန်သွားရန်', 'Back to Rental Checkout')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LegalCenterPage;
