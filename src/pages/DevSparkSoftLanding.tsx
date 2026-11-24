import React, { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Cloud,
  Code2,
  Cpu,
  ExternalLink,
  FileCode2,
  Globe,
  Layers,
  Lock,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Network,
  Phone,
  Server,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { DOMAIN_SEO_CONFIGS } from '../lib/domainConfig';

interface DevSparkSoftLandingProps {
  onOpenSeoInspector: (tab?: 'seo' | 'gsc' | 'orders') => void;
}

const CAPABILITIES = [
  {
    number: '01',
    titleEn: 'Enterprise Web, ERP & Custom Software Engineering',
    titleBn: 'এন্টারপ্রাইজ ওয়েব, ইআরপি ও কাস্টম সফটওয়্যার ডেভেলপমেন্ট',
    summaryEn:
      'Full-lifecycle architecture of mission-critical ERP platforms, supply chain portals, HR & payroll engines, and high-concurrency SaaS products built with TypeScript, React, Node.js, and PostgreSQL.',
    summaryBn:
      'বাংলাদেশের কর্পোরেট ও শিল্প প্রতিষ্ঠানের জন্য আধুনিক ইআরপি (ERP), সাপ্লাই চেইন পোর্টাল, এইচআর-পে-রোল এবং হাই-পারফরম্যান্স ওয়েব অ্যাপ্লিকেশন তৈরি ও রক্ষণাবেক্ষণ।',
    deliverables: [
      'Multi-tenant SaaS & Corporate Portals',
      'Role-Based Access Control & Audit Logging',
      'Automated Financial & Inventory Reporting',
    ],
    metrics: '99.98% SLA Uptime · Sub-45ms API Latency',
    icon: Code2,
  },
  {
    number: '02',
    titleEn: 'DEVSPARK LINK Satellite Hardware & Multi-WAN Failover',
    titleBn: 'ডেভস্পার্ক লিংক (DEVSPARK LINK) স্টারলিংক হার্ডওয়্যার ও এন্টারপ্রাইজ নেটওয়ার্ক',
    summaryEn:
      'Verified SpaceX Starlink Standard 4X and Mini hardware supply across 64 districts with Official Sales Invoice, 30-day restricted-kit refund commitment, and 24-month replacement support.',
    summaryBn:
      'বাংলাদেশের ৬৪টি জেলায় ভেরিফায়েড স্টারলিংক কিট সরবরাহ, অফিশিয়াল সেলস ইনভয়েস, ৩০ দিনের রিফান্ড অঙ্গীকার এবং ২৪ মাসের রিপ্লেসমেন্ট সাপোর্টসহ পূর্ণাঙ্গ কর্পোরেট নেটওয়ার্ক ইঞ্জিনিয়ারিং।',
    deliverables: [
      'Genuine Starlink Standard 4X & Mini Logistics',
      'Official Sales Invoice & Ownership Transparency',
      'Red Policy Alert Consumer Compliance Protection',
    ],
    metrics: '64 Districts Hardware & Support Coverage',
    icon: Network,
  },
  {
    number: '03',
    titleEn: 'FinTech & Digital Payment Gateways',
    titleBn: 'ফিনটেক ও ডিজিটাল পেমেন্ট গেটওয়ে ইন্টিগ্রেশন',
    titleShort: 'FinTech & Payment Systems',
    summaryEn:
      'Seamless enterprise integration with bKash, Nagad, SSLCommerz, City Bank, and automated real-time webhook ledger reconciliation.',
    summaryBn:
      'বিকাশ, নগদ, এসএসএলকমার্জ ও ব্যাংকিং পেমেন্ট গেটওয়ে ইন্টিগ্রেশন এবং রিয়েল-টাইম অটোমেটেড পেমেন্ট ভেরিফিকেশন সিস্টেম।',
    deliverables: [
      'Dynamic Enterprise Payment Invoicing',
      'Instant Webhook TrxID Verification',
      'Automated Settlement & VAT Ledger',
    ],
    metrics: '৳120Cr+ Annual Transaction Volume Processed',
    icon: ShieldCheck,
  },
  {
    number: '04',
    titleEn: 'Cloud DevOps, Cybersecurity & Telecom Infrastructure',
    titleBn: 'ক্লাউড ডেভঅপস, সাইবার সিকিউরিটি ও টেলিকম ইনফ্রাস্ট্রাকচার',
    summaryEn:
      'Zero-downtime Kubernetes/Docker cloud orchestration, automated offsite backups, DDoS mitigation, and hybrid fiber + LEO satellite SD-WAN failover engineering.',
    summaryBn:
      'ক্লাউড সার্ভার আর্কিটেকচার, ডকার/কুবারনেটিস অটোমেশন, সাইবার সিকিউরিটি অডিট এবং ফাইবার ও স্যাটেলাইট হাইব্রিড নেটওয়ার্ক ইঞ্জিনিয়ারিং সেবা।',
    deliverables: [
      'Multi-Region Cloud & Hybrid On-Prem Setup',
      'SD-WAN Fiber + Satellite Failover Routing',
      '24/7 NOC Monitoring & Incident Response',
    ],
    metrics: '64 Districts Enterprise Field Support',
    icon: Cloud,
  },
];

const CASE_STUDIES = [
  {
    code: 'CS-01',
    client: 'DEVSPARK LINK Nationwide Hardware Logistics',
    sector: 'Satellite Distribution & Buyer Safety',
    titleEn: 'Verified Starlink Supply Chain & Instant Order Engine',
    titleBn: 'ভেরিফায়েড স্টারলিংক সাপ্লাই চেইন ও অর্ডার প্ল্যাটফর্ম',
    impact: '99.4% customer satisfaction with zero restricted kits',
    metricValue: '3,000+',
    metricLabel: 'Verified Kits Delivered Across 64 Districts',
    stack: 'React 19 · TypeScript · FinTech PGW · Resend · Firestore',
  },
  {
    code: 'CS-02',
    client: 'Dhaka Industrial Logistics Group',
    sector: 'Enterprise ERP & Fleet Telemetry',
    titleEn: 'Real-Time Supply Chain, Warehouse & Cold-Chain ERP',
    titleBn: 'রিয়েল-টাইম সাপ্লাই চেইন এবং ওয়্যারহাউস ম্যানেজমেন্ট ইআরপি',
    impact: '3.4x faster dispatch & inventory reconciliation',
    metricValue: '42',
    metricLabel: 'Regional Depots Connected',
    stack: 'React 19 · TypeScript · Cloud SQL · IoT Telemetry',
  },
  {
    code: 'CS-03',
    client: 'DEVSPARK LINK Enterprise Telecom Division',
    sector: 'Satellite Broadband Distribution & E-Commerce',
    titleEn: 'High-Conversion Hardware Commerce & CAPI Attribution Engine',
    titleBn: 'স্যাটেলাইট হার্ডওয়্যার ই-কমার্স ও অর্ডার অটোমেশন ইঞ্জিন',
    impact: 'Sub-second checkout & 64-district logistics tracking',
    metricValue: '99.99%',
    metricLabel: 'Edge Availability Across BD',
    stack: 'React · Express · Firestore · Resend · Meta CAPI',
  },
];

const TECH_STACK_SPECS = [
  { category: 'Frontend & Web', items: 'React 19, TypeScript, Next.js, Tailwind CSS, Vite' },
  { category: 'Backend & APIs', items: 'Node.js, Express, Go, REST, GraphQL, WebSockets' },
  { category: 'Data & Storage', items: 'PostgreSQL, Cloud SQL, Firebase Firestore, Redis' },
  { category: 'Network & Satellite', items: 'SpaceX Starlink Gen 3, SD-WAN Multi-WAN, Mesh Failover' },
  { category: 'Payments & FinTech', items: 'bKash PGW, Nagad, SSLCommerz, Stripe, Bank API' },
  { category: 'Cloud & Security', items: 'Google Cloud, Vercel Edge, Docker, Cloudflare WAF' },
];

export const DevSparkSoftLanding: React.FC<DevSparkSoftLandingProps> = ({
  onOpenSeoInspector,
}) => {
  const config = DOMAIN_SEO_CONFIGS['devsparksoft.com.bd'];
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCapabilitiesTab, setActiveCapabilitiesTab] = useState<string>('all');

  // Consultation form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    phone: '',
    email: '',
    service: 'Enterprise Software / ERP',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleConsultationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setSubmitError('Please provide your name and phone number.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await fetch('/api/corporate-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          domain: 'devsparksoft.com.bd',
          submittedAt: new Date().toISOString(),
        }),
      });
      const result = await response.json();
      if (result.success) {
        setSubmitSuccess(
          `Inquiry #${result.inquiryId} received. Our engineering team at Dev Spark Soft Limited will contact you within 2 business hours.`
        );
        setFormData({
          name: '',
          company: '',
          phone: '',
          email: '',
          service: 'Enterprise Software / ERP',
          message: '',
        });
      } else {
        setSubmitError(result.error || 'Could not submit inquiry. Please contact us via WhatsApp.');
      }
    } catch (err: any) {
      setSubmitError('Network error. Please reach us directly at +880 1326-370218.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-neutral-100 font-sans selection:bg-white selection:text-black">
      {/* 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-black/95 backdrop-blur-md border-b border-white/15">
        <div className="max-w-[1280px] mx-auto h-full px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Identity */}
          <a
            href="https://devsparksoft.com.bd/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 whitespace-nowrap shrink-0 group"
          >
            <div className="w-9 h-9 rounded-[4px] bg-white/5 border border-white/25 flex items-center justify-center text-white font-mono font-bold text-sm group-hover:border-white transition-colors">
              DS
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block leading-none">
                Dev Spark Soft
              </span>
              <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                devsparksoft.com.bd
              </span>
            </div>
          </a>

          {/* Zone 2: Center Navigation (Max 5 items) */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-300"
            aria-label="Primary Navigation"
          >
            <a href="#services" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Services' : 'সেবাসমূহ'}
            </a>
            <a href="#architecture" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Starlink & Cloud' : 'স্টারলিংক ও ক্লাউড'}
            </a>
            <a href="#case-studies" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Case Studies' : 'প্রজেক্টসমূহ'}
            </a>
            <a href="/red-policy-alert" className="text-red-400 hover:text-red-300 transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Red Policy Alert' : 'রেড পলিসি অ্যালার্ট'}
            </a>
            <a href="#contact" className="hover:text-white transition-colors whitespace-nowrap">
              {lang === 'en' ? 'Contact' : 'যোগাযোগ'}
            </a>
          </nav>

          {/* Zone 3: Language Switcher + 1 Primary Action */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="px-3 py-1.5 text-xs font-mono text-neutral-200 hover:text-white border border-white/25 hover:border-white/50 rounded-[4px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              aria-label="Toggle Bengali or English language"
            >
              {lang === 'en' ? 'বাংলা সংস্করণ' : 'English View'}
            </button>
            <a
              href="#contact"
              className="px-4 py-2 text-xs font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <span>{lang === 'en' ? 'Schedule Consultation' : 'পরামর্শ নিন'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
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

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0a0a0a] border-b border-white/15 px-6 py-5 space-y-4">
            <div className="flex flex-col space-y-3 text-sm font-medium text-neutral-200">
              <a href="#services" onClick={() => setMobileMenuOpen(false)}>
                Services (সেবাসমূহ)
              </a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>
                Starlink &amp; Cloud Infrastructure
              </a>
              <a href="#case-studies" onClick={() => setMobileMenuOpen(false)}>
                Case Studies (প্রজেক্টসমূহ)
              </a>
              <a href="/red-policy-alert" className="text-red-400 font-semibold" onClick={() => setMobileMenuOpen(false)}>
                RED POLICY ALERT (Starlink সতর্কতা)
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
                Contact Us (যোগাযোগ)
              </a>
            </div>
            <div className="pt-3 border-t border-white/15 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="px-3 py-2 text-xs font-mono text-neutral-200 border border-white/25 rounded-[4px]"
              >
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 text-xs font-bold text-black bg-white rounded-[4px]"
              >
                Schedule Consultation
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/15 py-16 lg:py-24 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Primary Value Proposition & H1 */}
              <div className="lg:col-span-7 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  01 · DEV SPARK SOFT LIMITED · CORPORATE SOFTWARE &amp; TELECOM ENGINEERING
                </p>

                <h1 className="text-4xl sm:text-5xl lg:text-[52px] font-bold tracking-tight text-white leading-[1.08]">
                  {lang === 'en' ? config.h1En : config.h1Bn}
                </h1>

                <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-[62ch]">
                  {lang === 'en'
                    ? 'DEV SPARK SOFT LIMITED (devsparksoft.com.bd · Trade License DNCC/037306 · USA Alaska Entity #10237739) operates DEVSPARK LINK & DSLINK, engineering resilient enterprise software, verified Starlink satellite kits & rental programs, FinTech payment gateways, and hybrid cloud infrastructure.'
                    : 'ডেভ স্পার্ক সফট লিমিটেড (devsparksoft.com.bd · ট্রেড লাইসেন্স DNCC/037306 · USA Alaska Entity #10237739) ডেভস্পার্ক লিংক (DEVSPARK LINK) ও DSLINK-এর মাধ্যমে এন্টারপ্রাইজ সফটওয়্যার, ভেরিফায়েড স্টারলিংক স্যাটেলাইট কিট ও রেন্টাল সার্ভিস, ফিনটেক পেমেন্ট সিস্টেম এবং ক্লাউড ইনফ্রাস্ট্রাকচার পরিচালনা করে।'}
                </p>

                {/* Primary & Secondary CTAs */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <a
                    href="#contact"
                    className="px-6 py-3.5 text-sm font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <span>
                      {lang === 'en'
                        ? 'Request Enterprise Architecture Review'
                        : 'প্রজেক্ট কনসালটেশন বুক করুন'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href="https://wa.me/8801326370218?text=Hello%20Dev%20Spark%20Soft%20Limited%2C%20I%20would%20like%20to%20discuss%20a%20software%20or%20Starlink%20project."
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 border border-white/30 rounded-[4px] transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                  >
                    <MessageSquare className="w-4 h-4 text-white" />
                    <span>WhatsApp Engineering Desk</span>
                  </a>
                </div>

                {/* Key Quantified Corporate Metrics */}
                <div className="pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6">
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">99.98%</div>
                    <div className="text-xs text-neutral-400 mt-1">Production SLA Uptime</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">3,000+</div>
                    <div className="text-xs text-neutral-400 mt-1">Starlink Kits Deployed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">64</div>
                    <div className="text-xs text-neutral-400 mt-1">Districts Covered in BD</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold font-mono tabular-nums text-white">24/7</div>
                    <div className="text-xs text-neutral-400 mt-1">Dhaka NOC &amp; DevOps</div>
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Systems Architecture & Telemetry Panel */}
              <div className="lg:col-span-5">
                <div className="bg-[#0a0a0a] border border-white/20 rounded-md overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-white/15 flex items-center justify-between bg-[#111113]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-white" />
                      <span className="text-xs font-mono font-semibold text-white">
                        DEVSPARK-CORE-STACK · DHAKA-DC1
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-300">OPERATIONAL</span>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-[4px] bg-[#111113] border border-white/15">
                        <div className="text-[11px] font-mono text-neutral-400">CLOUD &amp; API LATENCY</div>
                        <div className="text-lg font-mono font-bold tabular-nums text-white mt-1">
                          18.4 ms
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          BDIX &amp; Singapore Edge
                        </div>
                      </div>
                      <div className="p-3.5 rounded-[4px] bg-[#111113] border border-white/15">
                        <div className="text-[11px] font-mono text-neutral-400">REGISTRATION</div>
                        <div className="text-lg font-mono font-bold tabular-nums text-white mt-1">
                          DNCC/037306
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          Alaska Entity #10237739
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="p-3 rounded-[4px] bg-[#111113] border border-white/10 flex items-center justify-between">
                        <span className="text-neutral-200">01. Enterprise ERP &amp; SaaS Core</span>
                        <span className="text-neutral-400">TypeScript · Node · SQL</span>
                      </div>
                      <div className="p-3 rounded-[4px] bg-[#111113] border border-white/10 flex items-center justify-between">
                        <span className="text-neutral-200">02. DEVSPARK LINK Starlink Hardware</span>
                        <span className="text-neutral-400">Standard 4X · Mini · 64 Dist.</span>
                      </div>
                      <div className="p-3 rounded-[4px] bg-[#111113] border border-white/10 flex items-center justify-between">
                        <span className="text-neutral-200">03. FinTech &amp; Payment Gateway</span>
                        <span className="text-neutral-400">ISO-20022 · Instant Webhook</span>
                      </div>
                      <div className="p-3 rounded-[4px] bg-[#111113] border border-white/10 flex items-center justify-between">
                        <span className="text-neutral-200">04. Satellite Division Portal</span>
                        <a
                          href="https://dslink.cyou/"
                          target="_blank"
                          rel="noreferrer"
                          className="text-white hover:underline flex items-center gap-1"
                        >
                          DEVSPARK LINK <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-neutral-400">
                      <span>Canonical Domain: https://devsparksoft.com.bd/</span>
                      <button
                        type="button"
                        onClick={() => onOpenSeoInspector('seo')}
                        className="text-white hover:underline font-mono cursor-pointer"
                      >
                        Inspect SEO
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Engineering Capabilities Section */}
        <section id="services" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  02 · CORE SOFTWARE &amp; INFRASTRUCTURE CAPABILITIES
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {lang === 'en'
                    ? 'Engineered for High-Concurrency Bangladeshi Enterprises'
                    : 'বাংলাদেশের আধুনিক ব্যবসা ও টেলিকম খাতের জন্য পূর্ণাঙ্গ প্রযুক্তি সমাধান'}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All Capabilities' },
                  { id: '01', label: '01. ERP & Web' },
                  { id: '02', label: '02. DEVSPARK LINK' },
                  { id: '03', label: '03. FinTech PGW' },
                  { id: '04', label: '04. Cloud & NOC' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCapabilitiesTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-[4px] border transition-colors cursor-pointer ${
                      activeCapabilitiesTab === tab.id
                        ? 'bg-white border-white text-black font-bold'
                        : 'bg-[#0a0a0a] border-white/20 text-neutral-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {CAPABILITIES.filter(
                (item) => activeCapabilitiesTab === 'all' || item.number === activeCapabilitiesTab
              ).map((cap) => {
                const IconComponent = cap.icon;
                return (
                  <article
                    key={cap.number}
                    className="p-7 rounded-md bg-[#0a0a0a] border border-white/15 hover:border-white/30 transition-colors flex flex-col justify-between space-y-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-white/15 pb-4">
                        <span className="text-xs font-mono font-bold text-neutral-300 tracking-wider">
                          {cap.number} · CAPABILITY
                        </span>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>

                      <h3 className="text-xl font-bold text-white leading-snug">
                        {lang === 'en' ? cap.titleEn : cap.titleBn}
                      </h3>

                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {lang === 'en' ? cap.summaryEn : cap.summaryBn}
                      </p>

                      <ul className="space-y-2 pt-2">
                        {cap.deliverables.map((deliv) => (
                          <li
                            key={deliv}
                            className="text-xs text-neutral-300 flex items-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>{deliv}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-white/15 flex items-center justify-between text-xs font-mono">
                      <span className="text-neutral-300">{cap.metrics}</span>
                      <a
                        href="#contact"
                        className="text-white hover:underline flex items-center gap-1"
                      >
                        Request Spec <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Architecture & Technology Matrix Section */}
        <section id="architecture" className="py-20 border-b border-white/15 bg-[#050505]">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="max-w-3xl space-y-3">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                03 · PRODUCTION STACK &amp; TELECOM STANDARDS
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Built on Audited Open Standards, BDIX Peering &amp; Cloud-Native Security
              </h2>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                Every system delivered by Dev Spark Soft Limited is engineered with strict schema validation, automated backups, role-based access control, and high-throughput local peering across Bangladesh.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TECH_STACK_SPECS.map((spec, idx) => (
                <div
                  key={spec.category}
                  className="p-6 rounded-md bg-[#0a0a0a] border border-white/15 space-y-2"
                >
                  <div className="text-xs font-mono text-neutral-400">
                    0{idx + 1} · {spec.category.toUpperCase()}
                  </div>
                  <div className="text-base font-semibold text-white">{spec.category}</div>
                  <p className="text-xs text-neutral-300 font-mono leading-relaxed">{spec.items}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quantified Case Studies */}
        <section id="case-studies" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6 space-y-12">
            <div className="space-y-3 max-w-2xl">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                04 · DEPLOYED PRODUCTION CASE STUDIES
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Proven Engineering Outcomes Across Bangladesh
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {CASE_STUDIES.map((cs) => (
                <article
                  key={cs.code}
                  className="p-7 rounded-md bg-[#0a0a0a] border border-white/15 flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/15 pb-3">
                      <span className="text-white">{cs.code}</span>
                      <span>{cs.sector}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {lang === 'en' ? cs.titleEn : cs.titleBn}
                    </h3>
                    <p className="text-xs text-neutral-400">Client: {cs.client}</p>
                    <div className="p-4 rounded-[4px] bg-[#111113] border border-white/10">
                      <div className="text-2xl font-mono font-bold tabular-nums text-white">
                        {cs.metricValue}
                      </div>
                      <div className="text-xs text-neutral-300 mt-0.5">{cs.metricLabel}</div>
                      <div className="text-[11px] text-neutral-400 mt-2">{cs.impact}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/15 text-[11px] font-mono text-neutral-400">
                    Stack: {cs.stack}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bilingual Corporate Profile & SEO Authority Section */}
        <section id="bilingual-seo" className="py-20 border-b border-white/15 bg-[#050505]">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  05 · CORPORATE PROFILE (ENGLISH)
                </p>
                <h2 className="text-2xl font-bold text-white">
                  About Dev Spark Soft Limited (devsparksoft.com.bd)
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Headquartered in Gulshan-1, Dhaka, <strong className="text-white">Dev Spark Soft Limited</strong> is an independent Bangladeshi software development and telecommunications engineering company. Our official corporate domain is{' '}
                  <a href="https://devsparksoft.com.bd/" className="text-white underline">
                    https://devsparksoft.com.bd/
                  </a>
                  .
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  We partner with commercial enterprises, financial institutions, and logistics operators to modernize workflows through custom full-stack web applications, DEVSPARK LINK satellite connectivity, digital payment systems, and resilient cloud architecture. Registered under Trade License DNCC/037306 &amp; USA Alaska Entity #10237739.
                </p>
              </div>

              <div className="lg:col-span-6 space-y-4">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  ০৫ · প্রাতিষ্ঠানিক পরিচিতি (বাংলা)
                </p>
                <h2 className="text-2xl font-bold text-white">
                  ডেভ স্পার্ক সফট লিমিটেড — সফটওয়্যার ও স্টারলিংক ইনফ্রাস্ট্রাকচার সলিউশন
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  <strong className="text-white">ডেভ স্পার্ক সফট লিমিটেড (DEV SPARK SOFT LIMITED)</strong> বাংলাদেশের একটি শীর্ষস্থানীয় সফটওয়্যার ডেভেলপমেন্ট, ক্লাউড ইনফ্রাস্ট্রাকচার এবং ডেভস্পার্ক লিংক (DEVSPARK LINK) স্যাটেলাইট হার্ডওয়্যার প্রতিষ্ঠান। আমাদের অফিশিয়াল কর্পোরেট ওয়েবসাইট{' '}
                  <a href="https://devsparksoft.com.bd/" className="text-white underline">
                    devsparksoft.com.bd
                  </a>
                  । বাংলাদেশ ট্রেড লাইসেন্স: <strong className="text-white">DNCC/037306</strong> এবং USA রেজিস্ট্রেশন: <strong className="text-white">Alaska Entity #10237739</strong>।
                </p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  আমরা কাস্টম ওয়েব অ্যাপ্লিকেশন, ইআরপি (ERP) সফটওয়্যার, ভেরিফায়েড স্টারলিংক কিট ও কর্পোরেট সাপোর্ট, ডিজিটাল ও মোবাইল ব্যাংকিং পেমেন্ট ইন্টিগ্রেশন এবং ক্লাউড সার্ভার সিকিউরিটি সেবা প্রদান করি। আমাদের দক্ষ ইঞ্জিনিয়ারিং টিম বাংলাদেশের ৬৪টি জেলায় নিরবচ্ছিন্ন কারিগরি সহায়তা দিয়ে আসছে।
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact & Enterprise Inquiry Section */}
        <section id="contact" className="py-20 border-b border-white/15 bg-black">
          <div className="max-w-[1280px] mx-auto px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Contact Information */}
              <div className="lg:col-span-5 space-y-6">
                <p className="text-xs font-mono uppercase tracking-[0.2em] text-neutral-400">
                  06 · ENTERPRISE CONSULTATION &amp; HEADQUARTERS
                </p>
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  Start Your Software or Starlink Deployment Project
                </h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Speak directly with our solutions architects in Dhaka for ERP development, DEVSPARK LINK satellite deployments, or enterprise cloud engineering.
                </p>

                <div className="space-y-4 pt-2 text-sm">
                  <div className="flex items-start gap-3.5">
                    <MapPin className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Corporate Headquarters</div>
                      <div className="text-neutral-300 text-xs mt-0.5">{config.address}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <Phone className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Direct Engineering &amp; Sales Line</div>
                      <a
                        href="tel:+8801326370218"
                        className="text-neutral-300 hover:text-white font-mono text-xs mt-0.5 block"
                      >
                        {config.phone} (WhatsApp &amp; Voice)
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <Mail className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-white">Corporate Email</div>
                      <a
                        href="mailto:info@devsparksoft.com.bd"
                        className="text-neutral-300 hover:text-white font-mono text-xs mt-0.5 block"
                      >
                        info@devsparksoft.com.bd · sales@devsparksoft.com.bd
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Inquiry Form */}
              <div className="lg:col-span-7">
                <form
                  onSubmit={handleConsultationSubmit}
                  className="p-8 rounded-md bg-[#0a0a0a] border border-white/15 space-y-5"
                >
                  <h3 className="text-lg font-bold text-white">
                    Request Technical Proposal / Consultation
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Full Name (আপনার নাম) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Engr. Tariqul Islam"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Organization / ISP Name
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Company or ISP Name"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Phone / WhatsApp Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@company.com.bd"
                        className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Primary Solution Area
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                    >
                      <option value="Enterprise Software / ERP">
                        01. Enterprise Web / ERP Software Development
                      </option>
                      <option value="DEVSPARK LINK Satellite Deployment">
                        02. DEVSPARK LINK Satellite Hardware &amp; SD-WAN
                      </option>
                      <option value="FinTech & Digital Payment Gateway">
                        03. FinTech &amp; MFS Payment Gateway
                      </option>
                      <option value="Cloud Infrastructure & Telecom">
                        04. Cloud DevOps &amp; Enterprise Network Engineering
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Project Scope / Technical Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your target architecture, timeline, or subscriber scale..."
                      className="w-full px-3.5 py-2.5 text-sm bg-[#111113] border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                    />
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-[4px] bg-red-950/50 border border-red-800 text-xs text-red-300">
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-3 rounded-[4px] bg-[#111113] border border-white/30 text-xs text-white">
                      {submitSuccess}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-3 text-sm font-bold text-black bg-white hover:bg-neutral-200 rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {submitting ? 'Submitting Proposal Request...' : 'Submit Engineering Inquiry'}
                    </button>

                    <span className="text-xs font-mono text-neutral-400">
                      Response SLA: &lt; 2 Business Hours
                    </span>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Footer */}
      <footer className="bg-black py-12 text-xs text-neutral-400">
        <div className="max-w-[1280px] mx-auto px-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-white/15">
            <div className="space-y-2.5">
              <div className="text-base font-bold text-white">DEV SPARK SOFT LIMITED</div>
              <p className="text-neutral-400 leading-relaxed">
                Enterprise software engineering, DEVSPARK LINK satellite hardware, FinTech integration, and cloud infrastructure in Bangladesh.
              </p>
              <div className="font-mono text-[11px] text-neutral-300">
                Trade License: DNCC/037306 · USA Alaska Entity #10237739
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">Solutions &amp; Policies</div>
              <ul className="space-y-1.5">
                <li>
                  <a href="#services" className="hover:text-white">
                    Enterprise ERP &amp; Web Apps
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-white">
                    DEVSPARK LINK Satellite Systems
                  </a>
                </li>
                <li>
                  <a href="/rental" className="hover:text-white transition-colors">
                    Starlink Rental Kit (৳3,000 One-Time Charge)
                  </a>
                </li>
                <li>
                  <a href="/rental-policy" className="hover:text-white transition-colors">
                    Rental Terms &amp; Restriction Policy
                  </a>
                </li>
                <li>
                  <a href="/red-policy-alert" className="hover:text-white transition-colors">
                    Red Policy Alert (Buyer Safety)
                  </a>
                </li>
                <li>
                  <a href="/price-syndicate-alert" className="hover:text-white transition-colors">
                    Price Syndicate Alert (Rental Kit)
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">SEO &amp; Indexing Verification</div>
              <ul className="space-y-1.5 font-mono">
                <li>
                  <a
                    href="/sitemap.xml"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1"
                  >
                    /sitemap.xml <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="/robots.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-white flex items-center gap-1"
                  >
                    /robots.txt <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenSeoInspector('gsc')}
                    className="text-neutral-300 hover:text-white hover:underline text-left cursor-pointer"
                  >
                    Google Search Console Setup
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenSeoInspector('orders')}
                    className="text-neutral-300 hover:text-white hover:underline text-left cursor-pointer"
                  >
                    Check Live Orders &amp; Email Status
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="font-semibold text-white">DEVSPARK LINK Portal</div>
              <p className="text-neutral-400 leading-relaxed">
                Looking for verified SpaceX Starlink hardware kits and satellite broadband plans in Bangladesh?
              </p>
              <a
                href="https://dslink.cyou/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-white hover:underline font-medium pt-1"
              >
                Visit DEVSPARK LINK (dslink.cyou) <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
            <div>
              © {new Date().getFullYear()} DEVSPARK LINK BY DEV SPARK SOFT LIMITED (devsparksoft.com.bd). All rights reserved.
            </div>
            <div className="text-neutral-500">
              Robots: index, follow · HTTP 200 · Independent Canonical
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
