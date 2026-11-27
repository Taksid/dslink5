import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  HelpCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { BanglaQrPaymentBox, QrPaymentChannel } from '../components/BanglaQrPaymentBox';
import { CompactShippingNotice } from '../components/CompactShippingNotice';
import { useGeoLanguage } from '../lib/geoLanguage';
import { notifyAdminActivity } from '../lib/activityNotify';
import {
  GLOBAL_DELIVERY_COPY,
  RENTAL_TERMS_SUMMARY,
  formatBdt,
  formatBdtBn,
  useCentralPricing,
} from '../lib/pricingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';

interface RentalPlanPageProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

interface RentalServicePlan {
  id: 'residential-lite' | 'residential-unlimited';
  nameBn: string;
  nameMy: string;
  nameEn: string;
  speed: string;
  subFee: number;
  summaryBn: string;
  summaryMy: string;
  summaryEn: string;
}

const RESIDENTIAL_RENTAL_PLANS: RentalServicePlan[] = [
  {
    id: 'residential-lite',
    nameBn: 'Residential Lite',
    nameMy: 'Residential Lite',
    nameEn: 'Residential Lite',
    speed: '200 Mbps',
    subFee: 4200,
    summaryBn: 'মাসিক সাবস্ক্রিপশন আলাদাভাবে প্রযোজ্য',
    summaryMy: 'လစဉ် Subscription ကြေး သီးခြားပေးရမည်',
    summaryEn: 'Monthly Starlink subscription billed separately',
  },
  {
    id: 'residential-unlimited',
    nameBn: 'Residential Unlimited',
    nameMy: 'Residential Unlimited',
    nameEn: 'Residential Unlimited',
    speed: '400+ Mbps',
    subFee: 6000,
    summaryBn: 'মাসিক সাবস্ক্রিপশন আলাদাভাবে প্রযোজ্য',
    summaryMy: 'လစဉ် Subscription ကြေး သီးခြားပေးရမည်',
    summaryEn: 'Monthly Starlink subscription billed separately',
  },
];

const RENTAL_KIT_MODEL = {
  id: 'starlink-rental-kit',
  title: 'Starlink Standard 4X — Rental',
  hardwareLabel: 'Standard 4X (Gen 3) · Fixed-Location Rental',
  shortTagBn: 'ফিক্সড লোকেশন Residential রেন্টাল কিট (সর্বোচ্চ ৫ টিবি/মাস · কোনো রোমিং বা COD নেই)',
  shortTagEn: 'Fixed-location Residential rental kit (up to 5 TB/month · no travel/roaming · no COD)',
  image: '/assets/products/starlink-standard-4x-rental.jpg',
  imageAlt:
    'Starlink Standard 4X Rental kit in Bangladesh with BDT 3,000 one-time fee, fixed location Residential plan up to 5 TB per month',
};

export const RentalPlanPage: React.FC<RentalPlanPageProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t3 } = useGeoLanguage();
  const { rentalKitPrice } = useCentralPricing();
  const { currency, formatPrice } = useGlobalCurrency();
  const [selectedPlanId, setSelectedPlanId] = useState<'residential-lite' | 'residential-unlimited'>(
    'residential-lite'
  );

  // Checkout Form State (Scan QR via bKash / Nagad / Rocket / Any Bank -> Enter TrxID -> Submit for Manual Confirmation)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [paymentChannel, setPaymentChannel] = useState<QrPaymentChannel>('bKash');
  const [banglaQrTrxId, setBanglaQrTrxId] = useState('');
  const [notes, setNotes] = useState('');
  const [agreePolicies, setAgreePolicies] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeKit = RENTAL_KIT_MODEL;
  const activePlan =
    RESIDENTIAL_RENTAL_PLANS.find((p) => p.id === selectedPlanId) || RESIDENTIAL_RENTAL_PLANS[0];
  const monthlyRecurringTotal = activePlan.subFee;
  const countryCode = 'BD';
  const carrierSupported = true;
  const shippingFee = 0;
  const totalPayableNow = rentalKitPrice + shippingFee;
  const formattedPriceEn = formatBdt(rentalKitPrice);
  const formattedPriceBn = formatBdtBn(rentalKitPrice);
  const formattedTotalEn = formatBdt(totalPayableNow);
  const formattedTotalBn = formatBdtBn(totalPayableNow);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigateTo = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (path === '/' && onBackToMainSite) {
      onBackToMainSite();
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleRentalBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!agreePolicies) {
      setSubmitError(
        t3(
          'অর্ডার সাবমিট করতে নীতিমালা সম্মতি বক্সে টিক (✓) দিন।',
          'အော်ဒါတင်ရန် စည်းကမ်းချက် သဘောတူညီချက်ကို အမှန်ခြစ်ပေးပါ။',
          'Please agree to the Legal & Policy terms before submitting.'
        )
      );
      return;
    }

    if (!fullName.trim() || !phone.trim() || !registeredAddress.trim()) {
      setSubmitError(
        t3(
          'অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং ডেলিভারি/নিবন্ধিত ঠিকানা লিখুন।',
          'ကျေးဇူးပြု၍ အမည်၊ ဖုန်းနံပါတ်နှင့် လိပ်စာကို ဖြည့်စွက်ပါ။',
          'Please enter your name, mobile number, and delivery address.'
        )
      );
      return;
    }

    if (!banglaQrTrxId.trim()) {
      setSubmitError(
        t3(
          `${formattedPriceBn} পেমেন্টের Transaction ID (TrxID) লিখে “আমি পেমেন্ট করেছি” ক্লিক করুন।`,
          `${formattedPriceEn} ငွေပေးချေမှု Transaction ID (TrxID) ဖြည့်စွက်ပါ။`,
          `Please enter your Transaction ID (TrxID) for the ${formattedPriceEn} QR payment.`
        )
      );
      return;
    }

    if (!carrierSupported) {
      setSubmitError(
        t3(
          'এই দেশে সরাসরি কুরিয়ার ডেলিভারি চালু নেই। ডেলিভারি ইনকোয়ারি পেজে যোগাযোগ করুন।',
          'ဤနိုင်ငံသို့ တိုက်ရိုက်ပို့ဆောင်မှု မရနိုင်ပါ။ Delivery Inquiry မှ ဆက်သွယ်ပါ။',
          'Direct carrier delivery is currently unavailable for the selected country. Please submit a Delivery Inquiry on the Worldwide Delivery page.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const orderId = `DSR-${Math.floor(100000 + Math.random() * 900000)}`;
      const productName = `${activeKit.title} (${formattedPriceEn} One-Time Charge via ${paymentChannel} · Plan: ${activePlan.nameEn} ৳${activePlan.subFee}/mo separate)`;

      const res = await fetch('/api/promos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: 'starlink-rental-kit',
          quantity: 1,
          countryCode,
          currency,
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          district: district.trim() || 'Dhaka',
          address: `${registeredAddress.trim()}${notes ? ` | Note: ${notes.trim()}` : ''}`,
          paymentMethod: 'bangla_qr',
          trxId: banglaQrTrxId.trim(),
          senderBankName: `Bangla QR (${paymentChannel})`,
          productName,
          price: totalPayableNow,
          shippingFee,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'Order submission failed');
      }

      notifyAdminActivity({
        activityType: 'rental_payment_submitted',
        title: `Rental Order #${orderId} Submitted — Verify ${formattedPriceEn} (${paymentChannel})`,
        userName: fullName.trim(),
        userPhone: phone.trim(),
        userEmail: email.trim(),
        details: {
          orderId,
          kit: activeKit.title,
          channel: paymentChannel,
          trxId: banglaQrTrxId.trim(),
          amountPaid: formattedPriceEn,
        },
      });

      setSubmittedOrderId(orderId);
    } catch (err: any) {
      setSubmitError(
        err?.message || 'Submission failed. Please contact WhatsApp +880 1326-370218.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const planName = (p: RentalServicePlan) =>
    language === 'my' ? p.nameMy : language === 'en' ? p.nameEn : p.nameBn;
  const planSummary = (p: RentalServicePlan) =>
    language === 'my' ? p.summaryMy : language === 'en' ? p.summaryEn : p.summaryBn;

  const formattedLocation = registeredAddress.trim()
    ? `${registeredAddress.trim()}, ${district}`
    : district;

  return (
    <div className="min-h-[100dvh] bg-[#04070c] text-slate-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel={t3('রেন্টাল কিট অর্ডার', 'Starlink ငှားရမ်းခြင်း', 'Rental Kit Checkout')}
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main
        id="main-content"
        className="flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8"
      >
        {/* Clean, Concise Hero Header */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-b border-slate-800 pb-6">
          <div className="lg:col-span-7 space-y-3 flex flex-col justify-center min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-cyan-300">
                STARLINK RENTAL KIT · {formattedPriceEn} ONE-TIME CHARGE
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm">
                <a
                  href="/Legal"
                  onClick={(e) => navigateTo(e, '/Legal')}
                  className="inline-flex items-center gap-1 min-h-[44px] text-cyan-300 hover:text-cyan-200 underline underline-offset-4"
                >
                  <span>{t3('বিস্তারিত নীতিমালা', 'မူဝါဒများ', 'Legal & Policies')}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
                <a
                  href="/support"
                  onClick={(e) => navigateTo(e, '/support')}
                  className="inline-flex items-center gap-1 min-h-[44px] text-slate-200 hover:text-cyan-200 underline underline-offset-4"
                >
                  <span>{t3('সাপোর্ট', 'အကူအညီ', 'Support')}</span>
                </a>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance break-words">
              {t3(
                `Starlink Standard 4X Rental — ${formattedPriceBn} এককালীন ফি (বাংলাদেশ)`,
                `Starlink Standard 4X Rental in Bangladesh — ${formattedPriceEn} One-Time Fee`,
                `Starlink Standard 4X Rental in Bangladesh — ${formattedPriceEn} One-Time Fee`
              )}
            </h1>
            <p className="text-sm text-slate-200 max-w-2xl leading-relaxed">
              {t3(
                `Starlink Standard 4X Rental কিটের এককালীন ফি মাত্র ${formattedPriceBn} টাকা (মালিকানা হস্তান্তর হয় না)। শুধুমাত্র বাংলাদেশে ফিক্সড লোকেশন ও Residential প্ল্যান (সর্বোচ্চ ৫ টিবি/মাস), কোনো ট্রাভেল/রোমিং বা COD নেই এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদা।`,
                `Starlink Standard 4X Rental — ${formattedPriceEn} one-time fee (hardware ownership is not transferred). Monthly Starlink subscription is separate. Fixed location, Residential plan only, up to 5 TB/month, no travel or roaming, and no COD.`,
                `Rent the Starlink Standard 4X kit in Bangladesh for a ${formattedPriceEn} one-time fee (hardware ownership is not transferred). Monthly Starlink subscription is separate. Fixed location only, Residential plan only, up to 5 TB/month, no travel or roaming, and no COD.`
              )}
            </p>
          </div>
          <div className="lg:col-span-5 relative aspect-square sm:aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-white flex items-center justify-center p-3">
            <img
              src={activeKit.image}
              alt={activeKit.imageAlt}
              width={800}
              height={800}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-contain"
            />
          </div>
        </section>

        {/* Step 1: Starlink Standard 4X Rental Offer & Mandatory Rental Terms */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {t3('১. Starlink Standard 4X — রেন্টাল কিট ও শর্তাবলি', '၁။ Starlink Standard 4X Rental Terms', '1. Starlink Standard 4X Rental Kit & Key Terms')}
            </h2>
            <span className="text-xs font-mono text-amber-300">
              <strong className="text-white">{formattedPriceEn}</strong> · One-Time Rental Fee · No COD
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-6 rounded-[4px] border border-white bg-[#121216] p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
              <div className="w-full max-w-[180px] sm:w-40 aspect-square shrink-0 rounded-[4px] bg-[#141418] border border-white/10 p-2 flex items-center justify-center">
                <img
                  src={activeKit.image}
                  alt={activeKit.imageAlt}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>

              <div className="min-w-0 flex-1 flex flex-col justify-between space-y-3 w-full">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-amber-300">
                      {activeKit.hardwareLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                      <span>{t3('সক্রিয় অফার', 'Selected', 'Selected')}</span>
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    {activeKit.title}
                  </h3>
                  <p className="text-xs text-neutral-300">
                    {language === 'bn' ? activeKit.shortTagBn : activeKit.shortTagEn}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-neutral-400">
                      {t3('এককালীন রেন্টাল ফি', 'တစ်ကြိမ်ကြေး', 'One-Time Fee')}
                    </div>
                    <div className="text-lg font-bold text-white tabular-nums font-mono">
                      {t3(formattedPriceBn, formattedPriceEn, formattedPriceEn)}
                    </div>
                  </div>
                  <div>
                    <div className="text-neutral-400">
                      {t3('মাসিক Starlink সাবস্ক্রিপশন', 'လစဉ်ကြေး', 'Monthly Subscription')}
                    </div>
                    <div className="text-xs font-medium text-neutral-300 mt-0.5">
                      {t3('আলাদাভাবে প্রযোজ্য', 'သီးခြားပေးရမည်', 'Billed separately')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-[4px] border border-amber-400/30 bg-[#0d0c09] p-4 sm:p-5 space-y-2.5">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-300">
                Mandatory Rental Terms (Bangladesh Residential Only)
              </div>
              <ul className="space-y-2 text-xs text-neutral-200">
                {(language === 'bn' ? RENTAL_TERMS_SUMMARY.bn : RENTAL_TERMS_SUMMARY.en).map(
                  (term) => (
                    <li key={term} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                      <span>{term}</span>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </section>

        {/* Step 2: Select Monthly Subscription Package */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {t3(
                '২. মাসিক প্যাকেজ নির্বাচন করুন',
                '၂။ လစဉ်ပက်ကေ့ချ် ရွေးချယ်ပါ',
                '2. Select Monthly Plan'
              )}
            </h2>
            <a
              href="/Legal/subscription-policy"
              onClick={(e) => navigateTo(e, '/Legal/subscription-policy')}
              className="text-xs text-neutral-400 hover:text-white underline underline-offset-4"
            >
              {t3('প্যাকেজ নীতিমালা', 'Subscription မူဝါဒ', 'Subscription Policy')}
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {RESIDENTIAL_RENTAL_PLANS.map((plan) => {
              const active = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`min-w-0 text-left rounded-[4px] border p-4 sm:p-5 transition-colors cursor-pointer space-y-3 ${
                    active
                      ? 'border-white bg-[#121216]'
                      : 'border-white/15 bg-[#0b0b0e] hover:border-white/35'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white leading-snug">
                        {planName(plan)}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">{planSummary(plan)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-white">
                        ৳{plan.subFee.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {t3('/মাস', '/လ', '/month')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-300">
                    <span>
                      {t3('স্পিড:', 'မြန်နှုန်း:', 'Speed:')}{' '}
                      <strong className="text-white">{plan.speed}</strong>
                    </span>
                    <span className="text-neutral-400">
                      {active
                        ? t3('✓ নির্বাচিত', '✓ ရွေးချယ်ထားသည်', '✓ Selected')
                        : t3('নির্বাচন করুন', 'ရွေးချယ်ရန်', 'Select')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: Clean Checkout Form + Scannable QR Payment */}
        <section id="rental-checkout" className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-white">
            {t3(
              '৩. আপনার তথ্য ও QR পেমেন্ট সাবমিট',
              '၃။ အချက်အလက်နှင့် QR ငွေပေးချေမှု',
              '3. Your Details & QR Payment'
            )}
          </h2>

          {submittedOrderId ? (
            <div className="rounded-[4px] border border-emerald-500/40 bg-[#0b0f0d] p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {t3(
                      'অর্ডার সাবমিট হয়েছে — ম্যানুয়াল কনফার্মেশনের অপেক্ষায়',
                      'အော်ဒါတင်ပြီးပါပြီ — ကိုယ်တိုင်အတည်ပြုရန် စောင့်ဆိုင်းနေသည်',
                      'Order Submitted — Pending Manual Confirmation'
                    )}
                  </h3>
                  <p className="text-sm text-neutral-300">
                    {t3(
                      'আপনার পেমেন্ট তথ্য ও Transaction ID আমাদের কাছে পৌঁছেছে। আমরা ম্যানুয়ালি যাচাই করে শীঘ্রই কল বা WhatsApp-এ কনফার্ম করবো।',
                      'သင့်ငွေပေးချေမှုနှင့် Transaction ID ကို လက်ခံရရှိပါပြီ။ ကျွန်ုပ်တို့ ကိုယ်တိုင်စစ်ဆေးပြီး မကြာမီ ဆက်သွယ်အတည်ပြုပေးပါမည်။',
                      'Your payment details and Transaction ID have been sent to our team. We will manually verify and confirm your order shortly.'
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-[4px] border border-white/10 bg-black/60 p-4 text-xs">
                <div>
                  <span className="text-neutral-400">Order ID:</span>{' '}
                  <strong className="text-white font-mono">{submittedOrderId}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Status:</span>{' '}
                  <strong className="text-amber-300">Pending Manual Confirmation</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Kit:</span>{' '}
                  <strong className="text-white">{activeKit.title}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Paid via QR ({paymentChannel}):</span>{' '}
                  <strong className="text-white">{formattedPriceEn}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-400">Transaction ID (TrxID):</span>{' '}
                  <strong className="text-white font-mono">{banglaQrTrxId}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-neutral-400">Address:</span>{' '}
                  <strong className="text-white">{formattedLocation}</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`https://wa.me/+8801326370218?text=${encodeURIComponent(
                    `Rental Order ${submittedOrderId} | Kit: ${activeKit.title} | Plan: ${activePlan.nameEn} (separate) | One-Time Charge Paid: ${formattedPriceEn} (${paymentChannel}) | TrxID: ${banglaQrTrxId} | Address: ${formattedLocation}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>
                    {t3('WhatsApp-এ দ্রুত কনফার্ম করুন', 'WhatsApp ဖြင့် အတည်ပြုရန်', 'Message on WhatsApp')}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedOrderId(null);
                    setBanglaQrTrxId('');
                  }}
                  className="inline-flex items-center px-4 py-2.5 rounded-[4px] border border-white/20 text-xs font-medium text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  {t3('নতুন অর্ডার করুন', 'အော်ဒါအသစ်တင်ရန်', 'Place Another Order')}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleRentalBooking}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
            >
              {/* Left Column: Customer Details + Scannable QR Payment + Submit */}
              <div className="lg:col-span-7 min-w-0 space-y-5">
                {/* Customer Details */}
                <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-4 sm:p-6 space-y-4">
                  <h3 className="text-sm font-semibold text-white">
                    {t3('গ্রাহকের তথ্য ও ঠিকানা', 'ဝယ်ယူသူ အချက်အလက်နှင့် လိပ်စာ', 'Customer & Delivery Details')}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <label htmlFor="rental-fullname" className="block text-xs font-medium text-slate-200">
                        {t3('পূর্ণ নাম *', 'အမည်အပြည့်အစုံ *', 'Full Name *')}
                      </label>
                      <input
                        id="rental-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t3('আপনার নাম লিখুন', 'သင့်အမည်', 'Your full name')}
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <label htmlFor="rental-phone" className="block text-xs font-medium text-slate-200">
                        {t3('মোবাইল / WhatsApp *', 'ဖုန်း / WhatsApp *', 'Mobile / WhatsApp *')}
                      </label>
                      <input
                        id="rental-phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+880 1XXX-XXXXXX"
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <label htmlFor="rental-email" className="block text-xs font-medium text-slate-200">
                        {t3('ইমেইল (ঐচ্ছিক)', 'အီးမေးလ် (စိတ်ကြိုက်)', 'Email (Optional)')}
                      </label>
                      <input
                        id="rental-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <label htmlFor="rental-country" className="block text-xs font-medium text-slate-200">
                        {t3('ডেলিভারি দেশ (শুধুমাত্র বাংলাদেশ)', 'Delivery Country (Bangladesh Only)', 'Delivery Country (Bangladesh Only)')}
                      </label>
                      <input
                        id="rental-country"
                        type="text"
                        readOnly
                        value="Bangladesh (FREE Delivery · Fixed Location · No COD)"
                        className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <CompactShippingNotice
                    countryCode={countryCode}
                    isRental
                    onInquiryClick={() => {
                      if (onNavigate) onNavigate('/worldwide-delivery');
                      else window.location.href = '/worldwide-delivery';
                    }}
                  />

                  <div className="space-y-1.5 min-w-0">
                    <label htmlFor="rental-district" className="block text-xs font-medium text-slate-200">
                      {t3('জেলা / শহর *', 'ခရိုင် / မြို့ *', 'District / City *')}
                    </label>
                    <input
                      id="rental-district"
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Dhaka"
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="rental-address" className="block text-xs font-medium text-slate-200">
                      {t3('সম্পূর্ণ ঠিকানা *', 'လိပ်စာအပြည့်အစုံ *', 'Full Delivery & Service Address *')}
                    </label>
                    <textarea
                      id="rental-address"
                      rows={2}
                      required
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      placeholder={t3(
                        'বাসা, রোড, এলাকা ও থানা লিখুন',
                        'အိမ်နံပါတ်၊ လမ်း၊ ရပ်ကွက်၊ မြို့နယ် ဖြည့်စွက်ပါ',
                        'House, road, area & postal code'
                      )}
                      className="w-full px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="rental-notes" className="block text-xs font-medium text-slate-200">
                      {t3('অতিরিক্ত নোট (ঐচ্ছিক)', 'အပိုမှတ်ချက် (စိတ်ကြိုက်)', 'Delivery Notes (Optional)')}
                    </label>
                    <input
                      id="rental-notes"
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t3('ডেলিভারি সময় বা নির্দেশনা', 'ပို့ဆောင်မှု မှတ်ချက်', 'Preferred delivery time or note')}
                      className="w-full min-h-[44px] px-3 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Scannable QR Payment Box (bKash / Nagad / Rocket / Any Bank) */}
                <BanglaQrPaymentBox
                  payableAmount={totalPayableNow}
                  selectedChannel={paymentChannel}
                  onSelectChannel={setPaymentChannel}
                  trxId={banglaQrTrxId}
                  onTrxIdChange={setBanglaQrTrxId}
                  kitTitle={activeKit.title}
                />

                {/* Clean Policy Consent & "আমি পেমেন্ট করেছি" Submit Button */}
                <div className="rounded-xl border border-slate-700 bg-[#0b0f17] p-4 sm:p-5 space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <input
                      type="checkbox"
                      checked={agreePolicies}
                      onChange={(e) => setAgreePolicies(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-cyan-400 rounded shrink-0 cursor-pointer"
                    />
                    <span>
                      {t3(
                        'আমি প্রযোজ্য শর্তাবলি পড়েছি ও সম্মত হয়েছি। বিস্তারিত দেখুন:',
                        'သက်ဆိုင်ရာ စည်းကမ်းချက်များကို သဘောတူပါသည်။ အသေးစိတ်ကြည့်ရန်:',
                        'I agree to the applicable terms. Read full details on:'
                      )}{' '}
                      <a
                        href="/Legal"
                        onClick={(e) => navigateTo(e, '/Legal')}
                        className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                      >
                        {t3('লিগ্যাল ও নীতিমালা', 'ဥပဒေနှင့် မူဝါဒ', 'Legal & Policies')}
                      </a>{' '}
                      ·{' '}
                      <a
                        href="/support"
                        onClick={(e) => navigateTo(e, '/support')}
                        className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200"
                      >
                        {t3('সাপোর্ট পেজ', 'အကူအညီ', 'Support')}
                      </a>
                    </span>
                  </label>

                  {submitError && (
                    <div
                      role="alert"
                      className="rounded-lg border border-red-400/50 bg-red-950/40 px-3.5 py-2.5 text-xs sm:text-sm text-red-100"
                    >
                      {submitError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !carrierSupported}
                    className="w-full min-h-[48px] py-3.5 px-5 rounded-lg bg-cyan-400 text-[#04131a] hover:bg-cyan-300 disabled:opacity-60 font-bold text-sm transition-colors cursor-pointer"
                  >
                    {submitting
                      ? t3('সাবমিট হচ্ছে...', 'တင်သွင်းနေသည်...', 'Submitting...')
                      : t3(
                          `আমি পেমেন্ট করেছি — অর্ডার সাবমিট করুন (${formattedTotalBn})`,
                          `ငွေပေးချေပြီးပါပြီ — အော်ဒါတင်ရန် (${formattedTotalEn})`,
                          `I Have Paid — Submit Order (${formattedTotalEn})`
                        )}
                  </button>
                </div>
              </div>

              {/* Right Column: Clean Compact Order Summary */}
              <aside className="lg:col-span-5 min-w-0 lg:sticky lg:top-20 space-y-4">
                <div className="rounded-[4px] border border-white/20 bg-[#0b0b0e] p-5 space-y-4">
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      {t3('অর্ডার সামারি', 'အော်ဒါ အကျဉ်းချုပ်', 'Order Summary')}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
                  </div>

                  <dl className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-neutral-400 shrink-0">
                        {t3('কিট মডেল', 'စက်မော်ဒယ်', 'Kit Model')}
                      </dt>
                      <dd className="text-right text-white font-medium min-w-0">
                        {activeKit.title}
                      </dd>
                    </div>

                    <div className="flex items-start justify-between gap-3">
                      <dt className="text-neutral-400 shrink-0">
                        {t3('মাসিক প্যাকেজ', 'လစဉ်ပက်ကေ့ချ်', 'Monthly Plan')}
                      </dt>
                      <dd className="text-right text-white font-medium min-w-0">
                        {planName(activePlan)} (৳{monthlyRecurringTotal.toLocaleString()}/mo)
                      </dd>
                    </div>

                    <div className="border-t border-white/10 pt-3 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-neutral-400">
                          {t3('রেন্টাল কিট চার্জ (এককালীন)', 'ငှားရမ်းစက်ကြေး', 'Rental Kit (One-Time Charge)')}
                        </dt>
                        <dd className="text-white font-semibold tabular-nums">
                          {t3(formattedPriceBn, formattedPriceEn, formattedPriceEn)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <dt className="text-neutral-400">
                          {t3('ডেলিভারি / শিপিং ফি', 'ပို့ဆောင်ခ', 'Shipping Fee')} ({countryCode})
                        </dt>
                        <dd className="text-white font-semibold tabular-nums">
                          {shippingFee === 0 ? '৳0 (FREE)' : formatBdt(shippingFee)}
                        </dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <dt className="text-neutral-400">
                          {t3('মাসিক Starlink সাবস্ক্রিপশন', 'လစဉ် Starlink ကြေး', 'Monthly Subscription')}
                        </dt>
                        <dd className="text-neutral-300">
                          {t3('আলাদাভাবে প্রযোজ্য', 'သီးခြားပေးရမည်', 'Billed separately')}
                        </dd>
                      </div>
                    </div>

                    <div className="border-t border-white/15 pt-3 flex items-center justify-between gap-3">
                      <dt className="text-white font-semibold">
                        {t3('মোট পরিশোধযোগ্য (QR)', 'ယခုပေးချေရန် (QR)', 'Payable Now (QR)')}
                      </dt>
                      <dd className="text-right">
                        <div className="text-lg font-bold text-white tabular-nums">
                          {t3(formattedTotalBn, formattedTotalEn, formattedTotalEn)}
                        </div>
                        {currency !== 'BDT' && (
                          <div className="text-[11px] font-mono text-neutral-400 tabular-nums">
                            ≈ {formatPrice(totalPayableNow)} ({currency})
                          </div>
                        )}
                      </dd>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <dt className="text-neutral-400">
                        {t3('পেমেন্ট মাধ্যম', 'ငွေပေးချေမှု', 'Payment App')}
                      </dt>
                      <dd className="text-white font-medium">Bangla QR ({paymentChannel})</dd>
                    </div>

                    {banglaQrTrxId.trim() && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-neutral-400">TrxID</dt>
                        <dd className="text-white font-mono text-xs">{banglaQrTrxId.trim()}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Concise Legal, Ownership & Global Delivery Note */}
                <div className="rounded-[4px] border border-white/12 bg-[#0b0b0e] p-4 text-xs text-neutral-400 space-y-2 leading-relaxed">
                  <p className="text-neutral-300">
                    {t3(
                      GLOBAL_DELIVERY_COPY.rentalOwnershipNoteBn,
                      GLOBAL_DELIVERY_COPY.rentalOwnershipNoteMy,
                      GLOBAL_DELIVERY_COPY.rentalOwnershipNoteEn
                    )}
                  </p>
                  <p>
                    {t3(
                      GLOBAL_DELIVERY_COPY.subscriptionSeparateBn,
                      GLOBAL_DELIVERY_COPY.subscriptionSeparateMy,
                      GLOBAL_DELIVERY_COPY.subscriptionSeparateEn
                    )}
                  </p>
                  <p className="text-[11px] text-neutral-400 pt-1 border-t border-white/10">
                    <strong className="text-white block mb-0.5">
                      {t3(
                        GLOBAL_DELIVERY_COPY.headlineBn,
                        GLOBAL_DELIVERY_COPY.headlineMy,
                        GLOBAL_DELIVERY_COPY.headlineEn
                      )}
                    </strong>
                    {t3(
                      GLOBAL_DELIVERY_COPY.disclaimerBn,
                      GLOBAL_DELIVERY_COPY.disclaimerMy,
                      GLOBAL_DELIVERY_COPY.disclaimerEn
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href="/Legal"
                      onClick={(e) => navigateTo(e, '/Legal')}
                      className="text-white font-semibold underline underline-offset-4 hover:text-neutral-300"
                    >
                      {t3('বিস্তারিত নীতিমালা (/Legal)', 'မူဝါဒအသေးစိတ်', 'Full Legal Policies')}
                    </a>
                    <a
                      href="/kits"
                      onClick={(e) => navigateTo(e, '/kits')}
                      className="text-white font-semibold underline underline-offset-4 hover:text-neutral-300"
                    >
                      {t3('কিট কিনুন (Standard / Mini)', 'စက်ဝယ်ယူရန်', 'Buy Purchase Kits')}
                    </a>
                    <a
                      href="/support"
                      onClick={(e) => navigateTo(e, '/support')}
                      className="text-white font-semibold underline underline-offset-4 hover:text-neutral-300"
                    >
                      {t3('সাপোর্ট ও সাহায্য', 'အကူအညီ', 'Support & Help')}
                    </a>
                  </div>
                </div>
              </aside>
            </form>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
