import React, { useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Info,
  Phone,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import {
  OFFICIAL_FAVICON_LOGO_URL,
  OFFICIAL_HEADER_LOGO_URL,
  SupportedDomain,
  resolveDomainFromRequest,
} from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';

interface PriceSyndicateAlertPageProps {
  onBackToMainSite?: () => void;
}

const SYNDICATE_RISKS = [
  {
    code: '০১',
    title: 'স্থায়ী মালিকানা না থাকার ঝুঁকি',
    text: '১. Rental Kit কিনে নেওয়া কিটের মতো গ্রাহকের স্থায়ী মালিকানায় নাও থাকতে পারে।',
  },
  {
    code: '০২',
    title: 'অতিরিক্ত মাসিক Rental Fee (~২,৮০০ টাকা)',
    text: '২. Residential প্ল্যানের বিলের পাশাপাশি মাসিক Rental Fee প্রযোজ্য হতে পারে।',
  },
  {
    code: '০৩',
    title: 'Roam ও বিদেশে ব্যবহারে সীমাবদ্ধতা',
    text: '৩. Rental Kit-এর ক্ষেত্রে Roam প্ল্যানে পরিবর্তন বা বিদেশে ব্যবহারে সীমাবদ্ধতা থাকতে পারে।',
  },
  {
    code: '০৪',
    title: 'অ্যাড্রেস পরিবর্তন ও ট্রান্সফারে বাধা',
    text: '৪. সার্ভিস অ্যাড্রেস পরিবর্তন ও কিট ট্রান্সফারের ক্ষেত্রেও নীতিগত বিধিনিষেধ থাকতে পারে।',
  },
  {
    code: '০৫',
    title: 'অনুমোদিত অঞ্চলের বাইরে সার্ভিস Restricted',
    text: '৫. অনুমোদিত অঞ্চল বা দেশের বাইরে ব্যবহারে Starlink-এর নীতিমালা অনুযায়ী সার্ভিস Restricted হতে পারে।',
  },
];

const COMPARISON_ROWS = [
  {
    criteria: 'মালিকানার ধরন (Ownership)',
    rental: 'স্থায়ী মালিকানা নাও থাকতে পারে',
    purchased: 'গ্রাহকের নিজস্ব সম্পূর্ণ মালিকানাধীন (Full Ownership)',
  },
  {
    criteria: 'মাসিক অতিরিক্ত চার্জ (Monthly Fee)',
    rental: 'Residential প্ল্যানের পাশাপাশি মাসিক ~২,৮০০ টাকা Rental Fee প্রযোজ্য হতে পারে',
    purchased: 'কোনো অতিরিক্ত মাসিক Hardware Rental Fee নেই',
  },
  {
    criteria: 'Roam প্ল্যান ও বিদেশে ব্যবহার',
    rental: 'Roam প্ল্যানে পরিবর্তন বা বিদেশে ব্যবহারে সীমাবদ্ধতা থাকতে পারে',
    purchased: 'নীতিমালা অনুযায়ী Roam ও প্ল্যান পরিবর্তন সুবিধা',
  },
  {
    criteria: 'ঠিকানা পরিবর্তন ও ট্রান্সফার',
    rental: 'সার্ভিস অ্যাড্রেস পরিবর্তন ও কিট ট্রান্সফারের ক্ষেত্রেও নীতিগত বিধিনিষেধ থাকতে পারে',
    purchased: 'যাচাইযোগ্য ইনভয়েস ও Ownership Transfer কমপ্লায়েন্স',
  },
  {
    criteria: 'অঞ্চলভিত্তিক সীমাবদ্ধতা',
    rental: 'অনুমোদিত অঞ্চল বা দেশের বাইরে ব্যবহারে Starlink-এর নীতিমালা অনুযায়ী সার্ভিস Restricted হতে পারে',
    purchased: '৩০ দিনের Restricted রিফান্ড অঙ্গীকার (DEVSPARK LINK)',
  },
];

const FAQ_ITEMS = [
  {
    q: 'বাংলাদেশে কিছু বিক্রেতা অস্বাভাবিক কম দামে Starlink Kit কীভাবে বিক্রি করছে?',
    a: 'অভিযোগ উঠেছে কিছু নামিদামি প্রতিষ্ঠানসহ প্রায় ৭টি কোম্পানি নতুন কেনা কিটের বদলে Rental Kit বিক্রি করছে। কিছু Rental Kit-এর মাসিক ভাড়া প্রায় ২,৮০০ টাকা, যা গোপন করে কম দামে কিট দেওয়ার অভিযোগ রয়েছে।',
  },
  {
    q: 'Rental Kit আর সম্পূর্ণ মালিকানাধীন Purchased Starlink Kit-এর মধ্যে মূল পার্থক্য কী?',
    a: 'Rental Kit-এ স্থায়ী মালিকানা নাও থাকতে পারে, Residential বিলের পাশাপাশি মাসিক Rental Fee প্রযোজ্য হতে পারে এবং Roam পরিবর্তন, ঠিকানা পরিবর্তন বা ট্রান্সফারে সীমাবদ্ধতা থাকতে পারে। পক্ষান্তরে Purchased Kit সম্পূর্ণ মালিকানাধীন।',
  },
  {
    q: 'Starlink Kit কেনার আগে গ্রাহকের কী কী বিষয় যাচাই করা উচিত?',
    a: 'শুধু কম দাম না দেখে কেনার আগে কিটটি Rental নাকি Purchased, কোনো অতিরিক্ত মাসিক Rental চার্জ আছে কি না এবং কিটটি আপনার নামে ট্রান্সফার করা যাবে কি না—তা যাচাই করুন।',
  },
  {
    q: 'এই সতর্কবার্তার তথ্যগুলো কি স্বাধীনভাবে যাচাইকৃত?',
    a: 'সতর্কীকরণ: উল্লিখিত অভিযোগগুলো স্বাধীনভাবে যাচাই করা হয়নি। Rental Fee, প্ল্যান পরিবর্তন ও ঠিকানা পরিবর্তনের নিয়ম দেশ, অফার এবং Starlink-এর বর্তমান নীতিমালা অনুযায়ী ভিন্ন হতে পারে।',
  },
];

export const PriceSyndicateAlertPage: React.FC<PriceSyndicateAlertPageProps> = ({
  onBackToMainSite,
}) => {
  const { t3 } = useGeoLanguage();
  const activeDomain: SupportedDomain =
    typeof window !== 'undefined'
      ? resolveDomainFromRequest(
          window.location.hostname,
          window.location.pathname,
          new URLSearchParams(window.location.search).get('domain')
        )
      : 'dslink.cyou';

  const siteOrigin =
    activeDomain === 'devsparksoft.com.bd'
      ? 'https://devsparksoft.com.bd'
      : 'https://dslink.cyou';

  useEffect(() => {
    window.scrollTo(0, 0);

    const pageDesc =
      'সতর্কতা! বাংলাদেশে প্রায় ৭টি কোম্পানির বিরুদ্ধে নতুন Starlink Kit-এর নামে মাসিক ~২,৮০০ টাকা ভাড়ার Rental Kit বিক্রির অভিযোগ। মালিকানা, Roam সীমাবদ্ধতা, ট্রান্সফার নিষেধাজ্ঞা ও করণীয় জানুন — DSLink (DEV SPARK SOFT LIMITED)।';
    const canonicalUrl = `${siteOrigin}${typeof window !== 'undefined' ? window.location.pathname : '/price-syndicate-alert'}`;

    document
      .querySelectorAll('script[data-page-seo="price-syndicate-alert"]')
      .forEach((n) => n.remove());

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline:
          'BANGLADESH STARLINK PRICE SYNDICATE ALERT — নতুন Starlink Kit-এর নামে Rental Kit বিক্রির অভিযোগ!',
        description: pageDesc,
        image: OFFICIAL_FAVICON_LOGO_URL,
        inLanguage: ['bn-BD', 'en-US'],
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': canonicalUrl,
        },
        author: {
          '@type': 'Organization',
          name: 'DEV SPARK SOFT LIMITED',
          url: 'https://devsparksoft.com.bd',
        },
        publisher: {
          '@type': 'Organization',
          name: 'DSLink — DEV SPARK SOFT LIMITED',
          url: siteOrigin,
          logo: {
            '@type': 'ImageObject',
            url: OFFICIAL_FAVICON_LOGO_URL,
          },
        },
        datePublished: '2026-11-17',
        dateModified: '2026-11-17',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'DEVSPARK LINK (DSLink)',
            item: `${siteOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'BANGLADESH STARLINK PRICE SYNDICATE ALERT',
            item: canonicalUrl,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ];

    schemas.forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-page-seo', 'price-syndicate-alert');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document
        .querySelectorAll('script[data-page-seo="price-syndicate-alert"]')
        .forEach((n) => n.remove());
    };
  }, [siteOrigin]);

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
      {/* Top Corporate Header Bar */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-black/95 backdrop-blur-md safe-top">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" onClick={handleGoHome} className="shrink min-w-0">
              <img
                src={OFFICIAL_HEADER_LOGO_URL}
                alt="DEVSPARK LINK Official Logo"
                width={308}
                height={74}
                className="w-[136px] min-[375px]:w-[154px] sm:w-[178px] md:w-[194px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
              />
            </a>
            <span className="hidden lg:inline-block text-xs font-mono uppercase tracking-widest text-neutral-400 border-l border-white/15 pl-3 truncate">
              Advisory Document · DSL-POL-PSA-02
            </span>
          </div>

          <nav
            aria-label="Policy Navigation"
            className="hidden md:flex items-center gap-4 text-xs font-medium text-neutral-400"
          >
            <a href="/" onClick={handleGoHome} className="hover:text-white transition-colors">
              {t3('হোম', 'ပင်မ', 'Home')}
            </a>
            <a href="/Legal" className="hover:text-white transition-colors">
              {t3('নীতিমালা', 'မူဝါဒများ', 'Legal')}
            </a>
            <a href="/rental" className="hover:text-white transition-colors">
              {t3('রেন্টাল কিট', 'ငှားရမ်းခြင်း', 'Rental Kit')}
            </a>
            <a href="/red-policy-alert" className="hover:text-white transition-colors">
              {t3('রেড পলিসি অ্যালার্ট', 'Red Policy Alert', 'Red Policy Alert')}
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0" />
        </div>
      </header>

      {/* Main Formal Policy Document */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Document Masthead */}
        <header className="space-y-5 pb-8 border-b border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-widest text-amber-300">
            <span>BANGLADESH STARLINK PRICE SYNDICATE ALERT</span>
            <span className="text-neutral-400">Effective Date: 17 November 2026</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight font-display">
              সতর্কতা! নতুন Starlink Kit-এর নামে Rental Kit বিক্রির অভিযোগ!
            </h1>
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-3xl">
              বাংলাদেশে কিছু নামিদামি প্রতিষ্ঠানসহ প্রায় ৭টি কোম্পানির বিরুদ্ধে Rental Kit নতুন কিট হিসেবে বিক্রির অভিযোগ উঠেছে।
            </p>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl">
              যেখানে Starlink Standard Kit-এর দাম প্রায়{' '}
              <span className="font-semibold text-white">৫২,০০০ টাকা</span> এবং Mini Kit-এর দাম প্রায়{' '}
              <span className="font-semibold text-white">২৫,৫০০ টাকা</span>, সেখানে কিছু বিক্রেতা অস্বাভাবিক কম দামে কিট বিক্রি করছে।
            </p>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Publisher
              </dt>
              <dd className="mt-1 font-medium text-neutral-200">
                DSLink — DEV SPARK SOFT LIMITED
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Bangladesh License
              </dt>
              <dd className="mt-1 font-mono text-neutral-200">DNCC/037306</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                USA Registration
              </dt>
              <dd className="mt-1 font-mono text-neutral-200">Alaska Entity #10237739</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Document Reference
              </dt>
              <dd className="mt-1 font-mono text-neutral-200">DSL-POL-PSA-02</dd>
            </div>
          </dl>
        </header>

        {/* Unified Formal Policy Container */}
        <article className="bg-[#0a0a0a] border border-white/15 rounded-md p-6 sm:p-10 divide-y divide-white/10">
          {/* Section 1: আসল রহস্য কী? */}
          <section id="secret" className="pb-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 01 · Rental Fee Disclosure
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">আসল রহস্য কী?</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              <div className="md:col-span-8 space-y-3 text-sm sm:text-base text-neutral-300 leading-relaxed">
                <p>
                  কিছু Rental Kit-এর মাসিক ভাড়া প্রায়{' '}
                  <strong className="font-semibold text-white">২,৮০০ টাকা</strong>। অভিযোগ রয়েছে, বিক্রেতারা এই অতিরিক্ত মাসিক খরচের কথা গোপন করে Rental Kit-কে নতুন কেনা কিট হিসেবে গ্রাহকদের ধরিয়ে দিচ্ছে।
                </p>
              </div>
              <div className="md:col-span-4 p-4 rounded-[4px] bg-[#111113] border border-white/15 space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  অভিযোগকৃত মাসিক ভাড়া
                </div>
                <div className="text-2xl font-mono font-bold text-white tabular-nums">
                  ~৳২,৮০০<span className="text-xs font-normal text-neutral-400">/মাস</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Residential প্ল্যানের বিলের বাইরে অতিরিক্ত Rental Fee
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: সম্ভাব্য ঝুঁকি */}
          <section id="risks" className="py-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 02 · Five Consumer Risks
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">সম্ভাব্য ঝুঁকি:</h2>
            </div>

            <div className="divide-y divide-white/10 border border-white/15 rounded-[4px] overflow-hidden">
              {SYNDICATE_RISKS.map((risk) => (
                <div
                  key={risk.code}
                  className="p-4 sm:p-5 bg-[#111113] flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="sm:w-64 shrink-0 space-y-0.5">
                    <span className="text-[11px] font-mono text-neutral-500">
                      Clause {risk.code}
                    </span>
                    <h3 className="text-sm font-semibold text-white">{risk.title}</h3>
                  </div>
                  <p className="text-sm text-neutral-300 leading-relaxed flex-1">{risk.text}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Rental vs Purchased Matrix */}
          <section id="comparison" className="py-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 03 · Ownership &amp; Compliance Comparison
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Rental Kit বনাম সম্পূর্ণ মালিকানাধীন Purchased Kit
              </h2>
            </div>

            {/* Mobile Stacked Cards (zero horizontal overflow) */}
            <div className="space-y-3 md:hidden">
              {COMPARISON_ROWS.map((row) => (
                <div
                  key={row.criteria}
                  className="rounded-[4px] border border-white/15 bg-[#111113] p-4 space-y-2.5 text-xs"
                >
                  <div className="font-semibold text-white text-sm">{row.criteria}</div>
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono uppercase text-neutral-400">Rental Kit</div>
                    <div className="text-neutral-300 leading-relaxed">{row.rental}</div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <div className="text-[11px] font-mono uppercase text-neutral-400">
                      Purchased Kit (DEVSPARK LINK)
                    </div>
                    <div className="text-white font-medium leading-relaxed">{row.purchased}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-[4px] border border-white/15">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#111113] border-b border-white/15 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4 font-medium">যাচাইয়ের বিষয়</th>
                    <th className="py-3 px-4 font-medium">Rental Kit</th>
                    <th className="py-3 px-4 font-medium">Purchased Kit (DEVSPARK LINK)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {COMPARISON_ROWS.map((row) => (
                    <tr key={row.criteria} className="hover:bg-white/[0.03]">
                      <td className="py-3.5 px-4 font-medium text-white">{row.criteria}</td>
                      <td className="py-3.5 px-4 text-neutral-300">{row.rental}</td>
                      <td className="py-3.5 px-4 text-neutral-200 font-medium">{row.purchased}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 4: গ্রাহকদের প্রতি সতর্কবার্তা ও ডিসক্লেইমার */}
          <section id="warning" className="pt-9 space-y-6 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 04 · Buyer Advisory &amp; Legal Disclaimer
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                গ্রাহকদের প্রতি সতর্কবার্তা
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
              <p className="font-semibold text-white">
                Rental Kit আর সম্পূর্ণ মালিকানাধীন নতুন Starlink Kit এক জিনিস নয়!
              </p>
              <p>
                শুধু কম দাম দেখে কিট কিনবেন না। কেনার আগে কিটটি Rental নাকি Purchased, মাসিক অতিরিক্ত চার্জ আছে কি না এবং ট্রান্সফার করা যাবে কি না—সবকিছু যাচাই করুন।
              </p>
              <p>
                কিছু অসাধু বিক্রেতার কারণে বাংলাদেশের Starlink বাজারে বিভ্রান্তি তৈরি হচ্ছে। গ্রাহকদের কাছে প্রকৃত তথ্য প্রকাশ করা জরুরি।
              </p>
              <p className="font-semibold text-white">
                প্রতারণা থেকে সতর্ক থাকুন। যাচাই করে Starlink Kit কিনুন।
              </p>
            </div>

            {/* Required Verbatim Legal Disclaimer */}
            <div className="p-4 sm:p-5 rounded-[4px] bg-[#111113] border border-white/15 flex items-start gap-3 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">সতর্কীকরণ:</strong> উল্লিখিত অভিযোগগুলো স্বাধীনভাবে যাচাই করা হয়নি। Rental Fee, প্ল্যান পরিবর্তন ও ঠিকানা পরিবর্তনের নিয়ম দেশ, অফার এবং Starlink-এর বর্তমান নীতিমালা অনুযায়ী ভিন্ন হতে পারে।
              </div>
            </div>

            {/* Attribution & Corporate Actions */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Building2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>DSLink — DEV SPARK SOFT LIMITED</span>
                </div>
                <div className="text-xs font-mono text-neutral-400">
                  Website:{' '}
                  <a
                    href="https://devsparksoft.com.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white hover:underline inline-flex items-center gap-1"
                  >
                    https://devsparksoft.com.bd <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/red-policy-alert"
                  className="px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-white/10 border border-white/30 text-white font-medium text-xs transition-colors"
                >
                  RED POLICY ALERT পড়ুন
                </a>
                <a
                  href="/promos"
                  className="px-4 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-colors"
                >
                  ভেরিফায়েড কিট অর্ডার
                </a>
                <a
                  href="https://wa.me/8801326370218?text=Hello%20DSLink%20%E2%80%94%20DEV%20SPARK%20SOFT%20LIMITED%2C%20I%20read%20the%20Bangladesh%20Starlink%20Price%20Syndicate%20Alert%20and%20want%20to%20verify%20before%20buying."
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-white/10 border border-white/30 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp যাচাই: +880 1326-370218</span>
                </a>
              </div>
            </div>
          </section>
        </article>

        {/* Frequently Asked Questions */}
        <section aria-labelledby="syndicate-faq-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <h2 id="syndicate-faq-heading" className="text-lg sm:text-xl font-bold text-white">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              Advisory Reference
            </span>
          </div>

          <div className="bg-[#0a0a0a] border border-white/15 rounded-md divide-y divide-white/10">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="p-5 sm:p-6 space-y-2">
                <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                  {item.q}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PriceSyndicateAlertPage;
