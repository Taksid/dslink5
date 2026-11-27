import React, { useEffect } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  ExternalLink,
  FileText,
  Globe,
  Headphones,
  Info,
  Phone,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Footer } from '../components/Footer';
import {
  OFFICIAL_FAVICON_LOGO_URL,
  OFFICIAL_HEADER_LOGO_URL,
  SupportedDomain,
  resolveDomainFromRequest,
} from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';

interface RedPolicyAlertPageProps {
  onBackToMainSite?: () => void;
}

const PRICE_COMPARISON_ROWS = [
  {
    stage: '০১ · প্রাথমিক আমদানি',
    marketPrice: '৫২,০০০ টাকা',
    ourPrice: '৪৮,০০০ টাকা',
    difference: '৪,০০০ টাকা কম',
    note: 'প্রাথমিক আমদানি ও ভেরিফায়েড সোর্সিং',
  },
  {
    stage: '০২ · সরাসরি সাপ্লাই',
    marketPrice: '৪২,০০০ টাকা',
    ourPrice: '৩৫,০০০ টাকা',
    difference: '৭,০০০ টাকা কম',
    note: 'সরাসরি সাপ্লাই চেইন অপ্টিমাইজেশন',
  },
  {
    stage: '০৩ · Starlink Mini পোর্টেবল কিট',
    marketPrice: '২৫,৫০০ টাকা',
    ourPrice: '২১,৫০০ টাকা',
    difference: '৪,০০০ টাকা কম',
    note: 'বিক্রয়-পরবর্তী নিরাপত্তা ও ২৪ মাসের সাপোর্টসহ',
  },
  {
    stage: '০৪ · বর্তমান স্ট্যান্ডার্ড ৪X অফিশিয়াল মূল্য',
    marketPrice: '৫২,০০০ টাকা (সাধারণ বাজারমূল্য)',
    ourPrice: '৪১,৫০০ টাকা (অফিশিয়াল মূল্য)',
    difference: 'পূর্ণ সুরক্ষা ও ইনভয়েস',
    note: 'Restricted / লকড বা Replacement ঝুঁকিমুক্ত সরবরাহ',
  },
];

const PROTECTION_PILLARS = [
  {
    code: '৪.১',
    title: 'Official Sales Invoice',
    subtitle: 'অফিশিয়াল সেলস ইনভয়েস',
    description:
      'প্রতিটি অর্ডারের সাথে DEVSPARK LINK BY DEV SPARK SOFT LIMITED-এর অফিশিয়াল ও যাচাইযোগ্য সেলস ইনভয়েস প্রদান করা হয়।',
    icon: FileText,
  },
  {
    code: '৪.২',
    title: '30-Day Refund Commitment',
    subtitle: '৩০ দিনের ফুল রিফান্ড অঙ্গীকার',
    description:
      'কেনার ৩০ দিনের মধ্যে Kit-এ কোনো Restricted বা পূর্বে ব্যবহৃত প্রমাণ পাওয়া গেলে (আমাদের বিক্রয় শর্তের সাথে সাংঘর্ষিক হলে) ফুল রিফান্ড।',
    icon: RefreshCw,
  },
  {
    code: '৪.৩',
    title: '24-Month Replacement Support',
    subtitle: '২৪ মাসের রিপ্লেসমেন্ট সাপোর্ট',
    description:
      'লিখিত শর্তাবলি অনুযায়ী আমাদের পক্ষ থেকে ২৪ মাসের হার্ডওয়্যার রিপ্লেসমেন্ট সাপোর্ট ও অগ্রাধিকারভিত্তিক সমাধান।',
    icon: ShieldCheck,
  },
  {
    code: '৪.৪',
    title: 'Transparent Kit Information',
    subtitle: 'কিটের স্বচ্ছ ও সঠিক তথ্য',
    description:
      'Kit-এর প্রকৃত অবস্থা, উৎস, সিরিয়াল স্ট্যাটাস ও সক্রিয়করণের নীতিমালা কেনার আগেই সম্পূর্ণ স্বচ্ছতার সাথে জানানো হয়।',
    icon: BadgeCheck,
  },
  {
    code: '৪.৫',
    title: 'After-Sales Support',
    subtitle: 'ডেডিকেটেড বিক্রয়-পরবর্তী সেবা',
    description:
      'সেটআপ, অ্যাকাউন্ট পরিচালনা ও নিয়মিত টেকনিক্যাল সাপোর্টের জন্য আমাদের ঢাকার হেল্পডেস্ক ও ইঞ্জিনিয়ারিং টিম সর্বদা পাশে থাকে।',
    icon: Headphones,
  },
];

const FAQ_ITEMS = [
  {
    q: 'অন্যান্য বিক্রেতা ১৭,০০০–২০,০০০ টাকায় সন্দেহজনক Starlink বিক্রি করলে DEVSPARK LINK-এর ভেরিফায়েড Standard 4X ৪১,৫০০ ও Mini ২১,৫০০ টাকা কেন?',
    a: 'কারণ DEVSPARK LINK শুধু কম দামে Kit বিক্রি নয়, প্রতিটি গ্রাহককে Official Sales Invoice, 30-Day Restricted Kit Refund Commitment, 24-Month Replacement Support এবং পূর্ণ বিক্রয়-পরবর্তী টেকনিক্যাল নিরাপত্তা নিশ্চিত করে।',
  },
  {
    q: 'কম দামের Starlink Kit-এ Restricted বা Account Ban-এর ঝুঁকি কেন থাকে?',
    a: 'কিছু বিক্রেতা বিদেশ থেকে আনা পূর্বে ব্যবহৃত, অ্যাকাউন্টে লক করা, Replacement Order বা Ownership Transfer সমস্যাযুক্ত Kit কম দামে বিক্রি করেন। এসব Kit শুরুতে চালু দেখালেও পরবর্তীতে Account Ban বা সার্ভিস বন্ধ হয়ে যাওয়ার উচ্চ ঝুঁকি থাকে।',
  },
  {
    q: 'DEVSPARK LINK-এর ওয়ারেন্টি ও রিফান্ড সাপোর্ট কি Starlink-এর অফিসিয়াল ওয়ারেন্টি?',
    a: 'না, স্পষ্টভাবে জানানো যাচ্ছে যে Official Sales Invoice, 30-Day Refund Commitment ও 24-Month Replacement Support হলো DEVSPARK LINK (DEV SPARK SOFT LIMITED)-এর নিজস্ব বিক্রয়-পরবর্তী সেবা, Starlink-এর অফিসিয়াল ওয়ারেন্টি নয়।',
  },
  {
    q: 'DEVSPARK LINK এবং DEV SPARK SOFT LIMITED-এর অফিশিয়াল রেজিস্ট্রেশন নম্বর কী?',
    a: 'বাংলাদেশ ট্রেড লাইসেন্স: DNCC/037306 এবং USA রেজিস্ট্রেশন: Alaska Entity #10237739। অফিশিয়াল ওয়েবসাইট: devsparksoft.com.bd ও dslink.cyou।',
  },
];

export const RedPolicyAlertPage: React.FC<RedPolicyAlertPageProps> = ({
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
      'বাংলাদেশে ১৭,০০০–২০,০০০ টাকার Restricted Starlink Kit ও Account Ban থেকে সাবধান! কেন DEVSPARK LINK (DNCC/037306, USA Alaska Entity #10237739) Standard 4X (৳৪১,৫০০) ও Mini (৳২১,৫০০) কিটে ৩০ দিনের রিফান্ড অঙ্গীকার, ২৪ মাসের রিপ্লেসমেন্ট সাপোর্ট ও অফিশিয়াল ইনভয়েস দেয় — বিস্তারিত জানুন।';
    const canonicalUrl = `${siteOrigin}${typeof window !== 'undefined' ? window.location.pathname : '/red-policy-alert'}`;

    document
      .querySelectorAll('script[data-page-seo="red-policy-alert"]')
      .forEach((n) => n.remove());

    const schemas = [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: 'RED POLICY ALERT: Starlink কেনার আগে সতর্ক হোন!',
        alternativeHeadline:
          'Consumer Alert Against Restricted Starlink Kits & Account Ban Risks in Bangladesh — DEVSPARK LINK',
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
          name: 'DEVSPARK LINK BY DEV SPARK SOFT LIMITED',
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
            name: 'DEVSPARK LINK (DSLINK)',
            item: `${siteOrigin}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'RED POLICY ALERT — Starlink কেনার আগে সতর্ক হোন!',
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
      script.setAttribute('data-page-seo', 'red-policy-alert');
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document
        .querySelectorAll('script[data-page-seo="red-policy-alert"]')
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
              Policy Document · DSL-POL-RPA-01
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
            <a href="/price-syndicate-alert" className="hover:text-white transition-colors">
              {t3('সিন্ডিকেট অ্যালার্ট', 'စျေးနှုန်းသတိပေးချက်', 'Syndicate Alert')}
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 shrink-0" />
        </div>
      </header>

      {/* Main Formal Policy Document */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Document Masthead */}
        <header className="space-y-5 pb-8 border-b border-white/15">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-widest text-red-400">
            <span>RED POLICY ALERT · CONSUMER PROTECTION BULLETIN</span>
            <span className="text-neutral-400">Effective Date: 17 November 2026</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight font-display">
              Starlink কেনার আগে সতর্ক হোন!
            </h1>
            <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-3xl">
              বাংলাদেশে অনেক প্রতিষ্ঠান সন্দেহজনক উৎস থেকে Starlink Kit বিক্রি করছে মাত্র{' '}
              <span className="font-semibold text-white">১৭,০০০–২০,০০০ টাকায়</span>। তাহলে আমাদের ভেরিফায়েড Standard 4X{' '}
              <span className="font-semibold text-white">৪১,৫০০ টাকা</span> ও Mini{' '}
              <span className="font-semibold text-white">২১,৫০০ টাকা</span> কেন?
            </p>
            <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
              আমরা বিষয়টি পরিষ্কার করতে চাই।
            </p>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10 text-xs">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">
                Issuing Entity
              </dt>
              <dd className="mt-1 font-medium text-neutral-200">DEV SPARK SOFT LIMITED</dd>
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
              <dd className="mt-1 font-mono text-neutral-200">DSL-POL-RPA-01</dd>
            </div>
          </dl>
        </header>

        {/* Unified Formal Policy Container */}
        <article className="bg-[#0a0a0a] border border-white/15 rounded-md p-6 sm:p-10 divide-y divide-white/10">
          {/* Section 1 */}
          <section id="section-pricing" className="pb-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 01 · Pricing Transparency
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ১. শুরু থেকেই আমরা প্রতিযোগিতামূলক দামে বিক্রি করছি
              </h2>
            </div>

            {/* Mobile Stacked Cards */}
            <div className="space-y-3 md:hidden">
              {PRICE_COMPARISON_ROWS.map((row) => (
                <div
                  key={row.stage}
                  className="rounded-[4px] border border-white/15 bg-[#111113] p-4 space-y-2 text-xs"
                >
                  <div className="font-semibold text-white text-sm">{row.stage}</div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <div className="text-[11px] text-neutral-400">বাজারমূল্য</div>
                      <div className="text-neutral-200 tabular-nums">{row.marketPrice}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-neutral-400">DEVSPARK LINK</div>
                      <div className="text-white font-semibold tabular-nums">{row.ourPrice}</div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/10 text-neutral-300 leading-relaxed">
                    {row.difference}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-[4px] border border-white/15">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-[#111113] border-b border-white/15 text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    <th className="py-3 px-4 font-medium">পর্যায়</th>
                    <th className="py-3 px-4 font-medium">বাজারমূল্য</th>
                    <th className="py-3 px-4 font-medium">DEVSPARK LINK মূল্য</th>
                    <th className="py-3 px-4 font-medium">পার্থক্য / সুরক্ষা</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {PRICE_COMPARISON_ROWS.map((row) => (
                    <tr key={row.stage} className="hover:bg-white/[0.03]">
                      <td className="py-3.5 px-4 text-neutral-300 font-medium">{row.stage}</td>
                      <td className="py-3.5 px-4 text-neutral-300 tabular-nums">{row.marketPrice}</td>
                      <td className="py-3.5 px-4 text-white font-semibold tabular-nums">
                        {row.ourPrice}
                      </td>
                      <td className="py-3.5 px-4 text-neutral-300">{row.difference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 text-sm sm:text-base text-neutral-300 list-disc pl-5 leading-relaxed">
              <li>বাজারমূল্য ৫২,০০০ টাকা — আমাদের ৪৮,০০০ টাকা।</li>
              <li>বাজারমূল্য ৪২,০০০ টাকা — আমাদের ৩৫,০০০ টাকা।</li>
              <li>Starlink Mini বাজারমূল্য ২৫,৫০০ টাকা — আমাদের ২১,৫০০ টাকা।</li>
              <li>
                Starlink Standard 4X বাজারমূল্য ৫২,০০০ টাকা — আমাদের ৪১,৫০০ টাকা (২৪ মাসের সাপোর্ট ও ইনভয়েসসহ)।
              </li>
            </ul>

            <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
              কারণ আমরা শুধু কম দামে Kit বিক্রি নয়, বিক্রয়-পরবর্তী সেবা ও গ্রাহকের নিরাপত্তাকেও গুরুত্ব দিই।
            </p>
          </section>

          {/* Section 2 */}
          <section id="section-restricted" className="py-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 02 · Hardware Risk &amp; Account Integrity
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ২. Restricted Kit ও Account Ban সম্পর্কে সতর্কতা
              </h2>
            </div>

            <div className="space-y-4 text-sm sm:text-base text-neutral-300 leading-relaxed max-w-3xl">
              <p>
                বিদেশ থেকে আনা সব Starlink Kit একই অবস্থায় থাকে না। কিছু Kit পূর্বে ব্যবহৃত, অ্যাকাউন্টে লক করা অথবা আঞ্চলিক বিধিনিষেধের আওতায় থাকতে পারে।
              </p>
              <p>
                আমাদের কাছে অভিযোগ এসেছে, কিছু বিক্রেতা এ ধরনের Kit কম দামে বিক্রি করছেন।
              </p>
              <p className="font-medium text-white">
                কিছু ক্ষেত্রে Replacement Order, পুরোনো/ব্যবহৃত বা Ownership Transfer সংক্রান্ত সমস্যার কারণে পরবর্তীতে:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-[4px] bg-[#111113] border border-white/15 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Risk 01
                </div>
                <div className="text-sm font-semibold text-white">অ্যাকাউন্ট Ban হতে পারে</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Restricted বা সন্দেহজনক সিরিয়াল শনাক্ত হলে সংশ্লিষ্ট অ্যাকাউন্ট স্থগিত হতে পারে।
                </p>
              </div>
              <div className="p-4 rounded-[4px] bg-[#111113] border border-white/15 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Risk 02
                </div>
                <div className="text-sm font-semibold text-white">সার্ভিস বন্ধ হয়ে যেতে পারে</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  অন্যের অ্যাকাউন্টে লক বা রিপ্লেসমেন্ট অর্ডার হলে হঠাৎ সংযোগ বিচ্ছিন্ন হয়ে যেতে পারে।
                </p>
              </div>
              <div className="p-4 rounded-[4px] bg-[#111113] border border-white/15 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  Risk 03
                </div>
                <div className="text-sm font-semibold text-white">দীর্ঘমেয়াদি ঝুঁকি</div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  বাটনের মতো Active দেখালেও দীর্ঘমেয়াদি ঝুঁকি থেকে যায়।
                </p>
              </div>
            </div>

            <div className="p-4 rounded-[4px] bg-[#111113] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm sm:text-base font-semibold text-white">
                শুধু চালু হওয়া মানেই ঝুঁকিমুক্ত নয়।
              </p>
              <a
                href="/price-syndicate-alert"
                className="text-xs font-semibold text-white hover:underline shrink-0"
              >
                Rental Kit সতর্কতা (Price Syndicate Alert) পড়ুন →
              </a>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-usa-bd" className="py-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 03 · Jurisdiction &amp; Regional Policy
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ৩. USA Policy vs Bangladesh Policy
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-5 rounded-[4px] bg-[#111113] border border-white/15 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Origin Country Rules</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  কম দামে বিক্রি হওয়া অনেক Kit USA-সহ বিভিন্ন দেশ থেকে আমদানিকৃত, যেখানে স্থানীয় বা উৎস দেশের আলাদা নিয়ম-নীতি প্রযোজ্য থাকে।
                </p>
              </div>

              <div className="p-5 rounded-[4px] bg-[#111113] border border-white/15 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Bangladesh Operational Rules</span>
                </div>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  কিন্তু বাংলাদেশে ব্যবহার ও সেবার ক্ষেত্রে স্থানীয় নীতিমালা, অ্যাকাউন্ট কমপ্লায়েন্স এবং অনুমোদিত ব্যবহারের শর্ত প্রযোজ্য।
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base font-medium text-neutral-200 leading-relaxed">
              তাই কেনার আগে Kit-এর উৎস ও Policy যাচাই করা জরুরি।
            </p>
          </section>

          {/* Section 4 */}
          <section id="section-devspark-link" className="py-9 space-y-5 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 04 · Buyer Protection &amp; Service Standards
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ৪. কেন DEVSPARK LINK থেকে কিনবেন?
              </h2>
              <p className="text-sm text-neutral-300">
                আমরা শুধু পণ্য বিক্রি করি না, গ্রাহকের নিরাপত্তার দায়িত্বও নিই:
              </p>
            </div>

            <div className="divide-y divide-white/10 border border-white/15 rounded-[4px] overflow-hidden">
              {PROTECTION_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <div
                    key={pillar.code}
                    className="p-4 sm:p-5 bg-[#111113] flex flex-col sm:flex-row sm:items-start gap-4"
                  >
                    <div className="flex items-center gap-3 sm:w-64 shrink-0">
                      <span className="text-xs font-mono text-neutral-400">{pillar.code}</span>
                      <Icon className="w-4 h-4 text-neutral-300 shrink-0" />
                      <div>
                        <h3 className="text-sm font-semibold text-white">{pillar.title}</h3>
                        <div className="text-xs text-neutral-400">{pillar.subtitle}</div>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed flex-1">
                      {pillar.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-[4px] bg-[#111113] border border-white/15 flex items-start gap-3 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">স্বচ্ছ ঘোষণা:</strong> এগুলো আমাদের নিজস্ব বিক্রয়-পরবর্তী সেবা, Starlink-এর অফিসিয়াল ওয়ারেন্টি নয়।
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-registration" className="pt-9 space-y-6 scroll-mt-24">
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
                Section 05 · Corporate Verification
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                ৫. আমাদের প্রতিষ্ঠান ও রেজিস্ট্রেশন
              </h2>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-[4px] bg-[#111113] border border-white/15">
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  ব্র্যান্ড ও প্রতিষ্ঠান
                </dt>
                <dd className="mt-1 text-sm font-semibold text-white">
                  DEVSPARK LINK BY DEV SPARK SOFT LIMITED
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  বাংলাদেশ ট্রেড লাইসেন্স
                </dt>
                <dd className="mt-1 text-sm font-mono font-semibold text-white">
                  DNCC/037306
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  USA রেজিস্ট্রেশন
                </dt>
                <dd className="mt-1 text-sm font-mono font-semibold text-white">
                  Alaska Entity #10237739
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                  অফিশিয়াল ওয়েবসাইট
                </dt>
                <dd className="mt-1">
                  <a
                    href="https://devsparksoft.com.bd"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-mono text-white hover:underline inline-flex items-center gap-1"
                  >
                    devsparksoft.com.bd <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-neutral-400">
                <Building2 className="w-4 h-4 text-neutral-400" />
                <span>DEVSPARK LINK — DEV SPARK SOFT LIMITED</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="/kits"
                  className="px-4 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-colors"
                >
                  ভেরিফায়েড কিট অর্ডার (Standard ৳৪১,৫০০ / Mini ৳২১,৫০০)
                </a>
                <a
                  href="https://wa.me/8801326370218?text=Hello%20DEVSPARK%20LINK%2C%20I%20read%20the%20RED%20POLICY%20ALERT%20and%20want%20to%20verify%20before%20buying."
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-[4px] bg-transparent hover:bg-white/10 border border-white/30 text-white font-medium text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp ভেরিফিকেশন: +880 1326-370218</span>
                </a>
              </div>
            </div>
          </section>
        </article>

        {/* Frequently Asked Questions */}
        <section aria-labelledby="policy-faq-heading" className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/15 pb-3">
            <h2 id="policy-faq-heading" className="text-lg sm:text-xl font-bold text-white">
              সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
              Policy Reference
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

export default RedPolicyAlertPage;
