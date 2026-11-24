import React, { useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import {
  LEGAL_POLICY_MAP,
  LegalPolicyDocument,
  resolveLegalPolicyBySlug,
} from '../data/legalPolicies';
import { OFFICIAL_HEADER_LOGO_URL } from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';
import { renderLegalPolicyIcon } from './LegalCenter';

interface LegalPolicyDetailPageProps {
  slug: string;
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const LegalPolicyDetailPage: React.FC<LegalPolicyDetailPageProps> = ({
  slug,
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t3 } = useGeoLanguage();
  const policy = resolveLegalPolicyBySlug(slug);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (policy) {
      const localizedTitle = t3(policy.titleBn, policy.titleMy, policy.titleEn);
      const localizedDesc = `${t3(policy.shortDescBn, policy.shortDescMy, policy.shortDescEn)} ${t3(policy.introBn, policy.introMy, policy.introEn)}`.slice(0, 220);
      document.title = `${localizedTitle} | DevSparkSoft — Legal & Policies`;
      const descEl = document.querySelector('meta[name="description"]');
      if (descEl) {
        descEl.setAttribute('content', localizedDesc);
      }
    } else {
      document.title = t3(
        'নীতিমালা পাওয়া যায়নি | DevSparkSoft — লিগ্যাল ও নীতিমালা',
        'မူဝါဒ မတွေ့ပါ | DevSparkSoft — ဥပဒေနှင့် မူဝါဒ',
        'Policy Not Found | DevSparkSoft — Legal & Policies'
      );
    }
  }, [policy, language, t3]);

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
  const getIntro = (p: LegalPolicyDocument) =>
    language === 'my' ? p.introMy : language === 'bn' ? p.introBn : p.introEn;
  const getEffectiveDate = (p: LegalPolicyDocument) =>
    language === 'my'
      ? p.effectiveDateMy
      : language === 'bn'
      ? p.effectiveDateBn
      : p.effectiveDateEn;
  const getLastUpdated = (p: LegalPolicyDocument) =>
    language === 'my'
      ? p.lastUpdatedMy
      : language === 'bn'
      ? p.lastUpdatedBn
      : p.lastUpdatedEn;
  const getConditions = (p: LegalPolicyDocument) =>
    language === 'my'
      ? p.conditionsMy
      : language === 'bn'
      ? p.conditionsBn
      : p.conditionsEn;

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
            <a
              href="/Legal"
              onClick={(e) => navigateTo(e, '/Legal')}
              className="hidden md:inline-block text-[11px] font-mono uppercase tracking-widest text-neutral-400 hover:text-white border-l border-white/15 pl-3 truncate transition-colors"
            >
              {t3('লিগ্যাল ও নীতিমালা', 'ဥပဒေနှင့် မူဝါဒများ', 'Legal & Policies')}
            </a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <a
              href="/cart"
              onClick={(e) => navigateTo(e, '/cart')}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-[4px] border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              {t3('কার্ট', 'ခြင်းတောင်း', 'Cart')}
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!policy ? (
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-8 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-neutral-400 mx-auto" />
            <h1 className="text-xl font-bold text-white">
              {t3('নীতিমালা পাওয়া যায়নি', 'မူဝါဒ မတွေ့ပါ', 'Policy Not Found')}
            </h1>
            <p className="text-sm text-neutral-400">
              {t3(
                'অনুরোধকৃত লিগ্যাল ডকুমেন্টটি পাওয়া যায়নি। অনুগ্রহ করে লিগ্যাল সেন্টার থেকে নির্বাচন করুন।',
                'တောင်းဆိုထားသော စာမျက်နှာ မတွေ့ပါ။ Legal Center မှ ရွေးချယ်ဖတ်ရှုပါ။',
                'The requested legal document could not be found. Please browse the Legal Policy Center.'
              )}
            </p>
            <a
              href="/Legal"
              onClick={(e) => navigateTo(e, '/Legal')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t3('লিগ্যাল সেন্টারে ফিরুন', 'Legal Center သို့ ပြန်သွားရန်', 'Back to Legal Center')}</span>
            </a>
          </div>
        ) : (
          <article className="space-y-8">
            {/* Back Button + Breadcrumb */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href="/Legal"
                onClick={(e) => navigateTo(e, '/Legal')}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>
                  {t3(
                    'লিগ্যাল ও নীতিমালা কেন্দ্রে ফিরুন',
                    'ဥပဒေနှင့် မူဝါဒ စင်တာသို့ ပြန်သွားရန်',
                    'Back to Legal Center'
                  )}
                </span>
              </a>
              <span className="text-[11px] font-mono text-neutral-500">
                {policy.path}
              </span>
            </div>

            {/* Policy Header */}
            <header className="space-y-4 border-b border-white/15 pb-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-11 h-11 rounded-[4px] border border-white/15 bg-white/5 flex items-center justify-center text-white shrink-0 mt-0.5">
                  {renderLegalPolicyIcon(policy.icon, 'w-5 h-5')}
                </div>
                <div className="min-w-0 space-y-2">
                  <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-400">
                    DEV SPARK SOFT LIMITED · OFFICIAL STORE POLICY
                  </p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
                    {getTitle(policy)}
                  </h1>
                </div>
              </div>

              {/* Effective & Last Updated Dates */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-neutral-400">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>
                    {t3('কার্যকর তারিখ:', 'အကျုံးဝင်သည့်နေ့:', 'Effective Date:')}{' '}
                    <strong className="text-neutral-200 font-medium">
                      {getEffectiveDate(policy)}
                    </strong>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                  <span>
                    {t3('সর্বশেষ হালনাগাদ:', 'နောက်ဆုံးပြင်ဆင်ချိန်:', 'Last Updated:')}{' '}
                    <strong className="text-neutral-200 font-medium">
                      {getLastUpdated(policy)}
                    </strong>
                  </span>
                </span>
              </div>

              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed pt-1">
                {getIntro(policy)}
              </p>
            </header>

            {/* Detailed Policy Sections */}
            <div className="space-y-6">
              {policy.sections.map((section, idx) => {
                const heading =
                  language === 'my'
                    ? section.headingMy
                    : language === 'bn'
                    ? section.headingBn
                    : section.headingEn;
                const paragraphs =
                  language === 'my'
                    ? section.paragraphsMy
                    : language === 'bn'
                    ? section.paragraphsBn
                    : section.paragraphsEn;
                const bullets =
                  language === 'my'
                    ? section.bulletsMy
                    : language === 'bn'
                    ? section.bulletsBn
                    : section.bulletsEn;

                return (
                  <section
                    key={idx}
                    className="rounded-[4px] border border-white/12 bg-[#0b0b0e] p-5 sm:p-6 space-y-3"
                  >
                    <h2 className="text-base sm:text-lg font-semibold text-white leading-snug">
                      {heading}
                    </h2>

                    {paragraphs && paragraphs.length > 0 && (
                      <div className="space-y-2.5 text-sm text-neutral-300 leading-relaxed">
                        {paragraphs.map((para, pIdx) => (
                          <p key={pIdx}>{para}</p>
                        ))}
                      </div>
                    )}

                    {bullets && bullets.length > 0 && (
                      <ul className="space-y-2 text-sm text-neutral-300 leading-relaxed list-disc pl-5">
                        {bullets.map((bullet, bIdx) => (
                          <li key={bIdx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Applicable Conditions, Limitations & Exceptions */}
            <section className="rounded-[4px] border border-white/20 bg-[#101015] p-5 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <h2 className="text-base font-semibold">
                  {t3(
                    'প্রযোজ্য শর্তাবলি, সীমাবদ্ধতা ও ব্যতিক্রমসমূহ',
                    'အကျုံးဝင်သော စည်းကမ်းချက်များ၊ ကန့်သတ်ချက်များနှင့် ခြွင်းချက်များ',
                    'Applicable Conditions, Limitations & Exceptions'
                  )}
                </h2>
              </div>
              <ul className="space-y-2 text-sm text-neutral-300 leading-relaxed list-disc pl-5">
                {getConditions(policy).map((cond, cIdx) => (
                  <li key={cIdx}>{cond}</li>
                ))}
              </ul>
              <p className="text-xs text-neutral-400 pt-2 border-t border-white/10 leading-relaxed">
                {t3(
                  'দ্রষ্টব্য: এই নীতিমালা DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK · Trade License: DNCC/037306)-এর নিজস্ব স্টোর নীতিমালা। এটি SpaceX বা Starlink-এর অফিসিয়াল কর্পোরেট রুলস হিসেবে গণ্য নয়।',
                  'မှတ်ချက်: ဤမူဝါဒသည် DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK) ၏ ကိုယ်ပိုင်စတိုးမူဝါဒဖြစ်ပြီး SpaceX သို့မဟုတ် Starlink ၏ တရားဝင်စည်းကမ်းမဟုတ်ပါ။',
                  'Note: These terms represent DEV SPARK SOFT LIMITED (DEVSPARK LINK / DSLINK · Trade License: DNCC/037306) store policies and are not presented as official SpaceX or Starlink corporate rules.'
                )}
              </p>
            </section>

            {/* Related Policies */}
            {policy.relatedSlugs.length > 0 && (
              <section className="space-y-4 pt-2">
                <h2 className="text-base sm:text-lg font-semibold text-white">
                  {t3('সম্পর্কিত অন্যান্য নীতিমালা', 'ဆက်စပ် မူဝါဒများ', 'Related Policies')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {policy.relatedSlugs
                    .map((rSlug) => LEGAL_POLICY_MAP[rSlug])
                    .filter(Boolean)
                    .map((rel) => (
                      <a
                        key={rel.slug}
                        href={rel.path}
                        onClick={(e) => navigateTo(e, rel.path)}
                        className="group min-w-0 flex flex-col justify-between rounded-[4px] border border-white/15 bg-[#0b0b0e] hover:border-white/35 hover:bg-[#111116] p-4 transition-colors"
                      >
                        <div className="space-y-2">
                          <div className="text-neutral-300">
                            {renderLegalPolicyIcon(rel.icon, 'w-4 h-4')}
                          </div>
                          <h3 className="text-sm font-semibold text-white leading-snug">
                            {getTitle(rel)}
                          </h3>
                          <p className="text-xs text-neutral-400 leading-relaxed">
                            {getShortDesc(rel)}
                          </p>
                        </div>
                        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300 group-hover:text-white">
                          <span>{t3('বিস্তারিত পড়ুন', 'အသေးစိတ်ဖတ်ရန်', 'Read policy')}</span>
                          <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        </div>
                      </a>
                    ))}
                </div>
              </section>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <a
                href="/Legal"
                onClick={(e) => navigateTo(e, '/Legal')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] border border-white/20 bg-white/5 hover:bg-white/15 text-xs font-medium text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t3('লিগ্যাল সেন্টারে ফিরুন', 'Legal Center သို့ ပြန်သွားရန်', 'Back to Legal Center')}</span>
              </a>

              <a
                href="/rental"
                onClick={(e) => navigateTo(e, '/rental')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors"
              >
                <span>{t3('রেন্টাল চেকআউটে যান', 'ငှားရမ်းခြင်းသို့ သွားရန်', 'Go to Rental Checkout')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LegalPolicyDetailPage;
