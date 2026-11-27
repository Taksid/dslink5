import Stripe from "stripe";
import crypto from "crypto";

export interface StripeOrderLike {
  orderId: string;
  orderAccessToken?: string;
  customerEmail?: string;
  email?: string;
  customerPhone?: string;
  phone?: string;
  productId?: string;
  productName?: string;
  items?: Array<{
    productId: string;
    name: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
  subtotal: number;
  shippingFee: number;
  discount?: number;
  totalAmount: number;
  currency?: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus?: string;
  paymentMethod?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeExpectedAmountMinor?: number;
  stripeExpectedCurrency?: string;
  stripePaymentStatus?: string;
  stripePaidAt?: string;
}

export interface StripePaymentRequestLike {
  id: string;
  token: string;
  requestRef?: string;
  orderId: string;
  draftId?: string;
  paymentType: "full" | "advance" | "remaining" | "subscription";
  requestedAmountBdt: number;
  requestedAmount?: number;
  requestedAmountMinor?: number;
  currency: "BDT" | "USD" | string;
  status: string;
  expiresAt: string;
  stripeSessionId?: string;
  stripeSessionUrl?: string;
  stripeSessionCreatedAt?: string;
  stripeSessionAttempt?: number;
  stripeExpectedAmountMinor?: number;
  stripeExpectedCurrency?: string;
  stripePaymentIntentId?: string;
  stripePaymentStatus?: string;
  updatedAt: string;
}

/**
 * Strictly defaults to false when unset or anything other than the exact string "true".
 * Production must keep STRIPE_ENABLED=false until explicitly activated.
 */
export function isStripeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env.STRIPE_ENABLED || "").trim().toLowerCase() === "true";
}

/**
 * True ONLY when STRIPE_ENABLED=true AND a non-empty STRIPE_SECRET_KEY is configured.
 * Used to decide whether the Card tab is shown on DSLink Pay.
 */
export function isStripeConfiguredAndEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return isStripeEnabled(env) && Boolean(String(env.STRIPE_SECRET_KEY || "").trim());
}

export function getStripeClient(env: NodeJS.ProcessEnv = process.env): Stripe | null {
  const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!secretKey) return null;
  return new Stripe(secretKey, {
    maxNetworkRetries: 1,
  });
}

export function generateOrderAccessToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

export function isOrderAuthorizedForStripe(
  order: StripeOrderLike,
  auth: {
    accessToken?: string;
    email?: string;
    phone?: string;
    isAdmin?: boolean;
  }
): boolean {
  if (auth.isAdmin) return true;
  const storedToken = String(order.orderAccessToken || "").trim();
  const providedToken = String(auth.accessToken || "").trim();
  if (storedToken && providedToken) {
    const a = Buffer.from(storedToken);
    const b = Buffer.from(providedToken);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
      return true;
    }
  }
  const storedEmail = String(order.customerEmail || order.email || "").trim().toLowerCase();
  const providedEmail = String(auth.email || "").trim().toLowerCase();
  const storedPhone = String(order.customerPhone || order.phone || "").replace(/\D+/g, "");
  const providedPhone = String(auth.phone || "").replace(/\D+/g, "");
  if (storedPhone && providedPhone && storedPhone.length >= 8 && storedPhone === providedPhone) {
    return true;
  }
  if (storedEmail && providedEmail && storedEmail === providedEmail) {
    return true;
  }
  return false;
}

export function computeAuthoritativeStripeAmount(order: StripeOrderLike): {
  amountMinor: number;
  currency: string;
} {
  const subtotal = Math.max(0, Math.round(Number(order.subtotal) || 0));
  const shipping = Math.max(0, Math.round(Number(order.shippingFee) || 0));
  const discount = Math.max(0, Math.round(Number(order.discount) || 0));
  const computedBdt = Math.max(0, subtotal + shipping - discount);
  const authoritativeBdt =
    Number.isFinite(Number(order.totalAmount)) && Number(order.totalAmount) > 0
      ? Math.round(Number(order.totalAmount))
      : computedBdt;

  // BDT is a two-decimal currency in Stripe (1 BDT = 100 poisha minor units).
  const currency = String(order.currency || "bdt").trim().toLowerCase();
  return {
    amountMinor: Math.round(authoritativeBdt * 100),
    currency,
  };
}

export interface CreateStripeSessionResult {
  httpStatus: number;
  success: boolean;
  error?: string;
  sessionId?: string;
  url?: string | null;
  reused?: boolean;
}

/**
 * Creates a Stripe-hosted Checkout Session from an existing, authorized, server-validated order.
 * Rejects before making any Stripe API call when STRIPE_ENABLED !== "true".
 */
export async function createStripeCheckoutSessionForOrder(params: {
  order: StripeOrderLike | undefined;
  origin: string;
  auth: { accessToken?: string; email?: string; phone?: string; isAdmin?: boolean };
  idempotencyKey?: string;
  env?: NodeJS.ProcessEnv;
  stripeClientOverride?: Stripe | null;
  onOrderMutated?: (order: StripeOrderLike) => Promise<void> | void;
}): Promise<CreateStripeSessionResult> {
  const env = params.env || process.env;

  // Hard gate BEFORE touching Stripe SDK or credentials
  if (!isStripeEnabled(env)) {
    return {
      httpStatus: 403,
      success: false,
      error: "Stripe Checkout is currently disabled.",
    };
  }

  const order = params.order;
  if (!order) {
    return {
      httpStatus: 404,
      success: false,
      error: "Order not found.",
    };
  }

  if (!isOrderAuthorizedForStripe(order, params.auth)) {
    return {
      httpStatus: 403,
      success: false,
      error: "Order authorization failed.",
    };
  }

  const lowerPayStatus = String(order.paymentStatus || "").toLowerCase();
  const lowerStatus = String(order.status || "").toLowerCase();
  if (lowerPayStatus.includes("paid") || lowerStatus === "cancelled" || lowerStatus === "rejected") {
    return {
      httpStatus: 409,
      success: false,
      error: `Order #${order.orderId} is not eligible for Stripe payment (status: ${order.paymentStatus || order.status}).`,
    };
  }

  const stripe = params.stripeClientOverride ?? getStripeClient(env);
  if (!stripe) {
    return {
      httpStatus: 503,
      success: false,
      error: "Stripe credentials are not configured on the server.",
    };
  }

  const { amountMinor, currency } = computeAuthoritativeStripeAmount(order);
  if (amountMinor <= 0) {
    return {
      httpStatus: 400,
      success: false,
      error: "Order amount due must be greater than zero.",
    };
  }

  const cleanOrigin = params.origin.replace(/\/+$/, "");
  const encodedOrderId = encodeURIComponent(order.orderId);
  const successUrl = `${cleanOrigin}/checkout?stripe=success&orderId=${encodedOrderId}&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${cleanOrigin}/checkout?stripe=cancel&orderId=${encodedOrderId}`;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  if (Array.isArray(order.items) && order.items.length > 0) {
    for (const item of order.items) {
      lineItems.push({
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        price_data: {
          currency,
          unit_amount: Math.round(Math.max(0, Number(item.unitPrice) || 0) * 100),
          product_data: {
            name: String(item.name || item.productId || "Starlink Kit").slice(0, 180),
            metadata: { productId: String(item.productId || "") },
          },
        },
      });
    }
    if (order.shippingFee > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(order.shippingFee * 100),
          product_data: {
            name: "Worldwide Courier Shipping (DHL Express / FedEx)",
          },
        },
      });
    }
  } else {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amountMinor,
        product_data: {
          name: String(order.productName || `DSLink Order #${order.orderId}`).slice(0, 180),
        },
      },
    });
  }

  // Deterministic idempotency key for safe client retries
  const safeIdemSuffix = String(params.idempotencyKey || `${amountMinor}-${currency}`)
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  const idempotencyKey = `dslink_cs_${order.orderId}_${safeIdemSuffix}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: order.orderId,
      customer_email:
        order.customerEmail && order.customerEmail.includes("@")
          ? order.customerEmail
          : undefined,
      line_items: lineItems,
      metadata: {
        orderId: order.orderId,
        expectedAmountMinor: String(amountMinor),
        expectedCurrency: currency,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { idempotencyKey }
  );

  order.stripeSessionId = session.id;
  order.stripeExpectedAmountMinor = amountMinor;
  order.stripeExpectedCurrency = currency;
  order.stripePaymentStatus = "pending";
  order.paymentMethod = "stripe";
  if (params.onOrderMutated) {
    await params.onOrderMutated(order);
  }

  return {
    httpStatus: 200,
    success: true,
    sessionId: session.id,
    url: session.url,
  };
}

const STRIPE_SESSION_REUSE_WINDOW_MS = 25 * 60 * 1000; // 25 minutes

/**
 * Creates (or safely reuses) a Stripe-hosted Checkout Session for a DSLink Pay payment request.
 * - Uses ONLY the server-saved requestedAmountBdt and currency of the payment request.
 * - Hard-rejects with 403 BEFORE touching Stripe when STRIPE_ENABLED !== "true".
 * - Prevents duplicate sessions/payments on retries via session reuse + deterministic idempotency key.
 * - Returns to /pay/<token>?stripe=success|cancel without marking paid client-side.
 */
export async function createStripeCheckoutSessionForPaymentRequest(params: {
  paymentRequest: StripePaymentRequestLike | undefined;
  order: StripeOrderLike | undefined;
  origin: string;
  env?: NodeJS.ProcessEnv;
  stripeClientOverride?: Stripe | null;
  onMutated?: (
    paymentRequest: StripePaymentRequestLike,
    order: StripeOrderLike | undefined
  ) => Promise<void> | void;
}): Promise<CreateStripeSessionResult> {
  const env = params.env || process.env;

  // Hard gate BEFORE touching Stripe SDK or credentials
  if (!isStripeEnabled(env)) {
    return {
      httpStatus: 403,
      success: false,
      error: "Card payments via Stripe are currently disabled.",
    };
  }

  const reqRec = params.paymentRequest;
  const order = params.order;
  if (!reqRec) {
    return {
      httpStatus: 404,
      success: false,
      error: "Payment request not found.",
    };
  }

  // Enforce payment request lifecycle eligibility
  if (reqRec.status === "paid") {
    return {
      httpStatus: 409,
      success: false,
      error: "এই পেমেন্ট লিংকের পেমেন্ট ইতিমধ্যে নিশ্চিত হয়েছে। (This payment link is already paid.)",
    };
  }
  if (reqRec.status === "under_review") {
    return {
      httpStatus: 409,
      success: false,
      error: "আপনার পেমেন্ট রেফারেন্স ইতিমধ্যে যাচাই চলছে। (A payment reference is already under review.)",
    };
  }
  if (reqRec.status === "cod_selected") {
    return {
      httpStatus: 409,
      success: false,
      error: "এই অর্ডারের জন্য ক্যাশ অন ডেলিভারি নির্বাচিত হয়েছে। (Cash on Delivery has already been selected.)",
    };
  }
  if (reqRec.status === "expired" || reqRec.status === "revoked" || reqRec.status === "cancelled") {
    return {
      httpStatus: 410,
      success: false,
      error: "এই পেমেন্ট লিংকটি আর সক্রিয় নয়। (This payment link is expired or no longer active.)",
    };
  }

  const expMs = Date.parse(reqRec.expiresAt);
  if (Number.isFinite(expMs) && Date.now() > expMs) {
    return {
      httpStatus: 410,
      success: false,
      error: "এই পেমেন্ট লিংকের মেয়াদ শেষ হয়ে গেছে। (This payment link has expired.)",
    };
  }

  const stripe = params.stripeClientOverride ?? getStripeClient(env);
  if (!stripe) {
    return {
      httpStatus: 503,
      success: false,
      error: "Stripe card payments are not configured on the server.",
    };
  }

  const currency = String(reqRec.currency || "bdt").trim().toLowerCase();
  if (currency !== "bdt" && currency !== "usd") {
    return {
      httpStatus: 400,
      success: false,
      error: `Unsupported Stripe payment currency: ${currency.toUpperCase()}.`,
    };
  }

  const storedMajor =
    typeof reqRec.requestedAmount === "number" && Number.isFinite(reqRec.requestedAmount)
      ? Math.max(0, reqRec.requestedAmount)
      : Math.max(0, Number(reqRec.requestedAmountBdt) || 0);
  const amountMinor =
    typeof reqRec.requestedAmountMinor === "number" &&
    Number.isFinite(reqRec.requestedAmountMinor) &&
    reqRec.requestedAmountMinor > 0
      ? Math.round(reqRec.requestedAmountMinor)
      : Math.round(storedMajor * 100);

  if (amountMinor <= 0) {
    return {
      httpStatus: 400,
      success: false,
      error: "Payment request amount must be greater than zero.",
    };
  }

  // Retry-safe session reuse: if an open Stripe Checkout Session already exists for this exact
  // payment request, amount, and currency within the reuse window, return it without creating a duplicate.
  const createdMs = reqRec.stripeSessionCreatedAt ? Date.parse(reqRec.stripeSessionCreatedAt) : 0;
  const canReuseExisting =
    Boolean(reqRec.stripeSessionId) &&
    Boolean(reqRec.stripeSessionUrl) &&
    reqRec.stripePaymentStatus === "pending" &&
    reqRec.stripeExpectedAmountMinor === amountMinor &&
    reqRec.stripeExpectedCurrency === currency &&
    Number.isFinite(createdMs) &&
    Date.now() - createdMs < STRIPE_SESSION_REUSE_WINDOW_MS;

  if (canReuseExisting && reqRec.stripeSessionId && reqRec.stripeSessionUrl) {
    return {
      httpStatus: 200,
      success: true,
      sessionId: reqRec.stripeSessionId,
      url: reqRec.stripeSessionUrl,
      reused: true,
    };
  }

  // Advance attempt counter only when a prior Stripe session explicitly expired or failed
  const prevAttempt = Math.max(1, Number(reqRec.stripeSessionAttempt) || 1);
  const nextAttempt =
    reqRec.stripePaymentStatus === "expired" || reqRec.stripePaymentStatus === "failed"
      ? prevAttempt + 1
      : prevAttempt;

  const cleanOrigin = params.origin.replace(/\/+$/, "");
  const encodedToken = encodeURIComponent(reqRec.token);
  const successUrl = `${cleanOrigin}/pay/${encodedToken}?stripe=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${cleanOrigin}/pay/${encodedToken}?stripe=cancel`;

  const displayRef = reqRec.requestRef || reqRec.orderId || reqRec.draftId || reqRec.id;
  const typeText =
    reqRec.paymentType === "advance"
      ? "Advance Payment"
      : reqRec.paymentType === "remaining"
      ? "Remaining Balance"
      : reqRec.paymentType === "subscription"
      ? "Rental Subscription"
      : "Full Payment";

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency,
        unit_amount: amountMinor,
        product_data: {
          name: `DSLink Pay #${displayRef} — ${typeText}`.slice(0, 180),
          description: String(order?.productName || "DevSpark Link Starlink Order").slice(0, 200),
        },
      },
    },
  ];

  const idempotencyKey = `dslink_pr_${reqRec.id}_v${nextAttempt}_${amountMinor}_${currency}`;

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      client_reference_id: displayRef,
      line_items: lineItems,
      metadata: {
        requestRef: displayRef,
        orderId: reqRec.orderId || "",
        draftId: reqRec.draftId || "",
        paymentRequestId: reqRec.id,
        paymentType: reqRec.paymentType,
        expectedAmountMinor: String(amountMinor),
        expectedCurrency: currency,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    },
    { idempotencyKey }
  );

  const nowIso = new Date().toISOString();
  reqRec.stripeSessionId = session.id;
  reqRec.stripeSessionUrl = session.url || undefined;
  reqRec.stripeSessionCreatedAt = nowIso;
  reqRec.stripeSessionAttempt = nextAttempt;
  reqRec.stripeExpectedAmountMinor = amountMinor;
  reqRec.stripeExpectedCurrency = currency;
  reqRec.stripePaymentStatus = "pending";
  reqRec.updatedAt = nowIso;

  if (order) {
    order.stripeSessionId = session.id;
    order.stripeExpectedAmountMinor = amountMinor;
    order.stripeExpectedCurrency = currency;
    order.stripePaymentStatus = "pending";
  }

  if (params.onMutated) {
    await params.onMutated(reqRec, order);
  }

  return {
    httpStatus: 200,
    success: true,
    sessionId: session.id,
    url: session.url,
    reused: false,
  };
}

export interface WebhookProcessResult {
  httpStatus: number;
  received: boolean;
  duplicate?: boolean;
  handled?: boolean;
  action?: string;
  orderId?: string;
  paymentRequestId?: string;
  error?: string;
}

/**
 * Verifies Stripe webhook signature against the untouched raw Buffer body,
 * deduplicates events by event.id, and reconciles payment ONLY when session,
 * order (or payment request), amount, and currency all match server records.
 */
export async function handleVerifiedStripeWebhook(params: {
  rawBody: Buffer | string;
  signatureHeader: string | undefined;
  findOrder: (orderId?: string, sessionId?: string) => StripeOrderLike | undefined;
  findPaymentRequest?: (
    paymentRequestId?: string,
    sessionId?: string
  ) => StripePaymentRequestLike | undefined;
  onPaymentRequestPaid?: (
    paymentRequest: StripePaymentRequestLike,
    order: StripeOrderLike | undefined,
    session: Stripe.Checkout.Session,
    eventId: string
  ) => Promise<StripeOrderLike | void> | StripeOrderLike | void;
  processedEventIds: Set<string>;
  onPersist: (order: StripeOrderLike | null, eventId: string, action: string) => Promise<void> | void;
  env?: NodeJS.ProcessEnv;
  stripeClientOverride?: Stripe | null;
}): Promise<WebhookProcessResult> {
  const env = params.env || process.env;
  const webhookSecret = String(env.STRIPE_WEBHOOK_SECRET || "").trim();
  const signature = String(params.signatureHeader || "").trim();

  if (!webhookSecret) {
    return {
      httpStatus: 503,
      received: false,
      error: "Stripe webhook secret is not configured.",
    };
  }
  if (!signature) {
    return {
      httpStatus: 400,
      received: false,
      error: "Missing stripe-signature header.",
    };
  }

  const stripe =
    params.stripeClientOverride ??
    getStripeClient(env) ??
    new Stripe("sk_test_webhook_verify_only");

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(params.rawBody, signature, webhookSecret);
  } catch (err: any) {
    return {
      httpStatus: 400,
      received: false,
      error: `Webhook signature verification failed: ${err?.message || "invalid signature"}`,
    };
  }

  // Idempotent duplicate event guard
  if (params.processedEventIds.has(event.id)) {
    return {
      httpStatus: 200,
      received: true,
      duplicate: true,
      handled: false,
      action: "duplicate_ignored",
    };
  }

  const eventType = event.type;
  if (
    eventType === "checkout.session.completed" ||
    eventType === "checkout.session.async_payment_succeeded" ||
    eventType === "checkout.session.expired" ||
    eventType === "checkout.session.async_payment_failed"
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderIdFromMeta = (session.metadata?.orderId || "").trim() || undefined;
    const paymentRequestIdFromMeta = (session.metadata?.paymentRequestId || "").trim() || undefined;
    const paymentRequest = params.findPaymentRequest
      ? params.findPaymentRequest(paymentRequestIdFromMeta, session.id)
      : undefined;
    const order = params.findOrder(
      orderIdFromMeta || paymentRequest?.orderId || session.client_reference_id || undefined,
      session.id
    );

    if (!paymentRequest && !order) {
      params.processedEventIds.add(event.id);
      await params.onPersist(null, event.id, "order_not_found");
      return {
        httpStatus: 200,
        received: true,
        handled: false,
        action: "order_not_found",
        orderId: orderIdFromMeta,
        paymentRequestId: paymentRequestIdFromMeta,
      };
    }

    if (eventType === "checkout.session.expired" || eventType === "checkout.session.async_payment_failed") {
      const failStatus = eventType === "checkout.session.expired" ? "expired" : "failed";
      if (paymentRequest && paymentRequest.status !== "paid") {
        paymentRequest.stripePaymentStatus = failStatus;
        paymentRequest.updatedAt = new Date().toISOString();
      }
      if (order && !String(order.paymentStatus || "").toLowerCase().includes("paid")) {
        order.stripePaymentStatus = failStatus;
      }
      params.processedEventIds.add(event.id);
      await params.onPersist(order || null, event.id, eventType);
      return {
        httpStatus: 200,
        received: true,
        handled: true,
        action: eventType,
        orderId: order?.orderId,
        paymentRequestId: paymentRequest?.id,
      };
    }

    // Confirm payment ONLY when payment_status === 'paid' (or async_payment_succeeded)
    const isPaidEvent =
      eventType === "checkout.session.async_payment_succeeded" ||
      session.payment_status === "paid";

    if (!isPaidEvent) {
      params.processedEventIds.add(event.id);
      await params.onPersist(order || null, event.id, "awaiting_async_payment");
      return {
        httpStatus: 200,
        received: true,
        handled: true,
        action: "awaiting_async_payment",
        orderId: order?.orderId,
        paymentRequestId: paymentRequest?.id,
      };
    }

    // DSLink Pay Payment Request reconciliation path (supports draft-backed, full, advance, remaining & subscription in BDT/USD)
    if (paymentRequest) {
      const storedMajor =
        typeof paymentRequest.requestedAmount === "number"
          ? paymentRequest.requestedAmount
          : Number(paymentRequest.requestedAmountBdt) || 0;
      const expectedAmount =
        typeof paymentRequest.stripeExpectedAmountMinor === "number"
          ? paymentRequest.stripeExpectedAmountMinor
          : typeof paymentRequest.requestedAmountMinor === "number"
          ? paymentRequest.requestedAmountMinor
          : Math.round(Math.max(0, storedMajor) * 100);
      const expectedCurrency = String(
        paymentRequest.stripeExpectedCurrency || paymentRequest.currency || "bdt"
      ).toLowerCase();
      const sessionCurrency = String(session.currency || "").toLowerCase();

      const sessionMatchesRequest =
        (!paymentRequest.stripeSessionId || paymentRequest.stripeSessionId === session.id) &&
        (!orderIdFromMeta || !paymentRequest.orderId || orderIdFromMeta === paymentRequest.orderId) &&
        (!paymentRequestIdFromMeta || paymentRequestIdFromMeta === paymentRequest.id);
      const amountMatches = session.amount_total === expectedAmount;
      const currencyMatches = sessionCurrency === expectedCurrency;

      if (!sessionMatchesRequest || !amountMatches || !currencyMatches) {
        params.processedEventIds.add(event.id);
        paymentRequest.stripePaymentStatus = "mismatch_flagged";
        paymentRequest.updatedAt = new Date().toISOString();
        if (order) order.stripePaymentStatus = "mismatch_flagged";
        await params.onPersist(order || null, event.id, "verification_mismatch");
        return {
          httpStatus: 400,
          received: false,
          handled: false,
          action: "verification_mismatch",
          orderId: order?.orderId || paymentRequest.orderId || undefined,
          paymentRequestId: paymentRequest.id,
          error: "Stripe session, amount, or currency did not match stored payment request.",
        };
      }

      // Idempotent guard: never apply payment twice to an already-paid payment request
      if (paymentRequest.status === "paid") {
        params.processedEventIds.add(event.id);
        await params.onPersist(order || null, event.id, "already_paid_noop");
        return {
          httpStatus: 200,
          received: true,
          duplicate: true,
          handled: false,
          action: "already_paid_noop",
          orderId: order?.orderId || paymentRequest.orderId || undefined,
          paymentRequestId: paymentRequest.id,
        };
      }

      paymentRequest.stripeSessionId = session.id;
      paymentRequest.stripePaymentIntentId =
        typeof session.payment_intent === "string" ? session.payment_intent : undefined;
      paymentRequest.stripePaymentStatus = "paid";
      paymentRequest.updatedAt = new Date().toISOString();

      let finalOrder: StripeOrderLike | undefined = order;
      if (params.onPaymentRequestPaid) {
        const returned = await params.onPaymentRequestPaid(paymentRequest, order, session, event.id);
        if (returned) finalOrder = returned;
      }

      if (finalOrder) {
        finalOrder.stripeSessionId = session.id;
        finalOrder.stripePaymentIntentId = paymentRequest.stripePaymentIntentId;
        finalOrder.stripePaymentStatus = "paid";
        finalOrder.stripePaidAt = paymentRequest.updatedAt;
      }

      params.processedEventIds.add(event.id);
      await params.onPersist(finalOrder || null, event.id, "payment_request_confirmed");
      return {
        httpStatus: 200,
        received: true,
        handled: true,
        action: "payment_request_confirmed",
        orderId: finalOrder?.orderId || paymentRequest.orderId || undefined,
        paymentRequestId: paymentRequest.id,
      };
    }

    if (!order) {
      params.processedEventIds.add(event.id);
      await params.onPersist(null, event.id, "order_not_found");
      return {
        httpStatus: 200,
        received: true,
        handled: false,
        action: "order_not_found",
        orderId: orderIdFromMeta,
      };
    }

    // Direct order reconciliation path (legacy/direct order Stripe checkout)
    const expectedAmount =
      typeof order.stripeExpectedAmountMinor === "number"
        ? order.stripeExpectedAmountMinor
        : computeAuthoritativeStripeAmount(order).amountMinor;
    const expectedCurrency = String(order.stripeExpectedCurrency || "bdt").toLowerCase();
    const sessionCurrency = String(session.currency || "").toLowerCase();
    const sessionMatchesOrder =
      (!order.stripeSessionId || order.stripeSessionId === session.id) &&
      (!orderIdFromMeta || orderIdFromMeta === order.orderId);
    const amountMatches = session.amount_total === expectedAmount;
    const currencyMatches = sessionCurrency === expectedCurrency;

    if (!sessionMatchesOrder || !amountMatches || !currencyMatches) {
      params.processedEventIds.add(event.id);
      order.stripePaymentStatus = "mismatch_flagged";
      await params.onPersist(order, event.id, "verification_mismatch");
      return {
        httpStatus: 400,
        received: false,
        handled: false,
        action: "verification_mismatch",
        orderId: order.orderId,
        error: "Stripe session, amount, or currency did not match stored order.",
      };
    }

    // Prevent applying payment/fulfillment twice if already paid via another event
    if (String(order.paymentStatus || "").toLowerCase().includes("paid")) {
      params.processedEventIds.add(event.id);
      await params.onPersist(order, event.id, "already_paid_noop");
      return {
        httpStatus: 200,
        received: true,
        duplicate: true,
        handled: false,
        action: "already_paid_noop",
        orderId: order.orderId,
      };
    }

    order.paymentMethod = "stripe";
    order.paymentStatus = "Paid (Stripe Verified)";
    order.status = "Confirmed";
    order.stripeSessionId = session.id;
    order.stripePaymentIntentId =
      typeof session.payment_intent === "string" ? session.payment_intent : undefined;
    order.stripePaymentStatus = "paid";
    order.stripePaidAt = new Date().toISOString();

    params.processedEventIds.add(event.id);
    await params.onPersist(order, event.id, "payment_confirmed");
    return {
      httpStatus: 200,
      received: true,
      handled: true,
      action: "payment_confirmed",
      orderId: order.orderId,
    };
  }

  params.processedEventIds.add(event.id);
  await params.onPersist(null, event.id, `ignored_${eventType}`);
  return {
    httpStatus: 200,
    received: true,
    handled: false,
    action: `ignored_${eventType}`,
  };
}
