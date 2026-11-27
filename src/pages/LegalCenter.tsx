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
import { SiteHeader } from '../components/SiteHeader';
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
  }, []);

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
    <div className="min-h-[100dvh] bg-[#04070c] text-slate-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel={t3('লিগ্যাল ও নীতিমালা কেন্দ্র', 'ဥပဒေနှင့် မူဝါဒ စင်တာ', 'Legal & Policy Center')}
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main
        id="main-content"
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8"
      >
        {/* Hero / Masthead */}
        <section className="space-y-4 border-b border-slate-800 pb-8">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
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
                  className="group min-w-0 flex flex-col justify-between rounded-xl border border-slate-700/70 bg-[#0b0f17] hover:bg-slate-900 hover:border-cyan-400/60 p-5 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center text-cyan-300 shrink-0">
                        {renderLegalPolicyIcon(policy.icon, 'w-5 h-5')}
                      </div>
                      <span className="text-xs font-mono text-slate-300 truncate">
                        {policy.path}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-white leading-snug group-hover:text-cyan-200 break-words">
                      {highlightPolicyText(getTitle(policy), searchQuery)}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {highlightPolicyText(getShortDesc(policy), searchQuery)}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs sm:text-sm font-medium text-cyan-300">
                    <span>
                      {t3('বিস্তারিত পড়ুন', 'အသေးစိတ်ဖတ်ရန်', 'Read Details')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-cyan-300 group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Independent Policy Notice */}
        <section className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <h2 className="text-sm sm:text-base font-semibold text-white">
              {t3(
                'স্বতন্ত্র স্টোর নীতিমালা ঘোষণা',
                'သီးခြား စတိုးမူဝါဒ အသိပေးချက်',
                'Independent Store Policy Disclosure'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
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
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-400 text-[#04131a] hover:bg-cyan-300 text-xs sm:text-sm font-bold transition-colors shrink-0 whitespace-nowrap"
          >
            <span>{t3('রেন্টাল চেকআউটে ফিরুন', 'ငှားရမ်းခြင်းသို့ ပြန်သွားရန်', 'Back to Rental Checkout')}</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LegalCenterPage;
