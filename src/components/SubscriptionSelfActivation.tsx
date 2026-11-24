import React, { useState, useEffect } from 'react';
import { doc, updateDoc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { formatStarlinkKitNumber, scanKitNumberFromImage, isValidKitNumber } from '../utils/kitOcrService';
import { LiveCameraScannerModal } from './LiveCameraScannerModal';
import { 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Satellite, 
  Loader2, 
  ShieldCheck, 
  ArrowRight, 
  Camera, 
  Upload, 
  PauseCircle, 
  PlayCircle, 
  RefreshCw, 
  Download, 
  Settings2, 
  Wifi, 
  Activity, 
  Sparkles, 
  Copy, 
  Check, 
  HelpCircle,
  Clock,
  MapPin,
  Phone,
  CreditCard
} from 'lucide-react';

interface StarlinkPlan {
  id: string;
  nameBn: string;
  nameEn: string;
  price: number;
  speed: string;
  dataLimit: string;
  popular?: boolean;
}

const STARLINK_PLANS: StarlinkPlan[] = [
  {
    id: 'plan_standard',
    nameBn: 'রেসিডেন্সিয়াল স্ট্যান্ডার্ড (Residential Standard)',
    nameEn: 'Residential Standard Plan',
    price: 12500,
    speed: '100-250 Mbps Unlimited',
    dataLimit: 'আনলিমিটেড হাই-স্পিড ডেটা',
    popular: true
  },
  {
    id: 'plan_priority',
    nameBn: 'বিজনেস প্রাওরিটি ১টিবি (Business Priority 1TB)',
    nameEn: 'Business Priority 1TB Plan',
    price: 25000,
    speed: '200-350 Mbps Public IP',
    dataLimit: '১ টিবি প্রাওরিটি ডেটা + আনলিমিটেড স্ট্যান্ডার্ড'
  },
  {
    id: 'plan_roam',
    nameBn: 'মোবাইল রোম (Mobile Roam / Portable)',
    nameEn: 'Mobile Roam Plan',
    price: 15500,
    speed: '50-150 Mbps On-The-Go',
    dataLimit: 'পোর্টেবল সারাদেশে ব্যবহারযোগ্য'
  }
];

export const SubscriptionSelfActivation: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();

  // State
  const [loading, setLoading] = useState(true);
  const [subData, setSubData] = useState<any>(null);
  const [kitNumberInput, setKitNumberInput] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('plan_standard');
  const [userPhone, setUserPhone] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad'>('bkash');
  
  // OCR & Camera Scan State
  const [isScanningOcr, setIsScanningOcr] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  
  // Action States
  const [isActivating, setIsActivating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showPlanChangeModal, setShowPlanChangeModal] = useState(false);
  const [copiedKit, setCopiedKit] = useState(false);
  const [updatingAction, setUpdatingAction] = useState(false);

  // Fetch existing customer subscription/order data
  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    const fetchSubData = async () => {
      setLoading(true);
      try {
        const docId = user.uid || user.email || 'anonymous';
        const subDocRef = doc(db, 'subscriptions', docId);
        const subSnap = await getDoc(subDocRef).catch(() => null);

        if (subSnap && subSnap.exists()) {
          const data = subSnap.data();
          setSubData(data);
          if (data.starlinkKitNumber) setKitNumberInput(data.starlinkKitNumber);
          if (data.phone) setUserPhone(data.phone);
          if (data.address) setAddress(data.address);
          if (data.planId) setSelectedPlanId(data.planId);
        } else {
          // Check orders collection for existing kit numbers or orders
          const ordersQ = query(collection(db, 'orders'), where('email', '==', user.email));
          const orderSnap = await getDocs(ordersQ).catch(() => ({ docs: [] } as any));

          if (orderSnap.docs && orderSnap.docs.length > 0) {
            const latestOrder = orderSnap.docs[0].data();
            if (latestOrder.kitNumber || latestOrder.starlinkKitNumber) {
              const kit = latestOrder.kitNumber || latestOrder.starlinkKitNumber;
              setKitNumberInput(kit);
            }
            if (latestOrder.phone) setUserPhone(latestOrder.phone);
            if (latestOrder.address) setAddress(latestOrder.address);
          }
        }
      } catch (err) {
        console.warn("Error fetching subscription data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubData();
  }, [user]);

  // Handle OCR Image Upload Scan
  const handleOcrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningOcr(true);
    setErrorMessage('');
    setOcrSuccess(false);

    try {
      const extractedKit = await scanKitNumberFromImage(file);
      if (extractedKit && isValidKitNumber(extractedKit)) {
        setKitNumberInput(extractedKit);
        setOcrSuccess(true);
        setTimeout(() => setOcrSuccess(false), 4000);
      } else if (extractedKit) {
        setKitNumberInput(extractedKit);
        setErrorMessage('স্ক্যানকৃত কিট নম্বর ফরম্যাট চেক করুন। (ফরম্যাট: KIT12345678 বা 12 ডিজিট Hex)');
      } else {
        setErrorMessage('ছবি থেকে কোনো কিট নম্বর রিড করা যায়নি। স্পষ্ট ছবি দিন বা টাইপ করুন।');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'OCR স্ক্যান করতে সমস্যা হয়েছে।');
    } finally {
      setIsScanningOcr(false);
    }
  };

  // Format Kit Number on Change
  const handleKitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const formatted = formatStarlinkKitNumber(val);
    setKitNumberInput(formatted);
    setErrorMessage('');
  };

  // Submit Self-Activation Flow
  const handleSelfActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMsg('');

    const formattedKit = formatStarlinkKitNumber(kitNumberInput);
    if (!isValidKitNumber(formattedKit)) {
      setErrorMessage('সঠিক স্টারলিংক কিট নম্বর দিন। (উদাহরণ: KIT12345678, 00000000-00000000, বা 12 অংকের হেক্সাদশমিক)');
      return;
    }

    if (!userPhone.trim()) {
      setErrorMessage('অনুগ্রহ করে যোগাযোগের জন্য মোবাইল নম্বর লিখুন।');
      return;
    }

    setIsActivating(true);

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days active

      const subscriptionRecord = {
        userId: user?.uid || user?.email,
        email: user?.email,
        phone: userPhone.trim(),
        address: address.trim(),
        starlinkKitNumber: formattedKit,
        planId: selectedPlanId,
        planName: STARLINK_PLANS.find(p => p.id === selectedPlanId)?.nameBn || 'Standard Plan',
        status: 'active',
        autoRenew: true,
        activatedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        paymentMethod: paymentMethod,
        activatedBy: 'self_customer',
        updatedAt: now.toISOString()
      };

      // Persist to Firestore
      const subDocRef = doc(db, 'subscriptions', user?.uid || user?.email || 'guest');
      await setDoc(subDocRef, subscriptionRecord, { merge: true });

      // Update User Profile Status
      if (user?.uid) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          starlinkKitNumber: formattedKit,
          subscriptionStatus: 'active',
          subscriptionExpiresAt: expiresAt.toISOString(),
          phone: userPhone.trim(),
          address: address.trim()
        }).catch(() => null);
      }

      setSubData(subscriptionRecord);
      setSuccessMsg('অভিনন্দন! আপনার স্টারলিংক সাবস্ক্রিপশন সফলভাবে সক্রিয় (Self-Activated) হয়েছে!');
      setShowCertificateModal(true);
    } catch (err: any) {
      setErrorMessage(err?.message || 'সাবস্ক্রিপশন অ্যাক্টিভেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsActivating(false);
    }
  };

  // Toggle Auto Renew
  const handleToggleAutoRenew = async () => {
    if (!subData) return;
    setUpdatingAction(true);
    try {
      const newStatus = !subData.autoRenew;
      const subDocRef = doc(db, 'subscriptions', user?.uid || user?.email || 'guest');
      await updateDoc(subDocRef, { autoRenew: newStatus, updatedAt: new Date().toISOString() });
      setSubData((prev: any) => ({ ...prev, autoRenew: newStatus }));
    } catch (err) {
      console.warn(err);
    } finally {
      setUpdatingAction(false);
    }
  };

  // Toggle Pause/Resume
  const handleTogglePauseStatus = async () => {
    if (!subData) return;
    setUpdatingAction(true);
    try {
      const nextStatus = subData.status === 'active' ? 'paused' : 'active';
      const subDocRef = doc(db, 'subscriptions', user?.uid || user?.email || 'guest');
      await updateDoc(subDocRef, { status: nextStatus, updatedAt: new Date().toISOString() });
      setSubData((prev: any) => ({ ...prev, status: nextStatus }));
    } catch (err) {
      console.warn(err);
    } finally {
      setUpdatingAction(false);
    }
  };

  // Handle Plan Change Submission
  const handleChangePlanSubmit = async () => {
    if (!subData) return;
    setUpdatingAction(true);
    try {
      const newPlan = STARLINK_PLANS.find(p => p.id === selectedPlanId);
      const subDocRef = doc(db, 'subscriptions', user?.uid || user?.email || 'guest');
      await updateDoc(subDocRef, { 
        planId: selectedPlanId,
        planName: newPlan?.nameBn || 'Standard Plan',
        updatedAt: new Date().toISOString()
      });
      setSubData((prev: any) => ({ 
        ...prev, 
        planId: selectedPlanId, 
        planName: newPlan?.nameBn || 'Standard Plan' 
      }));
      setShowPlanChangeModal(false);
      setSuccessMsg('আপনার প্যাকেজ সফলভাবে আপডেট করা হয়েছে।');
    } catch (err) {
      console.warn(err);
    } finally {
      setUpdatingAction(false);
    }
  };

  // Copy Kit Number to Clipboard
  const handleCopyKit = () => {
    if (!kitNumberInput) return;
    navigator.clipboard.writeText(kitNumberInput);
    setCopiedKit(true);
    setTimeout(() => setCopiedKit(false), 2000);
  };

  const currentPlan = STARLINK_PLANS.find(p => p.id === (subData?.planId || selectedPlanId)) || STARLINK_PLANS[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-white">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-semibold text-sm text-neutral-300">সাবস্ক্রিপশন ডাটা লোড হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white max-w-5xl mx-auto">
      {/* HEADER BANNER */}
      <div className="p-6 md:p-8 bg-[#0a0a0a] border border-white/15 rounded-md relative overflow-hidden">
        <div className="space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
            CUSTOMER SELF-ACTIVATION · DEVSPARK LINK
          </div>

          <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight">
            স্টারলিংক মান্থলি সাবস্ক্রিপশন সেলফ-অ্যাক্টিভেশন
          </h1>

          <p className="text-xs md:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            কোনো প্রতিনিধির অপেক্ষায় না থেকে আপনার স্টারলিংক কিট নম্বর দিয়ে নিজেই মান্থলি বিল পে ও ১ মিনিটে সার্ভিস একটিভ বা রিনিউ করুন।
          </p>
        </div>
      </div>

      {/* ACTIVE SUBSCRIPTION CARD */}
      {subData && subData.status && (
        <div className="p-6 bg-[#0a0a0a] border border-white/20 rounded-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/15 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[4px] bg-white/5 border border-white/20 flex items-center justify-center text-white">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-bold text-base text-white">{subData.planName || currentPlan.nameBn}</span>
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-neutral-300">
                    {subData.status === 'active' ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5 font-mono tabular-nums">
                  স্পিড: {currentPlan.speed} · প্রাইজ: ৳{currentPlan.price.toLocaleString()}/মাস
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPlanChangeModal(true)}
              className="px-3.5 py-2 border border-white/30 hover:bg-white/10 text-white font-semibold rounded-[4px] text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>প্যাকেজ পরিবর্তন</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div className="bg-[#111113] p-4 rounded-[4px] border border-white/15">
              <span className="text-neutral-400 block text-[11px]">স্টারলিংক কিট নম্বর</span>
              <div className="font-bold text-white text-sm mt-1 flex items-center justify-between">
                <span>{subData.starlinkKitNumber || 'N/A'}</span>
                <button onClick={handleCopyKit} className="text-neutral-400 hover:text-white cursor-pointer">
                  {copiedKit ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="bg-[#111113] p-4 rounded-[4px] border border-white/15">
              <span className="text-neutral-400 block text-[11px]">অ্যাক্টিভেশনের তারিখ</span>
              <span className="font-bold text-white text-sm mt-1 block tabular-nums">
                {subData.activatedAt ? new Date(subData.activatedAt).toLocaleDateString('bn-BD') : 'N/A'}
              </span>
            </div>

            <div className="bg-[#111113] p-4 rounded-[4px] border border-white/15">
              <span className="text-neutral-400 block text-[11px]">মেয়াদ উত্তীর্ণের তারিখ</span>
              <span className="font-bold text-white text-sm mt-1 block tabular-nums">
                {subData.expiresAt ? new Date(subData.expiresAt).toLocaleDateString('bn-BD') : '৩০ দিন বাকি'}
              </span>
            </div>
          </div>

          {/* CONTROLS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleTogglePauseStatus}
                disabled={updatingAction}
                className="px-4 py-2.5 border border-white/25 hover:bg-white/10 text-white font-semibold rounded-[4px] text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {subData.status === 'active' ? (
                  <>
                    <PauseCircle className="w-4 h-4 text-neutral-300" />
                    <span>সার্ভিস পজ (Pause) করুন</span>
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4 text-white" />
                    <span>সার্ভিস পুনরায় চালু (Resume) করুন</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleAutoRenew}
                disabled={updatingAction}
                className={`px-4 py-2.5 rounded-[4px] font-semibold text-xs flex items-center gap-2 border transition-colors cursor-pointer ${
                  subData.autoRenew ? 'bg-white text-black border-white' : 'bg-transparent border-white/25 text-neutral-300 hover:bg-white/10'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${updatingAction ? 'animate-spin' : ''}`} />
                <span>অটো রিনিউয়াল: {subData.autoRenew ? 'চালু (ON)' : 'বন্ধ (OFF)'}</span>
              </button>
            </div>

            <button
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-neutral-200 text-black font-bold rounded-[4px] text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>অ্যাক্টিভেশন সার্টিফিকেট দেখুন</span>
            </button>
          </div>
        </div>
      )}

      {/* SELF-ACTIVATION FORM */}
      {(!subData || !subData.status || subData.status !== 'active') && (
        <div className="bg-[#0a0a0a] border border-white/15 rounded-md p-6 md:p-8 space-y-6">
          <div className="border-b border-white/15 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-white" />
              <span>১. কিট নম্বর টাইপ করুন বা বক্সের ছবি স্ক্যান করুন</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              স্টারলিংক কিট বক্সের গায়ে লেখা KIT12345678 নম্বর দিন বা কিট স্টিকারের ছবি আপলোড দিন।
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-950/60 border border-red-500/40 rounded-[4px] text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-[#111113] border border-white/30 rounded-[4px] text-white text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSelfActivateSubmit} className="space-y-6">
            {/* STEP 1: KIT NUMBER INPUT + OCR IMAGE UPLOAD */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <label className="text-xs font-semibold text-neutral-300 mb-1.5 block">
                    স্টারলিংক কিট নম্বর (Kit Number) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={kitNumberInput}
                      onChange={handleKitInputChange}
                      placeholder="e.g. KIT12345678 or 00000000-00000000"
                      required
                      className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-[4px] px-4 py-3.5 text-sm font-mono text-white outline-none uppercase tracking-wider"
                    />
                    {kitNumberInput && (
                      <button
                        type="button"
                        onClick={handleCopyKit}
                        className="absolute right-3 top-3.5 text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-sans cursor-pointer"
                      >
                        {copiedKit ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* OCR & Camera Scan Trigger Buttons */}
                <div className="flex flex-col justify-end">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="px-4 py-3.5 bg-white/10 hover:bg-white/15 border border-white/25 text-white rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <span>লাইভ ক্যামেরা স্ক্যান</span>
                    </button>

                    <label className="px-3.5 py-3.5 bg-transparent hover:bg-white/10 border border-white/25 rounded-[4px] text-xs font-semibold text-neutral-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors">
                      {isScanningOcr ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>স্ক্যান হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-neutral-300" />
                          <span>ছবি আপলোড</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleOcrImageUpload}
                        disabled={isScanningOcr}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const sample = 'KIT30048291';
                        setKitNumberInput(sample);
                        setOcrSuccess(true);
                        setTimeout(() => setOcrSuccess(false), 3000);
                      }}
                      className="px-3 py-3.5 bg-[#111113] border border-white/20 hover:border-white/40 text-neutral-300 hover:text-white rounded-[4px] text-xs font-mono font-semibold transition-colors cursor-pointer"
                      title="নমুনা কিট নম্বর টেস্ট করুন"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-white inline mr-1" />
                      <span>নমুনা কিট (KIT30048291)</span>
                    </button>
                  </div>
                </div>
              </div>

              {ocrSuccess && (
                <p className="text-xs text-white flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>আসল স্টারলিংক কিট নম্বর ({kitNumberInput}) সফলভাবে শনাক্ত করা হয়েছে!</span>
                </p>
              )}
            </div>

            {/* STEP 2: SELECT SUBSCRIPTION PLAN */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-neutral-300 block">
                ২. মান্থলি সাবস্ক্রিপশন প্যাকেজ সিলেক্ট করুন (Select Plan) *
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {STARLINK_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-[4px] border cursor-pointer transition-colors relative flex flex-col justify-between ${
                      selectedPlanId === plan.id
                        ? 'bg-[#16161a] border-white'
                        : 'bg-[#111113] border-white/15 hover:border-white/35'
                    }`}
                  >
                    {plan.popular && (
                      <span className="text-[10px] font-mono uppercase tracking-wider text-white font-bold block mb-1">
                        MOST POPULAR
                      </span>
                    )}

                    <div className="space-y-2">
                      <span className="text-xs font-bold text-white block">{plan.nameBn}</span>
                      <div className="text-lg font-bold font-mono tabular-nums text-white">
                        ৳{plan.price.toLocaleString()} <span className="text-[10px] text-neutral-400 font-sans">/মাস</span>
                      </div>
                      <span className="text-[11px] text-neutral-400 block">{plan.speed}</span>
                    </div>

                    <div className="pt-3 border-t border-white/15 mt-3 flex items-center justify-between text-[11px] text-neutral-300">
                      <span>{plan.dataLimit}</span>
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selectedPlanId === plan.id ? 'border-white bg-white text-black' : 'border-neutral-600'
                        }`}
                      >
                        {selectedPlanId === plan.id && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 3: CUSTOMER CONTACT DETAILS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">মোবাইল ফোন নম্বর *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    placeholder="01712345678"
                    required
                    className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-[4px] pl-10 pr-4 py-3 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">ইনস্টলেশন ঠিকানা *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="বাসা/অফিস নম্বর, রোড, এলাকা..."
                    required
                    className="w-full bg-[#111113] border border-white/20 focus:border-white rounded-[4px] pl-10 pr-4 py-3 text-xs text-white outline-none"
                  />
                </div>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isActivating}
              className="w-full py-4 rounded-[4px] bg-white hover:bg-neutral-200 text-black font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isActivating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>অ্যাক্টিভেশন প্রসেস হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>এখনই সাবস্ক্রিপশন সেলফ-অ্যাক্টিভ করুন (Self-Activate Now)</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* PLAN CHANGE MODAL */}
      {showPlanChangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-white/25 rounded-md p-6 md:p-8 space-y-6 text-white">
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-white" />
                <span>সাবস্ক্রিপশন প্ল্যান চেঞ্জ</span>
              </h3>
              <button
                onClick={() => setShowPlanChangeModal(false)}
                className="text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-neutral-300 block">নতুন প্ল্যান সিলেক্ট করুন:</label>
              {STARLINK_PLANS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-3.5 rounded-[4px] border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                    selectedPlanId === p.id
                      ? 'bg-[#16161a] border-white text-white font-bold'
                      : 'bg-[#111113] border-white/15 text-neutral-400 hover:text-white'
                  }`}
                >
                  <div>
                    <div>{language === 'bn' ? p.nameBn : p.nameEn}</div>
                    <span className="text-[10px] text-neutral-400 font-mono">{p.speed}</span>
                  </div>
                  <span className="font-mono text-white font-bold tabular-nums">৳{p.price.toLocaleString()}/মাস</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPlanChangeModal(false)}
                className="w-1/2 py-3 border border-white/25 hover:bg-white/10 rounded-[4px] text-xs font-semibold text-white cursor-pointer"
              >
                বাতিল করুন
              </button>
              <button
                onClick={handleChangePlanSubmit}
                disabled={updatingAction}
                className="w-1/2 py-3 bg-white hover:bg-neutral-200 text-black rounded-[4px] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {updatingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'প্ল্যান কনফার্ম করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVATION CERTIFICATE POPUP MODAL */}
      {showCertificateModal && subData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/25 rounded-md p-6 md:p-8 space-y-6 text-white relative">
            <button
              onClick={() => setShowCertificateModal(false)}
              className="absolute top-5 right-5 text-neutral-400 hover:text-white font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center space-y-2 border-b border-white/15 pb-5">
              <div className="w-14 h-14 rounded-[4px] bg-white/5 border border-white/20 text-white flex items-center justify-center mx-auto">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">স্টারলিংক সার্ভিস অ্যাক্টিভেশন সার্টিফিকেট</h3>
              <p className="text-xs text-neutral-400">DEVSPARK LINK Official Connectivity Certificate</p>
            </div>

            <div className="bg-[#111113] p-5 rounded-[4px] border border-white/15 space-y-3 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-neutral-400">গ্রাহক ইমেইল:</span>
                <span className="text-white font-bold">{user?.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-neutral-400">স্টারলিংক কিট নম্বর:</span>
                <span className="text-white font-bold">{subData.starlinkKitNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-neutral-400">অ্যাক্টিভেটেড প্যাকেজ:</span>
                <span className="text-white font-bold">{currentPlan.nameBn}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span className="text-neutral-400">অ্যাক্টিভেশন পদ্ধতি:</span>
                <span className="text-neutral-200 font-bold">গ্রাহক সেলফ-অ্যাক্টিভেশন (Self)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">সার্ভিস স্ট্যাটাস:</span>
                <span className="text-white font-bold">ACTIVE &amp; SYNCED</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="w-full py-3.5 bg-white hover:bg-neutral-200 text-black font-bold text-xs rounded-[4px] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>সার্টিফিকেট প্রিন্ট / সেভ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HARDWARE INSTALLATION & TROUBLESHOOTING GUIDE */}
      <div className="bg-[#0a0a0a] border border-white/15 rounded-md p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-white" />
          <span>স্টারলিংক সেটআপ ও নির্দেশিকা (Hardware Quick Setup Guide)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-neutral-300">
          <div className="p-4 bg-[#111113] rounded-[4px] border border-white/15 space-y-1">
            <span className="text-neutral-400 font-bold font-mono block">ধাপ ১</span>
            <p className="font-semibold text-white">খালি স্থানে ডিশ স্থাপন</p>
            <p className="text-[11px] text-neutral-400">আকাশে কোনো বাধা ছাড়াই স্টারলিংক ডিশ স্ট্যান্ডে বসান।</p>
          </div>

          <div className="p-4 bg-[#111113] rounded-[4px] border border-white/15 space-y-1">
            <span className="text-neutral-400 font-bold font-mono block">ধাপ ২</span>
            <p className="font-semibold text-white">পাওয়ার ও রাউটার প্লাগইন</p>
            <p className="text-[11px] text-neutral-400">পাওয়ার কর্ড সংযোগ দিন। রাউটারের LED লাইট জ্বলবে।</p>
          </div>

          <div className="p-4 bg-[#111113] rounded-[4px] border border-white/15 space-y-1">
            <span className="text-neutral-400 font-bold font-mono block">ধাপ ৩</span>
            <p className="font-semibold text-white">১০-১৫ মিনিট স্যাটেলাইট লক</p>
            <p className="text-[11px] text-neutral-400">স্বয়ংক্রিয়ভাবে স্যাটেলাইট সিগন্যাল লক হয়ে ওয়াইফাই চালু হবে।</p>
          </div>
        </div>
      </div>

      {/* Live Camera Scanner Modal */}
      <LiveCameraScannerModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onScanComplete={(scannedKit: string) => {
          setKitNumberInput(scannedKit);
          setOcrSuccess(true);
          setTimeout(() => setOcrSuccess(false), 4000);
        }}
      />
    </div>
  );
};

export default SubscriptionSelfActivation;
