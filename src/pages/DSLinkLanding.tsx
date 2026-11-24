import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Globe,
  HelpCircle,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  Radio,
  Router,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  Wifi,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { DOMAIN_SEO_CONFIGS } from '../lib/domainConfig';
import {
  GLOBAL_DELIVERY_COPY,
  formatBdt,
  formatBdtBn,
  isCodEligibleLocation,
  useCentralPricing,
} from '../lib/pricingConfig';

interface DSLinkLandingProps {
  onNavigateToPromos: () => void;
  onOpenSeoInspector: (tab?: 'seo' | 'gsc' | 'orders') => void;
}

interface StarlinkProduct {
  id: string;
  sku: string;
  nameEn: string;
  nameBn: string;
  priceBdt: number;
  tag: string;
  image: string;
  speedSpec: string;
  latencySpec: string;
  warrantySpec: string;
  descriptionEn: string;
  descriptionBn: string;
  inBox: string[];
}

const STARLINK_PRODUCTS: StarlinkProduct[] = [
  {
    id: 'starlink-standard-4x',
    sku: 'DSL-SL-STD4X',
    nameEn: 'Starlink Standard 4X Kit (Gen 3 Full Package)',
    nameBn: 'স্টারলিংক স্ট্যান্ডার্ড ৪এক্স কিট (জেন ৩ ফুল প্যাকেজ)',
    priceBdt: 41500,
    tag: '01 · MOST POPULAR IN BANGLADESH',
    image: '/assets/aistudio/image_1a66081b.png',
    speedSpec: '150–300+ Mbps',
    latencySpec: '20–30 ms LEO',
    warrantySpec: '24-Month Replacement',
    descriptionEn:
      'Electronic phased-array satellite dish with Gen 3 Wi-Fi 6 Tri-Band Router. Engineered for homes, offices, resorts, and regional branches across all 64 districts.',
    descriptionBn:
      'বাসাবাড়ি, কর্পোরেট অফিস ও রিসোর্টের জন্য অরিজিনাল স্টারলিংক স্ট্যান্ডার্ড ৪এক্স কিট। সাথে থাকছে জেন-৩ ওয়াই-ফাই ৬ রাউটার এবং ২৪ মাসের অফিশিয়াল রিপ্লেসমেন্ট ওয়ারেন্টি।',
    inBox: [
      'Starlink Standard Actuated/Phased-Array Dish',
      'Gen 3 Wi-Fi 6 Tri-Band Router (Dual Ethernet)',
      '15m Weatherproof Starlink Cable & AC Power Supply',
      'Kickstand Base Mount & Official Setup Guide',
    ],
  },
  {
    id: 'starlink-mini-kit',
    sku: 'DSL-SL-MINI',
    nameEn: 'Starlink Mini Portable Satellite Kit',
    nameBn: 'স্টারলিংক মিনি পোর্টেবল স্যাটেলাইট কিট',
    priceBdt: 21500,
    tag: '02 · PORTABLE & FIELD READY',
    image: '/assets/aistudio/image_a8056f6d.png',
    speedSpec: '100–180 Mbps',
    latencySpec: '25–35 ms LEO',
    warrantySpec: '24-Month Replacement',
    descriptionEn:
      'Ultra-compact backpack-sized satellite terminal with integrated Wi-Fi router and DC 12V-48V power input. Ideal for field engineers, journalists, river vessels, and travel.',
    descriptionBn:
      'সহজে বহনযোগ্য ব্যাকপ্যাক সাইজ স্টারলিংক মিনি কিট। ইনবিল্ট ওয়াই-ফাই রাউটার এবং ডিসি পাওয়ার ব্যাংক সাপোর্টসহ যেকোনো দুর্গম এলাকায় তাৎক্ষণিক ইন্টারনেট।',
    inBox: [
      'Starlink Mini Dish with Integrated Wi-Fi 5 Router',
      'Kickstand & Pipe Adapter Mount',
      '15m DC Power Cable & Power Supply',
      'Weatherproof RJ45 Plug',
    ],
  },
  {
    id: 'starlink-flat-hp',
    sku: 'DSL-SL-FHP',
    nameEn: 'Starlink Flat High Performance Enterprise Kit',
    nameBn: 'স্টারলিংক ফ্ল্যাট হাই-পারফরম্যান্স এন্টারপ্রাইজ কিট',
    priceBdt: 185000,
    tag: '03 · ENTERPRISE & TOWER BACKHAUL',
    image: '/assets/aistudio/image_29d1bc84.png',
    speedSpec: '250–350+ Mbps',
    latencySpec: '18–25 ms Priority',
    warrantySpec: '24-Month Enterprise SLA',
    descriptionEn:
      'Wide 140° field-of-view phased array with enhanced GPS and thermal resilience for commercial towers, marine vessels, factories, and multi-WAN enterprise failover.',
    descriptionBn:
      'শিল্প কারখানা, কর্পোরেট টাওয়ার, জাহাজ এবং মিশন-ক্রিটিকাল এন্টারপ্রাইজ নেটওয়ার্কের জন্য সর্বোচ্চ ক্ষমতাসম্পন্ন হাই-পারফরম্যান্স স্টারলিংক কিট।',
    inBox: [
      'Flat High Performance Terminal (IP56 Rated)',
      'Wedge Mount Kit & Enterprise Power Supply',
      '25m Heavy-Duty Shielded Ethernet & Routing Cable',
      'Priority NOC Provisioning Support',
    ],
  },
];

const MONTHLY_PLANS = [
  {
    code: 'PLAN-01',
    nameEn: 'Standard Residential Unlimited',
    nameBn: 'স্ট্যান্ডার্ড রেসিডেনশিয়াল আনলিমিটেড',
    priceBdt: '4,200',
    speed: '150–250 Mbps Download',
    usage: 'Unlimited High-Speed Data',
    idealForEn: 'Homes, regional offices, farmhouses & small businesses at a fixed location.',
    idealForBn: 'বাসাবাড়ি, আঞ্চলিক অফিস ও ফিক্সড লোকেশনে আনলিমিটেড হাই-স্পিড ইন্টারনেট।',
  },
  {
    code: 'PLAN-02',
    nameEn: 'Roam Regional (All 64 Districts)',
    nameBn: 'রোম রিজিওনাল (সারা বাংলাদেশ পোর্টেবল)',
    priceBdt: '6,000',
    speed: '100–220 Mbps Anywhere',
    usage: 'Portable Roam Coverage',
    idealForEn: 'Field engineering teams, media crews, river launches & multi-site travel across BD.',
    idealForBn: 'ভ্রমণ, ফিল্ড ওয়ার্ক, নদীপথ ও যেকোনো জেলায় মুভিং কানেক্টিভিটির জন্য উপযুক্ত।',
  },
  {
    code: 'PLAN-03',
    nameEn: 'Priority Enterprise / Corporate SLA',
    nameBn: 'প্রায়োরিটি এন্টারপ্রাইজ ও কর্পোরেট প্ল্যান',
    priceBdt: '12,500',
    speed: '220–350+ Mbps Priority',
    usage: 'Public IPv4 + Priority Queue',
    idealForEn: 'Banks, factories, garment units & enterprise SD-WAN failover links.',
    idealForBn: 'ব্যাংক, গার্মেন্টস ফ্যাক্টরি, আইএসপি ও কর্পোরেট ডেডিকেটেড পাবলিক আইপি সংযোগ।',
  },
];

const FAQS = [
  {
    qEn: 'How can I order a genuine Starlink Standard Kit 4X or Mini Kit from DSLink?',
    qBn: 'ডিএসলিংক (DSLink) থেকে Starlink Standard Kit 4X বা Mini Kit কীভাবে অর্ডার করব?',
    aEn: 'You can order directly on dslink.cyou via our Quick Order Modal, our /promos checkout page, or instantly via WhatsApp at +880 1326-370218. Starlink Standard Kit 4X (Purchase) is ৳41,500, Starlink Mini Kit (Purchase) is ৳21,500, and Starlink Rental Kit is ৳3,000 (One-Time Charge). Monthly Starlink subscription fees are separate.',
    aBn: 'আপনি সরাসরি dslink.cyou ওয়েবসাইট থেকে অথবা আমাদের অফিশিয়াল হোয়াটসঅ্যাপ নম্বর +880 1326-370218-এ মেসেজ দিয়ে অর্ডার করতে পারেন। Starlink Standard Kit 4X মূল্য ৳৪১,৫০০, Starlink Mini Kit মূল্য ৳২১,৫০০ এবং Starlink Rental Kit এককালীন চার্জ ৳৩,০০০ টাকা। মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
  },
  {
    qEn: 'Does DSLink offer Global Delivery and Cash on Delivery (COD)?',
    qBn: 'বিশ্বব্যাপী ডেলিভারি এবং Cash on Delivery (COD) সুবিধা কীভাবে পাওয়া যাবে?',
    aEn: 'Global Delivery Available — Worldwide Starlink Kit Shipping. International delivery availability does not guarantee Starlink activation or roaming support in every country (local regulations & Starlink policies apply). Cash on Delivery (COD) is available in eligible Bangladesh areas for outright hardware purchases.',
    aBn: 'বাংলাদেশসহ বিশ্বব্যাপী Starlink Kit ডেলিভারি সুবিধা রয়েছে। তবে বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই (স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য)। প্রযোজ্য এলাকায় (বাংলাদেশে স্থায়ী কিট ক্রয়ে) পণ্য হাতে পেয়ে চেক ও অ্যাক্টিভেশন যাচাই করে Cash on Delivery (COD) পেমেন্ট করার সুবিধা রয়েছে।',
  },
  {
    qEn: 'What are the terms for the Starlink Rental Kit (৳3,000 One-Time Charge)?',
    qBn: 'Starlink Rental Kit (৳৩,০০০ এককালীন চার্জ)-এর নিয়ম কী?',
    aEn: 'The Starlink Rental Kit is ৳3,000 (One-Time Charge) paid via Bangla QR (COD is not available for Rental Kits). Hardware ownership is not transferred to the customer, and monthly Starlink subscription fees are separate. Strict limits: max 5 TB/month, only at first registered location (Restricted if used outside), Residential & Lite plans only (no Roaming), and 1-time address change.',
    aBn: 'Starlink Rental Kit-এর এককালীন চার্জ মাত্র ৳৩,০০০ টাকা (Bangla QR-এ প্রদেয়; COD প্রযোজ্য নয়)। কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য। শর্ত: মাসে ৫ টিবি-এর বেশি ব্যবহার করা যাবে না, প্রথম নিবন্ধিত লোকেশনের বাইরে ব্যবহার করলে Restricted হবে, রোমিংসহ অন্য কোনো প্যাকেজ ব্যবহার করা যাবে না এবং অ্যাড্রেস ১ বার পরিবর্তন করা যাবে।',
  },
];

export const DSLinkLanding: React.FC<DSLinkLandingProps> = ({
  onNavigateToPromos,
  onOpenSeoInspector,
}) => {
  const config = DOMAIN_SEO_CONFIGS['dslink.cyou'];
  const { standard4xPrice, miniKitPrice, rentalKitPrice, getPrice } = useCentralPricing();
  const [lang, setLang] = useState<'en' | 'bn'>('bn');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  const liveProducts: StarlinkProduct[] = STARLINK_PRODUCTS.map((p) => ({
    ...p,
    priceBdt: getPrice(p.id, p.priceBdt),
  }));

  // Quick Order Modal State
  const [selectedProduct, setSelectedProduct] = useState<StarlinkProduct | null>(null);
  const [orderForm, setOrderForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    district: 'Dhaka',
    address: '',
    paymentMethod: 'cod' as 'cod' | 'bkash',
    senderBankName: '',
    trxId: '',
  });
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderConfirmation, setOrderConfirmation] = useState<{
    orderId: string;
    productName: string;
    price: number;
  } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const handleOpenQuickOrder = (product: StarlinkProduct) => {
    setSelectedProduct(product);
    setOrderConfirmation(null);
    setOrderError(null);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!orderForm.fullName.trim() || !orderForm.phone.trim() || !orderForm.address.trim()) {
      setOrderError('Please fill in your name, mobile number, and delivery address.');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);
    const orderId = `DSL-${Math.floor(100000 + Math.random() * 900000)}`;
    const liveUnitPrice = getPrice(selectedProduct.id, selectedProduct.priceBdt);
    const codAllowed = isCodEligibleLocation(orderForm.district, false);

    try {
      const res = await fetch('/api/promos/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          productId: selectedProduct.id,
          quantity: 1,
          fullName: orderForm.fullName.trim(),
          phone: orderForm.phone.trim(),
          email: orderForm.email.trim(),
          district: orderForm.district,
          address: orderForm.address.trim(),
          paymentMethod: codAllowed ? 'cod' : 'international_prepaid',
          senderBankName: orderForm.senderBankName,
          trxId: orderForm.trxId,
          productName: selectedProduct.nameEn,
          price: liveUnitPrice,
          domain: 'dslink.cyou',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const authoritativeTotal = Number(data?.pricing?.totalAmount ?? liveUnitPrice);
        setOrderConfirmation({
          orderId: data.orderId || orderId,
          productName: selectedProduct.nameEn,
          price: authoritativeTotal,
        });
      } else {
        setOrderError(data.error || 'Failed to submit order. Please try WhatsApp ordering.');
      }
    } catch (err: any) {
      setOrderError('Network error. Please use the WhatsApp order button for instant assistance.');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-white selection:text-black">
      {/* 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 h-16 bg-black/95 backdrop-blur-md border-b border-white/15">
        <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Identity */}
          <a
            href="https://dslink.cyou/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink min-w-0"
          >
            <img
              src="/devspark-header-logo.svg"
              alt="DEVSPARK LINK (DSLINK) Official Logo"
              width={308}
              height={74}
              className="w-[136px] min-[375px]:w-[154px] sm:w-[178px] md:w-[194px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
            />
          </a>

          {/* Zone 2: Center Primary Navigation (5 items) */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300"
            aria-label="Main Navigation"
          >
            <a href="#starlink-kits" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'bn' ? 'স্টারলিংক কিট' : 'Starlink Kits'}
            </a>
            <a href="/rental" className="text-white hover:text-neutral-200 transition-colors whitespace-nowrap font-semibold">
              {lang === 'bn' ? `রেন্টাল কিট (${formatBdtBn(rentalKitPrice)})` : `Rental Kit (${formatBdt(rentalKitPrice)})`}
            </a>
            <a href="#internet-plans" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'bn' ? 'মাসিক প্যাকেজ' : 'Monthly Plans'}
            </a>
            <a href="/rental-policy" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'bn' ? 'রেন্টাল পলিসি' : 'Rental Policy'}
            </a>
            <a href="#faq" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'bn' ? 'প্রশ্নোত্তর' : 'FAQ'}
            </a>
          </nav>

          {/* Zone 3: Language Switcher + Primary Order CTA */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
              className="px-3 py-1.5 text-xs font-mono text-neutral-200 hover:text-white border border-white/25 hover:border-white/50 rounded-[4px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {lang === 'bn' ? 'English' : 'বাংলা'}
            </button>
            <a
              href="https://wa.me/8801326370218?text=Hello%20DSLink%2C%20I%20want%20to%20order%20a%20Starlink%20Kit%20in%20Bangladesh."
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'হোয়াটসঅ্যাপে অর্ডার' : 'WhatsApp Order'}</span>
            </a>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-200 hover:text-white rounded-[4px] border border-white/20"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-b border-white/15 px-6 py-5 space-y-4">
            <div className="flex flex-col space-y-3 text-sm font-medium text-neutral-200">
              <a href="#starlink-kits" onClick={() => setMobileMenuOpen(false)}>
                Starlink Kits &amp; Pricing (স্টারলিংক কিট)
              </a>
              <a href="#internet-plans" onClick={() => setMobileMenuOpen(false)}>
                Monthly Internet Plans (মাসিক প্যাকেজ)
              </a>
              <a href="#installation" onClick={() => setMobileMenuOpen(false)}>
                64-District Installation (ইনস্টলেশন)
              </a>
              <a href="/rental" className="text-white font-semibold" onClick={() => setMobileMenuOpen(false)}>
                Starlink Rental Kit ({formatBdt(rentalKitPrice)} One-Time Charge)
              </a>
              <a href="/rental-policy" onClick={() => setMobileMenuOpen(false)}>
                Rental Policy &amp; Terms (/rental-policy)
              </a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)}>
                FAQ (সচরাচর জিজ্ঞাসা)
              </a>
            </div>
            <div className="pt-3 border-t border-white/15 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
                className="px-3 py-2 text-xs font-mono text-neutral-200 border border-white/25 rounded-[4px]"
              >
                {lang === 'bn' ? 'English' : 'বাংলা'}
              </button>
              <a
                href="https://wa.me/8801326370218"
                target="_blank"
                rel="noreferrer"
                className="flex-1 text-center py-2 text-xs font-bold text-black bg-white rounded-[4px]"
              >
                Order on WhatsApp
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/15 py-14 lg:py-22 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Primary Headline & Conversion CTAs */}
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  01 · DSLINK BANGLADESH · OFFICIAL STARLINK HARDWARE &amp; BROADBAND
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[50px] font-bold tracking-tight text-white leading-[1.08]">
                  {lang === 'bn' ? config.h1Bn : config.h1En}
                </h1>

                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-[62ch]">
                  {lang === 'bn'
                    ? `বাংলাদেশসহ বিশ্বব্যাপী Starlink Kit ডেলিভারি সুবিধা! Starlink Standard Kit 4X মাত্র ${formatBdtBn(standard4xPrice)}, Starlink Mini Kit মাত্র ${formatBdtBn(miniKitPrice)} এবং Starlink Rental Kit মাত্র ${formatBdtBn(rentalKitPrice)} (এককালীন চার্জ)। ${GLOBAL_DELIVERY_COPY.subscriptionSeparateBn} প্রযোজ্য এলাকায় Cash on Delivery (COD) সুবিধা রয়েছে।`
                    : `${GLOBAL_DELIVERY_COPY.headlineEn}. Starlink Standard Kit 4X (Purchase) ${formatBdt(standard4xPrice)}, Starlink Mini Kit (Purchase) ${formatBdt(miniKitPrice)}, and Starlink Rental Kit ${formatBdt(rentalKitPrice)} (One-Time Charge). ${GLOBAL_DELIVERY_COPY.subscriptionSeparateEn}`}
                </p>

                {/* Primary & Rental / Direct Checkout Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-3.5">
                  <button
                    type="button"
                    onClick={() => handleOpenQuickOrder(liveProducts[0])}
                    className="px-6 py-3.5 text-sm font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {lang === 'bn'
                        ? `স্টারলিংক ৪এক্স কিট অর্ডার করুন — ${formatBdtBn(standard4xPrice)}`
                        : `Order Starlink 4X Kit — ${formatBdt(standard4xPrice)}`}
                    </span>
                  </button>

                  <a
                    href="/rental"
                    className="px-5 py-3.5 text-sm font-semibold text-white border border-white/35 hover:bg-white/10 rounded-[4px] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>
                      {lang === 'bn'
                        ? `রেন্টাল কিট (${formatBdtBn(rentalKitPrice)} এককালীন)`
                        : `Rental Kit (${formatBdt(rentalKitPrice)} One-Time)`}
                    </span>
                  </a>

                  <button
                    type="button"
                    onClick={onNavigateToPromos}
                    className="px-4 py-3.5 text-xs font-mono font-semibold text-neutral-300 hover:text-white border border-white/20 bg-white/5 hover:bg-white/10 rounded-[4px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Direct Kit Checkout
                  </button>
                </div>

                {/* Hardware & Service Specs Strip */}
                <div className="pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                      300+ Mbps
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">LEO Download Speed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">25 ms</div>
                    <div className="text-xs text-neutral-400 mt-1">Ultra-Low Latency</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                      24 Months
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">Official Replacement Warranty</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">
                      64 Districts
                    </div>
                    <div className="text-xs text-neutral-400 mt-1">Express COD Delivery</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Featured Starlink Standard 4X Kit Showcase Card */}
              <div className="lg:col-span-5">
                <div className="bg-[#0a0a0a] border border-white/20 rounded-md overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/15 flex items-center justify-between bg-[#111113]">
                    <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-neutral-300">
                      FLAGSHIP HARDWARE · GEN 3 Wi-Fi 6
                    </span>
                    <span className="text-[11px] font-mono text-white font-semibold">IN STOCK</span>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="relative rounded-[4px] overflow-hidden bg-black border border-white/15 aspect-[16/10] flex items-center justify-center">
                      <img
                        src="/assets/aistudio/image_1a66081b.png"
                        alt="SpaceX Starlink Standard 4X Kit Gen 3 Bangladesh"
                        className="w-full h-full object-cover"
                        loading="eager"
                      />
                    </div>

                    <div className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-4">
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          Starlink Standard 4X Kit (Gen 3)
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Complete Dish + Wi-Fi 6 Router + 15m Cable
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-mono font-bold tabular-nums text-white">
                          {formatBdt(standard4xPrice)}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400">
                          Purchase · Global Delivery
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenQuickOrder(liveProducts[0])}
                        className="py-2.5 px-4 font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors text-center cursor-pointer"
                      >
                        Quick Order Now
                      </button>
                      <a
                        href="https://wa.me/8801326370218?text=I%20want%20to%20buy%20Starlink%20Standard%204X%20Kit%20from%20dslink.cyou"
                        target="_blank"
                        rel="noreferrer"
                        className="py-2.5 px-4 font-semibold text-white bg-transparent hover:bg-white/10 border border-white/30 rounded-[4px] transition-colors text-center"
                      >
                        Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Starlink Hardware Catalog Section */}
        <section id="starlink-kits" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  02 · AUTHENTIC SPACEX STARLINK HARDWARE CATALOG
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {lang === 'bn'
                    ? 'বাংলাদেশে স্টারলিংক কিট ও অফিশিয়াল মূল্য তালিকা'
                    : 'Starlink Satellite Kits & Official Pricing in Bangladesh'}
                </h2>
              </div>
              <div className="text-xs font-mono text-neutral-400">
                All prices in BDT (৳) · Includes 24-Month Official Warranty
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-7">
              {liveProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-md bg-[#0a0a0a] border border-white/15 hover:border-white/35 transition-colors flex flex-col justify-between overflow-hidden"
                >
                  <div>
                    <div className="px-5 py-3 border-b border-white/15 bg-[#111113] flex items-center justify-between text-[11px] font-mono">
                      <span className="text-white font-semibold">{product.tag}</span>
                      <span className="text-neutral-400">SKU: {product.sku}</span>
                    </div>

                    <div className="aspect-[16/10] bg-black border-b border-white/15 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.nameEn}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="p-6 space-y-4">
                      <h3 className="text-xl font-bold text-white leading-snug">
                        {lang === 'bn' ? product.nameBn : product.nameEn}
                      </h3>

                      <div className="flex items-baseline justify-between pt-1 border-b border-white/15 pb-4">
                        <div>
                          <div className="text-2xl font-mono font-bold tabular-nums text-white">
                            {formatBdt(product.priceBdt)} BDT
                          </div>
                          <div className="text-xs font-mono text-neutral-400 mt-0.5">
                            Monthly subscription separate
                          </div>
                        </div>
                        <div className="text-right text-xs font-mono text-neutral-300">
                          <div>{product.speedSpec}</div>
                          <div className="text-neutral-400">{product.latencySpec}</div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                        {lang === 'bn' ? product.descriptionBn : product.descriptionEn}
                      </p>

                      <div className="space-y-1.5 pt-2">
                        <div className="text-xs font-mono text-neutral-400 uppercase">
                          Included in the Box:
                        </div>
                        {product.inBox.map((item) => (
                          <div key={item} className="text-xs text-neutral-300 flex items-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => handleOpenQuickOrder(product)}
                      className="w-full py-3 px-4 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {lang === 'bn'
                          ? `অনলাইনে অর্ডার করুন (৳${product.priceBdt.toLocaleString()})`
                          : `Order Online Now (৳${product.priceBdt.toLocaleString()})`}
                      </span>
                    </button>

                    <a
                      href={`https://wa.me/8801326370218?text=${encodeURIComponent(
                        `Hello DSLink (dslink.cyou), I want to order ${product.nameEn} (Price: BDT ${product.priceBdt}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-2.5 px-4 text-xs font-semibold text-white hover:bg-white/10 border border-white/30 rounded-[4px] transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Order via WhatsApp (+880 1326-370218)</span>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Monthly Internet Packages Section */}
        <section id="internet-plans" className="py-20 border-b border-white/15 bg-[#050505]">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                03 · MONTHLY SATELLITE INTERNET PLANS IN BDT
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {lang === 'bn'
                  ? 'স্টারলিংক মাসিক ইন্টারনেট সাবস্ক্রিপশন প্যাকেজ (BDT বিলিং)'
                  : 'Flexible Monthly Starlink Subscription Plans with Local BDT Billing'}
              </h2>
              <p className="text-sm sm:text-base text-neutral-300">
                No international credit card needed. Pay your monthly Starlink subscription in Bangladeshi Taka via bKash, Nagad, or bank transfer through DSLink.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {MONTHLY_PLANS.map((plan) => (
                <div
                  key={plan.code}
                  className="p-7 rounded-md bg-[#0a0a0a] border border-white/15 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/15 pb-3">
                      <span className="text-white font-semibold">{plan.code}</span>
                      <span>NO CONTRACT</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {lang === 'bn' ? plan.nameBn : plan.nameEn}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-mono font-bold tabular-nums text-white">
                        ৳{plan.priceBdt}
                      </span>
                      <span className="text-xs font-mono text-neutral-400">/ month (BDT)</span>
                    </div>
                    <div className="space-y-1.5 text-xs font-mono text-neutral-300">
                      <div>Speed: {plan.speed}</div>
                      <div>Allocation: {plan.usage}</div>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                      {lang === 'bn' ? plan.idealForBn : plan.idealForEn}
                    </p>
                  </div>

                  <a
                    href={`https://wa.me/8801326370218?text=${encodeURIComponent(
                      `Hello DSLink, I want to activate the ${plan.nameEn} (BDT ${plan.priceBdt}/month) plan.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2.5 px-4 text-xs font-bold text-center text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors"
                  >
                    Activate Plan on WhatsApp
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 64-District Installation & Engineering Support */}
        <section id="installation" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                04 · NATIONWIDE DEPLOYMENT &amp; AFTER-SALES SERVICE
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                {lang === 'bn'
                  ? 'বাংলাদেশের ৬৪ জেলায় প্রফেশনাল ইনস্টলেশন ও নেটওয়ার্ক সাপোর্ট'
                  : 'Complete Turnkey Installation & Network Integration Across Bangladesh'}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 rounded-md bg-[#0a0a0a] border border-white/15 space-y-3">
                <Truck className="w-6 h-6 text-white" />
                <h3 className="text-base font-bold text-white">01. 64-District Express COD</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Same-day dispatch in Dhaka and 24–48 hour insured courier delivery to all 64 districts with Cash on Delivery inspection.
                </p>
              </div>
              <div className="p-6 rounded-md bg-[#0a0a0a] border border-white/15 space-y-3">
                <Wrench className="w-6 h-6 text-white" />
                <h3 className="text-base font-bold text-white">02. Rooftop Dish Alignment</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Obstruction-free sky mapping, galvanized pole mounting, lightning arrestor grounding, and concealed CAT6 cabling.
                </p>
              </div>
              <div className="p-6 rounded-md bg-[#0a0a0a] border border-white/15 space-y-3">
                <Router className="w-6 h-6 text-white" />
                <h3 className="text-base font-bold text-white">03. Multi-WAN &amp; Mesh Wi-Fi</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Seamless Starlink Ethernet bypass into enterprise routers for multi-WAN fiber + satellite automatic failover.
                </p>
              </div>
              <div className="p-6 rounded-md bg-[#0a0a0a] border border-white/15 space-y-3">
                <ShieldCheck className="w-6 h-6 text-white" />
                <h3 className="text-base font-bold text-white">04. 24-Month Replacement</h3>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Official 2-year hardware warranty backed by DSLink Bangladesh service center in Gulshan, Dhaka.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bilingual SEO Content Block */}
        <section className="py-20 border-b border-white/15 bg-[#050505]">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  05 · STARLINK BANGLADESH GUIDE (ENGLISH)
                </p>
                <h2 className="text-2xl font-bold text-white">
                  Why Order Starlink Hardware from DSLink (dslink.cyou)?
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  <strong className="text-white">DSLink (https://dslink.cyou/)</strong> is Bangladesh’s dedicated Starlink satellite internet hardware and broadband solutions portal. Whether you are connecting an industrial factory in Gazipur, a tea estate in Sylhet, a resort in Cox’s Bazar, or a corporate headquarters in Dhaka, Starlink delivers fiber-grade speeds from Low Earth Orbit (LEO) without relying on underground cables.
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Every Starlink Standard Kit 4X ({formatBdt(standard4xPrice)} BDT) and Starlink Mini Kit ({formatBdt(miniKitPrice)} BDT) includes genuine factory-sealed SpaceX hardware, Global Delivery options, and instant WhatsApp support at <strong className="text-white">+880 1326-370218</strong>. {GLOBAL_DELIVERY_COPY.disclaimerEn}
                </p>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  ০৫ · বাংলাদেশে ও বিশ্বব্যাপী স্টারলিংক (বাংলা)
                </p>
                <h2 className="text-2xl font-bold text-white">
                  ডিএসলিংক (dslink.cyou) — স্টারলিংক কিট প্রাইস ও গ্লোবাল ডেলিভারি
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {GLOBAL_DELIVERY_COPY.headlineBn} শহর থেকে শুরু করে দুর্গম চর, পাহাড়ি অঞ্চল কিংবা বিদেশে—<strong className="text-white">ডিএসলিংক (dslink.cyou)</strong> পৌঁছে দিচ্ছে অরিজিনাল স্টারলিংক স্যাটেলাইট কিট।
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  আমাদের কাছে পাচ্ছেন <strong className="text-white">Starlink Standard Kit 4X ({formatBdtBn(standard4xPrice)})</strong>, <strong className="text-white">Starlink Mini Kit ({formatBdtBn(miniKitPrice)})</strong> এবং <strong className="text-white">Starlink Rental Kit ({formatBdtBn(rentalKitPrice)} এককালীন চার্জ)</strong>। {GLOBAL_DELIVERY_COPY.rentalOwnershipNoteBn} {GLOBAL_DELIVERY_COPY.subscriptionSeparateBn} {GLOBAL_DELIVERY_COPY.disclaimerBn}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 space-y-10">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                06 · FREQUENTLY ASKED QUESTIONS
              </p>
              <h2 className="text-3xl font-bold text-white">
                Starlink Bangladesh Pricing, Ordering &amp; Warranty FAQ
              </h2>
            </div>

            <div className="space-y-4 max-w-4xl">
              {FAQS.map((faq, index) => {
                const isOpen = openFaqIdx === index;
                return (
                  <div
                    key={faq.qEn}
                    className="rounded-md bg-[#0a0a0a] border border-white/15 overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIdx(isOpen ? null : index)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
                    >
                      <span className="text-sm sm:text-base font-semibold text-white">
                        {lang === 'bn' ? faq.qBn : faq.qEn}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-white shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-white/10 space-y-2">
                        <p>{faq.aBn}</p>
                        <p className="text-neutral-400">{faq.aEn}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Quick Online Order Modal */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/25 rounded-md overflow-hidden my-8">
            <div className="px-6 py-4 border-b border-white/15 flex items-center justify-between bg-[#111113]">
              <div>
                <h3 className="text-base font-bold text-white">
                  Direct Order — {selectedProduct.nameEn}
                </h3>
                <p className="text-xs font-mono text-neutral-400">
                  dslink.cyou · 24-Month Official Replacement Warranty
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-[4px]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderConfirmation ? (
              <div className="p-6 space-y-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-white mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white">
                    অর্ডার সফলভাবে সম্পন্ন হয়েছে! (Order Confirmed)
                  </h4>
                  <p className="text-xs font-mono text-neutral-300">
                    Order ID: #{orderConfirmation.orderId}
                  </p>
                </div>
                <p className="text-sm text-neutral-300">
                  Thank you! Your order for <strong className="text-white">{orderConfirmation.productName}</strong> (৳
                  {orderConfirmation.price.toLocaleString()} BDT) has been registered and an invoice confirmation email has been dispatched.
                </p>
                <div className="flex flex-wrap justify-center gap-3 pt-2">
                  <a
                    href={`https://wa.me/8801326370218?text=${encodeURIComponent(
                      `Hello DSLink, my Order ID is #${orderConfirmation.orderId} for ${orderConfirmation.productName}. Please confirm dispatch.`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Confirm Dispatch on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-5 py-2.5 text-xs font-semibold text-white border border-white/25 hover:bg-white/10 rounded-[4px]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePlaceOrder} className="p-6 space-y-4 text-xs sm:text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">Full Name (নাম) *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.fullName}
                      onChange={(e) => setOrderForm({ ...orderForm, fullName: e.target.value })}
                      placeholder="আপনার নাম লিখুন"
                      className="w-full px-3 py-2 bg-[#111113] border border-white/20 focus:border-white rounded-[4px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      Mobile Number (মোবাইল) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      placeholder="01XXXXXXXXX"
                      className="w-full px-3 py-2 bg-[#111113] border border-white/20 focus:border-white rounded-[4px] text-white outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">
                      Email (ইমেইল ইনভয়েসের জন্য)
                    </label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 bg-[#111113] border border-white/20 focus:border-white rounded-[4px] text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-300 mb-1">District (জেলা) *</label>
                    <input
                      type="text"
                      required
                      value={orderForm.district}
                      onChange={(e) => setOrderForm({ ...orderForm, district: e.target.value })}
                      placeholder="Dhaka, Chattogram, Sylhet..."
                      className="w-full px-3 py-2 bg-[#111113] border border-white/20 focus:border-white rounded-[4px] text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Full Delivery Address (বিস্তারিত ঠিকানা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    placeholder="House, Road, Area, Thana"
                    className="w-full px-3 py-2 bg-[#111113] border border-white/20 focus:border-white rounded-[4px] text-white outline-none"
                  />
                </div>

                <div className="p-3.5 rounded-[4px] border border-white/20 bg-[#111113] text-white space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>
                      {isCodEligibleLocation(orderForm.district, false)
                        ? 'Cash on Delivery (COD — Eligible Area)'
                        : 'Global Delivery Coordination (No COD Outside Bangladesh)'}
                    </span>
                    <span className="font-mono tabular-nums text-white">
                      {formatBdt(getPrice(selectedProduct.id, selectedProduct.priceBdt))} BDT
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Kit Price: {formatBdt(getPrice(selectedProduct.id, selectedProduct.priceBdt))} · {GLOBAL_DELIVERY_COPY.subscriptionSeparateEn}
                  </p>
                </div>

                {orderError && (
                  <p className="text-xs text-red-300 bg-red-950/50 border border-red-800 p-2.5 rounded-[4px]">
                    {orderError}
                  </p>
                )}

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placingOrder}
                    className="px-6 py-2.5 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] disabled:opacity-50 cursor-pointer"
                  >
                    {placingOrder ? 'Submitting Order...' : 'Confirm Starlink Order'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black py-12 text-xs text-neutral-400">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/15">
            <div className="space-y-3">
              <img
                src="/devspark-header-logo.svg"
                alt="DEVSPARK LINK"
                width={308}
                height={74}
                className="w-[172px] sm:w-[192px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
              />
              <p className="text-neutral-400 leading-relaxed">
                Dedicated SpaceX Starlink kit distribution, local BDT subscription billing, and 64-district rooftop installation across Bangladesh.
              </p>
              <div className="font-mono text-[11px] text-neutral-300">
                Canonical: https://dslink.cyou/
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Starlink Products</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="#starlink-kits" className="hover:text-white">
                    Starlink Standard Kit 4X ({formatBdt(standard4xPrice)})
                  </a>
                </li>
                <li>
                  <a href="#starlink-kits" className="hover:text-white">
                    Starlink Mini Kit ({formatBdt(miniKitPrice)})
                  </a>
                </li>
                <li>
                  <a href="#starlink-kits" className="hover:text-white">
                    Starlink Flat High Performance
                  </a>
                </li>
                <li>
                  <a href="/rental" className="text-white hover:underline font-medium">
                    Starlink Rental Kit ({formatBdt(rentalKitPrice)} One-Time Charge)
                  </a>
                </li>
                <li>
                  <a href="/rental-policy" className="hover:text-white transition-colors">
                    Rental Terms &amp; Restriction Policy
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Policies &amp; SEO Verification</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="/red-policy-alert" className="hover:text-white transition-colors">
                    রেড পলিসি অ্যালার্ট (Red Policy Alert)
                  </a>
                </li>
                <li>
                  <a href="/price-syndicate-alert" className="hover:text-white transition-colors">
                    প্রাইস সিন্ডিকেট অ্যালার্ট (Rental Kit)
                  </a>
                </li>
                <li>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1 font-mono"
                  >
                    https://dslink.cyou/sitemap.xml <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1 font-mono"
                  >
                    https://dslink.cyou/robots.txt <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenSeoInspector('gsc')}
                    className="text-neutral-300 hover:text-white hover:underline text-left font-mono cursor-pointer"
                  >
                    Google Search Console Verification
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenSeoInspector('orders')}
                    className="text-neutral-300 hover:text-white hover:underline text-left font-mono cursor-pointer"
                  >
                    Live Orders &amp; Email Check
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">24/7 Ordering &amp; Support</div>
              <p className="text-neutral-300 font-mono">{config.phone}</p>
              <p className="text-neutral-400">{config.address}</p>
              <p className="text-neutral-400 pt-1">
                DEVSPARK LINK BY{' '}
                <a
                  href="https://devsparksoft.com.bd/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white hover:underline"
                >
                  DEV SPARK SOFT LIMITED
                </a>
                <span className="block text-[11px] font-mono text-neutral-500 mt-1">
                  DNCC/037306 · USA Alaska Entity #10237739
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
            <div>© {new Date().getFullYear()} DEVSPARK LINK (DSLINK) BY DEV SPARK SOFT LIMITED (dslink.cyou). All rights reserved.</div>
            <div className="text-neutral-500">
              Robots: index, follow · HTTP 200 · Canonical: https://dslink.cyou/
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
