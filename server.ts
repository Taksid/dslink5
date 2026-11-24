import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Resend } from "resend";
import fs from "fs";
import os from "os";
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
  isPrivateOrNonIndexablePath,
  parseLocalePath,
} from "./src/lib/localeRouting";

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
    if (parsed?.pricingProducts && typeof parsed.pricingProducts === "object") {
      Object.entries(parsed.pricingProducts).forEach(([id, prod]: [string, any]) => {
        if (prod && typeof prod.price === "number" && Number.isFinite(prod.price)) {
          serverPricingCatalog.products[id] = {
            ...(serverPricingCatalog.products[id] || {}),
            ...prod,
          };
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
      inquiries: inMemoryInquiries.slice(0, 500),
      warrantyRegistrations: warrantyRegistrations.slice(0, 500),
      warrantyClaims: warrantyClaims.slice(0, 500),
      refundClaims: refundClaims.slice(0, 500),
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
        serverPricingCatalog.products[id] = {
          ...serverPricingCatalog.products[id],
          price: Math.round(numericPrice),
          ...(data.name ? { name: String(data.name) } : {}),
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
  if (
    idClean.includes("mini") ||
    (nameClean.includes("mini") && !nameClean.includes("router"))
  ) {
    return serverPricingCatalog.products["starlink-mini-kit"];
  }
  if (
    idClean.includes("standard") ||
    nameClean.includes("standard") ||
    nameClean.includes("4x")
  ) {
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

  // Public Order Endpoint for DSLink, Cart, Rental & Global Checkout (Zero Automatic Outbound Emails per Section 7)
  app.post("/api/promos/order", rateLimitMutation(25), async (req, res) => {
    try {
      await hydratePricingFromFirestore();
      const {
        orderId = `DS-${Math.floor(100000 + Math.random() * 900000)}`,
        fullName = "",
        phone = "",
        email = "",
        address = "",
        district = "Dhaka",
        shippingAddress,
        countryCode,
        paymentMethod = "cod",
        trxId = "",
        senderBankName = "",
        senderNumber = "",
        productId = "",
        productName = "Starlink Standard Kit 4X (Purchase)",
        quantity = 1,
        items,
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
      if (!carrierAvailable) {
        return res.status(400).json({
          success: false,
          inquiryRequired: true,
          error: `Standard DHL / FedEx checkout is unavailable for ${getCountryConfig(resolvedCountry).name}. Please submit a Delivery Inquiry instead.`,
        });
      }

      let subtotal = 0;
      let isRentalOrder = false;
      let totalQty = 0;
      let resolvedItems: Array<{ productId: string; name: string; unitPrice: number; quantity: number; lineTotal: number }> = [];

      if (Array.isArray(items) && items.length > 0) {
        for (const rawItem of items.slice(0, 20)) {
          const itemQty = Math.min(20, Math.max(1, Math.floor(Number(rawItem?.quantity) || 1)));
          const prod = resolveAuthoritativeProduct(rawItem?.productId, rawItem?.name);
          if (prod.category === "rental") isRentalOrder = true;
          const lineTotal = prod.price * itemQty;
          subtotal += lineTotal;
          totalQty += itemQty;
          resolvedItems.push({
            productId: prod.id,
            name: prod.name,
            unitPrice: prod.price,
            quantity: itemQty,
            lineTotal,
          });
        }
      } else {
        const qty = Math.min(50, Math.max(1, Math.floor(Number(quantity) || 1)));
        const matchedProduct = resolveAuthoritativeProduct(productId, productName);
        isRentalOrder = matchedProduct.category === "rental";
        subtotal = matchedProduct.price * qty;
        totalQty = qty;
        resolvedItems.push({
          productId: matchedProduct.id,
          name: productName || matchedProduct.name,
          unitPrice: matchedProduct.price,
          quantity: qty,
          lineTotal: subtotal,
        });
      }

      const primaryItem = resolvedItems[0];
      const shippingFee = calculateShipping(resolvedCountry, serverShippingConfig.internationalFeeBdt);
      const authoritativeTotal = subtotal + shippingFee;
      const codAllowed = isCODAvailable(resolvedCountry, isRentalOrder);
      const effectivePaymentMethod =
        paymentMethod === "cod" && !codAllowed
          ? isRentalOrder
            ? "bangla_qr"
            : "international_prepaid"
          : paymentMethod;

      const ratesSnap = await getLiveExchangeRates();
      const targetCurrency = normalizeCurrencyCode(currency);
      const converted = convertFromBdt(authoritativeTotal, targetCurrency, ratesSnap.rates);

      const isManualQrPayment =
        effectivePaymentMethod === "bangla_qr" ||
        effectivePaymentMethod === "international_prepaid" ||
        Boolean(String(trxId || "").trim());
      const paymentStatus = isManualQrPayment ? "Awaiting Payment" : "Pending COD Collection";
      const fulfillmentStatus = "Pending";
      const orderStatus = isManualQrPayment ? "Awaiting Payment" : "Pending Confirmation";

      const orderDoc = {
        orderId,
        customerName: fullName,
        fullName,
        customerPhone: phone,
        phone,
        customerEmail: email,
        email,
        address,
        district,
        shippingAddress: shippingAddress || {
          fullName,
          phone,
          houseFlat: address,
          roadStreet: "",
          area: "",
          cityDistrict: district,
          stateDivision: district,
          postalCode: "",
          countryCode: resolvedCountry,
        },
        countryCode: resolvedCountry,
        countryName: getCountryConfig(resolvedCountry).name,
        carriers: getCarriersForCountry(resolvedCountry),
        codAvailable: codAllowed,
        paymentMethod: effectivePaymentMethod,
        paymentStatus,
        fulfillmentStatus,
        codAmountToCollectBdt: effectivePaymentMethod === "cod" ? authoritativeTotal : 0,
        trxId,
        senderBankName,
        senderNumber,
        productId: primaryItem.productId,
        kitName: resolvedItems.map((i) => `${i.name} ×${i.quantity}`).join(", "),
        productName: resolvedItems.length > 1 ? resolvedItems.map((i) => `${i.name} ×${i.quantity}`).join(", ") : primaryItem.name,
        items: resolvedItems,
        unitPrice: primaryItem.unitPrice,
        quantity: totalQty,
        subtotal,
        shippingFee,
        discount: 0,
        totalAmount: authoritativeTotal,
        price: authoritativeTotal,
        displayCurrency: targetCurrency,
        estimatedConvertedTotal: converted.amount,
        status: orderStatus,
        source: isRentalOrder ? "rental_checkout" : resolvedItems.length > 1 ? "cart_checkout" : "promos_or_dslink",
        createdAt: new Date().toISOString(),
      };

      inMemoryOrders.unshift(orderDoc);
      persistLocalStore();
      recordAuditLog("public_order_created", email || phone || "customer", orderId, {
        countryCode: resolvedCountry,
        subtotal,
        shippingFee,
        totalAmount: authoritativeTotal,
        paymentMethod: effectivePaymentMethod,
        paymentStatus,
        fulfillmentStatus,
      }, extractClientIp(req));

      const activeDb = await getActiveFirestoreDb();
      if (activeDb) {
        try {
          await addDoc(collection(activeDb, "orders"), orderDoc);
        } catch (dbErr: any) {
          if (isFirestoreUnavailableError(dbErr)) {
            disableFirestoreGracefully(dbErr?.message || "order write failed");
          }
        }
      }

      const eventId = `pur_${orderId}_${Date.now()}`;
      sendToFbCapi(
        {
          eventName: "Purchase",
          eventId,
          value: authoritativeTotal,
          currency: "BDT",
          contentName: orderDoc.productName,
          orderId,
          userAgent: req.headers["user-agent"],
          ip: req.ip || req.headers["x-forwarded-for"],
          fbc: req.body.fbc,
          fbp: req.body.fbp,
          utmCampaign: req.body.utmCampaign,
        },
        { email, phone }
      );

      // Strict Notification Rule: Public orders generate zero automatic outbound emails.
      return res.json({
        success: true,
        orderId,
        status: orderStatus,
        paymentStatus,
        fulfillmentStatus,
        countryCode: resolvedCountry,
        carriers: orderDoc.carriers,
        codAvailable: codAllowed,
        paymentMethod: effectivePaymentMethod,
        unitPrice: primaryItem.unitPrice,
        quantity: totalQty,
        subtotal,
        shippingFee,
        totalAmount: authoritativeTotal,
        displayCurrency: targetCurrency,
        estimatedConvertedTotal: converted.amount,
        message: "Order submitted with server-verified pricing and shipping (zero automatic notifications triggered).",
      });
    } catch (error: any) {
      console.error("Promo order endpoint error:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: error?.message || "Failed to place order",
      });
    }
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
        const visitorCountry = resolveVisitorCountryFromRequest(req);
        const rawHtml = fs.readFileSync(indexPath, "utf-8");
        const renderedHtml = buildDomainHtmlDocument(rawHtml, domain, req.path, visitorCountry);
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Vary", VARY_GEO_HEADERS);
        res.status(200).send(renderedHtml);
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
        const visitorCountry = resolveVisitorCountryFromRequest(req);
        const indexPath = path.join(process.cwd(), "index.html");
        const rawTemplate = fs.readFileSync(indexPath, "utf-8");
        const domainHtml = buildDomainHtmlDocument(rawTemplate, domain, req.path, visitorCountry);
        const transformedHtml = (
          await vite.transformIndexHtml(req.originalUrl, domainHtml)
        ).replace(/<script[^>]*src="\/@vite\/client"[^>]*><\/script>\s*/gi, "");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "private, no-store, max-age=0");
        res.setHeader("Vary", VARY_GEO_HEADERS);
        res.status(200).send(transformedHtml);
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
