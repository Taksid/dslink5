import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  Building2,
  Package,
  Truck,
  Wallet,
  Globe,
  ShieldAlert,
  ChevronRight,
  ExternalLink,
  LogIn,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { useGeoLanguage } from '../lib/geoLanguage';
import { useCentralPricing, formatBdt } from '../lib/pricingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { buildLocalePath } from '../lib/localeRouting';
import { SHIPPING_COUNTRIES } from '../lib/shippingConfig';

export type ResellPageVariant = 'reseller' | 'authorized_retailer' | 'business_partnership';

export interface ResellPublicHubPageProps {
  variant: ResellPageVariant;
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const ResellPublicHubPage: React.FC<ResellPublicHubPageProps> = ({
  variant,
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t3 } = useGeoLanguage();
  const { standard4xPrice, miniKitPrice } = useCentralPricing();
  const { currency, formatPrice, rates } = useGlobalCurrency();

  const hrefFor = (path: string) => buildLocalePath(path, language);

  const navigateInternal = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else {
      const target = path.startsWith('/reseller') ? path : hrefFor(path);
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo(0, 0);
    }
  };

  // Inline quick application state (also syncs with /reseller/portal)
  const [contactName, setContactName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+880 ');
  const [companyName, setCompanyName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [country, setCountry] = useState('BD');
  const [salesChannels, setSalesChannels] = useState('Retail Store & ISP / B2B');
  const [estimatedMonthlyVolume, setEstimatedMonthlyVolume] = useState('10 - 25 Kits / Month');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  // Retailer-specific fields
  const [businessLocations, setBusinessLocations] = useState('');
  const [productsOfInterest, setProductsOfInterest] = useState(
    'Starlink Standard Kit 4X, Starlink Mini Kit, Accessories'
  );

  // Partnership-specific fields
  const [targetMarkets, setTargetMarkets] = useState('Bangladesh, Myanmar, South & Southeast Asia');
  const [productCategories, setProductCategories] = useState(
    'Bulk Starlink Hardware Kits, Enterprise Accessories, Roaming Distribution'
  );
  const [expectedVolume, setExpectedVolume] = useState('50+ Kits / Quarter');
  const [proposal, setProposal] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApplication, setSubmittedApplication] = useState<any | null>(null);

  const stdResellerCost = Math.round(standard4xPrice * 0.85);
  const miniResellerCost = Math.round(miniKitPrice * 0.85);
  const activeExchangeRate = rates[currency] || 1;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [variant]);

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (
      !contactName.trim() ||
      !businessEmail.trim() ||
      !phone.trim() ||
      !companyName.trim() ||
      !businessAddress.trim()
    ) {
      setSubmitError('Please fill in all required business and contact fields.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reseller/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationType: variant,
          contactName: contactName.trim(),
          businessEmail: businessEmail.trim(),
          password: password.trim() || 'Reseller2026!',
          phone: phone.trim(),
          companyName: companyName.trim(),
          businessAddress: businessAddress.trim(),
          country,
          salesChannels: salesChannels.trim(),
          estimatedMonthlyVolume: estimatedMonthlyVolume.trim(),
          website: website.trim(),
          logoUrl: logoUrl.trim(),
          businessLocations: businessLocations.trim(),
          productsOfInterest: productsOfInterest.trim(),
          targetMarkets: targetMarkets.trim(),
          productCategories: productCategories.trim(),
          expectedVolume: expectedVolume.trim(),
          proposal: proposal.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Could not submit application.');
      }
      if (data.token && typeof window !== 'undefined') {
        window.localStorage.setItem('dslink_reseller_token', data.token);
        window.localStorage.setItem('dslink_reseller_email', businessEmail.trim());
      }
      setSubmittedApplication(data.application);
    } catch (err: any) {
      setSubmitError(err?.message || 'Application submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const pageMeta =
    variant === 'authorized_retailer'
      ? {
          breadcrumbCurrent: t3('অথরাইজড রিটেইলার', 'Authorized Retailer', 'Authorized Retailer'),
          kicker: 'STARLINK AUTHORIZED RETAILER INQUIRY · DEVSPARKSOFT.COM.BD',
          h1: t3(
            'Starlink Authorized Retailer Inquiry — DSLink হার্ডওয়্যার রিটেইল ইনকোয়ারি',
            'Starlink Authorized Retailer Inquiry — DSLink',
            'Starlink Authorized Retailer Inquiry'
          ),
          lead: t3(
            'DSLink-এর মাধ্যমে Starlink হার্ডওয়্যার রিটেইল সুযোগের জন্য আপনার ব্যবসায়িক ইনকোয়ারি জমা দিন (Starlink authorized retailer application)। স্পষ্টভাবে জানানো হচ্ছে যে, DSLink আপনার ইনকোয়ারি গ্রহণ করে এবং অফিশিয়াল Starlink অথরাইজেশন প্রদান করে Starlink। শুধুমাত্র লিখিত অনুমতি থাকলেই অফিশিয়াল ব্যাজ বা অথরাইজেশন দাবি প্রদর্শন করা হয়।',
            'Submit your Starlink authorized retailer application inquiry through DSLink. DSLink receives the inquiry while Starlink grants official Starlink authorization. Official badges or authorization claims are displayed only when DSLink has documented permission.',
            'Inquire about Starlink hardware retail opportunities through DSLink (Starlink authorized retailer application). DSLink receives the inquiry and coordinates retail supply evaluations, while Starlink grants official Starlink authorization. Official badges or authorization claims are displayed only when DSLink has documented permission.'
          ),
          primaryButtonLabel: 'Submit a Retailer Inquiry',
          portalTypeParam: 'authorized_retailer',
        }
      : variant === 'business_partnership'
      ? {
          breadcrumbCurrent: t3('বিজনেস পার্টনারশিপ', 'Business Partnership', 'Business Partnership'),
          kicker: 'STARLINK BUSINESS PARTNERSHIP IN BANGLADESH & WORLDWIDE · DEVSPARKSOFT.COM.BD',
          h1: t3(
            'Starlink Business Partnership in Bangladesh — বাল্ক অর্ডার ও ডিস্ট্রিবিউশন',
            'Starlink Business Partnership in Bangladesh & International Markets',
            'Starlink Business Partnership in Bangladesh'
          ),
          lead: t3(
            'বাল্ক Starlink হার্ডওয়্যার অর্ডার, আঞ্চলিক ডিস্ট্রিবিউশন এবং শিপিং পার্টনারশিপের জন্য DSLink-এর সাথে যুক্ত হোন (Starlink business partnership)। বাংলাদেশ, মিয়ানমার, দক্ষিণ ও দক্ষিণ-পূর্ব এশিয়া, মধ্যপ্রাচ্য, ইউরোপ, যুক্তরাষ্ট্রসহ আন্তর্জাতিক বাজারে DSLink পার্টনারশিপ ইনকোয়ারি গ্রহণ করে।',
            'Explore Starlink business partnership opportunities with DSLink for bulk hardware orders, distribution, and international shipping partnerships across Bangladesh, Myanmar, South & Southeast Asia, the Middle East, Europe, and the USA.',
            'Partner with DSLink for bulk Starlink hardware orders, regional distribution, and shipping partnerships (Starlink business partnership). DSLink accepts partnership inquiries across Bangladesh and international markets including Myanmar, South & Southeast Asia, the Middle East, Africa, Europe, and the United States.'
          ),
          primaryButtonLabel: 'Submit a Partnership Inquiry',
          portalTypeParam: 'business_partnership',
        }
      : {
          breadcrumbCurrent: t3('রিসেলার আবেদন', 'Reseller Application', 'Reseller Application'),
          kicker: 'STARLINK RESELLER APPLICATION IN BANGLADESH · 15% HARDWARE DISCOUNT',
          h1: t3(
            'Starlink Reseller Application in Bangladesh — ১৫% ডিসকাউন্ট ও ব্র্যান্ডেড শিপিং',
            'Starlink Reseller Application in Bangladesh — 15% Hardware Discount',
            'Starlink Reseller Application in Bangladesh'
          ),
          lead: t3(
            'DSLink-এ Starlink রিসেলার হিসেবে আবেদন করুন (apply for Starlink reseller)। অনুমোদিত রিসেলাররা সকল Starlink কিট ও অ্যাক্সেসরিজে ১৫% ডিসকাউন্ট (পাবলিক মূল্যের ৮৫%), ফিক্সড সাবস্ক্রিপশন ফি, কাস্টম বিক্রয়মূল্য নির্ধারণ, রিসেলার-ব্র্যান্ডেড শিপিং লেবেল এবং ডেলিভারি ও পেমেন্ট নিশ্চিত হওয়ার পর bKash, Nagad, Rocket ও NPSB ব্যাংকে প্রফিট উইথড্র সুবিধা পান।',
            'Apply for Starlink reseller status with DSLink in Bangladesh. Approved resellers receive a 15% discount on Starlink kits and accessories (85% of public price), fixed subscription fees, custom selling prices, reseller-branded shipping, and withdrawals after confirmed delivery and payment.',
            'Apply for Starlink reseller status with DSLink in Bangladesh. Approved resellers receive a 15% discount on Starlink kits and accessories (paying 85% of the current DSLink public price), fixed subscription fees, custom customer selling prices, reseller-branded direct shipping, and fast withdrawals via bKash, Nagad, Rocket, and NPSB after confirmed delivery and payment.'
          ),
          primaryButtonLabel: 'Apply as a DSLink Reseller',
          portalTypeParam: 'reseller',
        };

  return (
    <div className="min-h-[100dvh] bg-white text-slate-900 font-sans flex flex-col">
      {/* Black Header */}
      <SiteHeader
        sectionLabel="Reseller & Partnership Hub"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Visible Breadcrumbs matching BreadcrumbList Structured Data */}
        <nav
          aria-label="Breadcrumb"
          data-testid="resell-breadcrumbs"
          className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium"
        >
          <a
            href={hrefFor('/')}
            onClick={(e) => navigateInternal(e, '/')}
            className="hover:text-slate-900 underline-offset-4 hover:underline"
          >
            {t3('হোম', 'Home', 'Home')}
          </a>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <a
            href={hrefFor('/resell')}
            onClick={(e) => navigateInternal(e, '/resell')}
            className={
              variant === 'reseller'
                ? 'text-slate-900 font-semibold'
                : 'hover:text-slate-900 underline-offset-4 hover:underline'
            }
          >
            {t3('রিসেল ও পার্টনার হাব (/resell)', 'Resell', 'Resell')}
          </a>
          {variant !== 'reseller' && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-900 font-semibold">{pageMeta.breadcrumbCurrent}</span>
            </>
          )}
        </nav>

        {/* Cross-Navigation Tabs between the 3 Public Application Pages + Reseller Portal Login */}
        <div
          data-testid="resell-cross-links"
          className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={hrefFor('/resell')}
              onClick={(e) => navigateInternal(e, '/resell')}
              data-testid="tab-link-resell"
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                variant === 'reseller'
                  ? 'bg-emerald-600 text-white shadow-[0_6px_16px_-4px_rgba(22,163,74,0.4)]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              1. DSLink Reseller Application (15% Off)
            </a>
            <a
              href={hrefFor('/resell/authorized-retailer')}
              onClick={(e) => navigateInternal(e, '/resell/authorized-retailer')}
              data-testid="tab-link-authorized-retailer"
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                variant === 'authorized_retailer'
                  ? 'bg-emerald-600 text-white shadow-[0_6px_16px_-4px_rgba(22,163,74,0.4)]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              2. Authorized Retailer Inquiry
            </a>
            <a
              href={hrefFor('/resell/business-partnership')}
              onClick={(e) => navigateInternal(e, '/resell/business-partnership')}
              data-testid="tab-link-business-partnership"
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                variant === 'business_partnership'
                  ? 'bg-emerald-600 text-white shadow-[0_6px_16px_-4px_rgba(22,163,74,0.4)]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3. Business Partnership Inquiry
            </a>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`/reseller/portal?type=${pageMeta.portalTypeParam}`}
              onClick={(e) => navigateInternal(e, `/reseller/portal?type=${pageMeta.portalTypeParam}`)}
              data-testid="open-reseller-portal-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-2xs whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reseller Portal &amp; Sign In (retailer.devsparksoft.com.bd)</span>
            </a>
          </div>
        </div>

        {/* Hero Card with Subtle 3D Layered Depth */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-10 shadow-[0_18px_40px_-15px_rgba(15,23,42,0.08)] space-y-6">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-semibold">
              {pageMeta.kicker}
            </div>
            <h1
              data-testid="resell-page-h1"
              className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight"
            >
              {pageMeta.h1}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{pageMeta.lead}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={`/reseller/portal?type=${pageMeta.portalTypeParam}`}
              onClick={(e) => navigateInternal(e, `/reseller/portal?type=${pageMeta.portalTypeParam}`)}
              data-testid="primary-resell-cta-button"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-[0_10px_24px_-6px_rgba(22,163,74,0.45)] transition-all cursor-pointer"
            >
              <span>{pageMeta.primaryButtonLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#inline-application-form"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
            >
              <span>{t3('নিচের ফরমে দ্রুত আবেদন করুন', 'Apply Directly Below', 'Fill Application Form Below')}</span>
            </a>
          </div>
        </section>

        {/* Variant-Specific Value Architecture & Transparency Rules */}
        {variant === 'reseller' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_-10px_rgba(15,23,42,0.06)] space-y-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">15% Hardware Discount</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Approved resellers pay <strong>85%</strong> of the current DSLink public price on all Starlink kits and accessories. Subscription plans are charged at their fixed plan fee.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_-10px_rgba(15,23,42,0.06)] space-y-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Custom Selling Prices</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Save your default customer selling price per product in your dashboard and override it on any individual customer order.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_-10px_rgba(15,23,42,0.06)] space-y-2">
                <Truck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Reseller-Branded Shipping</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  DSLink prints your company logo, business name, address, and phone on the shipping label &amp; packing slip and ships directly to your customer. Reseller cost and profit are never shown to customers.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_10px_25px_-10px_rgba(15,23,42,0.06)] space-y-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Verified Profit Withdrawals</h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Hardware profit is released to your available balance once both delivery and payment are confirmed. Withdraw anytime via bKash, Nagad, Rocket, or NPSB Bank Transfer.
                </p>
              </div>
            </div>

            {/* Pricing & Profit Formula Table (Including Canonical BDT 100 -> 85 -> 500 -> 415 Example) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.07)] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Reseller Pricing, Fixed Plan Fees &amp; Hardware Profit Schedule
                  </h2>
                  <p className="text-xs text-slate-500">
                    All accounting is maintained in BDT. Display currency: <strong>{currency}</strong>{' '}
                    (Exchange Rate: 1 BDT = {activeExchangeRate.toFixed(4)} {currency}).
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 font-semibold">
                  Formula: Profit = (Customer Selling Price − 85% Reseller Cost) × Qty
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-3 pr-4">Catalog Item</th>
                      <th className="py-3 px-4 text-right">DSLink Public Price</th>
                      <th className="py-3 px-4 text-right">Reseller Cost (85%)</th>
                      <th className="py-3 px-4 text-right">Example Customer Selling Price</th>
                      <th className="py-3 pl-4 text-right">Reseller Hardware Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono tabular-nums text-slate-800">
                    <tr>
                      <td className="py-3 pr-4 font-sans font-semibold text-slate-900">
                        Starlink Standard Kit 4X (Gen 3)
                      </td>
                      <td className="py-3 px-4 text-right">{formatBdt(standard4xPrice)} BDT</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                        {formatBdt(stdResellerCost)} BDT
                      </td>
                      <td className="py-3 px-4 text-right">{formatBdt(standard4xPrice)} BDT</td>
                      <td className="py-3 pl-4 text-right text-emerald-700 font-bold">
                        +{formatBdt(standard4xPrice - stdResellerCost)} BDT
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-sans font-semibold text-slate-900">
                        Starlink Mini Kit (Portable)
                      </td>
                      <td className="py-3 px-4 text-right">{formatBdt(miniKitPrice)} BDT</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">
                        {formatBdt(miniResellerCost)} BDT
                      </td>
                      <td className="py-3 px-4 text-right">{formatBdt(miniKitPrice)} BDT</td>
                      <td className="py-3 pl-4 text-right text-emerald-700 font-bold">
                        +{formatBdt(miniKitPrice - miniResellerCost)} BDT
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/60">
                      <td className="py-3 pr-4 font-sans font-semibold text-slate-900">
                        Reference Example Kit / Pipe Adapter (BDT 100 Listed)
                      </td>
                      <td className="py-3 px-4 text-right">৳100 BDT</td>
                      <td className="py-3 px-4 text-right text-emerald-700 font-bold">৳85 BDT</td>
                      <td className="py-3 px-4 text-right">৳500 BDT</td>
                      <td className="py-3 pl-4 text-right text-emerald-700 font-bold">+৳415 BDT</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {variant === 'authorized_retailer' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.07)] space-y-5">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs leading-relaxed">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-sm mb-0.5">
                  Official Authorization Disclosure (Starlink vs. DSLink)
                </strong>
                DSLink receives your Starlink Authorized Retailer inquiry and evaluates physical showroom, inventory, and regional distribution readiness. <strong>Starlink grants official Starlink authorization.</strong> Official Starlink badges or authorization claims are displayed only when DSLink has documented permission.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">1. Showroom &amp; Retail Locations</h3>
                <p className="text-slate-600">
                  Submit your physical retail store addresses, trade license details, and regional coverage across Bangladesh or international markets.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">2. Hardware Supply &amp; Compliance</h3>
                <p className="text-slate-600">
                  Inquire about stocking Starlink Standard Kit 4X, Starlink Mini Kit, and official accessories with verifiable serial tracking and 24-month warranty support.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">3. Portal Status Tracking</h3>
                <p className="text-slate-600">
                  Track your inquiry reference number in the portal through <strong>Pending</strong>, <strong>Under Review</strong>, and <strong>Responded</strong> stages.
                </p>
              </div>
            </div>
          </section>
        )}

        {variant === 'business_partnership' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_12px_28px_-12px_rgba(15,23,42,0.07)] space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs uppercase font-mono">
              <Globe className="w-4 h-4" />
              <span>BULK HARDWARE · REGIONAL DISTRIBUTION · INTERNATIONAL SHIPPING PARTNERSHIPS</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Bulk Starlink Hardware Orders &amp; Cross-Border Logistics Partnerships
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              DSLink (operated by Dev Spark Soft Limited · Trade License DNCC/037306 · USA Alaska Entity #10237739) collaborates with ISPs, telecom integrators, NGOs, maritime operators, and logistics carriers for high-volume Starlink kit procurement, regional distribution, and shipping partnerships.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Bulk Hardware Procurement</h3>
                <p className="text-slate-600">
                  Structured volume allocations for Starlink Standard Kit 4X, Starlink Mini Kit, High Performance terminals, and enterprise mounts.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">International Markets Accepted</h3>
                <p className="text-slate-600">
                  We accept partnership inquiries for <strong>Bangladesh, Myanmar, the United States, India, Nepal, Bhutan, Malaysia, Singapore, UAE, Saudi Arabia, UK, EU, and global DHL/FedEx markets</strong>.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                <h3 className="font-bold text-slate-900 text-sm">Distribution &amp; Carrier Integration</h3>
                <p className="text-slate-600">
                  Partner with DSLink on last-mile COD fulfillment in Bangladesh (Steadfast / Pathao) or international express air-freight corridors (DHL / FedEx).
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Online Application & Registration Form (Prefilled with current variant) */}
        <section
          id="inline-application-form"
          className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-[0_18px_40px_-15px_rgba(15,23,42,0.08)] space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                ONLINE APPLICATION &amp; PORTAL REGISTRATION · RETAILER.DEVSPARKSOFT.COM.BD
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                {pageMeta.primaryButtonLabel}
              </h2>
            </div>
            <a
              href={`/reseller/portal?type=${pageMeta.portalTypeParam}`}
              onClick={(e) => navigateInternal(e, `/reseller/portal?type=${pageMeta.portalTypeParam}`)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-4 inline-flex items-center gap-1"
            >
              <span>Already applied? Sign in to Reseller Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {submittedApplication ? (
            <div
              data-testid="application-confirmation-box"
              className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 p-6 space-y-4"
            >
              <div className="flex items-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <h3 className="text-lg font-bold">
                  Application Submitted — Reference #{submittedApplication.referenceNumber}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Your application has been registered in the DSLink Reseller &amp; Partnership Portal. Current review status:{' '}
                <strong className="font-mono text-emerald-800">{submittedApplication.status}</strong>.
                (Zero automatic emails are sent; you can track your status and access your dashboard anytime in the portal.)
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-white border border-emerald-200 p-4 text-xs font-mono">
                <div>
                  <dt className="text-slate-500">Reference Number</dt>
                  <dd className="text-slate-900 font-bold text-sm">
                    {submittedApplication.referenceNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Application Type</dt>
                  <dd className="text-slate-900 font-semibold">{submittedApplication.applicationType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Status</dt>
                  <dd className="text-amber-700 font-bold">{submittedApplication.status}</dd>
                </div>
              </dl>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/reseller/portal"
                  onClick={(e) => navigateInternal(e, '/reseller/portal')}
                  data-testid="go-to-reseller-dashboard-btn"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                >
                  Open Reseller Portal &amp; Dashboard →
                </a>
                <button
                  type="button"
                  onClick={() => setSubmittedApplication(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-semibold text-xs cursor-pointer"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitApplication} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Business Email *</label>
                  <input
                    type="email"
                    required
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Portal Password (for Sign-In) *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create portal password"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone Number (with Country Code) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+880 17XXXXXXXX"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company / ISP / Store Name"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Country *</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 bg-white outline-none"
                  >
                    {SHIPPING_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Full Business Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessAddress}
                    onChange={(e) => setBusinessAddress(e.target.value)}
                    placeholder="House/Floor, Road, Area, City, Postal Code"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimated Monthly Order Volume *
                  </label>
                  <input
                    type="text"
                    required
                    value={estimatedMonthlyVolume}
                    onChange={(e) => setEstimatedMonthlyVolume(e.target.value)}
                    placeholder="e.g. 10 - 25 Kits / Month"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Channels *</label>
                  <input
                    type="text"
                    required
                    value={salesChannels}
                    onChange={(e) => setSalesChannels(e.target.value)}
                    placeholder="Retail Showroom, B2B ISP, E-Commerce"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Website (Optional)
                  </label>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourcompany.com"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Company Logo URL (Optional — for Branded Labels)
                  </label>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://yourcompany.com/logo.png"
                    className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                  />
                </div>
              </div>

              {/* Retailer-Specific Fields */}
              {variant === 'authorized_retailer' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Business Locations / Showrooms *
                    </label>
                    <input
                      type="text"
                      required
                      value={businessLocations}
                      onChange={(e) => setBusinessLocations(e.target.value)}
                      placeholder="e.g. Dhaka (Gulshan, Multiplan), Chattogram (Agrabad)"
                      className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Products of Interest *
                    </label>
                    <input
                      type="text"
                      required
                      value={productsOfInterest}
                      onChange={(e) => setProductsOfInterest(e.target.value)}
                      placeholder="Starlink Standard Kit 4X, Starlink Mini Kit, Mounts"
                      className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Business Partnership-Specific Fields */}
              {variant === 'business_partnership' && (
                <div className="space-y-4 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Target Markets *
                      </label>
                      <input
                        type="text"
                        required
                        value={targetMarkets}
                        onChange={(e) => setTargetMarkets(e.target.value)}
                        placeholder="Bangladesh, Myanmar, South Asia, Global"
                        className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Product Categories *
                      </label>
                      <input
                        type="text"
                        required
                        value={productCategories}
                        onChange={(e) => setProductCategories(e.target.value)}
                        placeholder="Bulk Kits, Enterprise Distribution, Logistics"
                        className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Expected Volume *
                      </label>
                      <input
                        type="text"
                        required
                        value={expectedVolume}
                        onChange={(e) => setExpectedVolume(e.target.value)}
                        placeholder="e.g. 100+ Kits / Quarter"
                        className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Short Partnership Proposal *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={proposal}
                      onChange={(e) => setProposal(e.target.value)}
                      placeholder="Describe your distribution network, bulk hardware requirements, or shipping partnership proposal..."
                      className="w-full rounded-xl border border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-slate-900 outline-none resize-none"
                    />
                  </div>
                </div>
              )}

              {submitError && (
                <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <p className="text-[11px] text-slate-500">
                  Submitting registers your account and provides an instant reference number on screen. Zero unsolicited notifications are sent.
                </p>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-resell-application-btn"
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-[0_8px_20px_-6px_rgba(22,163,74,0.45)] cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : pageMeta.primaryButtonLabel}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>

      {/* Black Footer */}
      <Footer />
    </div>
  );
};

export default ResellPublicHubPage;
