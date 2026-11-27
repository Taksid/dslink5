import React, { useState } from 'react';
import { CheckCircle2, Copy, Download, QrCode, Smartphone } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';
import { notifyAdminActivity } from '../lib/activityNotify';
import {
  EXACT_BANGLA_QR_IMAGE_URL,
  VERIFIED_BANGLA_QR_MERCHANT_ID,
  VERIFIED_BANGLA_QR_MERCHANT_NAME,
} from '../lib/banglaQrConfig';

export type QrPaymentChannel = 'bKash' | 'Nagad' | 'Rocket' | 'Bank App';

export interface BanglaQrPaymentBoxProps {
  regularPrice?: number;
  payableAmount: number;
  selectedChannel: QrPaymentChannel;
  onSelectChannel: (channel: QrPaymentChannel) => void;
  trxId: string;
  onTrxIdChange: (trxId: string) => void;
  kitTitle: string;
}

const PAYMENT_CHANNELS: Array<{
  id: QrPaymentChannel;
  labelBn: string;
  labelEn: string;
}> = [
  { id: 'bKash', labelBn: 'bKash', labelEn: 'bKash' },
  { id: 'Nagad', labelBn: 'Nagad', labelEn: 'Nagad' },
  { id: 'Rocket', labelBn: 'Rocket', labelEn: 'Rocket' },
  { id: 'Bank App', labelBn: 'যেকোনো ব্যাংক', labelEn: 'Any Bank' },
];

const MERCHANT_NUMBER = '+8801326370218';
const MERCHANT_DISPLAY_NUMBER = '01326-370218';

export const BanglaQrPaymentBox: React.FC<BanglaQrPaymentBoxProps> = ({
  payableAmount,
  selectedChannel,
  onSelectChannel,
  trxId,
  onTrxIdChange,
  kitTitle,
}) => {
  const { t3 } = useGeoLanguage();
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(MERCHANT_NUMBER);
      setCopiedNumber(true);
      notifyAdminActivity({
        activityType: 'payment_number_copied',
        title: `Customer copied payment number (${selectedChannel})`,
        details: { channel: selectedChannel, amount: payableAmount, kit: kitTitle },
      });
      setTimeout(() => setCopiedNumber(false), 2000);
    } catch {
      // ignore clipboard restrictions
    }
  };

  const handleDownloadQr = async () => {
    setDownloading(true);
    try {
      const response = await fetch(EXACT_BANGLA_QR_IMAGE_URL);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `DSLink-Bangla-QR-DEVSPARK-SOFT-LIMITED-${payableAmount}BDT.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = EXACT_BANGLA_QR_IMAGE_URL;
      link.download = `DSLink-Bangla-QR-DEVSPARK-SOFT-LIMITED-${payableAmount}BDT.jpg`;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloading(false);
    }

    notifyAdminActivity({
      activityType: 'payment_qr_downloaded',
      title: `Customer downloaded verified Bangla QR (${selectedChannel} · ৳${payableAmount})`,
      details: { channel: selectedChannel, amount: payableAmount, kit: kitTitle },
    });
  };

  return (
    <div className="rounded-xl border border-slate-700/70 bg-[#0b0f17] p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
          <h3 className="text-sm sm:text-base font-semibold">
            {t3(
              'অফিসিয়াল Bangla QR স্ক্যান করে পেমেন্ট করুন (bKash · Nagad · Rocket · ব্যাংক)',
              'Bangla QR စကင်ဖတ်ပြီး ငွေပေးချေပါ (bKash · Nagad · Rocket · Bank)',
              'Scan Official Bangla QR & Pay (bKash · Nagad · Rocket · Any Bank)'
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono">
          <span className="text-slate-300">
            {t3('এককালীন ফি:', 'တစ်ကြိမ်ကြေး:', 'One-Time Fee:')}
          </span>
          <span className="text-white font-bold tabular-nums">
            ৳{payableAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Step 1: Choose Payment App */}
      <div className="space-y-2">
        <div className="text-xs sm:text-sm text-slate-200 font-medium">
          {t3(
            '১. পেমেন্ট মাধ্যম সিলেক্ট করুন:',
            '၁။ ငွေပေးချေမည့် နည်းလမ်း ရွေးချယ်ပါ:',
            '1. Select your payment app:'
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_CHANNELS.map((ch) => {
            const active = selectedChannel === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  onSelectChannel(ch.id);
                  notifyAdminActivity({
                    activityType: 'qr_channel_selected',
                    title: `Selected ${ch.id} on Rental Checkout`,
                    details: { channel: ch.id, amount: payableAmount, kit: kitTitle },
                  });
                }}
                aria-pressed={active}
                className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-cyan-400 text-[#04131a] border-cyan-300'
                    : 'bg-[#04070c] text-slate-200 border-slate-600 hover:border-cyan-400/60 hover:text-white'
                }`}
              >
                {t3(ch.labelBn, ch.labelEn, ch.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Original Uncropped Scannable Merchant Bangla QR + Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center rounded-xl border border-slate-700/80 bg-[#04070c] p-4">
        <div className="sm:col-span-6 flex flex-col items-center gap-3">
          <div className="bg-white p-2.5 rounded-xl border border-slate-300 w-full max-w-[290px] flex items-center justify-center">
            <img
              data-testid="rental-bangla-qr-image"
              src={EXACT_BANGLA_QR_IMAGE_URL}
              alt={`Official Bangladesh Bank Merchant Bangla QR Code for ${VERIFIED_BANGLA_QR_MERCHANT_NAME} — Merchant ID ${VERIFIED_BANGLA_QR_MERCHANT_ID}`}
              width={1122}
              height={1402}
              decoding="async"
              className="w-full h-auto object-contain block rounded"
            />
          </div>
          <button
            type="button"
            disabled={downloading}
            onClick={handleDownloadQr}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
            <span>
              {downloading
                ? t3('ডাউনলোড হচ্ছে...', 'ဒေါင်းလုဒ်လုပ်နေသည်...', 'Downloading...')
                : t3('QR ডাউনলোড করুন', 'QR ဒေါင်းလုဒ်လုပ်ရန်', 'Download QR')}
            </span>
          </button>
        </div>

        <div className="sm:col-span-6 space-y-3 text-xs sm:text-sm">
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-300">
              BANGLADESH BANK MERCHANT · BANGLA QR
            </div>
            <div className="text-sm sm:text-base font-bold text-white">
              {VERIFIED_BANGLA_QR_MERCHANT_NAME}
            </div>
            <div className="text-xs font-mono text-slate-300 break-all">
              Merchant ID: {VERIFIED_BANGLA_QR_MERCHANT_ID}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-slate-300">
                {t3('হেল্পলাইন / মার্চেন্ট:', 'ဖုန်းနံပါတ်:', 'Helpline / Merchant:')}
              </span>
              <span className="font-mono text-white font-semibold">{MERCHANT_DISPLAY_NUMBER}</span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 text-xs text-white font-medium cursor-pointer"
              >
                {copiedNumber ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
                    <span>{t3('কপি হয়েছে', 'ကူးယူပြီး', 'Copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{t3('কপি', 'ကူးယူ', 'Copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <ol className="space-y-1.5 text-slate-200 leading-relaxed list-decimal list-inside">
            <li>
              {t3(
                `${selectedChannel} বা যেকোনো ব্যাংক অ্যাপ দিয়ে Bangla QR স্ক্যান করে ৳${payableAmount.toLocaleString()} পেমেন্ট করুন।`,
                `${selectedChannel} သို့မဟုတ် Bank App ဖြင့် Bangla QR စကင်ဖတ်ပြီး ৳${payableAmount.toLocaleString()} ပေးချေပါ။`,
                `Scan the Bangla QR using ${selectedChannel} or any Bank app and pay ৳${payableAmount.toLocaleString()}.`
              )}
            </li>
            <li>
              {t3(
                'পেমেন্ট শেষ হলে নিচে Transaction ID (TrxID) লিখুন।',
                'ငွေပေးချေပြီးပါက အောက်တွင် Transaction ID (TrxID) ဖြည့်ပါ။',
                'Enter your Transaction ID (TrxID) below.'
              )}
            </li>
            <li>
              {t3(
                'সাবমিট করার পর স্ট্যাটাস “Awaiting Payment” থাকবে — আমাদের টিম ম্যানুয়ালি যাচাই করে কনফার্ম করবে।',
                'အော်ဒါတင်ပြီးနောက် Awaiting Payment အဖြစ်ရှိနေမည်ဖြစ်ပြီး ကျွန်ုပ်တို့ ကိုယ်တိုင်စစ်ဆေးအတည်ပြုပေးပါမည်။',
                'After submission, your order stays Awaiting Payment until our team manually verifies the transaction.'
              )}
            </li>
          </ol>

          <div className="flex items-center gap-1.5 text-xs text-slate-300 pt-1">
            <Smartphone className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
            <span>
              {t3(
                'bKash · Nagad · Rocket · Upay · IBBL · City Bank · DBBL · BRAC · NPSB',
                'bKash · Nagad · Rocket · Upay · City Bank · DBBL · BRAC · NPSB',
                'Works with bKash · Nagad · Rocket · Upay · City Bank · DBBL · BRAC · Any NPSB Bank'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Step 3: Transaction ID Input */}
      <div className="space-y-1.5">
        <label htmlFor="rental-trx-id" className="block text-xs sm:text-sm font-medium text-slate-200">
          {t3(
            '২. আপনার Transaction ID (TrxID) লিখুন *',
            '၂။ Transaction ID (TrxID) ထည့်သွင်းပါ *',
            '2. Enter Transaction ID (TrxID) *'
          )}
        </label>
        <input
          id="rental-trx-id"
          type="text"
          required
          value={trxId}
          onChange={(e) => onTrxIdChange(e.target.value)}
          placeholder={t3(
            'যেমন: BQR8X92K41 / 9G7H2K1L9P',
            'ဥပမာ: BQR8X92K41 / 9G7H2K1L9P',
            'e.g. BQR8X92K41 / 9G7H2K1L9P'
          )}
          className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#04070c] border border-slate-600 text-sm font-mono text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
        />
      </div>
    </div>
  );
};

export default BanglaQrPaymentBox;
