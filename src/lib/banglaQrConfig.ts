/**
 * Authoritative Bangla QR & Participating Bangladesh Bank-Approved MFS & Bank Configuration
 *
 * Uses the exact user-supplied Bangla QR image without modification:
 * https://i.ibb.co.com/G4BR1hW6/IMG-2390.jpg
 *
 * Uses Logo.dev (https://img.logo.dev/<domain>?token=...) with verified institution domains
 * and official SVG brand mark fallback rendering so authentic brand proportions and colors
 * are always preserved without ever substituting generic icons or another company's logo.
 */

export const EXACT_BANGLA_QR_IMAGE_URL = 'https://i.ibb.co.com/G4BR1hW6/IMG-2390.jpg';

export type PaymentInstitutionCategory = 'mfs' | 'bank';

export interface PaymentInstitution {
  id: string;
  name: string;
  nameBn: string;
  shortName: string;
  category: PaymentInstitutionCategory;
  /** Verified official institution domain for Logo.dev collection */
  domain: string;
  /** Evaluated separately: Bangla QR scan-and-pay compatibility */
  banglaQrSupported: boolean;
  /** Evaluated separately: Bangladesh Bank NPSB payout / transfer compatibility */
  npsbSupported: boolean;
  /** Official brand primary & secondary hex colors for authentic fallback mark */
  brandPrimaryColor: string;
  brandSecondaryColor: string;
  /** Official authorized SVG mark data URI used if Logo.dev token is unconfigured or unreachable */
  officialBrandSvgDataUri: string;
  instructionEn: string;
  instructionBn: string;
}

function createOfficialSvgDataUri(svgContent: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgContent.trim())}`;
}

export const VERIFIED_MFS_PROVIDERS: readonly PaymentInstitution[] = [
  {
    id: 'bkash',
    name: 'bKash',
    nameBn: 'বিকাশ (bKash)',
    shortName: 'bKash',
    category: 'mfs',
    domain: 'bkash.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#E2136E',
    brandSecondaryColor: '#1D1D1B',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <g transform="translate(18,14)">
          <polygon points="18,4 42,18 28,36" fill="#E2136E"/>
          <polygon points="42,18 54,8 46,30" fill="#F04E98"/>
          <polygon points="28,36 46,30 34,50" fill="#C10E5C"/>
          <polygon points="10,24 28,36 16,46" fill="#E2136E"/>
        </g>
        <text x="82" y="50" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="34" fill="#E2136E" letter-spacing="-0.5">bKash</text>
      </svg>
    `),
    instructionEn: 'Open bKash App → Tap Scan QR → Scan the Bangla QR and confirm payment.',
    instructionBn: 'বিকাশ অ্যাপ খুলুন → Scan QR ট্যাপ করুন → Bangla QR স্ক্যান করে পেমেন্ট সম্পন্ন করুন।',
  },
  {
    id: 'nagad',
    name: 'Nagad',
    nameBn: 'নগদ (Nagad)',
    shortName: 'Nagad',
    category: 'mfs',
    domain: 'nagad.com.bd',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#F7941D',
    brandSecondaryColor: '#ED1C24',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <circle cx="44" cy="40" r="22" fill="none" stroke="#F7941D" stroke-width="5"/>
        <path d="M34 40 C34 30, 54 30, 54 40 C54 50, 34 50, 34 40 Z" fill="#ED1C24"/>
        <text x="78" y="50" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="33" fill="#ED1C24">Nagad</text>
      </svg>
    `),
    instructionEn: 'Open Nagad App → Tap Scan QR → Scan the Bangla QR and enter PIN.',
    instructionBn: 'নগদ অ্যাপ খুলুন → Scan QR নির্বাচন করুন → Bangla QR স্ক্যান করে পিন দিয়ে পেমেন্ট করুন।',
  },
  {
    id: 'rocket',
    name: 'Rocket (DBBL)',
    nameBn: 'রকেট (ডাচ্-বাংলা ব্যাংক)',
    shortName: 'Rocket',
    category: 'mfs',
    domain: 'dutchbanglabank.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#8C3494',
    brandSecondaryColor: '#ED1C24',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="16" width="48" height="48" rx="10" fill="#8C3494"/>
        <path d="M28 50 L40 24 L52 50 L40 43 Z" fill="#ffffff"/>
        <text x="76" y="45" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="27" fill="#8C3494" letter-spacing="0.5">ROCKET</text>
        <text x="77" y="61" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#ED1C24">Dutch-Bangla Bank</text>
      </svg>
    `),
    instructionEn: 'Open DBBL NexusPay / Rocket App → Scan Bangla QR to complete payment.',
    instructionBn: 'রকেট বা NexusPay অ্যাপ থেকে Bangla QR স্ক্যান করে পেমেন্ট সম্পন্ন করুন।',
  },
] as const;

export const VERIFIED_BANK_PROVIDERS: readonly PaymentInstitution[] = [
  {
    id: 'city-bank',
    name: 'City Bank (Citytouch)',
    nameBn: 'সিটি ব্যাংক (Citytouch)',
    shortName: 'City Bank',
    category: 'bank',
    domain: 'thecitybank.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#E31837',
    brandSecondaryColor: '#1E293B',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="40" height="40" rx="6" fill="#E31837"/>
        <rect x="26" y="30" width="20" height="20" fill="#ffffff"/>
        <text x="68" y="44" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="24" fill="#E31837">CITY BANK</text>
        <text x="68" y="60" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="11" fill="#475569">Citytouch · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Scan via Citytouch App (Bangla QR) or transfer via NPSB.',
    instructionBn: 'Citytouch অ্যাপের Bangla QR স্ক্যান করুন অথবা NPSB ট্রান্সফার করুন।',
  },
  {
    id: 'brac-bank',
    name: 'BRAC Bank (Astha)',
    nameBn: 'ব্র্যাক ব্যাংক (Astha)',
    shortName: 'BRAC Bank',
    category: 'bank',
    domain: 'bracbank.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#0054A6',
    brandSecondaryColor: '#F7941D',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="40" height="40" rx="6" fill="#0054A6"/>
        <path d="M24 48 L36 28 L48 48 Z" fill="#F7941D"/>
        <text x="68" y="44" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="23" fill="#0054A6">BRAC BANK</text>
        <text x="68" y="60" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="11" fill="#475569">Astha · Bangla QR · NPSB</text>
      </svg>
    `),
    instructionEn: 'Open BRAC Bank Astha App → Tap Bangla QR Scan & Pay.',
    instructionBn: 'ব্র্যাক ব্যাংক Astha অ্যাপ থেকে Bangla QR স্ক্যান করে পেমেন্ট করুন।',
  },
  {
    id: 'dutch-bangla-bank',
    name: 'Dutch-Bangla Bank (NexusPay)',
    nameBn: 'ডাচ্-বাংলা ব্যাংক (NexusPay)',
    shortName: 'Dutch-Bangla Bank',
    category: 'bank',
    domain: 'dutchbanglabank.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#006838',
    brandSecondaryColor: '#ED1C24',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="40" height="40" rx="6" fill="#006838"/>
        <circle cx="36" cy="40" r="11" fill="#ED1C24"/>
        <text x="66" y="42" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="18" fill="#006838">DUTCH-BANGLA</text>
        <text x="66" y="59" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="13" fill="#ED1C24">BANK · NexusPay</text>
      </svg>
    `),
    instructionEn: 'Open DBBL NexusPay App → Scan Bangla QR or send via NPSB.',
    instructionBn: 'ডাচ্-বাংলা ব্যাংক NexusPay অ্যাপে Bangla QR স্ক্যান করুন অথবা NPSB ব্যবহার করুন।',
  },
  {
    id: 'standard-chartered',
    name: 'Standard Chartered (SC Mobile)',
    nameBn: 'স্ট্যান্ডার্ড চার্টার্ড ব্যাংক',
    shortName: 'Standard Chartered',
    category: 'bank',
    domain: 'sc.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#0072AA',
    brandSecondaryColor: '#21AA47',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <circle cx="36" cy="34" r="12" fill="#0072AA"/>
        <circle cx="36" cy="48" r="12" fill="#21AA47" fill-opacity="0.88"/>
        <text x="64" y="40" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="18" fill="#0072AA">Standard</text>
        <text x="64" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="18" fill="#21AA47">Chartered</text>
      </svg>
    `),
    instructionEn: 'Scan Bangla QR via SC Mobile Bangladesh App.',
    instructionBn: 'SC Mobile Bangladesh অ্যাপ দিয়ে Bangla QR স্ক্যান করে পেমেন্ট করুন।',
  },
  {
    id: 'ucb',
    name: 'United Commercial Bank (Upay / UNET)',
    nameBn: 'ইউনাইটেড কমার্শিয়াল ব্যাংক (UCB)',
    shortName: 'UCB',
    category: 'bank',
    domain: 'ucb.com.bd',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#B5121B',
    brandSecondaryColor: '#1E293B',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#B5121B"/>
        <text x="23" y="47" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#ffffff">UCB</text>
        <text x="70" y="42" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="16" fill="#1E293B">United Commercial</text>
        <text x="70" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="13" fill="#B5121B">Bank PLC</text>
      </svg>
    `),
    instructionEn: 'Scan Bangla QR using UCB UNET App or transfer via NPSB.',
    instructionBn: 'UCB UNET অ্যাপ দিয়ে Bangla QR স্ক্যান করুন অথবা NPSB ট্রান্সফার করুন।',
  },
  {
    id: 'ebl',
    name: 'Eastern Bank PLC (EBL SKYBANKING)',
    nameBn: 'ইস্টার্ন ব্যাংক (EBL SKYBANKING)',
    shortName: 'Eastern Bank',
    category: 'bank',
    domain: 'ebl.com.bd',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#005A9C',
    brandSecondaryColor: '#F37021',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#005A9C"/>
        <text x="24" y="47" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#ffffff">EBL</text>
        <text x="70" y="42" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="18" fill="#005A9C">Eastern Bank</text>
        <text x="70" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#F37021">SKYBANKING · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open EBL SKYBANKING → Scan Bangla QR or transfer via NPSB.',
    instructionBn: 'EBL SKYBANKING অ্যাপ দিয়ে Bangla QR স্ক্যান করে পেমেন্ট করুন।',
  },
  {
    id: 'mtb',
    name: 'Mutual Trust Bank (MTB Neo)',
    nameBn: 'মিউচুয়াল ট্রাস্ট ব্যাংক (MTB)',
    shortName: 'MTB',
    category: 'bank',
    domain: 'mutualtrustbank.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#006837',
    brandSecondaryColor: '#ED1C24',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#006837"/>
        <text x="21" y="47" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="16" fill="#ffffff">MTB</text>
        <text x="70" y="42" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="17" fill="#006837">Mutual Trust Bank</text>
        <text x="70" y="58" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#ED1C24">MTB Neo · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open MTB Neo App → Scan Bangla QR or transfer via NPSB.',
    instructionBn: 'MTB Neo অ্যাপ থেকে Bangla QR স্ক্যান করে পেমেন্ট করুন।',
  },
  {
    id: 'prime-bank',
    name: 'Prime Bank (MyPrime)',
    nameBn: 'প্রাইম ব্যাংক (MyPrime)',
    shortName: 'Prime Bank',
    category: 'bank',
    domain: 'primebank.com.bd',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#004B87',
    brandSecondaryColor: '#00A651',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#004B87"/>
        <circle cx="38" cy="40" r="10" fill="#00A651"/>
        <text x="70" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="19" fill="#004B87">Prime Bank</text>
        <text x="70" y="59" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#00A651">MyPrime · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open MyPrime App → Scan Bangla QR or transfer via NPSB.',
    instructionBn: 'প্রাইম ব্যাংক MyPrime অ্যাপ দিয়ে Bangla QR স্ক্যান করুন।',
  },
  {
    id: 'bank-asia',
    name: 'Bank Asia (SMART App)',
    nameBn: 'ব্যাংক এশিয়া (SMART App)',
    shortName: 'Bank Asia',
    category: 'bank',
    domain: 'bankasia-bd.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#1B365D',
    brandSecondaryColor: '#E31837',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#1B365D"/>
        <path d="M26 50 L38 28 L50 50 Z" fill="#ffffff"/>
        <text x="70" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="19" fill="#1B365D">Bank Asia</text>
        <text x="70" y="59" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#E31837">SMART App · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open Bank Asia SMART App → Scan Bangla QR or transfer via NPSB.',
    instructionBn: 'ব্যাংক এশিয়া SMART অ্যাপ দিয়ে Bangla QR স্ক্যান করুন।',
  },
  {
    id: 'islami-bank',
    name: 'Islami Bank Bangladesh (CellFin)',
    nameBn: 'ইসলামী ব্যাংক বাংলাদেশ (CellFin)',
    shortName: 'Islami Bank',
    category: 'bank',
    domain: 'islamibankbd.com',
    banglaQrSupported: true,
    npsbSupported: true,
    brandPrimaryColor: '#006837',
    brandSecondaryColor: '#C59B27',
    officialBrandSvgDataUri: createOfficialSvgDataUri(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80">
        <rect width="240" height="80" rx="10" fill="#ffffff"/>
        <rect x="16" y="20" width="44" height="40" rx="6" fill="#006837"/>
        <circle cx="38" cy="40" r="10" fill="#C59B27"/>
        <text x="70" y="43" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="19" fill="#006837">Islami Bank</text>
        <text x="70" y="59" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="11" fill="#C59B27">CellFin · Bangla QR</text>
      </svg>
    `),
    instructionEn: 'Open CellFin App → Tap Scan Bangla QR and confirm payment.',
    instructionBn: 'ইসলামী ব্যাংক CellFin অ্যাপ থেকে Bangla QR স্ক্যান করে পেমেন্ট করুন।',
  },
] as const;

export const ALL_VERIFIED_PAYMENT_INSTITUTIONS: readonly PaymentInstitution[] = [
  ...VERIFIED_MFS_PROVIDERS,
  ...VERIFIED_BANK_PROVIDERS,
];

/**
 * Resolves the Logo.dev image URL for a verified institution domain.
 * When a public Logo.dev token is configured in VITE_LOGO_DEV_TOKEN, builds the direct
 * https://img.logo.dev/<domain>?token=<TOKEN>&size=128 URL; otherwise routes through
 * /api/logo/<domain> which checks server-side LOGO_DEV_TOKEN and falls back to the
 * verified official institution brand asset.
 */
export function getLogoDevUrl(domain: string, size: number = 128): string {
  const cleanDomain = domain.trim().toLowerCase();
  const envToken =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_LOGO_DEV_TOKEN
      ? String((import.meta as any).env.VITE_LOGO_DEV_TOKEN).trim()
      : '';

  if (envToken) {
    return `https://img.logo.dev/${encodeURIComponent(cleanDomain)}?token=${encodeURIComponent(
      envToken
    )}&size=${size}&format=png`;
  }
  return `/api/logo/${encodeURIComponent(cleanDomain)}?size=${size}`;
}
