import React, { useState } from 'react';
import {
  ArrowRight,
  Globe,
  Headphones,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wifi,
} from 'lucide-react';
import {
  CORE_FEATURED_VARIANT_IDS,
  useCentralPricing,
  formatBdt,
} from '../lib/pricingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { useGeoLanguage } from '../lib/geoLanguage';
import { addItemToCart } from '../lib/cartStore';
import {
  MARKETING_MEDIA,
  MarketingImageKey,
  getLocalizedMediaText,
} from '../lib/marketingMedia';
import { ResponsiveMarketingImage } from './ResponsiveMarketingImage';
import { AboutCompanySection } from './AboutCompanySection';
import { buildLocalePath } from '../lib/localeRouting';

const FIELD_GALLERY_ITEMS: Array<{
  key: MarketingImageKey;
  href: string;
}> = [
  { key: 'rural-bangladesh-family', href: '/rental' },
  { key: 'sundarbans-remote-deployment', href: '/worldwide-delivery' },
  { key: 'maritime-ocean-roaming', href: '/roaming-packages' },
  { key: 'coastal-community-support', href: '/warranty' },
];

export const GlobalHomeHighlights: React.FC = () => {
  const { pricing } = useCentralPricing();
  const { currency, formatPrice } = useGlobalCurrency();
  const { language, t, t3 } = useGeoLanguage();
  const [addedId, setAddedId] = useState<string | null>(null);
  const hrefFor = (path: string) => buildLocalePath(path, language);

  const featuredOffers = CORE_FEATURED_VARIANT_IDS.map((id) => pricing.products[id]).filter(
    Boolean
  );

  const handleQuickAdd = (
    productId: string,
    name: string,
    category: 'purchase' | 'rental' | 'accessory',
    image?: string
  ) => {
    addItemToCart({ productId, name, category, image, quantity: 1 });
    setAddedId(productId);
    setTimeout(() => setAddedId((prev) => (prev === productId ? null : prev)), 1800);
  };

  return (
    <section
      aria-label="Global Starlink Delivery, Warranty & Roaming Highlights"
      className="bg-[#04070c] border-t border-slate-800 py-14 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* 1. Centralized Pricing + Live Currency Quick-Add Matrix (All 5 Core Variants) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-1.5 min-w-0">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
                SERVER-VALIDATED CATALOG · BASE BDT ({currency})
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t3(
                  'Starlink Purchase ও Standard 4X Rental — সরাসরি কার্টে যোগ করুন',
                  'Starlink ဝယ်ယူရန်နှင့် ငှားရမ်းရန် Kit များ',
                  'Starlink Kits in Bangladesh — Purchase & Standard 4X Rental Offers'
                )}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <a
                href={hrefFor('/kits')}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold text-white transition-colors"
              >
                <span>All Kits &amp; Accessories</span>
                <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              </a>
              <a
                href={hrefFor('/cart')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-cyan-400/45 bg-cyan-400/10 hover:bg-cyan-400/20 text-xs sm:text-sm font-semibold text-cyan-100 transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>{t('nav.cart', 'View Cart & Checkout')}</span>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredOffers.map((item) => {
              const isRental = item.category === 'rental';
              const isBdRes = item.variantType === 'bd_residential';
              const detailHref = item.detailUrl || `/kits/${item.id}`;
              const cardCopy =
                language === 'bn'
                  ? item.cardSummaryBn || item.descriptionBn
                  : item.cardSummary || item.description;

              return (
                <article
                  key={item.id}
                  className="rounded-xl border border-slate-700/70 bg-[#0b0f17] overflow-hidden flex flex-col h-full transition-colors hover:border-cyan-400/50"
                >
                  <a
                    href={hrefFor(detailHref)}
                    className="block relative aspect-square w-full bg-white border-b border-slate-800 overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.imageAlt || item.name}
                      width={1024}
                      height={1024}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </a>

                  <div className="p-5 flex-1 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isRental
                            ? 'border-amber-400/45 bg-amber-950/40 text-amber-200'
                            : isBdRes
                            ? 'border-emerald-400/45 bg-emerald-950/40 text-emerald-200'
                            : 'border-cyan-400/45 bg-cyan-950/40 text-cyan-200'
                        }`}
                      >
                        {item.variantLabel || item.category}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        {item.codEligible ? 'BD COD Eligible' : 'No COD · Prepaid'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                      <a
                        href={hrefFor(detailHref)}
                        className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors"
                      >
                        {item.name}
                      </a>
                    </h3>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-2xl font-bold font-mono tabular-nums text-white">
                          {formatBdt(item.price)}
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          {isRental ? 'BDT one-time fee' : 'BDT'}
                        </span>
                        {item.referencePrice && item.referencePrice > item.price && (
                          <span className="text-xs font-mono text-slate-300">
                            <span className="line-through tabular-nums">
                              {formatBdt(item.referencePrice)}
                            </span>{' '}
                            <span className="text-slate-300">(ref.)</span>
                          </span>
                        )}
                      </div>
                      {currency !== 'BDT' && (
                        <div className="text-xs font-mono tabular-nums text-cyan-200">
                          ≈ {formatPrice(item.price)} ({currency})
                        </div>
                      )}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                      {cardCopy}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col min-[380px]:flex-row items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuickAdd(item.id, item.name, item.category, item.image)
                        }
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] text-xs sm:text-sm font-bold transition-colors cursor-pointer text-center"
                      >
                        <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>
                          {addedId === item.id
                            ? t3('কার্টে যোগ হয়েছে', 'ထည့်ပြီးပါပြီ', 'Added to Cart')
                            : t3('কার্টে যোগ করুন', 'ခြင်းတောင်းထဲထည့်ရန်', 'Add to Cart')}
                        </span>
                      </button>
                      <a
                        href={hrefFor(detailHref)}
                        className="min-h-[44px] inline-flex items-center justify-center gap-1 px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/50 text-xs sm:text-sm font-semibold text-white transition-colors text-center"
                      >
                        <span>{t3('বিস্তারিত', 'အသေးစိတ်', 'Details')}</span>
                        <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {t3(
              'বিশেষ দ্রষ্টব্য: ক্রস-আউট মূল্যসমূহ রেফারেন্স মূল্য। মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য। Standard 4X Rental-এ এককালীন ৳৩,০০০ ফি, ফিক্সড লোকেশন, Residential প্ল্যান, সর্বোচ্চ ৫ টিবি/মাস, কোনো ট্রাভেল/রোমিং বা COD নেই।',
              'မှတ်ချက်: လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
              'Note: Crossed-out prices on artwork are reference prices. Monthly Starlink subscriptions are separate. Standard 4X Rental is a BDT 3,000 one-time fee (fixed location, Residential plan only, up to 5 TB/month, no travel/roaming, no COD).'
            )}
          </p>
        </div>

        {/* 2. Worldwide Delivery + 24-Month Warranty + Roaming & 90-Day Guarantee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Worldwide Delivery */}
          <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <Globe className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  'বাংলাদেশে ফ্রি ডেলিভারি ও বিশ্বব্যাপী শিপিং',
                  'ဘင်္ဂလားဒေ့ရှ် အခမဲ့ပို့ဆောင်မှုနှင့် ကမ္ဘာလုံးဆိုင်ရာ ပို့ဆောင်ရေး',
                  'FREE Delivery in Bangladesh & Worldwide Shipping'
                )}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="rounded-lg border border-slate-700/80 bg-[#04070c] p-3.5 space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                  BANGLADESH (ALL 64 DISTRICTS)
                </div>
                <div className="font-bold text-white">৳0 — FREE Delivery</div>
                <div className="text-slate-300 text-xs">
                  Cash on Delivery Available · Steadfast Courier &amp; Pathao Courier
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/80 bg-[#04070c] p-3.5 space-y-1">
                <div className="font-mono text-xs uppercase tracking-wider text-cyan-300">
                  WORLDWIDE INTERNATIONAL
                </div>
                <div className="font-bold text-white">
                  ৳2,500{currency !== 'BDT' ? ` (≈ ${formatPrice(2500)})` : ''}
                </div>
                <div className="text-slate-300 text-xs">
                  DHL Express &amp; FedEx · Advance Payment Only (No COD)
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs sm:text-sm">
              <a
                href={hrefFor('/worldwide-delivery')}
                className="inline-flex items-center gap-1 min-h-[44px] text-cyan-300 font-semibold underline underline-offset-4 hover:text-cyan-200"
              >
                <span>Worldwide Delivery</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
              <a
                href={hrefFor('/starlink-bangladesh')}
                className="inline-flex items-center min-h-[44px] text-slate-200 hover:text-cyan-200 underline underline-offset-4"
              >
                Starlink Bangladesh
              </a>
              <a
                href={hrefFor('/starlink-myanmar')}
                className="inline-flex items-center min-h-[44px] text-slate-200 hover:text-cyan-200 underline underline-offset-4"
              >
                Starlink Myanmar
              </a>
            </div>
          </div>

          {/* 24-Month DSLink Replacement Warranty */}
          <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-6 space-y-4 flex flex-col">
            <div className="flex items-center gap-2.5 text-white">
              <ShieldCheck className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  '২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি',
                  '၂၄ လ DSLink အစားထိုး အာမခံ',
                  '24-Month DSLink Replacement Warranty'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
              {t3(
                'DSLink থেকে নেওয়া Purchase এবং Rental উভয় Starlink Kit-এ ২৪ মাসের DSLink স্টোর রিপ্লেসমেন্ট ওয়ারেন্টি (নির্ধারিত শর্ত সাপেক্ষে)। এটি DSLink-এর নিজস্ব স্টোর ওয়ারেন্টি — SpaceX বা Starlink-এর অফিসিয়াল ম্যানুফ্যাকচারার ওয়ারেন্টি থেকে পৃথক।',
                'DSLink မှ ဝယ်ယူသော Purchase နှင့် Rental Kit နှစ်မျိုးလုံးအတွက် ၂၄ လ အစားထိုး အာမခံ (သတ်မှတ်စည်းကမ်းအရ)။ SpaceX/Starlink တရားဝင်အာမခံနှင့် သီးခြားဖြစ်ပါသည်။',
                'Covers both Purchase Kits and Rental Kits supplied by DSLink under transparent inspection terms. Serial verification, online registration, and claim tracking available 24/7. Independent DSLink store warranty, distinct from SpaceX/Starlink manufacturer warranty.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs sm:text-sm">
              <a
                href={hrefFor('/warranty')}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-cyan-400 text-[#04131a] hover:bg-cyan-300 font-bold transition-colors"
              >
                <span>Verify / Register / Claim Warranty</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Roaming Packages */}
          <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-6 space-y-4 flex flex-col">
            <div className="flex items-center gap-2.5 text-white">
              <Wifi className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  'Starlink Roaming Packages (ক্রস-বর্ডার ও পোর্টেবল)',
                  'Starlink Roaming ပက်ကေ့ချ်များ',
                  'Starlink Roaming Packages (Portable & Regional)'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
              {t3(
                'ভ্রমণ, ফিল্ড অপারেশন ও আন্তর্জাতিক রিমোট ওয়ার্কের জন্য Roam 50GB ও Roam Unlimited প্যাকেজ। স্থানীয় অনুমোদন ও Starlink রোমিং নীতিমালা প্রযোজ্য।',
                'ခရီးသွားလာခြင်းနှင့် နိုင်ငံတကာအသုံးပြုမှုအတွက် Roam 50GB နှင့် Roam Unlimited ပက်ကေ့ချ်များ။',
                'Explore Roam 50GB and Roam Unlimited plans for purchased Starlink hardware. Roaming activation and regional use remain subject to local regulations and Starlink policies.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs sm:text-sm">
              <a
                href={hrefFor('/roaming-packages')}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-white font-semibold transition-colors"
              >
                <span>{t('hero.ctaRoaming', 'Explore Roaming Packages')}</span>
                <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 90-Day Roaming Money-Back Guarantee */}
          <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-6 space-y-4 flex flex-col">
            <div className="flex items-center gap-2.5 text-white">
              <RefreshCw className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  '৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি',
                  'ရက် ၉၀ Roaming ငွေပြန်အမ်း အာမခံ',
                  '90-Day Roaming Money-Back Guarantee'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed flex-1">
              {t3(
                'যোগ্য Purchased Starlink Kit + Roaming Package-এর ক্ষেত্রে অ্যাক্টিভেশনের ৯০ দিনের মধ্যে টেকনিক্যাল সমস্যা বা অসন্তুষ্টিতে শর্তসাপেক্ষে রিফান্ড আবেদন করুন। রেন্টাল কিট এই গ্যারান্টির আওতাভুক্ত নয়।',
                'အကျုံးဝင်သော Purchased Kit နှင့် Roaming Package များအတွက် စတင်အသုံးပြုပြီး ရက် ၉၀ အတွင်း ငွေပြန်အမ်း လျှောက်ထားနိုင်ပါသည်။ Rental Kit များ မပါဝင်ပါ။',
                'Applies exclusively to qualifying Purchased Starlink Kits paired with eligible Roaming Packages within 90 days of activation, subject to hardware inspection and policy terms. Rental Kits are explicitly excluded.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs sm:text-sm">
              <a
                href={hrefFor('/money-back')}
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-white font-semibold transition-colors"
              >
                <span>Check Eligibility &amp; Claim Refund</span>
                <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* 3. Order Tracking & Dedicated Support Strip */}
        <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold text-white">Order Tracking</div>
              <p className="text-xs text-slate-300">Steadfast, Pathao, DHL Express &amp; FedEx</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-bold text-white">24/7 Technical Support</div>
              <p className="text-xs text-slate-300">WhatsApp +880 1326-370218 · Dhaka Desk</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center md:justify-end gap-2.5">
            <a
              href={hrefFor('/track')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-cyan-400 text-[#04131a] hover:bg-cyan-300 text-xs sm:text-sm font-bold transition-colors"
            >
              <Package className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Track Order</span>
            </a>
            <a
              href={hrefFor('/support')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold text-white transition-colors"
            >
              <span>Customer Support</span>
            </a>
          </div>
        </div>

        {/* 4. Compact Field Deployment Gallery (Responsive AVIF/WebP) */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
                {t3(
                  'মাঠ পর্যায়ে ডিপ্লয়মেন্ট · বাংলাদেশ ও বিশ্বব্যাপী',
                  'လက်တွေ့ တပ်ဆင်အသုံးပြုမှုများ',
                  'FIELD DEPLOYMENTS · BANGLADESH & BEYOND'
                )}
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t3(
                  'রুরাল হোম থেকে সুন্দরবন ও সমুদ্রপথে DSLink',
                  'ကျေးလက်၊ ဝေးလံဒေသနှင့် ပင်လယ်ရေကြောင်း DSLink',
                  'DSLink Across Homes, Remote Sites & Maritime Routes'
                )}
              </h2>
            </div>
            <a
              href={hrefFor('/gallery')}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold text-white transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              <span>{t3('গ্যালারি দেখুন', 'ဓာတ်ပုံများကြည့်ရန်', 'View Full Gallery')}</span>
              <ArrowRight className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FIELD_GALLERY_ITEMS.map(({ key, href }) => {
              const media = MARKETING_MEDIA[key];
              return (
                <a
                  key={key}
                  href={hrefFor(href)}
                  className="group rounded-xl border border-slate-700/70 bg-[#0b0f17] hover:border-cyan-400/50 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
                    <ResponsiveMarketingImage
                      mediaKey={key}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-mono text-cyan-300">
                      {getLocalizedMediaText(media.locationLabel, language)}
                    </p>
                    <h3 className="text-xs sm:text-sm font-semibold text-white leading-snug">
                      {getLocalizedMediaText(media.caption, language)}
                    </h3>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* 5. About Dev Spark Soft Limited */}
        <AboutCompanySection />
      </div>
    </section>
  );
};

export default GlobalHomeHighlights;
