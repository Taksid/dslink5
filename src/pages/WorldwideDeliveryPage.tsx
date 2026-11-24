import React, { useEffect, useState } from 'react';
import {
  Globe,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { ResponsiveMarketingImage } from '../components/ResponsiveMarketingImage';
import {
  SHIPPING_COUNTRIES,
  useSelectedShippingCountry,
} from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { useCentralPricing } from '../lib/pricingConfig';
import { addItemToCart } from '../lib/cartStore';

interface WorldwideDeliveryPageProps {
  regionMode?: 'global' | 'bangladesh' | 'myanmar';
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const WorldwideDeliveryPage: React.FC<WorldwideDeliveryPageProps> = ({
  regionMode = 'global',
  onNavigate,
  onBackToMainSite,
}) => {
  const { countryCode, setCountryCode, countryConfig, shippingFeeBdt, codAvailable, carrierAvailable } =
    useSelectedShippingCountry(
      regionMode === 'bangladesh' ? 'BD' : regionMode === 'myanmar' ? 'MM' : undefined
    );
  const { formatPrice } = useGlobalCurrency();
  const { standard4xPrice, miniKitPrice, rentalKitPrice } = useCentralPricing();

  // Delivery Inquiry form (for unserved/customs-restricted destinations or custom logistics)
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqCountry, setInqCountry] = useState(countryCode);
  const [inqCity, setInqCity] = useState('');
  const [inqProduct, setInqProduct] = useState('starlink-standard-4x');
  const [inqNotes, setInqNotes] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);
  const [inqResult, setInqResult] = useState<string | null>(null);
  const [inqError, setInqError] = useState<string | null>(null);
  const [addedKey, setAddedKey] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (regionMode === 'bangladesh') {
      document.title = 'Starlink Kits in Bangladesh — FREE Delivery & COD (Steadfast / Pathao) | DSLink';
      setCountryCode('BD');
    } else if (regionMode === 'myanmar') {
      document.title = 'Starlink Kits for Myanmar — DHL / FedEx Delivery (৳2,500) | DSLink';
      setCountryCode('MM');
    } else {
      document.title = 'Worldwide Starlink Kit Delivery — Bangladesh FREE & Global DHL / FedEx | DSLink';
    }
  }, [regionMode]);

  useEffect(() => {
    setInqCountry(countryCode);
  }, [countryCode]);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInqError(null);
    setInqResult(null);
    setInqSubmitting(true);
    try {
      const res = await fetch('/api/shipping/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: inqName,
          phone: inqPhone,
          email: inqEmail,
          countryCode: inqCountry,
          city: inqCity,
          productId: inqProduct,
          notes: inqNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setInqError(data?.error || 'Could not submit inquiry.');
      } else {
        setInqResult(data.inquiryId);
        setInqNotes('');
      }
    } catch {
      setInqError('Network error submitting inquiry.');
    } finally {
      setInqSubmitting(false);
    }
  };

  const quickAdd = (productId: string, name: string, category: 'purchase' | 'rental') => {
    addItemToCart({ productId, name, category, quantity: 1 });
    setAddedKey(productId);
    setTimeout(() => setAddedKey(null), 1800);
  };

  const heading =
    regionMode === 'bangladesh'
      ? 'Starlink Kits in Bangladesh — FREE Delivery & Cash on Delivery'
      : regionMode === 'myanmar'
      ? 'Starlink Kits for Myanmar — Express DHL / FedEx Worldwide Shipping'
      : 'Worldwide Starlink Kit Delivery — Bangladesh FREE & Global DHL / FedEx';

  const subtitle =
    regionMode === 'bangladesh'
      ? 'FREE delivery (৳0) across all 64 districts of Bangladesh via Steadfast Courier & Pathao Courier, with Cash on Delivery (COD) for outright kit purchases.'
      : regionMode === 'myanmar'
      ? 'Fast international dispatch to Myanmar via DHL Express & FedEx for ৳2,500 (Advance Payment Only). Supported by our 24-month DSLink replacement warranty and roaming plans.'
      : 'FREE Delivery & COD across Bangladesh (Steadfast / Pathao), plus Worldwide Express Shipping for ৳2,500 via DHL Express / FedEx (Prepaid Only) across Asia, Europe, Americas, Middle East & Oceania.';

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel={
          regionMode === 'bangladesh'
            ? 'Starlink Bangladesh'
            : regionMode === 'myanmar'
            ? 'Starlink Myanmar'
            : 'Worldwide Delivery'
        }
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1150px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero */}
        <section className="space-y-5 border-b border-white/15 pb-7">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 space-y-3 flex flex-col justify-center">
              <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
                DSLINK LOGISTICS · STEADFAST · PATHAO · DHL EXPRESS · FEDEX
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance">
                {heading}
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed">
                {subtitle}
              </p>
            </div>
            <div className="lg:col-span-5 relative aspect-[16/9] rounded-[4px] overflow-hidden border border-white/15 bg-neutral-950">
              <ResponsiveMarketingImage
                mediaKey="sundarbans-remote-deployment"
                priority
                sizes="(max-width: 1024px) 100vw, 480px"
                imgClassName="lg:h-full"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-[4px] border border-white/20 bg-[#0b0b0e] p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-400">Bangladesh (Domestic)</span>
                <span className="text-sm font-mono font-bold text-emerald-300">৳0 — FREE</span>
              </div>
              <div className="text-sm font-bold text-white">
                FREE Delivery Across Bangladesh | Cash on Delivery Available
              </div>
              <p className="text-xs text-neutral-400">
                Partners: Steadfast Courier &amp; Pathao Courier · Inspection prior to payment where carrier terms allow.
              </p>
            </div>
            <div className="rounded-[4px] border border-white/20 bg-[#0b0b0e] p-4 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-neutral-400">International Worldwide</span>
                <span className="text-sm font-mono font-bold text-white tabular-nums">
                  {formatPrice(2500)}
                </span>
              </div>
              <div className="text-sm font-bold text-white">
                Worldwide Delivery via DHL / FedEx — Shipping ৳2,500
              </div>
              <p className="text-xs text-neutral-400">
                Advance Payment Only (COD Not Available). Offered only where destination, carrier, product &amp; laws permit.
              </p>
            </div>
          </div>
        </section>

        {/* Interactive Shipping Checker */}
        <section className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5" />
              <span>Check Shipping Fee, Courier &amp; COD by Destination Country</span>
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">
              Calculated strictly from shipping country (never IP)
            </span>
          </div>

          <div className="max-w-md">
            <label htmlFor="delivery-country-checker" className="block text-xs text-neutral-300 mb-1.5">
              Select Delivery Country
            </label>
            <select
              id="delivery-country-checker"
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full bg-black border border-white/20 focus:border-white rounded-[4px] px-3.5 py-2.5 text-sm text-white outline-none"
            >
              {SHIPPING_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.nativeName}) — {c.code === 'BD' ? 'FREE' : c.carrierAvailable ? '৳2,500' : 'Inquiry'}
                </option>
              ))}
            </select>

            <CompactShippingNotice countryCode={countryCode} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="rounded-[4px] border border-white/10 bg-black p-3">
              <div className="text-neutral-500">Shipping Fee</div>
              <div className="text-white font-mono font-bold text-sm mt-0.5 tabular-nums">
                {shippingFeeBdt === 0 ? 'FREE (৳0)' : formatPrice(shippingFeeBdt, { showBdtReference: true })}
              </div>
            </div>
            <div className="rounded-[4px] border border-white/10 bg-black p-3">
              <div className="text-neutral-500">Cash on Delivery</div>
              <div className="text-white font-semibold mt-0.5">
                {codAvailable ? 'Available' : 'Not Available (Prepaid)'}
              </div>
            </div>
            <div className="rounded-[4px] border border-white/10 bg-black p-3">
              <div className="text-neutral-500">Carriers</div>
              <div className="text-white font-semibold mt-0.5">
                {carrierAvailable ? countryConfig.carriers.join(' / ') : 'Inquiry Required'}
              </div>
            </div>
            <div className="rounded-[4px] border border-white/10 bg-black p-3">
              <div className="text-neutral-500">Est. Transit</div>
              <div className="text-white font-semibold mt-0.5">{countryConfig.estimatedDays}</div>
            </div>
          </div>
        </section>

        {/* Quick Order Kits */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Order Starlink Hardware for {countryConfig.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                id: 'starlink-standard-4x',
                name: 'Starlink Standard Kit 4X (Purchase)',
                price: standard4xPrice,
                tag: 'Purchase · Gen 3 Wi-Fi 6',
                category: 'purchase' as const,
                cta: '/cart',
              },
              {
                id: 'starlink-mini-kit',
                name: 'Starlink Mini Kit (Purchase)',
                price: miniKitPrice,
                tag: 'Purchase · Ultra Portable',
                category: 'purchase' as const,
                cta: '/cart',
              },
              {
                id: 'starlink-rental-kit',
                name: 'Starlink Rental Kit',
                price: rentalKitPrice,
                tag: 'One-Time Charge · Ownership Retained',
                category: 'rental' as const,
                cta: '/rental',
              },
            ].map((item) => (
              <div
                key={item.id}
                className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono uppercase text-neutral-400">{item.tag}</div>
                  <h3 className="text-base font-bold text-white">{item.name}</h3>
                  <div className="text-2xl font-mono font-bold text-white tabular-nums">
                    {formatPrice(item.price, { includeEstimateLabel: true })}
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Monthly Starlink subscriptions are charged separately.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => quickAdd(item.id, item.name, item.category)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[4px] border border-white/25 hover:bg-white/10 text-white text-xs font-semibold cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{addedKey === item.id ? 'Added' : 'Add to Cart'}</span>
                  </button>
                  <a
                    href={item.category === 'rental' ? '/rental' : '/cart'}
                    onClick={(e) => {
                      if (item.category !== 'rental') {
                        quickAdd(item.id, item.name, item.category);
                      }
                      if (onNavigate) {
                        e.preventDefault();
                        onNavigate(item.cta);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-[4px] bg-white hover:bg-neutral-200 text-black text-xs font-bold"
                  >
                    {item.category === 'rental' ? 'Rent Now' : 'Buy Now'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Country-Based Shipping Table */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <span>Country-Based Shipping &amp; COD Matrix</span>
          </h2>
          <div className="overflow-x-auto rounded-[4px] border border-white/15">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#111114] text-neutral-300 border-b border-white/15">
                <tr>
                  <th className="py-3 px-4 font-semibold">Country</th>
                  <th className="py-3 px-4 font-semibold">Shipping Fee</th>
                  <th className="py-3 px-4 font-semibold">COD</th>
                  <th className="py-3 px-4 font-semibold">Carriers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-[#0b0b0e]">
                {SHIPPING_COUNTRIES.slice(0, 22).map((c) => (
                  <tr key={c.code} className="hover:bg-white/[0.03]">
                    <td className="py-2.5 px-4 text-white font-medium">
                      {c.name} <span className="text-neutral-500 font-mono">({c.code})</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono tabular-nums text-neutral-200">
                      {c.code === 'BD' ? (
                        <span className="text-emerald-300 font-bold">FREE (৳0)</span>
                      ) : c.carrierAvailable ? (
                        formatPrice(c.shippingFeeBdt)
                      ) : (
                        <span className="text-amber-300">Delivery Inquiry</span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      {c.codAvailable ? (
                        <span className="inline-flex items-center gap-1 text-emerald-300 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-neutral-400">
                          <XCircle className="w-3.5 h-3.5" /> NO (Prepaid)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-neutral-300">
                      {c.carrierAvailable ? c.carriers.join(', ') : 'Carrier Inquiry Required'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              International hardware delivery availability does not guarantee official Starlink activation or roaming support in every country. Local regulations, customs clearance, and official Starlink terms always apply.
            </span>
          </p>
        </section>

        {/* Delivery Inquiry Form (for unserved destinations or custom international quotes) */}
        <section id="delivery-inquiry" className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-white">
              International Delivery Inquiry Form
            </h2>
            <p className="text-xs text-neutral-400">
              Need delivery to a destination where standard DHL Express / FedEx checkout is unavailable, or require customs/bulk shipping coordination? Submit your inquiry below.
            </p>
          </div>

          <form onSubmit={handleInquirySubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">Full Name *</span>
              <input
                type="text"
                required
                value={inqName}
                onChange={(e) => setInqName(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">Phone / WhatsApp *</span>
              <input
                type="tel"
                required
                value={inqPhone}
                onChange={(e) => setInqPhone(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">Email Address</span>
              <input
                type="email"
                value={inqEmail}
                onChange={(e) => setInqEmail(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">Destination Country *</span>
              <select
                value={inqCountry}
                onChange={(e) => setInqCountry(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              >
                {SHIPPING_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">City / Postal Code</span>
              <input
                type="text"
                value={inqCity}
                onChange={(e) => setInqCity(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-neutral-300 block">Requested Hardware</span>
              <select
                value={inqProduct}
                onChange={(e) => setInqProduct(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              >
                <option value="starlink-standard-4x">Starlink Standard Kit 4X (৳41,500)</option>
                <option value="starlink-mini-kit">Starlink Mini Kit (৳21,500)</option>
                <option value="starlink-high-performance">Starlink Flat High Performance</option>
              </select>
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-neutral-300 block">Shipping / Customs Notes</span>
              <textarea
                rows={2}
                value={inqNotes}
                onChange={(e) => setInqNotes(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>

            {inqError && (
              <div className="sm:col-span-2 rounded-[4px] border border-red-500/40 bg-red-950/30 p-3 text-red-200">
                {inqError}
              </div>
            )}
            {inqResult && (
              <div className="sm:col-span-2 rounded-[4px] border border-emerald-500/40 bg-emerald-950/20 p-3 text-emerald-200">
                Delivery Inquiry <strong>#{inqResult}</strong> submitted. Our international logistics desk will review carrier eligibility and contact you.
              </div>
            )}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={inqSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{inqSubmitting ? 'Submitting...' : 'Submit Delivery Inquiry'}</span>
              </button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WorldwideDeliveryPage;
