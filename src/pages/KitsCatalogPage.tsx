import React, { useState } from 'react';
import {
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
  CORE_FEATURED_VARIANT_IDS,
  GLOBAL_DELIVERY_COPY,
  RENTAL_TERMS_SUMMARY,
  formatBdt,
  useCentralPricing,
} from '../lib/pricingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { addItemToCart } from '../lib/cartStore';
import { buildLocalePath } from '../lib/localeRouting';
import { useGeoLanguage } from '../lib/geoLanguage';

interface KitsCatalogPageProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

const OTHER_PRODUCT_IDS = [
  'starlink-high-performance',
  'router-mini',
  'router-3',
  'ethernet-adapter',
  'cable-15m',
  'cable-30m',
] as const;

export const KitsCatalogPage: React.FC<KitsCatalogPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { pricing } = useCentralPricing();
  const { currency, formatPrice } = useGlobalCurrency();
  const { language, t3 } = useGeoLanguage();
  const [addedId, setAddedId] = useState<string | null>(null);

  const hrefFor = (path: string) => buildLocalePath(path, language);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const handleAdd = (productId: string) => {
    const product = pricing.products[productId];
    if (!product) return;
    addItemToCart({
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      quantity: 1,
    });
    setAddedId(productId);
    setTimeout(() => setAddedId((prev) => (prev === productId ? null : prev)), 1800);
  };

  const featuredProducts = CORE_FEATURED_VARIANT_IDS.map((id) => pricing.products[id]).filter(
    Boolean
  );
  const otherProducts = OTHER_PRODUCT_IDS.map((id) => pricing.products[id]).filter(Boolean);

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="Starlink Kits Catalog"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main
        id="main-content"
        className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12"
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
          <span className="text-white font-semibold" aria-current="page">
            Starlink Kits
          </span>
        </nav>

        {/* Hero Header */}
        <section className="space-y-4 border-b border-slate-800 pb-8">
          <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
            DEVSPARK LINK (DSLINK) · OFFICIAL SERVER-VALIDATED CATALOG
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
            {t3(
              'বাংলাদেশে Starlink কিট — Standard 4X, Starlink Mini ও রেন্টাল',
              'Starlink Kits in Bangladesh — Standard 4X, Starlink Mini & Rental',
              'Starlink Kits in Bangladesh — Standard 4X, Starlink Mini & Rental'
            )}
          </h1>
          <p className="text-sm sm:text-base text-slate-200 max-w-3xl leading-relaxed">
            Compare Bangladesh Residential Purchase kits, Roam Unlimited &amp; Global Roam Purchase
            kits, and our Standard 4X Rental option. Every price below is synced directly from the
            DSLink server catalog. Monthly Starlink subscription fees are charged separately.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2 text-xs sm:text-sm">
            <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-4 space-y-1.5">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Bangladesh Residential Purchase
              </div>
              <p className="text-slate-200 leading-relaxed">
                Standard 4X at <strong className="text-white">৳12,500</strong> · Mini at{' '}
                <strong className="text-white">৳9,500</strong>. FREE delivery &amp; COD across all
                64 districts of Bangladesh.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-4 space-y-1.5">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-cyan-300">
                ROAM UNLIMITED &amp; Global Roam
              </div>
              <p className="text-slate-200 leading-relaxed">
                Standard 4X USA Kit + Roam Unlimited Internet at{' '}
                <strong className="text-white">৳41,500</strong> · Mini Global Roam at{' '}
                <strong className="text-white">৳21,500</strong>.
              </p>
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-[#0b0f17] p-4 space-y-1.5">
              <div className="font-mono text-xs font-semibold uppercase tracking-wider text-amber-300">
                Starlink Standard 4X Rental
              </div>
              <p className="text-slate-200 leading-relaxed">
                <strong className="text-white">৳3,000 one-time fee</strong> (ownership retained).
                Fixed location, Residential plan only, up to 5 TB/month, no roaming, no COD.
              </p>
            </div>
          </div>
        </section>

        {/* Core 5 Featured Variants */}
        <section aria-labelledby="featured-starlink-variants" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="featured-starlink-variants"
                className="text-xl sm:text-2xl font-bold text-white"
              >
                Starlink Standard 4X, Starlink Mini &amp; Rental Offers
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Crossed-out prices shown on product artwork are reference prices. Authoritative sale
                prices apply in cart and checkout.
              </p>
            </div>
            <a
              href={hrefFor('/cart')}
              onClick={(e) => handleLinkClick(e, '/cart')}
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-cyan-400/50 bg-cyan-400/10 hover:bg-cyan-400/20 text-xs sm:text-sm font-semibold text-cyan-100 transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>View Cart &amp; Checkout</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {featuredProducts.map((product, index) => {
              const isRental = product.category === 'rental';
              const isBdRes = product.variantType === 'bd_residential';
              const detailPath = product.detailUrl || `/kits/${product.id}`;
              const cardCopy =
                language === 'bn'
                  ? product.cardSummaryBn || product.descriptionBn
                  : product.cardSummary || product.description;

              return (
                <article
                  key={product.id}
                  className="rounded-xl border border-slate-700/80 bg-[#0b0f17] hover:border-cyan-400/50 transition-colors overflow-hidden flex flex-col h-full min-w-0"
                >
                  <a
                    href={hrefFor(detailPath)}
                    onClick={(e) => handleLinkClick(e, detailPath)}
                    className="block relative aspect-square w-full bg-white border-b border-slate-800 overflow-hidden p-2"
                  >
                    <img
                      src={product.image}
                      alt={product.imageAlt || product.name}
                      width={600}
                      height={600}
                      loading={index < 2 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      decoding="async"
                      className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.02]"
                    />
                  </a>

                  <div className="p-5 flex-1 flex flex-col gap-3 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isRental
                            ? 'border-amber-400/50 text-amber-200 bg-amber-950/40'
                            : isBdRes
                            ? 'border-emerald-400/50 text-emerald-200 bg-emerald-950/40'
                            : 'border-cyan-400/50 text-cyan-200 bg-cyan-950/40'
                        }`}
                      >
                        {product.variantLabel || product.category}
                      </span>
                      <span className="text-xs font-mono text-slate-300">
                        {product.codEligible ? 'BD COD Eligible' : 'Prepaid Only · No COD'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-white leading-snug break-words">
                      <a
                        href={hrefFor(detailPath)}
                        onClick={(e) => handleLinkClick(e, detailPath)}
                        className="hover:text-cyan-300 hover:underline underline-offset-4 transition-colors"
                      >
                        {product.name}
                      </a>
                    </h3>

                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-2xl font-bold font-mono tabular-nums text-white">
                          {formatBdt(product.price)}
                        </span>
                        <span className="text-xs font-mono text-cyan-300">
                          {isRental ? 'BDT one-time' : 'BDT'}
                        </span>
                        {product.referencePrice && product.referencePrice > product.price && (
                          <span className="text-xs font-mono text-slate-300">
                            <span className="line-through tabular-nums">
                              {formatBdt(product.referencePrice)}
                            </span>{' '}
                            <span className="text-slate-300">(ref.)</span>
                          </span>
                        )}
                      </div>
                      {currency !== 'BDT' && (
                        <div className="text-xs font-mono text-slate-300 tabular-nums">
                          ≈ {formatPrice(product.price)} ({currency})
                        </div>
                      )}
                      <div className="text-xs text-slate-300">
                        {isRental
                          ? 'One-time rental fee · Monthly subscription separate'
                          : 'Hardware purchase · Monthly subscription separate'}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                      {cardCopy}
                    </p>

                    {isRental && (
                      <ul className="space-y-1.5 pt-2 border-t border-slate-800 text-xs text-slate-200">
                        {RENTAL_TERMS_SUMMARY.en.slice(2, 5).map((term) => (
                          <li key={term} className="flex items-start gap-1.5">
                            <Check className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{term}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-auto pt-4 border-t border-slate-800 flex flex-col min-[380px]:flex-row items-stretch gap-2">
                      <button
                        type="button"
                        onClick={() => handleAdd(product.id)}
                        className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] text-xs sm:text-sm font-bold transition-colors cursor-pointer text-center"
                      >
                        {addedId === product.id ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Added to Cart</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>{isRental ? 'Add Rental' : 'Add to Cart'}</span>
                          </>
                        )}
                      </button>
                      <a
                        href={hrefFor(detailPath)}
                        onClick={(e) => handleLinkClick(e, detailPath)}
                        className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400 text-xs sm:text-sm font-semibold text-white transition-colors text-center"
                      >
                        <span>{isRental ? 'Rental Terms' : 'Details'}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Worldwide Shipping vs Activation & Roaming Clarification */}
        <section className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-5 text-xs sm:text-sm">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Truck className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
              <span>Bangladesh Delivery &amp; COD</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {GLOBAL_DELIVERY_COPY.codEligibleNoteEn}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <Globe className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>Worldwide Hardware Shipping</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              {GLOBAL_DELIVERY_COPY.disclaimerEn}
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-white">
              <ShieldCheck className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span>24-Month DSLink Store Warranty</span>
            </div>
            <p className="text-slate-200 leading-relaxed">
              Transparent inspection-based replacement support operated by Dev Spark Soft Limited,
              distinct from SpaceX / Starlink manufacturer warranty.
            </p>
          </div>
        </section>

        {/* Enterprise Hardware & Official Accessories (Preserved Unrelated Catalog) */}
        <section aria-labelledby="enterprise-and-accessories" className="space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h2
              id="enterprise-and-accessories"
              className="text-xl sm:text-2xl font-bold text-white"
            >
              Enterprise Hardware &amp; Official Starlink Accessories
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Flat High Performance terminals, mesh routers, Ethernet adapters, and weatherproof
              cables.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
            {otherProducts.map((product) => (
              <article
                key={product.id}
                className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-4 flex flex-col justify-between gap-4 hover:border-cyan-400/50 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-[#111827] border border-slate-700 p-2 shrink-0 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.imageAlt || product.name}
                      width={80}
                      height={80}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="text-xs font-mono uppercase text-cyan-300">
                      {product.variantLabel || product.category}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug break-words">
                      <a
                        href={hrefFor(`/kits/${product.id}`)}
                        onClick={(e) => handleLinkClick(e, `/kits/${product.id}`)}
                        className="hover:text-cyan-300 hover:underline underline-offset-4"
                      >
                        {product.name}
                      </a>
                    </h3>
                    <div className="text-base font-mono font-bold tabular-nums text-white">
                      {formatBdt(product.price)}
                    </div>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed flex-1">
                  {product.description}
                </p>
                <div className="flex flex-col min-[360px]:flex-row items-stretch gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleAdd(product.id)}
                    className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] text-xs sm:text-sm font-bold cursor-pointer transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>{addedId === product.id ? 'Added' : 'Add to Cart'}</span>
                  </button>
                  <a
                    href={hrefFor(`/kits/${product.id}`)}
                    onClick={(e) => handleLinkClick(e, `/kits/${product.id}`)}
                    className="min-h-[44px] inline-flex items-center justify-center px-3.5 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold text-white transition-colors"
                  >
                    Details
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-4 flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
          <Info className="w-4 h-4 text-cyan-300 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            Monthly Starlink service subscriptions are billed separately from hardware purchase or
            rental fees. Contact DSLink Support (+880 1326-370218) for activation guidance and
            monthly bill payment support.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default KitsCatalogPage;
