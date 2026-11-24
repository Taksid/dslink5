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
import { useCentralPricing, formatBdt } from '../lib/pricingConfig';
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
  const { standard4xPrice, miniKitPrice, rentalKitPrice } = useCentralPricing();
  const { currency, formatPrice } = useGlobalCurrency();
  const { language, t, t3 } = useGeoLanguage();
  const [addedId, setAddedId] = useState<string | null>(null);
  const hrefFor = (path: string) => buildLocalePath(path, language);

  const handleQuickAdd = (
    productId: 'starlink-standard-4x' | 'starlink-mini-kit' | 'starlink-rental-kit',
    name: string,
    category: 'purchase' | 'rental'
  ) => {
    addItemToCart({ productId, name, category, quantity: 1 });
    setAddedId(productId);
    setTimeout(() => setAddedId((prev) => (prev === productId ? null : prev)), 1800);
  };

  return (
    <section
      aria-label="Global Starlink Delivery, Warranty & Roaming Highlights"
      className="bg-black border-t border-white/10 py-14 sm:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* 1. Centralized Pricing + Live Currency Quick-Add Matrix */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                CENTRALIZED GLOBAL PRICING · BASE BDT ({currency})
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {t3(
                  'Starlink Purchase ও Rental Kit — সরাসরি কার্টে যোগ করুন',
                  'Starlink ဝယ်ယူရန်နှင့် ငှားရမ်းရန် Kit များ',
                  'Starlink Purchase & Rental Kits — Instant Global Cart'
                )}
              </h2>
            </div>
            <a
              href={hrefFor('/cart')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors self-start sm:self-auto"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{t('nav.cart', 'View Cart & Global Checkout')}</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                id: 'starlink-standard-4x' as const,
                tag: 'PURCHASE · FULL OWNERSHIP',
                title: 'Starlink Standard Kit 4X',
                priceBdt: standard4xPrice,
                note: t3(
                  'বাংলাদেশে ফ্রি ডেলিভারি ও COD · আন্তর্জাতিক ৳২,৫০০ (DHL/FedEx)',
                  'Bangladesh FREE + COD · International ৳2,500 (DHL/FedEx)',
                  'FREE Delivery & COD in BD · ৳2,500 Worldwide (DHL/FedEx)'
                ),
                detailHref: '/kits/starlink-standard-4x',
              },
              {
                id: 'starlink-mini-kit' as const,
                tag: 'PURCHASE · ULTRA PORTABLE',
                title: 'Starlink Mini Kit',
                priceBdt: miniKitPrice,
                note: t3(
                  'বিল্ট-ইন Wi-Fi · রোমিং-রেডি · ২৪ মাসের DSLink ওয়ারেন্টি',
                  'Built-in Wi-Fi · Roaming-Ready · 24-Month DSLink Warranty',
                  'Built-in Wi-Fi · Roaming-Ready · 24-Month DSLink Warranty'
                ),
                detailHref: '/kits/starlink-mini-kit',
              },
              {
                id: 'starlink-rental-kit' as const,
                tag: 'RENTAL · ONE-TIME CHARGE',
                title: 'Starlink Rental Kit',
                priceBdt: rentalKitPrice,
                note: t3(
                  'এককালীন চার্জ · মালিকানা হস্তান্তর নয় · মাসিক সাবস্ক্রিপশন আলাদা',
                  'One-Time Charge · Ownership Not Transferred · Monthly Separate',
                  'One-Time Charge · Hardware Ownership Not Transferred · Monthly Plan Separate'
                ),
                detailHref: '/rental',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 flex flex-col justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
                    {item.tag}
                  </div>
                  <h3 className="text-lg font-bold text-white">{item.title}</h3>
                  <div className="pt-1">
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                      {formatBdt(item.priceBdt)}
                    </div>
                    {currency !== 'BDT' && (
                      <div className="text-xs font-mono tabular-nums text-neutral-400 mt-0.5">
                        ≈ {formatPrice(item.priceBdt)} ({currency})
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">{item.note}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickAdd(
                        item.id,
                        item.title,
                        item.id === 'starlink-rental-kit' ? 'rental' : 'purchase'
                      )
                    }
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {addedId === item.id
                        ? t3('কার্টে যোগ হয়েছে', 'ထည့်ပြီးပါပြီ', 'Added to Cart')
                        : t3('কার্টে যোগ করুন', 'ခြင်းတောင်းထဲထည့်ရန်', 'Add to Cart')}
                    </span>
                  </button>
                  <a
                    href={hrefFor(item.detailHref)}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors whitespace-nowrap"
                  >
                    <span>{t3('বিস্তারিত', 'အသေးစိတ်', 'Details')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-400">
            {t3(
              'বিশেষ দ্রষ্টব্য: মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
              'မှတ်ချက်: လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
              'Note: Monthly Starlink subscriptions are charged separately from hardware purchase or rental charges.'
            )}
          </p>
        </div>

        {/* 2. Worldwide Delivery + 24-Month Warranty + Roaming & 90-Day Guarantee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {/* Worldwide Delivery */}
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <Globe className="w-5 h-5 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  'বাংলাদেশে ফ্রি ডেলিভারি ও বিশ্বব্যাপী শিপিং',
                  'ဘင်္ဂလားဒေ့ရှ် အခမဲ့ပို့ဆောင်မှုနှင့် ကမ္ဘာလုံးဆိုင်ရာ ပို့ဆောင်ရေး',
                  'FREE Delivery in Bangladesh & Worldwide Shipping'
                )}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="rounded-[4px] border border-white/15 bg-black p-3.5 space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  BANGLADESH (ALL 64 DISTRICTS)
                </div>
                <div className="font-bold text-white">৳0 — FREE Delivery</div>
                <div className="text-neutral-400">
                  Cash on Delivery Available · Steadfast Courier &amp; Pathao Courier
                </div>
              </div>
              <div className="rounded-[4px] border border-white/15 bg-black p-3.5 space-y-1">
                <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                  WORLDWIDE INTERNATIONAL
                </div>
                <div className="font-bold text-white">
                  ৳2,500{currency !== 'BDT' ? ` (≈ ${formatPrice(2500)})` : ''}
                </div>
                <div className="text-neutral-400">
                  DHL Express &amp; FedEx · Advance Payment Only (No COD)
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href={hrefFor('/worldwide-delivery')}
                className="inline-flex items-center gap-1 text-white font-semibold underline underline-offset-4 hover:text-neutral-300"
              >
                <span>Worldwide Delivery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a
                href={hrefFor('/starlink-bangladesh')}
                className="text-neutral-300 hover:text-white underline underline-offset-4"
              >
                Starlink Bangladesh
              </a>
              <a
                href={hrefFor('/starlink-myanmar')}
                className="text-neutral-300 hover:text-white underline underline-offset-4"
              >
                Starlink Myanmar
              </a>
            </div>
          </div>

          {/* 24-Month DSLink Replacement Warranty */}
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  '২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি',
                  '၂၄ လ DSLink အစားထိုး အာမခံ',
                  '24-Month DSLink Replacement Warranty'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {t3(
                'DSLink থেকে নেওয়া Purchase এবং Rental উভয় Starlink Kit-এ ২৪ মাসের DSLink স্টোর রিপ্লেসমেন্ট ওয়ারেন্টি (নির্ধারিত শর্ত সাপেক্ষে)। এটি DSLink-এর নিজস্ব স্টোর ওয়ারেন্টি — SpaceX বা Starlink-এর অফিসিয়াল ম্যানুফ্যাকচারার ওয়ারেন্টি থেকে পৃথক।',
                'DSLink မှ ဝယ်ယူသော Purchase နှင့် Rental Kit နှစ်မျိုးလုံးအတွက် ၂၄ လ အစားထိုး အာမခံ (သတ်မှတ်စည်းကမ်းအရ)။ SpaceX/Starlink တရားဝင်အာမခံနှင့် သီးခြားဖြစ်ပါသည်။',
                'Covers both Purchase Kits and Rental Kits supplied by DSLink under transparent inspection terms. Serial verification, online registration, and claim tracking available 24/7. Independent DSLink store warranty, distinct from SpaceX/Starlink manufacturer warranty.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href={hrefFor('/warranty')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-white text-black hover:bg-neutral-200 font-bold transition-colors"
              >
                <span>Verify / Register / Claim Warranty</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Roaming Packages */}
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <Wifi className="w-5 h-5 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  'Starlink Roaming Packages (ক্রস-বর্ডার ও পোর্টেবল)',
                  'Starlink Roaming ပက်ကေ့ချ်များ',
                  'Starlink Roaming Packages (Portable & Regional)'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {t3(
                'ভ্রমণ, ফিল্ড অপারেশন ও আন্তর্জাতিক রিমোট ওয়ার্কের জন্য Roam 50GB ও Roam Unlimited প্যাকেজ। স্থানীয় অনুমোদন ও Starlink রোমিং নীতিমালা প্রযোজ্য।',
                'ခရီးသွားလာခြင်းနှင့် နိုင်ငံတကာအသုံးပြုမှုအတွက် Roam 50GB နှင့် Roam Unlimited ပက်ကေ့ချ်များ။',
                'Explore Roam 50GB and Roam Unlimited plans for purchased Starlink hardware. Roaming activation and regional use remain subject to local regulations and Starlink policies.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href={hrefFor('/roaming-packages')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                <span>{t('hero.ctaRoaming', 'Explore Roaming Packages')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* 90-Day Roaming Money-Back Guarantee */}
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-white">
              <RefreshCw className="w-5 h-5 shrink-0" />
              <h3 className="text-base sm:text-lg font-bold">
                {t3(
                  '৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি',
                  'ရက် ၉၀ Roaming ငွေပြန်အမ်း အာမခံ',
                  '90-Day Roaming Money-Back Guarantee'
                )}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {t3(
                'যোগ্য Purchased Starlink Kit + Roaming Package-এর ক্ষেত্রে অ্যাক্টিভেশনের ৯০ দিনের মধ্যে টেকনিক্যাল সমস্যা বা অসন্তুষ্টিতে শর্তসাপেক্ষে রিফান্ড আবেদন করুন। রেন্টাল কিট এই গ্যারান্টির আওতাভুক্ত নয়।',
                'အကျုံးဝင်သော Purchased Kit နှင့် Roaming Package များအတွက် စတင်အသုံးပြုပြီး ရက် ၉၀ အတွင်း ငွေပြန်အမ်း လျှောက်ထားနိုင်ပါသည်။ Rental Kit များ မပါဝင်ပါ။',
                'Applies exclusively to qualifying Purchased Starlink Kits paired with eligible Roaming Packages within 90 days of activation, subject to hardware inspection and policy terms. Rental Kits are explicitly excluded.'
              )}
            </p>
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <a
                href={hrefFor('/money-back')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                <span>Check Eligibility &amp; Claim Refund</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* 3. Order Tracking & Dedicated Support Strip */}
        <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-white shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">Order Tracking</div>
              <p className="text-xs text-neutral-400">Steadfast, Pathao, DHL Express &amp; FedEx</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="w-5 h-5 text-white shrink-0" />
            <div>
              <div className="text-sm font-bold text-white">24/7 Technical Support</div>
              <p className="text-xs text-neutral-400">WhatsApp +880 1326-370218 · Dhaka Desk</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center md:justify-end gap-2">
            <a
              href={hrefFor('/track')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </a>
            <a
              href={hrefFor('/support')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <span>Customer Support</span>
            </a>
          </div>
        </div>

        {/* 4. Compact Field Deployment Gallery (Responsive AVIF/WebP) */}
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/15 pb-4">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              <span>{t3('গ্যালারি দেখুন', 'ဓာတ်ပုံများကြည့်ရန်', 'View Full Gallery')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FIELD_GALLERY_ITEMS.map(({ key, href }) => {
              const media = MARKETING_MEDIA[key];
              return (
                <a
                  key={key}
                  href={hrefFor(href)}
                  className="group rounded-[4px] border border-white/15 bg-[#0b0b0e] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-950">
                    <ResponsiveMarketingImage
                      mediaKey={key}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
                      imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
                    <p className="text-[11px] font-mono text-neutral-400">
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
