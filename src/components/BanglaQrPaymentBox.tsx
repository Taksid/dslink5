import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Copy, Download, QrCode, Smartphone } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';
import { notifyAdminActivity } from '../lib/activityNotify';

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
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const qrPayload = [
    'BANGLA_QR|DEV SPARK SOFT LIMITED (DSLINK)',
    `MERCHANT:${MERCHANT_NUMBER}`,
    `CHANNEL:${selectedChannel}`,
    `AMOUNT:${payableAmount} BDT`,
    `ITEM:${kitTitle}`,
  ].join('\n');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(qrPayload, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        // fallback handled gracefully in UI
      });

    return () => {
      active = false;
    };
  }, [qrPayload]);

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

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `DSLink-Bangla-QR-${payableAmount}BDT.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notifyAdminActivity({
      activityType: 'payment_qr_downloaded',
      title: `Customer downloaded Bangla QR (${selectedChannel} · ৳${payableAmount})`,
      details: { channel: selectedChannel, amount: payableAmount, kit: kitTitle },
    });
  };

  return (
    <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <QrCode className="w-4 h-4 shrink-0" />
          <h3 className="text-sm font-semibold">
            {t3(
              'QR স্ক্যান করে পেমেন্ট করুন (bKash · Nagad · Rocket · ব্যাংক)',
              'QR စကင်ဖတ်ပြီး ငွေပေးချေပါ (bKash · Nagad · Rocket · Bank)',
              'Scan QR & Pay (bKash · Nagad · Rocket · Any Bank)'
            )}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-neutral-400">
            {t3('এককালীন চার্জ:', 'တစ်ကြိမ်ကြေး:', 'One-Time Charge:')}
          </span>
          <span className="text-white font-bold text-sm tabular-nums">
            ৳{payableAmount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Step 1: Choose Payment App */}
      <div className="space-y-2">
        <div className="text-xs text-neutral-300 font-medium">
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
                className={`px-3 py-2 rounded-[4px] border text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-white text-black border-white'
                    : 'bg-black text-neutral-300 border-white/15 hover:border-white/40 hover:text-white'
                }`}
              >
                {t3(ch.labelBn, ch.labelEn, ch.labelEn)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Scannable QR Code + Concise Instructions */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center rounded-[4px] border border-white/10 bg-black p-4">
        <div className="sm:col-span-5 flex flex-col items-center gap-2.5">
          <div className="bg-white p-2.5 rounded-[4px] border border-white/20 w-44 h-44 flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Bangla QR Code — Pay ৳${payableAmount} via ${selectedChannel}`}
                width={176}
                height={176}
                className="w-full h-full object-contain block"
              />
            ) : (
              <QrCode className="w-16 h-16 text-black" />
            )}
          </div>
          <button
            type="button"
            onClick={handleDownloadQr}
            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t3('QR ডাউনলোড করুন', 'QR ဒေါင်းလုဒ်လုပ်ရန်', 'Save QR Image')}</span>
          </button>
        </div>

        <div className="sm:col-span-7 space-y-3 text-xs">
          <div className="space-y-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              BANGLA QR · {selectedChannel}
            </div>
            <div className="text-sm font-bold text-white">
              DEV SPARK SOFT LIMITED (DSLINK)
            </div>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-neutral-400">
                {t3('হেল্পলাইন / মার্চেন্ট:', 'ဖုန်းနံပါတ်:', 'Helpline / Merchant:')}
              </span>
              <span className="font-mono text-white font-semibold">{MERCHANT_DISPLAY_NUMBER}</span>
              <button
                type="button"
                onClick={handleCopyNumber}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[3px] border border-white/15 bg-white/5 hover:bg-white/15 text-[11px] text-neutral-200 cursor-pointer"
              >
                {copiedNumber ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{t3('কপি হয়েছে', 'ကူးယူပြီး', 'Copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>{t3('কপি', 'ကူးယူ', 'Copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <ol className="space-y-1.5 text-neutral-300 leading-relaxed list-decimal list-inside">
            <li>
              {t3(
                `${selectedChannel} বা যেকোনো ব্যাংক অ্যাপ দিয়ে QR স্ক্যান করে ৳${payableAmount.toLocaleString()} পেমেন্ট করুন।`,
                `${selectedChannel} သို့မဟုတ် Bank App ဖြင့် QR စကင်ဖတ်ပြီး ৳${payableAmount.toLocaleString()} ပေးချေပါ။`,
                `Scan the QR using ${selectedChannel} or any Bank app and pay ৳${payableAmount.toLocaleString()}.`
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
                '“আমি পেমেন্ট করেছি” বাটনে ক্লিক করুন — আমরা ম্যানুয়ালি যাচাই করে কনফার্ম করবো।',
                '“ငွေပေးချေပြီးပါပြီ” ကိုနှိပ်ပါ — ကျွန်ုပ်တို့ ကိုယ်တိုင်စစ်ဆေးပြီး အတည်ပြုပေးပါမည်။',
                'Click “I Have Paid” — our team will manually verify and confirm your order.'
              )}
            </li>
          </ol>

          <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-1">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>
              {t3(
                'bKash · Nagad · Rocket · যেকোনো ব্যাংক অ্যাপ সাপোর্টেড',
                'bKash · Nagad · Rocket · Bank App အားလုံး အသုံးပြုနိုင်သည်',
                'Works with bKash · Nagad · Rocket · Any Bank App'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Step 3: Transaction ID Input */}
      <div className="space-y-1.5">
        <label htmlFor="rental-trx-id" className="block text-xs font-medium text-neutral-200">
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
          className="w-full px-3.5 py-2.5 rounded-[4px] bg-black border border-white/20 text-sm font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/60"
        />
      </div>
    </div>
  );
};

export default BanglaQrPaymentBox;
