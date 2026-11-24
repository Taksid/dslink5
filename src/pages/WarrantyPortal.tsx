import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Upload,
  PackageCheck,
  FileCheck,
  Clock,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { ResponsiveMarketingImage } from '../components/ResponsiveMarketingImage';
import { useGeoLanguage } from '../lib/geoLanguage';

interface WarrantyPortalProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

interface UploadedEvidence {
  name: string;
  mimeType: string;
  sizeBytes: number;
}

export const WarrantyPortalPage: React.FC<WarrantyPortalProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { t, t3 } = useGeoLanguage();
  const [activeTab, setActiveTab] = useState<'verify' | 'register' | 'claim' | 'track'>('verify');

  // Verify tab
  const [verifySerial, setVerifySerial] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Register tab
  const [regSerial, setRegSerial] = useState('');
  const [regOrderId, setRegOrderId] = useState('');
  const [regKitType, setRegKitType] = useState<'purchase' | 'rental'>('purchase');
  const [regKitModel, setRegKitModel] = useState('Starlink Standard Kit 4X');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDate, setRegDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [regActiveRental, setRegActiveRental] = useState(true);
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  // Claim tab
  const [claimSerial, setClaimSerial] = useState('');
  const [claimOrderId, setClaimOrderId] = useState('');
  const [claimKitType, setClaimKitType] = useState<'purchase' | 'rental'>('purchase');
  const [claimKitModel, setClaimKitModel] = useState('Starlink Standard Kit 4X');
  const [claimName, setClaimName] = useState('');
  const [claimEmail, setClaimEmail] = useState('');
  const [claimPhone, setClaimPhone] = useState('');
  const [claimIssue, setClaimIssue] = useState('Dish / Terminal Hardware Failure');
  const [claimDiagnostics, setClaimDiagnostics] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<UploadedEvidence[]>([]);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<any | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Track tab
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<any[]>([]);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackSearched, setTrackSearched] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = '24-Month DSLink Replacement Warranty — Purchase & Rental Kits | DSLink';
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError(null);
    setVerifyResult(null);
    if (!verifySerial.trim()) return;
    setVerifyLoading(true);
    try {
      const res = await fetch(`/api/warranty/verify/${encodeURIComponent(verifySerial.trim())}`);
      const data = await res.json();
      if (!res.ok || !data?.found) {
        setVerifyError(data?.error || 'Serial number not found. Please register your kit first.');
      } else {
        setVerifyResult(data);
      }
    } catch {
      setVerifyError('Unable to reach verification server. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);
    setRegSubmitting(true);
    try {
      const res = await fetch('/api/warranty/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitSerial: regSerial,
          orderId: regOrderId,
          kitType: regKitType,
          kitModel: regKitModel,
          customerName: regName,
          customerEmail: regEmail,
          customerPhone: regPhone,
          purchaseDate: regDate,
          activeRentalAgreement: regKitType === 'rental' ? regActiveRental : true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setRegError(data?.error || 'Warranty registration failed.');
      } else {
        setRegSuccess(data.registration);
        setVerifySerial(data.registration.kitSerial);
      }
    } catch {
      setRegError('Network error while registering warranty.');
    } finally {
      setRegSubmitting(false);
    }
  };

  const handleEvidenceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEvidenceError(null);
    const files = Array.from(e.target.files || []);
    const allowed = new Set([
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ]);
    const valid: UploadedEvidence[] = [];
    for (const file of files.slice(0, 5)) {
      if (!allowed.has(file.type)) {
        setEvidenceError(`Unsupported file type "${file.name}". Allowed: JPG, PNG, WEBP, MP4, WEBM, PDF.`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setEvidenceError(`"${file.name}" exceeds 5 MB maximum per file.`);
        continue;
      }
      valid.push({ name: file.name, mimeType: file.type, sizeBytes: file.size });
    }
    setEvidenceFiles(valid);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setClaimError(null);
    setClaimSuccess(null);
    setClaimSubmitting(true);
    try {
      const res = await fetch('/api/warranty/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kitSerial: claimSerial,
          orderId: claimOrderId,
          kitType: claimKitType,
          kitModel: claimKitModel,
          customerName: claimName,
          customerEmail: claimEmail,
          customerPhone: claimPhone,
          issueCategory: claimIssue,
          diagnostics: claimDiagnostics,
          evidenceFiles,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setClaimError(data?.error || 'Replacement request submission failed.');
      } else {
        setClaimSuccess(data.claim);
        setTrackQuery(data.claim.kitSerial);
      }
    } catch {
      setClaimError('Network error while submitting replacement request.');
    } finally {
      setClaimSubmitting(false);
    }
  };

  const handleTrackClaims = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackLoading(true);
    setTrackSearched(true);
    try {
      const q = trackQuery.trim();
      const param = q.includes('@')
        ? `email=${encodeURIComponent(q)}`
        : q.toUpperCase().startsWith('DS')
        ? `orderId=${encodeURIComponent(q)}`
        : `serial=${encodeURIComponent(q)}`;
      const res = await fetch(`/api/warranty/claims?${param}`);
      const data = await res.json();
      setTrackResults(Array.isArray(data?.claims) ? data.claims : []);
    } catch {
      setTrackResults([]);
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="24-Month Replacement Warranty"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch border-b border-white/15 pb-7">
          <div className="lg:col-span-7 space-y-3 flex flex-col justify-center">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              DSLINK HARDWARE PROTECTION · PURCHASE &amp; RENTAL KITS
            </p>
            <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight text-balance">
              {t('warranty.title', '24-Month DSLink Replacement Warranty — Purchase & Rental Kits')}
            </h1>
            <p className="text-sm sm:text-base text-neutral-300 max-w-3xl leading-relaxed">
              {t3(
                'DSLink থেকে ক্রয়কৃত Starlink Standard Kit 4X, Starlink Mini Kit এবং সক্রিয় রেন্টাল চুক্তির আওতাধীন Starlink Rental Kit-এ ২৪ মাসের DSLink রিপ্লেসমেন্ট ওয়ারেন্টি প্রযোজ্য।',
                'DSLink မှ ဝယ်ယူထားသော Standard 4X၊ Mini နှင့် ငှားရမ်းစက် (Active Rental Agreement) များအတွက် ၂၄ လ အစားထိုးအာမခံ ရရှိနိုင်ပါသည်။',
                'Applies to purchased Starlink Standard Kit 4X, purchased Starlink Mini Kit, and Starlink Rental Kits maintained under an active DSLink rental agreement.'
              )}
            </p>
            <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-3.5 text-xs text-neutral-300 leading-relaxed max-w-3xl">
              <strong className="text-white">Independent DSLink Warranty Disclosure:</strong>{' '}
              {t(
                'warranty.disclaimer',
                'Provided directly by DSLink (DEV SPARK SOFT LIMITED) under DSLink warranty terms — separate from official SpaceX/Starlink manufacturer warranty.'
              )}
            </div>
          </div>
          <div className="lg:col-span-5 relative aspect-[16/9] rounded-[4px] overflow-hidden border border-white/15 bg-neutral-950">
            <ResponsiveMarketingImage
              mediaKey="coastal-community-support"
              priority
              sizes="(max-width: 1024px) 100vw, 460px"
              imgClassName="lg:h-full"
            />
          </div>
        </section>

        {/* Coverage Summary Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 space-y-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white">Starlink Standard Kit 4X (Purchase)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Full 24-month DSLink hardware replacement coverage from invoice date upon KIT serial verification.
            </p>
          </div>
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 space-y-2">
            <ShieldCheck className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white">Starlink Mini Kit (Purchase)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Full 24-month DSLink hardware replacement coverage for non-physical manufacturing &amp; hardware defects.
            </p>
          </div>
          <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 space-y-2">
            <FileCheck className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white">Starlink Rental Kit (Active Agreement)</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Covered for 24 months while the DSLink rental agreement and monthly account remain in active good standing.
            </p>
          </div>
        </section>

        {/* Action Tabs */}
        <section className="space-y-5">
          <div className="flex flex-wrap gap-2 border-b border-white/15 pb-3">
            {[
              { id: 'verify', label: '1. Verify KIT Serial', icon: Search },
              { id: 'register', label: '2. Register Kit', icon: FileCheck },
              { id: 'claim', label: '3. Request Replacement', icon: Upload },
              { id: 'track', label: '4. Track Claim Status', icon: PackageCheck },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'bg-white text-black'
                      : 'border border-white/15 bg-[#0b0b0e] text-neutral-300 hover:text-white hover:border-white/35'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Verify Serial */}
          {activeTab === 'verify' && (
            <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="text-base font-bold text-white">Verify KIT Serial &amp; 24-Month Eligibility</h2>
                <p className="text-xs text-neutral-400">
                  Enter your Starlink KIT serial number (printed on the shipping label or Starlink app) to check DSLink warranty status.
                </p>
              </div>
              <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={verifySerial}
                  onChange={(e) => setVerifySerial(e.target.value)}
                  placeholder="e.g., KIT00123456"
                  className="flex-1 bg-black border border-white/20 focus:border-white rounded-[4px] px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                />
                <button
                  type="submit"
                  disabled={verifyLoading}
                  className="px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer disabled:opacity-60"
                >
                  {verifyLoading ? 'Checking...' : 'Check Eligibility'}
                </button>
              </form>

              {verifyError && (
                <div className="rounded-[4px] border border-amber-500/35 bg-amber-950/20 p-4 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p>{verifyError}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setRegSerial(verifySerial.trim().toUpperCase());
                        setActiveTab('register');
                      }}
                      className="underline text-white font-semibold cursor-pointer"
                    >
                      Register this KIT serial now →
                    </button>
                  </div>
                </div>
              )}

              {verifyResult && (
                <div className="rounded-[4px] border border-emerald-500/35 bg-emerald-950/15 p-4 sm:p-5 space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {verifyResult.eligible
                        ? `Eligible — ${verifyResult.daysRemaining} Days Remaining (24-Month Coverage)`
                        : 'Warranty Inactive / Expired'}
                    </span>
                  </div>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-neutral-300 font-mono">
                    <div>
                      <dt className="text-neutral-500">KIT Serial</dt>
                      <dd className="text-white">{verifyResult.registration.kitSerial}</dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Kit Type &amp; Model</dt>
                      <dd className="text-white">
                        {verifyResult.registration.kitModel} ({verifyResult.registration.kitType})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Coverage Window</dt>
                      <dd className="text-white">
                        {verifyResult.registration.purchaseDate} → {verifyResult.registration.expiresAt}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Order Reference</dt>
                      <dd className="text-white">{verifyResult.registration.orderId}</dd>
                    </div>
                  </dl>
                  {verifyResult.eligible && (
                    <button
                      type="button"
                      onClick={() => {
                        setClaimSerial(verifyResult.registration.kitSerial);
                        setClaimOrderId(verifyResult.registration.orderId);
                        setClaimKitType(verifyResult.registration.kitType);
                        setClaimKitModel(verifyResult.registration.kitModel);
                        setActiveTab('claim');
                      }}
                      className="inline-flex items-center px-4 py-2 rounded-[4px] bg-white text-black font-bold text-xs hover:bg-neutral-200 cursor-pointer"
                    >
                      Submit Replacement Claim for this Kit
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Register Kit */}
          {activeTab === 'register' && (
            <form
              onSubmit={handleRegister}
              className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4 text-xs"
            >
              <h2 className="text-base font-bold text-white">Register Starlink Kit for 24-Month DSLink Warranty</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">KIT Serial Number *</span>
                  <input
                    type="text"
                    required
                    value={regSerial}
                    onChange={(e) => setRegSerial(e.target.value)}
                    placeholder="KIT00123456"
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">DSLink Order / Invoice ID *</span>
                  <input
                    type="text"
                    required
                    value={regOrderId}
                    onChange={(e) => setRegOrderId(e.target.value)}
                    placeholder="DS-123456"
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Ownership Type *</span>
                  <select
                    value={regKitType}
                    onChange={(e) => setRegKitType(e.target.value as 'purchase' | 'rental')}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  >
                    <option value="purchase">Purchased Kit (Outright Ownership)</option>
                    <option value="rental">Rental Kit (Active DSLink Rental Agreement)</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Hardware Model *</span>
                  <select
                    value={regKitModel}
                    onChange={(e) => setRegKitModel(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  >
                    <option value="Starlink Standard Kit 4X">Starlink Standard Kit 4X</option>
                    <option value="Starlink Mini Kit">Starlink Mini Kit</option>
                    <option value="Starlink Rental Kit (Standard 4X)">Starlink Rental Kit (Standard 4X)</option>
                    <option value="Starlink Rental Kit (Mini)">Starlink Rental Kit (Mini)</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Customer Full Name *</span>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Phone / WhatsApp *</span>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+880 1XXX-XXXXXX"
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Email Address</span>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Purchase / Activation Date *</span>
                  <input
                    type="date"
                    required
                    value={regDate}
                    onChange={(e) => setRegDate(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
              </div>

              {regKitType === 'rental' && (
                <label className="flex items-start gap-2.5 text-neutral-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={regActiveRental}
                    onChange={(e) => setRegActiveRental(e.target.checked)}
                    className="mt-0.5 accent-white"
                  />
                  <span>
                    I confirm this Starlink Rental Kit is covered under an active DSLink rental agreement with current monthly service in good standing.
                  </span>
                </label>
              )}

              {regError && (
                <div className="rounded-[4px] border border-red-500/40 bg-red-950/30 p-3 text-red-200">
                  {regError}
                </div>
              )}
              {regSuccess && (
                <div className="rounded-[4px] border border-emerald-500/40 bg-emerald-950/20 p-4 text-emerald-200 space-y-1">
                  <div className="font-bold text-white">
                    Warranty Registered — ID #{regSuccess.id}
                  </div>
                  <p>
                    KIT <strong className="font-mono">{regSuccess.kitSerial}</strong> is covered until{' '}
                    <strong className="font-mono">{regSuccess.expiresAt}</strong> (24 months).
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={regSubmitting}
                className="px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                {regSubmitting ? 'Registering...' : 'Register 24-Month Warranty'}
              </button>
            </form>
          )}

          {/* Tab 3: Replacement Claim */}
          {activeTab === 'claim' && (
            <form
              onSubmit={handleSubmitClaim}
              className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4 text-xs"
            >
              <h2 className="text-base font-bold text-white">Submit Replacement Warranty Claim</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">KIT Serial Number *</span>
                  <input
                    type="text"
                    required
                    value={claimSerial}
                    onChange={(e) => setClaimSerial(e.target.value)}
                    placeholder="KIT00123456"
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Order / Invoice ID</span>
                  <input
                    type="text"
                    value={claimOrderId}
                    onChange={(e) => setClaimOrderId(e.target.value)}
                    placeholder="DS-123456"
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Kit Type *</span>
                  <select
                    value={claimKitType}
                    onChange={(e) => setClaimKitType(e.target.value as 'purchase' | 'rental')}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  >
                    <option value="purchase">Purchased Kit</option>
                    <option value="rental">Rental Kit (Active Agreement)</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Issue Category *</span>
                  <select
                    value={claimIssue}
                    onChange={(e) => setClaimIssue(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  >
                    <option value="Dish / Terminal Hardware Failure">Dish / Terminal Hardware Failure</option>
                    <option value="Router / Wi-Fi Malfunction">Router / Wi-Fi Malfunction</option>
                    <option value="Power Supply / Cable Fault">Power Supply / Cable Fault</option>
                    <option value="Boot / Firmware Lock">Boot / Firmware Lock</option>
                    <option value="Other Hardware Issue">Other Hardware Issue</option>
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Customer Full Name *</span>
                  <input
                    type="text"
                    required
                    value={claimName}
                    onChange={(e) => setClaimName(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-300 block">Phone / WhatsApp *</span>
                  <input
                    type="tel"
                    required
                    value={claimPhone}
                    onChange={(e) => setClaimPhone(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white font-mono text-sm outline-none focus:border-white"
                  />
                </label>
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-neutral-300 block">Email Address (for Status Updates)</span>
                  <input
                    type="email"
                    value={claimEmail}
                    onChange={(e) => setClaimEmail(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                  />
                </label>
              </div>

              <label className="space-y-1.5 block">
                <span className="text-neutral-300 block">Diagnostic Information &amp; Debug Details *</span>
                <textarea
                  required
                  rows={3}
                  value={claimDiagnostics}
                  onChange={(e) => setClaimDiagnostics(e.target.value)}
                  placeholder="Describe Starlink app debug status, power LED state, obstruction/cable checks, and when the hardware issue started."
                  className="w-full bg-black border border-white/20 rounded-[4px] px-3 py-2.5 text-white text-sm outline-none focus:border-white"
                />
              </label>

              <div className="space-y-2">
                <label className="block text-neutral-300">
                  Photo / Video Evidence Upload (JPG, PNG, WEBP, MP4, WEBM, PDF — max 5 MB each, up to 5 files)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,application/pdf"
                  onChange={handleEvidenceSelect}
                  className="block w-full text-xs text-neutral-300 file:mr-3 file:py-2 file:px-3 file:rounded-[4px] file:border file:border-white/20 file:bg-white/10 file:text-white hover:file:bg-white/20"
                />
                {evidenceError && <p className="text-amber-300 text-[11px]">{evidenceError}</p>}
                {evidenceFiles.length > 0 && (
                  <ul className="space-y-1 text-[11px] font-mono text-neutral-300">
                    {evidenceFiles.map((f, i) => (
                      <li key={i}>
                        • {f.name} ({Math.max(1, Math.round(f.sizeBytes / 1024))} KB · {f.mimeType})
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {claimError && (
                <div className="rounded-[4px] border border-red-500/40 bg-red-950/30 p-3 text-red-200">
                  {claimError}
                </div>
              )}
              {claimSuccess && (
                <div className="rounded-[4px] border border-emerald-500/40 bg-emerald-950/20 p-4 text-emerald-200 space-y-1">
                  <div className="font-bold text-white">
                    Replacement Request Submitted — Claim #{claimSuccess.id}
                  </div>
                  <p>
                    Status: <strong>{claimSuccess.status}</strong>. Our engineering team has been notified via email and will review your diagnostics.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={claimSubmitting}
                className="px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer disabled:opacity-60"
              >
                {claimSubmitting ? 'Submitting Claim...' : 'Submit Replacement Request'}
              </button>
            </form>
          )}

          {/* Tab 4: Track Claim */}
          {activeTab === 'track' && (
            <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-5 sm:p-6 space-y-4">
              <h2 className="text-base font-bold text-white">Track Replacement Claim &amp; Shipment</h2>
              <form onSubmit={handleTrackClaims} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter KIT Serial, Order ID, or Email"
                  className="flex-1 bg-black border border-white/20 focus:border-white rounded-[4px] px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-5 py-2.5 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-xs cursor-pointer"
                >
                  {trackLoading ? 'Searching...' : 'Track Claim'}
                </button>
              </form>

              {trackSearched && trackResults.length === 0 && (
                <p className="text-xs text-neutral-400">No warranty claims matched that lookup.</p>
              )}

              {trackResults.length > 0 && (
                <div className="space-y-3">
                  {trackResults.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-[4px] border border-white/15 bg-black p-4 text-xs space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-white">
                          #{c.id} · {c.kitSerial}
                        </span>
                        <span className="inline-flex items-center gap-1 font-mono text-white border border-white/20 px-2 py-0.5 rounded-[4px]">
                          <Clock className="w-3 h-3" />
                          {c.status}
                        </span>
                      </div>
                      <p className="text-neutral-300">
                        {c.kitModel} ({c.kitType}) · Issue: {c.issueCategory}
                      </p>
                      {c.replacementTrackingNumber && (
                        <p className="text-emerald-300 font-mono">
                          Replacement Shipment: {c.replacementCourier || 'Courier'} · Tracking #{c.replacementTrackingNumber}
                        </p>
                      )}
                      {c.adminNotes && <p className="text-neutral-400">Admin Note: {c.adminNotes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WarrantyPortalPage;
