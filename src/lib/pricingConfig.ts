import { useEffect, useState, useCallback } from 'react';

export interface CentralProductPrice {
  id: string;
  name: string;
  nameBn: string;
  category: 'rental' | 'purchase' | 'accessory';
  price: number;
  billingType: 'one-time' | 'purchase';
  codEligible: boolean;
  globalDeliveryAvailable: boolean;
  description: string;
  descriptionBn: string;
  image: string;
  stock: number;
  active: boolean;
}

export interface CentralPricingSnapshot {
  version: number;
  updatedAt: string;
  currency: 'BDT';
  currencySymbol: '৳';
  products: Record<string, CentralProductPrice>;
}

export const GLOBAL_DELIVERY_COPY = {
  headlineEn: 'Global Delivery Available — Worldwide Starlink Kit Shipping',
  headlineBn: 'Global Delivery Available — বাংলাদেশসহ বিশ্বব্যাপী Starlink Kit ডেলিভারি সুবিধা!',
  headlineMy: 'Global Delivery Available — ကမ္ဘာတစ်ဝှမ်း Starlink Kit ပို့ဆောင်ပေးခြင်း',
  disclaimerEn:
    'International delivery availability does not guarantee Starlink activation or roaming support in every country. Local regulations and official Starlink policies apply.',
  disclaimerBn:
    'বিশ্বব্যাপী ডেলিভারি সুবিধা থাকলেও সব দেশে Starlink অ্যাক্টিভেশন বা রোমিং ব্যবহারের নিশ্চয়তা নেই। স্থানীয় অনুমোদন ও Starlink-এর নীতিমালা প্রযোজ্য।',
  disclaimerMy:
    'နိုင်ငံတကာသို့ ပို့ဆောင်ပေးနိုင်သော်လည်း နိုင်ငံတိုင်းတွင် Starlink ဖွင့်လှစ်အသုံးပြုနိုင်မည်ဟု အာမမခံပါ။ ဒေသဆိုင်ရာ စည်းမျဉ်းများနှင့် Starlink မူဝါဒများ အကျုံးဝင်ပါသည်။',
  codEligibleNoteEn:
    'Cash on Delivery (COD) is available only in eligible areas of Bangladesh for outright kit purchases (check & verify activation before paying).',
  codEligibleNoteBn:
    'Cash on Delivery (COD): প্রযোজ্য এলাকায় (বাংলাদেশের ৬৪ জেলায় স্থায়ী কিট ক্রয়ে) পণ্য হাতে পেয়ে চেক ও অ্যাক্টিভেশন যাচাই করে পেমেন্ট করার সুবিধা।',
  codEligibleNoteMy:
    'Cash on Delivery (COD) ကို ဘင်္ဂလားဒေ့ရှ်နိုင်ငံအတွင်း သတ်မှတ်ဧရိယာများရှိ အပြီးအပိုင် ဝယ်ယူမှုများတွင်သာ ရရှိနိုင်ပါသည်။',
  subscriptionSeparateEn: 'Monthly Starlink subscription fees are separate.',
  subscriptionSeparateBn: 'মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
  subscriptionSeparateMy: 'လစဉ် Starlink Subscription ကြေး သီးခြားပေးဆောင်ရမည်။',
  rentalOwnershipNoteEn:
    'The ৳3,000 Rental Kit fee is a one-time charge; hardware ownership is not transferred to the customer.',
  rentalOwnershipNoteBn:
    'Rental Kit-এর ৩,০০০ টাকা এককালীন চার্জ; কিটের মালিকানা ক্রেতার কাছে হস্তান্তর হয় না।',
  rentalOwnershipNoteMy:
    'Rental Kit ကြေး ৳3,000 သည် တစ်ကြိမ်သာ ပေးဆောင်ရသောကြေးဖြစ်ပြီး စက်ပိုင်ဆိုင်မှု မလွှဲပြောင်းပါ။',
} as const;

export const COD_ELIGIBLE_BD_DISTRICTS = [
  'Dhaka',
  'Chittagong',
  'Chattogram',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Barishal',
  'Rangpur',
  'Mymensingh',
  'Gazipur',
  'Narayanganj',
  'Cumilla',
  'Comilla',
  'Coxs Bazar',
  "Cox's Bazar",
  'Bogura',
  'Jessore',
  'Jashore',
  'Other',
];

export function isCodEligibleLocation(districtOrCountry?: string, isRental = false): boolean {
  if (isRental) return false;
  const val = (districtOrCountry || '').trim().toLowerCase();
  if (!val) return true; // default Dhaka, Bangladesh
  const nonBdHints = [
    'international',
    'worldwide',
    'global',
    'usa',
    'united states',
    'uk',
    'united kingdom',
    'myanmar',
    'india',
    'uae',
    'dubai',
    'saudi',
    'qatar',
    'singapore',
    'malaysia',
    'canada',
    'australia',
    'europe',
    'germany',
    'france',
    'japan',
    'africa',
  ];
  if (nonBdHints.some((hint) => val.includes(hint))) return false;
  return true;
}

export const DEFAULT_CENTRAL_PRODUCTS: Record<string, CentralProductPrice> = {
  'starlink-rental-kit': {
    id: 'starlink-rental-kit',
    name: 'Starlink Rental Kit',
    nameBn: 'Starlink Rental Kit (এককালীন চার্জ)',
    category: 'rental',
    price: 3000,
    billingType: 'one-time',
    codEligible: false,
    globalDeliveryAvailable: false,
    description:
      'One-time ৳3,000 charge for Starlink Standard 4X or Mini Rental Kit. Hardware ownership is not transferred. Monthly Starlink subscription fees are separate.',
    descriptionBn:
      'Starlink Standard 4X বা Mini Rental Kit — এককালীন ৩,০০০ টাকা চার্জ। কিটের মালিকানা হস্তান্তর হয় না এবং মাসিক Starlink সাবস্ক্রিপশন ফি আলাদাভাবে প্রযোজ্য।',
    image: 'https://starlink.com/public-files/Starlink_Standard_Hero_500x500.png',
    stock: 50,
    active: true,
  },
  'starlink-standard-4x': {
    id: 'starlink-standard-4x',
    name: 'Starlink Standard Kit 4X (Purchase)',
    nameBn: 'Starlink Standard Kit 4X (ক্রয়)',
    category: 'purchase',
    price: 41500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Genuine SpaceX Starlink Standard Kit 4X (Gen 3 Wi-Fi 6) for home, office, and enterprise connectivity. Global Delivery Available; COD in eligible Bangladesh areas. Monthly subscription fees are separate.',
    descriptionBn:
      'বাসা, অফিস ও কর্পোরেট ব্যবহারের জন্য অরিজিনাল Starlink Standard Kit 4X (Gen 3 Wi-Fi 6)। বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি ও প্রযোজ্য এলাকায় COD সুবিধা। মাসিক সাবস্ক্রিপশন ফি আলাদা।',
    image: 'https://starlink.com/public-files/Starlink_Standard_Hero_500x500.png',
    stock: 35,
    active: true,
  },
  'starlink-mini-kit': {
    id: 'starlink-mini-kit',
    name: 'Starlink Mini Kit (Purchase)',
    nameBn: 'Starlink Mini Kit (ক্রয়)',
    category: 'purchase',
    price: 21500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Ultra-portable SpaceX Starlink Mini Kit with integrated Wi-Fi router and low power draw. Global Delivery Available; COD in eligible Bangladesh areas. Monthly subscription fees are separate.',
    descriptionBn:
      'ব্যাকপ্যাকে বহনযোগ্য আল্ট্রা-পোর্টেবল Starlink Mini Kit (বিল্ট-ইন Wi-Fi রাউটারসহ)। বাংলাদেশসহ বিশ্বব্যাপী ডেলিভারি ও প্রযোজ্য এলাকায় COD সুবিধা। মাসিক সাবস্ক্রিপশন ফি আলাদা।',
    image: 'https://starlink.com/public-files/Starlink_Hardware_Generic_500x500.png',
    stock: 25,
    active: true,
  },
  'starlink-high-performance': {
    id: 'starlink-high-performance',
    name: 'Starlink Flat High Performance Kit',
    nameBn: 'Starlink Flat High Performance এন্টারপ্রাইজ কিট',
    category: 'purchase',
    price: 145000,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description:
      'Heavy-duty Flat High Performance kit for maritime, enterprise, ISP backhaul, and in-motion connectivity.',
    descriptionBn:
      'কর্পোরেট, আইএসপি, জাহাজ ও চলমান যানবাহনের জন্য হেভি-ডিউটি ফ্ল্যাট হাই-পারফরম্যান্স স্টারলিংক কিট।',
    image: 'https://starlink.com/public-files/Starlink_HighPerformance_Hero_500x500.png',
    stock: 8,
    active: true,
  },
  'router-mini': {
    id: 'router-mini',
    name: 'Router Mini | WiFi 5 Mesh Extender',
    nameBn: 'Router Mini | WiFi 5 মেশ এক্সটেন্ডার',
    category: 'accessory',
    price: 9500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Compact auxiliary WiFi router mesh node for extending Starlink coverage.',
    descriptionBn: 'স্টারলিংক নেটওয়ার্ক কভারেজ বাড়ানোর জন্য কম্প্যাক্ট WiFi 5 মেশ রাউটার।',
    image: 'https://starlink.com/public-files/500x500-Router_Mini_WiFi.png',
    stock: 20,
    active: true,
  },
  'router-3': {
    id: 'router-3',
    name: 'Gen 3 Tri-Band Wi-Fi 6 Router',
    nameBn: 'Gen 3 ট্রাই-ব্যান্ড Wi-Fi 6 রাউটার',
    category: 'accessory',
    price: 14500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Tri-Band Wi-Fi 6 Router with two gigabit Ethernet ports.',
    descriptionBn: '২টি গিগাবিট ল্যান পোর্টসহ ট্রাই-ব্যান্ড Wi-Fi 6 রাউটার।',
    image: 'https://starlink.com/public-files/500x500-Router_Gen3.png',
    stock: 15,
    active: true,
  },
  'ethernet-adapter': {
    id: 'ethernet-adapter',
    name: 'Starlink Ethernet Adapter',
    nameBn: 'স্টারলিংক ইথারনেট অ্যাডাপ্টার',
    category: 'accessory',
    price: 5500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: 'Wired Gigabit RJ45 Ethernet adapter for direct LAN connections.',
    descriptionBn: 'সরাসরি তারযুক্ত গিগাবিট ল্যান সংযোগের জন্য ইথারনেট অ্যাডাপ্টার।',
    image: 'https://starlink.com/public-files/accessories_ethernet_adapter_500x500.png',
    stock: 25,
    active: true,
  },
  'cable-15m': {
    id: 'cable-15m',
    name: 'Starlink 15m Shielded Cable',
    nameBn: 'স্টারলিংক ১৫ মিটার শিল্ডেড কেবল',
    category: 'accessory',
    price: 6500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: '15m weatherproof outdoor Starlink replacement cable.',
    descriptionBn: '১৫ মিটার ওয়েদারপ্রুফ আউটডোর স্টারলিংক কেবল।',
    image: 'https://starlink.com/public-files/accessories_standard_cable_500x500.png',
    stock: 20,
    active: true,
  },
  'cable-30m': {
    id: 'cable-30m',
    name: 'Starlink 30m Extended Cable',
    nameBn: 'স্টারলিংক ৩০ মিটার এক্সটেন্ডেড কেবল',
    category: 'accessory',
    price: 11500,
    billingType: 'purchase',
    codEligible: true,
    globalDeliveryAvailable: true,
    description: '30m weatherproof outdoor extended Starlink cable.',
    descriptionBn: '৩০ মিটার ওয়েদারপ্রুফ এক্সটেন্ডেড স্টারলিংক কেবল।',
    image: 'https://starlink.com/public-files/accessories_standard_cable_500x500.png',
    stock: 15,
    active: true,
  },
};

export function createDefaultPricingSnapshot(): CentralPricingSnapshot {
  const products: Record<string, CentralProductPrice> = {};
  for (const [key, item] of Object.entries(DEFAULT_CENTRAL_PRODUCTS)) {
    products[key] = { ...item };
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    currency: 'BDT',
    currencySymbol: '৳',
    products,
  };
}

export const PRICING_UPDATED_EVENT = 'dslink-pricing-updated';
const PRICING_STORAGE_KEY = 'dslink_central_pricing_cache_v1';

let livePricingSnapshot: CentralPricingSnapshot = createDefaultPricingSnapshot();
let hasFetchedInitialPricing = false;
let inflightPricingRequest: Promise<CentralPricingSnapshot> | null = null;

function mergePricingSnapshot(incoming?: Partial<CentralPricingSnapshot> | null): CentralPricingSnapshot {
  const base = createDefaultPricingSnapshot();
  if (incoming && incoming.products && typeof incoming.products === 'object') {
    for (const [id, prod] of Object.entries(incoming.products)) {
      if (!prod || typeof prod !== 'object') continue;
      const numericPrice = Number(prod.price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) continue;
      if (base.products[id]) {
        base.products[id] = {
          ...base.products[id],
          ...prod,
          id,
          price: Math.round(numericPrice),
        };
      } else {
        base.products[id] = {
          id,
          name: String(prod.name || id),
          nameBn: String(prod.nameBn || prod.name || id),
          category: prod.category || 'purchase',
          price: Math.round(numericPrice),
          billingType: prod.billingType || 'purchase',
          codEligible: prod.codEligible !== false,
          globalDeliveryAvailable: prod.globalDeliveryAvailable !== false,
          description: String(prod.description || ''),
          descriptionBn: String(prod.descriptionBn || prod.description || ''),
          image: String(prod.image || ''),
          stock: Number(prod.stock) || 10,
          active: prod.active !== false,
        };
      }
    }
  }
  return {
    ...base,
    version: Number(incoming?.version) || base.version,
    updatedAt: incoming?.updatedAt || new Date().toISOString(),
  };
}

export function getCachedCentralPricing(): CentralPricingSnapshot {
  return livePricingSnapshot;
}

export function getCentralProductPrice(productId: string, fallbackPrice?: number): number {
  const key = (productId || '').trim().toLowerCase();
  if (key.includes('rental')) {
    return livePricingSnapshot.products['starlink-rental-kit']?.price ?? 3000;
  }
  if (key === 'starlink-standard-4x' || key.includes('standard-4x') || key === 'standard_4x') {
    return livePricingSnapshot.products['starlink-standard-4x']?.price ?? 41500;
  }
  if (key === 'starlink-mini-kit' || key.includes('mini-kit') || key === 'mini') {
    return livePricingSnapshot.products['starlink-mini-kit']?.price ?? 21500;
  }
  const direct = livePricingSnapshot.products[productId] || livePricingSnapshot.products[key];
  if (direct && Number.isFinite(direct.price)) return direct.price;
  if (typeof fallbackPrice === 'number' && Number.isFinite(fallbackPrice)) return fallbackPrice;
  return 0;
}

function broadcastPricingUpdate(snapshot: CentralPricingSnapshot) {
  livePricingSnapshot = snapshot;
  if (typeof window !== 'undefined') {
    (window as any).__DSLINK_PRICING__ = snapshot;
    try {
      window.localStorage.setItem(PRICING_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // ignore storage quota restrictions
    }
    window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: snapshot }));
  }
}

export async function fetchCentralPricing(force = false): Promise<CentralPricingSnapshot> {
  if (typeof window === 'undefined') return livePricingSnapshot;
  if (!force && hasFetchedInitialPricing && inflightPricingRequest === null) {
    return livePricingSnapshot;
  }
  if (inflightPricingRequest && !force) return inflightPricingRequest;

  inflightPricingRequest = fetch('/api/pricing', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`Pricing API ${res.status}`);
      const json = await res.json();
      const merged = mergePricingSnapshot(json?.pricing || json);
      hasFetchedInitialPricing = true;
      broadcastPricingUpdate(merged);
      return merged;
    })
    .catch(() => {
      hasFetchedInitialPricing = true;
      return livePricingSnapshot;
    })
    .finally(() => {
      inflightPricingRequest = null;
    });

  return inflightPricingRequest;
}

export async function syncAdminProductPriceToServer(
  productId: string,
  price: number,
  meta?: Partial<CentralProductPrice> & { adminEmail?: string }
): Promise<CentralPricingSnapshot> {
  const numericPrice = Math.max(0, Math.round(Number(price) || 0));
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (meta?.adminEmail) {
    headers['x-admin-email'] = meta.adminEmail;
  }

  const res = await fetch(`/api/pricing/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      price: numericPrice,
      name: meta?.name,
      description: meta?.description,
      active: meta?.active,
      stock: meta?.stock,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.ok && data?.pricing) {
    const merged = mergePricingSnapshot(data.pricing);
    broadcastPricingUpdate(merged);
    return merged;
  }

  // Fallback local sync if server rejects or is offline during preview
  const next = mergePricingSnapshot({
    ...livePricingSnapshot,
    version: livePricingSnapshot.version + 1,
    updatedAt: new Date().toISOString(),
    products: {
      ...livePricingSnapshot.products,
      [productId]: {
        ...(livePricingSnapshot.products[productId] || {
          id: productId,
          name: meta?.name || productId,
          nameBn: meta?.name || productId,
          category: productId.includes('rental') ? 'rental' : 'purchase',
          price: numericPrice,
          billingType: productId.includes('rental') ? 'one-time' : 'purchase',
          codEligible: !productId.includes('rental'),
          globalDeliveryAvailable: !productId.includes('rental'),
          description: meta?.description || '',
          descriptionBn: meta?.description || '',
          image: '',
          stock: meta?.stock ?? 20,
          active: meta?.active ?? true,
        }),
        price: numericPrice,
      },
    },
  });
  broadcastPricingUpdate(next);
  return next;
}

export function formatBdt(amount: number): string {
  const safe = Math.max(0, Math.round(Number(amount) || 0));
  return `৳${safe.toLocaleString('en-US')}`;
}

export function formatBdtBn(amount: number): string {
  const formatted = formatBdt(amount);
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return formatted.replace(/\d/g, (d) => bnDigits[Number(d)] ?? d);
}

// Attach global helpers so pre-compiled bundle & standalone pages read/write the exact same pricing store
if (typeof window !== 'undefined') {
  try {
    const cached = window.localStorage.getItem(PRICING_STORAGE_KEY);
    if (cached) {
      livePricingSnapshot = mergePricingSnapshot(JSON.parse(cached));
    }
  } catch {
    // ignore invalid cache
  }
  (window as any).__DSLINK_PRICING__ = livePricingSnapshot;
  (window as any).__DSLINK_GET_PRICE__ = getCentralProductPrice;
  (window as any).__DSLINK_FETCH_PRICING__ = fetchCentralPricing;
  (window as any).__DSLINK_UPDATE_PRICE__ = syncAdminProductPriceToServer;

  // Hydrate immediately from server on startup
  fetchCentralPricing(true);

  window.addEventListener('storage', (ev) => {
    if (ev.key === PRICING_STORAGE_KEY && ev.newValue) {
      try {
        const parsed = mergePricingSnapshot(JSON.parse(ev.newValue));
        livePricingSnapshot = parsed;
        (window as any).__DSLINK_PRICING__ = parsed;
        window.dispatchEvent(new CustomEvent(PRICING_UPDATED_EVENT, { detail: parsed }));
      } catch {
        // ignore
      }
    }
  });
}

export function useCentralPricing() {
  const [pricing, setPricing] = useState<CentralPricingSnapshot>(() => getCachedCentralPricing());
  const [loading, setLoading] = useState<boolean>(!hasFetchedInitialPricing);

  useEffect(() => {
    let active = true;
    fetchCentralPricing().then((snap) => {
      if (active) {
        setPricing(snap);
        setLoading(false);
      }
    });

    const handleUpdate = (ev: Event) => {
      const detail = (ev as CustomEvent<CentralPricingSnapshot>).detail;
      if (detail) {
        setPricing(detail);
      } else {
        setPricing(getCachedCentralPricing());
      }
    };

    window.addEventListener(PRICING_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(PRICING_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  const refreshPricing = useCallback(async () => {
    setLoading(true);
    const snap = await fetchCentralPricing(true);
    setPricing(snap);
    setLoading(false);
    return snap;
  }, []);

  const getPrice = useCallback(
    (productId: string, fallback?: number) => {
      const direct = pricing.products[productId];
      if (direct && Number.isFinite(direct.price)) return direct.price;
      return getCentralProductPrice(productId, fallback);
    },
    [pricing]
  );

  return {
    pricing,
    loading,
    refreshPricing,
    getPrice,
    rentalKitPrice: pricing.products['starlink-rental-kit']?.price ?? 3000,
    standard4xPrice: pricing.products['starlink-standard-4x']?.price ?? 41500,
    miniKitPrice: pricing.products['starlink-mini-kit']?.price ?? 21500,
  };
}
