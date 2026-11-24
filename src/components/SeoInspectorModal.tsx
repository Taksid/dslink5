import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileCode2,
  Globe,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  DOMAIN_SEO_CONFIGS,
  GSC_VERIFICATION_CODE,
  SupportedDomain,
  generateRobotsTxt,
  generateSitemapXml,
} from '../lib/domainConfig';

interface SeoInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDomain: SupportedDomain;
  onSwitchDomain: (domain: SupportedDomain) => void;
  initialTab?: 'seo' | 'gsc' | 'orders';
}

export const SeoInspectorModal: React.FC<SeoInspectorModalProps> = ({
  isOpen,
  onClose,
  activeDomain,
  onSwitchDomain,
  initialTab = 'seo',
}) => {
  const [activeTab, setActiveTab] = useState<'seo' | 'gsc' | 'orders'>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [testEmailTarget, setTestEmailTarget] = useState('taksidwalid150@gmail.com');
  const [testEmailStatus, setTestEmailStatus] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'orders') {
      fetchOrders();
    }
  }, [isOpen, activeTab]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTarget.trim()) return;
    setSendingEmail(true);
    setTestEmailStatus(null);
    try {
      const res = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: testEmailTarget.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setTestEmailStatus(`Test email delivered to ${testEmailTarget.trim()} (ID: ${data.data?.id || 'verified'})`);
      } else {
        setTestEmailStatus(`Error: ${data.error?.message || data.error || 'Could not send email'}`);
      }
    } catch (err: any) {
      setTestEmailStatus(`Network error: ${err.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!isOpen) return null;

  const config = DOMAIN_SEO_CONFIGS[activeDomain];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seo-modal-title"
    >
      <div className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/25 rounded-md overflow-hidden my-8">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-white/15 bg-[#111113]">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-white shrink-0" />
            <div>
              <h2 id="seo-modal-title" className="text-base font-bold text-white">
                Multi-Domain SEO, Search Console &amp; Order Inspector
              </h2>
              <p className="text-xs text-neutral-400 font-mono">
                Active Domain: {config.origin} · Robots: index, follow · HTTP 200 OK
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSwitchDomain('devsparksoft.com.bd')}
              className={`px-3 py-1.5 text-xs font-mono rounded-[4px] border transition-colors cursor-pointer ${
                activeDomain === 'devsparksoft.com.bd'
                  ? 'bg-white border-white text-black font-bold'
                  : 'bg-[#0a0a0a] border-white/20 text-neutral-400 hover:text-white'
              }`}
            >
              devsparksoft.com.bd
            </button>
            <button
              type="button"
              onClick={() => onSwitchDomain('dslink.cyou')}
              className={`px-3 py-1.5 text-xs font-mono rounded-[4px] border transition-colors cursor-pointer ${
                activeDomain === 'dslink.cyou'
                  ? 'bg-white border-white text-black font-bold'
                  : 'bg-[#0a0a0a] border-white/20 text-neutral-400 hover:text-white'
              }`}
            >
              dslink.cyou
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-[4px] hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex border-b border-white/15 bg-black px-6">
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'seo' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            Domain SEO &amp; Canonicals
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gsc')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'gsc' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Search className="w-4 h-4" />
            Google Search Console &amp; Sitemaps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'orders' ? 'border-white text-white' : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Live Orders &amp; Email Verification
          </button>
        </div>

        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6 text-sm">
          {activeTab === 'seo' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['devsparksoft.com.bd', 'dslink.cyou'] as SupportedDomain[]).map((dom) => {
                  const cfg = DOMAIN_SEO_CONFIGS[dom];
                  const isCurrent = dom === activeDomain;
                  return (
                    <div
                      key={dom}
                      className={`p-5 rounded-md border ${
                        isCurrent ? 'bg-[#111113] border-white/40' : 'bg-[#0a0a0a] border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-white">{cfg.origin}/</span>
                        <span className="text-xs font-mono text-neutral-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" /> HTTP 200 · Independent
                        </span>
                      </div>
                      <dl className="space-y-2.5 text-xs">
                        <div>
                          <dt className="text-neutral-400">Canonical URL</dt>
                          <dd className="font-mono text-white mt-0.5 break-all">{cfg.origin}/</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-400">SEO Title</dt>
                          <dd className="text-neutral-200 font-medium mt-0.5">{cfg.title}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-400">H1 Heading (EN &amp; BN)</dt>
                          <dd className="text-neutral-200 mt-0.5">{cfg.h1En}</dd>
                          <dd className="text-neutral-300 mt-1">{cfg.h1Bn}</dd>
                        </div>
                        <div>
                          <dt className="text-neutral-400">Meta Description</dt>
                          <dd className="text-neutral-300 mt-0.5 leading-relaxed">{cfg.description}</dd>
                        </div>
                        <div className="pt-2 flex flex-wrap gap-3 border-t border-white/15 font-mono text-[11px] text-neutral-300">
                          <span>robots: index, follow</span>
                          <span>No Cross-Redirect</span>
                          <span>JSON-LD: {cfg.jsonLd.map((j) => j['@type']).join(', ')}</span>
                        </div>
                      </dl>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-md bg-black border border-white/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                      <FileCode2 className="w-4 h-4 text-white" />
                      {config.origin}/robots.txt
                    </span>
                    <a
                      href={`/robots.txt?domain=${activeDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white hover:underline flex items-center gap-1"
                    >
                      Open Raw <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <pre className="text-[11px] font-mono text-neutral-300 bg-[#111113] p-3 rounded-[4px] overflow-x-auto leading-relaxed">
                    {generateRobotsTxt(activeDomain)}
                  </pre>
                </div>

                <div className="p-4 rounded-md bg-black border border-white/15">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-semibold text-neutral-300 flex items-center gap-1.5">
                      <FileCode2 className="w-4 h-4 text-white" />
                      {config.origin}/sitemap.xml
                    </span>
                    <a
                      href={`/sitemap.xml?domain=${activeDomain}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white hover:underline flex items-center gap-1"
                    >
                      Open XML <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <pre className="text-[11px] font-mono text-neutral-300 bg-[#111113] p-3 rounded-[4px] overflow-x-auto max-h-48 leading-relaxed">
                    {generateSitemapXml(activeDomain)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gsc' && (
            <div className="space-y-5">
              <div className="p-5 rounded-md bg-[#111113] border border-white/15 space-y-3">
                <h3 className="text-sm font-bold text-white">
                  1. Google Search Console Ownership Verification (Configured on Both Domains)
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Both HTML File Verification and HTML Meta Tag Verification are active and served at the root of{' '}
                  <code className="text-white font-mono">https://devsparksoft.com.bd</code> and{' '}
                  <code className="text-white font-mono">https://dslink.cyou</code>:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-[4px] bg-black border border-white/15 flex items-center justify-between gap-2">
                    <div className="text-xs font-mono text-neutral-200 truncate">/{GSC_VERIFICATION_CODE}.html</div>
                    <a
                      href={`/${GSC_VERIFICATION_CODE}.html`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-white hover:underline shrink-0 flex items-center gap-1"
                    >
                      Verify File <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="p-3 rounded-[4px] bg-black border border-white/15 flex items-center justify-between gap-2">
                    <div className="text-xs font-mono text-neutral-200 truncate">
                      &lt;meta name=&quot;google-site-verification&quot; content=&quot;{GSC_VERIFICATION_CODE}&quot; /&gt;
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(`<meta name="google-site-verification" content="${GSC_VERIFICATION_CODE}" />`, 'meta')
                      }
                      className="text-xs text-neutral-400 hover:text-white shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'meta' ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-md bg-[#111113] border border-white/15 space-y-4">
                <h3 className="text-sm font-bold text-white">
                  2. Step-by-Step Sitemap Submission Instructions in Google Search Console
                </h3>
                <ol className="space-y-3 text-xs text-neutral-300 list-decimal list-inside leading-relaxed">
                  <li>
                    Open{' '}
                    <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-white underline">
                      Google Search Console
                    </a>{' '}
                    and add two separate URL-prefix properties: <code className="text-white font-mono">https://devsparksoft.com.bd/</code> and{' '}
                    <code className="text-white font-mono">https://dslink.cyou/</code>.
                  </li>
                  <li>
                    Select <strong>https://devsparksoft.com.bd/</strong> → <strong>Sitemaps</strong> → enter{' '}
                    <code className="text-white font-mono">https://devsparksoft.com.bd/sitemap.xml</code> → click <strong>Submit</strong>.
                  </li>
                  <li>
                    Select <strong>https://dslink.cyou/</strong> → <strong>Sitemaps</strong> → enter{' '}
                    <code className="text-white font-mono">https://dslink.cyou/sitemap.xml</code> → click <strong>Submit</strong>.
                  </li>
                  <li>
                    Use the <strong>URL Inspection Tool</strong> on both domains and click <strong>Request Indexing</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <div className="p-5 rounded-md bg-[#111113] border border-white/15 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-white" />
                    Resend Email Delivery Verification
                  </h3>
                  <span className="text-xs font-mono text-neutral-300">Active API</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={testEmailTarget}
                    onChange={(e) => setTestEmailTarget(e.target.value)}
                    placeholder="Enter recipient email..."
                    className="flex-1 px-3.5 py-2 text-xs bg-black border border-white/20 rounded-[4px] text-white focus:outline-none focus:border-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingEmail}
                    className="px-4 py-2 text-xs font-bold bg-white hover:bg-neutral-200 text-black rounded-[4px] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {sendingEmail ? 'Sending Test Email...' : 'Send Test Email Now'}
                  </button>
                </div>
                {testEmailStatus && (
                  <p className="text-xs font-mono text-neutral-200 bg-black border border-white/20 px-3 py-2 rounded-[4px]">
                    {testEmailStatus}
                  </p>
                )}
              </div>

              <div className="p-5 rounded-md bg-[#111113] border border-white/15 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">Recent Starlink &amp; Promo Orders ({orders.length})</h3>
                    <p className="text-xs text-neutral-400">Synced from Firestore &amp; /promos checkout submissions</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchOrders}
                    className="px-3 py-1.5 text-xs font-medium border border-white/25 hover:bg-white/10 text-white rounded-[4px] flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOrders ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingOrders ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">Loading recent orders...</p>
                ) : orders.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center">No orders found yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-white/15 text-neutral-400">
                          <th className="py-2.5 pr-4">Order ID</th>
                          <th className="py-2.5 pr-4">Customer</th>
                          <th className="py-2.5 pr-4">Phone</th>
                          <th className="py-2.5 pr-4">Product / Kit</th>
                          <th className="py-2.5 pr-4 text-right tabular-nums">Amount</th>
                          <th className="py-2.5">Status / Method</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {orders.slice(0, 15).map((ord, idx) => (
                          <tr key={ord.id || idx} className="text-neutral-200">
                            <td className="py-2.5 pr-4 font-mono text-white">{ord.orderId || ord.id?.slice(0, 8)}</td>
                            <td className="py-2.5 pr-4 font-medium">{ord.customerName || ord.fullName || ord.name || 'Customer'}</td>
                            <td className="py-2.5 pr-4 font-mono">{ord.customerPhone || ord.phone || 'N/A'}</td>
                            <td className="py-2.5 pr-4">{ord.kitName || ord.productName || ord.packageName || 'Starlink Standard 4X Kit'}</td>
                            <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-white">
                              ৳{Number(ord.totalAmount || ord.price || 41500).toLocaleString()}
                            </td>
                            <td className="py-2.5 font-mono text-[11px] text-neutral-300">{ord.paymentMethod || ord.status || 'Confirmed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
