import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { useCart } from '../lib/cartStore';
import { SHIPPING_COUNTRIES, useSelectedShippingCountry } from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import {
  CORE_FEATURED_VARIANT_IDS,
  useCentralPricing,
  formatBdt,
} from '../lib/pricingConfig';
import {
  DEFAULT_BDT_TO_USD_RATE,
  DEFAULT_RENTAL_SHIPPING_FEE_BDT,
  DSLinkPricingAndShippingRulesConfig,
  RENTAL_SHIPPING_EXCLUSION_NOTICE_BN,
  evaluateCheckoutEligibility,
} from '../lib/dslinkPayRules';
import { formatPayAmount } from '../lib/dslinkPayConfig';

interface CartCheckoutPageProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

interface ServerOrderStatus {
  orderId: string;
  productName: string;
  totalAmount: number;
  shippingFee: number;
  countryCode: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  status: string;
  stripePaymentStatus?: string;
}

const DEFAULT_CLIENT_RULES: DSLinkPricingAndShippingRulesConfig = {
  bangladeshPurchaseShippingBdt: 0,
  bangladeshRentalShippingBdt: DEFAULT_RENTAL_SHIPPING_FEE_BDT,
  internationalShippingBdt: 2500,
  internationalShippingUsd: null,
  bdtToUsdRate: DEFAULT_BDT_TO_USD_RATE,
  rentalActivationCollectionRule: 'upfront',
  codAdvanceBdt: 0,
  blockedCountries: ['KP', 'SY', 'IR', 'CU', 'AF'],
};

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { countryCode, setCountryCode, countryConfig } = useSelectedShippingCountry();
  const { currency, formatPrice } = useGlobalCurrency();
  const { pricing } = useCentralPricing();
  const {
    items,
    itemCount,
    subtotalBdt,
    addItem,
    setQuantity,
    removeItem,
    clear,
  } = useCart(countryCode);

  const [serverRules, setServerRules] = useState<DSLinkPricingAndShippingRulesConfig>(DEFAULT_CLIENT_RULES);
  const [stripeConfigured, setStripeConfigured] = useState(false);

  // Guest vs Signed-In Checkout Mode
  const [checkoutAccountMode, setCheckoutAccountMode] = useState<'guest' | 'signed-in'>('guest');
  const [email, setEmail] = useState('');

  // Complete 10-Field Shipping Address
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+880 ');
  const [houseFlat, setHouseFlat] = useState('');
  const [roadStreet, setRoadStreet] = useState('');
  const [area, setArea] = useState('');
  const [cityDistrict, setCityDistrict] = useState('Dhaka');
  const [stateDivision, setStateDivision] = useState('Dhaka Division');
  const [postalCode, setPostalCode] = useState('1212');
  const [landmarkNote, setLandmarkNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inquirySubmittedId, setInquirySubmittedId] = useState<string | null>(null);

  // Return banner state after Stripe redirect (?stripe=success|cancel&orderId=...)
  const [stripeReturnState, setStripeReturnState] = useState<{
    outcome: 'success' | 'cancel';
    orderId: string;
    loading: boolean;
    order: ServerOrderStatus | null;
    error?: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/payments/config', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data?.success) return;
        setStripeConfigured(Boolean(data.stripeConfigured));
        if (data.rules) {
          setServerRules({
            bangladeshPurchaseShippingBdt: Number(data.rules.bangladeshPurchaseShippingBdt ?? 0),
            bangladeshRentalShippingBdt: Number(
              data.rules.bangladeshRentalShippingBdt ?? DEFAULT_RENTAL_SHIPPING_FEE_BDT
            ),
            internationalShippingBdt: Number(data.rules.internationalShippingBdt ?? 2500),
            internationalShippingUsd:
              typeof data.rules.internationalShippingUsd === 'number'
                ? data.rules.internationalShippingUsd
                : null,
            bdtToUsdRate: Number(data.rules.bdtToUsdRate ?? DEFAULT_BDT_TO_USD_RATE),
            rentalActivationCollectionRule:
              data.rules.rentalActivationCollectionRule === 'on_activation'
                ? 'on_activation'
                : 'upfront',
            codAdvanceBdt: Number(data.rules.codAdvanceBdt ?? 0),
            blockedCountries: Array.isArray(data.rules.blockedCountries)
              ? data.rules.blockedCountries
              : ['KP', 'SY', 'IR', 'CU', 'AF'],
          });
        }
      })
      .catch(() => {
        // Keep safe defaults
      });
    return () => {
      active = false;
    };
  }, []);

  const featuredProducts = useMemo(
    () => CORE_FEATURED_VARIANT_IDS.map((id) => pricing.products[id]).filter(Boolean),
    [pricing]
  );

  const checkoutEval = useMemo(() => {
    const resolvedEntries = items
      .map((item) => {
        const prod = pricing.products[item.productId];
        if (!prod) return null;
        return { product: prod, quantity: item.quantity };
      })
      .filter(Boolean) as Array<{ product: typeof pricing.products[string]; quantity: number }>;

    return evaluateCheckoutEligibility({
      countryCode,
      items: resolvedEntries,
      rules: serverRules,
      stripeCardEnabled: stripeConfigured,
    });
  }, [items, pricing, countryCode, serverRules, stripeConfigured]);

  const hasRental = checkoutEval.hasRental;
  const codAvailable = checkoutEval.codAvailable;
  const carrierAvailable = checkoutEval.carrierSupported;
  const bdRestrictionViolation = checkoutEval.ineligibleItems.length > 0;
  const ineligibleIdSet = useMemo(
    () => new Set(checkoutEval.ineligibleItems.map((i) => i.productId)),
    [checkoutEval.ineligibleItems]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle Stripe redirect return — NEVER mark an order paid from URL query params; always fetch server status
  const fetchAuthoritativeOrderStatus = async (orderId: string, outcome: 'success' | 'cancel') => {
    setStripeReturnState({ outcome, orderId, loading: true, order: null });
    try {
      let token = '';
      try {
        token = window.sessionStorage.getItem(`dslink_order_token_${orderId}`) || '';
      } catch {
        token = '';
      }
      const query = token ? `?token=${encodeURIComponent(token)}` : '';
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status${query}`, {
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.order) {
        setStripeReturnState({
          outcome,
          orderId,
          loading: false,
          order: null,
          error:
            data?.error ||
            'Could not load live order status. Please check your Order ID on the Order Tracking page.',
        });
        return;
      }
      setStripeReturnState({
        outcome,
        orderId,
        loading: false,
        order: data.order,
      });
    } catch {
      setStripeReturnState({
        outcome,
        orderId,
        loading: false,
        order: null,
        error: 'Network error checking order status. Please refresh in a moment.',
      });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const stripeParam = params.get('stripe');
    const orderIdParam = params.get('orderId');
    if ((stripeParam === 'success' || stripeParam === 'cancel') && orderIdParam) {
      fetchAuthoritativeOrderStatus(orderIdParam, stripeParam);
    }
  }, []);

  const combinedStreetAddress = useMemo(() => {
    const parts = [
      houseFlat.trim(),
      roadStreet.trim(),
      area.trim(),
      cityDistrict.trim(),
      stateDivision.trim(),
      postalCode.trim(),
      countryCode,
      landmarkNote.trim() ? `Landmark: ${landmarkNote.trim()}` : '',
    ].filter(Boolean);
    return parts.join(', ');
  }, [houseFlat, roadStreet, area, cityDistrict, stateDivision, postalCode, countryCode, landmarkNote]);

  // Deterministic idempotency key per cart+address snapshot so double-click or refresh reuses the same active DSLink Pay request
  const getOrCreateCheckoutIdempotencyKey = (): string => {
    const fingerprint = [
      countryCode,
      items.map((i) => `${i.productId}:${i.quantity}`).sort().join(','),
      phone.replace(/[^0-9]/g, ''),
      houseFlat.trim().toLowerCase(),
      postalCode.trim().toLowerCase(),
    ].join('|');
    const storageKey = `dslink_checkout_idem_${fingerprint}`;
    try {
      const existing = window.sessionStorage.getItem(storageKey);
      if (existing && existing.length >= 12) return existing;
      const fresh = `CHK-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.sessionStorage.setItem(storageKey, fresh);
      return fresh;
    } catch {
      return `CHK-${fingerprint.slice(0, 64)}`;
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (items.length === 0) {
      setError('আপনার কার্ট খালি। আগে একটি Starlink কিট যোগ করুন। (Your cart is empty.)');
      return;
    }
    if (bdRestrictionViolation) {
      setError(
        'Your cart includes a Bangladesh Residential or Standard 4X Rental item, which can only be delivered within Bangladesh. Switch Destination Country to Bangladesh (BD) or choose the Starlink Standard 4X USA Kit + Roam Unlimited Internet or Starlink Mini Global Roam kit for worldwide shipping.'
      );
      return;
    }
    if (
      !fullName.trim() ||
      !phone.trim() ||
      phone.replace(/[^0-9]/g, '').length < 7 ||
      !houseFlat.trim() ||
      !roadStreet.trim() ||
      !area.trim() ||
      !cityDistrict.trim() ||
      !stateDivision.trim() ||
      !postalCode.trim()
    ) {
      setError(
        'অনুগ্রহ করে ডেলিভারির সকল প্রয়োজনীয় তথ্য পূরণ করুন (নাম, সঠিক ফোন নম্বর, বাসা/ফ্ল্যাট, রোড, এলাকা, জেলা/শহর, বিভাগ ও পোস্টাল কোড)।'
      );
      return;
    }

    setSubmitting(true);
    try {
      const shippingAddress10 = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        houseFlat: houseFlat.trim(),
        roadStreet: roadStreet.trim(),
        area: area.trim(),
        cityDistrict: cityDistrict.trim(),
        stateDivision: stateDivision.trim(),
        postalCode: postalCode.trim(),
        countryCode,
        landmarkNote: landmarkNote.trim() || undefined,
      };

      // Unserved carrier destination -> automatically route to Delivery Inquiry
      if (!carrierAvailable) {
        const res = await fetch('/api/shipping/inquiry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            phone: phone.trim(),
            email: email.trim(),
            countryCode,
            city: cityDistrict.trim(),
            productId: items[0].productId,
            notes: `Cart items: ${items.map((i) => `${i.name} x${i.quantity}`).join(', ')} | Address: ${combinedStreetAddress}`,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.success) throw new Error(data?.error || 'Inquiry submission failed.');
        setInquirySubmittedId(data.inquiryId);
        return;
      }

      const checkoutIdempotencyKey = getOrCreateCheckoutIdempotencyKey();

      const res = await fetch('/api/promos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          district: cityDistrict.trim() || 'Dhaka',
          address: combinedStreetAddress,
          shippingAddress: shippingAddress10,
          countryCode,
          currency,
          checkoutMode: checkoutAccountMode,
          paymentMethod: 'dslink_pay',
          requireDeliveryAddress: true,
          checkoutIdempotencyKey,
          items: items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.paymentRequest?.payPath) {
        throw new Error(data?.error || 'Order validation failed. Please check your delivery details.');
      }

      if (data.orderAccessToken && data.orderId) {
        try {
          window.sessionStorage.setItem(
            `dslink_order_token_${data.orderId}`,
            String(data.orderAccessToken)
          );
        } catch {
          // ignore storage quota
        }
      }

      clear();
      const targetPayPath = String(data.paymentRequest.payPath);
      if (onNavigate) {
        onNavigate(targetPayPath);
      } else {
        window.location.assign(targetPayPath);
      }
    } catch (err: any) {
      setError(err?.message || 'চেকআউট সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#04070c] text-slate-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="Cart & Global Checkout"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main
        id="main-content"
        className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div className="min-w-0">
            <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
              CART → DELIVERY ADDRESS → DSLINK PAY → PAYMENT STATUS
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 break-words">
              কার্ট ও ডেলিভারি ঠিকানা — Cart &amp; Delivery Checkout ({itemCount})
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/resell"
              className="inline-flex items-center min-h-[44px] text-xs sm:text-sm text-emerald-300 hover:text-emerald-200 font-semibold"
            >
              Apply as a DSLink Reseller (15% Off) →
            </a>
            <a
              href="/kits"
              className="inline-flex items-center min-h-[44px] text-xs sm:text-sm text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
            >
              Continue Shopping →
            </a>
          </div>
        </div>

        {/* 4-Step Flow Indicator */}
        <nav aria-label="Checkout steps" className="rounded-xl border border-slate-800 bg-[#0b0f17] px-4 py-3">
          <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { step: '১', label: 'কার্ট (Cart)', active: items.length === 0, done: items.length > 0 },
              { step: '২', label: 'ডেলিভারি ঠিকানা', active: items.length > 0, done: false },
              { step: '৩', label: 'DSLink Pay', active: false, done: false },
              { step: '৪', label: 'পেমেন্ট স্ট্যাটাস', active: false, done: false },
            ].map((s) => (
              <li
                key={s.step}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border ${
                  s.active
                    ? 'border-cyan-400/70 bg-cyan-950/35 text-white font-bold'
                    : s.done
                    ? 'border-slate-700 bg-[#04070c] text-slate-200'
                    : 'border-slate-800 bg-[#04070c]/60 text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                    s.active
                      ? 'bg-cyan-400 text-[#04131a]'
                      : s.done
                      ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {s.step}
                </span>
                <span className="truncate">{s.label}</span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Authoritative Order Status Panel for Stripe Return Redirects */}
        {stripeReturnState && (
          <section className="rounded-xl border border-slate-700 bg-[#0b0f17] p-6 space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-lg font-bold text-white break-all">
                {stripeReturnState.outcome === 'cancel'
                  ? `Stripe Checkout Cancelled — Order #${stripeReturnState.orderId}`
                  : `Order Status Check — #${stripeReturnState.orderId}`}
              </h2>
              <button
                type="button"
                onClick={() =>
                  fetchAuthoritativeOrderStatus(
                    stripeReturnState.orderId,
                    stripeReturnState.outcome
                  )
                }
                className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-600 bg-slate-900 text-xs sm:text-sm text-white hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                <span>Refresh Status</span>
              </button>
            </div>
            {stripeReturnState.loading ? (
              <p className="text-xs sm:text-sm text-slate-300">
                Checking live payment status from the server...
              </p>
            ) : stripeReturnState.error ? (
              <p className="text-xs sm:text-sm text-amber-200">{stripeReturnState.error}</p>
            ) : stripeReturnState.order ? (
              <div className="space-y-3 text-xs sm:text-sm">
                <p className="text-slate-200">
                  {stripeReturnState.order.paymentStatus === 'Paid (Stripe Verified)'
                    ? 'Payment has been verified by Stripe webhook. Your order is confirmed for fulfillment.'
                    : stripeReturnState.outcome === 'cancel'
                    ? 'No card charge was completed. Your order remains unpaid until payment is confirmed.'
                    : 'Return received. Orders are marked paid only after verified Stripe webhook confirmation — current live status is shown below.'}
                </p>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-slate-700 bg-[#04070c] p-4 font-mono tabular-nums text-xs">
                  <div>
                    <dt className="text-slate-400">Order ID</dt>
                    <dd className="text-white font-bold break-all">#{stripeReturnState.order.orderId}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Server Payment Status</dt>
                    <dd className="text-amber-300 font-bold">
                      {stripeReturnState.order.paymentStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Fulfillment Status</dt>
                    <dd className="text-white font-bold">
                      {stripeReturnState.order.fulfillmentStatus}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400">Authoritative Total</dt>
                    <dd className="text-white font-bold">
                      {formatBdt(stripeReturnState.order.totalAmount)} BDT
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}
          </section>
        )}

        {inquirySubmittedId ? (
          <section className="rounded-xl border border-amber-500/40 bg-amber-950/15 p-6 max-w-2xl mx-auto space-y-3">
            <h2 className="text-lg font-bold text-white">Delivery Inquiry #{inquirySubmittedId} Submitted</h2>
            <p className="text-sm text-neutral-300">
              Because standard DHL Express / FedEx checkout is unavailable for {countryConfig.name}, our international logistics team received your Delivery Inquiry and will respond with carrier &amp; compliance options.
            </p>
            <button
              type="button"
              onClick={() => setInquirySubmittedId(null)}
              className="px-4 py-2 rounded-lg bg-white text-black text-xs font-bold cursor-pointer"
            >
              Return to Cart
            </button>
          </section>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Cart Summary & Items */}
            <div className="lg:col-span-7 space-y-6 min-w-0">
              {items.length === 0 ? (
                <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-5 sm:p-6 space-y-5">
                  <div className="flex items-center gap-2 text-white">
                    <ShoppingBag className="w-5 h-5 text-cyan-300 shrink-0" aria-hidden="true" />
                    <h2 className="text-base font-bold">Your Cart is Empty — Quick Add Starlink Kits</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {featuredProducts.map((p) => (
                      <div
                        key={p.id}
                        className="rounded-xl border border-slate-700 bg-[#04070c] p-3.5 flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <img
                            src={p.image}
                            alt={p.imageAlt || p.name}
                            width={64}
                            height={64}
                            loading="lazy"
                            className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-700 p-1 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-mono uppercase text-cyan-300">
                              {p.variantLabel}
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-white leading-snug mt-0.5 break-words">
                              {p.name}
                            </div>
                            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                              <span className="text-sm font-mono font-bold text-white tabular-nums">
                                {formatPrice(p.price)}
                              </span>
                              {p.referencePrice && p.referencePrice > p.price && (
                                <span className="text-xs font-mono line-through text-slate-400 tabular-nums">
                                  {formatBdt(p.referencePrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            addItem({
                              productId: p.id,
                              name: p.name,
                              category: p.category,
                              image: p.image,
                              quantity: 1,
                            })
                          }
                          className="w-full min-h-[44px] py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold text-xs sm:text-sm cursor-pointer transition-colors"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] divide-y divide-slate-800">
                  {items.map((item) => {
                    const isIneligible = ineligibleIdSet.has(item.productId);
                    const badEntry = checkoutEval.ineligibleItems.find(
                      (entry) => entry.productId === item.productId
                    );
                    return (
                    <div
                      key={`${item.productId}-${item.roamingPackageId || ''}`}
                      className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isIneligible ? 'bg-amber-950/20' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.imageAlt || item.name}
                            width={64}
                            height={64}
                            className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-700 p-1 shrink-0"
                          />
                        )}
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono uppercase text-cyan-300">
                              {item.variantLabel ||
                                (item.category === 'rental'
                                  ? 'Rental Kit · One-Time Fee'
                                  : 'Outright Hardware Purchase')}
                            </span>
                            {isIneligible && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 text-amber-200 text-[11px] font-bold">
                                Ineligible for {countryConfig.name}
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white break-words">
                            {item.name}
                          </h3>
                          {badEntry && (
                            <p className="text-xs text-amber-200 leading-snug">
                              {badEntry.reason}
                            </p>
                          )}
                          {item.roamingPackageId && (
                            <div className="text-xs text-emerald-300 font-mono break-all">
                              Paired Roaming Plan: {item.roamingPackageId}
                            </div>
                          )}
                          <div className="flex items-baseline gap-2 flex-wrap text-xs font-mono text-slate-200 tabular-nums">
                            <span>
                              Unit: {formatPrice(item.unitPriceBdt, { showBdtReference: currency !== 'BDT' })}
                            </span>
                            {item.referencePriceBdt && item.referencePriceBdt > item.unitPriceBdt && (
                              <span className="line-through text-slate-400 text-xs">
                                {formatBdt(item.referencePriceBdt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="inline-flex items-center rounded-lg border border-slate-600 bg-[#04070c]">
                          <button
                            type="button"
                            aria-label={`Decrease quantity for ${item.name}`}
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-200 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <span className="px-2.5 text-sm font-mono text-white tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Increase quantity for ${item.name}`}
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-slate-200 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>

                        <div className="text-right min-w-[88px] font-mono font-bold text-white text-sm tabular-nums">
                          {formatPrice(item.lineTotalBdt)}
                        </div>

                        <button
                          type="button"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => removeItem(item.productId)}
                          className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-red-300 hover:bg-red-950/30 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}

              {/* Quick Add Buttons */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {featuredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        addItem({
                          productId: p.id,
                          name: p.name,
                          category: p.category,
                          image: p.image,
                          quantity: 1,
                        })
                      }
                      className="min-h-[44px] px-3 py-2 rounded-lg border border-slate-600 bg-[#0b0f17] hover:border-cyan-400 text-slate-100 cursor-pointer text-left"
                    >
                      + {p.shortName || p.name} ({formatPrice(p.price)})
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Delivery Address & Continue to Payment */}
            <form
              onSubmit={handleCheckoutSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-700 bg-[#0b0f17] p-5 sm:p-6 space-y-4 text-xs sm:text-sm lg:sticky lg:top-20 min-w-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">
                  ডেলিভারি ঠিকানা (Delivery Address)
                </h2>
                <div className="inline-flex rounded-lg border border-slate-700 bg-[#04070c] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCheckoutAccountMode('guest')}
                    className={`min-h-[36px] px-3 py-1 rounded-md font-bold cursor-pointer ${
                      checkoutAccountMode === 'guest'
                        ? 'bg-cyan-400 text-[#04131a]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutAccountMode('signed-in')}
                    className={`min-h-[36px] px-3 py-1 rounded-md font-bold cursor-pointer ${
                      checkoutAccountMode === 'signed-in'
                        ? 'bg-cyan-400 text-[#04131a]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Signed-In
                  </button>
                </div>
              </div>

              {/* 1. Destination Country */}
              <div>
                <label htmlFor="cart-shipping-country" className="block text-slate-200 font-semibold mb-1.5">
                  Destination Country *
                </label>
                <select
                  id="cart-shipping-country"
                  data-testid="checkout-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                >
                  {SHIPPING_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} (
                      {c.code === 'BD'
                        ? hasRental
                          ? 'BDT · ৳500 Rental Shipping'
                          : 'BDT · FREE Shipping'
                        : c.carrierAvailable
                        ? 'USD · International Card'
                        : 'Inquiry Only'}
                      )
                    </option>
                  ))}
                </select>
                <CompactShippingNotice countryCode={countryCode} isRental={hasRental} />
                {bdRestrictionViolation && (
                  <div
                    role="alert"
                    className="mt-2 rounded-lg border border-amber-400/55 bg-amber-950/40 p-3 text-amber-100 space-y-2 text-xs"
                  >
                    <div className="flex items-start gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <span>
                        The following item(s) cannot ship to {countryConfig.name}. Remove them or switch Destination Country to Bangladesh (BD):
                      </span>
                    </div>
                    <ul className="space-y-1.5 pl-6">
                      {checkoutEval.ineligibleItems.map((bad) => (
                        <li
                          key={bad.productId}
                          className="flex items-center justify-between gap-2 bg-[#04070c]/60 border border-amber-500/30 rounded px-2.5 py-1.5"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{bad.name}</div>
                            <div className="text-[11px] text-amber-200">{bad.reason}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(bad.productId)}
                            className="shrink-0 px-2.5 py-1 rounded bg-amber-400 hover:bg-amber-300 text-[#04131a] font-bold text-[11px] cursor-pointer"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Complete 10-Field Shipping Address Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cart-full-name" className="block text-slate-200 mb-1 text-xs font-medium">Full Name *</label>
                    <input
                      id="cart-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name *"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-phone" className="block text-slate-200 mb-1 text-xs font-medium">Phone with Country Code *</label>
                    <input
                      id="cart-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1700-000000"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cart-email" className="block text-slate-200 mb-1 text-xs font-medium">Email Address (Optional for Guest)</label>
                  <input
                    id="cart-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cart-house" className="block text-slate-200 mb-1 text-xs font-medium">House / Flat / Suite *</label>
                    <input
                      id="cart-house"
                      type="text"
                      required
                      value={houseFlat}
                      onChange={(e) => setHouseFlat(e.target.value)}
                      placeholder="House 12, Flat 4B"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-road" className="block text-slate-200 mb-1 text-xs font-medium">Road / Street *</label>
                    <input
                      id="cart-road"
                      type="text"
                      required
                      value={roadStreet}
                      onChange={(e) => setRoadStreet(e.target.value)}
                      placeholder="Road 7, Sector 4"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cart-area" className="block text-slate-200 mb-1 text-xs font-medium">Area / Thana *</label>
                    <input
                      id="cart-area"
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Uttara / Gulshan"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-city" className="block text-slate-200 mb-1 text-xs font-medium">City / District *</label>
                    <input
                      id="cart-city"
                      type="text"
                      required
                      value={cityDistrict}
                      onChange={(e) => setCityDistrict(e.target.value)}
                      placeholder="Dhaka"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cart-state" className="block text-slate-200 mb-1 text-xs font-medium">State / Division *</label>
                    <input
                      id="cart-state"
                      type="text"
                      required
                      value={stateDivision}
                      onChange={(e) => setStateDivision(e.target.value)}
                      placeholder="Dhaka Division"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="cart-postal" className="block text-slate-200 mb-1 text-xs font-medium">Postal / ZIP Code *</label>
                    <input
                      id="cart-postal"
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1230"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cart-landmark" className="block text-slate-200 mb-1 text-xs font-medium">Landmark / Delivery Note (Optional)</label>
                  <input
                    id="cart-landmark"
                    type="text"
                    value={landmarkNote}
                    onChange={(e) => setLandmarkNote(e.target.value)}
                    placeholder="Near Metro Station / Call before arrival"
                    className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Totals Breakdown (Authoritative Server-Matched Currency & Rules) */}
              <div className="rounded-lg border border-slate-700 bg-[#04070c] p-4 space-y-2 font-mono tabular-nums text-xs">
                {checkoutEval.isBangladesh && checkoutEval.hasRental && checkoutEval.rentalBreakdown ? (
                  <>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>
                        One-Time Rental / Activation Fee (
                        {checkoutEval.rentalBreakdown.activationCollectionRule === 'upfront'
                          ? 'Upfront'
                          : 'On Activation'}
                        )
                      </span>
                      <span>
                        {formatPayAmount(checkoutEval.rentalBreakdown.activationFeeBdt, 'BDT')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>Upfront Rental Shipping (Bangladesh)</span>
                      <span className="text-white font-semibold">
                        {formatPayAmount(checkoutEval.rentalBreakdown.rentalShippingFeeBdt, 'BDT')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-300">
                      <span>Monthly Starlink Subscription</span>
                      <span>Excluded Today</span>
                    </div>
                    <div className="flex justify-between gap-2 text-white font-bold text-sm pt-2 border-t border-slate-800">
                      <span>Payable Now (BDT)</span>
                      <span>{formatPayAmount(checkoutEval.payableNowAmount, 'BDT')}</span>
                    </div>
                    <div className="rounded-md border border-cyan-500/40 bg-cyan-950/30 p-2.5 text-cyan-100 font-sans text-xs leading-relaxed">
                      {RENTAL_SHIPPING_EXCLUSION_NOTICE_BN}
                    </div>
                    <div className="text-xs text-slate-300 font-sans pt-0.5">
                      Prepaid only in Bangladesh (MFS / Bangla QR, Bank Transfer
                      {stripeConfigured ? ', or Card' : ''}). Cash on Delivery (COD) is not available for Rental Kits.
                    </div>
                  </>
                ) : !checkoutEval.isBangladesh && carrierAvailable ? (
                  <>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>Hardware Subtotal (USD)</span>
                      <span>{formatPayAmount(checkoutEval.subtotalAmount, 'USD')}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>International Shipping ({countryConfig.name})</span>
                      <span className="text-white">
                        {formatPayAmount(checkoutEval.shippingFeeAmount, 'USD')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-300">
                      <span>Monthly Starlink Plan</span>
                      <span>Billed Separately</span>
                    </div>
                    <div className="flex justify-between gap-2 text-white font-bold text-sm pt-2 border-t border-slate-800">
                      <span>Total Payable (USD)</span>
                      <span>{formatPayAmount(checkoutEval.payableNowAmount, 'USD')}</span>
                    </div>
                    <div className="text-xs text-slate-300 font-sans pt-1">
                      International orders to {countryConfig.name} are charged strictly in USD via Card only. MFS, Bank Transfer, Bangla QR, and COD are not available outside Bangladesh.
                    </div>
                    {!stripeConfigured && (
                      <div className="rounded-md border border-amber-400/50 bg-amber-950/35 p-2.5 text-amber-100 font-sans text-xs leading-relaxed">
                        Card checkout is currently unavailable for {countryConfig.name}. Continuing will save an unpaid checkout draft until international Card payment is enabled.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>Hardware Subtotal</span>
                      <span>{formatPayAmount(checkoutEval.subtotalAmount, 'BDT')}</span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-200">
                      <span>Shipping ({countryConfig.name})</span>
                      <span
                        className={
                          checkoutEval.shippingFeeAmount === 0
                            ? 'text-emerald-300 font-bold'
                            : 'text-white'
                        }
                      >
                        {checkoutEval.shippingFeeAmount === 0
                          ? 'FREE (৳0)'
                          : formatPayAmount(checkoutEval.shippingFeeAmount, 'BDT')}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2 text-slate-300">
                      <span>Monthly Starlink Plan</span>
                      <span>Billed Separately</span>
                    </div>
                    <div className="flex justify-between gap-2 text-white font-bold text-sm pt-2 border-t border-slate-800">
                      <span>Total Payable (BDT)</span>
                      <span>{formatPayAmount(checkoutEval.payableNowAmount, 'BDT')}</span>
                    </div>
                    {checkoutEval.codAdvanceRequiredAmount > 0 && codAvailable && (
                      <div className="rounded-md border border-slate-700 bg-[#0b0f17] p-2.5 space-y-1 text-slate-200">
                        <div className="flex justify-between gap-2">
                          <span>If paying by COD — Advance Now</span>
                          <span className="font-bold text-cyan-300">
                            {formatPayAmount(checkoutEval.codAdvanceRequiredAmount, 'BDT')}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span>Remaining Due on Delivery</span>
                          <span>
                            {formatPayAmount(checkoutEval.codRemainingOnDeliveryAmount, 'BDT')}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-slate-300 font-sans pt-1">
                      {codAvailable
                        ? `Eligible on DSLink Pay (BDT): MFS / Bangla QR, Bank Transfer, Cash on Delivery (COD)${stripeConfigured ? ', or Card' : ''}.`
                        : `Prepaid on DSLink Pay (BDT): MFS / Bangla QR or Bank Transfer${stripeConfigured ? ' or Card' : ''}.`}
                    </div>
                    {currency !== 'BDT' && (
                      <div className="text-xs text-slate-400 text-right">
                        Display reference ({currency}):{' '}
                        {formatPrice(subtotalBdt, { includeEstimateLabel: true })} · Charged in BDT
                      </div>
                    )}
                  </>
                )}
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-400/50 bg-red-950/40 p-3 text-red-100 flex items-start gap-2 text-xs sm:text-sm"
                >
                  <AlertCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || items.length === 0 || bdRestrictionViolation}
                className="w-full min-h-[52px] py-3.5 px-5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span>
                  {submitting
                    ? 'পেমেন্ট লিংক তৈরি হচ্ছে...'
                    : !carrierAvailable
                    ? `Submit Delivery Inquiry (${countryConfig.name})`
                    : `পেমেন্টে এগিয়ে যান · Continue to Payment (${formatPayAmount(
                        checkoutEval.payableNowAmount,
                        checkoutEval.currency
                      )})`}
                </span>
                <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
              </button>
            </form>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartCheckoutPage;
