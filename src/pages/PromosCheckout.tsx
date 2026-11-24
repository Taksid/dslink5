import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Truck,
  Zap,
  CheckCircle2,
  Banknote,
  Phone,
  MapPin,
  User,
  Mail,
  Send,
  AlertCircle,
  ChevronRight,
  Star,
  Info,
  Copy,
  Check,
  FileText,
  Globe,
  QrCode,
} from 'lucide-react';
import { initFacebookSdkAndPixel, trackFacebookEvent } from '../lib/facebookSdk';
import {
  GLOBAL_DELIVERY_COPY,
  formatBdt,
  formatBdtBn,
  useCentralPricing,
} from '../lib/pricingConfig';
import {
  SHIPPING_COUNTRIES,
  calculateShipping,
  isCODAvailable,
  isCarrierSupported,
  useSelectedShippingCountry,
} from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { BanglaQrPaymentSection } from '../components/BanglaQrPaymentSection';
import { Footer } from '../components/Footer';

interface PromosCheckoutProps {
  onBackToMainSite?: () => void;
}

export function PromosCheckoutPage({ onBackToMainSite }: PromosCheckoutProps) {
  const { standard4xPrice, miniKitPrice, rentalKitPrice } = useCentralPricing();
  const { countryCode, setCountryCode } = useSelectedShippingCountry();
  const { currency, formatPrice } = useGlobalCurrency();

  const initialProductParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('product') || 'starlink-standard-4x'
      : 'starlink-standard-4x';
  const [selectedProductId, setSelectedProductId] = useState<'starlink-standard-4x' | 'starlink-mini-kit'>(
    initialProductParam.includes('mini') ? 'starlink-mini-kit' : 'starlink-standard-4x'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Guest vs Signed-In Checkout
  const [checkoutMode, setCheckoutMode] = useState<'guest' | 'signed-in'>('guest');

  // Complete 10-Field Shipping Address
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+880 ');
  const [email, setEmail] = useState('');
  const [houseFlat, setHouseFlat] = useState('');
  const [roadStreet, setRoadStreet] = useState('');
  const [area, setArea] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [stateDivision, setStateDivision] = useState('Dhaka Division');
  const [postalCode, setPostalCode] = useState('1212');
  const [landmarkNote, setLandmarkNote] = useState('');

  const [paymentChoice, setPaymentChoice] = useState<'cod' | 'bangla_qr'>('cod');
  const [trxId, setTrxId] = useState('');
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  const previewOrderId = useMemo(
    () => `DS-${Math.floor(100000 + (Date.now() % 900000))}`,
    []
  );

  const selectedProductName =
    selectedProductId === 'starlink-mini-kit'
      ? 'Starlink Mini Kit (Purchase)'
      : 'Starlink Standard Kit 4X (Purchase)';
  const selectedProductImage =
    selectedProductId === 'starlink-mini-kit'
      ? 'https://starlink.com/public-files/Starlink_Hardware_Generic_500x500.png'
      : 'https://starlink.com/public-files/Starlink_Standard_Hero_500x500.png';
  const productPrice =
    selectedProductId === 'starlink-mini-kit' ? miniKitPrice : standard4xPrice;
  const subtotalAmount = productPrice * quantity;
  const carrierSupported = isCarrierSupported(countryCode);
  const shippingFee = carrierSupported ? calculateShipping(countryCode) : 0;
  const totalAmount = subtotalAmount + shippingFee;
  const codEligible = isCODAvailable(countryCode, false);

  useEffect(() => {
    if (!codEligible) {
      setPaymentChoice('bangla_qr');
    }
  }, [codEligible]);

  const activePaymentMethod = codEligible && paymentChoice === 'cod' ? 'cod' : 'bangla_qr';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);
  const [trackingParams, setTrackingParams] = useState<any>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTrackingParams({
      fbclid: params.get('fbclid'),
      utm_source: params.get('utm_source') || 'direct',
      utm_medium: params.get('utm_medium') || 'web',
      utm_campaign: params.get('utm_campaign') || 'dslink_standard_4x_41500',
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
      fbc: params.get('fbclid') ? `fb.1.${Date.now()}.${params.get('fbclid')}` : undefined,
      fbp: `fb.1.${Date.now()}.${Math.floor(Math.random() * 1000000000)}`,
    });
  }, []);

  useEffect(() => {
    initFacebookSdkAndPixel({
      pixelId: '1841420273874673',
      appId: '948271630592814',
      pageId: '104928374650192',
      adAccountId: 'act_38492019482',
      campaignName: 'DSLINK_Starlink_Standard_4X_BD_41500',
      adSetName: 'BD_All_64_Districts_18_55_Tech_ISP',
      capiEnabled: true,
      testEventCode: 'TEST84920',
      currency: 'BDT',
      productValue: productPrice,
      whatsappNumber: '+880 1326-370218',
      domainUrl: 'devsparksoft.com.bd',
    });

    trackFacebookEvent('PageView');
    trackFacebookEvent('ViewContent', {
      content_name: 'Starlink Standard 4X Kit',
      value: productPrice,
      currency: 'BDT',
    });
  }, []);

  const handleInputFocus = () => {
    if (!hasInitiatedCheckout) {
      setHasInitiatedCheckout(true);
      trackFacebookEvent('InitiateCheckout', {
        content_name: 'Starlink Standard 4X Kit',
        value: totalAmount,
        currency: 'BDT',
      });
    }
  };

  const combinedAddress = useMemo(() => {
    return [
      houseFlat.trim(),
      roadStreet.trim(),
      area.trim(),
      district.trim(),
      stateDivision.trim(),
      postalCode.trim(),
      countryCode,
      landmarkNote.trim() ? `Landmark: ${landmarkNote.trim()}` : '',
    ]
      .filter(Boolean)
      .join(', ');
  }, [houseFlat, roadStreet, area, district, stateDivision, postalCode, countryCode, landmarkNote]);

  const handleCopyOrderSummary = (orderData: any) => {
    const payLabel =
      orderData.paymentMethod === 'cod'
        ? 'Cash on Delivery (COD)'
        : 'Bangla QR Scan & Pay / Advance Payment (Awaiting Payment Verification)';
    const summaryText =
      `DSLINK Order #${orderData.orderId}\n` +
      `Product: ${orderData.productName}\n` +
      `Quantity: ${orderData.quantity || 1}\n` +
      `Unit Price: ${formatBdt(orderData.originalPrice || productPrice)} BDT\n` +
      `Total Payable: ${formatBdt(orderData.totalAmount || totalAmount)} BDT\n` +
      `Payment Method: ${payLabel}\n` +
      `Payment Status: ${orderData.paymentStatus}\n` +
      `Fulfillment Status: ${orderData.fulfillmentStatus}\n` +
      `Name: ${orderData.fullName}\n` +
      `Phone: ${orderData.phone}\n` +
      `Address: ${orderData.address}`;

    navigator.clipboard.writeText(summaryText);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (!fullName.trim()) {
      setOrderError('দয়া করে আপনার পূর্ণ নাম লিখুন (Please enter your full name)');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      setOrderError('দয়া করে কান্ট্রি কোডসহ সঠিক মোবাইল নম্বর দিন (e.g. +880 17xxxxxxxx)');
      return;
    }
    if (!houseFlat.trim() || !roadStreet.trim() || !area.trim() || !district.trim() || !stateDivision.trim() || !postalCode.trim()) {
      setOrderError('দয়া করে সম্পূর্ণ ১০-ফিল্ডের ডেলিভারি ঠিকানা পূরণ করুন (House/Flat, Road/Street, Area, City/District, State/Division, Postal Code)');
      return;
    }

    if (!carrierSupported) {
      setOrderError('Selected destination currently requires a Delivery Inquiry. Please use the Worldwide Delivery Inquiry form.');
      return;
    }

    setIsSubmitting(true);
    const shippingAddress10 = {
      fullName: fullName.trim(),
      phone: phone.trim(),
      houseFlat: houseFlat.trim(),
      roadStreet: roadStreet.trim(),
      area: area.trim(),
      cityDistrict: district.trim(),
      stateDivision: stateDivision.trim(),
      postalCode: postalCode.trim(),
      countryCode,
      landmarkNote: landmarkNote.trim() || undefined,
    };

    const orderPayload = {
      orderId: previewOrderId,
      productId: selectedProductId,
      countryCode,
      currency,
      checkoutMode,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: combinedAddress,
      district: countryCode === 'BD' ? district : countryCode,
      shippingAddress: shippingAddress10,
      paymentMethod: activePaymentMethod,
      trxId: trxId.trim() || undefined,
      productName: selectedProductName,
      price: totalAmount,
      originalPrice: productPrice,
      shippingFee,
      discount: 0,
      quantity,
      totalAmount,
      paymentStatus: activePaymentMethod === 'cod' ? 'Pending COD Collection' : 'Awaiting Payment',
      fulfillmentStatus: 'Pending',
      codAmountToCollectBdt: activePaymentMethod === 'cod' ? totalAmount : 0,
      orderDate: new Date().toISOString(),
      ...trackingParams,
    };

    try {
      trackFacebookEvent('Purchase', {
        value: totalAmount,
        currency: 'BDT',
        content_name: selectedProductName,
        content_type: 'product',
        num_items: quantity,
        order_id: previewOrderId,
        ...trackingParams,
        userData: { email: email.trim(), phone: phone.trim() },
      });

      const res = await fetch('/api/promos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOrderError(data?.error || 'Order could not be processed. Please review shipping country and details.');
        return;
      }
      const confirmedTotal = Number(data?.pricing?.totalAmount ?? data?.totalAmount ?? totalAmount);
      const confirmedUnit = Number(data?.pricing?.unitPrice ?? productPrice);
      const confirmedShipping = Number(data?.pricing?.shippingFee ?? shippingFee);
      setOrderSuccess({
        ...orderPayload,
        orderId: data?.orderId || previewOrderId,
        originalPrice: confirmedUnit,
        shippingFee: confirmedShipping,
        price: confirmedTotal,
        totalAmount: confirmedTotal,
      });
    } catch {
      setOrderSuccess(orderPayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-100 font-sans antialiased selection:bg-white selection:text-black pb-28">
      {/* Header */}
      <header className="border-b border-white/15 bg-black/95 backdrop-blur-md sticky top-0 z-40 py-2.5 sm:py-3.5 px-3 sm:px-4 safe-top">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <a href="/" className="flex items-center gap-2 shrink min-w-0">
            <img
              src="/devspark-header-logo.svg"
              alt="DEVSPARK LINK (DSLINK) — DEV SPARK SOFT LIMITED"
              width={308}
              height={74}
              className="w-[136px] min-[375px]:w-[154px] sm:w-[178px] md:w-[194px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
            />
          </a>
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
            <a
              href="/resell"
              className="hidden md:inline-flex px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 hover:text-white font-semibold transition-colors whitespace-nowrap"
            >
              Reseller Portal (15% Off)
            </a>
            <a
              href="/rental"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg border border-white/25 bg-white/5 text-white hover:bg-white/10 font-semibold transition-colors whitespace-nowrap"
            >
              রেন্টাল কিট ({formatBdtBn(rentalKitPrice)})
            </a>
            <a
              href="/"
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg bg-white hover:bg-neutral-200 text-black font-bold transition-colors whitespace-nowrap"
            >
              হোম
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pt-8 md:pt-12">
        {orderSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto py-8">
            <div className="bg-[#0a0a0a] border border-white/25 rounded-xl p-5 sm:p-7 max-w-lg w-full text-center relative my-auto">
              <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                ধন্যবাদ, {orderSuccess.fullName}!
              </h2>

              <p className="text-neutral-300 text-xs sm:text-sm mb-4">
                আপনার {orderSuccess.productName} অর্ডারটি সংরক্ষিত হয়েছে। পেমেন্ট স্ট্যাটাস ও ডেলিভারি স্ট্যাটাস নিচে আলাদাভাবে প্রদর্শিত হচ্ছে।
              </p>

              <div className="bg-[#111113] border border-white/15 rounded-lg p-4 text-left mb-4 text-xs text-neutral-300 space-y-2 font-mono tabular-nums">
                <div className="flex items-center justify-between border-b border-white/15 pb-2 text-white font-bold">
                  <span>অর্ডার নম্বর (Order ID):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white text-sm">#{orderSuccess.orderId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyOrderSummary(orderSuccess)}
                      className="bg-white/10 hover:bg-white/20 text-neutral-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedOrderId ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOrderId ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-neutral-400">পণ্য:</span>
                  <span className="text-white font-bold">{orderSuccess.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">পরিমাণ:</span>
                  <span className="text-white">×{orderSuccess.quantity || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Payment Status:</span>
                  <span className="text-amber-300 font-bold">{orderSuccess.paymentStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Fulfillment Status:</span>
                  <span className="text-emerald-300 font-bold">{orderSuccess.fulfillmentStatus}</span>
                </div>
                {orderSuccess.paymentMethod === 'cod' && (
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>ডেলিভারির সময় পরিশোধযোগ্য (COD):</span>
                    <span>{formatBdt(orderSuccess.totalAmount || totalAmount)} BDT</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-white/10">
                  <span className="text-neutral-300 font-bold">মোট পরিশোধযোগ্য:</span>
                  <span className="text-white font-bold text-sm">
                    {formatBdt(orderSuccess.totalAmount || totalAmount)} BDT
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10 text-[11px]">
                  <span className="text-neutral-400">ঠিকানা:</span>
                  <span className="text-neutral-200 text-right max-w-[240px]">
                    {orderSuccess.address}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleCopyOrderSummary(orderSuccess)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs py-2.5 rounded-lg border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-white" />
                  <span>অর্ডার মেমো কপি করুন</span>
                </button>

                {onBackToMainSite ? (
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      onBackToMainSite();
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer"
                  >
                    মেইন সাইটে যান
                  </button>
                ) : (
                  <a
                    href="/"
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-lg flex items-center justify-center cursor-pointer"
                  >
                    মেইন সাইটে যান
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400 mb-3">
            DEVSPARK LINK · DIRECT STARLINK HARDWARE ORDER &amp; BANGLA QR CHECKOUT
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
            Starlink Hardware Purchase &amp; Bangla QR Checkout
            <span className="block text-neutral-200 mt-1 text-xl sm:text-2xl md:text-3xl font-mono tabular-nums">
              Standard Kit 4X {formatBdt(standard4xPrice)} · Mini Kit {formatBdt(miniKitPrice)}
            </span>
          </h1>

          <p className="text-neutral-300 text-xs sm:text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            DSLink থেকে বাংলাদেশসহ বিশ্বব্যাপী Starlink Standard Kit 4X ({formatBdtBn(standard4xPrice)}) ও Starlink Mini Kit ({formatBdtBn(miniKitPrice)}) অর্ডার করুন। প্রযোজ্য এলাকায় Cash on Delivery (COD) অথবা Bangla QR Scan &amp; Pay (সব অনুমোদিত ব্যাংক ও MFS অ্যাপ) দিয়ে পেমেন্ট করার সুবিধা রয়েছে।
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Column: Product Overview + Bangla QR Scan & Pay Section */}
          <div className="lg:col-span-7 space-y-6">
            {/* Kit Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedProductId('starlink-standard-4x')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedProductId === 'starlink-standard-4x'
                    ? 'bg-[#111113] border-white text-white'
                    : 'bg-[#0a0a0a] border-white/15 text-neutral-300 hover:border-white/35'
                }`}
              >
                <div className="text-[11px] font-mono uppercase text-neutral-400">Purchase · Gen 3 Wi-Fi 6</div>
                <div className="text-sm font-bold text-white mt-1">Starlink Standard Kit 4X</div>
                <div className="text-xl font-mono font-bold tabular-nums text-white mt-1.5">
                  {formatBdt(standard4xPrice)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProductId('starlink-mini-kit')}
                className={`p-4 rounded-xl border text-left transition-colors cursor-pointer ${
                  selectedProductId === 'starlink-mini-kit'
                    ? 'bg-[#111113] border-white text-white'
                    : 'bg-[#0a0a0a] border-white/15 text-neutral-300 hover:border-white/35'
                }`}
              >
                <div className="text-[11px] font-mono uppercase text-neutral-400">Purchase · Portable</div>
                <div className="text-sm font-bold text-white mt-1">Starlink Mini Kit</div>
                <div className="text-xl font-mono font-bold tabular-nums text-white mt-1.5">
                  {formatBdt(miniKitPrice)}
                </div>
              </button>
            </div>

            {/* Premium Bangla QR Scan & Pay Section with Exact QR Image & Logo.dev Bank/MFS Logos */}
            <BanglaQrPaymentSection
              orderId={previewOrderId}
              productSummary={`${selectedProductName} × ${quantity}`}
              amountBdt={totalAmount}
              transactionId={trxId}
              onTransactionIdChange={setTrxId}
              paymentStatus="Awaiting Payment"
            />

            {/* Product Card */}
            <div className="bg-[#0a0a0a] border border-white/15 rounded-xl p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                <div className="rounded-lg overflow-hidden bg-[#111113] border border-white/15 p-3 text-center">
                  <img
                    src={selectedProductImage}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/assets/aistudio/image_1a66081b.png';
                    }}
                    alt={selectedProductName}
                    className="w-full h-44 object-contain rounded mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-2.5 text-[10px] text-neutral-400 font-mono uppercase tracking-wider">
                    Model: {selectedProductName}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-neutral-300 text-xs font-semibold">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-white text-white" />
                      ))}
                    </div>
                    <span className="text-neutral-300 font-mono">4.9/5 (৪৮০+ রিভিউ)</span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {selectedProductName}
                  </h3>

                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-white">
                      {formatBdt(productPrice)}
                    </div>
                    <p className="text-xs text-neutral-400">
                      হার্ডওয়্যার মূল্য · {GLOBAL_DELIVERY_COPY.subscriptionSeparateBn}
                    </p>
                  </div>

                  <div className="bg-[#111113] border border-white/15 rounded-lg p-3.5 text-xs text-neutral-200 space-y-1">
                    <div className="flex items-center gap-2 font-semibold text-white">
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      <span>২৪ মাস রিপ্লেসমেন্ট সাপোর্ট (লিখিত শর্ত প্রযোজ্য)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      Official Sales Invoice, ৩০ দিনের রিফান্ড অঙ্গীকার এবং প্রযোজ্য এলাকায় COD অথবা Bangla QR পেমেন্ট।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Complete 10-Field Shipping Address Checkout Form */}
          <div className="lg:col-span-5">
            <div className="bg-[#0a0a0a] border border-white/20 rounded-xl p-5 sm:p-6 sticky top-20">
              <div className="border-b border-white/15 pb-3.5 mb-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-white shrink-0" />
                    <span>অর্ডার ও ডেলিভারি ফরম</span>
                  </h3>
                  <div className="inline-flex rounded-lg border border-white/15 bg-black p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('guest')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        checkoutMode === 'guest' ? 'bg-white text-black' : 'text-neutral-400'
                      }`}
                    >
                      Guest
                    </button>
                    <button
                      type="button"
                      onClick={() => setCheckoutMode('signed-in')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        checkoutMode === 'signed-in' ? 'bg-white text-black' : 'text-neutral-400'
                      }`}
                    >
                      Signed-In
                    </button>
                  </div>
                </div>
                <p className="text-xs text-neutral-400 mt-1">
                  নিচের ১০-ফিল্ডের ডেলিভারি ঠিকানা পূরণ করে {selectedProductName} অর্ডার সম্পন্ন করুন।
                </p>
              </div>

              {orderError && (
                <div className="bg-red-950/60 border border-red-500/40 rounded-lg p-3 mb-4 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{orderError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitOrder} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      1. পূর্ণ নাম (Full Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="আপনার পূর্ণ নাম"
                      value={fullName}
                      onFocus={handleInputFocus}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      2. ফোন (Phone + Country Code) *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+880 17xxxxxxxx"
                      value={phone}
                      onFocus={handleInputFocus}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white font-mono outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    ইমেইল এড্রেস (Email — Optional for Guest)
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={email}
                    onFocus={handleInputFocus}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white font-mono outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      3. বাসা/ফ্ল্যাট (House / Flat) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="House 14, Flat 3A"
                      value={houseFlat}
                      onFocus={handleInputFocus}
                      onChange={(e) => setHouseFlat(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      4. রোড/স্ট্রিট (Road / Street) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Road 9, Block C"
                      value={roadStreet}
                      onFocus={handleInputFocus}
                      onChange={(e) => setRoadStreet(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      5. এলাকা/থানা (Area) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Banani / Dhanmondi"
                      value={area}
                      onFocus={handleInputFocus}
                      onChange={(e) => setArea(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      6. শহর/জেলা (City / District) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dhaka"
                      value={district}
                      onFocus={handleInputFocus}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      7. বিভাগ/স্টেট (State / Division) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dhaka Division"
                      value={stateDivision}
                      onFocus={handleInputFocus}
                      onChange={(e) => setStateDivision(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      8. পোস্টাল কোড (Postal Code) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1213"
                      value={postalCode}
                      onFocus={handleInputFocus}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white font-mono outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      9. দেশ (Country) *
                    </label>
                    <select
                      value={countryCode}
                      onFocus={handleInputFocus}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                    >
                      {SHIPPING_COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code === 'BD' ? 'FREE · COD' : c.carrierAvailable ? '৳2,500' : 'Inquiry'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-neutral-300 font-semibold mb-1">
                      পরিমাণ (Quantity)
                    </label>
                    <select
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none font-mono text-xs"
                    >
                      {[1, 2, 3, 4, 5].map((q) => (
                        <option key={q} value={q}>
                          {q} Kit{q > 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <CompactShippingNotice
                  countryCode={countryCode}
                  onInquiryClick={() => {
                    window.location.href = '/worldwide-delivery';
                  }}
                />

                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">
                    10. ল্যান্ডমার্ক / ডেলিভারি নোট (Optional Landmark / Delivery Note)
                  </label>
                  <input
                    type="text"
                    placeholder="মসজিদ/স্কুলের পাশে অথবা ডেলিভারির আগে কল করুন"
                    value={landmarkNote}
                    onFocus={handleInputFocus}
                    onChange={(e) => setLandmarkNote(e.target.value)}
                    className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-lg px-3 py-2 text-white outline-none text-xs"
                  />
                </div>

                {/* Payment Method Selection: COD vs Bangla QR Advance Payment */}
                <div className="space-y-2 pt-1">
                  <span className="block text-neutral-300 font-semibold">পেমেন্ট মেথড (Payment Method)</span>
                  {codEligible && (
                    <label className="flex items-start gap-2.5 p-3 rounded-lg border border-white/20 bg-[#111113] cursor-pointer">
                      <input
                        type="radio"
                        name="promo-payment-choice"
                        checked={paymentChoice === 'cod'}
                        onChange={() => setPaymentChoice('cod')}
                        className="mt-0.5 accent-white"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-emerald-400" />
                          <span>ক্যাশ অন ডেলিভারি (Cash on Delivery — COD)</span>
                        </div>
                        <span className="text-[11px] text-amber-300 block mt-0.5">
                          ডেলিভারির সময় পরিশোধযোগ্য (Amount to Collect at Delivery): {formatBdt(totalAmount)} BDT
                        </span>
                      </div>
                    </label>
                  )}

                  <label className="flex items-start gap-2.5 p-3 rounded-lg border border-white/20 bg-[#111113] cursor-pointer">
                    <input
                      type="radio"
                      name="promo-payment-choice"
                      checked={paymentChoice === 'bangla_qr' || !codEligible}
                      onChange={() => setPaymentChoice('bangla_qr')}
                      className="mt-0.5 accent-white"
                    />
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <QrCode className="w-4 h-4 text-emerald-400" />
                        <span>Bangla QR Scan &amp; Pay (bKash, Nagad, Rocket &amp; All Banks)</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        পেমেন্ট যাচাই না হওয়া পর্যন্ত অর্ডার স্ট্যাটাস &ldquo;Awaiting Payment&rdquo; থাকবে।
                      </span>
                    </div>
                  </label>
                </div>

                <div className="bg-[#111113] border border-white/15 rounded-lg p-3.5 space-y-2 text-xs font-mono tabular-nums">
                  <div className="flex justify-between text-neutral-300">
                    <span>
                      {selectedProductName} (×{quantity})
                    </span>
                    <span>{formatBdt(subtotalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Shipping ({countryCode === 'BD' ? 'Steadfast / Pathao' : 'DHL / FedEx'})</span>
                    <span>{shippingFee === 0 ? '৳0 (FREE)' : formatBdt(shippingFee)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-white/15">
                    <span>সর্বমোট পরিশোধযোগ্য ({activePaymentMethod === 'cod' ? 'COD' : 'Bangla QR'}):</span>
                    <span className="text-right">
                      <span className="block text-white text-base">{formatBdt(totalAmount)} BDT</span>
                      {currency !== 'BDT' && (
                        <span className="block text-[11px] text-neutral-400 font-normal">
                          ≈ {formatPrice(totalAmount)} ({currency})
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !carrierSupported}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm sm:text-base py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-colors"
                >
                  {isSubmitting ? (
                    <span>অর্ডার প্রসেস হচ্ছে...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>অর্ডার নিশ্চিত করুন ({formatBdt(totalAmount)})</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
export default PromosCheckoutPage;
