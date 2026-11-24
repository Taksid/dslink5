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
  UserCheck,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { BanglaQrPaymentSection } from '../components/BanglaQrPaymentSection';
import { useCart } from '../lib/cartStore';
import { SHIPPING_COUNTRIES, useSelectedShippingCountry } from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { useCentralPricing, formatBdt } from '../lib/pricingConfig';

interface CartCheckoutPageProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const CartCheckoutPage: React.FC<CartCheckoutPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { countryCode, setCountryCode, countryConfig } = useSelectedShippingCountry();
  const { currency, formatPrice } = useGlobalCurrency();
  const { standard4xPrice, miniKitPrice, rentalKitPrice } = useCentralPricing();
  const {
    items,
    itemCount,
    subtotalBdt,
    shippingFeeBdt,
    totalBdt,
    hasRental,
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

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'prepaid'>('cod');
  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderReceipt, setOrderReceipt] = useState<any | null>(null);
  const [inquirySubmittedId, setInquirySubmittedId] = useState<string | null>(null);

  const previewOrderId = useMemo(
    () => `DS-${Math.floor(100000 + (Date.now() % 900000))}`,
    []
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Shopping Cart & Bangla QR / Worldwide Checkout | DSLink';
  }, []);

  // Automatically switch to Advance Payment when COD is unavailable (outside BD or Rental Kit)
  useEffect(() => {
    if (!codAvailable) {
      setPaymentMethod('prepaid');
    }
  }, [codAvailable]);

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
    if (items.length === 0) return 'Starlink Standard Kit 4X';
    return items.map((i) => `${i.name} × ${i.quantity}`).join(', ');
  }, [items]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError('Your cart is empty. Please add a Starlink Kit first.');
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
      setError('Please complete all required shipping address fields (Full Name, Phone with Country Code, House/Flat, Road/Street, Area, City/District, State/Division, and Postal Code).');
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

      const effectiveMethod =
        codAvailable && paymentMethod === 'cod'
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
          trxId: trxId.trim(),
          items: items.map((i) => ({ productId: i.productId, name: i.name, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Order submission failed.');
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
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="Cart & Global Checkout"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1220px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/15 pb-5">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              SERVER-VALIDATED PRICING · BANGLA QR SCAN &amp; PAY · WORLDWIDE SHIPPING
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              Shopping Cart &amp; Bangla QR / Worldwide Checkout ({itemCount})
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/resell"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              Apply as a DSLink Reseller (15% Off) →
            </a>
            <a
              href="/kits"
              className="text-xs text-neutral-300 hover:text-white underline underline-offset-4"
            >
              Continue Shopping →
            </a>
          </div>
        </div>

        {orderReceipt ? (
          <section className="rounded-xl border border-emerald-500/40 bg-[#0b100d] p-6 sm:p-8 space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center gap-2.5 text-emerald-300">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-white">Order #{orderReceipt.orderId} Recorded</h2>
            </div>
            <p className="text-sm text-neutral-300">
              Your order has been saved with server-validated pricing and 10-field shipping address details. Payment status and fulfillment status are tracked separately below.
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-white/10 bg-black p-4 text-xs font-mono tabular-nums">
              <div>
                <dt className="text-neutral-500">Order ID</dt>
                <dd className="text-white font-bold">#{orderReceipt.orderId}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Fulfillment Status</dt>
                <dd className="text-amber-300 font-bold">{orderReceipt.fulfillmentStatus || 'Pending'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Payment Status</dt>
                <dd className="text-emerald-300 font-bold">{orderReceipt.paymentStatus || 'Awaiting Payment'}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Payment Method</dt>
                <dd className="text-white uppercase">{orderReceipt.paymentMethod}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Shipping Destination</dt>
                <dd className="text-white">
                  {orderReceipt.countryCode} ({(orderReceipt.carriers || []).join(' / ')})
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Shipping Fee</dt>
                <dd className="text-white">
                  {orderReceipt.shippingFee === 0 ? 'FREE (৳0)' : formatBdt(orderReceipt.shippingFee)}
                </dd>
              </div>
              {orderReceipt.paymentMethod === 'cod' && (
                <div className="sm:col-span-2 pt-2 border-t border-white/10 flex justify-between text-amber-300 font-bold">
                  <span>Amount to Collect at Delivery (COD):</span>
                  <span>{formatBdt(orderReceipt.totalAmount)} BDT</span>
                </div>
              )}
              <div className="sm:col-span-2 pt-2 border-t border-white/10 flex justify-between text-sm">
                <span className="text-neutral-300">Authoritative Total Payable:</span>
                <span className="text-white font-bold">{formatBdt(orderReceipt.totalAmount)} BDT</span>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3 pt-2">
              <a
                href={`/track/${encodeURIComponent(orderReceipt.orderId)}`}
                className="px-4 py-2.5 rounded-lg bg-white text-black font-bold text-xs hover:bg-neutral-200"
              >
                Track Order Status
              </a>
              <button
                type="button"
                onClick={() => setOrderReceipt(null)}
                className="px-4 py-2.5 rounded-lg border border-white/25 text-white text-xs font-semibold hover:bg-white/10 cursor-pointer"
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
            <div className="lg:col-span-7 space-y-6">
              {items.length === 0 ? (
                <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-6 space-y-5">
                  <div className="flex items-center gap-2 text-white">
                    <ShoppingBag className="w-5 h-5" />
                    <h2 className="text-base font-bold">Your Cart is Empty — Quick Add Starlink Kits</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'starlink-standard-4x', name: 'Starlink Standard Kit 4X (Purchase)', price: standard4xPrice, category: 'purchase' as const },
                      { id: 'starlink-mini-kit', name: 'Starlink Mini Kit (Purchase)', price: miniKitPrice, category: 'purchase' as const },
                      { id: 'starlink-rental-kit', name: 'Starlink Rental Kit', price: rentalKitPrice, category: 'rental' as const },
                    ].map((p) => (
                      <div key={p.id} className="rounded-lg border border-white/15 bg-black p-4 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="text-xs font-bold text-white leading-snug">{p.name}</div>
                          <div className="text-base font-mono font-bold text-white mt-1 tabular-nums">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => addItem({ productId: p.id, name: p.name, category: p.category, quantity: 1 })}
                          className="w-full py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/15 bg-[#0b0b0e] divide-y divide-white/10">
                  {items.map((item) => (
                    <div key={`${item.productId}-${item.roamingPackageId || ''}`} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="min-w-0 space-y-1">
                        <div className="text-[11px] font-mono uppercase text-neutral-400">
                          {item.category === 'rental' ? 'Rental Kit · One-Time Charge' : 'Outright Hardware Purchase'}
                        </div>
                        <h3 className="text-sm font-bold text-white">{item.name}</h3>
                        {item.roamingPackageId && (
                          <div className="text-[11px] text-emerald-300 font-mono">
                            Paired Roaming Plan: {item.roamingPackageId}
                          </div>
                        )}
                        <div className="text-xs font-mono text-neutral-300 tabular-nums">
                          Unit: {formatPrice(item.unitPriceBdt, { showBdtReference: currency !== 'BDT' })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <div className="inline-flex items-center rounded-lg border border-white/20 bg-black">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            className="p-2 text-neutral-300 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-mono text-white tabular-nums">{item.quantity}</span>
                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            className="p-2 text-neutral-300 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right min-w-[90px] font-mono font-bold text-white text-sm tabular-nums">
                          {formatPrice(item.lineTotalBdt)}
                        </div>

                        <button
                          type="button"
                          aria-label="Remove item"
                          onClick={() => removeItem(item.productId)}
                          className="p-1.5 text-neutral-400 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Buttons */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => addItem({ productId: 'starlink-standard-4x', name: 'Starlink Standard Kit 4X (Purchase)', category: 'purchase', quantity: 1 })}
                    className="px-3 py-1.5 rounded-lg border border-white/20 bg-[#0b0b0e] hover:border-white/40 text-neutral-200 cursor-pointer"
                  >
                    + Standard Kit 4X ({formatPrice(standard4xPrice)})
                  </button>
                  <button
                    type="button"
                    onClick={() => addItem({ productId: 'starlink-mini-kit', name: 'Starlink Mini Kit (Purchase)', category: 'purchase', quantity: 1 })}
                    className="px-3 py-1.5 rounded-lg border border-white/20 bg-[#0b0b0e] hover:border-white/40 text-neutral-200 cursor-pointer"
                  >
                    + Mini Kit ({formatPrice(miniKitPrice)})
                  </button>
                </div>
              )}

              {/* Premium Bangla QR Scan & Pay Section with Official Logo.dev Bank & MFS Logos */}
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
              className="lg:col-span-5 rounded-xl border border-white/20 bg-[#0b0b0e] p-5 sm:p-6 space-y-4 text-xs sticky top-20"
            >
              <div className="flex items-center justify-between border-b border-white/15 pb-3">
                <h2 className="text-base font-bold text-white">
                  10-Field Shipping Address &amp; Checkout
                </h2>
                <div className="inline-flex rounded-lg border border-white/15 bg-black p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setCheckoutAccountMode('guest')}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      checkoutAccountMode === 'guest' ? 'bg-white text-black' : 'text-neutral-400'
                    }`}
                  >
                    Guest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutAccountMode('signed-in')}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      checkoutAccountMode === 'signed-in' ? 'bg-white text-black' : 'text-neutral-400'
                    }`}
                  >
                    Signed-In
                  </button>
                </div>
              </div>

              {/* 1. Destination Country */}
              <div>
                <label htmlFor="cart-shipping-country" className="block text-neutral-300 font-semibold mb-1.5">
                  Destination Country *
                </label>
                <select
                  id="cart-shipping-country"
                  data-testid="checkout-country-select"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2.5 text-white text-sm outline-none"
                >
                  {SHIPPING_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code === 'BD' ? 'FREE' : c.carrierAvailable ? '৳2,500' : 'Inquiry'})
                    </option>
                  ))}
                </select>
                <CompactShippingNotice countryCode={countryCode} isRental={hasRental} />
              </div>

              {/* Complete 10-Field Shipping Address Grid */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name *"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Phone with Country Code *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+880 1700-000000"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Email Address (Optional for Guest)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">House / Flat / Suite *</label>
                    <input
                      type="text"
                      required
                      value={houseFlat}
                      onChange={(e) => setHouseFlat(e.target.value)}
                      placeholder="House 12, Flat 4B"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Road / Street *</label>
                    <input
                      type="text"
                      required
                      value={roadStreet}
                      onChange={(e) => setRoadStreet(e.target.value)}
                      placeholder="Road 7, Sector 4"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">Area / Thana *</label>
                    <input
                      type="text"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      placeholder="Uttara / Gulshan"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      value={cityDistrict}
                      onChange={(e) => setCityDistrict(e.target.value)}
                      placeholder="Dhaka"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-400 mb-1">State / Division *</label>
                    <input
                      type="text"
                      required
                      value={stateDivision}
                      onChange={(e) => setStateDivision(e.target.value)}
                      placeholder="Dhaka Division"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Postal / ZIP Code *</label>
                    <input
                      type="text"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="1230"
                      className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-400 mb-1">Landmark / Delivery Note (Optional)</label>
                  <input
                    type="text"
                    value={landmarkNote}
                    onChange={(e) => setLandmarkNote(e.target.value)}
                    placeholder="Near Metro Station / Call before arrival"
                    className="w-full bg-black border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white text-sm outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selection */}
              {carrierAvailable && (
                <div className="space-y-2 pt-2">
                  <span className="block text-neutral-300 font-semibold">Payment Method</span>
                  <div className="grid grid-cols-1 gap-2">
                    {codAvailable && (
                      <label className="flex items-start gap-2.5 p-3 rounded-lg border border-white/20 bg-black cursor-pointer">
                        <input
                          type="radio"
                          name="cart-payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-white mt-0.5"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 text-white font-bold">
                            <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Cash on Delivery (COD — Bangladesh Only)</span>
                          </div>
                          <span className="text-[11px] text-amber-300 block mt-0.5">
                            Amount to Collect at Delivery: {formatBdt(totalBdt)} BDT
                          </span>
                        </div>
                      </label>
                    )}
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-white/20 bg-black cursor-pointer">
                      <input
                        type="radio"
                        name="cart-payment"
                        checked={paymentMethod === 'prepaid' || !codAvailable}
                        onChange={() => setPaymentMethod('prepaid')}
                        className="accent-white mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 text-white font-bold">
                          <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>
                            {countryCode === 'BD'
                              ? 'Bangla QR Scan & Pay (All Supported Banks & MFS)'
                              : 'Advance Payment (Bangla QR / International Wire / MFS)'}
                          </span>
                        </div>
                        <span className="text-[11px] text-neutral-400 block mt-0.5">
                          Status remains Awaiting Payment until verified by DSLink finance.
                        </span>
                      </div>
                    </label>
                  </div>

                  {(paymentMethod === 'prepaid' || !codAvailable) && (
                    <input
                      type="text"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      placeholder="Bangla QR / MFS / Bank Transaction ID (TrxID)"
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                    />
                  )}
                </div>
              )}

              {/* Totals Breakdown */}
              <div className="rounded-lg border border-white/15 bg-black p-4 space-y-2 font-mono tabular-nums">
                <div className="flex justify-between text-neutral-300">
                  <span>Hardware Subtotal</span>
                  <span>{formatPrice(subtotalBdt)}</span>
                </div>
                <div className="flex justify-between text-neutral-300">
                  <span>Shipping ({countryConfig.name})</span>
                  <span className={shippingFeeBdt === 0 ? 'text-emerald-300 font-bold' : 'text-white'}>
                    {shippingFeeBdt === 0 ? 'FREE (৳0)' : formatPrice(shippingFeeBdt)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500 text-[11px]">
                  <span>Monthly Starlink Plan</span>
                  <span>Billed Separately</span>
                </div>
                <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/15">
                  <span>Total Payable</span>
                  <span>{formatPrice(totalBdt, { includeEstimateLabel: currency !== 'BDT' })}</span>
                </div>
                {paymentMethod === 'cod' && codAvailable && (
                  <div className="text-[11px] text-amber-300 font-bold flex justify-between pt-1">
                    <span>COD Amount to Collect at Delivery:</span>
                    <span>{formatBdt(totalBdt)} BDT</span>
                  </div>
                )}
                {currency !== 'BDT' && (
                  <div className="text-[11px] text-neutral-400 text-right">
                    Authoritative BDT Total: {formatBdt(totalBdt)} BDT
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-950/30 p-3 text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || items.length === 0}
                className="w-full py-3.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? 'Processing Order...'
                    : !carrierAvailable
                    ? `Submit Delivery Inquiry (${countryConfig.name})`
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
