import React, { useEffect, useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Send,
  Banknote,
  CreditCard,
  QrCode,
  RefreshCw,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { BanglaQrPaymentSection } from '../components/BanglaQrPaymentSection';
import { useCart } from '../lib/cartStore';
import { SHIPPING_COUNTRIES, useSelectedShippingCountry } from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import {
  CORE_FEATURED_VARIANT_IDS,
  useCentralPricing,
  formatBdt,
} from '../lib/pricingConfig';

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

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { countryCode, setCountryCode, countryConfig } = useSelectedShippingCountry();
  const { currency, formatPrice } = useGlobalCurrency();
  const { pricing, standard4xPrice } = useCentralPricing();
  const {
    items,
    itemCount,
    subtotalBdt,
    shippingFeeBdt,
    totalBdt,
    hasRental,
    hasBangladeshOnlyItem,
    codAvailable,
    carrierAvailable,
    addItem,
    setQuantity,
    removeItem,
    clear,
  } = useCart(countryCode);

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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid' | 'stripe'>('cod');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<any | null>(null);
  const [inquirySubmittedId, setInquirySubmittedId] = useState<string | null>(null);

  // Server-side Stripe availability flag (defaults to false — hidden in production)
  const [stripeEnabled, setStripeEnabled] = useState(false);

  // Return banner state after Stripe redirect (?stripe=success|cancel&orderId=...)
  const [stripeReturnState, setStripeReturnState] = useState<{
    outcome: 'success' | 'cancel';
    orderId: string;
    loading: boolean;
    order: ServerOrderStatus | null;
    error?: string;
  } | null>(null);

  const previewOrderId = useMemo(
    () => `DS-${Math.floor(100000 + (Date.now() % 900000))}`,
    []
  );

  const featuredProducts = useMemo(
    () => CORE_FEATURED_VARIANT_IDS.map((id) => pricing.products[id]).filter(Boolean),
    [pricing]
  );

  const bdRestrictionViolation = hasBangladeshOnlyItem && countryCode !== 'BD';

  useEffect(() => {
    window.scrollTo(0, 0);

    // Query authoritative server payment feature flags (Stripe hidden unless STRIPE_ENABLED=true)
    fetch('/api/payments/config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.stripeEnabled === true) {
          setStripeEnabled(true);
        } else {
          setStripeEnabled(false);
        }
      })
      .catch(() => setStripeEnabled(false));
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

  // Automatically switch away from COD when COD is unavailable (outside BD or Rental Kit)
  useEffect(() => {
    if (!codAvailable && paymentMethod === 'cod') {
      setPaymentMethod('prepaid');
    }
  }, [codAvailable, paymentMethod]);

  // If Stripe becomes disabled while selected, revert cleanly
  useEffect(() => {
    if (!stripeEnabled && paymentMethod === 'stripe') {
      setPaymentMethod(codAvailable ? 'cod' : 'prepaid');
    }
  }, [stripeEnabled, paymentMethod, codAvailable]);

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

  const productSummaryText = useMemo(() => {
    if (items.length === 0) return 'Starlink Standard 4X — Bangladesh Residential Purchase';
    return items.map((i) => `${i.name} × ${i.quantity}`).join(', ');
  }, [items]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your cart is empty. Please add a Starlink Kit first.');
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
      !houseFlat.trim() ||
      !roadStreet.trim() ||
      !area.trim() ||
      !cityDistrict.trim() ||
      !stateDivision.trim() ||
      !postalCode.trim()
    ) {
      setError(
        'Please complete all required shipping address fields (Full Name, Phone with Country Code, House/Flat, Road/Street, Area, City/District, State/Division, and Postal Code).'
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

      const wantsStripe = stripeEnabled && paymentMethod === 'stripe';
      const effectiveMethod = wantsStripe
        ? 'stripe_checkout'
        : codAvailable && paymentMethod === 'cod'
        ? 'cod'
        : countryCode === 'BD' || hasRental
        ? 'bangla_qr'
        : 'international_prepaid';

      const res = await fetch('/api/promos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: previewOrderId,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          district: cityDistrict.trim() || 'Dhaka',
          address: combinedStreetAddress,
          shippingAddress: shippingAddress10,
          countryCode,
          currency,
          checkoutMode: checkoutAccountMode,
          paymentMethod: effectiveMethod,
          trxId: wantsStripe ? '' : trxId.trim(),
          items: items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Order submission failed.');
      }

      // Persist short-lived session order access token so Stripe return can read live order status
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

      if (wantsStripe) {
        const stripeRes = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: data.orderId,
            orderAccessToken: data.orderAccessToken,
          }),
        });
        const stripeData = await stripeRes.json().catch(() => ({}));
        if (!stripeRes.ok || !stripeData?.url) {
          throw new Error(
            stripeData?.error || 'Unable to initiate Stripe Checkout. Please use Bangla QR or COD.'
          );
        }
        clear();
        window.location.assign(stripeData.url);
        return;
      }

      setOrderReceipt({
        ...data,
        shippingAddress: shippingAddress10,
        paymentStatus:
          effectiveMethod === 'cod' ? 'Pending COD Collection' : 'Awaiting Payment',
        fulfillmentStatus: 'Pending',
        codAmountToCollectBdt: effectiveMethod === 'cod' ? data.totalAmount : 0,
      });
      clear();
    } catch (err: any) {
      setError(err?.message || 'Unable to process checkout. Please try again.');
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
              SERVER-VALIDATED PRICING · BANGLA QR SCAN &amp; PAY · WORLDWIDE SHIPPING
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1 break-words">
              Shopping Cart &amp; Bangla QR / Worldwide Checkout ({itemCount})
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

        {orderReceipt ? (
          <section className="rounded-xl border border-emerald-500/45 bg-[#0b1310] p-6 sm:p-8 space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 shrink-0" aria-hidden="true" />
              <h2 className="text-xl font-bold text-white break-all">
                Order #{orderReceipt.orderId} Recorded
              </h2>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              Your order has been saved with server-validated pricing and 10-field shipping address details. Manual payments remain in Awaiting Payment until verified by our team.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-slate-700 bg-[#04070c] p-4 text-xs font-mono tabular-nums">
              <div>
                <dt className="text-slate-400">Order ID</dt>
                <dd className="text-white font-bold break-all">#{orderReceipt.orderId}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Fulfillment Status</dt>
                <dd className="text-amber-300 font-bold">{orderReceipt.fulfillmentStatus || 'Pending'}</dd>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <dt className="text-slate-400">Selected Item(s)</dt>
                <dd className="text-white font-bold break-words">{orderReceipt.productName}</dd>
                {Array.isArray(orderReceipt.items) && orderReceipt.items.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {orderReceipt.items.map((it: any, idx: number) =>
                      it?.variantLabel ? (
                        <span
                          key={`${it.productId || idx}-${it.variantLabel}`}
                          className="inline-block text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-400/45 bg-cyan-950/40 text-cyan-200"
                        >
                          {it.variantLabel}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
              </div>
              <div>
                <dt className="text-slate-400">Payment Status</dt>
                <dd className="text-amber-300 font-bold">{orderReceipt.paymentStatus || 'Awaiting Payment'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Payment Method</dt>
                <dd className="text-white uppercase">{orderReceipt.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Shipping Destination</dt>
                <dd className="text-white break-words">
                  {orderReceipt.countryCode} ({(orderReceipt.carriers || []).join(' / ')})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Shipping Fee</dt>
                <dd className="text-white">
                  {orderReceipt.shippingFee === 0 ? 'FREE (৳0)' : formatBdt(orderReceipt.shippingFee)}
                </dd>
              </div>
              {orderReceipt.paymentMethod === 'cod' && (
                <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex justify-between gap-2 text-amber-300 font-bold">
                  <span>Amount to Collect at Delivery (COD):</span>
                  <span>{formatBdt(orderReceipt.totalAmount)} BDT</span>
                </div>
              )}
              <div className="sm:col-span-2 pt-2 border-t border-slate-800 flex justify-between gap-2 text-sm">
                <span className="text-slate-200">Authoritative Total Payable:</span>
                <span className="text-white font-bold">{formatBdt(orderReceipt.totalAmount)} BDT</span>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`/track/${encodeURIComponent(orderReceipt.orderId)}`}
                className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-cyan-400 text-[#04131a] font-bold text-xs sm:text-sm hover:bg-cyan-300"
              >
                Track Order Status
              </a>
              <button
                type="button"
                onClick={() => setOrderReceipt(null)}
                className="min-h-[44px] inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-900 text-white text-xs sm:text-sm font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Place Another Order
              </button>
            </div>
          </section>
        ) : inquirySubmittedId ? (
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
            {/* Left Column: Cart Items + Bangla QR Scan & Pay Section */}
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
                  {items.map((item) => (
                    <div
                      key={`${item.productId}-${item.roamingPackageId || ''}`}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                          <div className="text-xs font-mono uppercase text-cyan-300">
                            {item.variantLabel ||
                              (item.category === 'rental'
                                ? 'Rental Kit · One-Time Fee'
                                : 'Outright Hardware Purchase')}
                          </div>
                          <h3 className="text-sm sm:text-base font-bold text-white break-words">
                            {item.name}
                          </h3>
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
                  ))}
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

              {/* Official Bangla QR Scan & Pay Section */}
              <BanglaQrPaymentSection
                orderId={previewOrderId}
                productSummary={productSummaryText}
                amountBdt={totalBdt > 0 ? totalBdt : standard4xPrice}
                transactionId={trxId}
                onTransactionIdChange={setTrxId}
                paymentStatus="Awaiting Payment"
              />
            </div>

            {/* Right Column: 10-Field Shipping Address & Order Submission Form */}
            <form
              onSubmit={handleCheckoutSubmit}
              className="lg:col-span-5 rounded-xl border border-slate-700 bg-[#0b0f17] p-5 sm:p-6 space-y-4 text-xs sm:text-sm lg:sticky lg:top-20 min-w-0"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h2 className="text-base font-bold text-white">
                  10-Field Shipping Address &amp; Checkout
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
                      {c.name} ({c.code === 'BD' ? 'FREE' : c.carrierAvailable ? '৳2,500' : 'Inquiry'})
                    </option>
                  ))}
                </select>
                <CompactShippingNotice countryCode={countryCode} isRental={hasRental} />
                {bdRestrictionViolation && (
                  <div className="mt-2 rounded-lg border border-amber-400/55 bg-amber-950/40 p-3 text-amber-100 flex items-start gap-2 text-xs">
                    <AlertCircle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>
                      Bangladesh Residential &amp; Standard 4X Rental items ship within Bangladesh (BD) only. Switch destination to Bangladesh or select the Roam Unlimited / Global Roam variant.
                    </span>
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

              {/* Payment Method Selection */}
              {carrierAvailable && (
                <div className="space-y-2 pt-2">
                  <span className="block text-slate-200 font-semibold">Payment Method</span>
                  <div className="grid grid-cols-1 gap-2">
                    {codAvailable && (
                      <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-600 bg-[#04070c] hover:border-cyan-400/60 cursor-pointer">
                        <input
                          type="radio"
                          name="cart-payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-cyan-400 mt-1 w-4 h-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm">
                            <Banknote className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                            <span>Cash on Delivery (COD — Bangladesh Only)</span>
                          </div>
                          <span className="text-xs text-amber-300 block mt-0.5">
                            Amount to Collect at Delivery: {formatBdt(totalBdt)} BDT
                          </span>
                        </div>
                      </label>
                    )}

                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-600 bg-[#04070c] hover:border-cyan-400/60 cursor-pointer">
                      <input
                        type="radio"
                        name="cart-payment"
                        checked={paymentMethod === 'prepaid' || (!codAvailable && paymentMethod !== 'stripe')}
                        onChange={() => setPaymentMethod('prepaid')}
                        className="accent-cyan-400 mt-1 w-4 h-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm">
                          <QrCode className="w-4 h-4 text-emerald-300 shrink-0" aria-hidden="true" />
                          <span>
                            {countryCode === 'BD'
                              ? 'Bangla QR Scan & Pay (bKash, Nagad, Rocket & All Banks)'
                              : 'Advance Payment (Bangla QR / International Wire / MFS)'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300 block mt-0.5">
                          Status remains Awaiting Payment until verified by DSLink finance.
                        </span>
                      </div>
                    </label>

                    {/* Stripe Checkout option — rendered ONLY when server STRIPE_ENABLED=true */}
                    {stripeEnabled && (
                      <label
                        data-testid="stripe-checkout-option"
                        className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-600 bg-[#04070c] hover:border-cyan-400/60 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="cart-payment"
                          checked={paymentMethod === 'stripe'}
                          onChange={() => setPaymentMethod('stripe')}
                          className="accent-cyan-400 mt-1 w-4 h-4 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-white font-bold text-xs sm:text-sm">
                            <CreditCard className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
                            <span>Pay Online with Card (Stripe Hosted Checkout)</span>
                          </div>
                          <span className="text-xs text-slate-300 block mt-0.5">
                            Redirects to Stripe Hosted Checkout. Payment confirmed via verified webhook.
                          </span>
                        </div>
                      </label>
                    )}
                  </div>

                  {paymentMethod === 'prepaid' && (
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Bangla QR / MFS / Bank Transaction ID (TrxID)"
                      className="w-full min-h-[44px] bg-[#04070c] border border-slate-600 focus:border-cyan-400 rounded-lg px-3 py-2 text-white placeholder:text-slate-400 font-mono text-sm outline-none"
                    />
                  )}
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="rounded-lg border border-slate-700 bg-[#04070c] p-4 space-y-2 font-mono tabular-nums text-xs">
                <div className="flex justify-between gap-2 text-slate-200">
                  <span>Hardware Subtotal</span>
                  <span>{formatPrice(subtotalBdt)}</span>
                </div>
                <div className="flex justify-between gap-2 text-slate-200">
                  <span>Shipping ({countryConfig.name})</span>
                  <span className={shippingFeeBdt === 0 ? 'text-emerald-300 font-bold' : 'text-white'}>
                    {shippingFeeBdt === 0 ? 'FREE (৳0)' : formatPrice(shippingFeeBdt)}
                  </span>
                </div>
                <div className="flex justify-between gap-2 text-slate-300">
                  <span>Monthly Starlink Plan</span>
                  <span>Billed Separately</span>
                </div>
                <div className="flex justify-between gap-2 text-white font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Total Payable</span>
                  <span>{formatPrice(totalBdt, { includeEstimateLabel: currency !== 'BDT' })}</span>
                </div>
                {paymentMethod === 'cod' && codAvailable && (
                  <div className="text-xs text-amber-300 font-bold flex justify-between gap-2 pt-1">
                    <span>COD Amount to Collect at Delivery:</span>
                    <span>{formatBdt(totalBdt)} BDT</span>
                  </div>
                )}
                {currency !== 'BDT' && (
                  <div className="text-xs text-slate-300 text-right">
                    Authoritative BDT Total: {formatBdt(totalBdt)} BDT
                  </div>
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
                className="w-full min-h-[48px] py-3.5 px-5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>
                  {submitting
                    ? 'Processing Order...'
                    : !carrierAvailable
                    ? `Submit Delivery Inquiry (${countryConfig.name})`
                    : stripeEnabled && paymentMethod === 'stripe'
                    ? `Continue to Stripe Checkout (${formatPrice(totalBdt)})`
                    : `Place Order (${formatPrice(totalBdt)})`}
                </span>
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
