import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Globe,
  Info,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import {
  CentralProductPrice,
  GLOBAL_DELIVERY_COPY,
  RENTAL_TERMS_SUMMARY,
  formatBdt,
  useCentralPricing,
} from '../lib/pricingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { addItemToCart } from '../lib/cartStore';
import { buildLocalePath } from '../lib/localeRouting';
import { useGeoLanguage } from '../lib/geoLanguage';

interface KitDetailPageProps {
  productId: string;
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

type FamilyKey = 'standard-4x' | 'mini' | 'other';

function detectFamily(productId: string): FamilyKey {
  const key = (productId || '').toLowerCase();
  if (
    key === 'starlink-standard-4x' ||
    key === 'starlink-standard-4x-bd-residential'
  ) {
    return 'standard-4x';
  }
  if (key === 'starlink-mini-kit' || key === 'starlink-mini-bd-residential') {
    return 'mini';
  }
  return 'other';
}

function resolveInitialVariantId(productId: string): string {
  const key = (productId || '').toLowerCase();
  const variantParam =
    typeof window !== 'undefined'
      ? (new URLSearchParams(window.location.search).get('variant') || '').toLowerCase()
      : '';

  if (key === 'starlink-standard-4x-bd-residential') {
    return 'starlink-standard-4x-bd-residential';
  }
  if (key === 'starlink-standard-4x') {
    return variantParam === 'bd-residential' || variantParam === 'residential'
      ? 'starlink-standard-4x-bd-residential'
      : 'starlink-standard-4x';
  }
  if (key === 'starlink-mini-bd-residential') {
    return 'starlink-mini-bd-residential';
  }
  if (key === 'starlink-mini-kit') {
    return variantParam === 'bd-residential' || variantParam === 'residential'
      ? 'starlink-mini-bd-residential'
      : 'starlink-mini-kit';
  }
  return productId;
}

export const KitDetailPage: React.FC<KitDetailPageProps> = ({
  productId,
  onNavigate,
  onBackToMainSite,
}) => {
  const { pricing, getProduct } = useCentralPricing();
  const { currency, formatPrice } = useGlobalCurrency();
  const { language } = useGeoLanguage();
  const family = detectFamily(productId);
  const [selectedId, setSelectedId] = useState<string>(() => resolveInitialVariantId(productId));
  const [added, setAdded] = useState(false);

  useEffect(() => {
    setSelectedId(resolveInitialVariantId(productId));
    window.scrollTo(0, 0);
  }, [productId]);

  const activeProduct: CentralProductPrice | undefined =
    pricing.products[selectedId] || getProduct(selectedId) || pricing.products['starlink-standard-4x'];

  const familyVariants: CentralProductPrice[] =
    family === 'standard-4x'
      ? [
          pricing.products['starlink-standard-4x-bd-residential'],
          pricing.products['starlink-standard-4x'],
        ].filter(Boolean)
      : family === 'mini'
      ? [
          pricing.products['starlink-mini-bd-residential'],
          pricing.products['starlink-mini-kit'],
        ].filter(Boolean)
      : [];

  const rentalProduct = pricing.products['starlink-rental-kit'];

  const hrefFor = (path: string) => buildLocalePath(path, language);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  if (!activeProduct) return null;

  const isBdResidential = activeProduct.variantType === 'bd_residential';
  const isRental = activeProduct.category === 'rental';

  const handleAddToCart = (redirectToCart = false) => {
    addItemToCart({
      productId: activeProduct.id,
      name: activeProduct.name,
      category: activeProduct.category,
      image: activeProduct.image,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    if (redirectToCart) {
      if (onNavigate) onNavigate('/cart');
      else window.location.href = hrefFor('/cart');
    }
  };

  const specsList =
    family === 'standard-4x'
      ? [
          'Electronic Phased Array Standard 4X (Gen 3) dish with integrated kickstand',
          'Gen 3 Tri-Band Wi-Fi 6 Router with 2× Gigabit RJ45 Ethernet ports',
          '15m weatherproof Starlink cable & AC power supply included in sealed box',
          'IP67 weather resistance rating for Bangladesh monsoon & coastal environments',
          '24-Month DSLink store replacement warranty (terms apply; separate from SpaceX warranty)',
        ]
      : family === 'mini'
      ? [
          'Ultra-compact backpack-sized Starlink Mini dish with built-in dual-band Wi-Fi router',
          'Low power draw with DC power input — suited for portable & field deployments',
          'Quick setup with integrated kickstand, pipe adapter & 15m DC power cable',
          'IP67 weatherproof enclosure built for outdoor & travel reliability',
          '24-Month DSLink store replacement warranty (terms apply; separate from SpaceX warranty)',
        ]
      : [
          'Genuine Starlink hardware supplied by Dev Spark Soft Limited (DSLink)',
          'Server-validated pricing with transparent BDT billing and official sales invoice',
          'FREE delivery & COD across Bangladesh; worldwide DHL Express / FedEx shipping available',
        ];

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel={activeProduct.shortName || activeProduct.name}
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main
        id="main-content"
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10"
      >
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-300">
          <a
            href={hrefFor('/')}
            onClick={(e) => handleLinkClick(e, '/')}
            className="text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
          >
            Home
          </a>
          <span aria-hidden="true">/</span>
          <a
            href={hrefFor('/kits')}
            onClick={(e) => handleLinkClick(e, '/kits')}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Starlink Kits</span>
          </a>
          <span aria-hidden="true">/</span>
          <span className="text-white font-semibold break-words" aria-current="page">
            {activeProduct.name}
          </span>
        </nav>

        {/* Product Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Verified Product Artwork */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-xl border border-slate-700/80 bg-white p-3 sm:p-4 flex items-center justify-center aspect-square overflow-hidden">
              <img
                src={activeProduct.image}
                alt={activeProduct.imageAlt || activeProduct.name}
                width={800}
                height={800}
                className="w-full h-full object-contain"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>

            {family === 'standard-4x' && rentalProduct && (
              <div className="rounded-xl border border-amber-400/45 bg-amber-950/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs font-mono font-semibold uppercase tracking-wider text-amber-200">
                    Looking for Starlink Standard 4X Rental?
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Rent Standard 4X for a{' '}
                    <strong className="text-white">{formatBdt(rentalProduct.price)} one-time fee</strong>{' '}
                    (separate monthly subscription, fixed location, Residential plan only, up to 5
                    TB/month, no roaming, no COD).
                  </p>
                </div>
                <a
                  href={hrefFor('/rental')}
                  onClick={(e) => handleLinkClick(e, '/rental')}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-black text-xs sm:text-sm font-bold shrink-0 whitespace-nowrap"
                >
                  <span>View Rental Offer</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          {/* Right: Variant Switcher, Price & Checkout CTA */}
          <div className="lg:col-span-6 space-y-6 min-w-0">
            <div className="space-y-2.5">
              <span
                className={`inline-block text-xs font-mono font-semibold uppercase tracking-wider px-2.5 py-1 rounded border ${
                  isBdResidential
                    ? 'border-emerald-400/50 text-emerald-200 bg-emerald-950/40'
                    : isRental
                    ? 'border-amber-400/50 text-amber-200 bg-amber-950/40'
                    : 'border-cyan-400/50 text-cyan-200 bg-cyan-950/40'
                }`}
              >
                {activeProduct.variantLabel || 'Starlink Hardware Purchase'}
              </span>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight break-words">
                {activeProduct.name}
              </h1>
            </div>

            {/* Interactive Variant Selector for Standard 4X and Starlink Mini */}
            {familyVariants.length > 1 && (
              <div className="space-y-2.5">
                <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                  Select Purchase Variant
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {familyVariants.map((variant) => {
                    const selected = variant.id === activeProduct.id;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSelectedId(variant.id)}
                        className={`text-left rounded-xl border p-4 min-h-[44px] transition-colors cursor-pointer space-y-1.5 ${
                          selected
                            ? 'border-cyan-400 bg-[#101827] ring-1 ring-cyan-400/50'
                            : 'border-slate-700 bg-[#0b0f17] hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-semibold uppercase text-cyan-300">
                            {variant.variantLabel}
                          </span>
                          {selected && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 shrink-0">
                              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                              <span>Selected</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-lg font-bold font-mono tabular-nums text-white">
                            {formatBdt(variant.price)}
                          </span>
                          {variant.referencePrice && variant.referencePrice > variant.price && (
                            <span className="text-xs font-mono line-through text-slate-300 tabular-nums">
                              {formatBdt(variant.referencePrice)}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300">
                          {variant.variantType === 'bd_residential'
                            ? 'Bangladesh delivery · FREE shipping & COD'
                            : 'Bangladesh FREE + COD · Worldwide DHL / FedEx'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Block */}
            <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-5 space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span
                  data-testid="detail-sale-price"
                  className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-white"
                >
                  {formatBdt(activeProduct.price)}
                </span>
                <span className="text-sm font-mono font-semibold text-cyan-300">BDT</span>
                {activeProduct.referencePrice &&
                  activeProduct.referencePrice > activeProduct.price && (
                    <span className="text-sm font-mono text-slate-300">
                      <span className="line-through tabular-nums">
                        {formatBdt(activeProduct.referencePrice)}
                      </span>{' '}
                      <span className="text-xs text-slate-300">(reference price)</span>
                    </span>
                  )}
              </div>
              {currency !== 'BDT' && (
                <div className="text-xs font-mono text-slate-300 tabular-nums">
                  ≈ {formatPrice(activeProduct.price)} ({currency} estimate · charged in BDT)
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-200 pt-1">
                {isRental
                  ? 'One-time rental fee. Monthly Starlink subscription is billed separately.'
                  : activeProduct.id === 'starlink-standard-4x'
                  ? 'Hardware kit price: BDT 41,500. An active Roam Unlimited subscription is required and billed separately.'
                  : 'Outright hardware purchase price. Monthly Starlink subscription fees are separate.'}
              </p>
            </div>

            <p className="text-sm sm:text-base text-slate-200 leading-relaxed break-words">
              {language === 'bn' ? activeProduct.descriptionBn : activeProduct.description}
            </p>

            {/* Dedicated Roam Unlimited Destination Eligibility Callout on Product Page */}
            {activeProduct.id === 'starlink-standard-4x' && (
              <div className="rounded-xl border border-cyan-400/45 bg-cyan-950/25 p-4 space-y-2.5 text-xs sm:text-sm">
                <div className="flex items-center gap-2 font-bold text-cyan-200">
                  <Globe className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                  <span>Destination Availability Check Before Ordering</span>
                </div>
                <p className="text-slate-200 leading-relaxed">
                  Planning to use this USA Kit + Roam Unlimited Internet in{' '}
                  <strong className="text-white">
                    Myanmar, Thailand, Japan, Iran, Russia, or Ukraine
                  </strong>
                  ? Contact DSLink before ordering so we can check live availability, local
                  authorization, and roaming eligibility for your exact destination.
                </p>
                <a
                  href="https://wa.me/+8801326370218?text=Hi%20DSLink%2C%20I%20want%20to%20check%20Roam%20Unlimited%20destination%20availability%20for%20the%20Starlink%20Standard%204X%20USA%20Kit."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-cyan-400/60 bg-cyan-400/15 hover:bg-cyan-400/25 text-cyan-100 font-semibold text-xs sm:text-sm transition-colors"
                >
                  <span>Check Destination on WhatsApp (+880 1326-370218)</span>
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                </a>
              </div>
            )}

            {/* Primary Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                data-testid="detail-buy-now"
                onClick={() => handleAddToCart(true)}
                className="flex-1 min-h-[48px] py-3 px-5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>Order Now — Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-testid="detail-add-to-cart"
                onClick={() => handleAddToCart(false)}
                className="min-h-[48px] py-3 px-5 rounded-lg border border-slate-500 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ShoppingCart className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                <span>{added ? 'Added to Cart' : 'Add to Cart'}</span>
              </button>
            </div>

            {/* Shipping, COD & Activation Clarity */}
            <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-5 space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Truck className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-bold text-white">Shipping &amp; Payment Eligibility</div>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">
                    {isBdResidential
                      ? 'Bangladesh Residential variant: FREE delivery across all 64 districts of Bangladesh via Steadfast / Pathao Courier. Cash on Delivery (COD) and Bangla QR / bKash / Nagad / Rocket / bank transfer supported.'
                      : isRental
                      ? RENTAL_TERMS_SUMMARY.en.join(' · ')
                      : 'FREE delivery & COD across Bangladesh (Steadfast / Pathao). Worldwide shipping via DHL Express / FedEx (৳2,500 advance payment, no international COD).'}
                  </p>
                </div>
              </div>
              {!isBdResidential && !isRental && (
                <div className="flex items-start gap-2.5 pt-3 border-t border-slate-800">
                  <Globe className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="font-bold text-white">
                      Worldwide Shipping vs. Starlink Activation
                    </div>
                    <p className="text-slate-300 mt-0.5 leading-relaxed">
                      {GLOBAL_DELIVERY_COPY.disclaimerEn}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-2.5 pt-3 border-t border-slate-800">
                <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <div className="font-bold text-white">Manual Payment &amp; Verification Rule</div>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">
                    Manual Bangla QR, MFS, and bank transfers remain in Awaiting Payment status
                    until verified by Dev Spark Soft Limited finance.
                  </p>
                </div>
              </div>
            </div>

            {/* Hardware Specs */}
            <div className="space-y-2.5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                What&apos;s Included &amp; Key Specifications
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
                {specsList.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-4 flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
          <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Need help choosing between Bangladesh Residential Purchase, Starlink Standard 4X USA Kit
            + Roam Unlimited Internet, or Standard 4X Rental? Contact DSLink on WhatsApp at +880
            1326-370218.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KitDetailPage;
