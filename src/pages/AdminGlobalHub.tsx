import React, { useEffect, useState, useMemo } from 'react';
import {
  ShieldCheck,
  Truck,
  RefreshCw,
  Download,
  Lock,
  Save,
  ClipboardList,
  DollarSign,
  Users,
  FileCheck,
  Package,
  Printer,
  CreditCard,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Building2,
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { AdminDSLinkPayPanel } from '../components/AdminDSLinkPayPanel';
import { syncAdminProductPriceToServer, useCentralPricing, formatBdt } from '../lib/pricingConfig';

interface AdminGlobalHubProps {
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

export const AdminGlobalHubPage: React.FC<AdminGlobalHubProps> = ({
  onNavigate,
  onBackToMainSite,
}) => {
  const { standard4xPrice, miniKitPrice, rentalKitPrice, refreshPricing } = useCentralPricing();

  const [adminEmail, setAdminEmail] = useState(() =>
    typeof window !== 'undefined'
      ? window.localStorage.getItem('dslink_admin_email') || 'taksidwalid150@gmail.com'
      : 'taksidwalid150@gmail.com'
  );
  const [overview, setOverview] = useState<any | null>(null);
  const [resellerAdminData, setResellerAdminData] = useState<{
    applications: any[];
    resellerOrders: any[];
    withdrawals: any[];
    settings: {
      hardwareDiscountPercent: number;
      enabledCurrencies: string[];
      enabledPayoutMethods: string[];
    };
  }>({
    applications: [],
    resellerOrders: [],
    withdrawals: [],
    settings: {
      hardwareDiscountPercent: 15,
      enabledCurrencies: ['BDT', 'USD', 'GBP', 'EUR', 'AED', 'SGD', 'MYR', 'MMK', 'CNY'],
      enabledPayoutMethods: ['bKash', 'Nagad', 'Rocket', 'Bank Payout via NPSB'],
    },
  });

  const [activeSection, setActiveSection] = useState<
    | 'dslink-pay'
    | 'reseller-management'
    | 'applications'
    | 'pending-reseller-orders'
    | 'print-labels'
    | 'withdrawals'
    | 'payout-history'
    | 'global-operations'
  >(() => {
    if (typeof window !== 'undefined') {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam === 'print-labels') return 'print-labels';
      if (tabParam === 'pending-reseller-orders') return 'pending-reseller-orders';
      if (tabParam === 'reseller-management') return 'reseller-management';
    }
    return 'dslink-pay';
  });

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Application filters
  const [appTypeFilter, setAppTypeFilter] = useState<string>('ALL');
  const [appCountryFilter, setAppCountryFilter] = useState<string>('ALL');
  const [appStatusFilter, setAppStatusFilter] = useState<string>('ALL');

  // Order filters
  const [orderResellerFilter, setOrderResellerFilter] = useState<string>('ALL');
  const [orderCountryFilter, setOrderCountryFilter] = useState<string>('ALL');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>('ALL');
  const [orderFulfillmentFilter, setOrderFulfillmentFilter] = useState<string>('ALL');

  // Bulk Print Selection
  const [selectedOrderIdsForPrint, setSelectedOrderIdsForPrint] = useState<string[]>([]);
  const [printMode, setPrintMode] = useState<'shipping-label' | 'packing-slip'>('shipping-label');

  // Pricing & Shipping forms
  const [stdPriceInput, setStdPriceInput] = useState(String(standard4xPrice));
  const [miniPriceInput, setMiniPriceInput] = useState(String(miniKitPrice));
  const [rentalPriceInput, setRentalPriceInput] = useState(String(rentalKitPrice));
  const [discountPercentInput, setDiscountPercentInput] = useState('15');
  const [intlFeeInput, setIntlFeeInput] = useState('2500');
  const [blockedInput, setBlockedInput] = useState('KP,SY,IR,CU,AF');
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    setStdPriceInput(String(standard4xPrice));
    setMiniPriceInput(String(miniKitPrice));
    setRentalPriceInput(String(rentalKitPrice));
  }, [standard4xPrice, miniKitPrice, rentalKitPrice]);

  // Apply noindex to admin panel
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = 'Admin Global Operations & Reseller Hub | DSLink';
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  }, []);

  const loadAllAdminData = async (emailOverride?: string) => {
    const email = (emailOverride ?? adminEmail).trim();
    if (!email) return;
    setLoading(true);
    setAuthError(null);
    try {
      const [overviewRes, resellerRes] = await Promise.all([
        fetch('/api/admin/overview', { headers: { 'x-admin-email': email } }),
        fetch('/api/admin/reseller/overview', { headers: { 'x-admin-email': email } }),
      ]);
      const overviewData = await overviewRes.json();
      const resellerData = await resellerRes.json();

      if (!overviewRes.ok || !overviewData?.success) {
        setAuthError(overviewData?.error || 'Unauthorized admin email.');
        setOverview(null);
      } else {
        setOverview(overviewData);
        setIntlFeeInput(String(overviewData.shippingConfig?.internationalFeeBdt ?? 2500));
        setBlockedInput((overviewData.shippingConfig?.blockedCountries || []).join(','));
        if (resellerRes.ok && resellerData?.success) {
          setResellerAdminData({
            applications: resellerData.applications || [],
            resellerOrders: resellerData.resellerOrders || [],
            withdrawals: resellerData.withdrawals || [],
            settings: resellerData.settings || resellerAdminData.settings,
          });
          setDiscountPercentInput(String(resellerData.settings?.hardwareDiscountPercent ?? 15));
          if (selectedOrderIdsForPrint.length === 0 && (resellerData.resellerOrders || []).length > 0) {
            setSelectedOrderIdsForPrint([resellerData.resellerOrders[0].id]);
          }
        }
        try {
          window.localStorage.setItem('dslink_admin_email', email);
        } catch {
          // ignore
        }
      }
    } catch {
      setAuthError('Failed to connect to admin API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminEmail) loadAllAdminData(adminEmail);
  }, []);

  const handleApplicationDecision = async (applicationId: string, status: string) => {
    setStatusMsg(null);
    const res = await fetch(`/api/admin/reseller/applications/${encodeURIComponent(applicationId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setStatusMsg(`Application ${data.application.referenceNumber} updated to ${status}.`);
      loadAllAdminData();
    } else {
      setStatusMsg(data?.error || 'Could not update application status.');
    }
  };

  const handleResellerOrderUpdate = async (
    orderId: string,
    updates: {
      paymentStatus?: string;
      fulfillmentStatus?: string;
      trackingNumber?: string;
      carrierName?: string;
    }
  ) => {
    setStatusMsg(null);
    const res = await fetch(`/api/admin/reseller/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setStatusMsg(
        `Order ${data.order.orderNumber} updated — Payment: ${data.order.paymentStatus}, Fulfillment: ${data.order.fulfillmentStatus}, Profit: ${data.order.profitStatus}.`
      );
      loadAllAdminData();
    } else {
      setStatusMsg(data?.error || 'Could not update reseller order.');
    }
  };

  const handleWithdrawalDecision = async (
    withdrawalId: string,
    status: 'Processing' | 'Completed' | 'Failed' | 'Rejected',
    adminNote?: string
  ) => {
    setStatusMsg(null);
    const res = await fetch(`/api/admin/reseller/withdrawals/${encodeURIComponent(withdrawalId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify({
        status,
        adminNote,
        callbackIdempotencyKey: `ADM-WD-${withdrawalId}-${status}`,
      }),
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setStatusMsg(`Withdrawal ${data.withdrawal.reference} marked ${status}.`);
      loadAllAdminData();
    } else {
      setStatusMsg(data?.error || 'Could not update withdrawal.');
    }
  };

  const handleSaveResellerSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const res = await fetch('/api/admin/reseller/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify({
        hardwareDiscountPercent: Number(discountPercentInput),
      }),
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setStatusMsg(`Reseller hardware discount updated to ${discountPercentInput}% across catalog.`);
      loadAllAdminData();
    }
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await syncAdminProductPriceToServer('starlink-standard-4x', Number(stdPriceInput), { adminEmail });
      await syncAdminProductPriceToServer('starlink-mini-kit', Number(miniPriceInput), { adminEmail });
      await syncAdminProductPriceToServer('starlink-rental-kit', Number(rentalPriceInput), { adminEmail });
      await refreshPricing();
      setStatusMsg('Centralized product prices updated across storefront, cart, checkout, and reseller catalog.');
      loadAllAdminData();
    } catch {
      setStatusMsg('Error saving product pricing.');
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    const blockedCountries = blockedInput
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    const res = await fetch('/api/shipping/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-email': adminEmail },
      body: JSON.stringify({
        internationalFeeBdt: Number(intlFeeInput),
        blockedCountries,
      }),
    });
    const data = await res.json();
    if (res.ok && data?.success) {
      setStatusMsg('Worldwide shipping fee and restricted-country rules updated.');
      loadAllAdminData();
    } else {
      setStatusMsg(data?.error || 'Failed to update shipping config.');
    }
  };

  const handleExportBackup = async () => {
    const res = await fetch('/api/admin/backup', {
      headers: { 'x-admin-email': adminEmail },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dslink-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return resellerAdminData.applications.filter((app) => {
      if (appTypeFilter !== 'ALL' && app.applicationType !== appTypeFilter) return false;
      if (appCountryFilter !== 'ALL' && app.countryCode !== appCountryFilter) return false;
      if (appStatusFilter !== 'ALL' && app.status !== appStatusFilter) return false;
      return true;
    });
  }, [resellerAdminData.applications, appTypeFilter, appCountryFilter, appStatusFilter]);

  // Filtered Reseller Orders
  const filteredResellerOrders = useMemo(() => {
    return resellerAdminData.resellerOrders.filter((ord) => {
      if (orderResellerFilter !== 'ALL' && ord.resellerId !== orderResellerFilter) return false;
      if (orderCountryFilter !== 'ALL' && ord.shippingAddress?.countryCode !== orderCountryFilter) return false;
      if (orderPaymentFilter !== 'ALL' && ord.paymentStatus !== orderPaymentFilter) return false;
      if (orderFulfillmentFilter !== 'ALL' && ord.fulfillmentStatus !== orderFulfillmentFilter) return false;
      return true;
    });
  }, [
    resellerAdminData.resellerOrders,
    orderResellerFilter,
    orderCountryFilter,
    orderPaymentFilter,
    orderFulfillmentFilter,
  ]);

  const ordersToPrint = useMemo(() => {
    return resellerAdminData.resellerOrders.filter((o) =>
      selectedOrderIdsForPrint.includes(o.id)
    );
  }, [resellerAdminData.resellerOrders, selectedOrderIdsForPrint]);

  const toggleSelectOrderForPrint = (id: string) => {
    setSelectedOrderIdsForPrint((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-[100dvh] bg-black text-neutral-200 font-sans flex flex-col">
      <SiteHeader
        sectionLabel="Admin Global & Reseller Hub"
        onNavigate={onNavigate}
        onBackToMainSite={onBackToMainSite}
      />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/15 pb-5 print:hidden">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-emerald-400">
              RBAC PROTECTED · RESELLER PORTAL, BRANDED LABELS &amp; GLOBAL E-COMMERCE CONTROL CENTER
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mt-1">
              DSLink Admin Global &amp; Reseller Operations Hub
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/reseller/portal"
              className="px-3.5 py-2 rounded-lg border border-emerald-500/40 bg-emerald-950/30 text-xs font-bold text-emerald-300 hover:bg-emerald-900/40"
            >
              Open Reseller Portal →
            </a>
            <a
              href="/admin"
              className="px-3.5 py-2 rounded-lg border border-white/20 text-xs font-semibold text-white hover:bg-white/10"
            >
              Classic Admin Panel
            </a>
            {overview && (
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-neutral-200 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON Backup</span>
              </button>
            )}
          </div>
        </div>

        {/* Admin Auth Verification Bar */}
        <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-neutral-300 shrink-0">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Authorized Admin Email:</span>
          </div>
          <input
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="flex-1 bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono outline-none"
          />
          <button
            type="button"
            onClick={() => loadAllAdminData()}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
          >
            {loading ? 'Loading...' : 'Verify & Refresh'}
          </button>
        </div>

        {authError && (
          <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-4 text-xs text-red-200 print:hidden">
            {authError}
          </div>
        )}
        {statusMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-3.5 text-xs text-emerald-200 print:hidden">
            {statusMsg}
          </div>
        )}

        {/* Admin Navigation Tabs (DSLink Pay & Customer Orders + Reseller & Operations) */}
        <div className="flex flex-wrap gap-2 bg-[#0b0b0e] p-2 rounded-xl border border-white/15 print:hidden">
          {(
            [
              { id: 'dslink-pay', label: 'DSLink Pay ও অর্ডার' },
              { id: 'reseller-management', label: 'Reseller Management' },
              { id: 'applications', label: `Applications (${resellerAdminData.applications.length})` },
              { id: 'pending-reseller-orders', label: `Pending Reseller Orders (${resellerAdminData.resellerOrders.length})` },
              { id: 'print-labels', label: 'Print Labels' },
              { id: 'withdrawals', label: `Withdrawals (${resellerAdminData.withdrawals.filter((w) => w.status === 'Pending' || w.status === 'Processing').length})` },
              { id: 'payout-history', label: 'Payout History' },
              { id: 'global-operations', label: 'Storefront Pricing & Warranty' },
            ] as const
          ).map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => setActiveSection(nav.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeSection === nav.id
                  ? 'bg-cyan-400 text-[#04131a]'
                  : 'text-slate-200 hover:bg-white/10'
              }`}
            >
              {nav.label}
            </button>
          ))}
        </div>

        {/* ================= SECTION 0: DSLINK PAY & CUSTOMER ORDERS ================= */}
        {activeSection === 'dslink-pay' && (
          <AdminDSLinkPayPanel adminEmail={adminEmail} onNavigate={onNavigate} />
        )}

        {/* ================= SECTION 1: RESELLER MANAGEMENT ================= */}
        {activeSection === 'reseller-management' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-4">
                <div className="text-neutral-400">Approved Resellers</div>
                <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
                  {resellerAdminData.applications.filter((a) => a.status === 'Approved').length}
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-4">
                <div className="text-neutral-400">Hardware Discount Rate</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">
                  {resellerAdminData.settings.hardwareDiscountPercent}% (Pay {100 - resellerAdminData.settings.hardwareDiscountPercent}%)
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-4">
                <div className="text-neutral-400">Total Reseller Orders</div>
                <div className="text-2xl font-mono font-bold text-white mt-1">
                  {resellerAdminData.resellerOrders.length}
                </div>
              </div>
              <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-4">
                <div className="text-neutral-400">Payout Requests</div>
                <div className="text-2xl font-mono font-bold text-amber-300 mt-1">
                  {resellerAdminData.withdrawals.length}
                </div>
              </div>
            </div>

            <form
              onSubmit={handleSaveResellerSettings}
              className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs"
            >
              <h2 className="text-sm font-bold text-white">
                Reseller Wholesale Discount, Currencies &amp; Payout Configuration
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-neutral-400 mb-1">
                    Hardware Discount Percentage (Default: 15% → Reseller pays 85%)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={discountPercentInput}
                    onChange={(e) => setDiscountPercentInput(e.target.value)}
                    className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Enabled Currencies (BDT Accounting Base)</label>
                  <input
                    type="text"
                    readOnly
                    value={resellerAdminData.settings.enabledCurrencies.join(', ')}
                    className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Enabled Payout Channels</label>
                  <input
                    type="text"
                    readOnly
                    value={resellerAdminData.settings.enabledPayoutMethods.join(', ')}
                    className="w-full bg-black border border-white/15 rounded-lg px-3 py-2 text-neutral-300"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                Update Reseller Program Rules
              </button>
            </form>

            {/* Active Resellers Directory */}
            <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs">
              <h2 className="text-sm font-bold text-white">Reseller Accounts &amp; Balances</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/15 text-neutral-400 uppercase">
                      <th className="py-2.5 px-3">Ref / Company</th>
                      <th className="py-2.5 px-3">Type / Country</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Pending Profit</th>
                      <th className="py-2.5 px-3">Available Balance</th>
                      <th className="py-2.5 px-3">Withdrawn Total</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {resellerAdminData.applications.map((acc) => (
                      <tr key={acc.id}>
                        <td className="py-3 px-3">
                          <div className="font-bold text-white">{acc.companyName}</div>
                          <div className="text-[11px] font-mono text-neutral-400">
                            {acc.referenceNumber} · {acc.businessEmail}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="uppercase font-mono text-neutral-300">
                            {acc.applicationType} ({acc.countryCode})
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              acc.status === 'Approved'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {acc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-amber-300">
                          BDT {(acc.pendingProfitBdt || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                          BDT {(acc.availableBalanceBdt || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-mono text-white">
                          BDT {(acc.withdrawnTotalBdt || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleApplicationDecision(acc.id, 'Approved')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplicationDecision(acc.id, 'Suspended')}
                            className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white font-bold cursor-pointer"
                          >
                            Suspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= SECTION 2: APPLICATIONS ================= */}
        {activeSection === 'applications' && (
          <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Reseller, Authorized Retailer &amp; Business Partnership Applications
                </h2>
                <p className="text-neutral-400">
                  Filter applications by type, country, and review status. Approve, reject, or suspend resellers; mark retailer and partnership inquiries as Pending, Under Review, or Responded.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={appTypeFilter}
                  onChange={(e) => setAppTypeFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="ALL">All Types</option>
                  <option value="reseller">Reseller</option>
                  <option value="authorized_retailer">Authorized Retailer</option>
                  <option value="business_partnership">Business Partnership</option>
                </select>
                <select
                  value={appCountryFilter}
                  onChange={(e) => setAppCountryFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="ALL">All Countries</option>
                  <option value="BD">Bangladesh (BD)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                  <option value="AE">UAE (AE)</option>
                  <option value="SG">Singapore (SG)</option>
                </select>
                <select
                  value={appStatusFilter}
                  onChange={(e) => setAppStatusFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-3 py-1.5 text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Responded">Responded</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="p-4 rounded-xl border border-white/10 bg-black flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{app.referenceNumber}</span>
                      <span className="font-bold text-white text-sm">{app.companyName}</span>
                      <span className="px-2 py-0.5 rounded bg-white/10 text-neutral-200 font-mono">
                        {app.applicationType}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                        {app.status}
                      </span>
                    </div>
                    <p className="text-neutral-300">
                      Contact: {app.contactName} · {app.businessEmail} · {app.phone} · Country: {app.countryCode}
                    </p>
                    <p className="text-neutral-400">
                      Address: {app.businessAddress} | Channels: {app.salesChannels} | Est. Volume:{' '}
                      {app.estimatedMonthlyVolume}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {app.applicationType === 'reseller' ? (
                      <>
                        {['Pending', 'Approved', 'Rejected', 'Suspended'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleApplicationDecision(app.id, st)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                              app.status === st
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </>
                    ) : (
                      <>
                        {['Pending', 'Under Review', 'Responded', 'Approved'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleApplicationDecision(app.id, st)}
                            className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                              app.status === st
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-neutral-200'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 3: PENDING RESELLER ORDERS ================= */}
        {activeSection === 'pending-reseller-orders' && (
          <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">
                  Reseller Customer Orders &amp; Profit Release Control
                </h2>
                <p className="text-neutral-400">
                  Hardware profit is released to the reseller&apos;s available balance strictly when BOTH Fulfillment Status is &ldquo;Delivered&rdquo; and Payment Status is &ldquo;Verified / Paid&rdquo;.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={orderCountryFilter}
                  onChange={(e) => setOrderCountryFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="ALL">All Countries</option>
                  <option value="BD">Bangladesh (BD)</option>
                  <option value="US">United States (US)</option>
                  <option value="GB">United Kingdom (GB)</option>
                </select>
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="ALL">All Payment Statuses</option>
                  <option value="Pending COD">Pending COD</option>
                  <option value="Awaiting Payment">Awaiting Payment</option>
                  <option value="Verified / Paid">Verified / Paid</option>
                  <option value="Refunded">Refunded</option>
                </select>
                <select
                  value={orderFulfillmentFilter}
                  onChange={(e) => setOrderFulfillmentFilter(e.target.value)}
                  className="bg-black border border-white/20 rounded-lg px-2.5 py-1.5 text-white"
                >
                  <option value="ALL">All Fulfillment Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            {filteredResellerOrders.length === 0 ? (
              <p className="text-neutral-400 py-8 text-center">No matching reseller orders.</p>
            ) : (
              <div className="space-y-4">
                {filteredResellerOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-xl border border-white/10 bg-black space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{ord.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-bold">
                          Reseller: {ord.resellerCompany}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 font-bold">
                          Profit: {ord.profitStatus} (BDT {ord.totalHardwareProfitBdt.toLocaleString()})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderIdsForPrint([ord.id]);
                          setActiveSection('print-labels');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-bold cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print Branded Shipping Label
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-neutral-300">
                      <div>
                        <div className="text-neutral-500 font-bold">Customer &amp; 10-Field Shipping Address</div>
                        <div>
                          {ord.shippingAddress.fullName} ({ord.shippingAddress.phone})
                        </div>
                        <div>
                          {ord.shippingAddress.houseFlat}, {ord.shippingAddress.roadStreet},{' '}
                          {ord.shippingAddress.area}
                        </div>
                        <div>
                          {ord.shippingAddress.cityDistrict}, {ord.shippingAddress.stateDivision}{' '}
                          {ord.shippingAddress.postalCode}, {ord.shippingAddress.countryCode}
                        </div>
                      </div>
                      <div>
                        <div className="text-neutral-500 font-bold">Products &amp; Financial Breakdown</div>
                        {ord.items.map((it: any, i: number) => (
                          <div key={i}>
                            {it.name} × {it.quantity}
                          </div>
                        ))}
                        <div className="mt-1 font-mono text-[11px]">
                          Cost: BDT {ord.totalResellerCostBdt.toLocaleString()} | Customer Total: BDT{' '}
                          {ord.totalCustomerSellingBdt.toLocaleString()} | Collector: {ord.paymentCollector}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-400">Payment:</span>
                          <select
                            value={ord.paymentStatus}
                            onChange={(e) =>
                              handleResellerOrderUpdate(ord.id, { paymentStatus: e.target.value })
                            }
                            className="bg-[#0b0b0e] border border-white/20 rounded px-2 py-1 text-white font-bold"
                          >
                            <option value="Pending COD">Pending COD</option>
                            <option value="Awaiting Payment">Awaiting Payment</option>
                            <option value="Verified / Paid">Verified / Paid</option>
                            <option value="Failed">Failed</option>
                            <option value="Refunded">Refunded</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-400">Fulfillment:</span>
                          <select
                            value={ord.fulfillmentStatus}
                            onChange={(e) =>
                              handleResellerOrderUpdate(ord.id, { fulfillmentStatus: e.target.value })
                            }
                            className="bg-[#0b0b0e] border border-white/20 rounded px-2 py-1 text-white font-bold"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Processing">Processing</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Returned">Returned</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleResellerOrderUpdate(ord.id, {
                              paymentStatus: 'Verified / Paid',
                              fulfillmentStatus: 'Delivered',
                            })
                          }
                          className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          Confirm Delivery &amp; Payment (Release Profit)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= SECTION 4: PRINT LABELS (INDIVIDUAL & BULK) ================= */}
        {activeSection === 'print-labels' && (
          <div className="space-y-6">
            <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">
                    Reseller-Branded Shipping Labels &amp; Packing Slips (Individual &amp; Bulk Print)
                  </h2>
                  <p className="text-neutral-400">
                    Select one or multiple reseller orders below to print reseller-branded shipping labels or packing slips. Reseller wholesale cost and profit margin are strictly omitted from all customer-facing documents.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintMode('shipping-label')}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                      printMode === 'shipping-label' ? 'bg-white text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    Shipping Labels
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintMode('packing-slip')}
                    className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer ${
                      printMode === 'packing-slip' ? 'bg-white text-black' : 'bg-white/10 text-white'
                    }`}
                  >
                    Packing Slips
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Selected ({ordersToPrint.length})
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedOrderIdsForPrint(resellerAdminData.resellerOrders.map((o) => o.id))
                  }
                  className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white font-semibold cursor-pointer"
                >
                  Select All Orders
                </button>
                {resellerAdminData.resellerOrders.map((ord) => (
                  <label
                    key={ord.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer ${
                      selectedOrderIdsForPrint.includes(ord.id)
                        ? 'border-emerald-500 bg-emerald-950/40 text-white'
                        : 'border-white/15 bg-black text-neutral-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrderIdsForPrint.includes(ord.id)}
                      onChange={() => toggleSelectOrderForPrint(ord.id)}
                    />
                    <span className="font-mono font-bold">{ord.orderNumber}</span>
                    <span>({ord.brandingSnapshot?.companyName || ord.resellerCompany})</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Printable Branded Sheets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ordersToPrint.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white text-slate-900 rounded-xl border-2 border-slate-900 p-6 space-y-4 shadow-lg"
                >
                  <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
                    <div className="flex items-center gap-3">
                      {ord.brandingSnapshot?.logoUrl && (
                        <img
                          src={ord.brandingSnapshot.logoUrl}
                          alt={ord.brandingSnapshot.companyName}
                          className="w-12 h-12 object-contain border border-slate-300 rounded p-1"
                        />
                      )}
                      <div>
                        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          FROM (AUTHORIZED SENDER)
                        </div>
                        <div className="text-base font-extrabold text-slate-900">
                          {ord.brandingSnapshot?.companyName || ord.resellerCompany}
                        </div>
                        <div className="text-xs text-slate-700">
                          {ord.brandingSnapshot?.businessAddress}
                        </div>
                        <div className="text-xs text-slate-700">
                          Tel: {ord.brandingSnapshot?.phone}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-mono font-bold text-xs">
                        {printMode === 'shipping-label' ? 'CARRIER SHIPPING LABEL' : 'PACKING SLIP'}
                      </span>
                      <div className="font-mono font-extrabold text-sm mt-1">{ord.orderNumber}</div>
                      <div className="text-[11px] text-slate-600">
                        Carrier: {ord.carrierName || (ord.shippingAddress.countryCode === 'BD' ? 'Steadfast / Pathao' : 'DHL Express')}
                      </div>
                    </div>
                  </div>

                  {/* Recipient 10-Field Address Box */}
                  <div className="p-4 rounded-lg bg-slate-100 border border-slate-300 space-y-1 text-xs">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                      DELIVER TO RECIPIENT
                    </div>
                    <div className="text-base font-extrabold text-slate-900">
                      {ord.shippingAddress.fullName}
                    </div>
                    <div className="font-mono font-bold text-slate-900">
                      Tel: {ord.shippingAddress.phone}
                    </div>
                    <div className="text-slate-800">
                      {ord.shippingAddress.houseFlat}, {ord.shippingAddress.roadStreet}
                    </div>
                    <div className="text-slate-800">
                      {ord.shippingAddress.area}, {ord.shippingAddress.cityDistrict}
                    </div>
                    <div className="font-bold text-slate-900">
                      {ord.shippingAddress.stateDivision} — Postal Code: {ord.shippingAddress.postalCode} ·{' '}
                      {ord.shippingAddress.countryCode}
                    </div>
                    {ord.shippingAddress.landmarkNote && (
                      <div className="text-slate-700 pt-1 border-t border-slate-300 mt-1">
                        Delivery Note: {ord.shippingAddress.landmarkNote}
                      </div>
                    )}
                  </div>

                  {/* Contents & COD Instruction (Never shows reseller cost or profit!) */}
                  <div className="space-y-2 text-xs">
                    <div className="font-bold uppercase text-slate-600">Package Contents</div>
                    {ord.items.map((it: any, idx: number) => (
                      <div key={idx} className="flex justify-between border-b border-slate-200 pb-1">
                        <span className="font-bold text-slate-900">
                          {it.name} ({it.sku})
                        </span>
                        <span className="font-mono font-bold">QTY: {it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t-2 border-slate-900 text-xs">
                    <div>
                      <span className="text-slate-600">Payment Mode:</span>{' '}
                      <strong className="text-slate-900">{ord.paymentMethod}</strong>
                    </div>
                    <div className="text-right font-mono font-extrabold text-sm">
                      {ord.paymentMethod === 'COD'
                        ? `COD TO COLLECT: BDT ${ord.codAmountToCollectBdt.toLocaleString()}`
                        : 'PREPAID — DO NOT COLLECT CASH'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 5 & 6: WITHDRAWALS & PAYOUT HISTORY ================= */}
        {(activeSection === 'withdrawals' || activeSection === 'payout-history') && (
          <div className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs">
            <h2 className="text-base font-bold text-white">
              {activeSection === 'withdrawals'
                ? 'Active Reseller Withdrawal Requests (bKash, Nagad, Rocket & Bank NPSB)'
                : 'Completed & Historical Payout Ledger'}
            </h2>
            <p className="text-neutral-400">
              Funds are reserved upon withdrawal request. Marking a withdrawal as Failed or Rejected automatically restores the reserved BDT balance to the reseller&apos;s available balance with idempotency protection.
            </p>
            <div className="space-y-3">
              {resellerAdminData.withdrawals
                .filter((w) =>
                  activeSection === 'withdrawals'
                    ? w.status === 'Pending' || w.status === 'Processing'
                    : true
                )
                .map((w) => (
                  <div
                    key={w.id}
                    className="p-4 rounded-xl border border-white/10 bg-black flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">{w.reference}</span>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-emerald-300 font-bold">
                          {w.method}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold">
                          {w.status}
                        </span>
                      </div>
                      <p className="text-neutral-300 mt-1">
                        Account: {w.accountDetails?.accountName} · {w.accountDetails?.accountNumber}{' '}
                        {w.accountDetails?.bankName ? `(${w.accountDetails.bankName})` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right font-mono font-extrabold text-base text-white">
                        BDT {w.amountBdt.toLocaleString()}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleWithdrawalDecision(w.id, 'Processing')}
                          className="px-2.5 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white font-bold cursor-pointer"
                        >
                          Processing
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWithdrawalDecision(w.id, 'Completed')}
                          className="px-2.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
                        >
                          Complete Payout
                        </button>
                        <button
                          type="button"
                          onClick={() => handleWithdrawalDecision(w.id, 'Failed', 'Payout failed; balance restored')}
                          className="px-2.5 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white font-bold cursor-pointer"
                        >
                          Fail &amp; Restore Balance
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ================= SECTION 7: GLOBAL OPERATIONS ================= */}
        {activeSection === 'global-operations' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleSavePricing}
                className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>Centralized Product Pricing (BDT)</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="text-neutral-400 block">Standard 4X</span>
                    <input
                      type="number"
                      value={stdPriceInput}
                      onChange={(e) => setStdPriceInput(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 block">Mini Kit</span>
                    <input
                      type="number"
                      value={miniPriceInput}
                      onChange={(e) => setMiniPriceInput(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 block">Rental Kit</span>
                    <input
                      type="number"
                      value={rentalPriceInput}
                      onChange={(e) => setRentalPriceInput(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Prices Everywhere</span>
                </button>
              </form>

              <form
                onSubmit={handleSaveShipping}
                className="rounded-xl border border-white/15 bg-[#0b0b0e] p-5 space-y-4 text-xs"
              >
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  <span>Worldwide Shipping &amp; Carrier Rules</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-neutral-400 block">Intl DHL/FedEx Fee (BDT)</span>
                    <input
                      type="number"
                      value={intlFeeInput}
                      onChange={(e) => setIntlFeeInput(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-neutral-400 block">Inquiry-Only Country Codes</span>
                    <input
                      type="text"
                      value={blockedInput}
                      onChange={(e) => setBlockedInput(e.target.value)}
                      className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black font-bold cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Shipping Rules</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default AdminGlobalHubPage;
