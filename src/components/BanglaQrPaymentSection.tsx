import React, { useState } from 'react';
import { Download, CheckCircle2, Clock, ShieldCheck, Copy, Check } from 'lucide-react';
import {
  EXACT_BANGLA_QR_IMAGE_URL,
  VERIFIED_BANK_PROVIDERS,
  VERIFIED_MFS_PROVIDERS,
  PaymentInstitution,
  getLogoDevUrl,
} from '../lib/banglaQrConfig';
import { formatBdt } from '../lib/pricingConfig';
import { useGeoLanguage } from '../lib/geoLanguage';

export interface BanglaQrPaymentSectionProps {
  orderIdPreview?: string;
  orderId?: string;
  productSummary: string;
  totalAmountBdt?: number;
  amountBdt?: number;
  selectedInstitutionId?: string;
  onSelectInstitution?: (institution: PaymentInstitution) => void;
  trxId?: string;
  transactionId?: string;
  onChangeTrxId?: (value: string) => void;
  onTransactionIdChange?: (value: string) => void;
  senderPhoneOrAccount?: string;
  onChangeSenderPhoneOrAccount?: (value: string) => void;
  paymentStatus?: string;
  compact?: boolean;
  theme?: 'light' | 'dark';
  requireTrxId?: boolean;
}

export const BanglaQrPaymentSection: React.FC<BanglaQrPaymentSectionProps> = ({
  orderIdPreview,
  orderId,
  productSummary,
  totalAmountBdt,
  amountBdt,
  selectedInstitutionId,
  onSelectInstitution,
  trxId,
  transactionId,
  onChangeTrxId,
  onTransactionIdChange,
  senderPhoneOrAccount = '',
  onChangeSenderPhoneOrAccount,
  paymentStatus,
  compact = false,
  theme = 'light',
  requireTrxId = false,
}) => {
  const { t3 } = useGeoLanguage();
  const [downloading, setDownloading] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [failedLogoDomains, setFailedLogoDomains] = useState<Record<string, boolean>>({});
  const [internalInstitutionId, setInternalInstitutionId] = useState<string>(
    selectedInstitutionId || VERIFIED_MFS_PROVIDERS[0].id
  );

  const resolvedOrderId = orderIdPreview || orderId || 'DSLINK';
  const resolvedAmountBdt = totalAmountBdt ?? amountBdt ?? 0;
  const resolvedTrxId = trxId ?? transactionId ?? '';
  const handleTrxIdChange = onChangeTrxId || onTransactionIdChange || (() => {});
  const activeInstitutionId = selectedInstitutionId || internalInstitutionId;
  const handleSelectInstitution = (inst: PaymentInstitution) => {
    setInternalInstitutionId(inst.id);
    onSelectInstitution?.(inst);
  };

  const allProviders = [...VERIFIED_MFS_PROVIDERS, ...VERIFIED_BANK_PROVIDERS];
  const activeProvider =
    allProviders.find((p) => p.id === activeInstitutionId) || VERIFIED_MFS_PROVIDERS[0];

  const isLight = theme === 'light';

  const handleDownloadQr = async () => {
    setDownloading(true);
    try {
      const response = await fetch(EXACT_BANGLA_QR_IMAGE_URL, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `DSLink-Bangla-QR-${resolvedOrderId || 'IMG-2390'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback direct download anchor if CORS blocks blob fetch
      const link = document.createElement('a');
      link.href = EXACT_BANGLA_QR_IMAGE_URL;
      link.download = `DSLink-Bangla-QR-${resolvedOrderId || 'IMG-2390'}.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyAmount = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(String(Math.round(resolvedAmountBdt)));
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const renderInstitutionLogoCard = (inst: PaymentInstitution) => {
    const isSelected = inst.id === activeProvider.id;
    const useFallbackSvg = Boolean(failedLogoDomains[inst.id]);
    const logoSrc = useFallbackSvg
      ? inst.officialBrandSvgDataUri
      : getLogoDevUrl(inst.domain, 128);

    return (
      <button
        key={inst.id}
        type="button"
        onClick={() => handleSelectInstitution(inst)}
        data-testid={`bangla-qr-provider-${inst.id}`}
        aria-pressed={isSelected}
        className={`group relative flex flex-col items-center justify-between rounded-xl p-2.5 transition-all duration-150 cursor-pointer text-center min-h-[92px] ${
          isSelected
            ? 'bg-white border-2 border-emerald-600 shadow-[0_6px_20px_-6px_rgba(22,163,74,0.32)]'
            : 'bg-white border border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      >
        <div className="w-full h-11 flex items-center justify-center px-1.5 bg-white rounded-lg overflow-hidden">
          <img
            src={logoSrc}
            alt={`${inst.name} Official Logo`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              if (!failedLogoDomains[inst.id]) {
                setFailedLogoDomains((prev) => ({ ...prev, [inst.id]: true }));
              }
            }}
            className="max-h-9 w-auto max-w-full object-contain select-none"
          />
        </div>
        <div className="mt-1.5 w-full">
          <div className="text-[11px] font-semibold text-slate-900 leading-tight truncate">
            {inst.shortName}
          </div>
          <div className="text-[9px] font-mono text-slate-500 leading-tight mt-0.5 truncate">
            {inst.banglaQrSupported ? 'Bangla QR' : ''}
            {inst.banglaQrSupported && inst.npsbSupported ? ' · ' : ''}
            {inst.npsbSupported ? 'NPSB' : ''}
          </div>
        </div>
      </button>
    );
  };

  return (
    <section
      data-testid="bangla-qr-checkout-section"
      className={`rounded-2xl border p-4 sm:p-6 space-y-6 overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-[0_12px_32px_-12px_rgba(15,23,42,0.08)]'
          : 'bg-[#0b0f14] border-white/15 text-slate-100'
      }`}
    >
      {/* Top Banner: Network & Verification Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
            {t3(
              'বাংলাদেশ ব্যাংক অনুমোদিত বাংলা কিউআর ও এনপিএসবি নেটওয়ার্ক',
              'Bangladesh Bank Authorized Bangla QR & NPSB Network',
              'BANGLADESH BANK AUTHORIZED · BANGLA QR & NPSB EVALUATED'
            )}
          </div>
          <h3
            className={`text-base sm:text-lg font-bold mt-0.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {t3(
              'Pay with participating Bangladesh Bank-approved Banks & MFS',
              'Pay with participating Bangladesh Bank-approved Banks & MFS',
              'Pay with participating Bangladesh Bank-approved Banks & MFS'
            )}
          </h3>
        </div>
        <div
          data-testid="bangla-qr-verification-status"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg"
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            {paymentStatus
              ? `Status: ${paymentStatus}`
              : t3(
                  'স্ট্যাটাস: পেমেন্ট যাচাইয়ের অপেক্ষায় (Awaiting Payment)',
                  'Status: Awaiting Payment Verification',
                  'Status: Awaiting Payment Verification'
                )}
          </span>
        </div>
      </div>

      {/* Order Summary Strip inside Bangla QR Module */}
      <div
        className={`rounded-xl border ${compact ? 'p-3' : 'p-3.5 sm:p-4'} grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs ${
          isLight
            ? 'bg-slate-50 border-slate-200 text-slate-700'
            : 'bg-black/60 border-white/10 text-slate-300'
        }`}
      >
        <div>
          <span className="text-[11px] text-slate-500 block">
            {t3('অর্ডার আইডি (Order ID)', 'Order ID', 'Order ID')}
          </span>
          <span
            data-testid="bangla-qr-order-id"
            className={`font-mono font-bold text-sm tabular-nums ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            #{resolvedOrderId}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 block">
            {t3('পণ্যের বিবরণ (Product Summary)', 'Product Summary', 'Product Summary')}
          </span>
          <span
            className={`font-semibold block truncate ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
            title={productSummary}
          >
            {productSummary}
          </span>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <div className="sm:text-right">
            <span className="text-[11px] text-slate-500 block">
              {t3('মোট পরিশোধযোগ্য (Total in BDT)', 'Total Amount (BDT)', 'Total Amount in BDT')}
            </span>
            <span
              data-testid="bangla-qr-total-bdt"
              className="font-mono font-bold text-base text-emerald-700 tabular-nums"
            >
              {formatBdt(resolvedAmountBdt)} BDT
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyAmount}
            aria-label="Copy BDT Amount"
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedAmount ? t3('কপি হয়েছে', 'Copied', 'Copied') : t3('কপি', 'Copy', 'Copy')}</span>
          </button>
        </div>
      </div>

      {/* Main QR Display Box */}
      <div className="flex flex-col items-center text-center space-y-3">
        <div className="space-y-1">
          <h4
            data-testid="bangla-qr-heading"
            className={`text-sm sm:text-base font-bold tracking-tight ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            Scan &amp; Pay – All Supported Banks &amp; MFS
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {t3(
              'আপনার ব্যাংক বা মোবাইল ব্যাংকিং (bKash, Nagad, Rocket, Citytouch, Astha, NexusPay, CellFin) অ্যাপ থেকে নিচের অফিসিয়াল Bangla QR কোডটি স্ক্যান করুন।',
              'Scan the official DSLink Bangla QR code below using your participating Bank or MFS app.',
              'Scan the official DSLink Bangla QR code below using your participating Bangladesh Bank-approved Bank or MFS mobile app.'
            )}
          </p>
        </div>

        {/* Original QR Image Container: Mobile 220-280px, Desktop 300-350px, zero cropping/modification */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white border-2 border-slate-200 shadow-sm inline-flex flex-col items-center max-w-full">
          <img
            data-testid="bangla-qr-original-image"
            src={EXACT_BANGLA_QR_IMAGE_URL}
            alt="DSLink Official Bangla QR Scan & Pay Code"
            className="w-[248px] sm:w-[270px] md:w-[325px] max-w-full h-auto object-contain rounded-lg select-none block"
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-600">
            <span>MERCHANT: DEV SPARK SOFT LIMITED (DSLINK)</span>
            <span aria-hidden="true">·</span>
            <span>BANGLA QR &amp; NPSB</span>
          </div>
        </div>

        {/* Download QR Button */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleDownloadQr}
            disabled={downloading}
            data-testid="bangla-qr-download-button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>
              {downloading
                ? t3('ডাউনলোড হচ্ছে...', 'Downloading...', 'Downloading...')
                : t3('Download QR (কিউআর ডাউনলোড করুন)', 'Download QR', 'Download QR')}
            </span>
          </button>
        </div>
      </div>

      {/* Dedicated Section: Supported Banks & Mobile Financial Services */}
      <div className="space-y-4 pt-3 border-t border-slate-200/80 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h4
              data-testid="supported-banks-mfs-heading"
              className={`text-sm sm:text-base font-bold ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}
            >
              Supported Banks &amp; Mobile Financial Services
            </h4>
            <p className="text-xs text-slate-500">
              {t3(
                'পেমেন্ট করার জন্য ব্যবহৃত ব্যাংক বা এমএফএস প্রতিষ্ঠানটি নির্বাচন করুন (Bangla QR ও NPSB আলাদাভাবে যাচাইকৃত)',
                'Select the Bank or MFS institution you used to pay (Bangla QR and NPSB compatibility evaluated separately).',
                'Select the Bank or MFS institution used for your payment (Bangla QR and NPSB compatibility evaluated separately).'
              )}
            </p>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 font-semibold">
            Selected: {activeProvider.name}
          </span>
        </div>

        {/* Group 1: Mobile Financial Services (MFS) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              {t3(
                'মোবাইল ফিন্যান্সিয়াল সার্ভিস (Mobile Financial Services — MFS)',
                'Mobile Financial Services (MFS)',
                'Mobile Financial Services (MFS)'
              )}
            </span>
            <span className="text-[11px] font-mono text-slate-500">Bangla QR Scan &amp; Pay</span>
          </div>
          <div
            data-testid="mfs-logo-grid"
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5"
          >
            {VERIFIED_MFS_PROVIDERS.map(renderInstitutionLogoCard)}
          </div>
        </div>

        {/* Group 2: Participating Bangladesh Bank-Approved Banks (Bangla QR & NPSB) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              {t3(
                'অংশগ্রহণকারী অনুমোদিত ব্যাংকসমূহ (Participating Banks · Bangla QR & NPSB)',
                'Participating Banks (Bangla QR & NPSB)',
                'Participating Banks (Bangla QR & NPSB)'
              )}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Bangla QR · NPSB Instant Switch
            </span>
          </div>
          <div
            data-testid="bank-logo-grid"
            className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5"
          >
            {VERIFIED_BANK_PROVIDERS.map(renderInstitutionLogoCard)}
          </div>
        </div>

        {/* Active Institution Step-by-Step Instruction Box */}
        <div
          className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
            isLight
              ? 'bg-emerald-50/70 border-emerald-200 text-slate-800'
              : 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
          }`}
        >
          <div className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <span>
              {t3(
                `${activeProvider.nameBn} দিয়ে পেমেন্ট নির্দেশনা`,
                `How to Pay with ${activeProvider.name}`,
                `How to Pay with ${activeProvider.name}`
              )}
            </span>
            <span className="text-[11px] font-mono">
              {activeProvider.banglaQrSupported ? 'Bangla QR: Verified' : ''} ·{' '}
              {activeProvider.npsbSupported ? 'NPSB: Verified' : ''}
            </span>
          </div>
          <p className="leading-relaxed">
            {t3(
              activeProvider.instructionBn,
              activeProvider.instructionEn,
              activeProvider.instructionEn
            )}
          </p>
        </div>
      </div>

      {/* Transaction ID & Verification Submission Fields */}
      <div className="space-y-3 pt-2 border-t border-slate-200/80 dark:border-white/10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="bangla-qr-trx-input"
              className={`block text-xs font-semibold mb-1 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}
            >
              {t3(
                'ট্রানজেকশন আইডি (Transaction ID / TrxID)',
                'Transaction ID (TrxID)',
                'Transaction ID (TrxID / Reference)'
              )}
              {requireTrxId ? ' *' : ''}
            </label>
            <input
              id="bangla-qr-trx-input"
              data-testid="bangla-qr-trx-input"
              type="text"
              required={requireTrxId}
              value={resolvedTrxId}
              onChange={(e) => handleTrxIdChange(e.target.value)}
              placeholder={t3(
                'যেমন: BGH7890KLM বা NPSB রেফারেন্স নম্বর',
                'e.g. BGH7890KLM or NPSB Ref',
                'e.g. BGH7890KLM or NPSB Reference'
              )}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono outline-none transition-colors ${
                isLight
                  ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                  : 'bg-black border-white/25 focus:border-emerald-400 text-white'
              }`}
            />
          </div>

          {onChangeSenderPhoneOrAccount && (
            <div>
              <label
                htmlFor="bangla-qr-sender-input"
                className={`block text-xs font-semibold mb-1 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                {t3(
                  'প্রেরকের নম্বর / অ্যাকাউন্টের শেষ ৪ ডিজিট',
                  'Sender Account / Last 4 Digits',
                  'Sender Account / Phone (Optional)'
                )}
              </label>
              <input
                id="bangla-qr-sender-input"
                type="text"
                value={senderPhoneOrAccount}
                onChange={(e) => onChangeSenderPhoneOrAccount(e.target.value)}
                placeholder={t3('যেমন: 017XXXXXXXX বা 4821', 'e.g. 017XXXXXXXX', 'e.g. 017XXXXXXXX or last 4 digits')}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-slate-300 focus:border-emerald-600 text-slate-900'
                    : 'bg-black border-white/25 focus:border-emerald-400 text-white'
                }`}
              />
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 text-[11px] text-slate-500 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            {t3(
              'স্বাধীন ব্যাংক/এমএফএস যাচাই অথবা অ্যাডমিন রিকনসিলিয়েশন ছাড়া পেমেন্ট স্বয়ংক্রিয়ভাবে সফল হিসেবে চিহ্নিত হয় না। অর্ডার সাবমিট করার পর স্ট্যাটাস "Awaiting Payment" থাকবে এবং যাচাই সম্পন্ন হলে আপডেট হবে।',
              'Payments are not marked successful without independent provider verification or administrative reconciliation. Your order will display Awaiting Payment until verified.',
              'Payments are never marked successful without independent provider verification or administrative reconciliation. Orders remain in Awaiting Payment status until verified.'
            )}
          </span>
        </div>
      </div>
    </section>
  );
};

export default BanglaQrPaymentSection;
