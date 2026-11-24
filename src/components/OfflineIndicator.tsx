import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useGeoLanguage } from '../lib/geoLanguage';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t3 } = useGeoLanguage();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 max-w-sm rounded-[4px] border border-amber-400/40 bg-[#12100a]/95 backdrop-blur-md px-3.5 py-2.5 text-xs text-amber-100 shadow-2xl flex items-start gap-2.5 safe-bottom"
    >
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
      <div className="min-w-0 leading-snug">
        <div className="font-semibold text-white">
          {t3('অফলাইন মোড চালু', 'အော့ဖ်လိုင်း မုဒ်', 'Offline Mode')}
        </div>
        <div className="text-[11px] text-amber-200/90 mt-0.5">
          {t3(
            'ক্যাশ করা চেকআউট ও নীতিমালা পেজ দেখা যাচ্ছে। অর্ডার সাবমিট করতে ইন্টারনেট সংযোগ প্রয়োজন।',
            'သိမ်းဆည်းထားသော စာမျက်နှာများကို ကြည့်ရှုနိုင်ပါသည်။ အော်ဒါတင်ရန် အင်တာနက် လိုအပ်ပါသည်။',
            'Viewing cached checkout & legal policy pages. Reconnect to submit orders.'
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
