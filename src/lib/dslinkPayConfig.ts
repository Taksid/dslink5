/**
 * DSLink Pay — Shared Types, Verified Merchant Metadata, Bilingual Bank/Wallet Search,
 * Status Labels, Multi-Currency Formatting (BDT / USD), and WhatsApp Share Helpers.
 *
 * Security & Compliance:
 * - Uses ONLY verified merchant details matching DEV SPARK SOFT LIMITED (Bangla QR Merchant ID: 9100820013263702185).
 * - Never collects card details, wallet PINs, bank passwords, or OTPs.
 * - Never exposes private customer PII or delivery address in public payment request objects.
 */

import {
  EXACT_BANGLA_QR_IMAGE_URL,
  VERIFIED_BANGLA_QR_MERCHANT_ID,
  VERIFIED_BANGLA_QR_MERCHANT_NAME,
  VERIFIED_BANGLA_QR_PHONE,
  VERIFIED_MFS_PROVIDERS,
  VERIFIED_BANK_PROVIDERS,
  PaymentInstitution,
  getLogoDevUrl,
} from './banglaQrConfig';

export {
  EXACT_BANGLA_QR_IMAGE_URL,
  VERIFIED_BANGLA_QR_MERCHANT_ID,
  VERIFIED_BANGLA_QR_MERCHANT_NAME,
  VERIFIED_BANGLA_QR_PHONE,
  getLogoDevUrl,
};

export const MANUAL_BANGLA_QR_INSTRUCTIONS_BN =
  'আপনার ব্যাংক বা ওয়ালেট অ্যাপে Bangla QR স্ক্যান করুন। প্রাপকের নাম ও টাকার পরিমাণ মিলিয়ে পেমেন্ট করুন। তারপর রসিদ থেকে TrxID নিচে দিন।';

export const MANUAL_BANGLA_QR_PROVIDER_LABEL_BN = 'Bangla QR দিয়ে ম্যানুয়াল পেমেন্ট';

export interface ProviderAccentTheme {
  accentHex: string;
  headerBarClass: string;
  amountBoxClass: string;
  amountBadgeClass: string;
  inputFocusClass: string;
  primaryButtonClass: string;
}

const PROVIDER_ACCENT_THEMES: Record<string, ProviderAccentTheme> = {
  bkash: {
    accentHex: '#E2136E',
    headerBarClass: 'bg-[#E2136E]',
    amountBoxClass: 'border-[#E2136E]/25 bg-[#E2136E]/[0.05]',
    amountBadgeClass: 'text-[#C10E5C]',
    inputFocusClass: 'focus:border-[#E2136E]',
    primaryButtonClass: 'bg-[#E2136E] hover:bg-[#C10E5C] text-white',
  },
  nagad: {
    accentHex: '#ED1C24',
    headerBarClass: 'bg-[#ED1C24]',
    amountBoxClass: 'border-[#F7941D]/35 bg-[#F7941D]/[0.07]',
    amountBadgeClass: 'text-[#C81E1E]',
    inputFocusClass: 'focus:border-[#ED1C24]',
    primaryButtonClass: 'bg-[#ED1C24] hover:bg-[#C81E1E] text-white',
  },
  rocket: {
    accentHex: '#8C3494',
    headerBarClass: 'bg-[#8C3494]',
    amountBoxClass: 'border-[#8C3494]/25 bg-[#8C3494]/[0.05]',
    amountBadgeClass: 'text-[#702377]',
    inputFocusClass: 'focus:border-[#8C3494]',
    primaryButtonClass: 'bg-[#8C3494] hover:bg-[#702377] text-white',
  },
  upay: {
    accentHex: '#0055A5',
    headerBarClass: 'bg-[#0055A5]',
    amountBoxClass: 'border-[#0055A5]/25 bg-[#0055A5]/[0.05]',
    amountBadgeClass: 'text-[#004080]',
    inputFocusClass: 'focus:border-[#0055A5]',
    primaryButtonClass: 'bg-[#0055A5] hover:bg-[#004080] text-white',
  },
  'city-bank': {
    accentHex: '#E31837',
    headerBarClass: 'bg-[#E31837]',
    amountBoxClass: 'border-[#E31837]/25 bg-[#E31837]/[0.05]',
    amountBadgeClass: 'text-[#B9122B]',
    inputFocusClass: 'focus:border-[#E31837]',
    primaryButtonClass: 'bg-[#E31837] hover:bg-[#B9122B] text-white',
  },
  'brac-bank': {
    accentHex: '#0054A6',
    headerBarClass: 'bg-[#0054A6]',
    amountBoxClass: 'border-[#0054A6]/25 bg-[#0054A6]/[0.05]',
    amountBadgeClass: 'text-[#003F7D]',
    inputFocusClass: 'focus:border-[#0054A6]',
    primaryButtonClass: 'bg-[#0054A6] hover:bg-[#003F7D] text-white',
  },
  'dutch-bangla-bank': {
    accentHex: '#006838',
    headerBarClass: 'bg-[#006838]',
    amountBoxClass: 'border-[#006838]/25 bg-[#006838]/[0.05]',
    amountBadgeClass: 'text-[#004F2A]',
    inputFocusClass: 'focus:border-[#006838]',
    primaryButtonClass: 'bg-[#006838] hover:bg-[#004F2A] text-white',
  },
  'standard-chartered': {
    accentHex: '#0072AA',
    headerBarClass: 'bg-[#0072AA]',
    amountBoxClass: 'border-[#0072AA]/25 bg-[#0072AA]/[0.05]',
    amountBadgeClass: 'text-[#005985]',
    inputFocusClass: 'focus:border-[#0072AA]',
    primaryButtonClass: 'bg-[#0072AA] hover:bg-[#005985] text-white',
  },
  ucb: {
    accentHex: '#B5121B',
    headerBarClass: 'bg-[#B5121B]',
    amountBoxClass: 'border-[#B5121B]/25 bg-[#B5121B]/[0.05]',
    amountBadgeClass: 'text-[#8F0E15]',
    inputFocusClass: 'focus:border-[#B5121B]',
    primaryButtonClass: 'bg-[#B5121B] hover:bg-[#8F0E15] text-white',
  },
  ebl: {
    accentHex: '#005A9C',
    headerBarClass: 'bg-[#005A9C]',
    amountBoxClass: 'border-[#005A9C]/25 bg-[#005A9C]/[0.05]',
    amountBadgeClass: 'text-[#004375]',
    inputFocusClass: 'focus:border-[#005A9C]',
    primaryButtonClass: 'bg-[#005A9C] hover:bg-[#004375] text-white',
  },
  mtb: {
    accentHex: '#006837',
    headerBarClass: 'bg-[#006837]',
    amountBoxClass: 'border-[#006837]/25 bg-[#006837]/[0.05]',
    amountBadgeClass: 'text-[#004D29]',
    inputFocusClass: 'focus:border-[#006837]',
    primaryButtonClass: 'bg-[#006837] hover:bg-[#004D29] text-white',
  },
  'prime-bank': {
    accentHex: '#004B87',
    headerBarClass: 'bg-[#004B87]',
    amountBoxClass: 'border-[#004B87]/25 bg-[#004B87]/[0.05]',
    amountBadgeClass: 'text-[#003763]',
    inputFocusClass: 'focus:border-[#004B87]',
    primaryButtonClass: 'bg-[#004B87] hover:bg-[#003763] text-white',
  },
  'bank-asia': {
    accentHex: '#1B365D',
    headerBarClass: 'bg-[#1B365D]',
    amountBoxClass: 'border-[#1B365D]/25 bg-[#1B365D]/[0.05]',
    amountBadgeClass: 'text-[#122440]',
    inputFocusClass: 'focus:border-[#1B365D]',
    primaryButtonClass: 'bg-[#1B365D] hover:bg-[#122440] text-white',
  },
  'islami-bank': {
    accentHex: '#006837',
    headerBarClass: 'bg-[#006837]',
    amountBoxClass: 'border-[#006837]/25 bg-[#006837]/[0.05]',
    amountBadgeClass: 'text-[#004D29]',
    inputFocusClass: 'focus:border-[#006837]',
    primaryButtonClass: 'bg-[#006837] hover:bg-[#004D29] text-white',
  },
  'ific-bank': {
    accentHex: '#006837',
    headerBarClass: 'bg-[#006837]',
    amountBoxClass: 'border-[#006837]/25 bg-[#006837]/[0.05]',
    amountBadgeClass: 'text-[#004D29]',
    inputFocusClass: 'focus:border-[#006837]',
    primaryButtonClass: 'bg-[#006837] hover:bg-[#004D29] text-white',
  },
};

const DEFAULT_PROVIDER_ACCENT_THEME: ProviderAccentTheme = {
  accentHex: '#0284c7',
  headerBarClass: 'bg-[#0284c7]',
  amountBoxClass: 'border-sky-200 bg-sky-50/70',
  amountBadgeClass: 'text-sky-700',
  inputFocusClass: 'focus:border-[#0284c7]',
  primaryButtonClass: 'bg-[#0284c7] hover:bg-[#0369a1] text-white',
};

export function getProviderAccentTheme(providerId?: string): ProviderAccentTheme {
  if (!providerId) return DEFAULT_PROVIDER_ACCENT_THEME;
  return PROVIDER_ACCENT_THEMES[providerId] || DEFAULT_PROVIDER_ACCENT_THEME;
}

export type DSLinkPayCurrency = 'BDT' | 'USD';

export type DSLinkPayStatus =
  | 'pending'
  | 'under_review'
  | 'paid'
  | 'cod_selected'
  | 'expired'
  | 'cancelled'
  | 'revoked'
  | 'rejected';

export type DSLinkPayType = 'full' | 'advance' | 'remaining' | 'subscription';

export type DSLinkPayMethod = 'bangla_qr' | 'bank_transfer' | 'card' | 'cod';

export interface DSLinkPayItemSummary {
  productId: string;
  name: string;
  variantLabel?: string;
  productClass?: 'rental' | 'bd_residential' | 'roam_premium';
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  currency?: DSLinkPayCurrency;
}

export interface DSLinkPayBankTransferConfig {
  recipientName: string;
  merchantQrId: string;
  supportPhone: string;
  directAccountConfigured: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchName?: string;
  routingNumber?: string;
}

export interface DSLinkPayRentalBreakdown {
  rentalShippingFeeBdt: number;
  activationFeeBdt: number;
  activationCollectionRule: 'upfront' | 'on_activation';
  subscriptionExcludedToday: boolean;
  subscriptionNoticeBn: string;
}

/**
 * Public, strictly PII-free payment request payload returned by GET /api/pay/:token.
 * Contains ONLY reference, items, amounts, currency, eligible options, and payment status.
 */
export interface DSLinkPayRequestPublic {
  id: string;
  token: string;
  /** Human-readable reference: final orderId once created, or draft reference while awaiting payment */
  requestRef: string;
  /** Final orderId (present once order is created; empty string while strictly a prepaid draft) */
  orderId: string;
  draftId?: string;
  isDraftOnly: boolean;
  items: DSLinkPayItemSummary[];
  productSummary: string;
  currency: DSLinkPayCurrency;
  /** Authoritative amounts in the request's payment currency (BDT or USD) */
  subtotalAmount: number;
  shippingFeeAmount: number;
  orderTotalAmount: number;
  paidAmount: number;
  remainingBalanceAmount: number;
  requestedAmount: number;
  requestedAmountMinor: number;
  remainingAfterThisPaymentAmount: number;
  /** Backward-compatible BDT amount fields (0 when USD-only or BDT equivalent for reporting) */
  subtotalBdt: number;
  shippingFeeBdt: number;
  orderTotalBdt: number;
  paidAmountBdt: number;
  remainingBalanceBdt: number;
  requestedAmountBdt: number;
  remainingAfterThisPaymentBdt: number;
  paymentType: DSLinkPayType;
  status: DSLinkPayStatus;
  eligibleMethods: DSLinkPayMethod[];
  stripeCardEnabled: boolean;
  cardUnavailableForDestination: boolean;
  stripePaymentStatus?: string;
  isRentalOrder: boolean;
  rentalBreakdown?: DSLinkPayRentalBreakdown;
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  subscriptionBillingPeriod?: string;
  codAdvanceRequiredAmount?: number;
  codRemainingOnDeliveryAmount?: number;
  countryCode: string;
  countryName?: string;
  submittedMethod?: DSLinkPayMethod;
  submittedTrxId?: string;
  selectedInstitutionId?: string;
  selectedInstitutionName?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  merchant: {
    name: string;
    banglaQrMerchantId: string;
    banglaQrImageUrl: string;
    supportPhone: string;
    bankTransfer?: DSLinkPayBankTransferConfig;
  };
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  verifiedAt?: string;
  revokedReason?: string;
}

export interface DSLinkPayDraftSummaryAdmin {
  draftId: string;
  customerName: string;
  phone: string;
  email: string;
  countryCode: string;
  countryName: string;
  address: string;
  currency: DSLinkPayCurrency;
  totalAmount: number;
  isRentalOrder: boolean;
  finalOrderId?: string;
  createdAt: string;
}

export interface DSLinkPayRequestAdmin extends DSLinkPayRequestPublic {
  payPath: string;
  payUrl: string;
  createdBy: string;
  senderHint?: string;
  verifiedBy?: string;
  verifiedAmount?: number;
  verifiedAmountBdt?: number;
  note?: string;
  replacedById?: string;
  draft?: DSLinkPayDraftSummaryAdmin;
  whatsappShareMessage: string;
  whatsappShareUrl: string;
}

export interface DSLinkPayEmailJob {
  id: string;
  type: 'payment_confirmed' | 'payment_cancelled';
  paymentRequestId: string;
  requestRef: string;
  orderId?: string;
  recipientEmail: string;
  subject: string;
  status: 'queued' | 'sent' | 'failed' | 'skipped_unconfigured';
  attempts: number;
  lastError?: string;
  providerMessageId?: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
}

export interface DSLinkPayConfigDiagnostics {
  stripeEnabled: boolean;
  stripeSecretConfigured: boolean;
  stripeWebhookSecretConfigured: boolean;
  emailApiConfigured: boolean;
  senderEmailConfigured: boolean;
  rentalShippingFeeBdt: number;
  rentalActivationCollectionRule: 'upfront' | 'on_activation';
  internationalShippingBdt: number;
  internationalShippingUsd: number;
  bdtToUsdRate: number;
  codAdvanceBdt: number;
  warnings: string[];
}

export interface DSLinkPayProvider extends PaymentInstitution {
  /** Group label for DSLink Pay UI ('wallet' -> মোবাইল ওয়ালেট, 'bank' -> ব্যাংক) */
  group: 'wallet' | 'bank';
  /** Bangla, English, phonetic spellings, and banking abbreviations */
  searchAliases: readonly string[];
  /** Specific bank/NPSB transfer guidance in Bangla */
  bankTransferInstructionBn: string;
  /** Specific bank/NPSB transfer guidance in English */
  bankTransferInstructionEn: string;
}

function createSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

const EXTRA_VERIFIED_PROVIDERS: readonly DSLinkPayProvider[] = [
  {
    id: 'upay',
    name: 'Upay (UCB Fintech)',
    nameBn: 'উপায় (Upay)',
    shortName: 'Upay',
    category: 'mfs',
    group: 'wallet',
    domain: 'upaybd.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#0055A5',
    brandSecondaryColor: '#FFD100',
    officialBrandSvgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="18" width="44" height="44" rx="10" fill="#FFD100"/>
        <text x="27" y="49" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="24" fill="#0055A5">u</text>
        <text x="72" y="47" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="30" fill="#0055A5">upay</text>
        <text x="72" y="62" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#475569">UCB · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open Upay App → Tap Make Payment / Scan Bangla QR → Confirm exact amount.',
    instructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    bankTransferInstructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    bankTransferInstructionEn: 'Scan DEV SPARK SOFT LIMITED Bangla QR in Upay and submit your TrxID below.',
    searchAliases: ['upay', 'উপায়', 'উপায়', 'ucb upay', 'ucb fintech', 'u-pay'],
  },
  {
    id: 'ific-bank',
    name: 'IFIC Bank (Amar Bank)',
    nameBn: 'আইএফআইসি ব্যাংক (IFIC)',
    shortName: 'IFIC Bank',
    category: 'bank',
    group: 'bank',
    domain: 'ificbank.com.bd',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#006837',
    brandSecondaryColor: '#ED1C24',
    officialBrandSvgDataUri: createSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#006837"/>
        <text x="21" y="46" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="15" fill="#ffffff">IFIC</text>
        <text x="70" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="20" fill="#006837">IFIC Bank</text>
        <text x="70" y="59" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#ED1C24">Amar Bank · Bangla QR · NPSB</text>
      </svg>
    `),
    instructionEn: 'Open IFIC Amar Bank App → Tap Bangla QR Scan & Pay.',
    instructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    bankTransferInstructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    bankTransferInstructionEn: 'Scan DEV SPARK SOFT LIMITED Bangla QR in IFIC Amar Bank and submit your TrxID below.',
    searchAliases: ['ific', 'ific bank', 'আইএফআইসি', 'আইএফআইসি ব্যাংক', 'amar bank', 'আমার ব্যাংক'],
  },
];

const PROVIDER_ALIAS_MAP: Record<string, readonly string[]> = {
  bkash: ['bkash', 'b-kash', 'bikash', 'bk', 'বিকাশ', 'বিকাশ অ্যাপ', 'mfs', 'wallet'],
  nagad: ['nagad', 'nogod', 'ng', 'নগদ', 'নগদ অ্যাপ', 'postal', 'mfs', 'wallet'],
  rocket: ['rocket', 'roket', 'dbbl rocket', 'dbbl', 'রকেট', 'ডাচ বাংলা রকেট', 'ডাচ্-বাংলা রকেট', 'mfs', 'wallet'],
  'city-bank': ['city', 'city bank', 'citybank', 'citytouch', 'cb', 'cbl', 'সিটি', 'সিটি ব্যাংক', 'সিটিটাচ'],
  'brac-bank': ['brac', 'brac bank', 'astha', 'bbl', 'ব্র্যাক', 'ব্রাক', 'ব্র্যাক ব্যাংক', 'আস্থা'],
  'dutch-bangla-bank': ['dbbl', 'dutch bangla', 'dutch-bangla', 'nexus', 'nexuspay', 'ডাচ বাংলা', 'ডাচ্-বাংলা', 'ডাচ বাংলা ব্যাংক', 'নেক্সাস পে'],
  'standard-chartered': ['scb', 'standard chartered', 'sc mobile', 'stanchart', 'স্ট্যান্ডার্ড চার্টার্ড', 'এসসিবি'],
  ucb: ['ucb', 'united commercial', 'unet', 'ইউসিবি', 'ইউনাইটেড কমার্শিয়াল', 'ইউনাইটেড কমার্শিয়াল'],
  ebl: ['ebl', 'eastern', 'eastern bank', 'skybanking', 'ইবিএল', 'ইস্টার্ন', 'ইস্টার্ন ব্যাংক', 'স্কাইব্যাংকিং'],
  mtb: ['mtb', 'mutual trust', 'mtb neo', 'এমটিবি', 'মিউচুয়াল ট্রাস্ট', 'মিউচুয়াল ট্রাস্ট'],
  'prime-bank': ['prime', 'prime bank', 'myprime', 'pbl', 'প্রাইম', 'প্রাইম ব্যাংক', 'মাইপ্রাইম'],
  'bank-asia': ['bank asia', 'bankasia', 'smart app', 'ba', 'ব্যাংক এশিয়া', 'ব্যাংক এশিয়া'],
  'islami-bank': ['ibbl', 'islami', 'islami bank', 'cellfin', 'ইসলামী', 'ইসলামি', 'ইসলামী ব্যাংক', 'সেলফিন'],
};

function enrichInstitution(inst: PaymentInstitution): DSLinkPayProvider {
  const aliases = PROVIDER_ALIAS_MAP[inst.id] || [];
  const group: 'wallet' | 'bank' = inst.category === 'mfs' ? 'wallet' : 'bank';
  return {
    ...inst,
    group,
    instructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    searchAliases: [
      inst.id,
      inst.name.toLowerCase(),
      inst.nameBn,
      inst.shortName.toLowerCase(),
      ...aliases,
    ],
    bankTransferInstructionBn: MANUAL_BANGLA_QR_INSTRUCTIONS_BN,
    bankTransferInstructionEn: `Scan DEV SPARK SOFT LIMITED Bangla QR in ${inst.shortName} and submit your TrxID below.`,
  };
}

/** Enable ONLY providers verified to support the merchant Bangla QR */
export const DSLINK_PAY_PROVIDERS: readonly DSLinkPayProvider[] = [
  ...VERIFIED_MFS_PROVIDERS.map(enrichInstitution),
  EXTRA_VERIFIED_PROVIDERS[0], // Upay
  ...VERIFIED_BANK_PROVIDERS.map(enrichInstitution),
  EXTRA_VERIFIED_PROVIDERS[1], // IFIC Bank
].filter((p) => p.banglaQrSupported);

export const DSLINK_PAY_WALLETS: readonly DSLinkPayProvider[] = DSLINK_PAY_PROVIDERS.filter(
  (p) => p.group === 'wallet'
);

export const DSLINK_PAY_BANKS: readonly DSLinkPayProvider[] = DSLINK_PAY_PROVIDERS.filter(
  (p) => p.group === 'bank'
);

export function normalizePaymentSearchText(input: string): string {
  return String(input || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/য়/g, 'য়')
    .replace(/[-_./()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchPaymentProviders(query: string): {
  wallets: DSLinkPayProvider[];
  banks: DSLinkPayProvider[];
  total: number;
} {
  const normalizedQuery = normalizePaymentSearchText(query);
  if (!normalizedQuery) {
    return {
      wallets: [...DSLINK_PAY_WALLETS],
      banks: [...DSLINK_PAY_BANKS],
      total: DSLINK_PAY_PROVIDERS.length,
    };
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  const compactQuery = normalizedQuery.replace(/\s+/g, '');

  const matchesProvider = (provider: DSLinkPayProvider): boolean => {
    const searchable = [
      provider.name,
      provider.nameBn,
      provider.shortName,
      provider.id,
      ...provider.searchAliases,
    ]
      .map(normalizePaymentSearchText)
      .join(' ');
    const compactSearchable = searchable.replace(/\s+/g, '');

    if (compactSearchable.includes(compactQuery)) return true;
    return tokens.every((t) => searchable.includes(t) || compactSearchable.includes(t));
  };

  const wallets = DSLINK_PAY_WALLETS.filter(matchesProvider);
  const banks = DSLINK_PAY_BANKS.filter(matchesProvider);
  return {
    wallets,
    banks,
    total: wallets.length + banks.length,
  };
}

export function getDSLinkPayStatusMeta(status: DSLinkPayStatus): {
  labelBn: string;
  labelEn: string;
  tone: 'cyan' | 'amber' | 'emerald' | 'rose' | 'slate';
  acceptsPayment: boolean;
} {
  switch (status) {
    case 'pending':
      return {
        labelBn: 'পেমেন্টের অপেক্ষায়',
        labelEn: 'Awaiting Payment',
        tone: 'cyan',
        acceptsPayment: true,
      };
    case 'under_review':
      return {
        labelBn: 'পেমেন্ট যাচাই চলছে',
        labelEn: 'Payment Under Verification',
        tone: 'amber',
        acceptsPayment: false,
      };
    case 'paid':
      return {
        labelBn: 'পেমেন্ট সফল',
        labelEn: 'Payment Verified',
        tone: 'emerald',
        acceptsPayment: false,
      };
    case 'cod_selected':
      return {
        labelBn: 'ক্যাশ অন ডেলিভারি নির্বাচিত',
        labelEn: 'Cash on Delivery Selected',
        tone: 'emerald',
        acceptsPayment: false,
      };
    case 'cancelled':
      return {
        labelBn: 'পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে',
        labelEn: 'Payment Request Cancelled',
        tone: 'rose',
        acceptsPayment: false,
      };
    case 'rejected':
      return {
        labelBn: 'পেমেন্ট সম্পন্ন হয়নি',
        labelEn: 'Payment Not Verified — Retry Available',
        tone: 'rose',
        acceptsPayment: true,
      };
    case 'expired':
      return {
        labelBn: 'পেমেন্ট সম্পন্ন হয়নি',
        labelEn: 'Payment Link Expired',
        tone: 'rose',
        acceptsPayment: false,
      };
    case 'revoked':
      return {
        labelBn: 'পেমেন্ট সম্পন্ন হয়নি',
        labelEn: 'Link Replaced / Revoked',
        tone: 'slate',
        acceptsPayment: false,
      };
  }
}

export function formatBdtAmount(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  return `৳${safe.toLocaleString('en-US')}`;
}

export function formatPayAmount(amount: number, currency: DSLinkPayCurrency = 'BDT'): string {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (currency === 'USD') {
    return `$${safe.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `৳${Math.round(safe).toLocaleString('en-US')}`;
}

export function buildPaymentRequestShareMessage(params: {
  orderId: string;
  requestRef?: string;
  requestedAmountBdt?: number;
  requestedAmount?: number;
  currency?: DSLinkPayCurrency | string;
  payUrl: string;
  paymentType: DSLinkPayType;
  remainingAfterThisPaymentBdt?: number;
  remainingAfterThisPaymentAmount?: number;
}): string {
  const currency: DSLinkPayCurrency = params.currency === 'USD' ? 'USD' : 'BDT';
  const ref = params.requestRef || params.orderId;
  const amount =
    typeof params.requestedAmount === 'number'
      ? params.requestedAmount
      : Number(params.requestedAmountBdt || 0);
  const remaining =
    typeof params.remainingAfterThisPaymentAmount === 'number'
      ? params.remainingAfterThisPaymentAmount
      : Number(params.remainingAfterThisPaymentBdt || 0);

  const typeLabel =
    params.paymentType === 'advance'
      ? 'অগ্রিম পেমেন্ট (Advance Payment)'
      : params.paymentType === 'remaining'
      ? 'বাকি ব্যালেন্স পেমেন্ট (Remaining Balance)'
      : params.paymentType === 'subscription'
      ? 'মাসিক সাবস্ক্রিপশন (Rental Subscription)'
      : 'পূর্ণ পেমেন্ট (Full Payment)';

  const remainingLine =
    remaining > 0 && (params.paymentType === 'advance' || params.paymentType === 'full')
      ? `\nডেলিভারির সময় বাকি পরিশোধ: ${formatPayAmount(remaining, currency)} ${currency}`
      : '';

  return [
    `DSLink Pay — নিরাপদ পেমেন্ট লিংক`,
    `রেফারেন্স: #${ref}`,
    `ধরন: ${typeLabel}`,
    `এখন পরিশোধ করতে হবে: ${formatPayAmount(amount, currency)} ${currency}${remainingLine}`,
    `পেমেন্ট লিংক: ${params.payUrl}`,
    `— DevSpark Link (devsparksoft.com.bd)`,
  ].join('\n');
}

export function buildWhatsAppShareUrl(message: string, phoneNumber?: string): string {
  const encoded = encodeURIComponent(message);
  const digits = String(phoneNumber || '').replace(/[^0-9]/g, '');
  if (digits.length >= 10) {
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}
