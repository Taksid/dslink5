import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  Lock,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react';
import {
  DSLINK_PAY_BANKS,
  DSLINK_PAY_WALLETS,
  DSLinkPayProvider,
  DSLinkPayRequestPublic,
  MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
  MANUAL_BANGLA_QR_PROVIDER_LABEL_BN,
  formatPayAmount,
  getDSLinkPayStatusMeta,
  getLogoDevUrl,
  getProviderAccentTheme,
  searchPaymentProviders,
} from '../lib/dslinkPayConfig';
import { RENTAL_SHIPPING_EXCLUSION_NOTICE_BN } from '../lib/dslinkPayRules';

interface DSLinkPayPageProps {
  token: string;
  onNavigate?: (path: string) => void;
}

type PaymentTabId = 'mfs' | 'bank' | 'card' | 'cod';

const LIGHT_HEADER_LOGO_URL = '/devspark-header-logo-light.svg';

const ProviderLogoFrame: React.FC<{ provider: DSLinkPayProvider; compact?: boolean }> = ({
  provider,
  compact = false,
}) => {
  const [useFallback, setUseFallback] = useState(false);
  return (
    <div
      className={`${
        compact ? 'w-12 h-8' : 'w-full h-10'
      } rounded-md bg-white flex items-center justify-center px-1.5 py-1 overflow-hidden shrink-0`}
    >
      <img
        src={useFallback ? provider.officialBrandSvgDataUri : getLogoDevUrl(provider.domain, 128)}
        alt={provider.name}
        loading="lazy"
        onError={() => {
          if (!useFallback) setUseFallback(true);
        }}
        className={`${compact ? 'max-h-6' : 'max-h-7'} w-auto max-w-full object-contain`}
      />
    </div>
  );
};

export const DSLinkPayPage: React.FC<DSLinkPayPageProps> = ({ token, onNavigate }) => {
  const [paymentRequest, setPaymentRequest] = useState<DSLinkPayRequestPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<PaymentTabId>('mfs');
  const [providerQuery, setProviderQuery] = useState('');
  // ONE shared manual Bangla QR overlay for ALL enabled wallets and banks (no URL change!)
  const [selectedQrProvider, setSelectedQrProvider] = useState<DSLinkPayProvider | null>(null);
  const lastFocusedProviderIdRef = useRef<string | null>(null);
  const [mobileDetailsOpen, setMobileDetailsOpen] = useState(false);
  const [retryDismissedBanner, setRetryDismissedBanner] = useState(false);

  const [trxId, setTrxId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [stripePolling, setStripePolling] = useState(false);

  const handleCloseManualQrOverlay = useCallback(() => {
    if (submitting) return;
    const providerIdToFocus = lastFocusedProviderIdRef.current;
    setSelectedQrProvider(null);
    setSubmitError(null);
    if (providerIdToFocus && typeof document !== 'undefined') {
      window.requestAnimationFrame(() => {
        const tileBtn = document.getElementById(
          `dslink-provider-tile-${providerIdToFocus}`
        ) as HTMLButtonElement | null;
        tileBtn?.focus();
      });
    }
  }, [submitting]);

  // Enforce pure white light theme & noindex, nofollow strictly on /pay/* without affecting storefront
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const hadDarkClass = htmlEl.classList.contains('dark');
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const prevThemeColor = themeMeta?.getAttribute('content') || '#000000';

    let robotsMeta = document.querySelector('meta[name="robots"]');
    const createdRobots = !robotsMeta;
    const prevRobots = robotsMeta?.getAttribute('content') || '';
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');

    htmlEl.classList.remove('dark');
    htmlEl.classList.add('dslink-pay-light');
    bodyEl.classList.add('dslink-pay-light');
    if (themeMeta) themeMeta.setAttribute('content', '#ffffff');

    return () => {
      htmlEl.classList.remove('dslink-pay-light');
      bodyEl.classList.remove('dslink-pay-light');
      if (hadDarkClass) htmlEl.classList.add('dark');
      if (themeMeta) themeMeta.setAttribute('content', prevThemeColor);
      if (robotsMeta) {
        if (createdRobots) {
          robotsMeta.remove();
        } else if (prevRobots) {
          robotsMeta.setAttribute('content', prevRobots);
        }
      }
    };
  }, []);

  // Lock background scroll while overlay is open & close overlay on Escape key returning focus to tile
  useEffect(() => {
    if (!selectedQrProvider) return;
    const prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) {
        e.preventDefault();
        handleCloseManualQrOverlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedQrProvider, submitting, handleCloseManualQrOverlay]);

  const stripeReturnState = useMemo<'success' | 'cancel' | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const st = params.get('stripe');
    if (st === 'success') return 'success';
    if (st === 'cancel') return 'cancel';
    return null;
  }, []);

  // Build method tabs STRICTLY from server-approved eligibleMethods (ineligible methods are absent from DOM!)
  const enabledTabs = useMemo<PaymentTabId[]>(() => {
    if (!paymentRequest) return [];
    const tabs: PaymentTabId[] = [];
    if (paymentRequest.eligibleMethods.includes('bangla_qr')) tabs.push('mfs');
    if (paymentRequest.eligibleMethods.includes('bank_transfer')) tabs.push('bank');
    if (paymentRequest.stripeCardEnabled && paymentRequest.eligibleMethods.includes('card')) {
      tabs.push('card');
    }
    if (paymentRequest.eligibleMethods.includes('cod')) tabs.push('cod');
    return tabs;
  }, [paymentRequest]);

  const fetchPaymentRequest = useCallback(
    async (silent = false): Promise<DSLinkPayRequestPublic | null> => {
      const cleanToken = String(token || '').trim();
      if (!cleanToken) {
        setLoadError('পেমেন্ট লিংকটি পাওয়া যায়নি। (Payment link token is missing.)');
        setLoading(false);
        return null;
      }
      if (!silent) setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(`/api/pay/${encodeURIComponent(cleanToken)}`, {
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.paymentRequest) {
          setLoadError(
            data?.error || 'এই পেমেন্ট লিংকটি পাওয়া যায়নি অথবা অকার্যকর। (Payment link not found.)'
          );
          setPaymentRequest(null);
          return null;
        }
        const pr: DSLinkPayRequestPublic = data.paymentRequest;
        setPaymentRequest(pr);
        return pr;
      } catch {
        setLoadError('সার্ভারের সাথে সংযোগ বিচ্ছিন্ন হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        return null;
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPaymentRequest(false);
  }, [fetchPaymentRequest]);

  useEffect(() => {
    if (enabledTabs.length > 0 && !enabledTabs.includes(activeTab)) {
      setActiveTab(enabledTabs[0]);
    }
  }, [enabledTabs, activeTab]);

  // Poll live server status after Stripe redirect (?stripe=success) — NEVER mark paid client-side
  useEffect(() => {
    if (stripeReturnState !== 'success') return;
    if (!paymentRequest || paymentRequest.status === 'paid') {
      setStripePolling(false);
      return;
    }
    let cancelled = false;
    let attempts = 0;
    setStripePolling(true);

    const timer = window.setInterval(async () => {
      attempts += 1;
      const latest = await fetchPaymentRequest(true);
      if (cancelled) return;
      if (latest?.status === 'paid' || attempts >= 6) {
        window.clearInterval(timer);
        setStripePolling(false);
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [stripeReturnState, paymentRequest?.status, fetchPaymentRequest]);

  const searchResults = useMemo(() => searchPaymentProviders(providerQuery), [providerQuery]);

  const activeProviders = useMemo(() => {
    if (activeTab === 'mfs') return searchResults.wallets;
    if (activeTab === 'bank') return searchResults.banks;
    return [];
  }, [activeTab, searchResults]);

  const crossTabMatches = useMemo(() => {
    if (!providerQuery.trim()) return [];
    if (activeTab === 'mfs' && enabledTabs.includes('bank')) return searchResults.banks;
    if (activeTab === 'bank' && enabledTabs.includes('mfs')) return searchResults.wallets;
    return [];
  }, [activeTab, providerQuery, searchResults, enabledTabs]);

  const handleCopy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  const handleOpenManualQrOverlay = (provider: DSLinkPayProvider) => {
    if (submitting) return;
    lastFocusedProviderIdRef.current = provider.id;
    setSelectedQrProvider(provider);
    setSubmitError(null);
  };

  const handleSubmitManualTrxId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRequest || !selectedQrProvider || submitting) return;
    setSubmitError(null);

    const cleanedTrx = trxId.trim();
    if (cleanedTrx.length < 4) {
      setSubmitError('সঠিক ট্রানজেকশন আইডি (TrxID) লিখুন (কমপক্ষে ৪ অক্ষর)।');
      return;
    }

    setSubmitting(true);
    try {
      const apiMethod = selectedQrProvider.group === 'bank' ? 'bank_transfer' : 'bangla_qr';
      const res = await fetch(`/api/pay/${encodeURIComponent(paymentRequest.token)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: apiMethod,
          trxId: cleanedTrx,
          institutionId: selectedQrProvider.id,
          institutionName: selectedQrProvider.nameBn,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.paymentRequest) {
        setPaymentRequest(data.paymentRequest);
      }
      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || 'ট্রানজেকশন আইডি জমা দেওয়া যায়নি। আবার চেষ্টা করুন।');
        return;
      }
      setTrxId('');
    } catch {
      setSubmitError('নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayWithCard = async () => {
    if (!paymentRequest || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/pay/${encodeURIComponent(paymentRequest.token)}/stripe-checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (data?.paymentRequest) {
        setPaymentRequest(data.paymentRequest);
      }
      if (!res.ok || !data?.success || !data?.url) {
        setSubmitError(
          data?.error || 'কার্ড পেমেন্ট সেশন তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
        );
        return;
      }
      window.location.assign(data.url);
    } catch {
      setSubmitError('নেটওয়ার্ক ত্রুটি। Stripe পেমেন্ট পেজে যাওয়া যায়নি।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectCod = async () => {
    if (!paymentRequest || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(paymentRequest.token)}/select-cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (data?.paymentRequest) {
        setPaymentRequest(data.paymentRequest);
      }
      if (!res.ok || !data?.success) {
        setSubmitError(data?.error || 'ক্যাশ অন ডেলিভারি নির্বাচন করা যায়নি।');
        return;
      }
    } catch {
      setSubmitError('নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartCodAdvance = async () => {
    if (!paymentRequest || submitting) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/pay/${encodeURIComponent(paymentRequest.token)}/start-cod-advance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.payPath) {
        setSubmitError(data?.error || 'COD অগ্রিম পেমেন্ট লিংক তৈরি করা যায়নি।');
        return;
      }
      if (onNavigate) {
        onNavigate(String(data.payPath));
      } else {
        window.location.assign(String(data.payPath));
      }
    } catch {
      setSubmitError('নেটওয়ার্ক ত্রুটি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const statusMeta = paymentRequest ? getDSLinkPayStatusMeta(paymentRequest.status) : null;
  const isProcessingNow =
    submitting ||
    (stripeReturnState === 'success' && stripePolling && paymentRequest?.status !== 'paid');

  const activeStatusDisplay = useMemo(() => {
    if (isProcessingNow) {
      return {
        labelBn: 'প্রসেস হচ্ছে',
        labelEn: 'Processing',
        tone: 'cyan' as const,
      };
    }
    if (
      stripeReturnState === 'cancel' &&
      paymentRequest?.status === 'pending' &&
      !retryDismissedBanner
    ) {
      return {
        labelBn: 'পেমেন্ট সম্পন্ন হয়নি',
        labelEn: 'Cancelled — Retry Available',
        tone: 'rose' as const,
      };
    }
    if (!statusMeta) return null;
    return {
      labelBn: statusMeta.labelBn,
      labelEn: statusMeta.labelEn,
      tone: statusMeta.tone,
    };
  }, [isProcessingNow, stripeReturnState, paymentRequest?.status, retryDismissedBanner, statusMeta]);

  const currency = paymentRequest?.currency || 'BDT';
  const fmt = useCallback(
    (amt: number) => formatPayAmount(amt, currency),
    [currency]
  );

  const paymentTypeLabelBn = useMemo(() => {
    if (!paymentRequest) return 'পূর্ণ পেমেন্ট';
    switch (paymentRequest.paymentType) {
      case 'advance':
        return 'অগ্রিম পেমেন্ট';
      case 'remaining':
        return 'বাকি ব্যালেন্স';
      case 'subscription':
        return 'মাসিক সাবস্ক্রিপশন';
      default:
        return 'এখন পরিশোধযোগ্য';
    }
  }, [paymentRequest]);

  const statusToneClasses = (tone: 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate') => {
    switch (tone) {
      case 'emerald':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      case 'amber':
        return 'border-amber-200 bg-amber-50 text-amber-900';
      case 'rose':
        return 'border-rose-200 bg-rose-50 text-rose-800';
      case 'cyan':
        return 'border-sky-200 bg-sky-50 text-sky-900';
      default:
        return 'border-slate-200 bg-slate-100 text-slate-700';
    }
  };

  const tabGridColsClass =
    enabledTabs.length >= 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : enabledTabs.length === 3
      ? 'grid-cols-3'
      : enabledTabs.length === 2
      ? 'grid-cols-2'
      : 'grid-cols-1';

  const canShowManualOverlay = Boolean(
    selectedQrProvider &&
      paymentRequest &&
      (paymentRequest.eligibleMethods.includes('bangla_qr') ||
        paymentRequest.eligibleMethods.includes('bank_transfer')) &&
      paymentRequest.currency === 'BDT'
  );

  const showRemainingLater = Boolean(
    paymentRequest &&
      paymentRequest.remainingAfterThisPaymentAmount > 0 &&
      paymentRequest.status !== 'paid' &&
      paymentRequest.paymentType !== 'subscription'
  );

  return (
    <div
      data-dslink-pay-theme="light"
      className="min-h-[100dvh] bg-white text-slate-900 font-sans flex flex-col overflow-x-clip pb-[max(1.25rem,env(safe-area-inset-bottom))]"
    >
      {/* Compact Pure-White Header with DEVSPARK LINK Logo + DSLink Pay */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 h-14 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => (onNavigate ? onNavigate('/') : window.location.assign('/'))}
            className="flex items-center gap-2 min-h-[44px] text-left cursor-pointer rounded-md min-w-0"
          >
            <img
              src={LIGHT_HEADER_LOGO_URL}
              alt="DEVSPARK LINK"
              width={126}
              height={28}
              className="h-6 sm:h-7 w-auto object-contain shrink-0"
            />
            <span className="h-4 w-px bg-slate-300 shrink-0" aria-hidden="true" />
            <span className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
              DSLink Pay
            </span>
          </button>

          <div className="flex items-center gap-2 text-xs shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
              <span>DEV SPARK SOFT LIMITED</span>
            </span>
            <button
              type="button"
              onClick={() => fetchPaymentRequest(false)}
              disabled={loading || submitting}
              aria-label="স্ট্যাটাস রিফ্রেশ করুন"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center gap-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 text-sky-700 ${loading || stripePolling ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span className="hidden sm:inline font-medium">রিফ্রেশ</span>
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-6 flex flex-col justify-start lg:justify-center bg-white"
      >
        {loading && !paymentRequest ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-sky-700 animate-spin mx-auto" aria-hidden="true" />
            <h1 className="text-base font-bold text-slate-900">লোড হচ্ছে...</h1>
            <p className="text-xs sm:text-sm text-slate-600">
              নিরাপদ পেমেন্ট তথ্য যাচাই করা হচ্ছে।
            </p>
          </section>
        ) : loadError || !paymentRequest || !statusMeta || !activeStatusDisplay ? (
          <section className="rounded-2xl border border-rose-200 bg-white p-6 max-w-lg mx-auto w-full space-y-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div className="space-y-1">
                <h1 className="text-lg font-bold text-slate-900">পেমেন্ট লিংক পাওয়া যায়নি</h1>
                <p className="text-sm text-slate-600 leading-relaxed">{loadError}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="https://wa.me/8801326370218"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-sm"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>WhatsApp সহায়তা</span>
              </a>
              <button
                type="button"
                onClick={() => (onNavigate ? onNavigate('/cart') : window.location.assign('/cart'))}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-sm cursor-pointer"
              >
                কার্টে ফিরে যান
              </button>
            </div>
          </section>
        ) : (
          /* COMPACT CENTERED WHITE CHECKOUT CONTAINER */
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* MOBILE & PWA COMPACT TOP BAR (Keeps Amount + Methods Visible in First View!) */}
            <section
              aria-label="Payment amount summary"
              className="lg:hidden border-b border-slate-200 bg-slate-50/70 px-3.5 py-3 space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span>রেফারেন্স #{paymentRequest.requestRef}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy('ref-m', paymentRequest.requestRef)}
                      aria-label="রেফারেন্স কপি করুন"
                      className="p-1 rounded text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {copiedKey === 'ref-m' ? (
                        <Check className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                      ) : (
                        <Copy className="w-3 h-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-mono font-extrabold text-slate-900 tabular-nums">
                      {fmt(paymentRequest.requestedAmount)}
                    </span>
                    <span className="text-xs font-bold text-sky-700">
                      {paymentRequest.currency}
                    </span>
                  </div>
                </div>

                <span
                  data-testid="payment-status-badge-mobile"
                  className={`shrink-0 px-2.5 py-1 rounded-md border text-[11px] font-bold ${statusToneClasses(
                    activeStatusDisplay.tone
                  )}`}
                >
                  {activeStatusDisplay.labelBn}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setMobileDetailsOpen((prev) => !prev)}
                aria-expanded={mobileDetailsOpen}
                className="w-full min-h-[36px] flex items-center justify-between text-xs font-medium text-slate-600 hover:text-slate-900 pt-1.5 border-t border-slate-200 cursor-pointer"
              >
                <span className="truncate pr-2">
                  বিবরণ দেখুন · {paymentRequest.items.length} আইটেম ({paymentRequest.countryCode})
                </span>
                {mobileDetailsOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
                )}
              </button>

              {mobileDetailsOpen && (
                <div className="pt-2 space-y-2 text-xs border-t border-slate-200">
                  <ul className="divide-y divide-slate-200">
                    {paymentRequest.items.map((item, idx) => (
                      <li
                        key={`${item.productId}-m-${idx}`}
                        className="py-1.5 flex items-start justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 break-words">{item.name}</div>
                          <div className="text-slate-500 tabular-nums">
                            {fmt(item.unitPrice)} × {item.quantity}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                          {fmt(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <dl className="space-y-1 pt-1.5 border-t border-slate-200 tabular-nums">
                    <div className="flex justify-between text-slate-600">
                      <dt>সাবটোটাল</dt>
                      <dd className="font-mono text-slate-900">{fmt(paymentRequest.subtotalAmount)}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>শিপিং ({paymentRequest.countryCode})</dt>
                      <dd className="font-mono text-slate-900">
                        {paymentRequest.shippingFeeAmount === 0
                          ? `ফ্রি (${fmt(0)})`
                          : fmt(paymentRequest.shippingFeeAmount)}
                      </dd>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <dt>সর্বমোট</dt>
                      <dd className="font-mono">
                        {fmt(paymentRequest.orderTotalAmount)} {paymentRequest.currency}
                      </dd>
                    </div>
                  </dl>
                </div>
              )}
            </section>

            {/* TWO-COLUMN DESKTOP GRID: LEFT = AMOUNT & SUMMARY, RIGHT = METHOD SELECTION / STATUS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-slate-200 bg-white">
              {/* LEFT PANE (Desktop) */}
              <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-slate-50/70 p-5 xl:p-6 space-y-5 min-w-0">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500 font-medium">
                        {paymentRequest.orderId ? 'অর্ডার নম্বর' : 'পেমেন্ট রেফারেন্স'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <h1 className="font-mono text-base font-extrabold text-slate-900 break-all">
                          #{paymentRequest.requestRef}
                        </h1>
                        <button
                          type="button"
                          onClick={() => handleCopy('ref-d', paymentRequest.requestRef)}
                          aria-label="রেফারেন্স কপি করুন"
                          className="p-1 rounded hover:bg-slate-200/70 text-slate-500 hover:text-slate-900 cursor-pointer"
                        >
                          {copiedKey === 'ref-d' ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                    <span
                      data-testid="payment-status-badge-desktop"
                      className={`shrink-0 px-2.5 py-1 rounded-md border text-[11px] font-bold ${statusToneClasses(
                        activeStatusDisplay.tone
                      )}`}
                    >
                      {activeStatusDisplay.labelBn}
                    </span>
                  </div>

                  {/* Highlighted Amount Box */}
                  <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-600">{paymentTypeLabelBn}</p>
                        <p className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums mt-0.5 tracking-tight">
                          {fmt(paymentRequest.requestedAmount)}{' '}
                          <span className="text-sm font-bold text-sky-700">
                            {paymentRequest.currency}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('amt-d', String(paymentRequest.requestedAmount))}
                        className="min-h-[36px] inline-flex items-center gap-1 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'amt-d' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-sky-700" aria-hidden="true" />
                            <span>কপি</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1.5 border-t border-sky-200/70">
                      <span>গন্তব্য: {paymentRequest.countryName || paymentRequest.countryCode}</span>
                      <span className="font-mono font-semibold">{paymentRequest.currency}</span>
                    </div>
                  </div>

                  {/* Breakdown */}
                  <dl className="divide-y divide-slate-200 text-xs sm:text-sm tabular-nums">
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <dt className="text-slate-600">সাবটোটাল (Subtotal)</dt>
                      <dd className="font-mono font-medium text-slate-900">
                        {fmt(paymentRequest.subtotalAmount)}
                      </dd>
                    </div>
                    <div className="py-2.5 flex items-center justify-between gap-2">
                      <dt className="text-slate-600">
                        {paymentRequest.isRentalOrder
                          ? 'রেন্টাল শিপিং (অগ্রিম)'
                          : `শিপিং চার্জ (${paymentRequest.countryCode})`}
                      </dt>
                      <dd className="font-mono font-medium text-slate-900">
                        {paymentRequest.shippingFeeAmount === 0
                          ? `ফ্রি (${fmt(0)})`
                          : fmt(paymentRequest.shippingFeeAmount)}
                      </dd>
                    </div>
                    {paymentRequest.rentalBreakdown && paymentRequest.paymentType !== 'subscription' && (
                      <div className="py-2.5 flex items-center justify-between gap-2">
                        <dt className="text-slate-600">
                          এককালীন রেন্টাল / অ্যাক্টিভেশন ফি (
                          {paymentRequest.rentalBreakdown.activationCollectionRule === 'on_activation'
                            ? 'অ্যাক্টিভেশনে'
                            : 'অগ্রিম'}
                          )
                        </dt>
                        <dd className="font-mono font-medium text-slate-900">
                          {fmt(paymentRequest.rentalBreakdown.activationFeeBdt)}
                        </dd>
                      </div>
                    )}
                    <div className="py-2.5 flex items-center justify-between gap-2 font-bold text-slate-900">
                      <dt>সর্বমোট অর্ডার মূল্য</dt>
                      <dd className="font-mono">
                        {fmt(paymentRequest.orderTotalAmount)} {paymentRequest.currency}
                      </dd>
                    </div>
                    {paymentRequest.paidAmount > 0 && (
                      <div className="py-2.5 flex items-center justify-between gap-2 text-emerald-700 font-semibold">
                        <dt>ইতিমধ্যে পরিশোধিত</dt>
                        <dd className="font-mono">
                          {fmt(paymentRequest.paidAmount)} {paymentRequest.currency}
                        </dd>
                      </div>
                    )}
                    {showRemainingLater && (
                      <div className="py-2.5 flex items-center justify-between gap-2 text-amber-800 font-semibold">
                        <dt>পরে / ডেলিভারিতে পরিশোধযোগ্য</dt>
                        <dd className="font-mono">
                          {fmt(paymentRequest.remainingAfterThisPaymentAmount)} {paymentRequest.currency}
                        </dd>
                      </div>
                    )}
                  </dl>

                  {/* Items Summary (Zero Customer PII) */}
                  <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                    {paymentRequest.items.map((item, idx) => (
                      <li
                        key={`${item.productId}-d-${idx}`}
                        className="p-2.5 flex items-start justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 break-words">{item.name}</div>
                          {item.variantLabel && (
                            <div className="text-[11px] text-sky-700 font-mono">{item.variantLabel}</div>
                          )}
                          <div className="text-slate-500 tabular-nums">
                            {fmt(item.unitPrice)} × {item.quantity}
                          </div>
                        </div>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                          {fmt(item.lineTotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium text-slate-700">
                      {paymentRequest.merchant.name}
                    </span>
                  </div>
                  <a
                    href="https://wa.me/8801326370218"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-700 hover:text-sky-900 font-semibold shrink-0"
                  >
                    WhatsApp সহায়তা
                  </a>
                </div>
              </aside>

              {/* RIGHT PANE: PAYMENT STATUS OR SERVER-APPROVED METHOD SELECTOR */}
              <div className="lg:col-span-7 p-4 sm:p-6 space-y-4 min-w-0 bg-white">
                {/* RENTAL SUBSCRIPTION EXCLUSION NOTICE (Verbatim Bangla) */}
                {paymentRequest.isRentalOrder &&
                  paymentRequest.paymentType !== 'subscription' && (
                    <div
                      data-testid="rental-exclusion-notice"
                      className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs sm:text-sm text-slate-800 space-y-1.5"
                    >
                      <p className="font-semibold text-slate-900 leading-relaxed">
                        {paymentRequest.rentalBreakdown?.subscriptionNoticeBn ||
                          RENTAL_SHIPPING_EXCLUSION_NOTICE_BN}
                      </p>
                      {paymentRequest.rentalBreakdown && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-700 pt-1 border-t border-sky-200/70">
                          <span>
                            শিপিং (অগ্রিম): {fmt(paymentRequest.rentalBreakdown.rentalShippingFeeBdt)}
                          </span>
                          <span>
                            এককালীন ফি: {fmt(paymentRequest.rentalBreakdown.activationFeeBdt)} (
                            {paymentRequest.rentalBreakdown.activationCollectionRule ===
                            'on_activation'
                              ? 'অ্যাক্টিভেশনে'
                              : 'এখন পরিশোধযোগ্য'}
                            )
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* COD ADVANCE SEPARATION NOTICE (when COD requires an advance) */}
                {paymentRequest.codAdvanceRequiredAmount &&
                  paymentRequest.codAdvanceRequiredAmount > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-950 space-y-1">
                      <p className="font-bold">ক্যাশ অন ডেলিভারি অগ্রিম শর্ত</p>
                      <p>
                        এখন অগ্রিম পরিশোধযোগ্য:{' '}
                        <strong className="font-mono">
                          {fmt(paymentRequest.codAdvanceRequiredAmount)} {paymentRequest.currency}
                        </strong>{' '}
                        · ডেলিভারির সময় বাকি:{' '}
                        <strong className="font-mono">
                          {fmt(paymentRequest.codRemainingOnDeliveryAmount || 0)}{' '}
                          {paymentRequest.currency}
                        </strong>
                      </p>
                    </div>
                  )}

                {/* PROCESSING STATE */}
                {isProcessingNow && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-sky-200 bg-sky-50 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm"
                  >
                    <RefreshCw
                      className="w-4 h-4 text-sky-700 animate-spin shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="font-bold text-slate-900">প্রসেস হচ্ছে...</p>
                      <p className="text-slate-700 mt-0.5">
                        {stripeReturnState === 'success'
                          ? 'Stripe থেকে সার্ভার নিশ্চিতকরণ যাচাই হচ্ছে। অনুগ্রহ করে অপেক্ষা করুন।'
                          : 'আপনার অনুরোধ সার্ভারে প্রক্রিয়া করা হচ্ছে।'}
                      </p>
                    </div>
                  </div>
                )}

                {/* STRIPE CANCEL NOTICE */}
                {stripeReturnState === 'cancel' &&
                  statusMeta.acceptsPayment &&
                  !retryDismissedBanner && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start justify-between gap-3 text-xs text-rose-900"
                    >
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="font-bold">কার্ড পেমেন্ট বাতিল করা হয়েছে</p>
                          <p className="mt-0.5 text-rose-800">
                            কোনো টাকা কাটা হয়নি। আপনি আবার চেষ্টা করতে পারেন।
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRetryDismissedBanner(true)}
                        className="shrink-0 px-2.5 py-1.5 rounded-md border border-rose-300 bg-white text-rose-800 font-bold cursor-pointer"
                      >
                        বন্ধ করুন
                      </button>
                    </div>
                  )}

                {/* STATE: পেমেন্ট সফল (VERIFIED PAID) */}
                {paymentRequest.status === 'paid' && (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold text-slate-900">পেমেন্ট সফল</h2>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          অর্ডার <strong className="font-mono">#{paymentRequest.orderId || paymentRequest.requestRef}</strong>-এর{' '}
                          <strong className="font-mono text-emerald-800">
                            {fmt(paymentRequest.requestedAmount)} {paymentRequest.currency}
                          </strong>{' '}
                          পেমেন্ট সফলভাবে নিশ্চিত হয়েছে।
                        </p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-emerald-200 bg-white p-3.5 text-xs font-mono tabular-nums">
                      <div>
                        <dt className="text-slate-500">অর্ডার নম্বর</dt>
                        <dd className="font-bold text-slate-900">
                          #{paymentRequest.orderId || paymentRequest.requestRef}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">পরিশোধিত পরিমাণ</dt>
                        <dd className="font-bold text-emerald-700">
                          {fmt(paymentRequest.requestedAmount)} {paymentRequest.currency}
                        </dd>
                      </div>
                      {paymentRequest.submittedTrxId && (
                        <div className="sm:col-span-2">
                          <dt className="text-slate-500">ট্রানজেকশন রেফারেন্স</dt>
                          <dd className="font-bold text-slate-900 break-all">
                            {paymentRequest.submittedTrxId}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </section>
                )}

                {/* STATE: পেমেন্ট যাচাই চলছে (UNDER REVIEW — PERSISTS ACROSS REFRESHES/DEVICES) */}
                {paymentRequest.status === 'under_review' && (
                  <section
                    data-testid="payment-under-review-panel"
                    className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          পেমেন্ট যাচাই চলছে
                        </h2>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          আপনার ট্রানজেকশন আইডি সফলভাবে জমা হয়েছে। DSLink টিম পেমেন্ট যাচাই সম্পন্ন করলে আপনার অর্ডার চূড়ান্তভাবে নিশ্চিত করা হবে।
                        </p>
                      </div>
                    </div>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-amber-200 bg-white p-3.5 text-xs font-mono tabular-nums">
                      <div>
                        <dt className="text-slate-500">রেফারেন্স</dt>
                        <dd className="font-bold text-slate-900">#{paymentRequest.requestRef}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">জমাকৃত TrxID</dt>
                        <dd className="font-bold text-slate-900 break-all">
                          {paymentRequest.submittedTrxId || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">ব্যাংক / ওয়ালেট</dt>
                        <dd className="font-semibold text-slate-800">
                          {paymentRequest.selectedInstitutionName || 'Bangla QR'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">নির্ধারিত পরিমাণ</dt>
                        <dd className="font-bold text-slate-900">
                          {fmt(paymentRequest.requestedAmount)} {paymentRequest.currency}
                        </dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      onClick={() => fetchPaymentRequest(false)}
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-900 cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-sky-700" aria-hidden="true" />
                      <span>স্ট্যাটাস চেক করুন</span>
                    </button>
                  </section>
                )}

                {/* STATE: ক্যাশ অন ডেলিভারি নির্বাচিত */}
                {paymentRequest.status === 'cod_selected' && (
                  <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <Banknote className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          ক্যাশ অন ডেলিভারি নির্বাচিত হয়েছে
                        </h2>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          অর্ডার <strong className="font-mono">#{paymentRequest.orderId || paymentRequest.requestRef}</strong> ক্যাশ অন ডেলিভারি হিসেবে সংরক্ষিত হয়েছে। ডেলিভারির সময়{' '}
                          <strong className="font-mono text-slate-900">
                            {fmt(paymentRequest.requestedAmount)} {paymentRequest.currency}
                          </strong>{' '}
                          পরিশোধ করুন।
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* STATE: পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে (CANCELLED) */}
                {paymentRequest.status === 'cancelled' && (
                  <section
                    data-testid="payment-cancelled-panel"
                    className="rounded-xl border border-rose-200 bg-rose-50/70 p-5 space-y-3"
                  >
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1.5">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে
                        </h2>
                        <p className="text-sm text-rose-900 leading-relaxed">
                          {paymentRequest.cancellationReason ||
                            paymentRequest.revokedReason ||
                            'এই পেমেন্ট রিকোয়েস্টটি বাতিল করা হয়েছে এবং আর কোনো পেমেন্ট গ্রহণ করা হচ্ছে না।'}
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://wa.me/8801326370218"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm"
                    >
                      <MessageCircle className="w-4 h-4" aria-hidden="true" />
                      <span>WhatsApp-এ সহায়তা নিন</span>
                    </a>
                  </section>
                )}

                {/* STATE: EXPIRED OR REVOKED */}
                {(paymentRequest.status === 'expired' || paymentRequest.status === 'revoked') && (
                  <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-slate-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div className="space-y-1">
                        <h2 className="text-lg font-extrabold text-slate-900">
                          {paymentRequest.status === 'expired'
                            ? 'পেমেন্ট লিংকের মেয়াদ শেষ হয়েছে'
                            : 'নতুন পেমেন্ট লিংক ইস্যু করা হয়েছে'}
                        </h2>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {paymentRequest.revokedReason ||
                            'এই পেমেন্ট লিংকটি আর সক্রিয় নয়। নতুন লিংকের জন্য DSLink-এ যোগাযোগ করুন।'}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                {/* ACTIVE PAYABLE VIEW: BUILD STRICTLY FROM SERVER-APPROVED eligibleMethods */}
                {statusMeta.acceptsPayment && (
                  <div className="space-y-4">
                    {paymentRequest.status === 'rejected' && paymentRequest.rejectionReason && (
                      <div
                        role="alert"
                        className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-rose-900"
                      >
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <p className="font-bold">আগের ট্রানজেকশন আইডি যাচাই হয়নি</p>
                          <p className="mt-0.5 text-rose-800">{paymentRequest.rejectionReason}</p>
                        </div>
                      </div>
                    )}

                    {/* INTERNATIONAL DESTINATION WHEN STRIPE CARD IS DISABLED/UNCONFIGURED */}
                    {enabledTabs.length === 0 ? (
                      <section
                        data-testid="card-unavailable-destination-notice"
                        className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <CreditCard className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                          <div className="space-y-1.5">
                            <h2 className="text-base font-bold text-slate-900">
                              Card Payment Currently Unavailable for{' '}
                              {paymentRequest.countryName || paymentRequest.countryCode}
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                              Orders shipped outside Bangladesh are billed in{' '}
                              <strong>USD ({fmt(paymentRequest.requestedAmount)} USD)</strong> via
                              Card only. Online card checkout is currently unavailable for this
                              destination — your checkout draft remains unpaid. Please contact
                              DSLink support on WhatsApp for assistance.
                            </p>
                          </div>
                        </div>
                        <a
                          href="https://wa.me/8801326370218"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs sm:text-sm"
                        >
                          <MessageCircle className="w-4 h-4" aria-hidden="true" />
                          <span>Contact DSLink on WhatsApp</span>
                        </a>
                      </section>
                    ) : (
                      <>
                        {/* SERVER-APPROVED PAYMENT METHOD TABS */}
                        <div className="space-y-2">
                          <h2 className="text-sm font-bold text-slate-900">
                            পেমেন্ট মাধ্যম নির্বাচন করুন
                          </h2>
                          <div
                            role="tablist"
                            aria-label="Eligible payment methods"
                            className={`grid ${tabGridColsClass} gap-2`}
                          >
                            {enabledTabs.includes('mfs') && (
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'mfs'}
                                onClick={() => {
                                  setActiveTab('mfs');
                                  setSubmitError(null);
                                }}
                                className={`min-h-[54px] px-2.5 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer ${
                                  activeTab === 'mfs'
                                    ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="text-[11px] sm:text-xs font-bold leading-tight">
                                  মোবাইল ব্যাংকিং
                                </span>
                              </button>
                            )}

                            {enabledTabs.includes('bank') && (
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'bank'}
                                onClick={() => {
                                  setActiveTab('bank');
                                  setSubmitError(null);
                                }}
                                className={`min-h-[54px] px-2.5 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer ${
                                  activeTab === 'bank'
                                    ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <Building2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="text-[11px] sm:text-xs font-bold leading-tight">
                                  ব্যাংক
                                </span>
                              </button>
                            )}

                            {enabledTabs.includes('card') && (
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'card'}
                                onClick={() => {
                                  setActiveTab('card');
                                  setSubmitError(null);
                                }}
                                className={`min-h-[54px] px-2.5 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer ${
                                  activeTab === 'card'
                                    ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <CreditCard className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="text-[11px] sm:text-xs font-bold leading-tight">
                                  কার্ড (Card)
                                </span>
                              </button>
                            )}

                            {enabledTabs.includes('cod') && (
                              <button
                                type="button"
                                role="tab"
                                aria-selected={activeTab === 'cod'}
                                onClick={() => {
                                  setActiveTab('cod');
                                  setSubmitError(null);
                                }}
                                className={`min-h-[54px] px-2.5 py-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-colors cursor-pointer ${
                                  activeTab === 'cod'
                                    ? 'border-[#0284c7] bg-[#0284c7] text-white shadow-xs'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <Banknote className="w-4 h-4 shrink-0" aria-hidden="true" />
                                <span className="text-[11px] sm:text-xs font-bold leading-tight">
                                  ক্যাশ অন ডেলিভারি
                                </span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* TAB CONTENT: MFS OR BANK PROVIDER TILES (Clicking ANY tile opens the ONE Bangla QR Overlay) */}
                        {(activeTab === 'mfs' || activeTab === 'bank') && (
                          <div className="space-y-3">
                            {/* Bilingual Search (Bangla & English) */}
                            <div className="relative">
                              <Search
                                className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                aria-hidden="true"
                              />
                              <input
                                type="search"
                                value={providerQuery}
                                onChange={(e) => setProviderQuery(e.target.value)}
                                placeholder={
                                  activeTab === 'mfs'
                                    ? 'বিকাশ, নগদ, রকেট, উপায় খুঁজুন...'
                                    : 'ব্যাংক খুঁজুন (যেমন: City, BRAC, DBBL, ইসলামী)...'
                                }
                                aria-label="ওয়ালেট বা ব্যাংক খুঁজুন"
                                className="w-full min-h-[44px] pl-9 pr-9 rounded-xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:border-[#0284c7] text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                              />
                              {providerQuery && (
                                <button
                                  type="button"
                                  onClick={() => setProviderQuery('')}
                                  aria-label="সার্চ মুছুন"
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                                >
                                  <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                              )}
                            </div>

                            <p className="text-xs text-slate-600">
                              যেকোনো {activeTab === 'mfs' ? 'মোবাইল ওয়ালেট' : 'ব্যাংক'} নির্বাচন করলে সাথে সাথে DEVSPARK LINK Bangla QR পেমেন্ট উইন্ডো খুলবে।
                            </p>

                            {activeProviders.length > 0 ? (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {activeProviders.map((provider) => (
                                  <button
                                    key={provider.id}
                                    id={`dslink-provider-tile-${provider.id}`}
                                    type="button"
                                    data-testid={`provider-tile-${provider.id}`}
                                    onClick={() => handleOpenManualQrOverlay(provider)}
                                    className="rounded-xl border border-slate-200 bg-white hover:border-[#0284c7] hover:bg-sky-50/40 focus:outline-none focus:ring-2 focus:ring-[#0284c7] p-2.5 flex flex-col items-center gap-1.5 text-center transition-colors cursor-pointer min-w-0"
                                  >
                                    <ProviderLogoFrame provider={provider} />
                                    <span className="text-xs font-bold text-slate-900 leading-snug line-clamp-2 break-words">
                                      {provider.nameBn}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600 space-y-2">
                                <p>কোনো মিল পাওয়া যায়নি।</p>
                                {crossTabMatches.length > 0 && (
                                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                                    {crossTabMatches.map((p) => (
                                      <button
                                        key={p.id}
                                        id={`dslink-provider-tile-${p.id}`}
                                        type="button"
                                        onClick={() => handleOpenManualQrOverlay(p)}
                                        className="px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-sky-800 font-semibold cursor-pointer"
                                      >
                                        {p.nameBn}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* TAB CONTENT: CARD VIA STRIPE HOSTED CHECKOUT */}
                        {activeTab === 'card' && enabledTabs.includes('card') && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                            <div className="flex items-start gap-3">
                              <CreditCard className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" aria-hidden="true" />
                              <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900">
                                  কার্ড পেমেন্ট (Visa / Mastercard — Stripe)
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                  আপনাকে Stripe-এর নিরাপদ হোস্টেড পেমেন্ট পেজে নেওয়া হবে। DSLink কখনোই আপনার কার্ড নম্বর, CVV বা OTP সংগ্রহ করে না।
                                </p>
                              </div>
                            </div>

                            {submitError && (
                              <div
                                role="alert"
                                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2"
                              >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{submitError}</span>
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={submitting}
                              onClick={handlePayWithCard}
                              className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition-colors"
                            >
                              {submitting
                                ? 'প্রসেস হচ্ছে...'
                                : `কার্ডে পরিশোধ করুন — ${fmt(paymentRequest.requestedAmount)} ${paymentRequest.currency}`}
                            </button>
                          </div>
                        )}

                        {/* TAB CONTENT: ELIGIBLE CASH ON DELIVERY (ONLY BD PURCHASE KITS) */}
                        {activeTab === 'cod' && enabledTabs.includes('cod') && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
                            <div className="flex items-start gap-3">
                              <Banknote className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                              <div className="space-y-1">
                                <h3 className="text-sm font-bold text-slate-900">
                                  ক্যাশ অন ডেলিভারি (Cash on Delivery)
                                </h3>
                                {paymentRequest.codAdvanceRequiredAmount &&
                                paymentRequest.codAdvanceRequiredAmount > 0 ? (
                                  <p className="text-xs text-slate-700 leading-relaxed">
                                    এই অর্ডারে COD কনফার্ম করতে এখন{' '}
                                    <strong>
                                      {fmt(paymentRequest.codAdvanceRequiredAmount)}{' '}
                                      {paymentRequest.currency}
                                    </strong>{' '}
                                    অগ্রিম পরিশোধ করতে হবে এবং ডেলিভারির সময় বাকি{' '}
                                    <strong>
                                      {fmt(paymentRequest.codRemainingOnDeliveryAmount || 0)}{' '}
                                      {paymentRequest.currency}
                                    </strong>{' '}
                                    পরিশোধ করতে হবে। অনুগ্রহ করে মোবাইল ব্যাংকিং বা ব্যাংক ট্যাব থেকে অগ্রিম পরিশোধ করুন।
                                  </p>
                                ) : (
                                  <p className="text-xs text-slate-600 leading-relaxed">
                                    পণ্য হাতে পাওয়ার পর ডেলিভারি প্রতিনিধির কাছে{' '}
                                    <strong className="font-mono text-slate-900">
                                      {fmt(paymentRequest.requestedAmount)} {paymentRequest.currency}
                                    </strong>{' '}
                                    পরিশোধ করুন। পেমেন্ট সংগ্রহ না হওয়া পর্যন্ত অর্ডারটি ডেলিভারিতে প্রদেয় (Due on Delivery) হিসেবে সংরক্ষিত থাকবে।
                                  </p>
                                )}
                              </div>
                            </div>

                            {submitError && (
                              <div
                                role="alert"
                                className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2"
                              >
                                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                                <span>{submitError}</span>
                              </div>
                            )}

                            {paymentRequest.codAdvanceRequiredAmount &&
                            paymentRequest.codAdvanceRequiredAmount > 0 ? (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={handleStartCodAdvance}
                                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition-colors"
                              >
                                {submitting
                                  ? 'অগ্রিম পেমেন্ট তৈরি হচ্ছে...'
                                  : `অগ্রিম ${fmt(paymentRequest.codAdvanceRequiredAmount)} ${paymentRequest.currency} পরিশোধ করে COD নিশ্চিত করুন`}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={handleSelectCod}
                                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm cursor-pointer transition-colors"
                              >
                                {submitting
                                  ? 'নিশ্চিত করা হচ্ছে...'
                                  : `ক্যাশ অন ডেলিভারি নিশ্চিত করুন (${fmt(paymentRequest.requestedAmount)} ${paymentRequest.currency})`}
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          ONE SHARED MANUAL BANGLA QR OVERLAY FOR ALL ENABLED WALLETS & BANKS
          Desktop: Compact Centered White Modal | Mobile & PWA: White Bottom Sheet
          with ONE Scrollable Content Area, Visible Header, and Safe-Area Padding.
          URL stays unchanged; closing returns focus cleanly to the provider tile.
          ===================================================================== */}
      {canShowManualOverlay && selectedQrProvider && paymentRequest && (() => {
        const providerAccent = getProviderAccentTheme(selectedQrProvider.id);
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dslink-qr-overlay-title"
            data-testid="manual-bangla-qr-overlay"
            data-provider-id={selectedQrProvider.id}
            data-provider-accent={providerAccent.accentHex}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/55 sm:p-4 overflow-x-clip"
            onClick={(e) => {
              if (e.target === e.currentTarget && !submitting) {
                handleCloseManualQrOverlay();
              }
            }}
          >
            <div className="w-full sm:max-w-[400px] bg-white text-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl max-h-[90dvh] flex flex-col overflow-hidden">
              {/* Small Provider Accent Header Detail */}
              <div
                aria-hidden="true"
                className={`h-1.5 w-full shrink-0 ${providerAccent.headerBarClass}`}
              />

              {/* 1. DSLink Header, Selected Provider & Close Button (Remains Visible at Top) */}
              <div className="shrink-0 bg-white border-b border-slate-200 px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={LIGHT_HEADER_LOGO_URL}
                      alt="DEVSPARK LINK"
                      width={112}
                      height={24}
                      className="h-5 w-auto object-contain shrink-0"
                    />
                    <span className="h-3.5 w-px bg-slate-300 shrink-0" aria-hidden="true" />
                    <span className="text-xs font-extrabold tracking-tight text-slate-900 truncate">
                      DSLink Pay
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleCloseManualQrOverlay}
                    aria-label="বন্ধ করুন"
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-100 min-w-0">
                  <ProviderLogoFrame provider={selectedQrProvider} compact />
                  <div className="min-w-0 flex-1">
                    <h2
                      id="dslink-qr-overlay-title"
                      className="text-xs sm:text-sm font-extrabold text-slate-900 truncate"
                    >
                      {selectedQrProvider.nameBn}
                    </h2>
                    <p
                      className={`text-[11px] font-semibold truncate ${providerAccent.amountBadgeClass}`}
                    >
                      {MANUAL_BANGLA_QR_PROVIDER_LABEL_BN}
                    </p>
                  </div>
                </div>
              </div>

              {/* Single Scrollable Content Area (Safe-Area Padding & Keyboard-Reachable Input) */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 pb-[max(1rem,env(safe-area-inset-bottom))] space-y-2.5">
                {paymentRequest.status === 'under_review' ? (
                  /* After successful submission, replace the form with "পেমেন্ট যাচাই চলছে" */
                  <div
                    data-testid="overlay-under-review-state"
                    className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2.5 text-center"
                  >
                    <Clock className="w-7 h-7 text-amber-600 mx-auto" aria-hidden="true" />
                    <h3 className="text-base font-extrabold text-slate-900">
                      পেমেন্ট যাচাই চলছে
                    </h3>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      আপনার ট্রানজেকশন আইডি{' '}
                      <strong className="font-mono text-slate-900">
                        {paymentRequest.submittedTrxId}
                      </strong>{' '}
                      জমা হয়েছে। DSLink টিম যাচাই সম্পন্ন করলে অর্ডার নিশ্চিত করা হবে।
                    </p>
                    <button
                      type="button"
                      onClick={handleCloseManualQrOverlay}
                      className={`w-full min-h-[42px] px-4 py-2 rounded-xl font-bold text-xs sm:text-sm cursor-pointer transition-colors ${providerAccent.primaryButtonClass}`}
                    >
                      পেমেন্ট স্ট্যাটাস দেখুন
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 2. Exact Payable Amount and Merchant Name, with "পরিমাণ কপি" */}
                    <div
                      className={`rounded-xl border px-3 py-2 flex items-center justify-between gap-2 ${providerAccent.amountBoxClass}`}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-slate-600 truncate">
                          {paymentRequest.merchant.name}
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 tabular-nums">
                            {fmt(paymentRequest.requestedAmount)}
                          </span>
                          <span
                            className={`text-xs font-bold ${providerAccent.amountBadgeClass}`}
                          >
                            {paymentRequest.currency}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy('overlay-amt', String(paymentRequest.requestedAmount))
                        }
                        className="min-h-[34px] inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 shrink-0 cursor-pointer"
                      >
                        {copiedKey === 'overlay-amt' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            <span>কপি হয়েছে</span>
                          </>
                        ) : (
                          <>
                            <Copy
                              className={`w-3.5 h-3.5 ${providerAccent.amountBadgeClass}`}
                              aria-hidden="true"
                            />
                            <span>পরিমাণ কপি</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 3. Shared Merchant Bangla QR with "QR ডাউনলোড" (Preserves Proportions & Quiet Zone) */}
                    <div className="flex flex-col items-center gap-1.5">
                      <img
                        src={paymentRequest.merchant.banglaQrImageUrl}
                        alt="DEV SPARK SOFT LIMITED Official Bangla QR"
                        className="w-44 sm:w-48 h-auto object-contain rounded-lg border border-slate-200 bg-white p-1.5"
                      />
                      <a
                        href={paymentRequest.merchant.banglaQrImageUrl}
                        download="DSLink-Bangla-QR.jpg"
                        className="min-h-[32px] inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800"
                      >
                        <Download
                          className={`w-3.5 h-3.5 ${providerAccent.amountBadgeClass}`}
                          aria-hidden="true"
                        />
                        <span>QR ডাউনলোড</span>
                      </a>
                    </div>

                    {/* 4. Short Scan-and-Pay Instructions */}
                    <p
                      data-testid="manual-bangla-qr-instructions"
                      className="text-xs text-slate-700 leading-snug bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                    >
                      {MANUAL_BANGLA_QR_INSTRUCTIONS_BN}
                    </p>

                    {/* 5 & 6. "ট্রানজেকশন আইডি (TrxID)" Field and "যাচাইয়ের জন্য জমা দিন" Button */}
                    <form onSubmit={handleSubmitManualTrxId} className="space-y-2.5 pt-0.5">
                      <div>
                        <label
                          htmlFor="dslink-trx-id-input"
                          className="block text-xs font-bold text-slate-900 mb-1"
                        >
                          ট্রানজেকশন আইডি (TrxID)
                        </label>
                        <input
                          id="dslink-trx-id-input"
                          type="text"
                          required
                          autoComplete="off"
                          value={trxId}
                          onFocus={(e) => {
                            e.currentTarget.scrollIntoView({
                              block: 'nearest',
                              behavior: 'smooth',
                            });
                          }}
                          onChange={(e) => setTrxId(e.target.value)}
                          placeholder="যেমন: BKA9X2M7Q4"
                          className={`w-full min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none ${providerAccent.inputFocusClass}`}
                        />
                      </div>

                      {submitError && (
                        <div
                          role="alert"
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 flex items-start gap-2"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl disabled:opacity-50 font-extrabold text-sm cursor-pointer transition-colors ${providerAccent.primaryButtonClass}`}
                      >
                        {submitting ? 'জমা হচ্ছে...' : 'যাচাইয়ের জন্য জমা দিন'}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DSLinkPayPage;
