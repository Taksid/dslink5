import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Link2,
  Mail,
  MessageCircle,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import {
  DSLinkPayConfigDiagnostics,
  DSLinkPayCurrency,
  DSLinkPayEmailJob,
  DSLinkPayRequestAdmin,
  DSLinkPayType,
  formatPayAmount,
  getDSLinkPayStatusMeta,
} from '../lib/dslinkPayConfig';
import { RENTAL_SUBSCRIPTION_PLANS, RentalSubscriptionPlanConfig } from '../lib/dslinkPayRules';

interface AdminOrderWithPay {
  orderId: string;
  draftId?: string;
  customerName: string;
  phone: string;
  email: string;
  countryCode: string;
  countryName?: string;
  currency: DSLinkPayCurrency;
  productName: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paidAmount: number;
  remainingBalanceAmount: number;
  paidAmountBdt: number;
  remainingBalanceBdt: number;
  codAvailable: boolean;
  isRentalOrder: boolean;
  subscriptionPaymentStatus?: string;
  activeSubscriptionPlan?: string;
  subscriptionBillingPeriod?: string;
  deliveredAt?: string;
  paymentMethod: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  status: string;
  createdAt: string;
  paymentRequests: DSLinkPayRequestAdmin[];
}

interface AdminDSLinkPayPanelProps {
  adminEmail: string;
  onNavigate?: (path: string) => void;
}

export const AdminDSLinkPayPanel: React.FC<AdminDSLinkPayPanelProps> = ({
  adminEmail,
  onNavigate,
}) => {
  const [orders, setOrders] = useState<AdminOrderWithPay[]>([]);
  const [requests, setRequests] = useState<DSLinkPayRequestAdmin[]>([]);
  const [pendingPayments, setPendingPayments] = useState<DSLinkPayRequestAdmin[]>([]);
  const [emailJobs, setEmailJobs] = useState<DSLinkPayEmailJob[]>([]);
  const [diagnostics, setDiagnostics] = useState<DSLinkPayConfigDiagnostics | null>(null);
  const [rentalPlans, setRentalPlans] = useState<readonly RentalSubscriptionPlanConfig[]>(
    RENTAL_SUBSCRIPTION_PLANS
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Staff payment request creator state
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [paymentType, setPaymentType] = useState<DSLinkPayType>('full');
  const [advanceAmountInput, setAdvanceAmountInput] = useState('');
  const [expiresInHours, setExpiresInHours] = useState('72');
  const [staffNote, setStaffNote] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(RENTAL_SUBSCRIPTION_PLANS[0].id);
  const [billingPeriod, setBillingPeriod] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [creating, setCreating] = useState(false);
  const [latestCreated, setLatestCreated] = useState<DSLinkPayRequestAdmin | null>(null);

  // Action states
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reasonMap, setReasonMap] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quoteTotalInput, setQuoteTotalInput] = useState('');
  const [quoteReasonInput, setQuoteReasonInput] = useState('');
  const [updatingQuote, setUpdatingQuote] = useState(false);

  const fetchDSLinkPayData = useCallback(async () => {
    const email = adminEmail.trim();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dslink-pay/orders', {
        headers: { 'x-admin-email': email },
        cache: 'no-store',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not load DSLink Pay orders.');
        return;
      }
      const nextOrders: AdminOrderWithPay[] = data.orders || [];
      setOrders(nextOrders);
      setRequests(data.paymentRequests || []);
      setPendingPayments(data.pendingPayments || []);
      setEmailJobs(data.emailJobs || []);
      if (data.diagnostics) setDiagnostics(data.diagnostics);
      if (Array.isArray(data.rentalPlans) && data.rentalPlans.length > 0) {
        setRentalPlans(data.rentalPlans);
      }
      setSelectedOrderId((prev) => {
        if (prev && nextOrders.some((o) => o.orderId === prev)) return prev;
        const firstUnpaid = nextOrders.find((o) => o.remainingBalanceAmount > 0);
        return firstUnpaid?.orderId || nextOrders[0]?.orderId || '';
      });
    } catch {
      setError('Failed to connect to DSLink Pay admin API.');
    } finally {
      setLoading(false);
    }
  }, [adminEmail]);

  useEffect(() => {
    fetchDSLinkPayData();
  }, [fetchDSLinkPayData]);

  const selectedOrder = useMemo(
    () => orders.find((o) => o.orderId === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  useEffect(() => {
    if (!selectedOrder) return;
    if (selectedOrder.isRentalOrder && paymentType === 'advance') {
      setPaymentType('full');
    }
    if (!selectedOrder.isRentalOrder && paymentType === 'subscription') {
      setPaymentType('full');
    }
  }, [selectedOrder, paymentType]);

  const selectedPlan = useMemo(
    () => rentalPlans.find((p) => p.id === selectedPlanId) || rentalPlans[0],
    [rentalPlans, selectedPlanId]
  );

  const previewCurrency: DSLinkPayCurrency =
    paymentType === 'subscription' ? 'BDT' : selectedOrder?.currency || 'BDT';

  const previewRequestedAmount = useMemo(() => {
    if (!selectedOrder) return 0;
    if (paymentType === 'subscription') return selectedPlan?.monthlyFeeBdt || 6000;
    if (paymentType === 'full' || paymentType === 'remaining') {
      return selectedOrder.remainingBalanceAmount;
    }
    const parsed = Number(advanceAmountInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }, [selectedOrder, paymentType, advanceAmountInput, selectedPlan]);

  const handleCopyLink = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setError(null);
    setNotice(null);

    if (paymentType !== 'subscription' && selectedOrder.remainingBalanceAmount <= 0) {
      setError('এই অর্ডারটি ইতিমধ্যে সম্পূর্ণ পরিশোধিত।');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/dslink-pay/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail.trim(),
        },
        body: JSON.stringify({
          orderId: selectedOrder.orderId,
          paymentType,
          ...(paymentType === 'advance' ? { amount: previewRequestedAmount } : {}),
          ...(paymentType === 'subscription' ? { planId: selectedPlanId, billingPeriod } : {}),
          expiresInHours: Number(expiresInHours) || 72,
          note: staffNote.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.paymentRequest) {
        setError(data?.error || 'Could not create DSLink Pay link.');
        return;
      }
      setLatestCreated(data.paymentRequest);
      setNotice(
        data.message ||
          `অর্ডার #${selectedOrder.orderId}-এর জন্য DSLink Pay লিংক তৈরি হয়েছে (${formatPayAmount(
            data.paymentRequest.requestedAmount,
            data.paymentRequest.currency
          )} ${data.paymentRequest.currency})।`
      );
      setAdvanceAmountInput('');
      setStaffNote('');
      await fetchDSLinkPayData();
    } catch {
      setError('Network error while creating payment request.');
    } finally {
      setCreating(false);
    }
  };

  const handleRequestAction = async (
    reqItem: DSLinkPayRequestAdmin,
    action: 'verify' | 'reject' | 'cancel' | 'expire' | 'reissue'
  ) => {
    setError(null);
    setNotice(null);
    setBusyId(reqItem.id);
    try {
      const reasonInput = reasonMap[reqItem.id]?.trim();
      const payload =
        action === 'reject'
          ? { reason: reasonInput || 'Transaction ID could not be matched.' }
          : action === 'cancel'
          ? { reason: reasonInput || 'পেমেন্ট রিকোয়েস্ট DSLink টিম দ্বারা বাতিল করা হয়েছে।' }
          : {};
      const res = await fetch(
        `/api/admin/dslink-pay/requests/${encodeURIComponent(reqItem.id)}/${action}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail.trim(),
          },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || `Action "${action}" failed.`);
        return;
      }
      if (action === 'reissue' && data.paymentRequest) {
        setLatestCreated(data.paymentRequest);
      }
      setNotice(
        data.message ||
          `Payment request #${reqItem.requestRef} updated (${action}).`
      );
      await fetchDSLinkPayData();
    } catch {
      setError('Network error executing payment action.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkRentalDelivered = async (order: AdminOrderWithPay) => {
    setError(null);
    setNotice(null);
    setBusyId(`deliver-${order.orderId}`);
    try {
      const res = await fetch(
        `/api/admin/dslink-pay/orders/${encodeURIComponent(order.orderId)}/mark-delivered`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail.trim(),
          },
          body: JSON.stringify({
            planId: selectedPlanId,
            billingPeriod,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not mark rental order delivered.');
        return;
      }
      if (data.subscriptionPaymentRequest) {
        setLatestCreated(data.subscriptionPaymentRequest);
      }
      setNotice(
        data.subscriptionReused
          ? `Order #${order.orderId} marked Delivered and reused existing subscription payment link.`
          : `Order #${order.orderId} marked Delivered and issued single subscription payment link.`
      );
      await fetchDSLinkPayData();
    } catch {
      setError('Network error marking order delivered.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRetryEmail = async (jobId: string) => {
    setError(null);
    setNotice(null);
    setBusyId(`email-${jobId}`);
    try {
      const res = await fetch(
        `/api/admin/dslink-pay/email-jobs/${encodeURIComponent(jobId)}/retry`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail.trim(),
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Email retry failed.');
        return;
      }
      setNotice(`Email job ${jobId} retried (status: ${data.emailJob?.status || 'updated'}).`);
      await fetchDSLinkPayData();
    } catch {
      setError('Network error retrying email.');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateOrderQuote = async () => {
    if (!selectedOrder || updatingQuote) return;
    const parsedTotal = Number(quoteTotalInput);
    if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
      setError('অনুগ্রহ করে সঠিক নতুন মোট পরিমাণ (Total Amount) লিখুন।');
      return;
    }
    setError(null);
    setNotice(null);
    setUpdatingQuote(true);
    try {
      const res = await fetch(
        `/api/admin/dslink-pay/orders/${encodeURIComponent(selectedOrder.orderId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail.trim(),
          },
          body: JSON.stringify({
            totalAmount: parsedTotal,
            reason: quoteReasonInput.trim() || 'Finalized quote updated by DSLink staff',
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(data?.error || 'Could not update order quote.');
        return;
      }
      if (data.paymentRequest) {
        setLatestCreated(data.paymentRequest);
      }
      setNotice(
        `Order #${selectedOrder.orderId} quote updated to ${formatPayAmount(parsedTotal, selectedOrder.currency)} ${selectedOrder.currency}; previous active link revoked and new link issued.`
      );
      setQuoteTotalInput('');
      setQuoteReasonInput('');
      await fetchDSLinkPayData();
    } catch {
      setError('Network error updating order quote.');
    } finally {
      setUpdatingQuote(false);
    }
  };

  const filteredRequests = useMemo(() => {
    if (statusFilter === 'ALL') return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const underReviewList = useMemo(
    () => pendingPayments.filter((r) => r.status === 'under_review'),
    [pendingPayments]
  );
  const rentalOrders = useMemo(() => orders.filter((o) => o.isRentalOrder), [orders]);

  return (
    <div className="space-y-6">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="rounded-xl border border-slate-700 bg-[#0b0f17] p-4">
          <div className="text-slate-300">চূড়ান্ত অর্ডার (Final Orders)</div>
          <div className="text-2xl font-mono font-bold text-white mt-1 tabular-nums">
            {orders.length}
          </div>
        </div>
        <div className="rounded-xl border border-amber-400/50 bg-[#0b0f17] p-4">
          <div className="text-amber-200">Pending Payments (TrxID জমা)</div>
          <div className="text-2xl font-mono font-bold text-amber-300 mt-1 tabular-nums">
            {underReviewList.length}
          </div>
        </div>
        <div className="rounded-xl border border-cyan-400/40 bg-[#0b0f17] p-4">
          <div className="text-cyan-200">সক্রিয় পেমেন্ট লিংক</div>
          <div className="text-2xl font-mono font-bold text-cyan-300 mt-1 tabular-nums">
            {requests.filter((r) => r.status === 'pending').length}
          </div>
        </div>
        <div className="rounded-xl border border-emerald-400/40 bg-[#0b0f17] p-4">
          <div className="text-emerald-200">নিশ্চিতকৃত (Paid)</div>
          <div className="text-2xl font-mono font-bold text-emerald-300 mt-1 tabular-nums">
            {requests.filter((r) => r.status === 'paid').length}
          </div>
        </div>
      </div>

      {/* CONFIGURATION DIAGNOSTICS STRIP */}
      {diagnostics && (
        <section className="rounded-xl border border-slate-700 bg-[#0b0f17] p-4 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-300" aria-hidden="true" />
              <span>DSLink Pay Configuration Diagnostics</span>
            </div>
            <div className="flex flex-wrap gap-2 font-mono text-[11px]">
              <span
                className={`px-2 py-0.5 rounded border ${
                  diagnostics.stripeEnabled && diagnostics.stripeSecretConfigured
                    ? 'border-emerald-400/50 text-emerald-200 bg-emerald-950/30'
                    : 'border-slate-600 text-slate-300 bg-slate-900'
                }`}
              >
                Stripe: {diagnostics.stripeEnabled ? 'ENABLED' : 'DISABLED (PROD SAFE)'}
              </span>
              <span
                className={`px-2 py-0.5 rounded border ${
                  diagnostics.emailApiConfigured
                    ? 'border-emerald-400/50 text-emerald-200 bg-emerald-950/30'
                    : 'border-amber-400/50 text-amber-200 bg-amber-950/30'
                }`}
              >
                Email API: {diagnostics.emailApiConfigured ? 'CONFIGURED' : 'MISSING RESEND_API_KEY'}
              </span>
              <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-200 bg-[#04070c]">
                Rental Ship: ৳{diagnostics.rentalShippingFeeBdt} ({diagnostics.rentalActivationCollectionRule})
              </span>
              <span className="px-2 py-0.5 rounded border border-slate-700 text-slate-200 bg-[#04070c]">
                Intl Ship: ${diagnostics.internationalShippingUsd.toFixed(2)} USD
              </span>
            </div>
          </div>
          {diagnostics.warnings.length > 0 && (
            <ul className="list-disc pl-5 space-y-1 text-amber-200/90">
              {diagnostics.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-400/50 bg-rose-950/35 p-4 text-xs sm:text-sm text-rose-100 flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-400/50 bg-emerald-950/30 p-4 text-xs sm:text-sm text-emerald-100 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      {/* DEDICATED PENDING PAYMENTS QUEUE (Submitted TrxIDs + Checkout Drafts) */}
      <section className="rounded-2xl border border-amber-400/45 bg-[#0b0f17] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-300" aria-hidden="true" />
              <span>Pending Payments — যাচাই অপেক্ষমাণ পেমেন্ট ({underReviewList.length})</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              গ্রাহক TrxID জমা দেওয়ার পর এখানে দেখা যাবে। Confirm করলে চূড়ান্ত অর্ডার তৈরি/আপডেট হবে এবং Confirmation ইমেইল পাঠানো হবে।
            </p>
          </div>
          <button
            type="button"
            onClick={fetchDSLinkPayData}
            disabled={loading}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-600 bg-[#04070c] hover:border-cyan-400 text-xs font-semibold text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-300 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>রিফ্রেশ</span>
          </button>
        </div>

        {underReviewList.length === 0 ? (
          <p className="text-xs sm:text-sm text-slate-300 py-2">
            এই মুহূর্তে যাচাইয়ের জন্য কোনো জমাকৃত TrxID নেই।
          </p>
        ) : (
          <div className="space-y-3">
            {underReviewList.map((pr) => {
              const isBusy = busyId === pr.id;
              return (
                <article
                  key={`pending-${pr.id}`}
                  className="rounded-xl border border-amber-400/35 bg-[#04070c] p-4 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          #{pr.requestRef}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-400/50 text-amber-200 font-bold">
                          পেমেন্ট যাচাই চলছে
                        </span>
                        {pr.isDraftOnly && (
                          <span className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-400/40 text-cyan-200 font-mono">
                            DRAFT → ATOMIC ORDER ON CONFIRM
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300">{pr.productSummary}</p>
                    </div>
                    <div className="text-right font-mono tabular-nums">
                      <div className="text-base font-extrabold text-amber-200">
                        {formatPayAmount(pr.requestedAmount, pr.currency)} {pr.currency}
                      </div>
                      {pr.submittedAt && (
                        <div className="text-[11px] text-slate-400">
                          {new Date(pr.submittedAt).toLocaleString('en-GB', { timeZone: 'Asia/Dhaka' })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-[#0b0f17] p-3 font-mono">
                    <div>
                      <span className="text-slate-400 block">Submitted TrxID</span>
                      <span className="text-cyan-200 font-bold break-all">{pr.submittedTrxId || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Provider</span>
                      <span className="text-white">{pr.selectedInstitutionName || pr.submittedMethod || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Destination / Currency</span>
                      <span className="text-white">
                        {pr.countryName || pr.countryCode} ({pr.currency})
                      </span>
                    </div>
                  </div>

                  {pr.draft && (
                    <div className="rounded-lg border border-slate-800 bg-[#0b0f17] p-3 text-xs text-slate-300 space-y-1">
                      <div className="font-bold text-slate-100">Checkout Draft Details:</div>
                      <div>
                        {pr.draft.customerName} · {pr.draft.phone}
                        {pr.draft.email ? ` · ${pr.draft.email}` : ''}
                      </div>
                      <div className="text-slate-400">{pr.draft.address}</div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRequestAction(pr, 'verify')}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#04131a] font-extrabold cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                      <span>
                        {pr.isDraftOnly
                          ? 'Confirm & Create Final Order'
                          : 'Confirm Payment'}
                      </span>
                    </button>

                    <input
                      type="text"
                      value={reasonMap[pr.id] || ''}
                      onChange={(e) =>
                        setReasonMap((prev) => ({ ...prev, [pr.id]: e.target.value }))
                      }
                      placeholder="বাতিল বা রিজেক্টের কারণ লিখুন..."
                      className="min-h-[42px] px-3 py-1.5 rounded-lg bg-[#0b0f17] border border-slate-700 text-white placeholder:text-slate-400 outline-none flex-1 min-w-[200px]"
                    />

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRequestAction(pr, 'cancel')}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-500/20 border border-rose-400/50 hover:bg-rose-500/30 text-rose-200 font-bold cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" aria-hidden="true" />
                      <span>Cancel Request</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRequestAction(pr, 'reject')}
                      className="min-h-[42px] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-600 hover:border-amber-400 text-slate-200 cursor-pointer disabled:opacity-50"
                    >
                      <span>Retry TrxID</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* STAFF PAYMENT REQUEST CREATOR: "পেমেন্ট রিকোয়েস্ট তৈরি করুন" */}
      <section className="rounded-2xl border border-cyan-400/40 bg-[#0b0f17] p-5 sm:p-6 space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-cyan-300" aria-hidden="true" />
            <span>পেমেন্ট রিকোয়েস্ট তৈরি করুন (Full / Advance / Remaining / Subscription)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            বিদ্যমান অর্ডারের জন্য পূর্ণ, অগ্রিম, বাকি ব্যালেন্স বা রেন্টাল সাবস্ক্রিপশন DSLink Pay লিংক তৈরি করুন।
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm text-slate-300">
            এখনো কোনো চূড়ান্ত অর্ডার তৈরি হয়নি। Pending Payments থেকে Confirm করলে অর্ডার এখানে যুক্ত হবে।
          </p>
        ) : (
          <form onSubmit={handleCreateRequest} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 space-y-4">
              <div>
                <label htmlFor="admin-pay-order-select" className="block text-xs font-semibold text-slate-200 mb-1.5">
                  অর্ডার নির্বাচন করুন *
                </label>
                <select
                  id="admin-pay-order-select"
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 focus:border-cyan-400 px-3 py-2 text-xs sm:text-sm text-white outline-none"
                >
                  {orders.map((o) => (
                    <option key={o.orderId} value={o.orderId}>
                      #{o.orderId} ({o.countryCode}/{o.currency}) — {o.customerName} — বাকি:{' '}
                      {formatPayAmount(o.remainingBalanceAmount, o.currency)} / মোট:{' '}
                      {formatPayAmount(o.totalAmount, o.currency)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    { id: 'full', label: 'Full', disabled: !selectedOrder || selectedOrder.remainingBalanceAmount <= 0 },
                    {
                      id: 'advance',
                      label: 'Advance',
                      disabled: !selectedOrder || selectedOrder.isRentalOrder || selectedOrder.remainingBalanceAmount <= 1,
                    },
                    {
                      id: 'remaining',
                      label: 'Remaining',
                      disabled: !selectedOrder || selectedOrder.remainingBalanceAmount <= 0,
                    },
                    {
                      id: 'subscription',
                      label: 'Subscription',
                      disabled: !selectedOrder || !selectedOrder.isRentalOrder,
                    },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => setPaymentType(opt.id)}
                    className={`min-h-[44px] px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      paymentType === opt.id
                        ? 'border-cyan-400 bg-cyan-950/40 text-white'
                        : 'border-slate-700 bg-[#04070c] text-slate-200 hover:border-slate-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {paymentType === 'advance' && selectedOrder && (
                <div>
                  <label htmlFor="admin-pay-advance-amount" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    অগ্রিম পরিমাণ ({selectedOrder.currency}) *
                  </label>
                  <input
                    id="admin-pay-advance-amount"
                    type="number"
                    step={selectedOrder.currency === 'USD' ? '0.01' : '1'}
                    min={selectedOrder.currency === 'USD' ? 0.5 : 1}
                    required
                    value={advanceAmountInput}
                    onChange={(e) => setAdvanceAmountInput(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 focus:border-cyan-400 px-3 py-2 text-sm font-mono text-white outline-none"
                  />
                </div>
              )}

              {paymentType === 'subscription' && selectedOrder?.isRentalOrder && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="admin-sub-plan" className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Subscription Plan (BDT)
                    </label>
                    <select
                      id="admin-sub-plan"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 px-3 py-2 text-xs text-white outline-none"
                    >
                      {rentalPlans.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ৳{p.monthlyFeeBdt.toLocaleString('en-US')}/mo
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="admin-sub-period" className="block text-xs font-semibold text-slate-200 mb-1.5">
                      Billing Period (YYYY-MM)
                    </label>
                    <input
                      id="admin-sub-period"
                      type="text"
                      value={billingPeriod}
                      onChange={(e) => setBillingPeriod(e.target.value)}
                      className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 px-3 py-2 text-xs font-mono text-white outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admin-pay-expiry" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    লিংকের মেয়াদ
                  </label>
                  <select
                    id="admin-pay-expiry"
                    value={expiresInHours}
                    onChange={(e) => setExpiresInHours(e.target.value)}
                    className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="24">২৪ ঘণ্টা</option>
                    <option value="72">৭২ ঘণ্টা</option>
                    <option value="168">৭ দিন</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-pay-note" className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Internal Staff Note
                  </label>
                  <input
                    id="admin-pay-note"
                    type="text"
                    value={staffNote}
                    onChange={(e) => setStaffNote(e.target.value)}
                    placeholder="Optional note..."
                    className="w-full min-h-[44px] rounded-lg bg-[#04070c] border border-slate-600 px-3 py-2 text-xs text-white placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-slate-700 bg-[#04070c] p-4 space-y-3 text-xs">
              <div className="font-bold text-cyan-200 uppercase">Preview Before Finalizing</div>
              {selectedOrder && (
                <dl className="space-y-1.5 font-mono tabular-nums">
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Order</dt>
                    <dd className="text-white font-bold">#{selectedOrder.orderId}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-400">Destination</dt>
                    <dd className="text-white">
                      {selectedOrder.countryCode} ({previewCurrency})
                    </dd>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-800 text-sm">
                    <dt className="text-cyan-200 font-bold">Amount Due</dt>
                    <dd className="text-white font-extrabold">
                      {formatPayAmount(previewRequestedAmount, previewCurrency)} {previewCurrency}
                    </dd>
                  </div>
                </dl>
              )}
              <button
                type="submit"
                disabled={creating || !selectedOrder}
                className="w-full min-h-[46px] px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-[#04131a] font-extrabold text-sm cursor-pointer"
              >
                {creating ? 'লিংক তৈরি হচ্ছে...' : 'পেমেন্ট রিকোয়েস্ট তৈরি করুন'}
              </button>

              {selectedOrder && (
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-300">
                    Update Finalized Quote (Revokes Old Link &amp; Issues New)
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step={selectedOrder.currency === 'USD' ? '0.01' : '1'}
                      value={quoteTotalInput}
                      onChange={(e) => setQuoteTotalInput(e.target.value)}
                      placeholder={`New total (${selectedOrder.currency})`}
                      className="min-h-[38px] w-1/2 rounded-lg bg-[#0b0f17] border border-slate-700 px-2.5 text-xs font-mono text-white outline-none"
                    />
                    <input
                      type="text"
                      value={quoteReasonInput}
                      onChange={(e) => setQuoteReasonInput(e.target.value)}
                      placeholder="Quote change reason"
                      className="min-h-[38px] w-1/2 rounded-lg bg-[#0b0f17] border border-slate-700 px-2.5 text-xs text-white outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={updatingQuote || !quoteTotalInput.trim()}
                    onClick={handleUpdateOrderQuote}
                    className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-amber-400/50 bg-amber-950/30 hover:bg-amber-950/50 text-amber-200 font-bold text-xs cursor-pointer disabled:opacity-50"
                  >
                    {updatingQuote ? 'Updating Quote...' : 'Update Quote, Revoke Old & Reissue Link'}
                  </button>
                </div>
              )}
            </div>
          </form>
        )}

        {latestCreated && (
          <div className="rounded-xl border border-emerald-400/50 bg-emerald-950/20 p-4 space-y-3">
            <div className="text-sm font-bold text-emerald-200">
              DSLink Pay লিংক প্রস্তুত — #{latestCreated.requestRef} (
              {formatPayAmount(latestCreated.requestedAmount, latestCreated.currency)}{' '}
              {latestCreated.currency})
            </div>
            <div className="rounded-lg bg-[#04070c] border border-slate-700 px-3 py-2 font-mono text-xs text-cyan-200 break-all">
              {latestCreated.payUrl}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleCopyLink(`latest-${latestCreated.id}`, latestCreated.payUrl)}
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold text-xs cursor-pointer"
              >
                {copiedId === `latest-${latestCreated.id}` ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>কপি হয়েছে</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>লিংক কপি করুন</span>
                  </>
                )}
              </button>
              <a
                href={latestCreated.whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#04131a] font-bold text-xs"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>WhatsApp-এ শেয়ার করুন</span>
              </a>
              <button
                type="button"
                onClick={() =>
                  onNavigate
                    ? onNavigate(latestCreated.payPath)
                    : window.location.assign(latestCreated.payPath)
                }
                className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-600 bg-[#04070c] text-white font-semibold text-xs cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                <span>খুলুন</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* RENTAL DELIVERY & SINGLE SUBSCRIPTION LINK SECTION */}
      {rentalOrders.length > 0 && (
        <section className="rounded-2xl border border-slate-700 bg-[#0b0f17] p-5 sm:p-6 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-cyan-300" aria-hidden="true" />
            <span>Rental Orders — Delivery &amp; Subscription Billing ({rentalOrders.length})</span>
          </h2>
          <div className="space-y-2.5">
            {rentalOrders.map((ro) => (
              <div
                key={`rental-${ro.orderId}`}
                className="rounded-xl border border-slate-700 bg-[#04070c] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-mono font-bold text-white">
                    #{ro.orderId} · {ro.customerName} ({ro.fulfillmentStatus})
                  </div>
                  <div className="text-slate-300">
                    Subscription: {ro.subscriptionPaymentStatus || 'Not Billed Yet'}
                    {ro.activeSubscriptionPlan ? ` · ${ro.activeSubscriptionPlan} (${ro.subscriptionBillingPeriod})` : ''}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={busyId === `deliver-${ro.orderId}`}
                  onClick={() => handleMarkRentalDelivered(ro)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-[#04131a] font-bold cursor-pointer disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" aria-hidden="true" />
                  <span>Mark Delivered &amp; Issue Subscription Link</span>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ALL PAYMENT REQUESTS HISTORY */}
      <section className="rounded-2xl border border-slate-700 bg-[#0b0f17] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-300" aria-hidden="true" />
            <span>সকল পেমেন্ট রিকোয়েস্ট ({filteredRequests.length})</span>
          </h2>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {[
              { id: 'ALL', label: 'সব' },
              { id: 'under_review', label: 'যাচাই চলছে' },
              { id: 'pending', label: 'অপেক্ষমাণ' },
              { id: 'paid', label: 'নিশ্চিত' },
              { id: 'cancelled', label: 'বাতিল' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={`min-h-[34px] px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                  statusFilter === f.id
                    ? 'bg-cyan-400 text-[#04131a]'
                    : 'bg-[#04070c] border border-slate-700 text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredRequests.map((pr) => {
            const meta = getDSLinkPayStatusMeta(pr.status);
            const isBusy = busyId === pr.id;
            return (
              <article
                key={pr.id}
                className="rounded-xl border border-slate-700 bg-[#04070c] p-4 space-y-2.5 text-xs"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-sm text-white">#{pr.requestRef}</span>
                      <span className="px-2 py-0.5 rounded border border-slate-600 bg-slate-900 text-slate-200 font-bold">
                        {meta.labelBn}
                      </span>
                      <span className="font-mono text-slate-400 uppercase">
                        {pr.paymentType} · {pr.countryCode} · {pr.currency}
                      </span>
                    </div>
                    <p className="text-slate-300">{pr.productSummary}</p>
                  </div>
                  <div className="font-mono font-extrabold text-sm text-white tabular-nums">
                    {formatPayAmount(pr.requestedAmount, pr.currency)} {pr.currency}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(pr.id, pr.payUrl)}
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-600 bg-[#0b0f17] text-slate-100 font-semibold cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
                    <span>{copiedId === pr.id ? 'কপি হয়েছে' : 'লিংক কপি করুন'}</span>
                  </button>
                  <a
                    href={pr.whatsappShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-emerald-200 font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>WhatsApp-এ শেয়ার করুন</span>
                  </a>
                  {pr.status !== 'paid' && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRequestAction(pr, 'reissue')}
                      className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-cyan-400/40 text-cyan-200 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Reissue</span>
                    </button>
                  )}
                  {(pr.status === 'pending' || pr.status === 'rejected') && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleRequestAction(pr, 'expire')}
                      className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-slate-700 text-slate-300 hover:border-amber-400 cursor-pointer disabled:opacity-50"
                    >
                      <span>Expire</span>
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* EMAIL DELIVERY OUTBOX & SAFE RETRY */}
      <section className="rounded-2xl border border-slate-700 bg-[#0b0f17] p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-cyan-300" aria-hidden="true" />
          <span>Confirmation &amp; Cancellation Email Jobs ({emailJobs.length})</span>
        </h2>
        {emailJobs.length === 0 ? (
          <p className="text-xs text-slate-400">No confirmation or cancellation emails queued yet.</p>
        ) : (
          <div className="space-y-2">
            {emailJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-700 bg-[#04070c] p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-white">#{job.orderId || job.requestRef}</span>
                    <span className="px-2 py-0.5 rounded border border-slate-600 bg-slate-900 font-mono text-[11px] text-slate-200">
                      {job.type} · {job.status} (attempts: {job.attempts})
                    </span>
                  </div>
                  <div className="text-slate-300 truncate">
                    To: {job.recipientEmail} — {job.subject}
                  </div>
                  {job.lastError && <div className="text-amber-300 text-[11px]">{job.lastError}</div>}
                </div>
                {job.status !== 'sent' && (
                  <button
                    type="button"
                    disabled={busyId === `email-${job.id}`}
                    onClick={() => handleRetryEmail(job.id)}
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-cyan-400/50 bg-cyan-950/30 hover:bg-cyan-950/50 text-cyan-200 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Retry Email</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminDSLinkPayPanel;
