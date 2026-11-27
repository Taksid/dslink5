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

/**
 * Strictly defaults to false when unset or anything other than the exact string "true".
 * Production must keep STRIPE_ENABLED=false until explicitly activated.
 */
export function isStripeEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return String(env.STRIPE_ENABLED || "").trim().toLowerCase() === "true";
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

export interface WebhookProcessResult {
  httpStatus: number;
  received: boolean;
  duplicate?: boolean;
  handled?: boolean;
  action?: string;
  orderId?: string;
  error?: string;
}

/**
 * Verifies Stripe webhook signature against the untouched raw Buffer body,
 * deduplicates events by event.id, and reconciles payment ONLY when session,
 * order, amount, and currency all match the stored server order.
 */
export async function handleVerifiedStripeWebhook(params: {
  rawBody: Buffer | string;
  signatureHeader: string | undefined;
  findOrder: (orderId?: string, sessionId?: string) => StripeOrderLike | undefined;
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
    const orderIdFromMeta = session.metadata?.orderId || session.client_reference_id || undefined;
    const order = params.findOrder(orderIdFromMeta, session.id);

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

    if (eventType === "checkout.session.expired" || eventType === "checkout.session.async_payment_failed") {
      if (!String(order.paymentStatus || "").toLowerCase().includes("paid")) {
        order.stripePaymentStatus = eventType === "checkout.session.expired" ? "expired" : "failed";
      }
      params.processedEventIds.add(event.id);
      await params.onPersist(order, event.id, eventType);
      return {
        httpStatus: 200,
        received: true,
        handled: true,
        action: eventType,
        orderId: order.orderId,
      };
    }

    // Confirm payment ONLY when payment_status === 'paid' (or async_payment_succeeded)
    const isPaidEvent =
      eventType === "checkout.session.async_payment_succeeded" ||
      session.payment_status === "paid";

    if (!isPaidEvent) {
      params.processedEventIds.add(event.id);
      await params.onPersist(order, event.id, "awaiting_async_payment");
      return {
        httpStatus: 200,
        received: true,
        handled: true,
        action: "awaiting_async_payment",
        orderId: order.orderId,
      };
    }

    // Strict verification against stored session ID, order ID, amount, and currency
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
