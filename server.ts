import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import fs from "fs";
import os from "os";
import crypto from "crypto";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  doc,
  setDoc,
  setLogLevel,
  terminate,
  type Firestore,
} from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };
import {
  GSC_VERIFICATION_CODE,
  buildDomainHtmlDocument,
  generateRobotsTxt,
  generateSitemapXml,
  resolveDomainFromRequest,
} from "./src/lib/domainConfig";
import {
  CentralPricingSnapshot,
  createDefaultPricingSnapshot,
} from "./src/lib/pricingConfig";
import {
  INTERNATIONAL_SHIPPING_FEE_BDT,
  SHIPPING_COUNTRIES,
  calculateShipping,
  getCarriersForCountry,
  getCountryConfig,
  isCODAvailable,
  isCarrierSupported,
  normalizeCountryCode,
} from "./src/lib/shippingConfig";
import {
  convertFromBdt,
  getFallbackRatesMap,
  normalizeCurrencyCode,
} from "./src/lib/currencyConfig";
import { normalizeValidIsoCountry } from "./src/lib/heroGeoCopy";
import {
  isKnownSiteRoute,
  isPrivateOrNonIndexablePath,
  parseLocalePath,
} from "./src/lib/localeRouting";
import {
  createStripeCheckoutSessionForOrder,
  createStripeCheckoutSessionForPaymentRequest,
  generateOrderAccessToken,
  handleVerifiedStripeWebhook,
  isStripeConfiguredAndEnabled,
  isStripeEnabled,
} from "./src/lib/stripeServer";
import {
  EXACT_BANGLA_QR_IMAGE_URL,
  VERIFIED_BANGLA_QR_MERCHANT_ID,
  VERIFIED_BANGLA_QR_MERCHANT_NAME,
  VERIFIED_BANGLA_QR_PHONE,
  buildPaymentRequestShareMessage,
  buildWhatsAppShareUrl,
  formatPayAmount,
  type DSLinkPayBankTransferConfig,
  type DSLinkPayConfigDiagnostics,
  type DSLinkPayCurrency,
  type DSLinkPayDraftSummaryAdmin,
  type DSLinkPayEmailJob,
  type DSLinkPayMethod,
  type DSLinkPayRentalBreakdown,
  type DSLinkPayRequestAdmin,
  type DSLinkPayRequestPublic,
  type DSLinkPayStatus,
  type DSLinkPayType,
} from "./src/lib/dslinkPayConfig";
import {
  DEFAULT_BDT_TO_USD_RATE,
  DEFAULT_RENTAL_SHIPPING_FEE_BDT,
  RENTAL_SUBSCRIPTION_PLANS,
  computeEligibleMethodsForPaymentRequest,
  evaluateCheckoutEligibility,
  roundCurrencyAmount,
  toMinorUnits,
  type DSLinkPricingAndShippingRulesConfig,
  type EvaluatedCartLine,
  type RentalActivationCollectionRule,
} from "./src/lib/dslinkPayRules";

// Suppress internal @firebase/firestore gRPC retry chatter in Node.js
setLogLevel("silent");

const firebaseApp = initializeApp(firebaseConfig);
const configuredFirestoreDatabaseId =
  typeof (firebaseConfig as any).firestoreDatabaseId === "string" &&
  (firebaseConfig as any).firestoreDatabaseId.trim()
    ? (firebaseConfig as any).firestoreDatabaseId.trim()
    : "(default)";

let firestoreDbInstance: Firestore | null = null;
let firestoreAvailability: "unknown" | "available" | "unavailable" = "unknown";
let firestoreProbePromise: Promise<Firestore | null> | null = null;

const disableFirestoreGracefully = (reason: string) => {
  if (firestoreAvailability !== "unavailable") {
    firestoreAvailability = "unavailable";
    console.info(
      `[Firestore] Server-side Firestore disabled (${reason}); using local persistent store.`
    );
  }
  const activeDb = firestoreDbInstance;
  firestoreDbInstance = null;
  if (activeDb) {
    terminate(activeDb).catch(() => {});
  }
};

const isFirestoreUnavailableError = (err: any): boolean => {
  const code = String(err?.code || "").toLowerCase();
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    code === "not-found" ||
    code === "unavailable" ||
    code === "failed-precondition" ||
    msg.includes("5 not_found") ||
    msg.includes("does not exist") ||
    msg.includes("econnreset")
  );
};

const getActiveFirestoreDb = async (): Promise<Firestore | null> => {
  if (firestoreAvailability === "unavailable") return null;
  if (firestoreAvailability === "available" && firestoreDbInstance) {
    return firestoreDbInstance;
  }
  if (firestoreProbePromise) return firestoreProbePromise;

  firestoreProbePromise = (async () => {
    try {
      const projectId = (firebaseConfig as any)?.projectId;
      const apiKey = (firebaseConfig as any)?.apiKey;
      if (!projectId || !apiKey) {
        disableFirestoreGracefully("missing projectId/apiKey");
        return null;
      }

      // Lightweight HTTPS probe prevents Node.js @firebase/firestore from opening a
      // doomed gRPC Listen stream when the target Firestore database is not provisioned.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2500);
      const probeUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        projectId
      )}/databases/${encodeURIComponent(
        configuredFirestoreDatabaseId
      )}/documents/products?pageSize=1&key=${encodeURIComponent(apiKey)}`;

      const resp = await fetch(probeUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (resp.status === 404) {
        const bodyText = await resp.text().catch(() => "");
        if (
          bodyText.toLowerCase().includes("does not exist") ||
          bodyText.toLowerCase().includes("not_found")
        ) {
          disableFirestoreGracefully(
            `database ${configuredFirestoreDatabaseId} not found in ${projectId}`
          );
          return null;
        }
      }

      // 200 OK or 403 PERMISSION_DENIED both confirm the Firestore database exists
      if (resp.ok || resp.status === 403) {
        firestoreDbInstance = getFirestore(firebaseApp, configuredFirestoreDatabaseId);
        firestoreAvailability = "available";
        return firestoreDbInstance;
      }

      disableFirestoreGracefully(`probe HTTP ${resp.status}`);
      return null;
    } catch (err: any) {
      disableFirestoreGracefully(err?.message || "probe error");
      return null;
    } finally {
      firestoreProbePromise = null;
    }
  })();

  return firestoreProbePromise;
};

const LOCAL_STORE_PATH = path.join(os.tmpdir(), "dslink-server-store.json");

// Exact approved Bengali voiceover script (Standard 4X = ৳41,500)
const APPROVED_VOICEOVER_SCRIPT =
  "DSLINK থেকে Starlink Standard 4X Kit কিনুন মাত্র একচল্লিশ হাজার পাঁচশ টাকায়। অর্ডার ও ডেলিভারি জানতে WhatsApp-এ মেসেজ দিন।";

let cachedVoiceoverBase64: string | null = null;

// In-memory stores (merged with Firestore where available; never deletes existing orders)
const inMemoryOrders: any[] = [];
const inMemoryInquiries: any[] = [];
interface ServerCheckoutDraft {
  draftId: string;
  checkoutIdempotencyKey?: string;
  customerName: string;
  fullName: string;
  customerPhone: string;
  phone: string;
  customerEmail: string;
  email: string;
  address: string;
  district: string;
  shippingAddress: Record<string, any>;
  countryCode: string;
  countryName: string;
  carriers: string[];
  currency: DSLinkPayCurrency;
  isRentalOrder: boolean;
  hasBdResidential: boolean;
  codAvailable: boolean;
  codAdvanceRequiredAmount: number;
  codRemainingOnDeliveryAmount: number;
  rentalBreakdown?: DSLinkPayRentalBreakdown;
  productId: string;
  productName: string;
  kitName: string;
  items: EvaluatedCartLine[];
  quantity: number;
  subtotalBdt: number;
  shippingFeeBdt: number;
  orderTotalBdt: number;
  subtotalAmount: number;
  shippingFeeAmount: number;
  orderTotalAmount: number;
  payableNowAmount: number;
  remainingDueLaterAmount: number;
  displayCurrency: string;
  estimatedConvertedTotal: number;
  status: "draft" | "converted_to_order" | "cancelled";
  finalOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServerPaymentRequestRecord {
  id: string;
  token: string;
  requestRef: string;
  orderId: string;
  draftId?: string;
  paymentType: DSLinkPayType;
  requestedAmountBdt: number;
  requestedAmount: number;
  requestedAmountMinor: number;
  currency: DSLinkPayCurrency;
  eligibleMethods: DSLinkPayMethod[];
  status: DSLinkPayStatus;
  checkoutIdempotencyKey?: string;
  createdBy: string;
  expiresAt: string;
  rentalBreakdown?: DSLinkPayRentalBreakdown;
  codAdvanceRequiredAmount?: number;
  codRemainingOnDeliveryAmount?: number;
  subscriptionPlanId?: string;
  subscriptionPlanName?: string;
  subscriptionBillingPeriod?: string;
  submittedMethod?: DSLinkPayMethod;
  submittedTrxId?: string;
  normalizedTrxId?: string;
  selectedInstitutionId?: string;
  selectedInstitutionName?: string;
  senderHint?: string;
  submittedAt?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  verifiedAmountBdt?: number;
  verifiedAmount?: number;
  rejectionReason?: string;
  cancellationReason?: string;
  revokedReason?: string;
  replacedById?: string;
  note?: string;
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  stripeSessionCreatedAt?: string;
  stripeSessionAttempt?: number;
  stripeExpectedAmountMinor?: number;
  stripeExpectedCurrency?: string;
  stripePaymentIntentId?: string;
  stripePaymentStatus?: string;
  createdAt: string;
  updatedAt: string;
}
const inMemoryCheckoutDrafts: ServerCheckoutDraft[] = [];
const inMemoryPaymentRequests: ServerPaymentRequestRecord[] = [];
const inMemoryEmailJobs: DSLinkPayEmailJob[] = [];
const processedStripeEventIds = new Set<string>();
const serverAuditLogs: Array<{
  id: string;
  action: string;
  actor: string;
  target: string;
  details: Record<string, any>;
  ip: string;
  createdAt: string;
}> = [];

let serverShippingConfig = {
  bangladeshFeeBdt: 0,
  internationalFeeBdt: INTERNATIONAL_SHIPPING_FEE_BDT,
  bangladeshCarriers: ["Steadfast Courier", "Pathao Courier"],
  internationalCarriers: ["DHL Express", "FedEx"],
  blockedCountries: ["KP", "SY", "IR", "CU", "AF"],
  updatedAt: new Date().toISOString(),
};

let serverAnnouncements: Array<{
  id: string;
  title: string;
  message: string;
  active: boolean;
  updatedAt: string;
}> = [
  {
    id: "ann-global-shipping",
    title: "Bangladesh FREE Delivery & Worldwide DHL / FedEx",
    message:
      "FREE delivery & COD across Bangladesh (Steadfast/Pathao). Worldwide shipping ৳2,500 via DHL Express / FedEx (Prepaid).",
    active: true,
    updatedAt: new Date().toISOString(),
  },
];

let serverRoamingPackages: Array<{
  id: string;
  name: string;
  tier: string;
  monthlyPriceBdt: number;
  dataCap: string;
  coverage: string;
  eligibleFor90DayGuarantee: boolean;
  active: boolean;
  description: string;
}> = [
  {
    id: "roam-regional-50gb",
    name: "Starlink Roam Regional 50GB",
    tier: "Regional Roaming",
    monthlyPriceBdt: 7500,
    dataCap: "50 GB / Month (Top-up Available)",
    coverage: "Asia-Pacific & Regional Roaming (Subject to Starlink Regional Policy)",
    eligibleFor90DayGuarantee: true,
    active: true,
    description:
      "Ideal for mobile professionals, field engineers, and cross-border travelers with a purchased Starlink Mini or Standard 4X Kit.",
  },
  {
    id: "roam-unlimited-regional",
    name: "Starlink Roam Unlimited",
    tier: "Unlimited Roaming",
    monthlyPriceBdt: 12000,
    dataCap: "Unlimited Standard Roaming Data",
    coverage: "Regional Land Mobility & Travel (Where Officially Supported)",
    eligibleFor90DayGuarantee: true,
    active: true,
    description:
      "Unlimited portable roaming connectivity for teams, RVs, remote worksites, and purchased kits eligible under DSLink 90-day guarantee.",
  },
  {
    id: "roam-global-priority",
    name: "Starlink Global Priority Roam",
    tier: "Global Enterprise",
    monthlyPriceBdt: 28500,
    dataCap: "Priority High-Speed Global Roaming",
    coverage: "Multi-Continent Priority Roaming (Subject to Local Law & Starlink Availability)",
    eligibleFor90DayGuarantee: true,
    active: true,
    description:
      "High-priority international roaming for NGOs, maritime vessels, media crews, and multinational deployments.",
  },
];

const warrantyRegistrations: Array<{
  id: string;
  kitSerial: string;
  orderId: string;
  kitType: "purchase" | "rental";
  kitModel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  purchaseDate: string;
  expiresAt: string;
  activeRentalAgreement: boolean;
  status: "Active" | "Expired" | "Revoked";
  createdAt: string;
}> = [];

const warrantyClaims: Array<{
  id: string;
  kitSerial: string;
  orderId: string;
  kitType: "purchase" | "rental";
  kitModel: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  issueCategory: string;
  diagnostics: string;
  evidenceFiles: Array<{ name: string; mimeType: string; sizeBytes: number }>;
  status: "Submitted" | "Under Review" | "Approved" | "Replacement Dispatched" | "Rejected";
  replacementTrackingNumber?: string;
  replacementCourier?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}> = [];

const refundClaims: Array<{
  id: string;
  orderId: string;
  kitSerial: string;
  kitType: "purchase" | "rental";
  roamingPackageId: string;
  activationDate: string;
  daysSinceActivation: number;
  countryCode: string;
  restrictionReport: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  evidenceFiles: Array<{ name: string; mimeType: string; sizeBytes: number }>;
  status: "Submitted" | "Under Review" | "Approved" | "Refund Processed" | "Rejected";
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}> = [];

let exchangeRatesCache: {
  base: "BDT";
  rates: Record<string, number>;
  source: "live" | "fallback";
  updatedAt: string;
  fetchedAtMs: number;
} = {
  base: "BDT",
  rates: getFallbackRatesMap(),
  source: "fallback",
  updatedAt: new Date().toISOString(),
  fetchedAtMs: 0,
};

const ALLOWED_EVIDENCE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024; // 5 MB per file

const validateEvidenceList = (rawFiles: unknown): {
  valid: boolean;
  error?: string;
  files: Array<{ name: string; mimeType: string; sizeBytes: number }>;
} => {
  if (!rawFiles) return { valid: true, files: [] };
  if (!Array.isArray(rawFiles)) return { valid: false, error: "Evidence must be an array.", files: [] };
  if (rawFiles.length > 5) return { valid: false, error: "Maximum 5 evidence files allowed.", files: [] };
  const cleaned: Array<{ name: string; mimeType: string; sizeBytes: number }> = [];
  for (const item of rawFiles) {
    if (!item || typeof item !== "object") continue;
    const name = String((item as any).name || "evidence").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
    const mimeType = String((item as any).mimeType || "").toLowerCase().trim();
    const sizeBytes = Number((item as any).sizeBytes) || 0;
    if (!ALLOWED_EVIDENCE_MIMES.has(mimeType)) {
      return {
        valid: false,
        error: `Unsupported evidence file type: ${mimeType}. Allowed: JPG, PNG, WEBP, MP4, WEBM, PDF.`,
        files: [],
      };
    }
    if (sizeBytes < 0 || sizeBytes > MAX_EVIDENCE_BYTES) {
      return {
        valid: false,
        error: `Evidence file "${name}" exceeds the 5 MB limit.`,
        files: [],
      };
    }
    cleaned.push({ name, mimeType, sizeBytes });
  }
  return { valid: true, files: cleaned };
};

const recordAuditLog = (
  action: string,
  actor: string,
  target: string,
  details: Record<string, any>,
  ip = "server"
) => {
  const entry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    action,
    actor,
    target,
    details,
    ip,
    createdAt: new Date().toISOString(),
  };
  serverAuditLogs.unshift(entry);
  if (serverAuditLogs.length > 500) serverAuditLogs.pop();
  return entry;
};

const rateLimitWindows = new Map<string, number[]>();
const rateLimitMutation = (maxPerMinute = 40): express.RequestHandler => (req, res, next) => {
  const ip = String(req.headers["x-forwarded-for"] || req.ip || "local").split(",")[0].trim();
  const key = `${ip}::${req.path}`;
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (rateLimitWindows.get(key) || []).filter((ts) => ts > windowStart);
  if (recent.length >= maxPerMinute) {
    return res.status(429).json({
      success: false,
      error: "Too many requests. Please wait a moment and try again.",
    });
  }
  recent.push(now);
  rateLimitWindows.set(key, recent);
  next();
};

const getLiveExchangeRates = async () => {
  const sixHoursMs = 6 * 60 * 60 * 1000;
  if (exchangeRatesCache.fetchedAtMs && Date.now() - exchangeRatesCache.fetchedAtMs < sixHoursMs) {
    return exchangeRatesCache;
  }
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const resp = await fetch("https://open.er-api.com/v6/latest/BDT", { signal: controller.signal });
    clearTimeout(timer);
    if (resp.ok) {
      const json: any = await resp.json();
      if (json?.rates && typeof json.rates === "object") {
        exchangeRatesCache = {
          base: "BDT",
          rates: { ...getFallbackRatesMap(), ...json.rates, BDT: 1 },
          source: "live",
          updatedAt: new Date().toISOString(),
          fetchedAtMs: Date.now(),
        };
        return exchangeRatesCache;
      }
    }
  } catch {
    // Fallback rates remain active without breaking storefront
  }
  exchangeRatesCache = {
    ...exchangeRatesCache,
    rates: getFallbackRatesMap(),
    source: "fallback",
    fetchedAtMs: Date.now(),
  };
  return exchangeRatesCache;
};

// In-memory store for Facebook Ads / Pixel & CAPI config
let serverFbAdsConfig = {
  pixelId: process.env.VITE_FB_PIXEL_ID || "1841420273874673",
  appId: process.env.VITE_FB_APP_ID || "948271630592814",
  pageId: "104928374650192",
  adAccountId: "act_38492019482",
  campaignName: "DSLINK_Starlink_Standard_4X_BD_41500",
  adSetName: "BD_All_64_Districts_18_55_Tech_ISP",
  capiEnabled: true,
  testEventCode: "TEST84920",
  currency: "BDT",
  productValue: 41500,
  whatsappNumber: "+880 1326-370218",
  domainUrl: "dslink.cyou",
};

const recentCapiEvents: Array<{
  id: string;
  eventName: string;
  eventTime: number;
  value: number;
  currency: string;
  contentName: string;
  fbclid?: string;
  utmCampaign?: string;
  status: string;
}> = [];

// Admin email recipient for all order & site activity notifications via Resend API
const ADMIN_NOTIFICATION_EMAIL = "taksidwalid150@gmail.com";
const AUTHORIZED_ADMIN_EMAILS = new Set([
  "taksidwalid150@gmail.com",
  "artem.berezinsky@gmail.com",
  "sales@devsparksoft.com.bd",
  "admin@devsparksoft.com.bd",
  "admin@dslink.cyou",
]);

// Centralized authoritative server-side pricing store (hydrated from local store & Firestore when available)
const serverPricingCatalog: CentralPricingSnapshot = createDefaultPricingSnapshot();
let hasHydratedPricingFromDb = false;

const loadLocalStore = () => {
  try {
    if (!fs.existsSync(LOCAL_STORE_PATH)) return;
    const raw = fs.readFileSync(LOCAL_STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.orders)) {
      inMemoryOrders.push(...parsed.orders);
    }
    if (Array.isArray(parsed?.checkoutDrafts)) {
      inMemoryCheckoutDrafts.push(...parsed.checkoutDrafts);
    }
    if (Array.isArray(parsed?.paymentRequests)) {
      for (const rawReq of parsed.paymentRequests) {
        if (!rawReq || typeof rawReq !== "object") continue;
        const curr: DSLinkPayCurrency = rawReq.currency === "USD" ? "USD" : "BDT";
        const reqAmt =
          typeof rawReq.requestedAmount === "number" && Number.isFinite(rawReq.requestedAmount)
            ? rawReq.requestedAmount
            : Number(rawReq.requestedAmountBdt || 0);
        inMemoryPaymentRequests.push({
          ...rawReq,
          requestRef: String(rawReq.requestRef || rawReq.orderId || rawReq.draftId || rawReq.id),
          currency: curr,
          requestedAmount: reqAmt,
          requestedAmountMinor:
            typeof rawReq.requestedAmountMinor === "number" && rawReq.requestedAmountMinor > 0
              ? rawReq.requestedAmountMinor
              : toMinorUnits(reqAmt, curr),
        });
      }
    }
    if (Array.isArray(parsed?.emailJobs)) {
      inMemoryEmailJobs.push(...parsed.emailJobs);
    }
    if (Array.isArray(parsed?.inquiries)) {
      inMemoryInquiries.push(...parsed.inquiries);
    }
    if (Array.isArray(parsed?.warrantyRegistrations)) {
      warrantyRegistrations.push(...parsed.warrantyRegistrations);
    }
    if (Array.isArray(parsed?.warrantyClaims)) {
      warrantyClaims.push(...parsed.warrantyClaims);
    }
    if (Array.isArray(parsed?.refundClaims)) {
      refundClaims.push(...parsed.refundClaims);
    }
    if (Array.isArray(parsed?.processedStripeEventIds)) {
      parsed.processedStripeEventIds.forEach((evId: unknown) => {
        if (typeof evId === "string" && evId.trim()) {
          processedStripeEventIds.add(evId.trim());
        }
      });
    }
    if (parsed?.pricingProducts && typeof parsed.pricingProducts === "object") {
      Object.entries(parsed.pricingProducts).forEach(([id, prod]: [string, any]) => {
        if (prod && typeof prod.price === "number" && Number.isFinite(prod.price)) {
          const canonical = serverPricingCatalog.products[id];
          if (canonical) {
            const isLegacyStd4x =
              id === "starlink-standard-4x" &&
              typeof prod.name === "string" &&
              (prod.name.includes("Global Purchase") || prod.name.includes("Standard Kit 4X"));
            serverPricingCatalog.products[id] = {
              ...canonical,
              ...prod,
              id,
              ...(isLegacyStd4x
                ? {
                    name: canonical.name,
                    nameBn: canonical.nameBn,
                    shortName: canonical.shortName,
                    description: canonical.description,
                    descriptionBn: canonical.descriptionBn,
                  }
                : {}),
              // Keep verified local product artwork and variant metadata intact
              image: canonical.image.startsWith("/assets/products/")
                ? canonical.image
                : String(prod.image || canonical.image),
              imageAlt: canonical.imageAlt || prod.imageAlt,
              referencePrice: canonical.referencePrice ?? prod.referencePrice,
              variantLabel: canonical.variantLabel || prod.variantLabel,
              variantType: canonical.variantType || prod.variantType,
            };
          } else {
            serverPricingCatalog.products[id] = { ...prod, id };
          }
        }
      });
    }
  } catch {
    // Ignore corrupt or unreadable temp store and keep canonical defaults
  }
};

const persistLocalStore = () => {
  try {
    const payload = {
      updatedAt: new Date().toISOString(),
      orders: inMemoryOrders.slice(0, 500),
      checkoutDrafts: inMemoryCheckoutDrafts.slice(0, 500),
      paymentRequests: inMemoryPaymentRequests.slice(0, 1000),
      emailJobs: inMemoryEmailJobs.slice(0, 500),
      inquiries: inMemoryInquiries.slice(0, 500),
      warrantyRegistrations: warrantyRegistrations.slice(0, 500),
      warrantyClaims: warrantyClaims.slice(0, 500),
      refundClaims: refundClaims.slice(0, 500),
      processedStripeEventIds: Array.from(processedStripeEventIds).slice(-1000),
      pricingProducts: serverPricingCatalog.products,
    };
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(payload), "utf-8");
  } catch {
    // Non-fatal if temp storage is unavailable
  }
};

loadLocalStore();

const hydratePricingFromFirestore = async () => {
  if (hasHydratedPricingFromDb) return;
  hasHydratedPricingFromDb = true;
  try {
    const activeDb = await getActiveFirestoreDb();
    if (!activeDb) return;

    const snap = await getDocs(collection(activeDb, "products"));
    snap.forEach((docSnap) => {
      const data = docSnap.data() as any;
      const id = docSnap.id;
      const numericPrice = Number(data?.price);
      if (!Number.isFinite(numericPrice) || numericPrice < 0) return;

      // Guard against legacy outdated prices for the 3 core kits if untouched in old DB records
      const legacyOutdatedCorePrices: Record<string, number[]> = {
        "starlink-rental-kit": [0, 2700],
        "starlink-standard-4x": [39999, 40500, 47000, 49500],
        "starlink-mini-kit": [22500, 26500],
      };
      if (legacyOutdatedCorePrices[id]?.includes(Math.round(numericPrice))) {
        return;
      }

      if (serverPricingCatalog.products[id]) {
        const canonical = serverPricingCatalog.products[id];
        const isLegacyStd4x =
          id === "starlink-standard-4x" &&
          typeof data.name === "string" &&
          (data.name.includes("Global Purchase") || data.name.includes("Standard Kit 4X"));
        serverPricingCatalog.products[id] = {
          ...canonical,
          price: Math.round(numericPrice),
          ...(data.name && !isLegacyStd4x ? { name: String(data.name) } : {}),
          ...(typeof data.active === "boolean" ? { active: data.active } : {}),
          ...(Number.isFinite(Number(data.stock)) ? { stock: Number(data.stock) } : {}),
        };
      } else {
        serverPricingCatalog.products[id] = {
          id,
          name: String(data.name || id),
          nameBn: String(data.name || id),
          category: id.includes("rental") ? "rental" : "purchase",
          price: Math.round(numericPrice),
          billingType: id.includes("rental") ? "one-time" : "purchase",
          codEligible: !id.includes("rental"),
          globalDeliveryAvailable: !id.includes("rental"),
          description: String(data.description || ""),
          descriptionBn: String(data.description || ""),
          image: Array.isArray(data.images) && data.images[0] ? String(data.images[0]) : "",
          stock: Number(data.stock) || 10,
          active: data.active !== false,
        };
      }
    });
  } catch (err: any) {
    if (isFirestoreUnavailableError(err)) {
      disableFirestoreGracefully(err?.message || "hydration failed");
    }
  }
};

const resolveAuthoritativeProduct = (productId?: string, productName?: string) => {
  const idClean = String(productId || "").trim().toLowerCase();
  const nameClean = String(productName || "").trim().toLowerCase();

  if (idClean && serverPricingCatalog.products[idClean]) {
    return serverPricingCatalog.products[idClean];
  }
  if (idClean.includes("rental") || nameClean.includes("rental")) {
    return serverPricingCatalog.products["starlink-rental-kit"];
  }
  const isBdResidentialHint =
    idClean.includes("bd-residential") ||
    idClean.includes("bangladesh-residential") ||
    nameClean.includes("bangladesh residential") ||
    nameClean.includes("bd residential");

  if (
    idClean.includes("mini") ||
    (nameClean.includes("mini") && !nameClean.includes("router"))
  ) {
    if (isBdResidentialHint && serverPricingCatalog.products["starlink-mini-bd-residential"]) {
      return serverPricingCatalog.products["starlink-mini-bd-residential"];
    }
    return serverPricingCatalog.products["starlink-mini-kit"];
  }
  if (
    idClean.includes("standard") ||
    nameClean.includes("standard") ||
    nameClean.includes("4x")
  ) {
    if (
      isBdResidentialHint &&
      serverPricingCatalog.products["starlink-standard-4x-bd-residential"]
    ) {
      return serverPricingCatalog.products["starlink-standard-4x-bd-residential"];
    }
    return serverPricingCatalog.products["starlink-standard-4x"];
  }
  if (idClean.includes("high-performance") || nameClean.includes("high performance")) {
    return serverPricingCatalog.products["starlink-high-performance"];
  }
  const byName = Object.values(serverPricingCatalog.products).find(
    (p) => p.name.toLowerCase() === nameClean || p.id.toLowerCase() === idClean
  );
  return byName || serverPricingCatalog.products["starlink-standard-4x"];
};

const isAuthorizedAdminRequest = (req: express.Request): boolean => {
  const adminEmail = String(req.headers["x-admin-email"] || req.body?.adminEmail || "")
    .trim()
    .toLowerCase();
  if (adminEmail && AUTHORIZED_ADMIN_EMAILS.has(adminEmail)) {
    return true;
  }
  const envSecret = process.env.ADMIN_API_SECRET;
  const reqSecret = String(req.headers["x-admin-secret"] || "").trim();
  if (envSecret && reqSecret && reqSecret === envSecret) {
    return true;
  }
  return false;
};

const escapeEmailHtml = (val: unknown): string =>
  String(val ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getDhakaTimestamp = (): string =>
  new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "medium",
  });

const sendResendEmailSafe = async (params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("[Resend] RESEND_API_KEY is not configured in server environment; skipping outbound email.");
    return { data: null, error: null, skipped: true };
  }
  const resend = new Resend(resendApiKey);
  const recipients = Array.isArray(params.to) ? params.to : [params.to];
  const primaryFrom = process.env.SENDER_EMAIL
    ? `DSLINK Starlink <${process.env.SENDER_EMAIL}>`
    : "DSLINK Starlink <onboarding@resend.dev>";

  const firstAttempt = await resend.emails.send({
    from: primaryFrom,
    to: recipients,
    subject: params.subject,
    html: params.html,
    ...(params.replyTo && params.replyTo.includes("@")
      ? { replyTo: params.replyTo }
      : {}),
  });

  if (firstAttempt?.error && primaryFrom !== "DSLINK Starlink <onboarding@resend.dev>") {
    console.warn(
      "[Resend] Primary sender failed, retrying with onboarding@resend.dev:",
      firstAttempt.error
    );
    return resend.emails.send({
      from: "DSLINK Starlink <onboarding@resend.dev>",
      to: recipients,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo && params.replyTo.includes("@")
        ? { replyTo: params.replyTo }
        : {}),
    });
  }

  return firstAttempt;
};

const buildAdminNotificationHtml = (opts: {
  badge: string;
  heading: string;
  summary?: string;
  rows: Array<{ label: string; value: string; highlight?: boolean }>;
}): string => {
  const rowsHtml = opts.rows
    .filter((r) => r.value !== "")
    .map(
      (r) => `
        <tr style="border-bottom: 1px solid #1e293b;">
          <td style="padding: 10px 14px; color: #94a3b8; width: 38%; vertical-align: top;">${escapeEmailHtml(r.label)}</td>
          <td style="padding: 10px 14px; color: ${r.highlight ? "#38bdf8" : "#f8fafc"}; font-weight: ${r.highlight ? "700" : "500"}; word-break: break-word;">${escapeEmailHtml(r.value)}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #070b14; color: #f8fafc; padding: 24px; border-radius: 10px; border: 1px solid #1e293b; max-width: 620px; margin: 0 auto;">
      <div style="font-size: 11px; font-family: monospace; letter-spacing: 1.5px; text-transform: uppercase; color: #38bdf8; margin-bottom: 6px;">
        ${escapeEmailHtml(opts.badge)} · DSLINK / DEV SPARK SOFT LIMITED
      </div>
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #ffffff;">${escapeEmailHtml(opts.heading)}</h2>
      ${opts.summary ? `<p style="margin: 0 0 18px 0; font-size: 14px; color: #cbd5e1; line-height: 1.5;">${escapeEmailHtml(opts.summary)}</p>` : ""}
      <table style="width: 100%; border-collapse: collapse; background: #0f172a; border-radius: 8px; overflow: hidden; font-size: 13px;">
        ${rowsHtml}
        <tr>
          <td style="padding: 10px 14px; color: #94a3b8;">Time (BD)</td>
          <td style="padding: 10px 14px; color: #cbd5e1;">${escapeEmailHtml(getDhakaTimestamp())}</td>
        </tr>
      </table>
      <p style="margin: 16px 0 0 0; font-size: 11px; color: #64748b;">
        Automated alert from DSLink (dslink.cyou / devsparksoft.com.bd) via Resend API
      </p>
    </div>
  `;
};

// Deduplication trackers to prevent duplicate Resend emails from rapid retries/double-fires
const recentOrderEmailCache = new Map<string, number>();
const recentActivityEmailCache = new Map<string, number>();

async function startServer() {
  const app = express();
  const PORT = 3000;

  let onDSLinkPayRequestPaidViaStripe:
    | ((
        reqRec: ServerPaymentRequestRecord,
        order: any,
        paymentRef: string
      ) => Promise<any> | any)
    | null = null;

  // Stripe Webhook MUST receive the untouched raw Buffer body BEFORE express.json() parses requests
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json", limit: "2mb" }),
    async (req, res) => {
      const signatureHeader =
        typeof req.headers["stripe-signature"] === "string"
          ? req.headers["stripe-signature"]
          : undefined;
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body || {}));

      const result = await handleVerifiedStripeWebhook({
        rawBody,
        signatureHeader,
        processedEventIds: processedStripeEventIds,
        findPaymentRequest: (paymentRequestId, sessionId) =>
          inMemoryPaymentRequests.find(
            (r) =>
              (paymentRequestId && r.id === paymentRequestId) ||
              (sessionId && r.stripeSessionId === sessionId)
          ),
        findOrder: (orderId, sessionId) =>
          inMemoryOrders.find(
            (o) =>
              (orderId && o.orderId === orderId) ||
              (sessionId && o.stripeSessionId === sessionId)
          ),
        onPaymentRequestPaid: async (paymentReq, order, session) => {
          const matchedReq = inMemoryPaymentRequests.find((r) => r.id === paymentReq.id);
          if (!matchedReq) return undefined;
          const paymentRef =
            typeof session.payment_intent === "string" && session.payment_intent.trim()
              ? session.payment_intent.trim()
              : session.id;
          if (onDSLinkPayRequestPaidViaStripe) {
            return await onDSLinkPayRequestPaidViaStripe(matchedReq, order, paymentRef);
          }
          return order;
        },
        onPersist: async (order, eventId, action) => {
          persistLocalStore();
          recordAuditLog(
            `stripe_webhook_${action}`,
            "stripe_webhook",
            order?.orderId || eventId,
            {
              eventId,
              action,
              paymentStatus: order?.paymentStatus,
              stripeSessionId: order?.stripeSessionId,
            },
            "stripe"
          );
          if (order) {
            const activeDb = await getActiveFirestoreDb();
            if (activeDb) {
              try {
                await setDoc(doc(activeDb, "orders", order.orderId), order, { merge: true });
              } catch (dbErr: any) {
                if (isFirestoreUnavailableError(dbErr)) {
                  disableFirestoreGracefully(dbErr?.message || "stripe webhook persist failed");
                }
              }
            }
          }
        },
      });

      return res.status(result.httpStatus).json(result);
    }
  );

  app.use(express.json({ limit: "5mb" }));

  // Trusted platform/edge IP geolocation resolver (country-level only; never collects, caches, or returns raw IPs).
  const VARY_GEO_HEADERS =
    "cf-ipcountry, x-vercel-ip-country, x-appengine-country, cloudfront-viewer-country, fastly-client-country, x-country-code";

  // Helper kept strictly for existing admin audit log compatibility (not used for geo personalization)
  const extractClientIp = (req: express.Request): string => {
    const xff = req.headers["x-forwarded-for"];
    const rawList = Array.isArray(xff) ? xff.join(",") : xff || "";
    const first = rawList.split(",")[0]?.trim() || "";
    return first || "server";
  };

  const resolveVisitorCountryFromRequest = (req: express.Request): {
    countryCode: string | null;
    source: string;
  } => {
    // Allow explicit test override in dev/preview via ?country= or x-test-country header
    const isProdRuntime = process.env.NODE_ENV === "production";
    if (!isProdRuntime || req.headers["x-test-country"] || typeof req.query.country === "string") {
      if (typeof req.query.country === "string") {
        const valid = normalizeValidIsoCountry(req.query.country);
        return {
          countryCode: valid,
          source: valid ? "query_simulation" : "invalid_default",
        };
      }
      const testHeader = Array.isArray(req.headers["x-test-country"])
        ? req.headers["x-test-country"][0]
        : (req.headers["x-test-country"] as string | undefined);
      if (typeof testHeader === "string" && testHeader.trim() !== "") {
        const valid = normalizeValidIsoCountry(testHeader);
        return {
          countryCode: valid,
          source: valid ? "test_header" : "invalid_default",
        };
      }
    }

    const trustedHeaders: Array<[string, string | string[] | undefined]> = [
      ["cf-ipcountry", req.headers["cf-ipcountry"]],
      ["x-vercel-ip-country", req.headers["x-vercel-ip-country"]],
      ["x-appengine-country", req.headers["x-appengine-country"]],
      ["cloudfront-viewer-country", req.headers["cloudfront-viewer-country"]],
      ["fastly-client-country", req.headers["fastly-client-country"]],
      ["x-country-code", req.headers["x-country-code"]],
    ];

    for (const [headerName, raw] of trustedHeaders) {
      const value = Array.isArray(raw) ? raw[0] : raw;
      if (typeof value === "string" && value.trim() !== "") {
        const valid = normalizeValidIsoCountry(value);
        if (valid) {
          return {
            countryCode: valid,
            source: `edge_header:${headerName}`,
          };
        }
        return {
          countryCode: null,
          source: `invalid_header:${headerName}`,
        };
      }
    }

    return {
      countryCode: null,
      source: "unavailable",
    };
  };

  // Helper to resolve domain from incoming Express request
  const getRequestDomain = (req: express.Request) => {
    const rawHost =
      (req.headers["x-forwarded-host"] as string) ||
      req.headers.host ||
      req.hostname ||
      "";
    const queryDomain = typeof req.query.domain === "string" ? req.query.domain : "";
    return resolveDomainFromRequest(rawHost, req.path, queryDomain);
  };

  // Set X-Robots-Tag header for public vs private/checkout/admin routes
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (isPrivateOrNonIndexablePath(req.path)) {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
    } else {
      res.setHeader(
        "X-Robots-Tag",
        "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
      );
    }
    next();
  });

  // Canonical 301 redirects for non-canonical locale aliases (/en -> /, /zh-cn -> /zh-hans)
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    if (req.path.startsWith("/api/") || req.path.startsWith("/assets/")) return next();
    const parsed = parseLocalePath(req.path);
    if (parsed.canonicalRedirectPath && parsed.canonicalRedirectPath !== req.path) {
      const queryIndex = req.originalUrl.indexOf("?");
      const qs = queryIndex >= 0 ? req.originalUrl.slice(queryIndex) : "";
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.redirect(301, `${parsed.canonicalRedirectPath}${qs}`);
    }
    next();
  });

  // Google Search Console HTML file verification for both domains
  app.get(`/${GSC_VERIFICATION_CODE}.html`, (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(`google-site-verification: ${GSC_VERIFICATION_CODE}.html`);
  });

  // Domain-aware robots.txt
  app.get("/robots.txt", (req, res) => {
    const domain = getRequestDomain(req);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(generateRobotsTxt(domain));
  });

  // Domain-aware sitemap.xml
  app.get("/sitemap.xml", (req, res) => {
    const domain = getRequestDomain(req);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(generateSitemapXml(domain));
  });

  // SEO Verification API endpoint for automated inspection
  app.get("/api/seo-verify", (req, res) => {
    const domain = getRequestDomain(req);
    res.json({
      status: "ok",
      httpStatus: 200,
      resolvedDomain: domain,
      canonicalUrl: `https://${domain}/`,
      robotsTxtUrl: `https://${domain}/robots.txt`,
      sitemapXmlUrl: `https://${domain}/sitemap.xml`,
      gscVerificationFile: `https://${domain}/${GSC_VERIFICATION_CODE}.html`,
      robotsDirective: "index, follow",
      noindexPresent: false,
      crossDomainRedirect: false,
    });
  });

  // Country-level geolocation endpoint (no raw IP stored or returned; bypasses shared cache)
  app.get("/api/geo", (req, res) => {
    const visitorCountry = resolveVisitorCountryFromRequest(req);
    res.setHeader("Cache-Control", "private, no-store, max-age=0");
    res.setHeader("Vary", VARY_GEO_HEADERS);
    res.json({
      success: true,
      countryCode: visitorCountry.countryCode,
      source: visitorCountry.source,
    });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Public safe payment & checkout rules configuration (never exposes secrets; stripeEnabled defaults to false)
  app.get("/api/payments/config", (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const rentalShippingFeeBdt = Math.max(
      0,
      Math.round(
        Number(process.env.DSLINK_RENTAL_SHIPPING_FEE_BDT ?? DEFAULT_RENTAL_SHIPPING_FEE_BDT) ||
          DEFAULT_RENTAL_SHIPPING_FEE_BDT
      )
    );
    const rentalActivationCollectionRule: RentalActivationCollectionRule =
      String(process.env.DSLINK_RENTAL_ACTIVATION_RULE || "upfront").trim().toLowerCase() ===
      "on_activation"
        ? "on_activation"
        : "upfront";
    const codAdvanceBdt = Math.max(0, Math.round(Number(process.env.DSLINK_COD_ADVANCE_BDT || 0) || 0));
    const parsedUsdRate = Number(process.env.DSLINK_USD_RATE);
    const bdtToUsdRate =
      Number.isFinite(parsedUsdRate) && parsedUsdRate > 0 ? parsedUsdRate : DEFAULT_BDT_TO_USD_RATE;
    const rawIntlUsd = process.env.DSLINK_INTL_SHIPPING_USD;
    const parsedIntlUsd =
      rawIntlUsd !== undefined && String(rawIntlUsd).trim() !== "" ? Number(rawIntlUsd) : null;
    const internationalShippingUsd =
      typeof parsedIntlUsd === "number" && Number.isFinite(parsedIntlUsd) && parsedIntlUsd >= 0
        ? roundCurrencyAmount(parsedIntlUsd, "USD")
        : roundCurrencyAmount(serverShippingConfig.internationalFeeBdt * bdtToUsdRate, "USD");

    return res.json({
      success: true,
      stripeEnabled: isStripeEnabled(),
      stripeConfigured: isStripeConfiguredAndEnabled(),
      rules: {
        bangladeshPurchaseShippingBdt: serverShippingConfig.bangladeshFeeBdt,
        bangladeshRentalShippingBdt: rentalShippingFeeBdt,
        internationalShippingBdt: serverShippingConfig.internationalFeeBdt,
        internationalShippingUsd,
        bdtToUsdRate,
        rentalActivationCollectionRule,
        codAdvanceBdt,
        blockedCountries: serverShippingConfig.blockedCountries,
      },
      rentalPlans: RENTAL_SUBSCRIPTION_PLANS,
    });
  });

  // Stripe-Hosted Checkout Session Creation (rejected BEFORE any Stripe API call when STRIPE_ENABLED !== "true")
  app.post("/api/stripe/create-checkout-session", rateLimitMutation(20), async (req, res) => {
    // Enforce hard kill-switch immediately before any Stripe SDK initialization or API call
    if (!isStripeEnabled()) {
      return res.status(403).json({
        success: false,
        error: "Stripe Checkout is currently disabled.",
      });
    }

    const orderId = String(req.body?.orderId || "").trim();
    if (!orderId) {
      return res.status(400).json({ success: false, error: "orderId is required." });
    }

    const order = inMemoryOrders.find((o) => o.orderId === orderId);
    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https").split(",")[0].trim();
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "devsparksoft.com.bd")
      .split(",")[0]
      .trim();
    const origin = `${proto}://${host}`;

    const result = await createStripeCheckoutSessionForOrder({
      order,
      origin,
      auth: {
        accessToken: String(req.body?.orderAccessToken || req.headers["x-order-token"] || ""),
        email: String(req.body?.email || ""),
        phone: String(req.body?.phone || ""),
        isAdmin: isAuthorizedAdminRequest(req),
      },
      idempotencyKey: String(req.headers["idempotency-key"] || req.body?.idempotencyKey || ""),
      onOrderMutated: async (updatedOrder) => {
        persistLocalStore();
        recordAuditLog(
          "stripe_checkout_session_created",
          updatedOrder.customerEmail || updatedOrder.customerPhone || "customer",
          updatedOrder.orderId,
          {
            stripeSessionId: updatedOrder.stripeSessionId,
            expectedAmountMinor: updatedOrder.stripeExpectedAmountMinor,
            expectedCurrency: updatedOrder.stripeExpectedCurrency,
          },
          extractClientIp(req)
        );
      },
    });

    return res.status(result.httpStatus).json({
      success: result.success,
      ...(result.sessionId ? { sessionId: result.sessionId } : {}),
      ...(result.url ? { url: result.url } : {}),
      ...(result.error ? { error: result.error } : {}),
    });
  });

  // Safe non-PII Order Status Lookup (used by checkout return URLs & tracking; never mutates payment state)
  app.get("/api/orders/:orderId/status", (req, res) => {
    const orderId = String(req.params.orderId || "").trim();
    const order = inMemoryOrders.find((o) => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        paymentStatus: order.paymentStatus,
        fulfillmentStatus: order.fulfillmentStatus || "Pending",
        paymentMethod: order.paymentMethod,
        countryCode: order.countryCode,
        carriers: order.carriers || [],
        productId: order.productId,
        productName: order.productName,
        items: order.items || [],
        subtotal: order.subtotal,
        shippingFee: order.shippingFee,
        totalAmount: order.totalAmount,
        stripePaymentStatus: order.stripePaymentStatus,
        createdAt: order.createdAt,
      },
    });
  });

  // Centralized Pricing API (Single Source of Truth for Frontend, Cart, Checkout & Admin)
  app.get("/api/pricing", async (_req, res) => {
    await hydratePricingFromFirestore();
    res.setHeader("Cache-Control", "no-store");
    res.json({
      success: true,
      pricing: serverPricingCatalog,
    });
  });

  app.put("/api/pricing/:productId", async (req, res) => {
    await hydratePricingFromFirestore();
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({
        success: false,
        error: "Admin authorization required to update pricing.",
      });
    }

    const productId = String(req.params.productId || "").trim();
    if (!productId || productId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(productId)) {
      return res.status(400).json({ success: false, error: "Invalid product ID." });
    }

    const numericPrice = Number(req.body?.price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 5_000_000) {
      return res.status(400).json({ success: false, error: "Invalid price value." });
    }

    const roundedPrice = Math.round(numericPrice);
    const existing = serverPricingCatalog.products[productId];
    const nowIso = new Date().toISOString();

    serverPricingCatalog.products[productId] = existing
      ? {
          ...existing,
          price: roundedPrice,
          ...(req.body?.name ? { name: String(req.body.name).slice(0, 140) } : {}),
          ...(req.body?.description ? { description: String(req.body.description).slice(0, 600) } : {}),
          ...(typeof req.body?.active === "boolean" ? { active: req.body.active } : {}),
          ...(Number.isFinite(Number(req.body?.stock)) ? { stock: Math.max(0, Math.round(Number(req.body.stock))) } : {}),
        }
      : {
          id: productId,
          name: String(req.body?.name || productId).slice(0, 140),
          nameBn: String(req.body?.name || productId).slice(0, 140),
          category: productId.includes("rental") ? "rental" : "purchase",
          price: roundedPrice,
          billingType: productId.includes("rental") ? "one-time" : "purchase",
          codEligible: !productId.includes("rental"),
          globalDeliveryAvailable: !productId.includes("rental"),
          description: String(req.body?.description || "").slice(0, 600),
          descriptionBn: String(req.body?.description || "").slice(0, 600),
          image: "",
          stock: Math.max(0, Math.round(Number(req.body?.stock) || 10)),
          active: req.body?.active !== false,
        };

    serverPricingCatalog.version += 1;
    serverPricingCatalog.updatedAt = nowIso;

    if (productId === "starlink-standard-4x") {
      serverFbAdsConfig.productValue = roundedPrice;
    }

    persistLocalStore();

    const activeDb = await getActiveFirestoreDb();
    if (activeDb) {
      try {
        await setDoc(
          doc(activeDb, "products", productId),
          {
            price: roundedPrice,
            name: serverPricingCatalog.products[productId].name,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      } catch (dbErr: any) {
        if (isFirestoreUnavailableError(dbErr)) {
          disableFirestoreGracefully(dbErr?.message || "pricing sync failed");
        }
      }
    }

    res.setHeader("Cache-Control", "no-store");
    return res.json({
      success: true,
      product: serverPricingCatalog.products[productId],
      pricing: serverPricingCatalog,
    });
  });

  // Global Exchange Rates API (6h server cache + resilient fallback)
  app.get("/api/exchange-rates", async (_req, res) => {
    const rates = await getLiveExchangeRates();
    res.setHeader("Cache-Control", "public, max-age=1800");
    return res.json({
      success: true,
      base: rates.base,
      rates: rates.rates,
      source: rates.source,
      updatedAt: rates.updatedAt,
    });
  });

  // Global Shipping Configuration & Country Rules API
  app.get("/api/shipping/config", (_req, res) => {
    const blocked = new Set(serverShippingConfig.blockedCountries);
    const countries = SHIPPING_COUNTRIES.map((c) => ({
      ...c,
      shippingFeeBdt: c.code === "BD" ? serverShippingConfig.bangladeshFeeBdt : serverShippingConfig.internationalFeeBdt,
      carrierAvailable: c.carrierAvailable && !blocked.has(c.code),
    }));
    res.json({
      success: true,
      config: serverShippingConfig,
      countries,
    });
  });

  app.put("/api/shipping/config", rateLimitMutation(30), (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const { internationalFeeBdt, blockedCountries } = req.body || {};
    if (internationalFeeBdt !== undefined) {
      const fee = Number(internationalFeeBdt);
      if (!Number.isFinite(fee) || fee < 0 || fee > 100_000) {
        return res.status(400).json({ success: false, error: "Invalid international shipping fee." });
      }
      serverShippingConfig.internationalFeeBdt = Math.round(fee);
    }
    if (Array.isArray(blockedCountries)) {
      serverShippingConfig.blockedCountries = blockedCountries
        .map((c: unknown) => normalizeCountryCode(String(c)))
        .filter((c: string) => c !== "BD");
    }
    serverShippingConfig.updatedAt = new Date().toISOString();
    recordAuditLog(
      "shipping_config_updated",
      String(req.headers["x-admin-email"] || "admin"),
      "shipping_config",
      serverShippingConfig,
      extractClientIp(req)
    );
    return res.json({ success: true, config: serverShippingConfig });
  });

  // Delivery Inquiry Endpoint for Destinations Without Standard DHL/FedEx Support
  app.post("/api/shipping/inquiry", rateLimitMutation(20), async (req, res) => {
    try {
      const {
        fullName = "",
        email = "",
        phone = "",
        countryCode = "",
        city = "",
        productId = "starlink-standard-4x",
        notes = "",
      } = req.body || {};
      if (!String(fullName).trim() || !String(phone).trim() || !String(countryCode).trim()) {
        return res.status(400).json({
          success: false,
          error: "Full name, phone/WhatsApp, and destination country are required.",
        });
      }
      const normalizedCountry = normalizeCountryCode(countryCode);
      const inquiryId = `DLV-${Math.floor(100000 + Math.random() * 900000)}`;
      const record = {
        inquiryId,
        type: "delivery_inquiry",
        fullName: String(fullName).trim().slice(0, 120),
        email: String(email).trim().slice(0, 140),
        phone: String(phone).trim().slice(0, 40),
        countryCode: normalizedCountry,
        countryName: getCountryConfig(normalizedCountry).name,
        city: String(city).trim().slice(0, 100),
        productId: String(productId).trim().slice(0, 80),
        notes: String(notes).trim().slice(0, 1000),
        status: "Pending Logistics Review",
        createdAt: new Date().toISOString(),
      };
      inMemoryInquiries.unshift(record);
      recordAuditLog("delivery_inquiry_submitted", record.email || record.phone, inquiryId, {
        countryCode: normalizedCountry,
        productId: record.productId,
      }, extractClientIp(req));

      // Strict Notification Rule: Only (1) requested password reset and (2) new reseller order submitted send outbound emails.
      return res.json({
        success: true,
        inquiryId,
        inquiry: record,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Inquiry submission failed." });
    }
  });

  // Authoritative Server-Side Order Total & Country-Based Shipping Calculator
  app.post("/api/pricing/calculate", async (req, res) => {
    await hydratePricingFromFirestore();
    const {
      productId,
      productName,
      quantity = 1,
      items,
      countryCode,
      district = "Dhaka",
      currency = "BDT",
    } = req.body || {};

    const resolvedCountry = countryCode
      ? normalizeCountryCode(countryCode)
      : normalizeCountryCode(
          String(district || "").toLowerCase().includes("international") ||
            String(district || "").toLowerCase().includes("worldwide")
            ? "US"
            : "BD"
        );

    const blockedSet = new Set(serverShippingConfig.blockedCountries);
    const carrierAvailable = isCarrierSupported(resolvedCountry) && !blockedSet.has(resolvedCountry);
    const carriers = carrierAvailable ? getCarriersForCountry(resolvedCountry) : [];

    let subtotal = 0;
    let isRental = false;
    let lineItems: Array<{ productId: string; name: string; unitPrice: number; quantity: number; lineTotal: number }> = [];

    if (Array.isArray(items) && items.length > 0) {
      for (const rawItem of items.slice(0, 20)) {
        const qty = Math.min(20, Math.max(1, Math.floor(Number(rawItem?.quantity) || 1)));
        const prod = resolveAuthoritativeProduct(rawItem?.productId, rawItem?.name);
        if (prod.category === "rental") isRental = true;
        const lineTotal = prod.price * qty;
        subtotal += lineTotal;
        lineItems.push({
          productId: prod.id,
          name: prod.name,
          unitPrice: prod.price,
          quantity: qty,
          lineTotal,
        });
      }
    } else {
      const qty = Math.min(50, Math.max(1, Math.floor(Number(quantity) || 1)));
      const product = resolveAuthoritativeProduct(productId, productName);
      isRental = product.category === "rental";
      subtotal = product.price * qty;
      lineItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: product.price,
        quantity: qty,
        lineTotal: subtotal,
      });
    }

    const shippingFee = calculateShipping(resolvedCountry, serverShippingConfig.internationalFeeBdt);
    const codAvailable = isCODAvailable(resolvedCountry, isRental);
    const totalAmount = subtotal + shippingFee;
    const ratesSnap = await getLiveExchangeRates();
    const targetCurrency = normalizeCurrencyCode(currency);
    const converted = convertFromBdt(totalAmount, targetCurrency, ratesSnap.rates);

    res.setHeader("Cache-Control", "no-store");
    return res.json({
      success: true,
      productId: lineItems[0]?.productId || "starlink-standard-4x",
      productName: lineItems[0]?.name || "Starlink Standard Kit 4X (Purchase)",
      unitPrice: lineItems[0]?.unitPrice ?? 41500,
      quantity: lineItems.reduce((s, l) => s + l.quantity, 0),
      items: lineItems,
      countryCode: resolvedCountry,
      countryName: getCountryConfig(resolvedCountry).name,
      carrierAvailable,
      inquiryRequired: !carrierAvailable,
      carriers,
      subtotal,
      shippingFee,
      deliveryFee: shippingFee,
      discount: 0,
      totalAmount,
      currency: "BDT",
      displayCurrency: targetCurrency,
      estimatedConvertedTotal: converted.amount,
      exchangeRate: converted.rate,
      isConvertedEstimate: converted.isEstimate,
      codAvailable,
      paymentPolicy: codAvailable
        ? "COD or Prepaid Available"
        : isRental
        ? "Bangla QR Prepaid Only"
        : "Advance Payment Only (COD Not Available)",
      globalDeliveryAvailable: true,
      monthlySubscriptionSeparate: true,
      pricingVersion: serverPricingCatalog.version,
    });
  });

  // 24-Month DSLink Replacement Warranty APIs (Purchase & Rental Kits)
  app.post("/api/warranty/register", rateLimitMutation(25), async (req, res) => {
    const {
      kitSerial = "",
      orderId = "",
      kitType = "purchase",
      kitModel = "Starlink Standard Kit 4X",
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      purchaseDate = new Date().toISOString().slice(0, 10),
      activeRentalAgreement = false,
    } = req.body || {};

    const cleanSerial = String(kitSerial).trim().toUpperCase();
    if (cleanSerial.length < 5 || cleanSerial.length > 60 || !/^[A-Z0-9_-]+$/.test(cleanSerial)) {
      return res.status(400).json({
        success: false,
        error: "Valid KIT serial number is required (alphanumeric, e.g., KIT00123456).",
      });
    }
    if (!String(customerName).trim() || !String(customerPhone).trim()) {
      return res.status(400).json({ success: false, error: "Customer name and phone are required." });
    }
    const normalizedType = kitType === "rental" ? "rental" : "purchase";
    if (normalizedType === "rental" && !activeRentalAgreement) {
      return res.status(400).json({
        success: false,
        error: "An active DSLink rental agreement is required to register a Rental Kit warranty.",
      });
    }

    const startDate = new Date(purchaseDate);
    const validStart = Number.isNaN(startDate.getTime()) ? new Date() : startDate;
    const expires = new Date(validStart);
    expires.setMonth(expires.getMonth() + 24);

    const record = {
      id: `WRN-${Math.floor(100000 + Math.random() * 900000)}`,
      kitSerial: cleanSerial,
      orderId: String(orderId).trim().slice(0, 40) || "DIRECT",
      kitType: normalizedType as "purchase" | "rental",
      kitModel: String(kitModel).trim().slice(0, 120),
      customerName: String(customerName).trim().slice(0, 120),
      customerEmail: String(customerEmail).trim().slice(0, 140),
      customerPhone: String(customerPhone).trim().slice(0, 40),
      purchaseDate: validStart.toISOString().slice(0, 10),
      expiresAt: expires.toISOString().slice(0, 10),
      activeRentalAgreement: normalizedType === "rental" ? Boolean(activeRentalAgreement) : true,
      status: expires.getTime() >= Date.now() ? ("Active" as const) : ("Expired" as const),
      createdAt: new Date().toISOString(),
    };

    const existingIdx = warrantyRegistrations.findIndex((w) => w.kitSerial === cleanSerial);
    if (existingIdx >= 0) {
      warrantyRegistrations[existingIdx] = record;
    } else {
      warrantyRegistrations.unshift(record);
    }

    recordAuditLog("warranty_registered", record.customerEmail || record.customerPhone, cleanSerial, {
      kitType: normalizedType,
      orderId: record.orderId,
    }, extractClientIp(req));

    return res.json({ success: true, registration: record });
  });

  app.get("/api/warranty/verify/:serial", (req, res) => {
    const cleanSerial = String(req.params.serial || "").trim().toUpperCase();
    const reg = warrantyRegistrations.find((w) => w.kitSerial === cleanSerial);
    if (!reg) {
      return res.status(404).json({
        success: false,
        found: false,
        error: "KIT serial number not found in DSLink warranty registry. Please register your kit first.",
      });
    }
    const expiresMs = new Date(reg.expiresAt).getTime();
    const daysRemaining = Math.max(0, Math.ceil((expiresMs - Date.now()) / (24 * 60 * 60 * 1000)));
    const eligible = reg.status === "Active" && daysRemaining > 0 && (reg.kitType === "purchase" || reg.activeRentalAgreement);
    return res.json({
      success: true,
      found: true,
      eligible,
      daysRemaining,
      warrantyTermMonths: 24,
      providerNotice:
        "24-Month DSLink Replacement Warranty (DEV SPARK SOFT LIMITED) — separate from official SpaceX/Starlink manufacturer warranty.",
      registration: reg,
    });
  });

  app.post("/api/warranty/claims", rateLimitMutation(15), async (req, res) => {
    const {
      kitSerial = "",
      orderId = "",
      kitType = "purchase",
      kitModel = "Starlink Standard Kit 4X",
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      issueCategory = "Hardware Failure",
      diagnostics = "",
      evidenceFiles = [],
    } = req.body || {};

    const cleanSerial = String(kitSerial).trim().toUpperCase();
    if (cleanSerial.length < 5) {
      return res.status(400).json({ success: false, error: "Valid KIT serial number is required." });
    }
    if (!String(customerName).trim() || !String(customerPhone).trim() || !String(diagnostics).trim()) {
      return res.status(400).json({
        success: false,
        error: "Customer name, phone/WhatsApp, and diagnostic details are required.",
      });
    }
    const evidenceCheck = validateEvidenceList(evidenceFiles);
    if (!evidenceCheck.valid) {
      return res.status(400).json({ success: false, error: evidenceCheck.error });
    }

    const claim = {
      id: `WCL-${Math.floor(100000 + Math.random() * 900000)}`,
      kitSerial: cleanSerial,
      orderId: String(orderId).trim().slice(0, 40),
      kitType: (kitType === "rental" ? "rental" : "purchase") as "purchase" | "rental",
      kitModel: String(kitModel).trim().slice(0, 120),
      customerName: String(customerName).trim().slice(0, 120),
      customerEmail: String(customerEmail).trim().slice(0, 140),
      customerPhone: String(customerPhone).trim().slice(0, 40),
      issueCategory: String(issueCategory).trim().slice(0, 100),
      diagnostics: String(diagnostics).trim().slice(0, 2000),
      evidenceFiles: evidenceCheck.files,
      status: "Submitted" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    warrantyClaims.unshift(claim);
    recordAuditLog("warranty_claim_submitted", claim.customerEmail || claim.customerPhone, claim.id, {
      kitSerial: claim.kitSerial,
      kitType: claim.kitType,
      evidenceCount: claim.evidenceFiles.length,
    }, extractClientIp(req));

    return res.json({ success: true, claim });
  });

  app.get("/api/warranty/claims", (req, res) => {
    const serial = String(req.query.serial || "").trim().toUpperCase();
    const email = String(req.query.email || "").trim().toLowerCase();
    const orderId = String(req.query.orderId || "").trim().toUpperCase();

    if (isAuthorizedAdminRequest(req) && !serial && !email && !orderId) {
      return res.json({ success: true, claims: warrantyClaims, registrations: warrantyRegistrations });
    }

    const filtered = warrantyClaims.filter((c) => {
      if (serial && c.kitSerial === serial) return true;
      if (email && c.customerEmail.toLowerCase() === email) return true;
      if (orderId && c.orderId.toUpperCase() === orderId) return true;
      return !serial && !email && !orderId;
    });
    return res.json({ success: true, claims: filtered });
  });

  app.put("/api/warranty/claims/:id", rateLimitMutation(30), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const claim = warrantyClaims.find((c) => c.id === req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: "Warranty claim not found." });

    const { status, replacementTrackingNumber, replacementCourier, adminNotes } = req.body || {};
    const validStatuses = ["Submitted", "Under Review", "Approved", "Replacement Dispatched", "Rejected"];
    if (status && validStatuses.includes(status)) claim.status = status;
    if (replacementTrackingNumber !== undefined) claim.replacementTrackingNumber = String(replacementTrackingNumber).slice(0, 80);
    if (replacementCourier !== undefined) claim.replacementCourier = String(replacementCourier).slice(0, 60);
    if (adminNotes !== undefined) claim.adminNotes = String(adminNotes).slice(0, 600);
    claim.updatedAt = new Date().toISOString();

    recordAuditLog("warranty_claim_updated", String(req.headers["x-admin-email"] || "admin"), claim.id, {
      status: claim.status,
      replacementTrackingNumber: claim.replacementTrackingNumber,
    }, extractClientIp(req));

    return res.json({ success: true, claim });
  });

  // Roaming Packages & 90-Day Roaming Money-Back Guarantee APIs (Purchased Kits + Eligible Roaming Only; Rental Excluded)
  app.get("/api/roaming/packages", (_req, res) => {
    res.json({ success: true, packages: serverRoamingPackages.filter((p) => p.active) });
  });

  app.put("/api/roaming/packages", rateLimitMutation(30), (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const { packages } = req.body || {};
    if (!Array.isArray(packages)) {
      return res.status(400).json({ success: false, error: "Packages array required." });
    }
    serverRoamingPackages = packages.slice(0, 20).map((p: any) => ({
      id: String(p.id || `roam-${Date.now()}`).slice(0, 60),
      name: String(p.name || "Roaming Package").slice(0, 120),
      tier: String(p.tier || "Roaming").slice(0, 60),
      monthlyPriceBdt: Math.max(0, Math.round(Number(p.monthlyPriceBdt) || 0)),
      dataCap: String(p.dataCap || "").slice(0, 120),
      coverage: String(p.coverage || "").slice(0, 200),
      eligibleFor90DayGuarantee: Boolean(p.eligibleFor90DayGuarantee),
      active: p.active !== false,
      description: String(p.description || "").slice(0, 500),
    }));
    recordAuditLog("roaming_packages_updated", String(req.headers["x-admin-email"] || "admin"), "roaming_packages", {
      count: serverRoamingPackages.length,
    }, extractClientIp(req));
    return res.json({ success: true, packages: serverRoamingPackages });
  });

  const evaluate90DayRoamingEligibility = (params: {
    kitType?: string;
    roamingPackageId?: string;
    activationDate?: string;
  }) => {
    const normalizedType = params.kitType === "rental" ? "rental" : "purchase";
    if (normalizedType === "rental") {
      return {
        eligible: false,
        daysSinceActivation: 0,
        reason: "Rental Kits are NOT eligible for the 90-Day Roaming Money-Back Guarantee.",
      };
    }
    const pkg = serverRoamingPackages.find((p) => p.id === params.roamingPackageId && p.eligibleFor90DayGuarantee);
    if (!pkg) {
      return {
        eligible: false,
        daysSinceActivation: 0,
        reason: "A qualifying DSLink Roaming Package is required for the 90-Day Roaming Money-Back Guarantee.",
      };
    }
    const act = new Date(String(params.activationDate || ""));
    if (Number.isNaN(act.getTime())) {
      return {
        eligible: false,
        daysSinceActivation: 0,
        reason: "Please provide a valid roaming activation date.",
      };
    }
    const days = Math.floor((Date.now() - act.getTime()) / (24 * 60 * 60 * 1000));
    if (days < 0) {
      return { eligible: false, daysSinceActivation: days, reason: "Activation date cannot be in the future." };
    }
    if (days > 90) {
      return {
        eligible: false,
        daysSinceActivation: days,
        reason: `The 90-day guarantee window has elapsed (${days} days since activation).`,
      };
    }
    return {
      eligible: true,
      daysSinceActivation: days,
      daysRemaining: 90 - days,
      roamingPackage: pkg,
      reason: `Eligible (${days} of 90 days elapsed; ${90 - days} days remaining in guarantee window).`,
    };
  };

  app.post("/api/refunds/check-eligibility", (req, res) => {
    const result = evaluate90DayRoamingEligibility(req.body || {});
    return res.json({ success: true, ...result });
  });

  app.post("/api/refunds/claims", rateLimitMutation(15), async (req, res) => {
    const {
      orderId = "",
      kitSerial = "",
      kitType = "purchase",
      roamingPackageId = "",
      activationDate = "",
      countryCode = "MM",
      restrictionReport = "",
      customerName = "",
      customerEmail = "",
      customerPhone = "",
      evidenceFiles = [],
    } = req.body || {};

    const eligibility = evaluate90DayRoamingEligibility({ kitType, roamingPackageId, activationDate });
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        eligible: false,
        error: eligibility.reason,
      });
    }
    if (!String(orderId).trim() || !String(customerName).trim() || !String(customerPhone).trim() || !String(restrictionReport).trim()) {
      return res.status(400).json({
        success: false,
        error: "Order ID, customer details, and country restriction report are required.",
      });
    }
    const evidenceCheck = validateEvidenceList(evidenceFiles);
    if (!evidenceCheck.valid) {
      return res.status(400).json({ success: false, error: evidenceCheck.error });
    }

    const claim = {
      id: `RFD-${Math.floor(100000 + Math.random() * 900000)}`,
      orderId: String(orderId).trim().slice(0, 40),
      kitSerial: String(kitSerial).trim().toUpperCase().slice(0, 60),
      kitType: "purchase" as const,
      roamingPackageId: String(roamingPackageId).trim(),
      activationDate: String(activationDate).trim(),
      daysSinceActivation: eligibility.daysSinceActivation,
      countryCode: normalizeCountryCode(countryCode),
      restrictionReport: String(restrictionReport).trim().slice(0, 2000),
      customerName: String(customerName).trim().slice(0, 120),
      customerEmail: String(customerEmail).trim().slice(0, 140),
      customerPhone: String(customerPhone).trim().slice(0, 40),
      evidenceFiles: evidenceCheck.files,
      status: "Submitted" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    refundClaims.unshift(claim);
    recordAuditLog("roaming_refund_claim_submitted", claim.customerEmail || claim.customerPhone, claim.id, {
      orderId: claim.orderId,
      roamingPackageId: claim.roamingPackageId,
      countryCode: claim.countryCode,
      daysSinceActivation: claim.daysSinceActivation,
    }, extractClientIp(req));

    return res.json({ success: true, claim });
  });

  app.get("/api/refunds/claims", (req, res) => {
    const orderId = String(req.query.orderId || "").trim().toUpperCase();
    const email = String(req.query.email || "").trim().toLowerCase();
    if (isAuthorizedAdminRequest(req) && !orderId && !email) {
      return res.json({ success: true, claims: refundClaims });
    }
    const filtered = refundClaims.filter((c) => {
      if (orderId && c.orderId.toUpperCase() === orderId) return true;
      if (email && c.customerEmail.toLowerCase() === email) return true;
      return !orderId && !email;
    });
    return res.json({ success: true, claims: filtered });
  });

  app.put("/api/refunds/claims/:id", rateLimitMutation(30), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const claim = refundClaims.find((c) => c.id === req.params.id);
    if (!claim) return res.status(404).json({ success: false, error: "Refund claim not found." });
    const { status, adminNotes } = req.body || {};
    const validStatuses = ["Submitted", "Under Review", "Approved", "Refund Processed", "Rejected"];
    if (status && validStatuses.includes(status)) claim.status = status;
    if (adminNotes !== undefined) claim.adminNotes = String(adminNotes).slice(0, 600);
    claim.updatedAt = new Date().toISOString();

    recordAuditLog("roaming_refund_claim_updated", String(req.headers["x-admin-email"] || "admin"), claim.id, {
      status: claim.status,
    }, extractClientIp(req));

    return res.json({ success: true, claim });
  });

  // Admin Announcements, Audit Logs, Overview & Backup Export (RBAC Protected)
  app.get("/api/announcements", (_req, res) => {
    res.json({ success: true, announcements: serverAnnouncements.filter((a) => a.active) });
  });

  app.put("/api/admin/announcements", rateLimitMutation(30), (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const { announcements } = req.body || {};
    if (!Array.isArray(announcements)) {
      return res.status(400).json({ success: false, error: "Announcements array required." });
    }
    serverAnnouncements = announcements.slice(0, 10).map((a: any) => ({
      id: String(a.id || `ann-${Date.now()}`),
      title: String(a.title || "").slice(0, 160),
      message: String(a.message || "").slice(0, 500),
      active: Boolean(a.active),
      updatedAt: new Date().toISOString(),
    }));
    recordAuditLog("announcements_updated", String(req.headers["x-admin-email"] || "admin"), "announcements", {
      count: serverAnnouncements.length,
    }, extractClientIp(req));
    return res.json({ success: true, announcements: serverAnnouncements });
  });

  app.get("/api/admin/audit-logs", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    res.json({ success: true, logs: serverAuditLogs.slice(0, 200) });
  });

  app.get("/api/admin/overview", async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    await hydratePricingFromFirestore();
    res.json({
      success: true,
      counts: {
        orders: inMemoryOrders.length,
        inquiries: inMemoryInquiries.length,
        warrantyRegistrations: warrantyRegistrations.length,
        warrantyClaims: warrantyClaims.length,
        refundClaims: refundClaims.length,
        roamingPackages: serverRoamingPackages.length,
        products: Object.keys(serverPricingCatalog.products).length,
        auditLogs: serverAuditLogs.length,
      },
      shippingConfig: serverShippingConfig,
      announcements: serverAnnouncements,
      roamingPackages: serverRoamingPackages,
      warrantyRegistrations: warrantyRegistrations.slice(0, 100),
      warrantyClaims: warrantyClaims.slice(0, 100),
      refundClaims: refundClaims.slice(0, 100),
      inquiries: inMemoryInquiries.slice(0, 100),
      auditLogs: serverAuditLogs.slice(0, 100),
    });
  });

  app.get("/api/admin/backup", async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    await hydratePricingFromFirestore();
    recordAuditLog("admin_backup_exported", String(req.headers["x-admin-email"] || "admin"), "backup", {}, extractClientIp(req));
    res.setHeader("Content-Disposition", `attachment; filename="dslink-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json({
      exportedAt: new Date().toISOString(),
      pricing: serverPricingCatalog,
      shippingConfig: serverShippingConfig,
      roamingPackages: serverRoamingPackages,
      announcements: serverAnnouncements,
      orders: inMemoryOrders,
      warrantyRegistrations,
      warrantyClaims,
      refundClaims,
      inquiries: inMemoryInquiries,
      auditLogs: serverAuditLogs,
    });
  });

  // Get & Update Facebook SDK + Ads Configuration
  app.get("/api/fb-ads-config", (_req, res) => {
    res.json({
      success: true,
      config: serverFbAdsConfig,
      recentEvents: recentCapiEvents.slice(0, 20),
    });
  });

  // Get all orders (combines Firestore when available + local persistent orders)
  app.get("/api/orders", async (_req, res) => {
    try {
      const activeDb = await getActiveFirestoreDb();
      if (!activeDb) {
        return res.json({
          success: true,
          orders: inMemoryOrders,
          inquiries: inMemoryInquiries,
        });
      }

      const ordersRef = collection(activeDb, "orders");
      const q = query(ordersRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const firestoreOrders = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const existingOrderIds = new Set(
        firestoreOrders.map((o: any) => o.orderId || o.id)
      );
      const mergedOrders = [
        ...inMemoryOrders.filter((o) => !existingOrderIds.has(o.orderId)),
        ...firestoreOrders,
      ];

      res.json({
        success: true,
        orders: mergedOrders,
        inquiries: inMemoryInquiries,
      });
    } catch (error: any) {
      if (isFirestoreUnavailableError(error)) {
        disableFirestoreGracefully(error?.message || "orders query failed");
      }
      res.json({
        success: true,
        orders: inMemoryOrders,
        inquiries: inMemoryInquiries,
      });
    }
  });

  app.post("/api/fb-ads-config", (req, res) => {
    const body = req.body || {};
    const authoritativeStdPrice =
      serverPricingCatalog.products["starlink-standard-4x"]?.price ?? 41500;
    serverFbAdsConfig = {
      ...serverFbAdsConfig,
      ...body,
      productValue: authoritativeStdPrice,
    };
    res.json({
      success: true,
      config: serverFbAdsConfig,
    });
  });

  // Corporate Inquiry Endpoint (Zero Automatic Notification per Section 7)
  app.post("/api/corporate-inquiry", async (req, res) => {
    try {
      const {
        name = "",
        company = "",
        phone = "",
        email = "",
        service = "Enterprise Software / ERP",
        message = "",
        domain = "devsparksoft.com.bd",
      } = req.body || {};

      const inquiryId = `DSS-${Math.floor(100000 + Math.random() * 900000)}`;
      const record = {
        inquiryId,
        name,
        company,
        phone,
        email,
        service,
        message,
        domain,
        createdAt: new Date().toISOString(),
      };

      inMemoryInquiries.unshift(record);

      return res.json({
        success: true,
        inquiryId,
        message: "Corporate inquiry registered",
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err?.message || "Failed to process corporate inquiry",
      });
    }
  });

  // Activity Endpoint — disabled per Section 7 (Zero automatic notifications)
  app.post("/api/activity-notify", async (_req, res) => {
    return res.json({ success: true, disabledByNotificationPolicy: true });
  });

  // Support Ticket Submission Endpoint — Saves to store without automatic email
  app.post("/api/support/submit-ticket", async (req, res) => {
    try {
      const body = req.body || {};
      const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
      const record = {
        inquiryId: ticketId,
        type: "support_ticket",
        name: body.name || body.customerName || "Website Visitor",
        phone: body.phone || body.mobile || "",
        email: body.email || "",
        subject: body.subject || body.issueType || "Support Request",
        message: body.message || body.description || "",
        orderId: body.orderId || "",
        createdAt: new Date().toISOString(),
      };

      inMemoryInquiries.unshift(record);

      return res.json({
        success: true,
        ticketId,
        message: "Support ticket submitted successfully",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Failed to submit ticket" });
    }
  });

  // Sponsor / WhatsApp Comment Submission Endpoint — Saves without automatic email
  app.post("/api/sponsor-comments", async (req, res) => {
    try {
      const { name = "", email = "", whatsappNumber = "", comment = "" } = req.body || {};
      const commentId = `MSG-${Math.floor(100000 + Math.random() * 900000)}`;
      inMemoryInquiries.unshift({
        inquiryId: commentId,
        type: "sponsor_comment",
        name,
        email,
        phone: whatsappNumber,
        message: comment,
        createdAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        id: commentId,
        message: "ধন্যবাদ! আপনার তথ্য সফলভাবে জমা হয়েছে।",
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Submission failed" });
    }
  });

  // Main Checkout Order Invoice Endpoint (Saves order without automatic outbound email per Section 7)
  app.post("/api/invoices/process-order", rateLimitMutation(30), async (req, res) => {
    try {
      await hydratePricingFromFirestore();
      const order = req.body?.order || req.body || {};
      const orderId = order.orderId || order.id || `DS-${Math.floor(100000 + Math.random() * 900000)}`;
      const resolvedCountry = order.countryCode
        ? normalizeCountryCode(order.countryCode)
        : normalizeCountryCode(
            String(order.district || "").toLowerCase().includes("international") ||
              String(order.district || "").toLowerCase().includes("worldwide")
              ? "US"
              : "BD"
          );
      const blockedSet = new Set(serverShippingConfig.blockedCountries);
      const carrierAvailable = isCarrierSupported(resolvedCountry) && !blockedSet.has(resolvedCountry);
      if (!carrierAvailable) {
        return res.status(400).json({
          success: false,
          inquiryRequired: true,
          error: `Direct DHL/FedEx checkout is unavailable for ${getCountryConfig(resolvedCountry).name}. Please submit a Delivery Inquiry.`,
        });
      }

      const qty = Math.min(50, Math.max(1, Math.floor(Number(order.quantity) || 1)));
      const matchedProduct = resolveAuthoritativeProduct(
        order.productId,
        order.kitName || order.productName
      );
      const authoritativeUnitPrice = matchedProduct.price;
      const subtotal = authoritativeUnitPrice * qty;
      const isRental = matchedProduct.category === "rental";
      const shippingFee = calculateShipping(resolvedCountry, serverShippingConfig.internationalFeeBdt);
      const codAvailable = isCODAvailable(resolvedCountry, isRental);
      const authoritativeTotal = subtotal + shippingFee;
      const effectivePaymentMethod =
        String(order.paymentMethod || "").toLowerCase().includes("cod") && !codAvailable
          ? "international_prepaid"
          : order.paymentMethod || (codAvailable ? "cod" : "international_prepaid");

      const record = {
        ...order,
        orderId,
        productId: matchedProduct.id,
        countryCode: resolvedCountry,
        countryName: getCountryConfig(resolvedCountry).name,
        carriers: getCarriersForCountry(resolvedCountry),
        unitPrice: authoritativeUnitPrice,
        quantity: qty,
        subtotal,
        discount: 0,
        shippingFee,
        codAvailable,
        paymentMethod: effectivePaymentMethod,
        originalPrice: subtotal,
        totalAmount: authoritativeTotal,
        price: authoritativeTotal,
        createdAt: order.createdAt || new Date().toISOString(),
      };

      if (!inMemoryOrders.some((o) => o.orderId === orderId)) {
        inMemoryOrders.unshift(record);
      }

      recordAuditLog("order_processed", order.email || order.phone || "customer", orderId, {
        productId: matchedProduct.id,
        countryCode: resolvedCountry,
        shippingFee,
        totalAmount: authoritativeTotal,
      }, extractClientIp(req));

      return res.json({
        success: true,
        orderId,
        countryCode: resolvedCountry,
        unitPrice: authoritativeUnitPrice,
        quantity: qty,
        subtotal,
        shippingFee,
        codAvailable,
        totalAmount: authoritativeTotal,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || "Order processing error" });
    }
  });

  // Generic Send-Email Endpoint — disabled per Section 7 (Only password reset & reseller orders send email)
  app.post("/api/send-email", async (_req, res) => {
    return res.json({ success: true, disabledByNotificationPolicy: true });
  });

  // Facebook Conversions API (CAPI) Event Sender
  const sendToFbCapi = async (eventData: any, userData: any = {}) => {
    const { pixelId, capiEnabled } = serverFbAdsConfig;
    const accessToken = process.env.FB_ACCESS_TOKEN;

    if (!capiEnabled || !pixelId || !accessToken) {
      return;
    }

    const crypto = await import("crypto");
    const hash = (val: string) => {
      if (!val) return undefined;
      return crypto
        .createHash("sha256")
        .update(val.trim().toLowerCase())
        .digest("hex");
    };

    const payload = {
      data: [
        {
          event_name: eventData.eventName,
          event_time: eventData.eventTime || Math.floor(Date.now() / 1000),
          action_source: "website",
          event_id: eventData.eventId,
          event_source_url: `https://${serverFbAdsConfig.domainUrl}${eventData.path || "/promos"}`,
          user_data: {
            em: userData.email ? [hash(userData.email)] : undefined,
            ph: userData.phone ? [hash(userData.phone)] : undefined,
            client_user_agent: eventData.userAgent,
            client_ip_address: eventData.ip,
            fbc: eventData.fbc,
            fbp: eventData.fbp,
          },
          custom_data: {
            value: eventData.value,
            currency: eventData.currency || "BDT",
            content_name: eventData.contentName,
            content_category: "Satellite Internet",
            content_ids: ["starlink-standard-4x"],
            content_type: "product",
            order_id: eventData.orderId,
            utm_campaign: eventData.utmCampaign,
          },
        },
      ],
      test_event_code: serverFbAdsConfig.testEventCode || undefined,
    };

    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      return await response.json();
    } catch (error) {
      console.error(`[CAPI] Error sending event ${eventData.eventName}:`, error);
      return null;
    }
  };

  // Facebook Conversions API (CAPI) Event Receiver
  app.post("/api/fb-capi", async (req, res) => {
    const {
      eventName = "PageView",
      value = 41500,
      currency = "BDT",
      contentName = "Starlink Standard 4X Kit",
      fbclid,
      fbc,
      fbp,
      utmCampaign,
      eventId,
      userData = {},
    } = req.body || {};

    const eventTime = Math.floor(Date.now() / 1000);
    const entry = {
      id:
        eventId ||
        `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      eventName,
      eventTime,
      value: Number(value) || 41500,
      currency,
      contentName,
      fbclid,
      utmCampaign,
      status: "sending_to_meta",
    };

    recentCapiEvents.unshift({ ...entry, status: "processed_ok" });
    if (recentCapiEvents.length > 50) recentCapiEvents.pop();

    sendToFbCapi(
      {
        eventName,
        eventTime,
        eventId: entry.id,
        value,
        currency,
        contentName,
        fbc: fbc || (fbclid ? `fb.1.${eventTime}.${fbclid}` : undefined),
        fbp,
        utmCampaign,
        userAgent: req.headers["user-agent"],
        ip: req.ip || req.headers["x-forwarded-for"],
      },
      userData
    );

    res.json({
      success: true,
      event: entry,
      pixelId: serverFbAdsConfig.pixelId,
    });
  });

  // ============================================================================
  // DSLINK PAY — SERVER HELPERS (RULES, DRAFTS, ATOMIC ORDERS, EMAIL OUTBOX)
  // ============================================================================
  const CANONICAL_PAY_ORIGIN = "https://devsparksoft.com.bd";
  const PAY_TOKEN_REGEX = /^[A-Za-z0-9_-]{32,128}$/;
  const TRX_ID_REGEX = /^[A-Z0-9_-]{4,64}$/;

  const generateSecurePayToken = (): string =>
    crypto.randomBytes(32).toString("base64url");

  const normalizeTrxId = (raw: unknown): string =>
    String(raw ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");

  const getDSLinkRulesConfig = (): DSLinkPricingAndShippingRulesConfig => {
    const rawRentalShip = process.env.DSLINK_RENTAL_SHIPPING_FEE_BDT;
    const parsedRentalShip =
      rawRentalShip !== undefined && String(rawRentalShip).trim() !== ""
        ? Number(rawRentalShip)
        : DEFAULT_RENTAL_SHIPPING_FEE_BDT;
    const bangladeshRentalShippingBdt =
      Number.isFinite(parsedRentalShip) && parsedRentalShip >= 0
        ? Math.round(parsedRentalShip)
        : DEFAULT_RENTAL_SHIPPING_FEE_BDT;

    const rentalActivationCollectionRule: RentalActivationCollectionRule =
      String(process.env.DSLINK_RENTAL_ACTIVATION_RULE || "upfront").trim().toLowerCase() ===
      "on_activation"
        ? "on_activation"
        : "upfront";

    const codAdvanceBdt = Math.max(0, Math.round(Number(process.env.DSLINK_COD_ADVANCE_BDT || 0) || 0));

    const parsedUsdRate = Number(process.env.DSLINK_USD_RATE);
    const bdtToUsdRate =
      Number.isFinite(parsedUsdRate) && parsedUsdRate > 0 ? parsedUsdRate : DEFAULT_BDT_TO_USD_RATE;

    const rawIntlUsd = process.env.DSLINK_INTL_SHIPPING_USD;
    const parsedIntlUsd =
      rawIntlUsd !== undefined && String(rawIntlUsd).trim() !== "" ? Number(rawIntlUsd) : null;
    const internationalShippingUsd =
      typeof parsedIntlUsd === "number" && Number.isFinite(parsedIntlUsd) && parsedIntlUsd >= 0
        ? roundCurrencyAmount(parsedIntlUsd, "USD")
        : null;

    return {
      bangladeshPurchaseShippingBdt: Math.max(0, Math.round(Number(serverShippingConfig.bangladeshFeeBdt) || 0)),
      bangladeshRentalShippingBdt,
      internationalShippingBdt: Math.max(0, Math.round(Number(serverShippingConfig.internationalFeeBdt) || 0)),
      internationalShippingUsd,
      bdtToUsdRate,
      rentalActivationCollectionRule,
      codAdvanceBdt,
      blockedCountries: serverShippingConfig.blockedCountries,
    };
  };

  const getDSLinkConfigDiagnostics = (): DSLinkPayConfigDiagnostics => {
    const rules = getDSLinkRulesConfig();
    const stripeEnabled = isStripeEnabled();
    const stripeSecretConfigured = Boolean(String(process.env.STRIPE_SECRET_KEY || "").trim());
    const stripeWebhookSecretConfigured = Boolean(String(process.env.STRIPE_WEBHOOK_SECRET || "").trim());
    const emailApiConfigured = Boolean(String(process.env.RESEND_API_KEY || "").trim());
    const senderEmailConfigured = Boolean(String(process.env.SENDER_EMAIL || "").trim());

    const internationalShippingUsd =
      typeof rules.internationalShippingUsd === "number"
        ? rules.internationalShippingUsd
        : roundCurrencyAmount(rules.internationalShippingBdt * rules.bdtToUsdRate, "USD");

    const warnings: string[] = [];
    if (!stripeEnabled) {
      warnings.push("STRIPE_ENABLED is false — Card payments are hidden in Bangladesh and unavailable for international USD checkouts.");
    } else {
      if (!stripeSecretConfigured) {
        warnings.push("STRIPE_SECRET_KEY is missing — Card checkout sessions cannot be created.");
      }
      if (!stripeWebhookSecretConfigured) {
        warnings.push("STRIPE_WEBHOOK_SECRET is missing — Stripe webhook confirmation cannot verify payments.");
      }
    }
    if (!emailApiConfigured) {
      warnings.push("RESEND_API_KEY is not configured — confirmation and cancellation emails will be recorded as skipped_unconfigured until configured.");
    }
    if (!senderEmailConfigured) {
      warnings.push("SENDER_EMAIL is not configured — outbound email will fall back to Resend default sender.");
    }
    if (!process.env.DSLINK_USD_RATE) {
      warnings.push(`DSLINK_USD_RATE is not explicitly set — using default server USD conversion rate (${DEFAULT_BDT_TO_USD_RATE} USD/BDT).`);
    }
    if (!process.env.DSLINK_INTL_SHIPPING_USD) {
      warnings.push(`DSLINK_INTL_SHIPPING_USD is not explicitly set — converting ৳${rules.internationalShippingBdt} shipping to $${internationalShippingUsd.toFixed(2)} USD.`);
    }

    return {
      stripeEnabled,
      stripeSecretConfigured,
      stripeWebhookSecretConfigured,
      emailApiConfigured,
      senderEmailConfigured,
      rentalShippingFeeBdt: rules.bangladeshRentalShippingBdt,
      rentalActivationCollectionRule: rules.rentalActivationCollectionRule,
      internationalShippingBdt: rules.internationalShippingBdt,
      internationalShippingUsd,
      bdtToUsdRate: rules.bdtToUsdRate,
      codAdvanceBdt: rules.codAdvanceBdt,
      warnings,
    };
  };

  const getBankTransferConfig = (): DSLinkPayBankTransferConfig => {
    const bankName = String(process.env.DSLINK_BANK_NAME || "").trim();
    const accountName = String(process.env.DSLINK_BANK_ACCOUNT_NAME || "").trim();
    const accountNumber = String(process.env.DSLINK_BANK_ACCOUNT_NUMBER || "").trim();
    const branchName = String(process.env.DSLINK_BANK_BRANCH_NAME || "").trim();
    const routingNumber = String(process.env.DSLINK_BANK_ROUTING_NUMBER || "").trim();
    const directAccountConfigured = Boolean(bankName && accountNumber);
    return {
      recipientName: VERIFIED_BANGLA_QR_MERCHANT_NAME,
      merchantQrId: VERIFIED_BANGLA_QR_MERCHANT_ID,
      supportPhone: VERIFIED_BANGLA_QR_PHONE,
      directAccountConfigured,
      ...(directAccountConfigured
        ? {
            bankName,
            accountName: accountName || VERIFIED_BANGLA_QR_MERCHANT_NAME,
            accountNumber,
            ...(branchName ? { branchName } : {}),
            ...(routingNumber ? { routingNumber } : {}),
          }
        : {}),
    };
  };

  const isOrderRental = (entity: any): boolean => {
    if (!entity) return false;
    if (entity.isRentalOrder === true || entity.source === "rental_checkout") return true;
    const itemsList = Array.isArray(entity.items) ? entity.items : [];
    if (
      itemsList.some(
        (it: any) =>
          it?.productClass === "rental" ||
          String(it?.productId || "").toLowerCase().includes("rental") ||
          String(it?.variantLabel || "").toLowerCase().includes("rental") ||
          String(it?.name || "").toLowerCase().includes("rental")
      )
    ) {
      return true;
    }
    return String(entity.productId || "").toLowerCase().includes("rental");
  };

  const resolveRequestContext = (reqRec: ServerPaymentRequestRecord): {
    order?: any;
    draft?: ServerCheckoutDraft;
    entity?: any;
  } => {
    const order = reqRec.orderId
      ? inMemoryOrders.find((o) => o.orderId === reqRec.orderId)
      : undefined;
    const draft = reqRec.draftId
      ? inMemoryCheckoutDrafts.find((d) => d.draftId === reqRec.draftId)
      : undefined;
    const resolvedOrder =
      order || (draft?.finalOrderId ? inMemoryOrders.find((o) => o.orderId === draft.finalOrderId) : undefined);
    return { order: resolvedOrder, draft, entity: resolvedOrder || draft };
  };

  const getOrderCurrency = (entity: any): DSLinkPayCurrency => {
    const explicit = String(entity?.currency || "").trim().toUpperCase();
    if (explicit === "USD") return "USD";
    if (explicit === "BDT") return "BDT";
    const cc = normalizeCountryCode(entity?.countryCode || "BD");
    return cc === "BD" ? "BDT" : "USD";
  };

  const recomputeOrderPaymentSummary = (order: any) => {
    if (!order) {
      return {
        currency: "BDT" as DSLinkPayCurrency,
        orderTotalAmount: 0,
        paidAmount: 0,
        remainingBalanceAmount: 0,
        paidAmountBdt: 0,
        remainingBalanceBdt: 0,
      };
    }
    const currency = getOrderCurrency(order);
    const orderTotalAmount = roundCurrencyAmount(
      Number(order.orderTotalAmount ?? order.totalAmount ?? order.price ?? 0) || 0,
      currency
    );
    const orderTotalBdt = Math.max(0, Math.round(Number(order.orderTotalBdt ?? order.totalAmount ?? order.price ?? 0) || 0));

    // Only non-subscription payment requests count toward the hardware/shipping order balance
    const orderRequests = inMemoryPaymentRequests.filter(
      (r) => r.orderId === order.orderId && r.paymentType !== "subscription"
    );
    const paidFromRequests = roundCurrencyAmount(
      orderRequests
        .filter((r) => r.status === "paid")
        .reduce(
          (sum, r) =>
            sum +
            Math.max(
              0,
              Number(r.verifiedAmount ?? r.requestedAmount ?? r.verifiedAmountBdt ?? r.requestedAmountBdt ?? 0) || 0
            ),
          0
        ),
      currency
    );

    const legacyFullPaid =
      paidFromRequests === 0 &&
      (order.paymentStatus === "Paid" || order.paymentStatus === "Paid (Stripe Verified)")
        ? orderTotalAmount
        : 0;

    const paidAmount = roundCurrencyAmount(Math.min(orderTotalAmount, paidFromRequests + legacyFullPaid), currency);
    const remainingBalanceAmount = roundCurrencyAmount(Math.max(0, orderTotalAmount - paidAmount), currency);

    const paidAmountBdt = currency === "BDT" ? Math.round(paidAmount) : Math.round(orderTotalBdt * (orderTotalAmount > 0 ? paidAmount / orderTotalAmount : 0));
    const remainingBalanceBdt = currency === "BDT" ? Math.round(remainingBalanceAmount) : Math.max(0, orderTotalBdt - paidAmountBdt);

    order.currency = currency;
    order.orderTotalAmount = orderTotalAmount;
    order.paidAmount = paidAmount;
    order.remainingBalanceAmount = remainingBalanceAmount;
    order.paidAmountBdt = paidAmountBdt;
    order.remainingBalanceBdt = remainingBalanceBdt;

    const hasUnderReview = orderRequests.some((r) => r.status === "under_review");
    const hasCodSelected = orderRequests.some((r) => r.status === "cod_selected");

    if (orderTotalAmount > 0 && remainingBalanceAmount === 0) {
      if (order.paymentStatus !== "Paid (Stripe Verified)") {
        order.paymentStatus = "Paid";
      }
      order.codAmountToCollectBdt = 0;
      if (order.status === "Awaiting Payment" || order.status === "Pending Confirmation" || order.status === "Payment Under Review") {
        order.status = "Confirmed";
      }
    } else if (paidAmount > 0) {
      order.paymentStatus =
        isOrderRental(order) && order.rentalBreakdown?.activationCollectionRule === "on_activation"
          ? "Shipping Paid (Activation Due Later)"
          : "Advance Paid (Partial)";
      order.codAmountToCollectBdt = order.codAvailable ? remainingBalanceBdt : 0;
      if (order.status === "Awaiting Payment" || order.status === "Payment Under Review") {
        order.status = isOrderRental(order) ? "Confirmed" : "Advance Paid";
      }
    } else if (hasUnderReview) {
      order.paymentStatus = "Under Verification";
      order.status = "Payment Under Review";
    } else if (hasCodSelected) {
      order.paymentStatus = "Pending COD Collection";
      order.paymentMethod = "cod";
      order.codAmountToCollectBdt = order.codAvailable ? remainingBalanceBdt : 0;
      order.status = "Pending Confirmation";
    } else if (order.paymentMethod !== "cod") {
      order.paymentStatus = "Awaiting Payment";
      order.codAmountToCollectBdt = 0;
    }

    return {
      currency,
      orderTotalAmount,
      paidAmount,
      remainingBalanceAmount,
      paidAmountBdt,
      remainingBalanceBdt,
    };
  };

  // ============================================================================
  // EMAIL OUTBOX (POST-COMMIT CONFIRMATION & CANCELLATION EMAILS + SAFE RETRY)
  // ============================================================================
  const buildDSLinkPayEmailContent = (params: {
    type: "payment_confirmed" | "payment_cancelled";
    requestRef: string;
    orderId?: string;
    amount: number;
    currency: DSLinkPayCurrency;
    trxId?: string;
    cancellationReason?: string;
    customerName?: string;
  }): { subject: string; html: string } => {
    const formattedAmt = `${formatPayAmount(params.amount, params.currency)} ${params.currency}`;
    const greeting = params.customerName ? `Dear ${params.customerName},` : "Dear Customer,";
    if (params.type === "payment_confirmed") {
      const finalOrder = params.orderId || params.requestRef;
      return {
        subject: `DSLink Order Confirmed — #${finalOrder} (${formattedAmt})`,
        html: buildAdminNotificationHtml({
          badge: "DSLINK PAY · PAYMENT CONFIRMED",
          heading: `Order #${finalOrder} Confirmed`,
          summary: `${greeting} Your payment of ${formattedAmt} has been verified by DevSpark Link.`,
          rows: [
            { label: "Final Order Number", value: `#${finalOrder}`, highlight: true },
            { label: "Verified Amount", value: formattedAmt, highlight: true },
            ...(params.trxId ? [{ label: "Payment Reference", value: params.trxId }] : []),
            { label: "Confirmed At (Dhaka)", value: getDhakaTimestamp() },
            { label: "Support", value: `WhatsApp ${VERIFIED_BANGLA_QR_PHONE} · devsparksoft.com.bd` },
          ],
        }),
      };
    }

    return {
      subject: `DSLink Payment Request Cancelled — #${params.requestRef}`,
      html: buildAdminNotificationHtml({
        badge: "DSLINK PAY · PAYMENT REQUEST CANCELLED",
        heading: `Payment Request #${params.requestRef} Cancelled`,
        summary: `${greeting} Your DSLink Pay payment request #${params.requestRef} has been cancelled and closed.`,
        rows: [
          { label: "Request Reference", value: `#${params.requestRef}`, highlight: true },
          { label: "Requested Amount", value: formattedAmt },
          {
            label: "Cancellation Reason",
            value: params.cancellationReason || "Cancelled by DevSpark Link team.",
            highlight: true,
          },
          { label: "Updated At (Dhaka)", value: getDhakaTimestamp() },
          { label: "Need Help?", value: `WhatsApp ${VERIFIED_BANGLA_QR_PHONE} · devsparksoft.com.bd` },
        ],
      }),
    };
  };

  const deliverEmailJobViaRestApi = async (
    job: DSLinkPayEmailJob,
    html: string
  ): Promise<DSLinkPayEmailJob> => {
    job.attempts += 1;
    job.updatedAt = new Date().toISOString();
    try {
      const result: any = await sendResendEmailSafe({
        to: job.recipientEmail,
        subject: job.subject,
        html,
      });
      if (result?.skipped) {
        job.status = "skipped_unconfigured";
        job.lastError = "RESEND_API_KEY is not configured in server environment.";
      } else if (result?.error) {
        job.status = "failed";
        job.lastError = String(result.error?.message || result.error || "Resend API error").slice(0, 300);
      } else {
        job.status = "sent";
        job.providerMessageId = String(result?.data?.id || "");
        job.sentAt = new Date().toISOString();
        job.lastError = undefined;
      }
    } catch (err: any) {
      job.status = "failed";
      job.lastError = String(err?.message || err || "Email delivery exception").slice(0, 300);
    }
    job.updatedAt = new Date().toISOString();
    persistLocalStore();
    return job;
  };

  const enqueueAndSendDSLinkEmailJob = async (params: {
    type: "payment_confirmed" | "payment_cancelled";
    paymentRequestId: string;
    requestRef: string;
    orderId?: string;
    recipientEmail: string;
    amount: number;
    currency: DSLinkPayCurrency;
    trxId?: string;
    cancellationReason?: string;
    customerName?: string;
  }): Promise<DSLinkPayEmailJob | null> => {
    const cleanEmail = String(params.recipientEmail || "").trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      return null;
    }

    // Deduplicate confirmation/cancellation job per paymentRequestId + type so retries never duplicate
    const existing = inMemoryEmailJobs.find(
      (j) => j.paymentRequestId === params.paymentRequestId && j.type === params.type
    );
    const { subject, html } = buildDSLinkPayEmailContent(params);
    if (existing) {
      if (existing.status === "sent") {
        return existing;
      }
      return deliverEmailJobViaRestApi(existing, html);
    }

    const nowIso = new Date().toISOString();
    const job: DSLinkPayEmailJob = {
      id: `EML-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      type: params.type,
      paymentRequestId: params.paymentRequestId,
      requestRef: params.requestRef,
      ...(params.orderId ? { orderId: params.orderId } : {}),
      recipientEmail: cleanEmail,
      subject,
      status: "queued",
      attempts: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    inMemoryEmailJobs.unshift(job);
    persistLocalStore();
    return deliverEmailJobViaRestApi(job, html);
  };

  const createFinalOrderFromDraft = (
    draft: ServerCheckoutDraft,
    opts: {
      paymentMethod: string;
      paymentStatus: string;
      orderStatus: string;
      trxId?: string;
      senderBankName?: string;
      senderNumber?: string;
    }
  ) => {
    // Strictly idempotent: never create two final orders from the same checkout draft
    if (draft.finalOrderId) {
      const existing = inMemoryOrders.find((o) => o.orderId === draft.finalOrderId);
      if (existing) return existing;
    }

    const orderId = `DS-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const orderDoc: any = {
      orderId,
      draftId: draft.draftId,
      orderAccessToken: generateOrderAccessToken(),
      checkoutIdempotencyKey: draft.checkoutIdempotencyKey,
      customerName: draft.customerName,
      fullName: draft.fullName,
      customerPhone: draft.customerPhone,
      phone: draft.phone,
      customerEmail: draft.customerEmail,
      email: draft.email,
      address: draft.address,
      district: draft.district,
      shippingAddress: draft.shippingAddress,
      countryCode: draft.countryCode,
      countryName: draft.countryName,
      carriers: draft.carriers,
      currency: draft.currency,
      isRentalOrder: draft.isRentalOrder,
      ...(draft.rentalBreakdown ? { rentalBreakdown: draft.rentalBreakdown } : {}),
      codAvailable: draft.codAvailable,
      codAdvanceRequiredAmount: draft.codAdvanceRequiredAmount,
      codRemainingOnDeliveryAmount: draft.codRemainingOnDeliveryAmount,
      paymentMethod: opts.paymentMethod,
      paymentStatus: opts.paymentStatus,
      fulfillmentStatus: "Pending",
      paidAmount: 0,
      remainingBalanceAmount: draft.orderTotalAmount,
      paidAmountBdt: 0,
      remainingBalanceBdt: draft.orderTotalBdt,
      codAmountToCollectBdt:
        opts.paymentMethod === "cod" ? draft.codRemainingOnDeliveryAmount || draft.orderTotalBdt : 0,
      trxId: opts.trxId || "",
      senderBankName: opts.senderBankName || "",
      senderNumber: opts.senderNumber || "",
      productId: draft.productId,
      kitName: draft.kitName,
      productName: draft.productName,
      items: draft.items,
      unitPrice: draft.items[0]?.unitPrice ?? draft.subtotalAmount,
      quantity: draft.quantity,
      subtotal: draft.subtotalAmount,
      subtotalBdt: draft.subtotalBdt,
      shippingFee: draft.shippingFeeAmount,
      shippingFeeBdt: draft.shippingFeeBdt,
      discount: 0,
      totalAmount: draft.orderTotalAmount,
      orderTotalAmount: draft.orderTotalAmount,
      orderTotalBdt: draft.orderTotalBdt,
      price: draft.orderTotalAmount,
      displayCurrency: draft.displayCurrency,
      estimatedConvertedTotal: draft.estimatedConvertedTotal,
      status: opts.orderStatus,
      source: draft.isRentalOrder ? "rental_checkout" : draft.items.length > 1 ? "cart_checkout" : "promos_or_dslink",
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    inMemoryOrders.unshift(orderDoc);
    draft.status = "converted_to_order";
    draft.finalOrderId = orderId;
    draft.updatedAt = nowIso;
    return orderDoc;
  };

  // ============================================================================
  // ATOMIC PAYMENT VERIFICATION & ORDER FINALIZATION (ADMIN + STRIPE WEBHOOK)
  // ============================================================================
  const finalizeVerifiedPaymentRequest = async (params: {
    reqRec: ServerPaymentRequestRecord;
    verifiedBy: string;
    methodOverride?: DSLinkPayMethod;
    trxId?: string;
    verifiedAmount?: number;
    note?: string;
    isStripeVerified?: boolean;
    ip?: string;
  }): Promise<{
    ok: boolean;
    httpStatus: number;
    error?: string;
    order?: any;
    emailJob?: DSLinkPayEmailJob | null;
    verifiedAmount?: number;
  }> => {
    const { reqRec } = params;
    if (reqRec.status === "paid") {
      return {
        ok: false,
        httpStatus: 409,
        error: "This payment request is already verified and marked paid.",
      };
    }
    if (reqRec.status === "revoked" || reqRec.status === "cancelled" || reqRec.status === "expired") {
      return {
        ok: false,
        httpStatus: 409,
        error: `Cannot verify a ${reqRec.status} payment request. Reissue a new link if needed.`,
      };
    }

    const ctx = resolveRequestContext(reqRec);
    if (!ctx.order && !ctx.draft) {
      return {
        ok: false,
        httpStatus: 404,
        error: "Associated checkout draft or order not found.",
      };
    }

    // Duplicate transaction ID verification guard (never credit the same verified TrxID twice)
    const finalTrxRaw = String(params.trxId || reqRec.submittedTrxId || "").trim();
    const normTrx = finalTrxRaw ? normalizeTrxId(finalTrxRaw) : "";
    if (normTrx) {
      const conflict = findDuplicateTrxIdConflict(normTrx, {
        excludeRequestId: reqRec.id,
        excludeOrderId: ctx.order?.orderId,
      });
      if (conflict) {
        return {
          ok: false,
          httpStatus: 409,
          error: `Duplicate verified Transaction ID detected (already used on #${conflict.conflictOrderId}).`,
        };
      }
      reqRec.submittedTrxId = finalTrxRaw.slice(0, 64);
      reqRec.normalizedTrxId = normTrx;
    }

    // Atomically create EXACTLY ONE final order if this payment request is linked to a draft
    let order = ctx.order;
    if (!order && ctx.draft) {
      order = createFinalOrderFromDraft(ctx.draft, {
        paymentMethod: params.isStripeVerified
          ? "stripe"
          : params.methodOverride || reqRec.submittedMethod || "bangla_qr",
        paymentStatus: params.isStripeVerified ? "Paid (Stripe Verified)" : "Paid",
        orderStatus: "Confirmed",
        trxId: reqRec.submittedTrxId,
        senderBankName: reqRec.selectedInstitutionName,
        senderNumber: reqRec.senderHint,
      });
      reqRec.orderId = order.orderId;
      reqRec.requestRef = order.orderId;
    }

    if (!order) {
      return { ok: false, httpStatus: 500, error: "Could not materialize order for payment." };
    }

    const currency = reqRec.currency;
    const nowIso = new Date().toISOString();

    let verifiedAmt = reqRec.requestedAmount;
    if (reqRec.paymentType !== "subscription") {
      const preSummary = recomputeOrderPaymentSummary(order);
      if (typeof params.verifiedAmount === "number" && Number.isFinite(params.verifiedAmount) && params.verifiedAmount > 0) {
        verifiedAmt = roundCurrencyAmount(
          Math.min(preSummary.remainingBalanceAmount || reqRec.requestedAmount, params.verifiedAmount),
          currency
        );
      } else {
        verifiedAmt = roundCurrencyAmount(
          Math.min(preSummary.remainingBalanceAmount || reqRec.requestedAmount, reqRec.requestedAmount),
          currency
        );
      }
    } else if (typeof params.verifiedAmount === "number" && Number.isFinite(params.verifiedAmount) && params.verifiedAmount > 0) {
      verifiedAmt = roundCurrencyAmount(params.verifiedAmount, currency);
    }

    reqRec.status = "paid";
    if (params.methodOverride) reqRec.submittedMethod = params.methodOverride;
    if (params.isStripeVerified) {
      reqRec.submittedMethod = "card";
      reqRec.selectedInstitutionId = "stripe-card";
      reqRec.selectedInstitutionName = "Card (Stripe)";
      reqRec.stripePaymentStatus = "paid";
    }
    reqRec.submittedAt = reqRec.submittedAt || nowIso;
    reqRec.verifiedAt = nowIso;
    reqRec.verifiedBy = params.verifiedBy;
    reqRec.verifiedAmount = verifiedAmt;
    reqRec.verifiedAmountBdt = currency === "BDT" ? Math.round(verifiedAmt) : reqRec.requestedAmountBdt;
    reqRec.rejectionReason = undefined;
    if (params.note) reqRec.note = String(params.note).trim().slice(0, 200);
    reqRec.updatedAt = nowIso;

    if (reqRec.submittedTrxId) {
      order.trxId = reqRec.submittedTrxId;
    }
    if (params.isStripeVerified) {
      order.paymentMethod = "stripe";
    } else if (reqRec.submittedMethod) {
      order.paymentMethod = reqRec.submittedMethod;
    }

    if (reqRec.paymentType === "subscription") {
      // Apply verified rental subscription directly to the SAME rental order (never create a second order)
      order.subscriptionPaymentStatus = "Paid";
      order.activeSubscriptionPlanId = reqRec.subscriptionPlanId || "bd_residential_standard";
      order.activeSubscriptionPlan = reqRec.subscriptionPlanName || "Bangladesh Residential Standard";
      order.subscriptionBillingPeriod = reqRec.subscriptionBillingPeriod || nowIso.slice(0, 7);
      order.subscriptionPaidAt = nowIso;
      if (!Array.isArray(order.paidSubscriptionPeriods)) {
        order.paidSubscriptionPeriods = [];
      }
      if (!order.paidSubscriptionPeriods.includes(order.subscriptionBillingPeriod)) {
        order.paidSubscriptionPeriods.push(order.subscriptionBillingPeriod);
      }
      order.updatedAt = nowIso;
    } else {
      const updatedSummary = recomputeOrderPaymentSummary(order);
      if (params.isStripeVerified && updatedSummary.remainingBalanceAmount === 0) {
        order.paymentStatus = "Paid (Stripe Verified)";
        order.status = "Confirmed";
      }
    }

    // Commit state BEFORE queuing/sending outbound email
    persistLocalStore();

    const activeDb = await getActiveFirestoreDb();
    if (activeDb) {
      try {
        await setDoc(doc(activeDb, "orders", order.orderId), order, { merge: true });
        await setDoc(doc(activeDb, "payment_requests", reqRec.id), reqRec, { merge: true });
      } catch (dbErr: any) {
        if (isFirestoreUnavailableError(dbErr)) {
          disableFirestoreGracefully(dbErr?.message || "finalize payment write failed");
        }
      }
    }

    recordAuditLog(
      params.isStripeVerified ? "stripe_dslink_pay_verified" : "admin_dslink_pay_verified",
      params.verifiedBy,
      order.orderId,
      {
        paymentRequestId: reqRec.id,
        draftId: reqRec.draftId || null,
        paymentType: reqRec.paymentType,
        verifiedAmount: verifiedAmt,
        currency,
        trxId: reqRec.submittedTrxId || null,
      },
      params.ip || "server"
    );

    // Trigger post-commit confirmation email via server-side Resend REST API
    const recipientEmail = String(order.email || order.customerEmail || ctx.draft?.email || "").trim();
    const emailJob = await enqueueAndSendDSLinkEmailJob({
      type: "payment_confirmed",
      paymentRequestId: reqRec.id,
      requestRef: order.orderId,
      orderId: order.orderId,
      recipientEmail,
      amount: verifiedAmt,
      currency,
      trxId: reqRec.submittedTrxId,
      customerName: order.fullName || order.customerName || ctx.draft?.fullName,
    });

    return {
      ok: true,
      httpStatus: 200,
      order,
      emailJob,
      verifiedAmount: verifiedAmt,
    };
  };

  onDSLinkPayRequestPaidViaStripe = async (reqRec, _order, paymentRef) => {
    const res = await finalizeVerifiedPaymentRequest({
      reqRec,
      verifiedBy: "stripe_webhook",
      methodOverride: "card",
      trxId: paymentRef.slice(0, 64),
      verifiedAmount: reqRec.requestedAmount,
      isStripeVerified: true,
      ip: "stripe",
    });
    return res.order;
  };

  const evaluateRequestExpiry = (reqRec: ServerPaymentRequestRecord): boolean => {
    if (reqRec.status === "pending" || reqRec.status === "rejected") {
      const expMs = Date.parse(reqRec.expiresAt);
      if (Number.isFinite(expMs) && Date.now() > expMs) {
        reqRec.status = "expired";
        reqRec.updatedAt = new Date().toISOString();
        persistLocalStore();
        return true;
      }
    }
    return false;
  };

  const findDuplicateTrxIdConflict = (
    normalized: string,
    opts?: { excludeRequestId?: string; excludeOrderId?: string }
  ): { conflictOrderId: string; conflictRequestId?: string } | null => {
    if (!normalized) return null;
    const reqConflict = inMemoryPaymentRequests.find(
      (r) =>
        r.id !== opts?.excludeRequestId &&
        (r.status === "under_review" || r.status === "paid") &&
        r.normalizedTrxId === normalized
    );
    if (reqConflict) {
      return {
        conflictOrderId: reqConflict.orderId || reqConflict.requestRef,
        conflictRequestId: reqConflict.id,
      };
    }
    const orderConflict = inMemoryOrders.find((o) => {
      if (opts?.excludeOrderId && o.orderId === opts.excludeOrderId) return false;
      const orderNorm = normalizeTrxId(o.trxId);
      if (!orderNorm || orderNorm !== normalized) return false;
      const st = String(o.paymentStatus || "").toLowerCase();
      return st.includes("paid") || st.includes("verif") || st.includes("review");
    });
    if (orderConflict) {
      return { conflictOrderId: orderConflict.orderId };
    }
    return null;
  };

  const revokeActivePaymentRequestsForOrder = (
    orderId: string,
    reason: string,
    replacedById?: string,
    opts?: { includeSubscriptions?: boolean }
  ): number => {
    const now = new Date().toISOString();
    let count = 0;
    for (const r of inMemoryPaymentRequests) {
      if (
        r.orderId === orderId &&
        (opts?.includeSubscriptions ? true : r.paymentType !== "subscription") &&
        (r.status === "pending" || r.status === "rejected")
      ) {
        r.status = "revoked";
        r.revokedReason = reason;
        if (replacedById) r.replacedById = replacedById;
        r.updatedAt = now;
        count += 1;
      }
    }
    return count;
  };

  const buildEntityItemsSummary = (entity: any, currency: DSLinkPayCurrency) => {
    if (Array.isArray(entity?.items) && entity.items.length > 0) {
      return entity.items.map((it: any) => ({
        productId: String(it.productId || entity.productId || "starlink-kit"),
        name: String(it.name || entity.productName || "Starlink Kit"),
        ...(it.variantLabel ? { variantLabel: String(it.variantLabel) } : {}),
        ...(it.productClass ? { productClass: it.productClass } : {}),
        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
        unitPrice: roundCurrencyAmount(Number(it.unitPrice ?? entity.unitPrice ?? 0) || 0, currency),
        lineTotal: roundCurrencyAmount(
          Number(
            it.lineTotal ??
              (Number(it.unitPrice ?? entity.unitPrice ?? 0) * Math.max(1, Number(it.quantity) || 1))
          ) || 0,
          currency
        ),
        currency,
      }));
    }
    const qty = Math.max(1, Math.round(Number(entity?.quantity) || 1));
    const unit = roundCurrencyAmount(
      Number(entity?.unitPrice ?? entity?.subtotalAmount ?? entity?.subtotal ?? entity?.totalAmount ?? 0) || 0,
      currency
    );
    return [
      {
        productId: String(entity?.productId || "starlink-kit"),
        name: String(entity?.productName || "Starlink Kit"),
        quantity: qty,
        unitPrice: unit,
        lineTotal: roundCurrencyAmount(unit * qty, currency),
        currency,
      },
    ];
  };

  const computeLiveEligibleMethodsForRequest = (
    reqRec: ServerPaymentRequestRecord,
    entity: any
  ): { eligibleMethods: DSLinkPayMethod[]; stripeCardEnabled: boolean; cardUnavailableForDestination: boolean } => {
    const countryCode = normalizeCountryCode(entity?.countryCode || "BD");
    const isBangladesh = countryCode === "BD";
    const stripeActive = isStripeConfiguredAndEnabled();
    const acceptsNow = reqRec.status === "pending" || reqRec.status === "rejected";
    const stripeCardEnabled = stripeActive && acceptsNow;

    const orderTotal = roundCurrencyAmount(
      Number(entity?.orderTotalAmount ?? entity?.totalAmount ?? reqRec.requestedAmount) || 0,
      reqRec.currency
    );
    const remaining =
      typeof entity?.remainingBalanceAmount === "number"
        ? entity.remainingBalanceAmount
        : orderTotal;

    const methods = computeEligibleMethodsForPaymentRequest({
      countryCode,
      currency: reqRec.currency,
      isRentalOrder: isOrderRental(entity),
      paymentType: reqRec.paymentType,
      codAvailable: Boolean(entity?.codAvailable) && !isOrderRental(entity),
      requestedAmount: reqRec.requestedAmount,
      remainingBalanceAmount: remaining,
      stripeCardEnabled: stripeActive,
    });

    return {
      eligibleMethods: methods,
      stripeCardEnabled,
      cardUnavailableForDestination: (!isBangladesh || reqRec.currency === "USD") && !stripeActive,
    };
  };

  const toPublicPaymentRequest = (
    reqRec: ServerPaymentRequestRecord,
    order?: any,
    draft?: ServerCheckoutDraft
  ): DSLinkPayRequestPublic => {
    evaluateRequestExpiry(reqRec);
    const entity = order || draft;
    const currency: DSLinkPayCurrency = reqRec.currency === "USD" ? "USD" : "BDT";
    const countryCode = normalizeCountryCode(entity?.countryCode || "BD");
    const countryName = String(entity?.countryName || getCountryConfig(countryCode).name);

    let paidAmount = 0;
    let remainingBalanceAmount = reqRec.requestedAmount;
    let orderTotalAmount = roundCurrencyAmount(
      Number(entity?.orderTotalAmount ?? entity?.totalAmount ?? entity?.price ?? reqRec.requestedAmount) || 0,
      currency
    );
    let subtotalAmount = roundCurrencyAmount(
      Number(entity?.subtotalAmount ?? entity?.subtotal ?? orderTotalAmount) || 0,
      currency
    );
    let shippingFeeAmount = roundCurrencyAmount(
      Number(entity?.shippingFeeAmount ?? entity?.shippingFee ?? 0) || 0,
      currency
    );
    let paidAmountBdt = 0;
    let remainingBalanceBdt = reqRec.requestedAmountBdt;
    let orderTotalBdt = Math.max(0, Math.round(Number(entity?.orderTotalBdt ?? entity?.totalAmount ?? reqRec.requestedAmountBdt) || 0));
    let subtotalBdt = Math.max(0, Math.round(Number(entity?.subtotalBdt ?? entity?.subtotal ?? orderTotalBdt) || 0));
    let shippingFeeBdt = Math.max(0, Math.round(Number(entity?.shippingFeeBdt ?? entity?.shippingFee ?? 0) || 0));

    if (order) {
      const summary = recomputeOrderPaymentSummary(order);
      paidAmount = summary.paidAmount;
      remainingBalanceAmount =
        reqRec.paymentType === "subscription"
          ? reqRec.status === "paid"
            ? 0
            : reqRec.requestedAmount
          : summary.remainingBalanceAmount;
      orderTotalAmount =
        reqRec.paymentType === "subscription" ? reqRec.requestedAmount : summary.orderTotalAmount;
      paidAmountBdt = summary.paidAmountBdt;
      remainingBalanceBdt =
        reqRec.paymentType === "subscription"
          ? reqRec.status === "paid"
            ? 0
            : reqRec.requestedAmountBdt
          : summary.remainingBalanceBdt;
    } else if (draft) {
      paidAmount = 0;
      remainingBalanceAmount = draft.orderTotalAmount;
      paidAmountBdt = 0;
      remainingBalanceBdt = draft.orderTotalBdt;
    }

    const remainingAfterThisPaymentAmount =
      reqRec.status === "paid"
        ? remainingBalanceAmount
        : roundCurrencyAmount(Math.max(0, remainingBalanceAmount - reqRec.requestedAmount), currency);
    const remainingAfterThisPaymentBdt =
      reqRec.status === "paid"
        ? remainingBalanceBdt
        : Math.max(0, Math.round(remainingBalanceBdt - reqRec.requestedAmountBdt));

    const items =
      reqRec.paymentType === "subscription"
        ? [
            {
              productId: reqRec.subscriptionPlanId || "rental-subscription",
              name: reqRec.subscriptionPlanName || "Starlink Rental Monthly Subscription",
              variantLabel: reqRec.subscriptionBillingPeriod
                ? `Billing Period: ${reqRec.subscriptionBillingPeriod}`
                : "Monthly Plan",
              productClass: "rental" as const,
              quantity: 1,
              unitPrice: reqRec.requestedAmount,
              lineTotal: reqRec.requestedAmount,
              currency,
            },
          ]
        : buildEntityItemsSummary(entity, currency);

    const productSummary =
      reqRec.paymentType === "subscription"
        ? `${reqRec.subscriptionPlanName || "Starlink Rental Subscription"} (${reqRec.subscriptionBillingPeriod || "Monthly"})`
        : String(entity?.productName || "").trim() ||
          items.map((i: any) => `${i.name} × ${i.quantity}`).join(", ");

    const { eligibleMethods, stripeCardEnabled, cardUnavailableForDestination } =
      computeLiveEligibleMethodsForRequest(reqRec, entity);

    const isDraftOnly = !order && Boolean(draft);
    const rentalBreakdown = reqRec.rentalBreakdown || entity?.rentalBreakdown;

    // STRICT ZERO-PII PUBLIC PAYLOAD: No customer name, phone, email, address, or senderHint.
    return {
      id: reqRec.id,
      token: reqRec.token,
      requestRef: reqRec.orderId || reqRec.requestRef || reqRec.draftId || reqRec.id,
      orderId: reqRec.orderId || "",
      ...(reqRec.draftId ? { draftId: reqRec.draftId } : {}),
      isDraftOnly,
      items,
      productSummary,
      currency,
      subtotalAmount: reqRec.paymentType === "subscription" ? reqRec.requestedAmount : subtotalAmount,
      shippingFeeAmount: reqRec.paymentType === "subscription" ? 0 : shippingFeeAmount,
      orderTotalAmount,
      paidAmount,
      remainingBalanceAmount,
      requestedAmount: reqRec.requestedAmount,
      requestedAmountMinor: reqRec.requestedAmountMinor,
      remainingAfterThisPaymentAmount,
      subtotalBdt: reqRec.paymentType === "subscription" ? reqRec.requestedAmountBdt : subtotalBdt,
      shippingFeeBdt: reqRec.paymentType === "subscription" ? 0 : shippingFeeBdt,
      orderTotalBdt: reqRec.paymentType === "subscription" ? reqRec.requestedAmountBdt : orderTotalBdt,
      paidAmountBdt,
      remainingBalanceBdt,
      requestedAmountBdt: reqRec.requestedAmountBdt,
      remainingAfterThisPaymentBdt,
      paymentType: reqRec.paymentType,
      status: reqRec.status,
      eligibleMethods,
      stripeCardEnabled,
      cardUnavailableForDestination,
      ...(reqRec.stripePaymentStatus ? { stripePaymentStatus: reqRec.stripePaymentStatus } : {}),
      isRentalOrder: isOrderRental(entity),
      ...(rentalBreakdown ? { rentalBreakdown } : {}),
      ...(reqRec.subscriptionPlanId ? { subscriptionPlanId: reqRec.subscriptionPlanId } : {}),
      ...(reqRec.subscriptionPlanName ? { subscriptionPlanName: reqRec.subscriptionPlanName } : {}),
      ...(reqRec.subscriptionBillingPeriod
        ? { subscriptionBillingPeriod: reqRec.subscriptionBillingPeriod }
        : {}),
      ...(typeof reqRec.codAdvanceRequiredAmount === "number" && reqRec.codAdvanceRequiredAmount > 0
        ? {
            codAdvanceRequiredAmount: reqRec.codAdvanceRequiredAmount,
            codRemainingOnDeliveryAmount: reqRec.codRemainingOnDeliveryAmount ?? 0,
          }
        : {}),
      countryCode,
      countryName,
      ...(reqRec.submittedMethod ? { submittedMethod: reqRec.submittedMethod } : {}),
      ...(reqRec.submittedTrxId ? { submittedTrxId: reqRec.submittedTrxId } : {}),
      ...(reqRec.selectedInstitutionId ? { selectedInstitutionId: reqRec.selectedInstitutionId } : {}),
      ...(reqRec.selectedInstitutionName ? { selectedInstitutionName: reqRec.selectedInstitutionName } : {}),
      ...(reqRec.rejectionReason ? { rejectionReason: reqRec.rejectionReason } : {}),
      ...(reqRec.cancellationReason ? { cancellationReason: reqRec.cancellationReason } : {}),
      merchant: {
        name: VERIFIED_BANGLA_QR_MERCHANT_NAME,
        banglaQrMerchantId:
          currency === "BDT" &&
          (eligibleMethods.includes("bangla_qr") || eligibleMethods.includes("bank_transfer"))
            ? VERIFIED_BANGLA_QR_MERCHANT_ID
            : "",
        banglaQrImageUrl:
          currency === "BDT" &&
          (eligibleMethods.includes("bangla_qr") || eligibleMethods.includes("bank_transfer"))
            ? EXACT_BANGLA_QR_IMAGE_URL
            : "",
        supportPhone: VERIFIED_BANGLA_QR_PHONE,
        ...(currency === "BDT" && eligibleMethods.includes("bank_transfer")
          ? { bankTransfer: getBankTransferConfig() }
          : {}),
      },
      expiresAt: reqRec.expiresAt,
      createdAt: reqRec.createdAt,
      updatedAt: reqRec.updatedAt,
      ...(reqRec.submittedAt ? { submittedAt: reqRec.submittedAt } : {}),
      ...(reqRec.verifiedAt ? { verifiedAt: reqRec.verifiedAt } : {}),
      ...(reqRec.revokedReason ? { revokedReason: reqRec.revokedReason } : {}),
    };
  };

  const toDraftAdminSummary = (draft: ServerCheckoutDraft): DSLinkPayDraftSummaryAdmin => ({
    draftId: draft.draftId,
    customerName: draft.fullName || draft.customerName || "Customer",
    phone: draft.phone || draft.customerPhone || "",
    email: draft.email || draft.customerEmail || "",
    countryCode: draft.countryCode,
    countryName: draft.countryName,
    address: draft.address || "",
    currency: draft.currency,
    totalAmount: draft.orderTotalAmount,
    isRentalOrder: draft.isRentalOrder,
    ...(draft.finalOrderId ? { finalOrderId: draft.finalOrderId } : {}),
    createdAt: draft.createdAt,
  });

  const toAdminPaymentRequest = (
    reqRec: ServerPaymentRequestRecord,
    order?: any,
    draft?: ServerCheckoutDraft
  ): DSLinkPayRequestAdmin => {
    const pub = toPublicPaymentRequest(reqRec, order, draft);
    const payPath = `/pay/${reqRec.token}`;
    const payUrl = `${CANONICAL_PAY_ORIGIN}${payPath}`;
    const whatsappShareMessage = buildPaymentRequestShareMessage({
      orderId: pub.orderId,
      requestRef: pub.requestRef,
      requestedAmount: pub.requestedAmount,
      requestedAmountBdt: pub.requestedAmountBdt,
      currency: pub.currency,
      payUrl,
      paymentType: pub.paymentType,
      remainingAfterThisPaymentAmount: pub.remainingAfterThisPaymentAmount,
      remainingAfterThisPaymentBdt: pub.remainingAfterThisPaymentBdt,
    });
    const phone = order?.phone || order?.customerPhone || draft?.phone || draft?.customerPhone;
    const whatsappShareUrl = buildWhatsAppShareUrl(whatsappShareMessage, phone);
    return {
      ...pub,
      payPath,
      payUrl,
      createdBy: reqRec.createdBy,
      ...(reqRec.senderHint ? { senderHint: reqRec.senderHint } : {}),
      ...(reqRec.verifiedBy ? { verifiedBy: reqRec.verifiedBy } : {}),
      ...(typeof reqRec.verifiedAmount === "number" ? { verifiedAmount: reqRec.verifiedAmount } : {}),
      ...(typeof reqRec.verifiedAmountBdt === "number" ? { verifiedAmountBdt: reqRec.verifiedAmountBdt } : {}),
      ...(reqRec.note ? { note: reqRec.note } : {}),
      ...(reqRec.replacedById ? { replacedById: reqRec.replacedById } : {}),
      ...(draft ? { draft: toDraftAdminSummary(draft) } : {}),
      whatsappShareMessage,
      whatsappShareUrl,
    };
  };

  const persistPaymentRequestRecord = async (record: ServerPaymentRequestRecord) => {
    persistLocalStore();
    const activeDb = await getActiveFirestoreDb();
    if (activeDb) {
      try {
        await setDoc(doc(activeDb, "payment_requests", record.id), record, { merge: true });
      } catch (dbErr: any) {
        if (isFirestoreUnavailableError(dbErr)) {
          disableFirestoreGracefully(dbErr?.message || "payment_request write failed");
        }
      }
    }
  };

  const createPaymentRequestForDraft = async (opts: {
    draft: ServerCheckoutDraft;
    expiresInHours?: number;
    createdBy: string;
    checkoutIdempotencyKey?: string;
    note?: string;
  }): Promise<ServerPaymentRequestRecord> => {
    const { draft } = opts;
    const currency = draft.currency;
    const requestedAmount = roundCurrencyAmount(draft.payableNowAmount, currency);
    const requestedAmountBdt =
      currency === "BDT" ? Math.round(requestedAmount) : Math.round(draft.orderTotalBdt);
    const hours = Math.min(720, Math.max(1, Number(opts.expiresInHours) || 72));
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const id = `PR-${nowMs}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const eligibleMethods = computeEligibleMethodsForPaymentRequest({
      countryCode: draft.countryCode,
      currency,
      isRentalOrder: draft.isRentalOrder,
      paymentType: "full",
      codAvailable: draft.codAvailable,
      requestedAmount,
      remainingBalanceAmount: draft.orderTotalAmount,
      stripeCardEnabled: isStripeConfiguredAndEnabled(),
    });

    const record: ServerPaymentRequestRecord = {
      id,
      token: generateSecurePayToken(),
      requestRef: draft.draftId,
      orderId: "",
      draftId: draft.draftId,
      paymentType: "full",
      requestedAmount,
      requestedAmountMinor: toMinorUnits(requestedAmount, currency),
      requestedAmountBdt,
      currency,
      eligibleMethods,
      status: "pending",
      ...(draft.rentalBreakdown ? { rentalBreakdown: draft.rentalBreakdown } : {}),
      ...(draft.codAdvanceRequiredAmount > 0
        ? {
            codAdvanceRequiredAmount: draft.codAdvanceRequiredAmount,
            codRemainingOnDeliveryAmount: draft.codRemainingOnDeliveryAmount,
          }
        : {}),
      ...(opts.checkoutIdempotencyKey ? { checkoutIdempotencyKey: opts.checkoutIdempotencyKey } : {}),
      createdBy: opts.createdBy,
      expiresAt: new Date(nowMs + hours * 3600 * 1000).toISOString(),
      ...(opts.note ? { note: opts.note } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    inMemoryPaymentRequests.unshift(record);
    await persistPaymentRequestRecord(record);
    return record;
  };

  const createPaymentRequestForOrder = async (opts: {
    order: any;
    paymentType: DSLinkPayType;
    requestedAmount: number;
    currency?: DSLinkPayCurrency;
    expiresInHours?: number;
    createdBy: string;
    checkoutIdempotencyKey?: string;
    note?: string;
    revokePreviousReason?: string;
    subscriptionPlanId?: string;
    subscriptionPlanName?: string;
    subscriptionBillingPeriod?: string;
  }): Promise<ServerPaymentRequestRecord> => {
    const summary = recomputeOrderPaymentSummary(opts.order);
    const currency: DSLinkPayCurrency = opts.currency || summary.currency;
    const amount = roundCurrencyAmount(Math.max(0.5, Number(opts.requestedAmount) || 0), currency);
    const hours = Math.min(720, Math.max(1, Number(opts.expiresInHours) || 72));
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const id = `PR-${nowMs}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    if (opts.revokePreviousReason && opts.paymentType !== "subscription") {
      revokeActivePaymentRequestsForOrder(opts.order.orderId, opts.revokePreviousReason, id);
    }

    const eligibleMethods = computeEligibleMethodsForPaymentRequest({
      countryCode: normalizeCountryCode(opts.order.countryCode || "BD"),
      currency,
      isRentalOrder: isOrderRental(opts.order),
      paymentType: opts.paymentType,
      codAvailable: Boolean(opts.order.codAvailable) && !isOrderRental(opts.order),
      requestedAmount: amount,
      remainingBalanceAmount: summary.remainingBalanceAmount,
      stripeCardEnabled: isStripeConfiguredAndEnabled(),
    });

    const record: ServerPaymentRequestRecord = {
      id,
      token: generateSecurePayToken(),
      requestRef: opts.order.orderId,
      orderId: opts.order.orderId,
      paymentType: opts.paymentType,
      requestedAmount: amount,
      requestedAmountMinor: toMinorUnits(amount, currency),
      requestedAmountBdt: currency === "BDT" ? Math.round(amount) : Math.round(amount / getDSLinkRulesConfig().bdtToUsdRate),
      currency,
      eligibleMethods,
      status: "pending",
      ...(opts.order.rentalBreakdown ? { rentalBreakdown: opts.order.rentalBreakdown } : {}),
      ...(opts.subscriptionPlanId ? { subscriptionPlanId: opts.subscriptionPlanId } : {}),
      ...(opts.subscriptionPlanName ? { subscriptionPlanName: opts.subscriptionPlanName } : {}),
      ...(opts.subscriptionBillingPeriod ? { subscriptionBillingPeriod: opts.subscriptionBillingPeriod } : {}),
      ...(opts.checkoutIdempotencyKey ? { checkoutIdempotencyKey: opts.checkoutIdempotencyKey } : {}),
      createdBy: opts.createdBy,
      expiresAt: new Date(nowMs + hours * 3600 * 1000).toISOString(),
      ...(opts.note ? { note: opts.note } : {}),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    inMemoryPaymentRequests.unshift(record);
    await persistPaymentRequestRecord(record);
    return record;
  };

  /**
   * Creates or reuses ONE single subscription payment request on the SAME rental order
   * for a given plan & billing period. Both "Mark Delivered" and "Start Activation" call this
   * exact helper so both events ALWAYS resolve to the same payment request.
   */
  const createOrReuseRentalSubscriptionRequest = async (opts: {
    order: any;
    planId?: string;
    billingPeriod?: string;
    createdBy: string;
  }): Promise<{ paymentRequest: ServerPaymentRequestRecord; reused: boolean }> => {
    const plan =
      RENTAL_SUBSCRIPTION_PLANS.find((p) => p.id === String(opts.planId || "").trim()) ||
      RENTAL_SUBSCRIPTION_PLANS[0];
    const billingPeriod =
      String(opts.billingPeriod || "").trim().slice(0, 32) ||
      new Date().toISOString().slice(0, 7); // YYYY-MM

    const existing = inMemoryPaymentRequests.find((r) => {
      evaluateRequestExpiry(r);
      return (
        r.orderId === opts.order.orderId &&
        r.paymentType === "subscription" &&
        r.subscriptionPlanId === plan.id &&
        r.subscriptionBillingPeriod === billingPeriod &&
        (r.status === "pending" || r.status === "under_review" || r.status === "paid" || r.status === "rejected")
      );
    });

    if (existing) {
      return { paymentRequest: existing, reused: true };
    }

    const created = await createPaymentRequestForOrder({
      order: opts.order,
      paymentType: "subscription",
      requestedAmount: plan.monthlyFeeBdt,
      currency: "BDT",
      expiresInHours: 168,
      createdBy: opts.createdBy,
      subscriptionPlanId: plan.id,
      subscriptionPlanName: plan.name,
      subscriptionBillingPeriod: billingPeriod,
      note: `Rental subscription (${plan.name}, ${billingPeriod})`,
    });

    return { paymentRequest: created, reused: false };
  };

  // Public Checkout Endpoint (Cart -> Validated Address -> Checkout Draft -> DSLink Pay Link)
  app.post("/api/promos/order", rateLimitMutation(25), async (req, res) => {
    try {
      await hydratePricingFromFirestore();
      const {
        orderId: requestedOrderId,
        fullName = "",
        phone = "",
        email = "",
        address = "",
        district = "Dhaka",
        shippingAddress,
        countryCode,
        paymentMethod = "dslink_pay",
        trxId = "",
        senderBankName = "",
        senderNumber = "",
        productId = "",
        productName = "Starlink Standard 4X USA Kit + Roam Unlimited Internet",
        quantity = 1,
        items,
        currency = "BDT",
        checkoutIdempotencyKey = "",
        requireDeliveryAddress = false,
      } = req.body || {};

      const cleanIdempotencyKey = String(checkoutIdempotencyKey || "").trim().slice(0, 128);
      const resolvedCountry = countryCode
        ? normalizeCountryCode(countryCode)
        : normalizeCountryCode(
            String(district || "").toLowerCase().includes("international") ||
              String(district || "").toLowerCase().includes("worldwide")
              ? "US"
              : "BD"
          );

      if (requireDeliveryAddress) {
        const addrObj = shippingAddress && typeof shippingAddress === "object" ? shippingAddress : null;
        const missing: string[] = [];
        if (!String(fullName || addrObj?.fullName || "").trim()) missing.push("Full Name");
        if (
          !String(phone || addrObj?.phone || "").trim() ||
          String(phone || addrObj?.phone || "").replace(/[^0-9]/g, "").length < 7
        ) {
          missing.push("Valid Phone Number");
        }
        if (!String(addrObj?.houseFlat || address || "").trim()) missing.push("House/Flat");
        if (!String(addrObj?.roadStreet || "").trim()) missing.push("Road/Street");
        if (!String(addrObj?.area || "").trim()) missing.push("Area/Thana");
        if (!String(addrObj?.cityDistrict || district || "").trim()) missing.push("City/District");
        if (!String(addrObj?.stateDivision || "").trim()) missing.push("State/Division");
        if (!String(addrObj?.postalCode || "").trim()) missing.push("Postal Code");
        if (missing.length > 0) {
          return res.status(400).json({
            success: false,
            error: `Please complete all required delivery address fields: ${missing.join(", ")}.`,
          });
        }
      }

      // Resolve authoritative catalog products strictly on server
      const catalogEntries: Array<{ product: any; quantity: number }> = [];
      if (Array.isArray(items) && items.length > 0) {
        for (const rawItem of items.slice(0, 20)) {
          const itemQty = Math.min(20, Math.max(1, Math.floor(Number(rawItem?.quantity) || 1)));
          const prod = resolveAuthoritativeProduct(rawItem?.productId, rawItem?.name);
          catalogEntries.push({ product: prod, quantity: itemQty });
        }
      } else {
        const qty = Math.min(50, Math.max(1, Math.floor(Number(quantity) || 1)));
        const matchedProduct = resolveAuthoritativeProduct(productId, productName);
        catalogEntries.push({ product: matchedProduct, quantity: qty });
      }

      const rules = getDSLinkRulesConfig();
      const evaluation = evaluateCheckoutEligibility({
        countryCode: resolvedCountry,
        items: catalogEntries,
        rules,
        stripeCardEnabled: isStripeConfiguredAndEnabled(),
      });

      if (!evaluation.valid) {
        return res.status(400).json({
          success: false,
          inquiryRequired: !evaluation.carrierSupported,
          error: evaluation.error || "Checkout items or destination are not eligible.",
          errorBn: evaluation.errorBn,
          ineligibleItems: evaluation.ineligibleItems,
          countryCode: evaluation.countryCode,
        });
      }

      // Idempotent Checkout Reuse: Refreshing or double-clicking reuses the SAME active draft/order & DSLink Pay link!
      if (cleanIdempotencyKey.length >= 8) {
        const existingReq = inMemoryPaymentRequests.find((r) => {
          evaluateRequestExpiry(r);
          return (
            r.checkoutIdempotencyKey === cleanIdempotencyKey &&
            (r.status === "pending" || r.status === "under_review") &&
            r.currency === evaluation.currency &&
            Math.abs(r.requestedAmount - evaluation.payableNowAmount) < 0.01
          );
        });
        if (existingReq) {
          const ctx = resolveRequestContext(existingReq);
          if (ctx.entity && ctx.entity.countryCode === evaluation.countryCode) {
            const adminPay = toAdminPaymentRequest(existingReq, ctx.order, ctx.draft);
            return res.json({
              success: true,
              reused: true,
              isDraftOnly: adminPay.isDraftOnly,
              draftId: ctx.draft?.draftId,
              requestRef: adminPay.requestRef,
              orderId: adminPay.orderId,
              status: ctx.order?.status || "Draft Awaiting Payment",
              paymentStatus: ctx.order?.paymentStatus || "Awaiting Payment",
              fulfillmentStatus: ctx.order?.fulfillmentStatus || "Draft",
              countryCode: evaluation.countryCode,
              carriers: ctx.entity.carriers,
              codAvailable: evaluation.codAvailable,
              currency: evaluation.currency,
              paymentMethod,
              productId: ctx.entity.productId,
              productName: ctx.entity.productName,
              items: evaluation.items,
              quantity: ctx.entity.quantity,
              subtotal: evaluation.subtotalAmount,
              shippingFee: evaluation.shippingFeeAmount,
              totalAmount: evaluation.orderTotalAmount,
              payableNowAmount: evaluation.payableNowAmount,
              rentalBreakdown: evaluation.rentalBreakdown,
              eligibleMethods: adminPay.eligibleMethods,
              cardUnavailableForDestination: adminPay.cardUnavailableForDestination,
              paymentRequest: {
                id: adminPay.id,
                token: adminPay.token,
                requestRef: adminPay.requestRef,
                payPath: adminPay.payPath,
                payUrl: adminPay.payUrl,
                status: adminPay.status,
                requestedAmount: adminPay.requestedAmount,
                requestedAmountBdt: adminPay.requestedAmountBdt,
                currency: adminPay.currency,
                eligibleMethods: adminPay.eligibleMethods,
                cardUnavailableForDestination: adminPay.cardUnavailableForDestination,
                expiresAt: adminPay.expiresAt,
              },
              message: "Reused existing active DSLink Pay payment request.",
            });
          }
        }
      }

      const primaryItem = evaluation.items[0];
      const totalQty = evaluation.items.reduce((sum, i) => sum + i.quantity, 0);
      const ratesSnap = await getLiveExchangeRates();
      const targetCurrency = normalizeCurrencyCode(currency);
      const converted = convertFromBdt(evaluation.orderTotalBdt, targetCurrency, ratesSnap.rates);
      const normalizedAddressObj = shippingAddress || {
        fullName,
        phone,
        houseFlat: address,
        roadStreet: "",
        area: "",
        cityDistrict: district,
        stateDivision: district,
        postalCode: "",
        countryCode: evaluation.countryCode,
      };
      const kitSummary =
        evaluation.items.length > 1
          ? evaluation.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")
          : primaryItem.name;

      // DRAFT-FIRST PREPAID CHECKOUT FLOW:
      // For dslink_pay (default cart checkout), save a checkout draft and create its shareable DSLink Pay link.
      // Do NOT create a final order prematurely — final order is created atomically upon verified payment or eligible COD selection!
      if (paymentMethod === "dslink_pay" || paymentMethod === "bangla_qr" || paymentMethod === "international_prepaid") {
        const draftId = `DRF-${Math.floor(100000 + Math.random() * 900000)}`;
        const nowIso = new Date().toISOString();
        const draft: ServerCheckoutDraft = {
          draftId,
          ...(cleanIdempotencyKey ? { checkoutIdempotencyKey: cleanIdempotencyKey } : {}),
          customerName: fullName,
          fullName,
          customerPhone: phone,
          phone,
          customerEmail: email,
          email,
          address,
          district,
          shippingAddress: normalizedAddressObj,
          countryCode: evaluation.countryCode,
          countryName: evaluation.countryName,
          carriers: getCarriersForCountry(evaluation.countryCode),
          currency: evaluation.currency,
          isRentalOrder: evaluation.hasRental,
          hasBdResidential: evaluation.hasBdResidential,
          codAvailable: evaluation.codAvailable,
          codAdvanceRequiredAmount: evaluation.codAdvanceRequiredAmount,
          codRemainingOnDeliveryAmount: evaluation.codRemainingOnDeliveryAmount,
          ...(evaluation.rentalBreakdown ? { rentalBreakdown: evaluation.rentalBreakdown } : {}),
          productId: primaryItem.productId,
          productName: kitSummary,
          kitName: evaluation.items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
          items: evaluation.items,
          quantity: totalQty,
          subtotalBdt: evaluation.subtotalBdt,
          shippingFeeBdt: evaluation.shippingFeeBdt,
          orderTotalBdt: evaluation.orderTotalBdt,
          subtotalAmount: evaluation.subtotalAmount,
          shippingFeeAmount: evaluation.shippingFeeAmount,
          orderTotalAmount: evaluation.orderTotalAmount,
          payableNowAmount: evaluation.payableNowAmount,
          remainingDueLaterAmount: evaluation.remainingDueLaterAmount,
          displayCurrency: targetCurrency,
          estimatedConvertedTotal: converted.amount,
          status: "draft",
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        inMemoryCheckoutDrafts.unshift(draft);
        const payRequest = await createPaymentRequestForDraft({
          draft,
          expiresInHours: 72,
          createdBy: "customer_checkout",
          checkoutIdempotencyKey: cleanIdempotencyKey || undefined,
        });
        const payAdminMeta = toAdminPaymentRequest(payRequest, undefined, draft);

        recordAuditLog(
          "checkout_draft_created",
          email || phone || "customer",
          draftId,
          {
            countryCode: evaluation.countryCode,
            currency: evaluation.currency,
            payableNowAmount: evaluation.payableNowAmount,
            orderTotalAmount: evaluation.orderTotalAmount,
            isRentalOrder: evaluation.hasRental,
            paymentRequestId: payRequest.id,
          },
          extractClientIp(req)
        );

        return res.json({
          success: true,
          reused: false,
          isDraftOnly: true,
          draftId,
          requestRef: draftId,
          orderId: "",
          status: "Draft Awaiting Payment",
          paymentStatus: "Awaiting Payment",
          fulfillmentStatus: "Draft",
          countryCode: evaluation.countryCode,
          carriers: draft.carriers,
          codAvailable: evaluation.codAvailable,
          currency: evaluation.currency,
          paymentMethod: "dslink_pay",
          productId: primaryItem.productId,
          productName: kitSummary,
          items: evaluation.items,
          unitPrice: primaryItem.unitPrice,
          quantity: totalQty,
          subtotal: evaluation.subtotalAmount,
          shippingFee: evaluation.shippingFeeAmount,
          totalAmount: evaluation.orderTotalAmount,
          payableNowAmount: evaluation.payableNowAmount,
          rentalBreakdown: evaluation.rentalBreakdown,
          eligibleMethods: payAdminMeta.eligibleMethods,
          cardUnavailableForDestination: payAdminMeta.cardUnavailableForDestination,
          displayCurrency: targetCurrency,
          estimatedConvertedTotal: converted.amount,
          paymentRequest: {
            id: payAdminMeta.id,
            token: payAdminMeta.token,
            requestRef: payAdminMeta.requestRef,
            payPath: payAdminMeta.payPath,
            payUrl: payAdminMeta.payUrl,
            status: payAdminMeta.status,
            requestedAmount: payAdminMeta.requestedAmount,
            requestedAmountBdt: payAdminMeta.requestedAmountBdt,
            currency: payAdminMeta.currency,
            eligibleMethods: payAdminMeta.eligibleMethods,
            cardUnavailableForDestination: payAdminMeta.cardUnavailableForDestination,
            expiresAt: payAdminMeta.expiresAt,
          },
          message: "Checkout draft saved and DSLink Pay payment link created.",
        });
      }

      // Direct COD checkout (ONLY allowed for eligible BD purchase kits when no advance is required)
      if (paymentMethod === "cod" && !evaluation.codAvailable) {
        return res.status(400).json({
          success: false,
          error: "Cash on Delivery is not eligible for this destination or kit type.",
        });
      }

      const orderId = String(requestedOrderId || `DS-${Math.floor(100000 + Math.random() * 900000)}`).trim();
      const orderAccessToken = generateOrderAccessToken();
      const orderDoc: any = {
        orderId,
        orderAccessToken,
        checkoutIdempotencyKey: cleanIdempotencyKey || undefined,
        customerName: fullName,
        fullName,
        customerPhone: phone,
        phone,
        customerEmail: email,
        email,
        address,
        district,
        shippingAddress: normalizedAddressObj,
        countryCode: evaluation.countryCode,
        countryName: evaluation.countryName,
        carriers: getCarriersForCountry(evaluation.countryCode),
        currency: evaluation.currency,
        isRentalOrder: evaluation.hasRental,
        codAvailable: evaluation.codAvailable,
        paymentMethod: "cod",
        paymentStatus: "Pending COD Collection",
        fulfillmentStatus: "Pending",
        paidAmount: 0,
        remainingBalanceAmount: evaluation.orderTotalAmount,
        paidAmountBdt: 0,
        remainingBalanceBdt: evaluation.orderTotalBdt,
        codAmountToCollectBdt: evaluation.orderTotalBdt,
        trxId,
        senderBankName,
        senderNumber,
        productId: primaryItem.productId,
        kitName: evaluation.items.map((i) => `${i.name} ×${i.quantity}`).join(", "),
        productName: kitSummary,
        items: evaluation.items,
        unitPrice: primaryItem.unitPrice,
        quantity: totalQty,
        subtotal: evaluation.subtotalAmount,
        subtotalBdt: evaluation.subtotalBdt,
        shippingFee: evaluation.shippingFeeAmount,
        shippingFeeBdt: evaluation.shippingFeeBdt,
        discount: 0,
        totalAmount: evaluation.orderTotalAmount,
        orderTotalAmount: evaluation.orderTotalAmount,
        orderTotalBdt: evaluation.orderTotalBdt,
        price: evaluation.orderTotalAmount,
        displayCurrency: targetCurrency,
        estimatedConvertedTotal: converted.amount,
        status: "Pending Confirmation",
        source: evaluation.items.length > 1 ? "cart_checkout" : "promos_or_dslink",
        createdAt: new Date().toISOString(),
      };

      inMemoryOrders.unshift(orderDoc);
      persistLocalStore();

      const payRequest = await createPaymentRequestForOrder({
        order: orderDoc,
        paymentType: "full",
        requestedAmount: evaluation.payableNowAmount,
        currency: evaluation.currency,
        expiresInHours: 72,
        createdBy: "customer_checkout",
        checkoutIdempotencyKey: cleanIdempotencyKey || undefined,
      });
      const payAdminMeta = toAdminPaymentRequest(payRequest, orderDoc);

      return res.json({
        success: true,
        reused: false,
        isDraftOnly: false,
        orderId,
        requestRef: orderId,
        orderAccessToken,
        status: orderDoc.status,
        paymentStatus: orderDoc.paymentStatus,
        fulfillmentStatus: orderDoc.fulfillmentStatus,
        countryCode: evaluation.countryCode,
        carriers: orderDoc.carriers,
        codAvailable: evaluation.codAvailable,
        currency: evaluation.currency,
        paymentMethod: orderDoc.paymentMethod,
        productId: primaryItem.productId,
        productName: orderDoc.productName,
        items: evaluation.items,
        unitPrice: primaryItem.unitPrice,
        quantity: totalQty,
        subtotal: evaluation.subtotalAmount,
        shippingFee: evaluation.shippingFeeAmount,
        totalAmount: evaluation.orderTotalAmount,
        displayCurrency: targetCurrency,
        estimatedConvertedTotal: converted.amount,
        paymentRequest: {
          id: payAdminMeta.id,
          token: payAdminMeta.token,
          requestRef: payAdminMeta.requestRef,
          payPath: payAdminMeta.payPath,
          payUrl: payAdminMeta.payUrl,
          status: payAdminMeta.status,
          requestedAmount: payAdminMeta.requestedAmount,
          requestedAmountBdt: payAdminMeta.requestedAmountBdt,
          currency: payAdminMeta.currency,
          eligibleMethods: payAdminMeta.eligibleMethods,
          expiresAt: payAdminMeta.expiresAt,
        },
        message: "Order saved and DSLink Pay payment link created.",
      });
    } catch (error: any) {
      console.error("Promo order endpoint error:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to place order",
      });
    }
  });

  // ============================================================================
  // DSLINK PAY — PUBLIC SCOPED PAYMENT LINK ENDPOINTS (ZERO PII, NO LOGIN NEEDED)
  // ============================================================================
  app.get("/api/pay/:token", (req, res) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const token = String(req.params.token || "").trim();
    if (!PAY_TOKEN_REGEX.test(token)) {
      return res.status(404).json({ success: false, error: "Payment link not found." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.token === token);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment link not found or unavailable." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or checkout draft was not found." });
    }
    return res.json({
      success: true,
      paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
    });
  });

  app.post("/api/pay/:token/submit", rateLimitMutation(20), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const token = String(req.params.token || "").trim();
    if (!PAY_TOKEN_REGEX.test(token)) {
      return res.status(404).json({ success: false, error: "Invalid payment link." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.token === token);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment link not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }

    evaluateRequestExpiry(reqRec);

    if (reqRec.status === "paid") {
      return res.status(409).json({
        success: false,
        error: "এই পেমেন্ট লিংকের পেমেন্ট ইতিমধ্যে নিশ্চিত হয়েছে। (This payment link is already paid.)",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }
    if (reqRec.status === "expired") {
      return res.status(410).json({
        success: false,
        error: "এই পেমেন্ট লিংকের মেয়াদ শেষ হয়ে গেছে। (This payment link has expired.)",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }
    if (reqRec.status === "revoked" || reqRec.status === "cancelled") {
      return res.status(410).json({
        success: false,
        error: "পেমেন্ট রিকোয়েস্ট বাতিল হয়েছে। নতুন পেমেন্ট জমা দেওয়া যাবে না। (This payment request is cancelled or no longer active.)",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }
    if (reqRec.status === "under_review") {
      return res.status(409).json({
        success: false,
        error: "পেমেন্ট যাচাই চলছে। আপনার ট্রানজেকশন আইডি ইতিমধ্যে জমা হয়েছে।",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }
    if (reqRec.status === "cod_selected") {
      return res.status(409).json({
        success: false,
        error: "এই অর্ডারের জন্য ক্যাশ অন ডেলিভারি নির্বাচিত হয়েছে।",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }

    const {
      method = "bangla_qr",
      trxId = "",
      institutionId = "",
      institutionName = "",
      senderHint = "",
    } = req.body || {};

    if (method !== "bangla_qr" && method !== "bank_transfer") {
      return res.status(400).json({
        success: false,
        error: "Select an eligible MFS or Bank Bangla QR option to submit a transaction ID.",
      });
    }

    // Strictly enforce server-side method eligibility (blocks MFS/Bank/QR/TrxID for international USD requests!)
    const { eligibleMethods } = computeLiveEligibleMethodsForRequest(reqRec, ctx.entity);
    if (!eligibleMethods.includes(method) || reqRec.currency !== "BDT") {
      return res.status(400).json({
        success: false,
        error: "MFS, Bank, and Bangla QR payments are not eligible for this destination or currency.",
      });
    }

    const rawTrx = String(trxId || "").trim();
    const normTrx = normalizeTrxId(rawTrx);
    if (!normTrx || !TRX_ID_REGEX.test(normTrx)) {
      return res.status(400).json({
        success: false,
        error: "সঠিক ট্রানজেকশন আইডি (TrxID) দিন (৪ থেকে ৬৪ অক্ষর, শুধু ইংরেজি অক্ষর ও সংখ্যা)।",
      });
    }

    const duplicate = findDuplicateTrxIdConflict(normTrx, {
      excludeRequestId: reqRec.id,
      excludeOrderId: ctx.order?.orderId,
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        error: "এই ট্রানজেকশন আইডি ইতিমধ্যে অন্য একটি রিকোয়েস্টে ব্যবহৃত হয়েছে। সঠিক TrxID দিন অথবা সাপোর্টে যোগাযোগ করুন।",
      });
    }

    const nowIso = new Date().toISOString();
    reqRec.status = "under_review";
    reqRec.submittedMethod = method;
    reqRec.submittedTrxId = rawTrx.slice(0, 64);
    reqRec.normalizedTrxId = normTrx;
    reqRec.selectedInstitutionId = String(institutionId || "").trim().slice(0, 64) || undefined;
    reqRec.selectedInstitutionName = String(institutionName || "").trim().slice(0, 120) || undefined;
    reqRec.senderHint = String(senderHint || "").trim().slice(0, 80) || undefined;
    reqRec.rejectionReason = undefined;
    reqRec.submittedAt = nowIso;
    reqRec.updatedAt = nowIso;

    if (ctx.order) {
      ctx.order.paymentMethod = method;
      ctx.order.trxId = reqRec.submittedTrxId;
      if (reqRec.selectedInstitutionName) ctx.order.senderBankName = reqRec.selectedInstitutionName;
      if (reqRec.senderHint) ctx.order.senderNumber = reqRec.senderHint;
      recomputeOrderPaymentSummary(ctx.order);
    }

    await persistPaymentRequestRecord(reqRec);

    recordAuditLog(
      "dslink_pay_reference_submitted",
      "customer",
      reqRec.requestRef,
      {
        paymentRequestId: reqRec.id,
        draftId: reqRec.draftId || null,
        orderId: reqRec.orderId || null,
        method,
        trxId: reqRec.submittedTrxId,
        institution: reqRec.selectedInstitutionName || null,
        requestedAmount: reqRec.requestedAmount,
        currency: reqRec.currency,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      message: "পেমেন্ট যাচাই চলছে। আপনার ট্রানজেকশন আইডি সফলভাবে জমা হয়েছে।",
      paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
    });
  });

  app.post("/api/pay/:token/select-cod", rateLimitMutation(20), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const token = String(req.params.token || "").trim();
    if (!PAY_TOKEN_REGEX.test(token)) {
      return res.status(404).json({ success: false, error: "Invalid payment link." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.token === token);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment link not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }

    evaluateRequestExpiry(reqRec);

    const { eligibleMethods } = computeLiveEligibleMethodsForRequest(reqRec, ctx.entity);
    if (!eligibleMethods.includes("cod")) {
      return res.status(400).json({
        success: false,
        error: "এই অর্ডারের জন্য ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য নয়। (Cash on Delivery is not eligible for this payment request.)",
      });
    }
    if (reqRec.status !== "pending" && reqRec.status !== "rejected") {
      return res.status(409).json({
        success: false,
        error: "এই পেমেন্ট লিংকটি আর পরিবর্তনযোগ্য নয়।",
        paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
      });
    }
    if (reqRec.codAdvanceRequiredAmount && reqRec.codAdvanceRequiredAmount > 0) {
      return res.status(400).json({
        success: false,
        error: `ক্যাশ অন ডেলিভারির আগে অগ্রিম ৳${reqRec.codAdvanceRequiredAmount.toLocaleString("en-US")} পরিশোধ করতে হবে।`,
      });
    }

    let order = ctx.order;
    if (!order && ctx.draft) {
      order = createFinalOrderFromDraft(ctx.draft, {
        paymentMethod: "cod",
        paymentStatus: "Pending COD Collection",
        orderStatus: "Pending Confirmation",
      });
      reqRec.orderId = order.orderId;
      reqRec.requestRef = order.orderId;
    }

    const nowIso = new Date().toISOString();
    reqRec.status = "cod_selected";
    reqRec.submittedMethod = "cod";
    reqRec.submittedAt = nowIso;
    reqRec.updatedAt = nowIso;

    if (order) {
      order.paymentMethod = "cod";
      recomputeOrderPaymentSummary(order);
    }
    await persistPaymentRequestRecord(reqRec);

    recordAuditLog(
      "dslink_pay_cod_selected",
      "customer",
      reqRec.orderId || reqRec.requestRef,
      {
        paymentRequestId: reqRec.id,
        codAmountBdt: order?.codAmountToCollectBdt ?? reqRec.requestedAmountBdt,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      message: "ক্যাশ অন ডেলিভারি নির্বাচিত হয়েছে। ডেলিভারির সময় নির্ধারিত টাকা পরিশোধ করুন।",
      paymentRequest: toPublicPaymentRequest(reqRec, order, ctx.draft),
    });
  });

  // DSLink Pay — Start COD Advance Payment Request when COD requires an upfront advance (BD purchase kits only)
  app.post("/api/pay/:token/start-cod-advance", rateLimitMutation(20), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    const token = String(req.params.token || "").trim();
    if (!PAY_TOKEN_REGEX.test(token)) {
      return res.status(404).json({ success: false, error: "Invalid payment link." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.token === token);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment link not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }
    evaluateRequestExpiry(reqRec);
    const { eligibleMethods } = computeLiveEligibleMethodsForRequest(reqRec, ctx.entity);
    if (!eligibleMethods.includes("cod") || reqRec.currency !== "BDT") {
      return res.status(400).json({
        success: false,
        error: "এই অর্ডারের জন্য ক্যাশ অন ডেলিভারি (COD) প্রযোজ্য নয়।",
      });
    }
    if (reqRec.status !== "pending" && reqRec.status !== "rejected") {
      return res.status(409).json({
        success: false,
        error: "এই পেমেন্ট লিংকটি আর পরিবর্তনযোগ্য নয়।",
      });
    }
    const advanceAmt = Number(reqRec.codAdvanceRequiredAmount || 0);
    if (advanceAmt <= 0 || advanceAmt >= reqRec.requestedAmount) {
      return res.status(400).json({
        success: false,
        error: "এই অর্ডারের জন্য আলাদা COD অগ্রিম প্রয়োজন নেই।",
      });
    }

    // Reuse an existing active advance request for the same draft/order if present
    const existingAdvance = inMemoryPaymentRequests.find(
      (r) =>
        r.paymentType === "advance" &&
        r.requestedAmount === advanceAmt &&
        ((reqRec.orderId && r.orderId === reqRec.orderId) ||
          (reqRec.draftId && r.draftId === reqRec.draftId)) &&
        !evaluateRequestExpiry(r) &&
        (r.status === "pending" || r.status === "under_review")
    );
    if (existingAdvance) {
      return res.json({
        success: true,
        reused: true,
        payPath: `/pay/${existingAdvance.token}`,
        paymentRequest: toPublicPaymentRequest(existingAdvance, ctx.order, ctx.draft),
      });
    }

    const nowIso = new Date().toISOString();
    const advanceReq: ServerPaymentRequestRecord = {
      id: `PR-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      token: generateSecurePayToken(),
      orderId: reqRec.orderId || "",
      draftId: reqRec.draftId,
      requestRef: reqRec.orderId || reqRec.draftId || reqRec.requestRef,
      paymentType: "advance",
      currency: "BDT",
      requestedAmount: advanceAmt,
      requestedAmountMinor: toMinorUnits(advanceAmt, "BDT"),
      requestedAmountBdt: Math.round(advanceAmt),
      eligibleMethods: eligibleMethods.filter((m) => m !== "cod"),
      codAdvanceRequiredAmount: advanceAmt,
      codRemainingOnDeliveryAmount: Math.max(0, Math.round(reqRec.requestedAmount - advanceAmt)),
      status: "pending",
      expiresAt: reqRec.expiresAt,
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: "customer_cod_advance",
      note: `COD Advance (Remaining ৳${Math.max(0, Math.round(reqRec.requestedAmount - advanceAmt))} due on delivery)`,
    };
    inMemoryPaymentRequests.unshift(advanceReq);
    await persistPaymentRequestRecord(advanceReq);

    return res.json({
      success: true,
      reused: false,
      payPath: `/pay/${advanceReq.token}`,
      paymentRequest: toPublicPaymentRequest(advanceReq, ctx.order, ctx.draft),
    });
  });

  // DSLink Pay — Stripe-Hosted Card Checkout Session (BDT & USD, Draft or Order; Disabled when STRIPE_ENABLED !== "true")
  app.post("/api/pay/:token/stripe-checkout", rateLimitMutation(20), async (req, res) => {
    res.setHeader("Cache-Control", "no-store, private");
    res.setHeader("X-Robots-Tag", "noindex, nofollow");

    if (!isStripeEnabled()) {
      return res.status(403).json({
        success: false,
        error: "Card payments via Stripe are currently disabled.",
      });
    }

    const token = String(req.params.token || "").trim();
    if (!PAY_TOKEN_REGEX.test(token)) {
      return res.status(404).json({ success: false, error: "Invalid payment link." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.token === token);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment link not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }

    evaluateRequestExpiry(reqRec);

    const { eligibleMethods } = computeLiveEligibleMethodsForRequest(reqRec, ctx.entity);
    if (!eligibleMethods.includes("card")) {
      return res.status(403).json({
        success: false,
        error: "Card payment is not eligible or not configured for this payment request.",
      });
    }

    const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "https")
      .split(",")[0]
      .trim();
    const host = String(req.headers["x-forwarded-host"] || req.headers.host || "devsparksoft.com.bd")
      .split(",")[0]
      .trim();
    const origin = `${proto}://${host}`;

    const result = await createStripeCheckoutSessionForPaymentRequest({
      paymentRequest: reqRec,
      order: ctx.order,
      origin,
      onMutated: async () => {
        await persistPaymentRequestRecord(reqRec);
        recordAuditLog(
          "dslink_pay_stripe_session_created",
          "customer",
          reqRec.requestRef,
          {
            paymentRequestId: reqRec.id,
            stripeSessionId: reqRec.stripeSessionId,
            requestedAmount: reqRec.requestedAmount,
            currency: reqRec.currency,
          },
          extractClientIp(req)
        );
      },
    });

    return res.status(result.httpStatus).json({
      success: result.success,
      ...(result.sessionId ? { sessionId: result.sessionId } : {}),
      ...(result.url ? { url: result.url } : {}),
      ...(typeof result.reused === "boolean" ? { reused: result.reused } : {}),
      ...(result.error ? { error: result.error } : {}),
      paymentRequest: toPublicPaymentRequest(reqRec, ctx.order, ctx.draft),
    });
  });

  // Rental Activation Trigger — creates or reuses the EXACT SAME subscription payment request as Delivery
  app.post("/api/rental/orders/:orderId/start-activation", rateLimitMutation(20), async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const orderId = String(req.params.orderId || "").trim();
    const order = inMemoryOrders.find((o) => o.orderId === orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Rental order not found." });
    }
    if (!isOrderRental(order)) {
      return res.status(400).json({ success: false, error: "Order is not a Starlink Rental order." });
    }

    const { planId, billingPeriod } = req.body || {};
    const { paymentRequest, reused } = await createOrReuseRentalSubscriptionRequest({
      order,
      planId,
      billingPeriod,
      createdBy: "rental_activation",
    });

    order.activationStartedAt = order.activationStartedAt || new Date().toISOString();
    persistLocalStore();

    recordAuditLog(
      "rental_activation_subscription_request",
      "customer_or_staff",
      order.orderId,
      {
        paymentRequestId: paymentRequest.id,
        reused,
        planId: paymentRequest.subscriptionPlanId,
        billingPeriod: paymentRequest.subscriptionBillingPeriod,
      },
      extractClientIp(req)
    );

    const adminMeta = toAdminPaymentRequest(paymentRequest, order);
    return res.json({
      success: true,
      reused,
      orderId: order.orderId,
      paymentRequest: {
        id: adminMeta.id,
        token: adminMeta.token,
        requestRef: adminMeta.requestRef,
        payPath: adminMeta.payPath,
        payUrl: adminMeta.payUrl,
        status: adminMeta.status,
        requestedAmount: adminMeta.requestedAmount,
        currency: adminMeta.currency,
        subscriptionPlanId: adminMeta.subscriptionPlanId,
        subscriptionPlanName: adminMeta.subscriptionPlanName,
        subscriptionBillingPeriod: adminMeta.subscriptionBillingPeriod,
      },
    });
  });

  // ============================================================================
  // DSLINK PAY — AUTHORIZED STAFF / ADMIN MANAGEMENT ENDPOINTS
  // ============================================================================
  app.get("/api/admin/dslink-pay/orders", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    res.setHeader("Cache-Control", "no-store");

    const ordersWithPay = inMemoryOrders.map((order) => {
      const summary = recomputeOrderPaymentSummary(order);
      const requests = inMemoryPaymentRequests
        .filter((r) => r.orderId === order.orderId)
        .map((r) => {
          const draft = r.draftId
            ? inMemoryCheckoutDrafts.find((d) => d.draftId === r.draftId)
            : undefined;
          return toAdminPaymentRequest(r, order, draft);
        });
      return {
        orderId: order.orderId,
        draftId: order.draftId,
        customerName: order.fullName || order.customerName || "Customer",
        phone: order.phone || order.customerPhone || "",
        email: order.email || order.customerEmail || "",
        countryCode: order.countryCode || "BD",
        countryName: order.countryName || getCountryConfig(order.countryCode || "BD").name,
        currency: summary.currency,
        productName: order.productName || order.kitName || "Starlink Kit",
        items: buildEntityItemsSummary(order, summary.currency),
        subtotal: roundCurrencyAmount(Number(order.subtotal ?? order.totalAmount ?? 0) || 0, summary.currency),
        shippingFee: roundCurrencyAmount(Number(order.shippingFee ?? 0) || 0, summary.currency),
        totalAmount: summary.orderTotalAmount,
        paidAmount: summary.paidAmount,
        remainingBalanceAmount: summary.remainingBalanceAmount,
        paidAmountBdt: summary.paidAmountBdt,
        remainingBalanceBdt: summary.remainingBalanceBdt,
        codAvailable: Boolean(order.codAvailable) && !isOrderRental(order),
        isRentalOrder: isOrderRental(order),
        rentalBreakdown: order.rentalBreakdown,
        subscriptionPaymentStatus: order.subscriptionPaymentStatus,
        activeSubscriptionPlan: order.activeSubscriptionPlan,
        subscriptionBillingPeriod: order.subscriptionBillingPeriod,
        deliveredAt: order.deliveredAt,
        paymentMethod: order.paymentMethod || "bangla_qr",
        paymentStatus: order.paymentStatus || "Awaiting Payment",
        fulfillmentStatus: order.fulfillmentStatus || "Pending",
        status: order.status || "Pending",
        createdAt: order.createdAt,
        paymentRequests: requests,
      };
    });

    const allRequests = inMemoryPaymentRequests
      .map((r) => {
        const ctx = resolveRequestContext(r);
        return ctx.entity ? toAdminPaymentRequest(r, ctx.order, ctx.draft) : null;
      })
      .filter(Boolean) as DSLinkPayRequestAdmin[];

    const pendingPayments = allRequests.filter(
      (r) => r.status === "under_review" || (r.isDraftOnly && r.status === "pending")
    );

    const drafts = inMemoryCheckoutDrafts.map(toDraftAdminSummary);

    return res.json({
      success: true,
      orders: ordersWithPay,
      drafts,
      paymentRequests: allRequests,
      pendingPayments,
      emailJobs: inMemoryEmailJobs.slice(0, 100),
      diagnostics: getDSLinkConfigDiagnostics(),
      rentalPlans: RENTAL_SUBSCRIPTION_PLANS,
    });
  });

  app.post("/api/admin/dslink-pay/requests", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const {
      orderId = "",
      paymentType = "full",
      amount,
      amountBdt,
      expiresInHours = 72,
      note = "",
      planId,
      billingPeriod,
    } = req.body || {};

    const order = inMemoryOrders.find((o) => o.orderId === String(orderId).trim());
    if (!order) {
      return res.status(404).json({ success: false, error: "Selected order not found." });
    }

    const rental = isOrderRental(order);
    const resolvedType: DSLinkPayType =
      paymentType === "advance"
        ? "advance"
        : paymentType === "remaining"
        ? "remaining"
        : paymentType === "subscription"
        ? "subscription"
        : "full";

    if (resolvedType === "subscription") {
      if (!rental) {
        return res.status(400).json({
          success: false,
          error: "Subscription payment links are only eligible for Starlink Rental orders.",
        });
      }
      const { paymentRequest, reused } = await createOrReuseRentalSubscriptionRequest({
        order,
        planId,
        billingPeriod,
        createdBy: adminEmail,
      });
      return res.json({
        success: true,
        reused,
        paymentRequest: toAdminPaymentRequest(paymentRequest, order),
        message: reused
          ? "Reused existing active rental subscription link for this plan & billing period."
          : "Rental subscription DSLink Pay link created.",
      });
    }

    const summary = recomputeOrderPaymentSummary(order);
    if (summary.remainingBalanceAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "This order is already fully paid. No additional payment request can be created.",
      });
    }

    if (resolvedType === "advance" && rental) {
      return res.status(400).json({
        success: false,
        error: "Rental orders do not support partial advance splits — collect full shipping/activation fee or remaining balance.",
      });
    }

    const currency = summary.currency;
    let requestedAmount = summary.remainingBalanceAmount;
    if (resolvedType === "advance") {
      const rawAmt = amount !== undefined ? amount : amountBdt;
      const parsedAmount = roundCurrencyAmount(Number(rawAmt), currency);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount >= summary.remainingBalanceAmount) {
        return res.status(400).json({
          success: false,
          error: `Advance amount must be greater than 0 and less than remaining balance (${formatPayAmount(summary.remainingBalanceAmount, currency)} ${currency}).`,
        });
      }
      requestedAmount = parsedAmount;
    }

    const created = await createPaymentRequestForOrder({
      order,
      paymentType: resolvedType,
      requestedAmount,
      currency,
      expiresInHours: Number(expiresInHours) || 72,
      createdBy: adminEmail,
      note: String(note || "").trim().slice(0, 200) || undefined,
      revokePreviousReason: "Superseded by a new staff payment request",
    });

    recordAuditLog(
      "admin_dslink_pay_request_created",
      adminEmail,
      order.orderId,
      {
        paymentRequestId: created.id,
        paymentType: resolvedType,
        requestedAmount,
        currency,
        expiresAt: created.expiresAt,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      paymentRequest: toAdminPaymentRequest(created, order),
      message: "DSLink Pay link created. Share it with the customer via Copy Link or WhatsApp.",
    });
  });

  // Mark Rental Order Delivered -> Automatically creates or reuses ONE subscription payment request on the same rental order
  app.post("/api/admin/dslink-pay/orders/:orderId/mark-delivered", rateLimitMutation(30), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const order = inMemoryOrders.find((o) => o.orderId === req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const nowIso = new Date().toISOString();
    order.fulfillmentStatus = "Delivered";
    order.deliveredAt = order.deliveredAt || nowIso;
    order.updatedAt = nowIso;

    let subscriptionPayRequest: DSLinkPayRequestAdmin | null = null;
    let subscriptionReused = false;
    if (isOrderRental(order)) {
      const { planId, billingPeriod } = req.body || {};
      const result = await createOrReuseRentalSubscriptionRequest({
        order,
        planId,
        billingPeriod,
        createdBy: adminEmail,
      });
      subscriptionReused = result.reused;
      subscriptionPayRequest = toAdminPaymentRequest(result.paymentRequest, order);
    }

    persistLocalStore();
    recordAuditLog(
      "admin_order_marked_delivered",
      adminEmail,
      order.orderId,
      {
        isRentalOrder: isOrderRental(order),
        subscriptionPaymentRequestId: subscriptionPayRequest?.id || null,
        subscriptionReused,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      orderId: order.orderId,
      fulfillmentStatus: order.fulfillmentStatus,
      deliveredAt: order.deliveredAt,
      subscriptionReused,
      subscriptionPaymentRequest: subscriptionPayRequest,
    });
  });

  app.post("/api/admin/dslink-pay/requests/:id/verify", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const reqRec = inMemoryPaymentRequests.find((r) => r.id === req.params.id);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment request not found." });
    }

    const { trxId, verifiedAmount, verifiedAmountBdt, note } = req.body || {};
    const parsedVerified =
      verifiedAmount !== undefined
        ? Number(verifiedAmount)
        : verifiedAmountBdt !== undefined
        ? Number(verifiedAmountBdt)
        : undefined;

    const outcome = await finalizeVerifiedPaymentRequest({
      reqRec,
      verifiedBy: adminEmail,
      trxId,
      verifiedAmount: Number.isFinite(parsedVerified) ? parsedVerified : undefined,
      note,
      ip: extractClientIp(req),
    });

    if (!outcome.ok || !outcome.order) {
      return res.status(outcome.httpStatus).json({
        success: false,
        error: outcome.error || "Could not verify payment request.",
      });
    }

    const order = outcome.order;
    const summary = recomputeOrderPaymentSummary(order);
    const ctx = resolveRequestContext(reqRec);

    return res.json({
      success: true,
      message: `Payment confirmed (${formatPayAmount(outcome.verifiedAmount || reqRec.requestedAmount, reqRec.currency)} ${reqRec.currency}). Final order #${order.orderId}.`,
      orderId: order.orderId,
      paymentRequest: toAdminPaymentRequest(reqRec, order, ctx.draft),
      emailJob: outcome.emailJob || null,
      orderSummary: {
        orderId: order.orderId,
        currency: summary.currency,
        totalAmount: summary.orderTotalAmount,
        paidAmount: summary.paidAmount,
        remainingBalanceAmount: summary.remainingBalanceAmount,
        paidAmountBdt: summary.paidAmountBdt,
        remainingBalanceBdt: summary.remainingBalanceBdt,
        paymentStatus: order.paymentStatus,
      },
    });
  });

  app.post("/api/admin/dslink-pay/requests/:id/reject", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const reqRec = inMemoryPaymentRequests.find((r) => r.id === req.params.id);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment request not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }
    if (reqRec.status === "paid") {
      return res.status(409).json({ success: false, error: "Cannot reject an already verified paid request." });
    }

    const reason =
      String(req.body?.reason || "").trim().slice(0, 200) ||
      "Transaction reference could not be verified. Please check your TrxID and resubmit.";
    reqRec.status = "rejected";
    reqRec.rejectionReason = reason;
    reqRec.normalizedTrxId = undefined;
    reqRec.updatedAt = new Date().toISOString();

    if (ctx.order) recomputeOrderPaymentSummary(ctx.order);
    await persistPaymentRequestRecord(reqRec);

    recordAuditLog(
      "admin_dslink_pay_rejected",
      adminEmail,
      reqRec.requestRef,
      { paymentRequestId: reqRec.id, reason },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      paymentRequest: toAdminPaymentRequest(reqRec, ctx.order, ctx.draft),
    });
  });

  app.post("/api/admin/dslink-pay/requests/:id/cancel", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const reqRec = inMemoryPaymentRequests.find((r) => r.id === req.params.id);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment request not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }
    if (reqRec.status === "paid") {
      return res.status(409).json({ success: false, error: "Cannot cancel an already paid request." });
    }

    const cancellationReason =
      String(req.body?.reason || "").trim().slice(0, 240) ||
      "পেমেন্ট রিকোয়েস্ট DSLink টিম দ্বারা বাতিল করা হয়েছে।";

    const nowIso = new Date().toISOString();
    reqRec.status = "cancelled";
    reqRec.cancellationReason = cancellationReason;
    reqRec.revokedReason = cancellationReason;
    reqRec.normalizedTrxId = undefined;
    reqRec.updatedAt = nowIso;

    if (ctx.draft && !ctx.draft.finalOrderId) {
      ctx.draft.status = "cancelled";
      ctx.draft.updatedAt = nowIso;
    }
    if (ctx.order) {
      recomputeOrderPaymentSummary(ctx.order);
    }

    // Commit state BEFORE queuing/sending cancellation email
    await persistPaymentRequestRecord(reqRec);

    recordAuditLog(
      "admin_dslink_pay_cancelled",
      adminEmail,
      reqRec.requestRef,
      { paymentRequestId: reqRec.id, cancellationReason },
      extractClientIp(req)
    );

    const recipientEmail = String(
      ctx.order?.email || ctx.order?.customerEmail || ctx.draft?.email || ""
    ).trim();
    const emailJob = await enqueueAndSendDSLinkEmailJob({
      type: "payment_cancelled",
      paymentRequestId: reqRec.id,
      requestRef: reqRec.requestRef,
      orderId: ctx.order?.orderId,
      recipientEmail,
      amount: reqRec.requestedAmount,
      currency: reqRec.currency,
      cancellationReason,
      customerName: ctx.order?.fullName || ctx.draft?.fullName,
    });

    return res.json({
      success: true,
      paymentRequest: toAdminPaymentRequest(reqRec, ctx.order, ctx.draft),
      emailJob: emailJob || null,
    });
  });

  // Safe Email Delivery Retry (never duplicates orders or payments)
  app.post("/api/admin/dslink-pay/email-jobs/:jobId/retry", rateLimitMutation(30), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const job = inMemoryEmailJobs.find((j) => j.id === req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, error: "Email job not found." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.id === job.paymentRequestId);
    const ctx = reqRec ? resolveRequestContext(reqRec) : {};
    const { html } = buildDSLinkPayEmailContent({
      type: job.type,
      requestRef: job.requestRef,
      orderId: job.orderId,
      amount: reqRec?.verifiedAmount ?? reqRec?.requestedAmount ?? 0,
      currency: reqRec?.currency || "BDT",
      trxId: reqRec?.submittedTrxId,
      cancellationReason: reqRec?.cancellationReason,
      customerName: ctx.order?.fullName || ctx.draft?.fullName,
    });

    const updated = await deliverEmailJobViaRestApi(job, html);
    return res.json({
      success: true,
      emailJob: updated,
    });
  });

  app.post("/api/admin/dslink-pay/requests/:id/expire", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const reqRec = inMemoryPaymentRequests.find((r) => r.id === req.params.id);
    if (!reqRec) {
      return res.status(404).json({ success: false, error: "Payment request not found." });
    }
    const ctx = resolveRequestContext(reqRec);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }
    if (reqRec.status === "paid") {
      return res.status(409).json({ success: false, error: "Cannot expire an already paid request." });
    }

    reqRec.expiresAt = new Date(Date.now() - 1000).toISOString();
    reqRec.status = "expired";
    reqRec.updatedAt = new Date().toISOString();
    await persistPaymentRequestRecord(reqRec);

    return res.json({
      success: true,
      paymentRequest: toAdminPaymentRequest(reqRec, ctx.order, ctx.draft),
    });
  });

  app.post("/api/admin/dslink-pay/requests/:id/reissue", rateLimitMutation(40), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const oldReq = inMemoryPaymentRequests.find((r) => r.id === req.params.id);
    if (!oldReq) {
      return res.status(404).json({ success: false, error: "Payment request not found." });
    }
    const ctx = resolveRequestContext(oldReq);
    if (!ctx.entity) {
      return res.status(404).json({ success: false, error: "Associated order or draft not found." });
    }

    let created: ServerPaymentRequestRecord;
    if (ctx.order) {
      const summary = recomputeOrderPaymentSummary(ctx.order);
      if (oldReq.paymentType !== "subscription" && summary.remainingBalanceAmount <= 0) {
        return res.status(400).json({ success: false, error: "Order is already fully paid." });
      }
      const nextType: DSLinkPayType =
        req.body?.paymentType === "advance" && !isOrderRental(ctx.order)
          ? "advance"
          : oldReq.paymentType;
      const requestedAmount =
        oldReq.paymentType === "subscription"
          ? oldReq.requestedAmount
          : nextType === "advance" && Number(req.body?.amount ?? req.body?.amountBdt) > 0
          ? roundCurrencyAmount(Number(req.body?.amount ?? req.body?.amountBdt), summary.currency)
          : summary.remainingBalanceAmount;

      created = await createPaymentRequestForOrder({
        order: ctx.order,
        paymentType: nextType,
        requestedAmount,
        currency: oldReq.currency,
        expiresInHours: Number(req.body?.expiresInHours) || 72,
        createdBy: adminEmail,
        revokePreviousReason: "Reissued with a fresh payment link",
        subscriptionPlanId: oldReq.subscriptionPlanId,
        subscriptionPlanName: oldReq.subscriptionPlanName,
        subscriptionBillingPeriod: oldReq.subscriptionBillingPeriod,
      });
    } else if (ctx.draft) {
      created = await createPaymentRequestForDraft({
        draft: ctx.draft,
        expiresInHours: Number(req.body?.expiresInHours) || 72,
        createdBy: adminEmail,
      });
    } else {
      return res.status(404).json({ success: false, error: "Associated record not found." });
    }

    if (oldReq.status === "pending" || oldReq.status === "rejected" || oldReq.status === "under_review") {
      oldReq.status = "revoked";
      oldReq.revokedReason = "Reissued with a fresh payment link";
      oldReq.replacedById = created.id;
      oldReq.updatedAt = new Date().toISOString();
      await persistPaymentRequestRecord(oldReq);
    }

    recordAuditLog(
      "admin_dslink_pay_reissued",
      adminEmail,
      created.requestRef,
      {
        oldPaymentRequestId: oldReq.id,
        newPaymentRequestId: created.id,
        requestedAmount: created.requestedAmount,
        currency: created.currency,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      paymentRequest: toAdminPaymentRequest(created, ctx.order, ctx.draft),
    });
  });

  // Update order amount/shipping -> automatically revokes active links & issues a fresh DSLink Pay link
  app.patch("/api/admin/dslink-pay/orders/:orderId", rateLimitMutation(30), async (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Authorized DSLink admin required." });
    }
    const adminEmail = String(req.headers["x-admin-email"] || "admin").trim();
    const order = inMemoryOrders.find((o) => o.orderId === req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found." });
    }

    const currency = getOrderCurrency(order);
    const { totalAmount, shippingFee, reason } = req.body || {};
    const newShipping =
      typeof shippingFee === "number" && Number.isFinite(shippingFee) && shippingFee >= 0
        ? roundCurrencyAmount(shippingFee, currency)
        : roundCurrencyAmount(Number(order.shippingFee || 0), currency);
    const newTotal =
      typeof totalAmount === "number" && Number.isFinite(totalAmount) && totalAmount > 0
        ? roundCurrencyAmount(totalAmount, currency)
        : roundCurrencyAmount(Math.max(0, Number(order.subtotal || 0) + newShipping), currency);

    order.shippingFee = newShipping;
    order.totalAmount = newTotal;
    order.orderTotalAmount = newTotal;
    order.price = newTotal;
    if (currency === "BDT") {
      order.shippingFeeBdt = Math.round(newShipping);
      order.orderTotalBdt = Math.round(newTotal);
    }
    const summary = recomputeOrderPaymentSummary(order);

    let newPaymentRequest: DSLinkPayRequestAdmin | null = null;
    if (summary.remainingBalanceAmount > 0) {
      const created = await createPaymentRequestForOrder({
        order,
        paymentType: summary.paidAmount > 0 ? "remaining" : "full",
        requestedAmount: summary.remainingBalanceAmount,
        currency,
        expiresInHours: 72,
        createdBy: adminEmail,
        revokePreviousReason: String(reason || "Order amount updated by DSLink staff").slice(0, 160),
      });
      newPaymentRequest = toAdminPaymentRequest(created, order);
    } else {
      revokeActivePaymentRequestsForOrder(order.orderId, "Order settled after adjustment");
    }

    persistLocalStore();
    recordAuditLog(
      "admin_order_amount_updated",
      adminEmail,
      order.orderId,
      {
        newTotal,
        newShipping,
        currency,
        remainingBalanceAmount: summary.remainingBalanceAmount,
        newPaymentRequestId: newPaymentRequest?.id || null,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      orderId: order.orderId,
      currency,
      totalAmount: order.totalAmount,
      shippingFee: order.shippingFee,
      paidAmount: summary.paidAmount,
      remainingBalanceAmount: summary.remainingBalanceAmount,
      paidAmountBdt: summary.paidAmountBdt,
      remainingBalanceBdt: summary.remainingBalanceBdt,
      paymentRequest: newPaymentRequest,
    });
  });

  // Dedicated Test Email Endpoint — Disabled per strict 2-workflow notification policy
  app.post("/api/test-email", async (_req, res) => {
    return res.json({
      success: true,
      disabledByNotificationPolicy: true,
      message: "Only (1) requested password reset and (2) new reseller order submitted trigger outbound emails.",
    });
  });

  // ============================================================================
  // LOGO.DEV OFFICIAL INSTITUTION LOGO PROXY (/api/logo/:domain)
  // ============================================================================
  app.get("/api/logo/:domain", async (req, res) => {
    const cleanDomain = String(req.params.domain || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "");
    const size = Math.min(256, Math.max(32, Number(req.query.size) || 128));
    const token =
      process.env.LOGO_DEV_TOKEN ||
      process.env.VITE_LOGO_DEV_TOKEN ||
      "pk_X-1ZO13GSgeOoUrIuJ6GMQ";

    try {
      const logoDevUrl = `https://img.logo.dev/${encodeURIComponent(cleanDomain)}?token=${encodeURIComponent(token)}&size=${size}&format=png`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const upstream = await fetch(logoDevUrl, { signal: controller.signal });
      clearTimeout(timer);

      if (upstream.ok) {
        const contentType = upstream.headers.get("content-type") || "image/png";
        const arrayBuf = await upstream.arrayBuffer();
        if (arrayBuf.byteLength > 100) {
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "public, max-age=86400");
          return res.status(200).send(Buffer.from(arrayBuf));
        }
      }
    } catch {
      // Fallback to official brand SVG mark in client on upstream error
    }
    return res.status(404).end();
  });

  // ============================================================================
  // DSLINK STARLINK RESELLER PORTAL, RETAILER & PARTNERSHIP APPLICATIONS
  // ============================================================================
  let resellerProgramSettings = {
    hardwareDiscountPercent: 15, // Approved resellers pay 85% of DSLink public price
    enabledCurrencies: ["BDT", "USD", "GBP", "EUR", "AED", "SGD", "MYR", "MMK", "CNY"],
    enabledPayoutMethods: ["bKash", "Nagad", "Rocket", "Bank Payout via NPSB"],
  };

  interface ResellerAccount {
    id: string;
    referenceNumber: string;
    applicationType: "reseller" | "authorized_retailer" | "business_partnership";
    status: "Pending" | "Approved" | "Rejected" | "Suspended" | "Under Review" | "Responded";
    contactName: string;
    businessEmail: string;
    password: string;
    phone: string;
    companyName: string;
    businessAddress: string;
    countryCode: string;
    salesChannels: string;
    estimatedMonthlyVolume: string;
    website?: string;
    logoUrl?: string;
    businessLocations?: string;
    productsOfInterest?: string;
    targetMarkets?: string;
    productCategories?: string;
    proposalSummary?: string;
    branding: {
      companyName: string;
      logoUrl: string;
      businessAddress: string;
      phone: string;
      website: string;
    };
    pendingProfitBdt: number;
    availableBalanceBdt: number;
    reservedWithdrawalBdt: number;
    withdrawnTotalBdt: number;
    savedCustomPrices: Record<string, number>;
    createdAt: string;
  }

  const resellerAccounts: ResellerAccount[] = [
    {
      id: "RES-APPROVED-001",
      referenceNumber: "DSL-RES-1001",
      applicationType: "reseller",
      status: "Approved",
      contactName: "Md. Tariqul Islam",
      businessEmail: "reseller@devsparksoft.com.bd",
      password: "Reseller2026!",
      phone: "+880 1326-370218",
      companyName: "OrbitalNet Telecom & ISP Ltd.",
      businessAddress: "House 24, Road 11, Banani, Dhaka 1213, Bangladesh",
      countryCode: "BD",
      salesChannels: "ISP Network, Enterprise B2B & Showroom",
      estimatedMonthlyVolume: "25 - 50 Kits / Month",
      website: "https://retailer.devsparksoft.com.bd",
      logoUrl: "",
      branding: {
        companyName: "OrbitalNet Telecom & ISP Ltd.",
        logoUrl: "",
        businessAddress: "House 24, Road 11, Banani, Dhaka 1213, Bangladesh",
        phone: "+880 1326-370218",
        website: "https://retailer.devsparksoft.com.bd",
      },
      pendingProfitBdt: 0,
      availableBalanceBdt: 0,
      reservedWithdrawalBdt: 0,
      withdrawnTotalBdt: 0,
      savedCustomPrices: {
        "kit-demo-100": 500,
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: "RES-PENDING-002",
      referenceNumber: "DSL-RES-1002",
      applicationType: "reseller",
      status: "Pending",
      contactName: "Ahsan Habib",
      businessEmail: "pending@devsparksoft.com.bd",
      password: "Pending2026!",
      phone: "+880 1711-223344",
      companyName: "Chattogram Satellite Systems",
      businessAddress: "Agrabad Commercial Area, Chattogram 4100, Bangladesh",
      countryCode: "BD",
      salesChannels: "Marine & Retail Hardware",
      estimatedMonthlyVolume: "10 - 20 Kits / Month",
      website: "",
      logoUrl: "",
      branding: {
        companyName: "Chattogram Satellite Systems",
        logoUrl: "",
        businessAddress: "Agrabad Commercial Area, Chattogram 4100, Bangladesh",
        phone: "+880 1711-223344",
        website: "",
      },
      pendingProfitBdt: 0,
      availableBalanceBdt: 0,
      reservedWithdrawalBdt: 0,
      withdrawnTotalBdt: 0,
      savedCustomPrices: {},
      createdAt: new Date().toISOString(),
    },
  ];

  const resellerSessions = new Map<string, string>(); // token -> resellerId
  const resellerOrders: any[] = [];
  const resellerOrderIdempotency = new Map<string, any>(); // idempotencyKey -> order
  const resellerWithdrawals: any[] = [];
  const resellerWithdrawalIdempotency = new Map<string, any>();
  const resellerLedger: any[] = [];
  const passwordResetTokens = new Map<
    string,
    { resellerId: string; email: string; expiresAtMs: number; used: boolean }
  >();

  const buildResellerCatalog = () => {
    const discountPct = resellerProgramSettings.hardwareDiscountPercent;
    const payMultiplier = (100 - discountPct) / 100; // 0.85 for 15% discount
    const stdPublic = serverPricingCatalog.products["starlink-standard-4x"]?.price ?? 41500;
    const miniPublic = serverPricingCatalog.products["starlink-mini-kit"]?.price ?? 21500;

    return [
      {
        id: "kit-demo-100",
        sku: "SL-KIT-100",
        name: "Starlink Pipe Adapter / Demo Kit (BDT 100 Canonical Kit)",
        category: "hardware_kit" as const,
        publicPriceBdt: 100,
        resellerCostBdt: Math.round(100 * payMultiplier), // BDT 85
        discountPercent: discountPct,
        defaultCustomerSellingPriceBdt: 500, // Canonical example: BDT 500 selling -> BDT 415 profit
        description: "Canonical BDT 100 kit: costs reseller BDT 85 (85%); at BDT 500 selling price, earns BDT 415 hardware profit.",
      },
      {
        id: "starlink-standard-4x",
        sku: "SL-STD-4X",
        name: "Starlink Standard Kit 4X (Gen 3 Wi-Fi 6)",
        category: "hardware_kit" as const,
        publicPriceBdt: stdPublic,
        resellerCostBdt: Math.round(stdPublic * payMultiplier),
        discountPercent: discountPct,
        defaultCustomerSellingPriceBdt: stdPublic,
        description: "Outright Starlink Standard Kit 4X hardware with 15% reseller discount.",
      },
      {
        id: "starlink-mini-kit",
        sku: "SL-MINI-KIT",
        name: "Starlink Mini Kit (Portable Integrated Wi-Fi)",
        category: "hardware_kit" as const,
        publicPriceBdt: miniPublic,
        resellerCostBdt: Math.round(miniPublic * payMultiplier),
        discountPercent: discountPct,
        defaultCustomerSellingPriceBdt: miniPublic,
        description: "Compact portable Starlink Mini Kit with 15% reseller discount.",
      },
      {
        id: "acc-ethernet-adapter",
        sku: "SL-ACC-ETH",
        name: "Starlink Gen 3 Ethernet & PoE Surge Adapter",
        category: "accessory" as const,
        publicPriceBdt: 6500,
        resellerCostBdt: Math.round(6500 * payMultiplier),
        discountPercent: discountPct,
        defaultCustomerSellingPriceBdt: 6500,
        description: "Official Starlink accessory with 15% reseller discount.",
      },
      {
        id: "plan-roam-regional",
        sku: "SL-PLAN-ROAM",
        name: "Starlink Roam Unlimited Monthly Subscription Plan (Fixed Fee)",
        category: "subscription_plan" as const,
        publicPriceBdt: 12000,
        resellerCostBdt: 12000,
        discountPercent: 0,
        defaultCustomerSellingPriceBdt: 12000,
        description: "Fixed subscription plan fee (0% hardware discount).",
      },
    ];
  };

  const getAuthenticatedReseller = (req: express.Request): ResellerAccount | null => {
    const authHeader = String(req.headers.authorization || "");
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return null;
    const resellerId = resellerSessions.get(token);
    if (!resellerId) return null;
    return resellerAccounts.find((r) => r.id === resellerId) || null;
  };

  // 1. Submit Online Application (Reseller, Authorized Retailer, or Business Partnership) — ZERO automatic email
  app.post("/api/reseller/applications", rateLimitMutation(20), (req, res) => {
    const body = req.body || {};
    const applicationTypeRaw = String(body.applicationType || "reseller").trim();
    const applicationType: "reseller" | "authorized_retailer" | "business_partnership" =
      applicationTypeRaw === "authorized_retailer" || applicationTypeRaw === "business_partnership"
        ? applicationTypeRaw
        : "reseller";

    const contactName = String(body.contactName || "").trim();
    const businessEmail = String(body.businessEmail || "").trim().toLowerCase();
    const password = String(body.password || "Partner2026!").trim();
    const phone = String(body.phone || "").trim();
    const companyName = String(body.companyName || "").trim();
    const businessAddress = String(body.businessAddress || "").trim();
    const countryCode = normalizeCountryCode(body.countryCode || "BD");
    const salesChannels = String(body.salesChannels || "Retail & B2B").trim();
    const estimatedMonthlyVolume = String(body.estimatedMonthlyVolume || "10+ Kits").trim();

    if (!contactName || !businessEmail || !phone || !companyName || !businessAddress) {
      return res.status(400).json({
        success: false,
        error: "Contact name, business email, phone with country code, company name, and full business address are required.",
      });
    }

    const existing = resellerAccounts.find((a) => a.businessEmail === businessEmail);
    if (existing) {
      const token = `RSTOK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      resellerSessions.set(token, existing.id);
      return res.json({
        success: true,
        referenceNumber: existing.referenceNumber,
        status: existing.status,
        applicationType: existing.applicationType,
        token,
      });
    }

    const refPrefix =
      applicationType === "authorized_retailer"
        ? "DSL-RET"
        : applicationType === "business_partnership"
        ? "DSL-PRT"
        : "DSL-RES";
    const referenceNumber = `${refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newAccount: ResellerAccount = {
      id: `RES-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      referenceNumber,
      applicationType,
      status: "Pending",
      contactName,
      businessEmail,
      password,
      phone,
      companyName,
      businessAddress,
      countryCode,
      salesChannels,
      estimatedMonthlyVolume,
      website: String(body.website || "").trim(),
      logoUrl: String(body.logoUrl || "").trim(),
      businessLocations: String(body.businessLocations || "").trim(),
      productsOfInterest: String(body.productsOfInterest || "").trim(),
      targetMarkets: String(body.targetMarkets || "").trim(),
      productCategories: String(body.productCategories || "").trim(),
      proposalSummary: String(body.proposalSummary || "").trim(),
      branding: {
        companyName,
        logoUrl: String(body.logoUrl || "").trim(),
        businessAddress,
        phone,
        website: String(body.website || "").trim(),
      },
      pendingProfitBdt: 0,
      availableBalanceBdt: 0,
      reservedWithdrawalBdt: 0,
      withdrawnTotalBdt: 0,
      savedCustomPrices: {},
      createdAt: new Date().toISOString(),
    };

    resellerAccounts.unshift(newAccount);
    const token = `RSTOK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    resellerSessions.set(token, newAccount.id);

    recordAuditLog(
      "reseller_application_submitted",
      businessEmail,
      referenceNumber,
      { applicationType, companyName, countryCode, status: "Pending" },
      extractClientIp(req)
    );

    // Strict Notification Rule: Application submissions generate zero automatic emails.
    return res.json({
      success: true,
      referenceNumber,
      status: newAccount.status,
      applicationType: newAccount.applicationType,
      token,
    });
  });

  // 2. Reseller Sign In
  app.post("/api/reseller/login", rateLimitMutation(25), (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const account = resellerAccounts.find(
      (a) => a.businessEmail === email && a.password === password
    );
    if (!account) {
      return res.status(401).json({
        success: false,
        error: "Invalid business email or password.",
      });
    }
    const token = `RSTOK-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    resellerSessions.set(token, account.id);
    return res.json({
      success: true,
      token,
      referenceNumber: account.referenceNumber,
      status: account.status,
    });
  });

  // 3. ALLOWED EMAIL WORKFLOW #1: Requested Password Reset (Single-Use Expiring Link, Rate-Limited, Identical Message)
  app.post("/api/reseller/password-reset/request", rateLimitMutation(8), async (req, res) => {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const identicalResponseMessage =
      "If an account exists for that business email address, a single-use password reset link has been sent.";

    const account = resellerAccounts.find((a) => a.businessEmail === email);
    if (account) {
      const resetToken = `PRST-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
      const expiresAtMs = Date.now() + 30 * 60 * 1000; // 30 minutes expiry
      passwordResetTokens.set(resetToken, {
        resellerId: account.id,
        email: account.businessEmail,
        expiresAtMs,
        used: false,
      });

      const resetUrl = `https://retailer.devsparksoft.com.bd/reseller/reset-password?token=${encodeURIComponent(resetToken)}`;
      try {
        await sendResendEmailSafe({
          to: account.businessEmail,
          subject: "DSLink Reseller Portal — Single-Use Password Reset Link",
          html: buildAdminNotificationHtml({
            badge: "PASSWORD RESET REQUEST",
            heading: "Reset Your DSLink Reseller Portal Password",
            summary:
              "A password reset was requested for your DSLink Reseller account. This link is single-use and expires in 30 minutes.",
            rows: [
              { label: "Company", value: account.companyName },
              { label: "Application Reference", value: account.referenceNumber },
              { label: "Single-Use Reset Link", value: resetUrl, highlight: true },
              { label: "Reset Token", value: resetToken, highlight: true },
            ],
          }),
        });
      } catch (err) {
        console.error("[Password Reset] Resend error:", err);
      }

      recordAuditLog(
        "password_reset_requested",
        account.businessEmail,
        account.referenceNumber,
        { expiresInMinutes: 30 },
        extractClientIp(req)
      );
    }

    // Always return the exact same response for registered and unregistered email addresses
    return res.json({
      success: true,
      message: identicalResponseMessage,
    });
  });

  app.post("/api/reseller/password-reset/confirm", rateLimitMutation(10), (req, res) => {
    const token = String(req.body?.token || "").trim();
    const newPassword = String(req.body?.newPassword || "");

    if (!token || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Valid reset token and a password of at least 6 characters are required.",
      });
    }

    const tokenRecord = passwordResetTokens.get(token);
    if (!tokenRecord || tokenRecord.used || Date.now() > tokenRecord.expiresAtMs) {
      return res.status(400).json({
        success: false,
        error: "This password reset link is invalid, expired, or has already been used.",
      });
    }

    const account = resellerAccounts.find((a) => a.id === tokenRecord.resellerId);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: "Invalid reset token.",
      });
    }

    tokenRecord.used = true;
    account.password = newPassword;

    recordAuditLog(
      "password_reset_completed",
      account.businessEmail,
      account.referenceNumber,
      {},
      extractClientIp(req)
    );

    return res.json({
      success: true,
      message: "Password updated. You can now sign in.",
    });
  });

  // 4. Reseller Portal Dashboard Data (Strictly Scoped to Authenticated Reseller)
  app.get("/api/reseller/dashboard", (req, res) => {
    const reseller = getAuthenticatedReseller(req);
    if (!reseller) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    const isApproved = reseller.status === "Approved" && reseller.applicationType === "reseller";
    const catalog = isApproved ? buildResellerCatalog() : [];
    const scopedOrders = resellerOrders.filter((o) => o.resellerId === reseller.id);
    const scopedWithdrawals = resellerWithdrawals.filter((w) => w.resellerId === reseller.id);
    const scopedLedger = resellerLedger.filter((l) => l.resellerId === reseller.id);

    const { password: _omitted, ...safeProfile } = reseller;
    return res.json({
      success: true,
      profile: safeProfile,
      catalog,
      orders: scopedOrders,
      withdrawals: scopedWithdrawals,
      ledger: scopedLedger,
    });
  });

  // 5. Save Default Customer Selling Price per Product
  app.post("/api/reseller/catalog/custom-price", (req, res) => {
    const reseller = getAuthenticatedReseller(req);
    if (!reseller) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (reseller.status !== "Approved" || reseller.applicationType !== "reseller") {
      return res.status(403).json({
        success: false,
        error: "Reseller pricing is enabled only after admin approval.",
      });
    }

    const productId = String(req.body?.productId || "").trim();
    const customerSellingPriceBdt = Math.round(Number(req.body?.customerSellingPriceBdt) || 0);
    const catalog = buildResellerCatalog();
    const item = catalog.find((c) => c.id === productId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Catalog product not found." });
    }
    if (customerSellingPriceBdt < item.resellerCostBdt) {
      return res.status(400).json({
        success: false,
        error: `Customer selling price cannot be below your reseller cost of BDT ${item.resellerCostBdt}.`,
      });
    }

    reseller.savedCustomPrices[productId] = customerSellingPriceBdt;
    return res.json({
      success: true,
      savedCustomPrices: reseller.savedCustomPrices,
    });
  });

  // 6. Update Reseller Branding Settings
  app.put("/api/reseller/branding", (req, res) => {
    const reseller = getAuthenticatedReseller(req);
    if (!reseller) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    const body = req.body || {};
    reseller.branding = {
      companyName: String(body.companyName || reseller.companyName).trim(),
      logoUrl: String(body.logoUrl || "").trim(),
      businessAddress: String(body.businessAddress || reseller.businessAddress).trim(),
      phone: String(body.phone || reseller.phone).trim(),
      website: String(body.website || "").trim(),
    };
    return res.json({
      success: true,
      branding: reseller.branding,
    });
  });

  // 7. ALLOWED EMAIL WORKFLOW #2: Submit New Reseller Customer Order (Server-Calculated Profit + Resend Fulfillment Email)
  app.post("/api/reseller/orders", rateLimitMutation(25), async (req, res) => {
    const reseller = getAuthenticatedReseller(req);
    if (!reseller) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (reseller.status !== "Approved" || reseller.applicationType !== "reseller") {
      return res.status(403).json({
        success: false,
        error: "Ordering is enabled strictly after your reseller application is Approved.",
      });
    }

    const body = req.body || {};
    const idempotencyKey = String(body.idempotencyKey || "").trim();
    if (idempotencyKey && resellerOrderIdempotency.has(idempotencyKey)) {
      return res.json({
        success: true,
        deduplicated: true,
        order: resellerOrderIdempotency.get(idempotencyKey),
      });
    }

    const rawItems = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return res.status(400).json({ success: false, error: "At least one product item is required." });
    }

    const addr = body.shippingAddress || {};
    const requiredAddrFields = [
      "fullName",
      "phone",
      "houseFlat",
      "roadStreet",
      "area",
      "cityDistrict",
      "stateDivision",
      "postalCode",
      "countryCode",
    ];
    for (const field of requiredAddrFields) {
      if (!String(addr[field] || "").trim()) {
        return res.status(400).json({
          success: false,
          error: `Complete 10-field shipping address required: missing ${field}.`,
        });
      }
    }

    const catalog = buildResellerCatalog();
    let totalResellerCostBdt = 0;
    let totalCustomerSellingBdt = 0;
    let totalHardwareProfitBdt = 0;
    const computedItems: any[] = [];

    for (const entry of rawItems) {
      const catItem = catalog.find((c) => c.id === entry.productId);
      if (!catItem) {
        return res.status(400).json({
          success: false,
          error: `Invalid catalog product: ${entry.productId}`,
        });
      }
      const quantity = Math.max(1, Math.min(100, Math.floor(Number(entry.quantity) || 1)));
      // Authoritative server calculation: Reseller pays 85% of public price for hardware/accessories, fixed fee for subscription plan
      const resellerUnitCostBdt = catItem.resellerCostBdt;
      const requestedSelling = Number(entry.customerUnitSellingPriceBdt);
      const customerUnitSellingPriceBdt =
        catItem.category === "subscription_plan"
          ? catItem.publicPriceBdt
          : Number.isFinite(requestedSelling) && requestedSelling >= resellerUnitCostBdt
          ? Math.round(requestedSelling)
          : reseller.savedCustomPrices[catItem.id] ?? catItem.defaultCustomerSellingPriceBdt;

      const lineResellerCostBdt = resellerUnitCostBdt * quantity;
      const lineCustomerTotalBdt = customerUnitSellingPriceBdt * quantity;
      const lineHardwareProfitBdt =
        catItem.category === "subscription_plan"
          ? 0
          : (customerUnitSellingPriceBdt - resellerUnitCostBdt) * quantity;

      totalResellerCostBdt += lineResellerCostBdt;
      totalCustomerSellingBdt += lineCustomerTotalBdt;
      totalHardwareProfitBdt += lineHardwareProfitBdt;

      computedItems.push({
        productId: catItem.id,
        sku: catItem.sku,
        name: catItem.name,
        category: catItem.category,
        quantity,
        publicPriceBdt: catItem.publicPriceBdt,
        resellerUnitCostBdt,
        customerUnitSellingPriceBdt,
        lineResellerCostBdt,
        lineCustomerTotalBdt,
        lineHardwareProfitBdt,
      });
    }

    const paymentMethod: "COD" | "BANGLA_QR_ADVANCE" =
      body.paymentMethod === "BANGLA_QR_ADVANCE" ? "BANGLA_QR_ADVANCE" : "COD";
    const paymentCollector: "dslink" | "reseller" =
      paymentMethod === "BANGLA_QR_ADVANCE" && body.paymentCollector === "reseller"
        ? "reseller"
        : "dslink";

    const orderNumber = `RSL-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderRecord = {
      id: `RO-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      orderNumber,
      resellerId: reseller.id,
      resellerReference: reseller.referenceNumber,
      resellerCompany: reseller.branding.companyName || reseller.companyName,
      createdAt: new Date().toISOString(),
      items: computedItems,
      shippingAddress: {
        fullName: String(addr.fullName).trim(),
        phone: String(addr.phone).trim(),
        houseFlat: String(addr.houseFlat).trim(),
        roadStreet: String(addr.roadStreet).trim(),
        area: String(addr.area).trim(),
        cityDistrict: String(addr.cityDistrict).trim(),
        stateDivision: String(addr.stateDivision).trim(),
        postalCode: String(addr.postalCode).trim(),
        countryCode: normalizeCountryCode(addr.countryCode),
        landmarkNote: String(addr.landmarkNote || "").trim(),
      },
      paymentMethod,
      paymentCollector,
      transactionId: String(body.transactionId || "").trim() || undefined,
      paymentStatus: paymentMethod === "COD" ? "Pending COD" : "Awaiting Payment",
      fulfillmentStatus: "Pending",
      totalResellerCostBdt,
      totalCustomerSellingBdt,
      totalHardwareProfitBdt,
      codAmountToCollectBdt: paymentMethod === "COD" ? totalCustomerSellingBdt : 0,
      profitStatus:
        paymentCollector === "reseller" ? "Settled Directly by Reseller" : "Pending",
      profitReleasedToBalance: false,
      currencyCode: String(body.currencyCode || "BDT"),
      exchangeRateUsed: Number(body.exchangeRateUsed) || 1,
      // Immutable snapshot of reseller branding at order time
      brandingSnapshot: { ...reseller.branding },
      carrierName:
        normalizeCountryCode(addr.countryCode) === "BD"
          ? "Steadfast / Pathao Courier"
          : "DHL Express / FedEx",
    };

    // STEP 1: Save the order FIRST before sending the fulfillment email
    resellerOrders.unshift(orderRecord);
    if (idempotencyKey) {
      resellerOrderIdempotency.set(idempotencyKey, orderRecord);
    }

    if (paymentCollector === "dslink" && totalHardwareProfitBdt > 0) {
      reseller.pendingProfitBdt += totalHardwareProfitBdt;
      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "PROFIT_PENDING",
        amountBdt: totalHardwareProfitBdt,
        orderNumber,
        note: `Pending hardware profit recorded for order ${orderNumber} (releases after Delivery + Payment confirmation).`,
        createdAt: new Date().toISOString(),
      });
    } else if (paymentCollector === "reseller") {
      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "DIRECT_SETTLEMENT",
        amountBdt: totalHardwareProfitBdt,
        orderNumber,
        note: `Reseller collected customer payment directly and retained BDT ${totalHardwareProfitBdt} margin; recorded without crediting available balance again.`,
        createdAt: new Date().toISOString(),
      });
    }

    // STEP 2: Send ALLOWED EMAIL WORKFLOW #2 to DSLink fulfillment inbox via Resend API
    const fulfillmentInbox =
      process.env.FULFILLMENT_EMAIL || ADMIN_NOTIFICATION_EMAIL;
    const adminOrderLink = `https://devsparksoft.com.bd/admin/global?tab=print-labels&order=${encodeURIComponent(orderNumber)}`;
    const fullFormattedAddress = `${orderRecord.shippingAddress.houseFlat}, ${orderRecord.shippingAddress.roadStreet}, ${orderRecord.shippingAddress.area}, ${orderRecord.shippingAddress.cityDistrict}, ${orderRecord.shippingAddress.stateDivision} ${orderRecord.shippingAddress.postalCode}, ${orderRecord.shippingAddress.countryCode}`;

    try {
      await sendResendEmailSafe({
        to: fulfillmentInbox,
        subject: `[NEW RESELLER ORDER ${orderNumber}] ${orderRecord.resellerCompany} — Ship to ${orderRecord.shippingAddress.fullName}`,
        html: buildAdminNotificationHtml({
          badge: "RESELLER FULFILLMENT DISPATCH",
          heading: `New Reseller Order ${orderNumber}`,
          summary:
            "Order saved in DSLink Reseller Portal. Print the reseller-branded shipping label from the secure admin link below.",
          rows: [
            { label: "Order Number", value: orderNumber, highlight: true },
            { label: "Reseller Company", value: `${orderRecord.resellerCompany} (${reseller.referenceNumber})`, highlight: true },
            {
              label: "Products & Quantities",
              value: computedItems.map((i) => `${i.name} (${i.sku}) × ${i.quantity}`).join(" | "),
            },
            { label: "Customer Name", value: orderRecord.shippingAddress.fullName },
            { label: "Customer Phone", value: orderRecord.shippingAddress.phone, highlight: true },
            { label: "Full 10-Field Shipping Address", value: fullFormattedAddress },
            { label: "Delivery Notes / Landmark", value: orderRecord.shippingAddress.landmarkNote || "None" },
            { label: "Payment Method & Status", value: `${paymentMethod} (${orderRecord.paymentStatus})` },
            {
              label: "COD Amount to Collect",
              value: `BDT ${orderRecord.codAmountToCollectBdt.toLocaleString()}`,
              highlight: paymentMethod === "COD",
            },
            { label: "Secure Admin Order & Printable Label Link", value: adminOrderLink, highlight: true },
          ],
        }),
      });
    } catch (emailErr) {
      console.error("[Reseller Order Fulfillment Email] Resend error:", emailErr);
    }

    recordAuditLog(
      "reseller_order_submitted",
      reseller.businessEmail,
      orderNumber,
      {
        totalResellerCostBdt,
        totalCustomerSellingBdt,
        totalHardwareProfitBdt,
        paymentMethod,
        paymentCollector,
      },
      extractClientIp(req)
    );

    return res.json({
      success: true,
      order: orderRecord,
    });
  });

  // 8. Reseller Withdrawals (Reserve Balance During Processing; Restore on Failure; Idempotent)
  app.post("/api/reseller/withdrawals", rateLimitMutation(15), (req, res) => {
    const reseller = getAuthenticatedReseller(req);
    if (!reseller) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }
    if (reseller.status !== "Approved" || reseller.applicationType !== "reseller") {
      return res.status(403).json({
        success: false,
        error: "Withdrawals are enabled strictly after reseller approval.",
      });
    }

    const body = req.body || {};
    const idempotencyKey = String(body.idempotencyKey || "").trim();
    if (idempotencyKey && resellerWithdrawalIdempotency.has(idempotencyKey)) {
      return res.json({
        success: true,
        deduplicated: true,
        withdrawal: resellerWithdrawalIdempotency.get(idempotencyKey),
      });
    }

    const amountBdt = Math.round(Number(body.amountBdt) || 0);
    if (amountBdt <= 0) {
      return res.status(400).json({ success: false, error: "Invalid withdrawal amount." });
    }
    if (amountBdt > reseller.availableBalanceBdt) {
      return res.status(400).json({
        success: false,
        error: `Requested withdrawal (BDT ${amountBdt}) exceeds your available balance (BDT ${reseller.availableBalanceBdt}).`,
      });
    }

    const validMethods = ["bKash", "Nagad", "Rocket", "Bank Payout via NPSB"];
    const method = validMethods.includes(body.method) ? body.method : "bKash";
    const accountDetails = body.accountDetails || {};
    if (!String(accountDetails.accountName || "").trim() || !String(accountDetails.accountNumber || "").trim()) {
      return res.status(400).json({
        success: false,
        error: "Account holder name and account/wallet number are required.",
      });
    }

    // Reserve balance immediately
    reseller.availableBalanceBdt -= amountBdt;
    reseller.reservedWithdrawalBdt += amountBdt;

    const reference = `WDR-${Math.floor(100000 + Math.random() * 900000)}`;
    const withdrawal = {
      id: `WD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      resellerId: reseller.id,
      resellerCompany: reseller.companyName,
      amountBdt,
      method,
      accountDetails: {
        accountName: String(accountDetails.accountName).trim(),
        accountNumber: String(accountDetails.accountNumber).trim(),
        bankName: accountDetails.bankName ? String(accountDetails.bankName).trim() : undefined,
        branchName: accountDetails.branchName ? String(accountDetails.branchName).trim() : undefined,
        routingNumber: accountDetails.routingNumber ? String(accountDetails.routingNumber).trim() : undefined,
      },
      status: "Processing" as const,
      processedCallbacks: [] as string[],
      createdAt: new Date().toISOString(),
    };

    resellerWithdrawals.unshift(withdrawal);
    if (idempotencyKey) {
      resellerWithdrawalIdempotency.set(idempotencyKey, withdrawal);
    }

    resellerLedger.unshift({
      id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      resellerId: reseller.id,
      type: "WITHDRAWAL_RESERVED",
      amountBdt,
      withdrawalRef: reference,
      note: `Reserved BDT ${amountBdt} for ${method} payout (${withdrawal.accountDetails.accountNumber}).`,
      createdAt: new Date().toISOString(),
    });

    // Strict Notification Rule: Withdrawal requests generate zero automatic emails.
    return res.json({
      success: true,
      withdrawal,
      availableBalanceBdt: reseller.availableBalanceBdt,
      reservedWithdrawalBdt: reseller.reservedWithdrawalBdt,
    });
  });

  // 9. Admin Reseller Overview & Management Endpoints (RBAC Protected)
  app.get("/api/admin/reseller/overview", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const safeAccounts = resellerAccounts.map(({ password: _p, ...rest }) => rest);
    return res.json({
      success: true,
      applications: safeAccounts,
      resellerOrders,
      withdrawals: resellerWithdrawals,
      ledger: resellerLedger.slice(0, 200),
      settings: resellerProgramSettings,
    });
  });

  app.put("/api/admin/reseller/settings", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const pct = Number(req.body?.hardwareDiscountPercent);
    if (Number.isFinite(pct) && pct >= 1 && pct <= 50) {
      resellerProgramSettings.hardwareDiscountPercent = Math.round(pct);
    }
    return res.json({
      success: true,
      settings: resellerProgramSettings,
    });
  });

  app.put("/api/admin/reseller/applications/:id/status", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const account = resellerAccounts.find((a) => a.id === req.params.id || a.referenceNumber === req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, error: "Application not found." });
    }
    const validStatuses = ["Pending", "Approved", "Rejected", "Suspended", "Under Review", "Responded"];
    const nextStatus = String(req.body?.status || "").trim();
    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ success: false, error: "Invalid application status." });
    }
    account.status = nextStatus as any;

    recordAuditLog(
      "reseller_application_status_updated",
      String(req.headers["x-admin-email"] || "admin"),
      account.referenceNumber,
      { status: nextStatus },
      extractClientIp(req)
    );

    const { password: _p, ...safeAccount } = account;
    return res.json({
      success: true,
      application: safeAccount,
    });
  });

  // Update Reseller Order Payment / Fulfillment Status & Release Profit Strictly When BOTH Delivered AND Verified / Paid
  app.put("/api/admin/reseller/orders/:id/status", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const ord = resellerOrders.find((o) => o.id === req.params.id || o.orderNumber === req.params.id);
    if (!ord) {
      return res.status(404).json({ success: false, error: "Reseller order not found." });
    }
    const reseller = resellerAccounts.find((a) => a.id === ord.resellerId);
    if (!reseller) {
      return res.status(404).json({ success: false, error: "Associated reseller account not found." });
    }

    const { paymentStatus, fulfillmentStatus, trackingNumber, carrierName } = req.body || {};
    if (paymentStatus) ord.paymentStatus = String(paymentStatus);
    if (fulfillmentStatus) ord.fulfillmentStatus = String(fulfillmentStatus);
    if (trackingNumber !== undefined) ord.trackingNumber = String(trackingNumber);
    if (carrierName !== undefined) ord.carrierName = String(carrierName);

    // Profit Release Rule: Release reseller profit ONLY after BOTH delivery ('Delivered') and payment ('Verified / Paid') are confirmed
    const bothConfirmed =
      ord.fulfillmentStatus === "Delivered" && ord.paymentStatus === "Verified / Paid";

    if (
      bothConfirmed &&
      !ord.profitReleasedToBalance &&
      ord.paymentCollector === "dslink" &&
      ord.totalHardwareProfitBdt > 0
    ) {
      ord.profitReleasedToBalance = true;
      ord.profitStatus = "Released";
      reseller.pendingProfitBdt = Math.max(0, reseller.pendingProfitBdt - ord.totalHardwareProfitBdt);
      reseller.availableBalanceBdt += ord.totalHardwareProfitBdt;

      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "PROFIT_RELEASED",
        amountBdt: ord.totalHardwareProfitBdt,
        orderNumber: ord.orderNumber,
        note: `Delivery & Payment confirmed for ${ord.orderNumber}. Released BDT ${ord.totalHardwareProfitBdt} hardware profit to Available Balance.`,
        createdAt: new Date().toISOString(),
      });
    }

    // Handle Return / Refund Adjustments
    if (
      (ord.fulfillmentStatus === "Returned" ||
        ord.fulfillmentStatus === "Cancelled" ||
        ord.paymentStatus === "Refunded") &&
      ord.profitStatus !== "Reversed" &&
      ord.paymentCollector === "dslink" &&
      ord.totalHardwareProfitBdt > 0
    ) {
      if (ord.profitReleasedToBalance) {
        ord.profitReleasedToBalance = false;
        reseller.availableBalanceBdt = Math.max(
          0,
          reseller.availableBalanceBdt - ord.totalHardwareProfitBdt
        );
      } else {
        reseller.pendingProfitBdt = Math.max(
          0,
          reseller.pendingProfitBdt - ord.totalHardwareProfitBdt
        );
      }
      ord.profitStatus = "Reversed";
      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "RETURN_ADJUSTMENT",
        amountBdt: -ord.totalHardwareProfitBdt,
        orderNumber: ord.orderNumber,
        note: `Order ${ord.orderNumber} marked ${ord.fulfillmentStatus} / ${ord.paymentStatus}; reversed BDT ${ord.totalHardwareProfitBdt} profit.`,
        createdAt: new Date().toISOString(),
      });
    }

    return res.json({
      success: true,
      order: ord,
      resellerBalances: {
        pendingProfitBdt: reseller.pendingProfitBdt,
        availableBalanceBdt: reseller.availableBalanceBdt,
      },
    });
  });

  // Update Reseller Withdrawal Status (Idempotent; Restores Balance on Failure/Rejection)
  app.put("/api/admin/reseller/withdrawals/:id/status", (req, res) => {
    if (!isAuthorizedAdminRequest(req)) {
      return res.status(403).json({ success: false, error: "Admin authorization required." });
    }
    const withdrawal = resellerWithdrawals.find(
      (w) => w.id === req.params.id || w.reference === req.params.id
    );
    if (!withdrawal) {
      return res.status(404).json({ success: false, error: "Withdrawal not found." });
    }
    const reseller = resellerAccounts.find((a) => a.id === withdrawal.resellerId);
    if (!reseller) {
      return res.status(404).json({ success: false, error: "Reseller not found." });
    }

    const nextStatus = String(req.body?.status || "").trim();
    const callbackKey = String(req.body?.callbackIdempotencyKey || `${withdrawal.id}-${nextStatus}`);

    // Prevent duplicate balance changes on retries or callbacks
    if (withdrawal.processedCallbacks.includes(callbackKey)) {
      return res.json({
        success: true,
        deduplicated: true,
        withdrawal,
        resellerBalances: {
          availableBalanceBdt: reseller.availableBalanceBdt,
          reservedWithdrawalBdt: reseller.reservedWithdrawalBdt,
          withdrawnTotalBdt: reseller.withdrawnTotalBdt,
        },
      });
    }

    if (withdrawal.status === "Completed" || withdrawal.status === "Failed" || withdrawal.status === "Rejected") {
      return res.json({
        success: true,
        alreadyFinalized: true,
        withdrawal,
      });
    }

    withdrawal.processedCallbacks.push(callbackKey);
    if (req.body?.adminNote) {
      withdrawal.adminNote = String(req.body.adminNote);
    }

    if (nextStatus === "Completed") {
      withdrawal.status = "Completed";
      withdrawal.processedAt = new Date().toISOString();
      reseller.reservedWithdrawalBdt = Math.max(
        0,
        reseller.reservedWithdrawalBdt - withdrawal.amountBdt
      );
      reseller.withdrawnTotalBdt += withdrawal.amountBdt;

      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "WITHDRAWAL_COMPLETED",
        amountBdt: withdrawal.amountBdt,
        withdrawalRef: withdrawal.reference,
        note: `Payout ${withdrawal.reference} via ${withdrawal.method} completed.`,
        createdAt: new Date().toISOString(),
      });
    } else if (nextStatus === "Failed" || nextStatus === "Rejected") {
      withdrawal.status = nextStatus;
      withdrawal.processedAt = new Date().toISOString();
      // Restore reserved balance back to available balance
      reseller.reservedWithdrawalBdt = Math.max(
        0,
        reseller.reservedWithdrawalBdt - withdrawal.amountBdt
      );
      reseller.availableBalanceBdt += withdrawal.amountBdt;

      resellerLedger.unshift({
        id: `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        resellerId: reseller.id,
        type: "WITHDRAWAL_RESTORED",
        amountBdt: withdrawal.amountBdt,
        withdrawalRef: withdrawal.reference,
        note: `Payout ${withdrawal.reference} marked ${nextStatus}; restored BDT ${withdrawal.amountBdt} to Available Balance.`,
        createdAt: new Date().toISOString(),
      });
    } else if (nextStatus === "Processing") {
      withdrawal.status = "Processing";
    }

    return res.json({
      success: true,
      withdrawal,
      resellerBalances: {
        availableBalanceBdt: reseller.availableBalanceBdt,
        reservedWithdrawalBdt: reseller.reservedWithdrawalBdt,
        withdrawnTotalBdt: reseller.withdrawnTotalBdt,
      },
    });
  });

  // Gemini TTS Endpoint for the Approved DSLINK Bengali Voiceover
  app.post("/api/tts/dslink-ad", async (req, res) => {
    try {
      const voiceName = req.body?.voiceName || "Kore";

      if (cachedVoiceoverBase64 && !req.body?.forceRefresh) {
        return res.json({
          success: true,
          audioBase64: cachedVoiceoverBase64,
          mimeType: "audio/wav",
          script: APPROVED_VOICEOVER_SCRIPT,
          cached: true,
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({
          success: false,
          error: "GEMINI_API_KEY is not configured on the server.",
          script: APPROVED_VOICEOVER_SCRIPT,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: APPROVED_VOICEOVER_SCRIPT,
                speechMetadata: {
                  style:
                    "Clear, articulate, warm, trustworthy Bengali commercial announcer. Pronounce 'একচল্লিশ হাজার পাঁচশ টাকায়' clearly and accurately at a natural broadcast pace.",
                },
              } as any,
            ],
          },
        ],
        config: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName },
            },
          },
        },
      });

      const base64Audio =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        return res.status(500).json({
          success: false,
          error: "No audio payload returned from Gemini TTS model.",
          script: APPROVED_VOICEOVER_SCRIPT,
        });
      }

      cachedVoiceoverBase64 = base64Audio;

      return res.json({
        success: true,
        audioBase64: base64Audio,
        mimeType: "audio/wav",
        script: APPROVED_VOICEOVER_SCRIPT,
        cached: false,
      });
    } catch (error: any) {
      console.error("Gemini TTS error:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to generate TTS audio",
        script: APPROVED_VOICEOVER_SCRIPT,
      });
    }
  });

  const distPath = path.join(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && fs.existsSync(distPath)) {
    app.use(
      express.static(distPath, {
        index: false,
        setHeaders(res, filePath) {
          if (filePath.endsWith("sw.js") || filePath.endsWith("manifest.json")) {
            res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
          }
        },
      })
    );
    app.get("*", async (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/assets/") ||
        /\.(?:js|mjs|cjs|css|map|png|jpg|jpeg|webp|svg|ico|woff2?|json)$/i.test(req.path)
      ) {
        return next();
      }
      const domain = getRequestDomain(req);
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        const knownRoute = isKnownSiteRoute(req.path);
        const isNoindex = !knownRoute || isPrivateOrNonIndexablePath(req.path);
        const visitorCountry = resolveVisitorCountryFromRequest(req);
        const rawHtml = fs.readFileSync(indexPath, "utf-8");
        const renderedHtml = buildDomainHtmlDocument(rawHtml, domain, req.path, visitorCountry, {
          isNotFound: !knownRoute,
        });
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Vary", VARY_GEO_HEADERS);
        if (isNoindex) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        res.status(knownRoute ? 200 : 404).send(renderedHtml);
      } else {
        next();
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true, hmr: false, ws: false },
      appType: "custom",
    });

    // HMR and WebSockets are disabled in this runtime environment.
    // Vite-transformed CSS modules still import updateStyle/removeStyle/createHotContext
    // from /@vite/client; serve a lightweight zero-WebSocket shim so CSS loads cleanly
    // without attempting a failing WebSocket connection.
    app.get("/@vite/client", (_req, res) => {
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.status(200).send(`
const sheetsMap = new Map();

export function updateStyle(id, content) {
  if (typeof document === 'undefined') return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  }
  style.textContent = content;
}

export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    if (style.parentNode) style.parentNode.removeChild(style);
    sheetsMap.delete(id);
  }
}

export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}

export function injectQuery(url, queryToInject) {
  if (!queryToInject || url.includes(queryToInject)) return url;
  return url + (url.includes('?') ? '&' : '?') + queryToInject;
}

export class ErrorOverlay extends HTMLElement {}
`);
    });

    app.use(vite.middlewares);

    app.get("*", async (req, res, next) => {
      if (
        req.path.startsWith("/api") ||
        req.path.startsWith("/src/") ||
        req.path.startsWith("/@") ||
        req.path.startsWith("/node_modules/")
      ) {
        return next();
      }
      try {
        const domain = getRequestDomain(req);
        const knownRoute = isKnownSiteRoute(req.path);
        const isNoindex = !knownRoute || isPrivateOrNonIndexablePath(req.path);
        const visitorCountry = resolveVisitorCountryFromRequest(req);
        const indexPath = path.join(process.cwd(), "index.html");
        const rawTemplate = fs.readFileSync(indexPath, "utf-8");
        const domainHtml = buildDomainHtmlDocument(rawTemplate, domain, req.path, visitorCountry, {
          isNotFound: !knownRoute,
        });
        const transformedHtml = (
          await vite.transformIndexHtml(req.originalUrl, domainHtml)
        ).replace(/<script[^>]*src="\/@vite\/client"[^>]*><\/script>\s*/gi, "");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Vary", VARY_GEO_HEADERS);
        if (isNoindex) {
          res.setHeader("X-Robots-Tag", "noindex, nofollow");
        }
        res.status(knownRoute ? 200 : 404).send(transformedHtml);
      } catch (err) {
        next(err);
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
