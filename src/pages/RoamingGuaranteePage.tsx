import React, { useEffect, useState } from 'react';
import {
  Globe,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { ResponsiveMarketingImage } from '../components/ResponsiveMarketingImage';
import { useGeoLanguage } from '../lib/geoLanguage';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { useCentralPricing } from '../lib/pricingConfig';
import { addItemToCart } from '../lib/cartStore';
import { SHIPPING_COUNTRIES } from '../lib/shippingConfig';

interface RoamingPackage {
  id: string;
  name: string;
  tier: string;
  monthlyPriceBdt: number;
  dataCap: string;
  coverage: string;
  eligibleFor90DayGuarantee: boolean;
  description: string;
}

interface RoamingGuaranteePageProps {
  initialSection?: 'roaming' | 'refund';
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const RoamingGuaranteePage: React.FC<RoamingGuaranteePageProps> = ({
  initialSection = 'roaming',
  onNavigate,
  onBackToMainSite,
}) => {
  const { t } = useGeoLanguage();
  const { formatPrice } = useGlobalCurrency();
  const { standard4xPrice, miniKitPrice } = useCentralPricing();

  const [packages, setPackages] = useState<RoamingPackage[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);

  // Eligibility + Refund Claim state
  const [kitType, setKitType] = useState<'purchase' | 'rental'>('purchase');
  const [roamingPackageId, setRoamingPackageId] = useState('roam-unlimited-regional');
  const [activationDate, setActivationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [eligibilityResult, setEligibilityResult] = useState<any | null>(null);
  const [checkingElig, setCheckingElig] = useState(false);

  const [orderId, setOrderId] = useState('');
  const [kitSerial, setKitSerial] = useState('');
  const [countryCode, setCountryCode] = useState('MM');
  const [restrictionReport, setRestrictionReport] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<Array<{ name: string; mimeType: string; sizeBytes: number }>>([]);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState<any | null>(null);

  // Track refund
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackedRefunds, setTrackedRefunds] = useState<any[]>([]);
  const [trackSearched, setTrackSearched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title =
      initialSection === 'refund'
        ? '90-Day Roaming Money-Back Guarantee | DSLink'
        : 'Starlink Roaming Packages & 90-Day Guarantee | DSLink';

    fetch('/api/roaming/packages')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.packages)) {
          setPackages(data.packages);
          if (data.packages[0]?.id) setRoamingPackageId(data.packages[0].id);
        }
      })
      .catch(() => {});
  }, [initialSection]);

  const handleCheckEligibility = async () => {
    setCheckingElig(true);
    setEligibilityResult(null);
    try {
      const res = await fetch('/api/refunds/check-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitType, roamingPackageId, activationDate }),
      });
      const data = await res.json();
      setEligibilityResult(data);
    } catch {
      setEligibilityResult({ eligible: false, reason: 'Unable to check eligibility right now.' });
    } finally {
      setCheckingElig(false);
    }
  };

  const handleEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']);
    setEvidenceFiles(
      files
        .filter((f) => allowed.has(f.type) && f.size <= 5 * 1024 * 1024)
        .map((f) => ({ name: f.name, mimeType: f.type, sizeBytes: f.size }))
    );
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);
    setClaimSubmitting(true);
    try {
      const res = await fetch('/api/refunds/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          kitSerial,
          kitType,
          roamingPackageId,
          activationDate,
          countryCode,
          restrictionReport,
          customerName,
          customerEmail,
          customerPhone,
          evidenceFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setClaimError(data?.error || 'Refund claim submission failed.');
      } else {
        setClaimSuccess(data.claim);
        setTrackOrderId(data.claim.orderId);
      }
    } catch {
      setClaimError('Network error submitting refund claim.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleTrackRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackSearched(true);
    try {
      const res = await fetch(`/api/refunds/claims?orderId=${encodeURIComponent(trackOrderId.trim())}`);
      const data = await res.json();
      setTrackedRefunds(Array.isArray(data?.claims) ? data.claims : []);
    } catch {
      setTrackedRefunds([]);
    }
  };

  const handleBundleAddToCart = (pkg: RoamingPackage, kitId: 'starlink-standard-4x' | 'starlink-mini-kit') => {
    addItemToCart({
      productId: kitId,
      name:
        kitId === 'starlink-mini-kit'
          ? 'Starlink Mini Kit (Purchase)'
          : 'Starlink Standard Kit 4X (Purchase)',
      category: 'purchase',
      quantity: 1,
      roamingPackageId: pkg.id,
    });
    setAddedId(`${pkg.id}-${kitId}`);
    setTimeout(() => setAddedId(null), 2000);
  };

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="Roaming & 90-Day Guarantee"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1150px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
        {/* Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-b border-white/15 pb-7">
          <div className="lg:col-span-7 space-y-3 flex flex-col justify-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              STARLINK ROAMING PACKAGES · 90-DAY MONEY-BACK GUARANTEE
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance">
              {initialSection === 'refund'
                ? t('refund.title', '90-Day Roaming Money-Back Guarantee')
                : 'Starlink Roaming Packages & 90-Day Money-Back Guarantee'}
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed">
              Pair a purchased Starlink Standard Kit 4X ({formatPrice(standard4xPrice)}) or Starlink Mini Kit (
              {formatPrice(miniKitPrice)}) with an eligible DSLink roaming package. Monthly Starlink subscriptions are charged separately.
            </p>
          </div>
          <div className="lg:col-span-5 relative aspect-[16/9] rounded-[4px] overflow-hidden border border-white/15 bg-neutral-950">
            <ResponsiveMarketingImage
              mediaKey="maritime-ocean-roaming"
              priority
              sizes="(max-width: 1024px) 100vw, 480px"
              imgClassName="lg:h-full"
            />
          </div>
        </section>

        {/* Roaming Packages Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-white" />
              <span>Available Starlink Roaming Packages</span>
            </h2>
            <span className="text-xs text-neutral-400">Monthly subscription billed separately</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
                    {pkg.tier}
                  </div>
                  <h3 className="text-base font-bold text-white">{pkg.name}</h3>
                  <div className="text-2xl font-mono font-bold text-white tabular-nums">
                    {formatPrice(pkg.monthlyPriceBdt)}
                    <span className="text-xs font-normal text-neutral-400"> /month</span>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed">{pkg.description}</p>
                  <div className="pt-2 space-y-1 text-[11px] text-neutral-400 border-t border-white/10">
                    <div>
                      <strong className="text-neutral-200">Data:</strong> {pkg.dataCap}
                    </div>
                    <div>
                      <strong className="text-neutral-200">Coverage:</strong> {pkg.coverage}
                    </div>
                    {pkg.eligibleFor90DayGuarantee && (
                      <div className="text-emerald-300 font-medium pt-1">
                        ✓ Eligible for 90-Day Roaming Money-Back Guarantee (Purchased Kits Only)
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleBundleAddToCart(pkg, 'starlink-standard-4x')}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-[11px] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span>{addedId === `${pkg.id}-starlink-standard-4x` ? 'Added!' : '+ Standard 4X'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBundleAddToCart(pkg, 'starlink-mini-kit')}
                    className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-[4px] border border-white/25 hover:bg-white/10 text-white font-semibold text-[11px] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <span>{addedId === `${pkg.id}-starlink-mini-kit` ? 'Added!' : '+ Mini Kit'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 90-Day Roaming Money-Back Policy & Restrictions */}
        <section id="money-back-guarantee" className="rounded-[4px] border border-white/20 bg-[#0b0b0e] p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-white">
                {t('refund.title', '90-Day Roaming Money-Back Guarantee')}
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                This guarantee applies <strong>exclusively to qualifying outright-purchased Starlink Kits</strong> paired with an eligible DSLink roaming package if official regional or country roaming service restrictions prevent normal operation within 90 days of activation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-[4px] border border-white/15 bg-black p-4 space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Eligible Claims</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300 list-disc pl-4">
                <li>Purchased Starlink Standard Kit 4X or Purchased Starlink Mini Kit from DSLink.</li>
                <li>Paired with an eligible DSLink Roaming Package.</li>
                <li>Claim submitted within 90 calendar days of roaming activation date with restriction evidence.</li>
              </ul>
            </div>

            <div className="rounded-[4px] border border-amber-500/30 bg-amber-950/15 p-4 space-y-2">
              <div className="font-semibold text-amber-200 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Exclusions &amp; Legal Compliance</span>
              </div>
              <ul className="space-y-1.5 text-neutral-300 list-disc pl-4">
                <li>
                  <strong className="text-white">Rental Kits are strictly NOT eligible</strong> for the 90-Day Roaming Money-Back Guarantee.
                </li>
                <li>DSLink does not guarantee Starlink availability in unsupported countries and does not circumvent Starlink or local regulatory restrictions.</li>
                <li>Hardware must be returned in undamaged condition upon refund approval.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Interactive Eligibility Checker + Refund Submission Form */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">1. Check 90-Day Eligibility</h3>
            <label className="block space-y-1.5">
              <span className="text-neutral-300 block">Kit Ownership Type</span>
              <select
                value={kitType}
                onChange={(e) => setKitType(e.target.value as 'purchase' | 'rental')}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              >
                <option value="purchase">Purchased Kit (Eligible if paired with Roaming)</option>
                <option value="rental">Rental Kit (NOT Eligible)</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-neutral-300 block">Roaming Package</span>
              <select
                value={roamingPackageId}
                onChange={(e) => setRoamingPackageId(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              >
                {packages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                <option value="none">No Roaming Package</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-neutral-300 block">Roaming Activation Date</span>
              <input
                type="date"
                value={activationDate}
                onChange={(e) => setActivationDate(e.target.value)}
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none"
              />
            </label>

            <button
              type="button"
              onClick={handleCheckEligibility}
              disabled={checkingElig}
              className="w-full py-2.5 px-4 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer"
            >
              {checkingElig ? 'Calculating...' : 'Verify 90-Day Eligibility'}
            </button>

            {eligibilityResult && (
              <div
                className={`rounded-[4px] border p-3.5 text-xs ${
                  eligibilityResult.eligible
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
                    : 'border-amber-500/40 bg-amber-950/20 text-amber-200'
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {eligibilityResult.eligible ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{eligibilityResult.eligible ? 'Eligible for Refund Claim' : 'Not Eligible'}</span>
                </div>
                <p className="mt-1 leading-relaxed">{eligibilityResult.reason}</p>
              </div>
            )}

            {/* Track Refund Status */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Search className="w-4 h-4" />
                <span>Track Existing Refund Claim</span>
              </h4>
              <form onSubmit={handleTrackRefund} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={trackOrderId}
                  onChange={(e) => setTrackOrderId(e.target.value)}
                  placeholder="Order ID (e.g. DS-123456)"
                  className="flex-1 bg-black border border-white/20 rounded-[4px] px-3 py-2 text-white font-mono text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-[4px] border border-white/25 hover:bg-white/10 text-white font-semibold text-xs cursor-pointer"
                >
                  Track
                </button>
              </form>
              {trackSearched && trackedRefunds.length === 0 && (
                <p className="text-[11px] text-neutral-400">No refund claims found for that Order ID.</p>
              )}
              {trackedRefunds.map((r) => (
                <div key={r.id} className="rounded-[4px] border border-white/15 bg-black p-3 space-y-1 text-[11px]">
                  <div className="flex justify-between font-mono">
                    <span className="text-white font-bold">#{r.id}</span>
                    <span className="text-emerald-300">{r.status}</span>
                  </div>
                  <p className="text-neutral-400">
                    Order #{r.orderId} · Country: {r.countryCode} · Day {r.daysSinceActivation}/90
                  </p>
                  {r.adminNotes && <p className="text-neutral-300">Note: {r.adminNotes}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Refund Submission Form */}
          <form
            onSubmit={handleSubmitRefund}
            className="lg:col-span-7 rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4 text-xs"
          >
            <h3 className="text-base font-bold text-white">2. Submit 90-Day Roaming Refund Claim</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5">
                <span className="text-neutral-300 block">Purchase Order ID *</span>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="DS-123456"
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-300 block">KIT Serial Number</span>
                <input
                  type="text"
                  value={kitSerial}
                  onChange={(e) => setKitSerial(e.target.value)}
                  placeholder="KIT00123456"
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-300 block">Country Experiencing Restriction *</span>
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
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
                <span className="text-neutral-300 block">Customer Full Name *</span>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-300 block">Phone / WhatsApp *</span>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-300 block">Email Address</span>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
                />
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-neutral-300 block">Country Restriction Report &amp; Account Notice *</span>
              <textarea
                required
                rows={3}
                value={restrictionReport}
                onChange={(e) => setRestrictionReport(e.target.value)}
                placeholder="Include the exact Starlink app restriction message, location, roaming plan ID, and date when service stopped."
                className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none"
              />
            </label>

            <div className="space-y-1.5">
              <span className="text-neutral-300 block">
                Restriction Screenshots / Evidence (JPG, PNG, WEBP, PDF — max 5 MB each)
              </span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"
                onChange={handleEvidenceSelect}
                className="block w-full text-xs text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-[4px] file:border file:border-white/20 file:bg-white/10 file:text-white"
              />
            </div>

            {claimError && (
              <div className="rounded-[4px] border border-red-500/40 bg-red-950/30 p-3 text-red-200">
                {claimError}
              </div>
            )}
            {claimSuccess && (
              <div className="rounded-[4px] border border-emerald-500/40 bg-emerald-950/20 p-4 text-emerald-200 space-y-1">
                <div className="font-bold text-white">Refund Claim Submitted — #{claimSuccess.id}</div>
                <p>
                  Verified within 90-day window (Day {claimSuccess.daysSinceActivation} of 90). Our team will review your evidence and contact you.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={claimSubmitting || kitType === 'rental'}
              className="w-full sm:w-auto px-6 py-3 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer disabled:opacity-50"
            >
              {kitType === 'rental'
                ? 'Rental Kits Excluded from 90-Day Guarantee'
                : claimSubmitting
                ? 'Submitting Refund Claim...'
                : 'Submit 90-Day Refund Claim'}
            </button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default RoamingGuaranteePage;
