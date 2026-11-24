import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  Globe,
  MapPin,
  FileText,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Search,
  ChevronRight,
  KeyRound,
  CreditCard,
  Truck,
  Eye,
  Upload
} from 'lucide-react';
import { SiteHeader } from '../components/SiteHeader';
import { Footer } from '../components/Footer';
import { GlobalFooterPreferences } from '../components/GlobalFooterPreferences';
import { BanglaQrPaymentSection } from '../components/BanglaQrPaymentSection';
import { CURRENCY_LIST, useGlobalCurrency } from '../lib/currencyConfig';

export interface ResellerCatalogItem {
  id: string;
  sku: string;
  name: string;
  category: 'hardware_kit' | 'accessory' | 'subscription_plan';
  publicPriceBdt: number;
  resellerCostBdt: number;
  discountPercent: number;
  defaultCustomerSellingPriceBdt: number;
  description: string;
  imageUrl?: string;
}

export interface ResellerBranding {
  companyName: string;
  logoUrl: string;
  businessAddress: string;
  phone: string;
  website: string;
}

export interface ResellerOrderItem {
  productId: string;
  sku: string;
  name: string;
  category: 'hardware_kit' | 'accessory' | 'subscription_plan';
  quantity: number;
  publicPriceBdt: number;
  resellerUnitCostBdt: number;
  customerUnitSellingPriceBdt: number;
  lineResellerCostBdt: number;
  lineCustomerTotalBdt: number;
  lineHardwareProfitBdt: number;
}

export interface ShippingAddress10 {
  fullName: string;
  phone: string;
  houseFlat: string;
  roadStreet: string;
  area: string;
  cityDistrict: string;
  stateDivision: string;
  postalCode: string;
  countryCode: string;
  landmarkNote?: string;
}

export interface ResellerOrderRecord {
  id: string;
  orderNumber: string;
  resellerId: string;
  resellerCompany: string;
  createdAt: string;
  items: ResellerOrderItem[];
  shippingAddress: ShippingAddress10;
  paymentMethod: 'COD' | 'BANGLA_QR_ADVANCE';
  paymentCollector: 'dslink' | 'reseller';
  transactionId?: string;
  paymentStatus: 'Pending COD' | 'Awaiting Payment' | 'Verified / Paid' | 'Failed' | 'Refunded';
  fulfillmentStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';
  totalResellerCostBdt: number;
  totalCustomerSellingBdt: number;
  totalHardwareProfitBdt: number;
  codAmountToCollectBdt: number;
  profitStatus: 'Pending' | 'Released' | 'Settled Directly by Reseller' | 'Reversed';
  currencyCode: string;
  exchangeRateUsed: number;
  brandingSnapshot: ResellerBranding;
  trackingNumber?: string;
  carrierName?: string;
}

export interface WithdrawalRecord {
  id: string;
  reference: string;
  resellerId: string;
  amountBdt: number;
  method: 'bKash' | 'Nagad' | 'Rocket' | 'Bank Payout via NPSB';
  accountDetails: {
    accountName: string;
    accountNumber: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
  };
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed' | 'Rejected';
  createdAt: string;
  processedAt?: string;
  adminNote?: string;
}

export interface BalanceLedgerEntry {
  id: string;
  resellerId: string;
  type: 'PROFIT_PENDING' | 'PROFIT_RELEASED' | 'DIRECT_SETTLEMENT' | 'WITHDRAWAL_RESERVED' | 'WITHDRAWAL_COMPLETED' | 'WITHDRAWAL_RESTORED' | 'RETURN_ADJUSTMENT';
  amountBdt: number;
  orderNumber?: string;
  withdrawalRef?: string;
  note: string;
  createdAt: string;
}

interface ResellerAccountProfile {
  id: string;
  referenceNumber: string;
  applicationType: 'reseller' | 'authorized_retailer' | 'business_partnership';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Suspended' | 'Under Review' | 'Responded';
  contactName: string;
  businessEmail: string;
  phone: string;
  companyName: string;
  businessAddress: string;
  countryCode: string;
  salesChannels: string;
  estimatedMonthlyVolume: string;
  website?: string;
  logoUrl?: string;
  branding: ResellerBranding;
  pendingProfitBdt: number;
  availableBalanceBdt: number;
  reservedWithdrawalBdt: number;
  withdrawnTotalBdt: number;
  savedCustomPrices: Record<string, number>;
  createdAt: string;
}

export const ResellerPortalPage: React.FC<{ onNavigate?: (path: string) => void }> = ({ onNavigate }) => {
  const { currency: activeCurrencyCode, currencyMeta, setCurrency, rates } = useGlobalCurrency();
  const currency = useMemo(
    () => ({
      code: activeCurrencyCode,
      symbol: currencyMeta.symbol,
      name: currencyMeta.name,
      rateFromBdt:
        activeCurrencyCode === 'BDT'
          ? 1
          : rates[activeCurrencyCode] || currencyMeta.fallbackRateFromBdt,
    }),
    [activeCurrencyCode, currencyMeta, rates]
  );
  const availableCurrencies = CURRENCY_LIST;

  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const pathname = window.location.pathname;
  const resetTokenFromUrl = urlParams.get('token') || '';
  const initialAppType = (urlParams.get('type') as 'reseller' | 'authorized_retailer' | 'business_partnership') || 'reseller';
  const initialViewMode = pathname.includes('reset-password')
    ? 'reset-password'
    : pathname.includes('register') || urlParams.get('type')
    ? 'register'
    : 'login';

  const [authToken, setAuthToken] = useState<string>(() => localStorage.getItem('dslink_reseller_token') || '');
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(initialViewMode);
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'new-order' | 'orders' | 'earnings' | 'withdrawals' | 'branding'>('overview');

  const [profile, setProfile] = useState<ResellerAccountProfile | null>(null);
  const [catalog, setCatalog] = useState<ResellerCatalogItem[]>([]);
  const [orders, setOrders] = useState<ResellerOrderRecord[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [ledger, setLedger] = useState<BalanceLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Forgot & Reset Password State
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');
  const [resetTokenInput, setResetTokenInput] = useState(resetTokenFromUrl);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetStatusMsg, setResetStatusMsg] = useState('');

  // Registration State
  const [regForm, setRegForm] = useState({
    applicationType: initialAppType,
    contactName: '',
    businessEmail: '',
    password: '',
    phone: '+880 ',
    companyName: '',
    businessAddress: '',
    countryCode: 'BD',
    salesChannels: 'Retail Showroom & E-Commerce',
    estimatedMonthlyVolume: '10 - 25 Kits / Month',
    website: '',
    logoUrl: '',
    businessLocations: '',
    productsOfInterest: 'Starlink Standard Kit 4X, Starlink Mini Kit',
    targetMarkets: 'Bangladesh & South Asia',
    productCategories: 'Enterprise & ISP Hardware',
    proposalSummary: ''
  });

  // Catalog Custom Price Overrides
  const [customSellingPrices, setCustomSellingPrices] = useState<Record<string, number>>({});

  // New Reseller Order State
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({
    'kit-demo-100': 1
  });
  const [orderSellingPrices, setOrderSellingPrices] = useState<Record<string, number>>({
    'kit-demo-100': 500
  });
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress10>({
    fullName: '',
    phone: '+880 ',
    houseFlat: '',
    roadStreet: '',
    area: '',
    cityDistrict: 'Dhaka',
    stateDivision: 'Dhaka Division',
    postalCode: '1212',
    countryCode: 'BD',
    landmarkNote: ''
  });
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'BANGLA_QR_ADVANCE'>('COD');
  const [paymentCollector, setPaymentCollector] = useState<'dslink' | 'reseller'>('dslink');
  const [advanceTrxId, setAdvanceTrxId] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Printable Document Modal State
  const [printOrder, setPrintOrder] = useState<ResellerOrderRecord | null>(null);
  const [printDocType, setPrintDocType] = useState<'invoice' | 'packing-slip'>('invoice');

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Bank Payout via NPSB'>('bKash');
  const [withdrawAccountName, setWithdrawAccountName] = useState('');
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('');
  const [withdrawBankName, setWithdrawBankName] = useState('');
  const [withdrawBranchName, setWithdrawBranchName] = useState('');
  const [withdrawRoutingNumber, setWithdrawRoutingNumber] = useState('');

  // Branding Form State
  const [brandingForm, setBrandingForm] = useState<ResellerBranding>({
    companyName: '',
    logoUrl: '',
    businessAddress: '',
    phone: '',
    website: ''
  });

  // Apply strict noindex to private portal
  useEffect(() => {
    document.title = 'DSLink Reseller & Partner Portal | retailer.devsparksoft.com.bd';
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, nofollow';
  }, []);

  const fetchPortalDashboard = async (tokenToUse: string) => {
    if (!tokenToUse) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/reseller/dashboard', {
        headers: {
          Authorization: `Bearer ${tokenToUse}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('dslink_reseller_token');
          setAuthToken('');
          setProfile(null);
        }
        setErrorMsg(data.error || 'Could not load reseller portal.');
      } else {
        setProfile(data.profile);
        setCatalog(data.catalog || []);
        setOrders(data.orders || []);
        setWithdrawals(data.withdrawals || []);
        setLedger(data.ledger || []);
        setBrandingForm(data.profile.branding || {
          companyName: data.profile.companyName,
          logoUrl: data.profile.logoUrl || '',
          businessAddress: data.profile.businessAddress,
          phone: data.profile.phone,
          website: data.profile.website || ''
        });
        const initialPrices: Record<string, number> = {};
        (data.catalog || []).forEach((item: ResellerCatalogItem) => {
          const saved = data.profile?.savedCustomPrices?.[item.id];
          initialPrices[item.id] = typeof saved === 'number' ? saved : item.defaultCustomerSellingPriceBdt;
        });
        setCustomSellingPrices(initialPrices);
        setOrderSellingPrices((prev) => ({ ...initialPrices, ...prev }));
      }
    } catch {
      setErrorMsg('Network error loading reseller portal.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchPortalDashboard(authToken);
    }
  }, [authToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid business email or password.');
      } else {
        localStorage.setItem('dslink_reseller_token', data.token);
        setAuthToken(data.token);
      }
    } catch {
      setErrorMsg('Network error during sign-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoQuickSignIn = async (demoEmail: string, demoPass: string) => {
    setLoginEmail(demoEmail);
    setLoginPassword(demoPass);
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: demoPass })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('dslink_reseller_token', data.token);
        setAuthToken(data.token);
      } else {
        setErrorMsg(data.error || 'Demo login failed.');
      }
    } catch {
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to submit application.');
      } else if (data.token) {
        localStorage.setItem('dslink_reseller_token', data.token);
        setAuthToken(data.token);
        setSuccessMsg(`Application ${data.referenceNumber} submitted! Current status: ${data.status}.`);
      }
    } catch {
      setErrorMsg('Network error submitting application.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage('');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      const data = await res.json();
      setForgotMessage(
        data.message ||
          'If an account exists for that business email address, a single-use password reset link has been sent.'
      );
    } catch {
      setErrorMsg('Could not process password reset request.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatusMsg('');
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenInput.trim(), newPassword: newPasswordInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Invalid or expired reset link.');
      } else {
        setResetStatusMsg('Your password has been updated. You may now sign in.');
        setTimeout(() => setAuthView('login'), 1500);
      }
    } catch {
      setErrorMsg('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCatalogPrice = async (productId: string, priceBdt: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/reseller/catalog/custom-price', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ productId, customerSellingPriceBdt: priceBdt })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not save selling price.');
      } else {
        setSuccessMsg('Default customer selling price saved.');
        setOrderSellingPrices((prev) => ({ ...prev, [productId]: priceBdt }));
      }
    } catch {
      setErrorMsg('Network error saving price.');
    }
  };

  // Real-time order calculation preview
  const orderCalculation = useMemo(() => {
    let totalResellerCostBdt = 0;
    let totalCustomerSellingBdt = 0;
    let totalHardwareProfitBdt = 0;
    const selectedItems: Array<{
      item: ResellerCatalogItem;
      qty: number;
      customerUnitSellingBdt: number;
      lineCostBdt: number;
      lineSellingBdt: number;
      lineProfitBdt: number;
    }> = [];

    catalog.forEach((item) => {
      const qty = Number(orderQuantities[item.id] || 0);
      if (qty > 0) {
        const customerUnitSellingBdt = Number(
          orderSellingPrices[item.id] ?? customSellingPrices[item.id] ?? item.defaultCustomerSellingPriceBdt
        );
        const lineCostBdt = item.resellerCostBdt * qty;
        const lineSellingBdt = customerUnitSellingBdt * qty;
        const lineProfitBdt =
          item.category === 'subscription_plan'
            ? 0
            : (customerUnitSellingBdt - item.resellerCostBdt) * qty;

        totalResellerCostBdt += lineCostBdt;
        totalCustomerSellingBdt += lineSellingBdt;
        totalHardwareProfitBdt += lineProfitBdt;

        selectedItems.push({
          item,
          qty,
          customerUnitSellingBdt,
          lineCostBdt,
          lineSellingBdt,
          lineProfitBdt
        });
      }
    });

    return {
      selectedItems,
      totalResellerCostBdt,
      totalCustomerSellingBdt,
      totalHardwareProfitBdt,
      codAmountToCollectBdt: paymentMethod === 'COD' ? totalCustomerSellingBdt : 0
    };
  }, [catalog, orderQuantities, orderSellingPrices, customSellingPrices, paymentMethod]);

  const handleSubmitResellerOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (orderCalculation.selectedItems.length === 0) {
      setErrorMsg('Please select at least 1 product quantity to place a customer order.');
      return;
    }

    setSubmittingOrder(true);
    try {
      const itemsPayload = orderCalculation.selectedItems.map((entry) => ({
        productId: entry.item.id,
        quantity: entry.qty,
        customerUnitSellingPriceBdt: entry.customerUnitSellingBdt
      }));

      const res = await fetch('/api/reseller/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          items: itemsPayload,
          shippingAddress,
          paymentMethod,
          paymentCollector: paymentMethod === 'COD' ? 'dslink' : paymentCollector,
          transactionId: advanceTrxId.trim() || undefined,
          currencyCode: currency.code,
          exchangeRateUsed: currency.rateFromBdt,
          idempotencyKey: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create reseller order.');
      } else {
        setSuccessMsg(
          `Order ${data.order.orderNumber} created! Server-calculated hardware profit: BDT ${data.order.totalHardwareProfitBdt.toLocaleString()} (${data.order.profitStatus}).`
        );
        await fetchPortalDashboard(authToken);
        setActiveTab('orders');
      }
    } catch {
      setErrorMsg('Network error placing order.');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleRequestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const numericAmount = Number(withdrawAmount);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Enter a valid withdrawal amount in BDT.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          amountBdt: numericAmount,
          method: withdrawMethod,
          accountDetails: {
            accountName: withdrawAccountName.trim(),
            accountNumber: withdrawAccountNumber.trim(),
            bankName: withdrawBankName.trim() || undefined,
            branchName: withdrawBranchName.trim() || undefined,
            routingNumber: withdrawRoutingNumber.trim() || undefined
          },
          idempotencyKey: `WD-${Date.now()}`
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Withdrawal request failed.');
      } else {
        setSuccessMsg(`Withdrawal ${data.withdrawal.reference} for BDT ${numericAmount.toLocaleString()} submitted and reserved.`);
        setWithdrawAmount('');
        await fetchPortalDashboard(authToken);
      }
    } catch {
      setErrorMsg('Network error requesting withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/reseller/branding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify(brandingForm)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update branding settings.');
      } else {
        setSuccessMsg('Reseller branding updated! Future orders will snapshot these details onto customer invoices and shipping labels.');
        await fetchPortalDashboard(authToken);
      }
    } catch {
      setErrorMsg('Network error updating branding.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'branding' | 'register') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setErrorMsg('Logo file must be under 1 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (target === 'branding') {
        setBrandingForm((prev) => ({ ...prev, logoUrl: result }));
      } else {
        setRegForm((prev) => ({ ...prev, logoUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const formatConvertedCurrency = (bdtAmount: number) => {
    if (currency.code === 'BDT') {
      return `BDT ${bdtAmount.toLocaleString()}`;
    }
    const converted = (bdtAmount * currency.rateFromBdt).toFixed(2);
    return `BDT ${bdtAmount.toLocaleString()} (≈ ${currency.symbol}${converted} ${currency.code})`;
  };

  const isApprovedReseller = profile?.status === 'Approved' && profile?.applicationType === 'reseller';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <SiteHeader />

      {/* Subheader bar for Reseller Portal */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-sm">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight">DSLink Reseller & Partner Portal</span>
                <span className="text-[11px] font-mono bg-slate-800 text-emerald-400 px-2 py-0.5 rounded border border-slate-700">
                  retailer.devsparksoft.com.bd
                </span>
              </div>
              <p className="text-xs text-slate-400">
                15% Approved Reseller Hardware Discount · Server-Calculated Profit · Branded Fulfillment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency selector with explicit exchange rate display */}
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">Currency:</span>
              <select
                aria-label="Portal Display Currency"
                value={currency.code}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {availableCurrencies.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
              {currency.code !== 'BDT' && (
                <span className="text-[11px] text-amber-300 font-mono">
                  1 BDT = {currency.rateFromBdt} {currency.code} (Accounting in BDT)
                </span>
              )}
            </div>

            {profile && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('dslink_reseller_token');
                  setAuthToken('');
                  setProfile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>{successMsg}</div>
          </div>
        )}

        {!profile ? (
          /* ================= AUTHENTICATION & APPLICATION PORTAL ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md mb-4">
                <ShieldCheck className="w-4 h-4" />
                Partner Program & Portal
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
                DSLink Starlink Reseller, Retailer & Partnership Portal
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Manage your DSLink application status, wholesale reseller pricing (85% of DSLink public price — 15% hardware discount), custom selling prices, reseller-branded shipping labels, and BDT payouts via bKash, Nagad, Rocket, or Bank NPSB.
              </p>

              {/* Canonical Profit Calculation Example Card */}
              <div className="rounded-xl bg-slate-900 text-white p-5 mb-6">
                <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">
                  Canonical Hardware Profit Formula
                </div>
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-800/90 rounded-lg p-3 mb-3">
                  <div>
                    <div className="text-[11px] text-slate-400">Public Price</div>
                    <div className="text-sm font-bold text-white">BDT 100</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Reseller Cost (85%)</div>
                    <div className="text-sm font-bold text-emerald-400">BDT 85</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">Selling @ BDT 500</div>
                    <div className="text-sm font-bold text-amber-300">BDT 415 Profit</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hardware profit = <code className="text-emerald-300">(Customer Selling Price − Reseller Cost) × Qty</code>. Subscription plans carry a fixed plan fee.
                </p>
              </div>

              {/* Instant Demo Sandbox Credentials */}
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-4">
                <div className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
                  Quick Evaluation Accounts
                </div>
                <p className="text-xs text-emerald-800 mb-3">
                  Test an Approved Reseller account or a Pending Application account immediately:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoQuickSignIn('reseller@devsparksoft.com.bd', 'Reseller2026!')}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Sign In: Approved Reseller
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoQuickSignIn('pending@devsparksoft.com.bd', 'Pending2026!')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Sign In: Pending Applicant
                  </button>
                </div>
              </div>

              {/* Public SEO Pages Links */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Public Program Guides (devsparksoft.com.bd)
                </div>
                <div className="flex flex-col gap-2 text-xs font-semibold text-emerald-700">
                  <a href="/resell" className="hover:underline flex items-center justify-between">
                    <span>Starlink Reseller Application in Bangladesh</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a href="/resell/authorized-retailer" className="hover:underline flex items-center justify-between">
                    <span>Starlink Authorized Retailer Inquiry</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                  <a href="/resell/business-partnership" className="hover:underline flex items-center justify-between">
                    <span>Starlink Business Partnership in Bangladesh</span>
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              {/* Auth Mode Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setAuthView('login')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    authView === 'login'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Partner Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('register')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    authView === 'register'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Submit Application & Register
                </button>
                <button
                  type="button"
                  onClick={() => setAuthView('forgot-password')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    authView === 'forgot-password' || authView === 'reset-password'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Password Reset
                </button>
              </div>

              {authView === 'login' && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Sign In to Reseller Portal</h2>
                  <p className="text-xs text-slate-600">
                    Enter your registered business email and password to view your application status or access your reseller dashboard.
                  </p>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Email</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="partner@company.com.bd"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot-password')}
                      className="text-xs font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      Forgot your password?
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      {loading ? 'Signing In...' : 'Sign In to Portal'}
                    </button>
                  </div>
                </form>
              )}

              {authView === 'forgot-password' && (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Request Password Reset Link</h2>
                  <p className="text-xs text-slate-600">
                    Enter your business email to receive a single-use, expiring password reset link via Resend.
                  </p>
                  {forgotMessage && (
                    <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs leading-relaxed">
                      {forgotMessage}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="partner@company.com.bd"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setAuthView('reset-password')}
                      className="text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
                    >
                      Already have a reset token?
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                    >
                      {loading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}

              {authView === 'reset-password' && (
                <form onSubmit={handleConfirmResetPassword} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">Set New Portal Password</h2>
                  {resetStatusMsg && (
                    <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                      {resetStatusMsg}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Single-Use Reset Token</label>
                    <input
                      type="text"
                      required
                      value={resetTokenInput}
                      onChange={(e) => setResetTokenInput(e.target.value)}
                      placeholder="Paste token from reset link"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors cursor-pointer"
                  >
                    {loading ? 'Updating...' : 'Confirm New Password'}
                  </button>
                </form>
              )}

              {authView === 'register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900">
                    Online Application & Partner Account Registration
                  </h2>
                  <p className="text-xs text-slate-600">
                    Your application type is preselected below. Submit your company details to receive an application reference number and track review status inside the portal.
                  </p>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Application Program Type</label>
                    <select
                      value={regForm.applicationType}
                      onChange={(e) =>
                        setRegForm((prev) => ({
                          ...prev,
                          applicationType: e.target.value as 'reseller' | 'authorized_retailer' | 'business_partnership'
                        }))
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                    >
                      <option value="reseller">DSLink Starlink Reseller Application (15% Hardware Discount)</option>
                      <option value="authorized_retailer">Authorized Retailer Inquiry (Showroom & Multi-Store Supply)</option>
                      <option value="business_partnership">Business Partnership Inquiry (Bangladesh & Global Distribution)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Contact Full Name *</label>
                      <input
                        type="text"
                        required
                        value={regForm.contactName}
                        onChange={(e) => setRegForm({ ...regForm, contactName: e.target.value })}
                        placeholder="Md. Tanvir Rahman"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Business Email *</label>
                      <input
                        type="email"
                        required
                        value={regForm.businessEmail}
                        onChange={(e) => setRegForm({ ...regForm, businessEmail: e.target.value })}
                        placeholder="tanvir@company.com.bd"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone with Country Code *</label>
                      <input
                        type="text"
                        required
                        value={regForm.phone}
                        onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                        placeholder="+880 1700-000000"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Portal Password *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={regForm.password}
                        onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                        placeholder="Create password"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
                      <input
                        type="text"
                        required
                        value={regForm.companyName}
                        onChange={(e) => setRegForm({ ...regForm, companyName: e.target.value })}
                        placeholder="NextGen Telecom & IT Ltd."
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Country *</label>
                      <select
                        value={regForm.countryCode}
                        onChange={(e) => setRegForm({ ...regForm, countryCode: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                      >
                        <option value="BD">Bangladesh (BD)</option>
                        <option value="US">United States (US)</option>
                        <option value="GB">United Kingdom (GB)</option>
                        <option value="AE">United Arab Emirates (AE)</option>
                        <option value="SG">Singapore (SG)</option>
                        <option value="MY">Malaysia (MY)</option>
                        <option value="MM">Myanmar (MM)</option>
                        <option value="CN">China (CN)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Business Address *</label>
                    <input
                      type="text"
                      required
                      value={regForm.businessAddress}
                      onChange={(e) => setRegForm({ ...regForm, businessAddress: e.target.value })}
                      placeholder="House 14, Road 7, Gulshan-1, Dhaka 1212, Bangladesh"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sales Channels *</label>
                      <input
                        type="text"
                        required
                        value={regForm.salesChannels}
                        onChange={(e) => setRegForm({ ...regForm, salesChannels: e.target.value })}
                        placeholder="Retail Store, B2B ISP, E-Commerce"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Estimated Monthly Order Volume *</label>
                      <input
                        type="text"
                        required
                        value={regForm.estimatedMonthlyVolume}
                        onChange={(e) => setRegForm({ ...regForm, estimatedMonthlyVolume: e.target.value })}
                        placeholder="15 - 30 Kits / Month"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company Website (Optional)</label>
                      <input
                        type="url"
                        value={regForm.website}
                        onChange={(e) => setRegForm({ ...regForm, website: e.target.value })}
                        placeholder="https://www.yourcompany.com.bd"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company Logo Upload (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoFileUpload(e, 'register')}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                      />
                    </div>
                  </div>

                  {regForm.applicationType === 'authorized_retailer' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Store / Business Locations *</label>
                        <input
                          type="text"
                          required
                          value={regForm.businessLocations}
                          onChange={(e) => setRegForm({ ...regForm, businessLocations: e.target.value })}
                          placeholder="Dhaka, Chattogram, Sylhet"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Products of Interest *</label>
                        <input
                          type="text"
                          required
                          value={regForm.productsOfInterest}
                          onChange={(e) => setRegForm({ ...regForm, productsOfInterest: e.target.value })}
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {regForm.applicationType === 'business_partnership' && (
                    <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Target Markets *</label>
                          <input
                            type="text"
                            required
                            value={regForm.targetMarkets}
                            onChange={(e) => setRegForm({ ...regForm, targetMarkets: e.target.value })}
                            placeholder="Bangladesh, ASEAN, Middle East"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Product Categories *</label>
                          <input
                            type="text"
                            required
                            value={regForm.productCategories}
                            onChange={(e) => setRegForm({ ...regForm, productCategories: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Short Partnership Proposal *</label>
                        <textarea
                          rows={2}
                          required
                          value={regForm.proposalSummary}
                          onChange={(e) => setRegForm({ ...regForm, proposalSummary: e.target.value })}
                          placeholder="Outline your distribution network, enterprise client base, and logistics capability..."
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'Submitting Application...' : 'Submit Application & Open Partner Account'}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* ================= AUTHENTICATED RESELLER DASHBOARD ================= */
          <div className="space-y-6">
            {/* Top Status & Identity Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {profile.branding?.logoUrl ? (
                  <img
                    src={profile.branding.logoUrl}
                    alt={profile.branding.companyName}
                    className="w-14 h-14 rounded-xl object-contain border border-slate-200 bg-white p-1"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xl">
                    {profile.companyName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl font-extrabold text-slate-900">{profile.branding?.companyName || profile.companyName}</h1>
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                        profile.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : profile.status === 'Pending' || profile.status === 'Under Review'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : profile.status === 'Responded'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      Status: {profile.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Ref: {profile.referenceNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {profile.contactName} · {profile.businessEmail} · {profile.phone} · Country: {profile.countryCode}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                {(
                  [
                    { id: 'overview', label: 'Overview' },
                    { id: 'catalog', label: 'Catalog' },
                    { id: 'new-order', label: 'New Order' },
                    { id: 'orders', label: `Customer Orders (${orders.length})` },
                    { id: 'earnings', label: 'Earnings' },
                    { id: 'withdrawals', label: 'Withdrawals' },
                    { id: 'branding', label: 'Branding Settings' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Approval Gate Notice if Not Approved */}
            {!isApprovedReseller && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 flex items-start gap-4">
                <Clock className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-bold text-amber-950">
                    Application Reference {profile.referenceNumber} — Current Status: {profile.status}
                  </h2>
                  <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                    Reseller wholesale pricing (85% of DSLink public price), customer order placement, and profit withdrawals are enabled strictly after DSLink Admin approval. You can configure your company branding now while your application is reviewed.
                  </p>
                </div>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pending Profit</div>
                <div className="text-xl font-extrabold text-amber-600 mt-1">
                  {formatConvertedCurrency(profile.pendingProfitBdt)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Awaiting both Delivery & Payment confirmation
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Available Balance</div>
                <div className="text-xl font-extrabold text-emerald-700 mt-1">
                  {formatConvertedCurrency(profile.availableBalanceBdt)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cleared profit ready for MFS / NPSB withdrawal
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Reserved in Processing</div>
                <div className="text-xl font-extrabold text-blue-700 mt-1">
                  {formatConvertedCurrency(profile.reservedWithdrawalBdt)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Locked for active payout requests
                </p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Withdrawn Total</div>
                <div className="text-xl font-extrabold text-slate-900 mt-1">
                  {formatConvertedCurrency(profile.withdrawnTotalBdt)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Completed payouts via bKash, Nagad, Rocket & NPSB
                </p>
              </div>
            </div>

            {/* ================= TAB 1: OVERVIEW ================= */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-extrabold text-slate-900">Recent Customer Orders</h2>
                    {isApprovedReseller && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('new-order')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Place New Customer Order
                      </button>
                    )}
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      No reseller customer orders submitted yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((ord) => (
                        <div
                          key={ord.id}
                          className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                                {ord.fulfillmentStatus}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 font-semibold text-emerald-800">
                                {ord.paymentStatus}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              Customer: {ord.shippingAddress.fullName} ({ord.shippingAddress.cityDistrict}, {ord.shippingAddress.countryCode})
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Customer Selling / Hardware Profit</div>
                            <div className="text-sm font-bold text-slate-900">
                              BDT {ord.totalCustomerSellingBdt.toLocaleString()} ·{' '}
                              <span className="text-emerald-700">+BDT {ord.totalHardwareProfitBdt.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <h2 className="text-base font-extrabold text-slate-900">Active Branding Snapshot</h2>
                  <p className="text-xs text-slate-600">
                    Every order you submit captures an immutable snapshot of your reseller branding for customer invoices, packing slips, and DSLink warehouse shipping labels. Reseller cost and profit never appear on customer documents.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-700">Company Name:</span>{' '}
                      <span className="text-slate-900">{profile.branding?.companyName}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Address:</span>{' '}
                      <span className="text-slate-900">{profile.branding?.businessAddress}</span>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700">Phone:</span>{' '}
                      <span className="text-slate-900">{profile.branding?.phone}</span>
                    </div>
                    {profile.branding?.website && (
                      <div>
                        <span className="font-bold text-slate-700">Website:</span>{' '}
                        <span className="text-slate-900">{profile.branding.website}</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('branding')}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Edit Branding Settings
                  </button>
                </div>
              </div>
            )}

            {/* ================= TAB 2: CATALOG ================= */}
            {activeTab === 'catalog' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Wholesale Starlink Hardware, Accessories & Fixed Plan Catalog
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Approved resellers pay 85% of the DSLink public price on Starlink kits and accessories (15% wholesale discount). Save your default customer selling price per product below.
                    </p>
                  </div>
                </div>

                {!isApprovedReseller ? (
                  <div className="p-8 text-center text-sm text-slate-600">
                    Wholesale reseller catalog pricing unlocks as soon as your reseller application is approved by DSLink Admin.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase">
                          <th className="py-3 px-3">Product / SKU</th>
                          <th className="py-3 px-3">Category</th>
                          <th className="py-3 px-3">DSLink Public Price</th>
                          <th className="py-3 px-3">Your Reseller Cost (85%)</th>
                          <th className="py-3 px-3">Customer Selling Price (BDT)</th>
                          <th className="py-3 px-3">Your Hardware Profit / Unit</th>
                          <th className="py-3 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {catalog.map((item) => {
                          const sellingPrice =
                            customSellingPrices[item.id] ?? item.defaultCustomerSellingPriceBdt;
                          const unitProfit =
                            item.category === 'subscription_plan'
                              ? 0
                              : sellingPrice - item.resellerCostBdt;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80">
                              <td className="py-3.5 px-3">
                                <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                                <div className="text-[11px] font-mono text-slate-500">SKU: {item.sku}</div>
                              </td>
                              <td className="py-3.5 px-3">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                  {item.category === 'subscription_plan' ? 'Fixed Subscription Plan' : 'Hardware (15% Off)'}
                                </span>
                              </td>
                              <td className="py-3.5 px-3 font-semibold text-slate-700">
                                {formatConvertedCurrency(item.publicPriceBdt)}
                              </td>
                              <td className="py-3.5 px-3 font-bold text-emerald-700">
                                {formatConvertedCurrency(item.resellerCostBdt)}
                              </td>
                              <td className="py-3.5 px-3">
                                <input
                                  type="number"
                                  min={item.resellerCostBdt}
                                  disabled={item.category === 'subscription_plan'}
                                  value={sellingPrice}
                                  onChange={(e) =>
                                    setCustomSellingPrices((prev) => ({
                                      ...prev,
                                      [item.id]: Number(e.target.value)
                                    }))
                                  }
                                  className="w-32 px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 bg-white"
                                />
                              </td>
                              <td className="py-3.5 px-3 font-extrabold text-emerald-700">
                                {item.category === 'subscription_plan'
                                  ? 'Fixed Fee (BDT 0)'
                                  : formatConvertedCurrency(unitProfit)}
                              </td>
                              <td className="py-3.5 px-3 text-right">
                                {item.category !== 'subscription_plan' && (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCatalogPrice(item.id, sellingPrice)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                                  >
                                    Save Default
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: NEW ORDER ================= */}
            {activeTab === 'new-order' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                {!isApprovedReseller ? (
                  <div className="p-8 text-center text-sm text-slate-600">
                    Customer order submission is enabled after DSLink Admin approves your reseller account.
                  </div>
                ) : (
                  <form onSubmit={handleSubmitResellerOrder} className="space-y-8">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Place Reseller Customer Order (Server-Validated Profit & Branded Fulfillment)
                      </h2>
                      <p className="text-xs text-slate-600 mt-1">
                        Select products, override the customer selling price for this order if needed, and enter the complete 10-field customer shipping address. Your order is saved first and then dispatched to the DSLink fulfillment inbox.
                      </p>
                    </div>

                    {/* Step 1: Product Selection & Custom Selling Price per Order */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        1. Select Hardware Kits, Accessories & Subscription Plans
                      </h3>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                              <th className="py-3 px-3">Product</th>
                              <th className="py-3 px-3">Public Price</th>
                              <th className="py-3 px-3">Your Cost (85%)</th>
                              <th className="py-3 px-3">Order Selling Price (BDT)</th>
                              <th className="py-3 px-3">Quantity</th>
                              <th className="py-3 px-3">Line Hardware Profit</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {catalog.map((item) => {
                              const qty = Number(orderQuantities[item.id] || 0);
                              const unitSelling = Number(
                                orderSellingPrices[item.id] ??
                                  customSellingPrices[item.id] ??
                                  item.defaultCustomerSellingPriceBdt
                              );
                              const lineProfit =
                                item.category === 'subscription_plan'
                                  ? 0
                                  : (unitSelling - item.resellerCostBdt) * qty;
                              return (
                                <tr key={item.id} className={qty > 0 ? 'bg-emerald-50/40' : ''}>
                                  <td className="py-3 px-3 font-bold text-slate-900">
                                    {item.name}
                                    <span className="block text-[11px] font-mono text-slate-500">{item.sku}</span>
                                  </td>
                                  <td className="py-3 px-3">BDT {item.publicPriceBdt.toLocaleString()}</td>
                                  <td className="py-3 px-3 font-bold text-emerald-700">
                                    BDT {item.resellerCostBdt.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-3">
                                    <input
                                      type="number"
                                      min={item.resellerCostBdt}
                                      disabled={item.category === 'subscription_plan'}
                                      value={unitSelling}
                                      onChange={(e) =>
                                        setOrderSellingPrices((prev) => ({
                                          ...prev,
                                          [item.id]: Number(e.target.value)
                                        }))
                                      }
                                      className="w-28 px-2.5 py-1.5 rounded border border-slate-300 font-bold bg-white"
                                    />
                                  </td>
                                  <td className="py-3 px-3">
                                    <input
                                      type="number"
                                      min={0}
                                      max={100}
                                      value={qty}
                                      onChange={(e) =>
                                        setOrderQuantities((prev) => ({
                                          ...prev,
                                          [item.id]: Math.max(0, Number(e.target.value))
                                        }))
                                      }
                                      className="w-20 px-2.5 py-1.5 rounded border border-slate-300 font-bold bg-white"
                                    />
                                  </td>
                                  <td className="py-3 px-3 font-extrabold text-emerald-700">
                                    BDT {lineProfit.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Step 2: Complete 10-Field Shipping Address */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        2. Customer Shipping Address (Complete 10-Field International & Bangladesh Format)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">1. Recipient Full Name *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.fullName}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                            placeholder="Customer Full Name"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">2. Phone with Country Code *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.phone}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                            placeholder="+880 1711-000000"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">3. House / Flat / Suite *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.houseFlat}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, houseFlat: e.target.value })}
                            placeholder="House 22, Flat 4B"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">4. Road / Street *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.roadStreet}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, roadStreet: e.target.value })}
                            placeholder="Road 11, Block F"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">5. Area / Thana / Neighborhood *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.area}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, area: e.target.value })}
                            placeholder="Banani"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">6. City / District *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.cityDistrict}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, cityDistrict: e.target.value })}
                            placeholder="Dhaka"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">7. State / Division / Province *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.stateDivision}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, stateDivision: e.target.value })}
                            placeholder="Dhaka Division"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">8. Postal / ZIP Code *</label>
                          <input
                            type="text"
                            required
                            value={shippingAddress.postalCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                            placeholder="1213"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">9. Destination Country *</label>
                          <select
                            value={shippingAddress.countryCode}
                            onChange={(e) => setShippingAddress({ ...shippingAddress, countryCode: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
                          >
                            <option value="BD">Bangladesh (BD)</option>
                            <option value="US">United States (US)</option>
                            <option value="GB">United Kingdom (GB)</option>
                            <option value="AE">United Arab Emirates (AE)</option>
                            <option value="SG">Singapore (SG)</option>
                            <option value="MY">Malaysia (MY)</option>
                            <option value="MM">Myanmar (MM)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          10. Optional Landmark / Delivery Note
                        </label>
                        <input
                          type="text"
                          value={shippingAddress.landmarkNote || ''}
                          onChange={(e) => setShippingAddress({ ...shippingAddress, landmarkNote: e.target.value })}
                          placeholder="Near Banani Lake Bridge / Call customer before delivery"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>
                    </div>

                    {/* Step 3: Payment Method & Advance Payment Collector Rules */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                        3. Payment Method & Profit Settlement Flow
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label
                          className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                            paymentMethod === 'COD'
                              ? 'border-emerald-600 bg-emerald-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="resellerPaymentMethod"
                            checked={paymentMethod === 'COD'}
                            onChange={() => setPaymentMethod('COD')}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">Cash on Delivery (COD)</div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              DSLink courier collects{' '}
                              <strong>BDT {orderCalculation.totalCustomerSellingBdt.toLocaleString()}</strong> from the customer at delivery. Your hardware profit of{' '}
                              <strong>BDT {orderCalculation.totalHardwareProfitBdt.toLocaleString()}</strong> is released to your available balance once delivery and COD collection are confirmed.
                            </p>
                          </div>
                        </label>

                        <label
                          className={`p-4 rounded-xl border cursor-pointer flex items-start gap-3 ${
                            paymentMethod === 'BANGLA_QR_ADVANCE'
                              ? 'border-emerald-600 bg-emerald-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <input
                            type="radio"
                            name="resellerPaymentMethod"
                            checked={paymentMethod === 'BANGLA_QR_ADVANCE'}
                            onChange={() => setPaymentMethod('BANGLA_QR_ADVANCE')}
                            className="mt-1"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              Advance Payment (Bangla QR / Bank / MFS)
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Order enters <strong>Awaiting Payment</strong> until verified. Select below whether DSLink collects the full customer price or you collected from the customer and remit the 85% reseller cost to DSLink.
                            </p>
                          </div>
                        </label>
                      </div>

                      {paymentMethod === 'BANGLA_QR_ADVANCE' && (
                        <div className="space-y-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">
                              Who Collected the Customer Advance Payment?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="p-3 rounded-lg border border-slate-300 bg-white flex items-start gap-2.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  checked={paymentCollector === 'dslink'}
                                  onChange={() => setPaymentCollector('dslink')}
                                  className="mt-0.5"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    DSLink Collects Full Customer Price (BDT {orderCalculation.totalCustomerSellingBdt.toLocaleString()})
                                  </span>
                                  <span className="text-slate-600">
                                    Hardware profit (BDT {orderCalculation.totalHardwareProfitBdt.toLocaleString()}) is credited to your available balance once payment and delivery are confirmed.
                                  </span>
                                </div>
                              </label>
                              <label className="p-3 rounded-lg border border-slate-300 bg-white flex items-start gap-2.5 text-xs cursor-pointer">
                                <input
                                  type="radio"
                                  checked={paymentCollector === 'reseller'}
                                  onChange={() => setPaymentCollector('reseller')}
                                  className="mt-0.5"
                                />
                                <div>
                                  <span className="font-bold text-slate-900 block">
                                    Reseller Collected Customer Payment & Retained Margin
                                  </span>
                                  <span className="text-slate-600">
                                    You pay DSLink only the 85% reseller cost (BDT {orderCalculation.totalResellerCostBdt.toLocaleString()}). Margin is recorded as directly settled without double-crediting your balance.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </div>

                          <BanglaQrPaymentSection
                            orderId="RESELLER-ADVANCE"
                            productSummary={orderCalculation.selectedItems
                              .map((x) => `${x.item.name} × ${x.qty}`)
                              .join(', ')}
                            amountBdt={
                              paymentCollector === 'dslink'
                                ? orderCalculation.totalCustomerSellingBdt
                                : orderCalculation.totalResellerCostBdt
                            }
                            transactionId={advanceTrxId}
                            onTransactionIdChange={setAdvanceTrxId}
                            paymentStatus="Awaiting Payment"
                            compact
                          />
                        </div>
                      )}
                    </div>

                    {/* Order Financial Summary Box */}
                    <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1 text-xs">
                        <div className="text-slate-400">
                          Reseller Cost (85% Hardware):{' '}
                          <span className="text-white font-bold">
                            {formatConvertedCurrency(orderCalculation.totalResellerCostBdt)}
                          </span>
                        </div>
                        <div className="text-slate-400">
                          Customer Selling Total:{' '}
                          <span className="text-white font-bold">
                            {formatConvertedCurrency(orderCalculation.totalCustomerSellingBdt)}
                          </span>
                        </div>
                        {paymentMethod === 'COD' && (
                          <div className="text-amber-300 font-semibold">
                            COD Amount to Collect at Delivery: BDT {orderCalculation.codAmountToCollectBdt.toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-emerald-400 uppercase font-mono">Server-Calculated Hardware Profit</div>
                        <div className="text-2xl font-extrabold text-white">
                          {formatConvertedCurrency(orderCalculation.totalHardwareProfitBdt)}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingOrder}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors cursor-pointer"
                    >
                      {submittingOrder
                        ? 'Saving Order & Notifying DSLink Fulfillment...'
                        : 'Submit Reseller Customer Order'}
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* ================= TAB 4: CUSTOMER ORDERS & BRANDED DOCUMENTS ================= */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                  Customer Orders & Branded Invoices / Packing Slips
                </h2>
                <p className="text-xs text-slate-600 mb-6">
                  Track Payment Status separately from Fulfillment Status. Print reseller-branded customer invoices or packing slips (reseller cost and profit are strictly excluded from customer documents).
                </p>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No customer orders found.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-extrabold text-base text-slate-900">
                              {ord.orderNumber}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
                              Fulfillment: {ord.fulfillmentStatus}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                                ord.paymentStatus === 'Verified / Paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              Payment: {ord.paymentStatus}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              Profit: {ord.profitStatus}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPrintOrder(ord);
                                setPrintDocType('invoice');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Customer Invoice
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPrintOrder(ord);
                                setPrintDocType('packing-slip');
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              Packing Slip
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-2 border-t border-slate-100">
                          <div>
                            <div className="font-bold text-slate-700">Customer & Shipping Address</div>
                            <p className="text-slate-600 mt-0.5">
                              {ord.shippingAddress.fullName} ({ord.shippingAddress.phone})
                              <br />
                              {ord.shippingAddress.houseFlat}, {ord.shippingAddress.roadStreet}, {ord.shippingAddress.area}
                              <br />
                              {ord.shippingAddress.cityDistrict}, {ord.shippingAddress.stateDivision}{' '}
                              {ord.shippingAddress.postalCode}, {ord.shippingAddress.countryCode}
                            </p>
                          </div>
                          <div>
                            <div className="font-bold text-slate-700">Items Ordered</div>
                            <ul className="text-slate-600 mt-0.5 space-y-0.5">
                              {ord.items.map((it, idx) => (
                                <li key={idx}>
                                  {it.name} × {it.quantity} (Customer Price: BDT{' '}
                                  {it.lineCustomerTotalBdt.toLocaleString()})
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="md:text-right">
                            <div className="text-slate-500">
                              Reseller Cost: BDT {ord.totalResellerCostBdt.toLocaleString()}
                            </div>
                            <div className="font-bold text-slate-900 text-sm">
                              Customer Total: BDT {ord.totalCustomerSellingBdt.toLocaleString()}
                            </div>
                            <div className="font-extrabold text-emerald-700 text-sm">
                              Hardware Profit: BDT {ord.totalHardwareProfitBdt.toLocaleString()}
                            </div>
                            {ord.paymentMethod === 'COD' && (
                              <div className="text-[11px] text-amber-700 font-semibold">
                                COD to Collect: BDT {ord.codAmountToCollectBdt.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 5: EARNINGS & LEDGER ================= */}
            {activeTab === 'earnings' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                  Earnings & Profit Settlement Ledger (BDT Accounting)
                </h2>
                <p className="text-xs text-slate-600 mb-6">
                  Reseller hardware profit is released to your Available Balance only after both Delivery and Payment are confirmed. Returns, refunds, and direct reseller collections are audited below.
                </p>
                {ledger.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No balance ledger entries yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 uppercase">
                          <th className="py-3 px-3">Timestamp</th>
                          <th className="py-3 px-3">Event Type</th>
                          <th className="py-3 px-3">Order / Withdrawal Ref</th>
                          <th className="py-3 px-3">Amount (BDT)</th>
                          <th className="py-3 px-3">Audit Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {ledger.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {new Date(entry.createdAt).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800">{entry.type}</td>
                            <td className="py-3 px-3 font-mono text-slate-700">
                              {entry.orderNumber || entry.withdrawalRef || '—'}
                            </td>
                            <td className="py-3 px-3 font-extrabold text-emerald-700">
                              BDT {entry.amountBdt.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-slate-600">{entry.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 6: WITHDRAWALS ================= */}
            {activeTab === 'withdrawals' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h2 className="text-base font-extrabold text-slate-900 mb-1">
                    Request Profit Withdrawal
                  </h2>
                  <p className="text-xs text-slate-600 mb-4">
                    Withdraw available BDT balance via bKash, Nagad, Rocket, or Bank Payout via NPSB. Requested funds are reserved immediately during processing and restored automatically if a payout fails.
                  </p>

                  {!isApprovedReseller ? (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      Withdrawals are enabled after reseller approval.
                    </div>
                  ) : (
                    <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Withdrawal Amount (BDT) — Available: BDT {profile.availableBalanceBdt.toLocaleString()}
                        </label>
                        <input
                          type="number"
                          required
                          min={100}
                          max={profile.availableBalanceBdt}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="e.g., 415"
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Payout Method *</label>
                        <select
                          value={withdrawMethod}
                          onChange={(e) => setWithdrawMethod(e.target.value as any)}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-semibold bg-white"
                        >
                          <option value="bKash">bKash (MFS)</option>
                          <option value="Nagad">Nagad (MFS)</option>
                          <option value="Rocket">Rocket (DBBL MFS)</option>
                          <option value="Bank Payout via NPSB">Bank Payout via NPSB (Instant Bank Transfer)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name *</label>
                        <input
                          type="text"
                          required
                          value={withdrawAccountName}
                          onChange={(e) => setWithdrawAccountName(e.target.value)}
                          placeholder="Account Holder / Company Name"
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          {withdrawMethod === 'Bank Payout via NPSB' ? 'Bank Account Number *' : 'MFS Wallet Number *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={withdrawAccountNumber}
                          onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                          placeholder={withdrawMethod === 'Bank Payout via NPSB' ? '1234567890123' : '01700000000'}
                          className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm font-mono"
                        />
                      </div>

                      {withdrawMethod === 'Bank Payout via NPSB' && (
                        <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name *</label>
                            <input
                              type="text"
                              required
                              value={withdrawBankName}
                              onChange={(e) => setWithdrawBankName(e.target.value)}
                              placeholder="City Bank / BRAC Bank / DBBL / UCB"
                              className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Branch Name</label>
                              <input
                                type="text"
                                value={withdrawBranchName}
                                onChange={(e) => setWithdrawBranchName(e.target.value)}
                                placeholder="Gulshan Branch"
                                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Routing Number</label>
                              <input
                                type="text"
                                value={withdrawRoutingNumber}
                                onChange={(e) => setWithdrawRoutingNumber(e.target.value)}
                                placeholder="225261729"
                                className="w-full px-3 py-1.5 rounded border border-slate-300 text-xs font-mono bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={loading || profile.availableBalanceBdt <= 0}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        {loading ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                      </button>
                    </form>
                  )}
                </div>

                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h2 className="text-base font-extrabold text-slate-900 mb-4">Withdrawal & Payout History</h2>
                  {withdrawals.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">No withdrawal requests submitted yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {withdrawals.map((w) => (
                        <div
                          key={w.id}
                          className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900">{w.reference}</span>
                              <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-800">
                                {w.method}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-bold ${
                                  w.status === 'Completed'
                                    ? 'bg-emerald-50 text-emerald-800'
                                    : w.status === 'Failed' || w.status === 'Rejected'
                                    ? 'bg-red-50 text-red-800'
                                    : 'bg-amber-50 text-amber-800'
                                }`}
                              >
                                {w.status}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">
                              Account: {w.accountDetails.accountName} · {w.accountDetails.accountNumber}{' '}
                              {w.accountDetails.bankName ? `(${w.accountDetails.bankName})` : ''}
                            </p>
                            {w.adminNote && <p className="text-slate-500 mt-0.5">Note: {w.adminNote}</p>}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-slate-900">
                              BDT {w.amountBdt.toLocaleString()}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(w.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 7: BRANDING SETTINGS ================= */}
            {activeTab === 'branding' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs max-w-3xl">
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                  Reseller Branding Settings (Snapshotted per Order)
                </h2>
                <p className="text-xs text-slate-600 mb-6">
                  Configure your company name, logo, business address, phone, and website. When you place a customer order, DSLink snapshots these details onto your printable customer invoice, packing slip, and warehouse shipping label.
                </p>

                <form onSubmit={handleSaveBranding} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Reseller Company Name *</label>
                    <input
                      type="text"
                      required
                      value={brandingForm.companyName}
                      onChange={(e) => setBrandingForm({ ...brandingForm, companyName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Business Address *</label>
                    <input
                      type="text"
                      required
                      value={brandingForm.businessAddress}
                      onChange={(e) => setBrandingForm({ ...brandingForm, businessAddress: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone *</label>
                      <input
                        type="text"
                        required
                        value={brandingForm.phone}
                        onChange={(e) => setBrandingForm({ ...brandingForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Website (Optional)</label>
                      <input
                        type="text"
                        value={brandingForm.website}
                        onChange={(e) => setBrandingForm({ ...brandingForm, website: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Logo URL or Upload</label>
                      <input
                        type="text"
                        value={brandingForm.logoUrl}
                        onChange={(e) => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-300 text-sm mb-2"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoFileUpload(e, 'branding')}
                        className="w-full text-xs text-slate-600"
                      />
                    </div>
                    {brandingForm.logoUrl && (
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3">
                        <img
                          src={brandingForm.logoUrl}
                          alt="Branding Logo Preview"
                          className="w-14 h-14 object-contain bg-white rounded border border-slate-200 p-1"
                        />
                        <span className="text-xs text-slate-600">Active Logo Preview</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    {loading ? 'Saving...' : 'Save Reseller Branding'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= PRINTABLE CUSTOMER INVOICE / PACKING SLIP MODAL ================= */}
      {printOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintDocType('invoice')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    printDocType === 'invoice' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Customer Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setPrintDocType('packing-slip')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    printDocType === 'packing-slip' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Packing Slip
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Document
                </button>
                <button
                  type="button"
                  onClick={() => setPrintOrder(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Branded Document Body — STRICTLY EXCLUDES RESELLER COST & PROFIT */}
            <div className="space-y-6 text-slate-900">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-3">
                  {printOrder.brandingSnapshot?.logoUrl && (
                    <img
                      src={printOrder.brandingSnapshot.logoUrl}
                      alt={printOrder.brandingSnapshot.companyName}
                      className="w-12 h-12 object-contain border border-slate-200 rounded p-1"
                    />
                  )}
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {printOrder.brandingSnapshot?.companyName || printOrder.resellerCompany}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {printOrder.brandingSnapshot?.businessAddress}
                    </p>
                    <p className="text-xs text-slate-600">
                      Phone: {printOrder.brandingSnapshot?.phone}{' '}
                      {printOrder.brandingSnapshot?.website ? `· ${printOrder.brandingSnapshot.website}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {printDocType === 'invoice' ? 'CUSTOMER INVOICE' : 'PACKING SLIP'}
                  </div>
                  <div className="font-mono font-extrabold text-base">{printOrder.orderNumber}</div>
                  <div className="text-xs text-slate-500">
                    Date: {new Date(printOrder.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700 uppercase mb-1">Ship To Customer</div>
                  <div className="font-bold text-slate-900 text-sm">{printOrder.shippingAddress.fullName}</div>
                  <div>Phone: {printOrder.shippingAddress.phone}</div>
                  <div>
                    {printOrder.shippingAddress.houseFlat}, {printOrder.shippingAddress.roadStreet}
                  </div>
                  <div>
                    {printOrder.shippingAddress.area}, {printOrder.shippingAddress.cityDistrict}
                  </div>
                  <div>
                    {printOrder.shippingAddress.stateDivision} {printOrder.shippingAddress.postalCode},{' '}
                    {printOrder.shippingAddress.countryCode}
                  </div>
                  {printOrder.shippingAddress.landmarkNote && (
                    <div className="mt-1 text-slate-600">Note: {printOrder.shippingAddress.landmarkNote}</div>
                  )}
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-700 uppercase mb-1">Fulfillment & Payment</div>
                  <div>Payment Method: {printOrder.paymentMethod}</div>
                  <div>Payment Status: {printOrder.paymentStatus}</div>
                  <div>Fulfillment Status: {printOrder.fulfillmentStatus}</div>
                  {printOrder.paymentMethod === 'COD' && (
                    <div className="font-bold text-slate-900 mt-1">
                      Amount to Collect at Delivery: BDT {printOrder.codAmountToCollectBdt.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-300 text-slate-600 uppercase">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5">SKU</th>
                    <th className="py-2.5 text-center">Qty</th>
                    {printDocType === 'invoice' && (
                      <>
                        <th className="py-2.5 text-right">Unit Price (BDT)</th>
                        <th className="py-2.5 text-right">Line Total (BDT)</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {printOrder.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-3 font-bold text-slate-900">{it.name}</td>
                      <td className="py-3 font-mono text-slate-600">{it.sku}</td>
                      <td className="py-3 text-center font-bold">{it.quantity}</td>
                      {printDocType === 'invoice' && (
                        <>
                          <td className="py-3 text-right">
                            BDT {it.customerUnitSellingPriceBdt.toLocaleString()}
                          </td>
                          <td className="py-3 text-right font-bold">
                            BDT {it.lineCustomerTotalBdt.toLocaleString()}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {printDocType === 'invoice' && (
                <div className="flex justify-end border-t border-slate-300 pt-4">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Customer Invoice Total</div>
                    <div className="text-xl font-extrabold text-slate-900">
                      BDT {printOrder.totalCustomerSellingBdt.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <GlobalFooterPreferences />
      <Footer />
    </div>
  );
};

export default ResellerPortalPage;
