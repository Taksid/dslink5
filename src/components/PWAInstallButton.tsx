import React, { useState } from 'react';
import { Download, Share, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useGeoLanguage } from '../lib/geoLanguage';

interface PWAInstallButtonProps {
  variant?: 'inline' | 'floating';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'inline',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, isInstalling, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const { t3 } = useGeoLanguage();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Never render when the browser detects the app is already installed on the device
  if (isInstalled) return null;

  // Only display when native Chromium install prompt is available or on iOS Safari
  if (!isInstallable && !isIOS) return null;

  const handleInstallClick = () => {
    if (isInstallable) {
      void install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  const buttonLabel = isInstalling
    ? t3('ইনস্টল হচ্ছে...', 'ထည့်သွင်းနေသည်...', 'Installing...')
    : t3('অ্যাপ ইনস্টল করুন', 'အက်ပ် ထည့်သွင်းရန်', 'Install App');

  const buttonNode =
    variant === 'floating' ? (
      <div
        className={`fixed left-3 sm:left-5 z-30 transition-all duration-200 safe-bottom ${
          isOnline ? 'bottom-20 lg:bottom-5' : 'bottom-36 lg:bottom-20'
        } ${className}`}
      >
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          aria-label={buttonLabel}
          className="group inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0b0f17]/95 hover:bg-cyan-400 text-white hover:text-[#04131a] border border-cyan-400/45 hover:border-cyan-300 shadow-2xl backdrop-blur-md text-xs font-semibold tracking-wide transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
        >
          <span className="w-6 h-6 rounded bg-cyan-400/15 group-hover:bg-black/15 flex items-center justify-center shrink-0">
            <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          </span>
          <span className="flex flex-col text-left leading-tight">
            <span>{buttonLabel}</span>
            <span className="text-xs font-normal text-slate-300 group-hover:text-slate-900 hidden sm:inline">
              DEVSPARK LINK PWA
            </span>
          </span>
        </button>
      </div>
    ) : (
      <button
        type="button"
        onClick={handleInstallClick}
        disabled={isInstalling}
        className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-400/40 text-cyan-200 hover:text-cyan-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0 ${className}`}
      >
        <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span>{buttonLabel}</span>
      </button>
    );

  return (
    <>
      {buttonNode}

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ios-pwa-guide-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIOSGuide(false);
          }}
        >
          <div className="w-full max-w-sm rounded-[6px] bg-[#0b0b0e] border border-white/20 p-5 space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white">
                <Smartphone className="w-4 h-4 shrink-0" />
                <h3 id="ios-pwa-guide-title" className="text-sm font-bold">
                  {t3(
                    'iPhone / iPad-এ অ্যাপ ইনস্টল করুন',
                    'iPhone / iPad တွင် ထည့်သွင်းရန်',
                    'Install DEVSPARK LINK on iOS'
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                aria-label="Close"
                className="p-1.5 rounded-[4px] text-neutral-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-neutral-300 leading-relaxed list-decimal pl-4">
              <li>
                <span className="inline-flex items-center gap-1">
                  {t3(
                    'Safari ব্রাউজারের নিচে থাকা Share বাটনে ট্যাপ করুন',
                    'Safari ရှိ Share ခလုတ်ကို နှိပ်ပါ',
                    'Tap the Share button in Safari'
                  )}
                  <Share className="w-3.5 h-3.5 inline text-white shrink-0" />
                </span>
              </li>
              <li>
                {t3(
                  'নিচে স্ক্রল করে "Add to Home Screen" সিলেক্ট করুন এবং উপরে "Add" ট্যাপ করুন।',
                  '"Add to Home Screen" ကို ရွေးချယ်၍ "Add" နှိပ်ပါ।',
                  'Scroll down, select "Add to Home Screen", and tap "Add".'
                )}
              </li>
            </ol>

            <button
              type="button"
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-[4px] bg-white text-black font-semibold text-xs hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              {t3('বুঝেছি', 'ပိတ်မည်', 'Close')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;
