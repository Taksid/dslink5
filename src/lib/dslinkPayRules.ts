/**
 * DSLink Pay — Authoritative Product, Destination, Currency, Rental & Payment Method Rules.
 *
 * Single source of truth shared between the Express backend and React frontend:
 * - Payment currency and eligible payment methods are determined strictly from
 *   the validated shipping destination + server catalog product types.
 * - Never depends on browser geolocation, display currency switcher, or "Global/Roam" marketing copy.
 */

import { CentralProductPrice } from './pricingConfig';
import { getCountryConfig, isCarrierSupported, normalizeCountryCode } from './shippingConfig';
import { DSLinkPayCurrency, DSLinkPayMethod, DSLinkPayType } from './dslinkPayConfig';

export type ProductClass = 'rental' | 'bd_residential' | 'roam_premium';

export type RentalActivationCollectionRule = 'upfront' | 'on_activation';

export interface DSLinkPricingAndShippingRulesConfig {
  bangladeshPurchaseShippingBdt: number;
  bangladeshRentalShippingBdt: number;
  internationalShippingBdt: number;
  internationalShippingUsd?: number | null;
  bdtToUsdRate: number;
  /** Optional explicit USD catalog prices keyed by productId */
  productUsdPrices?: Record<string, number>;
  /** Collection rule for the one-time rental/activation fee on BD rental kits */
  rentalActivationCollectionRule: RentalActivationCollectionRule;
  /** Optional required advance BDT for COD orders (0 = full COD on delivery) */
  codAdvanceBdt: number;
  blockedCountries: string[];
}

export interface RentalSubscriptionPlanConfig {
  id: string;
  name: string;
  nameBn: string;
  monthlyFeeBdt: number;
  speedLabel: string;
  dataCapLabel: string;
}

export const RENTAL_SUBSCRIPTION_PLANS: readonly RentalSubscriptionPlanConfig[] = [
  {
    id: 'bd_residential_standard',
    name: 'Bangladesh Residential Standard (Up to 5 TB/mo)',
    nameBn: 'বাংলাদেশ রেসিডেন্সিয়াল স্ট্যান্ডার্ড (মাসিক সর্বোচ্চ ৫ টিবি)',
    monthlyFeeBdt: 6000,
    speedLabel: '100–250 Mbps',
    dataCapLabel: 'Up to 5 TB/month',
  },
  {
    id: 'bd_residential_lite',
    name: 'Bangladesh Residential Lite (Fixed Location)',
    nameBn: 'বাংলাদেশ রেসিডেন্সিয়াল লাইট (ফিক্সড লোকেশন)',
    monthlyFeeBdt: 4200,
    speedLabel: '50–150 Mbps',
    dataCapLabel: 'Fixed location Residential',
  },
];

export const RENTAL_SHIPPING_EXCLUSION_NOTICE_BN =
  'শিপিং চার্জ অগ্রিম পরিশোধ করুন। সাবস্ক্রিপশন চার্জ কিট হাতে পাওয়ার পর বা অ্যাক্টিভেশনের সময় পরিশোধ করুন।';

export const DEFAULT_BDT_TO_USD_RATE = 0.00825; // ~121.21 BDT = 1 USD
export const DEFAULT_RENTAL_SHIPPING_FEE_BDT = 500;

export function classifyCatalogProduct(product: Pick<CentralProductPrice, 'id' | 'category' | 'variantType' | 'globalDeliveryAvailable'>): ProductClass {
  const idLower = String(product.id || '').toLowerCase();
  if (product.category === 'rental' || product.variantType === 'rental' || idLower.includes('rental')) {
    return 'rental';
  }
  if (
    product.variantType === 'bd_residential' ||
    idLower.includes('bd-residential') ||
    !product.globalDeliveryAvailable
  ) {
    return 'bd_residential';
  }
  return 'roam_premium';
}

export function roundCurrencyAmount(amount: number, currency: DSLinkPayCurrency): number {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (currency === 'USD') {
    return Math.round(safe * 100) / 100;
  }
  return Math.round(safe);
}

export function toMinorUnits(amount: number, currency: DSLinkPayCurrency): number {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  if (currency === 'USD') {
    return Math.round(safe * 100);
  }
  return Math.round(safe) * 100;
}

export function convertBdtToUsdServer(bdtAmount: number, bdtToUsdRate: number): number {
  const safeBdt = Number.isFinite(bdtAmount) ? Math.max(0, bdtAmount) : 0;
  const rate = Number.isFinite(bdtToUsdRate) && bdtToUsdRate > 0 ? bdtToUsdRate : DEFAULT_BDT_TO_USD_RATE;
  return Math.round(safeBdt * rate * 100) / 100;
}

export interface EvaluatedCartLine {
  productId: string;
  name: string;
  variantLabel?: string;
  productClass: ProductClass;
  quantity: number;
  unitPriceBdt: number;
  lineTotalBdt: number;
  unitPrice: number;
  lineTotal: number;
  currency: DSLinkPayCurrency;
}

export interface CheckoutEligibilityEvaluation {
  valid: boolean;
  error?: string;
  errorBn?: string;
  countryCode: string;
  countryName: string;
  isBangladesh: boolean;
  carrierSupported: boolean;
  currency: DSLinkPayCurrency;
  hasRental: boolean;
  hasBdResidential: boolean;
  ineligibleItems: Array<{
    productId: string;
    name: string;
    productClass: ProductClass;
    reason: string;
  }>;
  items: EvaluatedCartLine[];
  subtotalBdt: number;
  shippingFeeBdt: number;
  orderTotalBdt: number;
  subtotalAmount: number;
  shippingFeeAmount: number;
  orderTotalAmount: number;
  /** Amount payable right now on DSLink Pay (e.g. shipping upfront for rental, or full total) */
  payableNowAmount: number;
  payableNowMinor: number;
  /** Amount due later (e.g. on delivery for COD-with-advance, or activation fee if rule=on_activation) */
  remainingDueLaterAmount: number;
  rentalBreakdown?: {
    rentalShippingFeeBdt: number;
    activationFeeBdt: number;
    activationCollectionRule: RentalActivationCollectionRule;
    subscriptionExcludedToday: true;
    subscriptionNoticeBn: string;
  };
  codAvailable: boolean;
  codAdvanceRequiredAmount: number;
  codRemainingOnDeliveryAmount: number;
  eligibleMethods: DSLinkPayMethod[];
  cardUnavailableForDestination: boolean;
}

export function evaluateCheckoutEligibility(params: {
  countryCode: string;
  items: Array<{ product: CentralProductPrice; quantity: number }>;
  rules: DSLinkPricingAndShippingRulesConfig;
  stripeCardEnabled: boolean;
}): CheckoutEligibilityEvaluation {
  const countryCode = normalizeCountryCode(params.countryCode);
  const countryCfg = getCountryConfig(countryCode);
  const isBangladesh = countryCode === 'BD';
  const blockedSet = new Set((params.rules.blockedCountries || []).map((c) => c.toUpperCase()));
  const carrierSupported = isCarrierSupported(countryCode) && !blockedSet.has(countryCode);

  const currency: DSLinkPayCurrency = isBangladesh ? 'BDT' : 'USD';
  const ineligibleItems: CheckoutEligibilityEvaluation['ineligibleItems'] = [];
  const evaluatedLines: EvaluatedCartLine[] = [];

  let hasRental = false;
  let hasBdResidential = false;
  let subtotalBdt = 0;
  let subtotalAmount = 0;

  for (const entry of params.items) {
    const qty = Math.min(20, Math.max(1, Math.floor(Number(entry.quantity) || 1)));
    const prod = entry.product;
    const productClass = classifyCatalogProduct(prod);

    if (productClass === 'rental') hasRental = true;
    if (productClass === 'bd_residential') hasBdResidential = true;

    if (!isBangladesh && (productClass === 'rental' || productClass === 'bd_residential')) {
      ineligibleItems.push({
        productId: prod.id,
        name: prod.name,
        productClass,
        reason:
          productClass === 'rental'
            ? 'Starlink Rental Kits are available only in Bangladesh.'
            : 'Bangladesh Residential kits cannot be shipped outside Bangladesh. Select a Roam Premium kit instead.',
      });
    }

    const unitPriceBdt = Math.max(0, Math.round(Number(prod.price) || 0));
    const lineTotalBdt = unitPriceBdt * qty;
    subtotalBdt += lineTotalBdt;

    let unitPrice = unitPriceBdt;
    if (currency === 'USD') {
      const explicitUsd = params.rules.productUsdPrices?.[prod.id];
      unitPrice =
        typeof explicitUsd === 'number' && Number.isFinite(explicitUsd) && explicitUsd > 0
          ? roundCurrencyAmount(explicitUsd, 'USD')
          : convertBdtToUsdServer(unitPriceBdt, params.rules.bdtToUsdRate);
    }
    const lineTotal = roundCurrencyAmount(unitPrice * qty, currency);
    subtotalAmount = roundCurrencyAmount(subtotalAmount + lineTotal, currency);

    evaluatedLines.push({
      productId: prod.id,
      name: prod.name,
      variantLabel: prod.variantLabel,
      productClass,
      quantity: qty,
      unitPriceBdt,
      lineTotalBdt,
      unitPrice,
      lineTotal,
      currency,
    });
  }

  // Shipping fee based strictly on validated destination + rental status
  const shippingFeeBdt = isBangladesh
    ? hasRental
      ? Math.max(0, Math.round(Number(params.rules.bangladeshRentalShippingBdt) || 0))
      : Math.max(0, Math.round(Number(params.rules.bangladeshPurchaseShippingBdt) || 0))
    : Math.max(0, Math.round(Number(params.rules.internationalShippingBdt) || 0));

  const shippingFeeAmount =
    currency === 'USD'
      ? typeof params.rules.internationalShippingUsd === 'number' &&
        Number.isFinite(params.rules.internationalShippingUsd) &&
        params.rules.internationalShippingUsd >= 0
        ? roundCurrencyAmount(params.rules.internationalShippingUsd, 'USD')
        : convertBdtToUsdServer(shippingFeeBdt, params.rules.bdtToUsdRate)
      : shippingFeeBdt;

  const orderTotalBdt = subtotalBdt + shippingFeeBdt;
  const orderTotalAmount = roundCurrencyAmount(subtotalAmount + shippingFeeAmount, currency);

  // Rental upfront vs activation fee collection rule
  let payableNowAmount = orderTotalAmount;
  let remainingDueLaterAmount = 0;
  let rentalBreakdown: CheckoutEligibilityEvaluation['rentalBreakdown'];

  if (isBangladesh && hasRental) {
    const rentalLinesTotalBdt = evaluatedLines
      .filter((l) => l.productClass === 'rental')
      .reduce((sum, l) => sum + l.lineTotalBdt, 0);
    const nonRentalLinesTotalBdt = subtotalBdt - rentalLinesTotalBdt;

    const activationCollectionRule = params.rules.rentalActivationCollectionRule || 'upfront';
    if (activationCollectionRule === 'on_activation') {
      payableNowAmount = shippingFeeBdt + nonRentalLinesTotalBdt;
      remainingDueLaterAmount = rentalLinesTotalBdt;
    } else {
      payableNowAmount = orderTotalBdt;
      remainingDueLaterAmount = 0;
    }

    rentalBreakdown = {
      rentalShippingFeeBdt: shippingFeeBdt,
      activationFeeBdt: rentalLinesTotalBdt,
      activationCollectionRule,
      subscriptionExcludedToday: true,
      subscriptionNoticeBn: RENTAL_SHIPPING_EXCLUSION_NOTICE_BN,
    };
  }

  // COD rules: ONLY Bangladesh purchase kits (NEVER rental, NEVER international)
  const codAvailable = isBangladesh && !hasRental && carrierSupported && evaluatedLines.length > 0;
  const configuredCodAdvance =
    codAvailable && params.rules.codAdvanceBdt > 0 && params.rules.codAdvanceBdt < orderTotalBdt
      ? Math.round(params.rules.codAdvanceBdt)
      : 0;
  const codRemainingOnDeliveryAmount = codAvailable
    ? Math.max(0, orderTotalBdt - configuredCodAdvance)
    : 0;

  // Eligible methods strictly derived from destination + product class + Stripe config
  let eligibleMethods: DSLinkPayMethod[] = [];
  if (isBangladesh) {
    eligibleMethods = ['bangla_qr', 'bank_transfer'];
    if (params.stripeCardEnabled) {
      eligibleMethods.push('card');
    }
    if (codAvailable) {
      eligibleMethods.push('cod');
    }
  } else {
    // International (India & other supported destinations): Card ONLY when enabled
    eligibleMethods = params.stripeCardEnabled ? ['card'] : [];
  }

  const cardUnavailableForDestination = !isBangladesh && !params.stripeCardEnabled;

  // Validation errors
  if (evaluatedLines.length === 0) {
    return {
      valid: false,
      error: 'Your cart is empty. Add a Starlink kit before continuing to payment.',
      errorBn: 'আপনার কার্ট খালি। আগে একটি Starlink কিট যোগ করুন।',
      countryCode,
      countryName: countryCfg.name,
      isBangladesh,
      carrierSupported,
      currency,
      hasRental,
      hasBdResidential,
      ineligibleItems,
      items: evaluatedLines,
      subtotalBdt,
      shippingFeeBdt,
      orderTotalBdt,
      subtotalAmount,
      shippingFeeAmount,
      orderTotalAmount,
      payableNowAmount,
      payableNowMinor: toMinorUnits(payableNowAmount, currency),
      remainingDueLaterAmount,
      rentalBreakdown,
      codAvailable,
      codAdvanceRequiredAmount: configuredCodAdvance,
      codRemainingOnDeliveryAmount,
      eligibleMethods,
      cardUnavailableForDestination,
    };
  }

  if (!carrierSupported) {
    return {
      valid: false,
      error: `Checkout is not supported for ${countryCfg.name}. Please choose a supported destination or submit a Delivery Inquiry.`,
      errorBn: `${countryCfg.name}-এ সরাসরি চেকআউট উপলব্ধ নয়। অনুগ্রহ করে সমর্থিত গন্তব্য নির্বাচন করুন।`,
      countryCode,
      countryName: countryCfg.name,
      isBangladesh,
      carrierSupported,
      currency,
      hasRental,
      hasBdResidential,
      ineligibleItems,
      items: evaluatedLines,
      subtotalBdt,
      shippingFeeBdt,
      orderTotalBdt,
      subtotalAmount,
      shippingFeeAmount,
      orderTotalAmount,
      payableNowAmount,
      payableNowMinor: toMinorUnits(payableNowAmount, currency),
      remainingDueLaterAmount,
      rentalBreakdown,
      codAvailable: false,
      codAdvanceRequiredAmount: 0,
      codRemainingOnDeliveryAmount: 0,
      eligibleMethods: [],
      cardUnavailableForDestination: false,
    };
  }

  if (ineligibleItems.length > 0) {
    const names = ineligibleItems.map((i) => i.name).join(', ');
    return {
      valid: false,
      error: `The following item(s) in your cart cannot be shipped to ${countryCfg.name}: ${names}. Remove them or switch destination to Bangladesh (BD). Only eligible Roam Premium purchase kits can be ordered outside Bangladesh.`,
      errorBn: `আপনার কার্টের এই পণ্যগুলো ${countryCfg.name}-এ পাঠানো যাবে না: ${names}। এগুলো সরিয়ে নিন অথবা গন্তব্য বাংলাদেশ নির্বাচন করুন।`,
      countryCode,
      countryName: countryCfg.name,
      isBangladesh,
      carrierSupported,
      currency,
      hasRental,
      hasBdResidential,
      ineligibleItems,
      items: evaluatedLines,
      subtotalBdt,
      shippingFeeBdt,
      orderTotalBdt,
      subtotalAmount,
      shippingFeeAmount,
      orderTotalAmount,
      payableNowAmount,
      payableNowMinor: toMinorUnits(payableNowAmount, currency),
      remainingDueLaterAmount,
      rentalBreakdown,
      codAvailable: false,
      codAdvanceRequiredAmount: 0,
      codRemainingOnDeliveryAmount: 0,
      eligibleMethods: [],
      cardUnavailableForDestination: false,
    };
  }

  return {
    valid: true,
    countryCode,
    countryName: countryCfg.name,
    isBangladesh,
    carrierSupported,
    currency,
    hasRental,
    hasBdResidential,
    ineligibleItems: [],
    items: evaluatedLines,
    subtotalBdt,
    shippingFeeBdt,
    orderTotalBdt,
    subtotalAmount,
    shippingFeeAmount,
    orderTotalAmount,
    payableNowAmount,
    payableNowMinor: toMinorUnits(payableNowAmount, currency),
    remainingDueLaterAmount,
    rentalBreakdown,
    codAvailable,
    codAdvanceRequiredAmount: configuredCodAdvance,
    codRemainingOnDeliveryAmount,
    eligibleMethods,
    cardUnavailableForDestination,
  };
}

/**
 * Computes server-approved eligible methods for an existing payment request (used by staff links,
 * customer checkout drafts, and rental subscription requests).
 */
export function computeEligibleMethodsForPaymentRequest(params: {
  countryCode: string;
  currency: DSLinkPayCurrency;
  isRentalOrder: boolean;
  paymentType: DSLinkPayType;
  codAvailable: boolean;
  requestedAmount: number;
  remainingBalanceAmount: number;
  stripeCardEnabled: boolean;
}): DSLinkPayMethod[] {
  const isBangladesh = normalizeCountryCode(params.countryCode) === 'BD';
  if (!isBangladesh || params.currency === 'USD') {
    // International orders: Card ONLY when enabled and configured
    return params.stripeCardEnabled ? ['card'] : [];
  }

  const methods: DSLinkPayMethod[] = ['bangla_qr', 'bank_transfer'];
  if (params.stripeCardEnabled) {
    methods.push('card');
  }
  const allowCod = Boolean(
    params.codAvailable &&
      !params.isRentalOrder &&
      params.paymentType === 'full' &&
      params.requestedAmount > 0 &&
      Math.abs(params.requestedAmount - params.remainingBalanceAmount) < 0.01
  );
  if (allowCod) {
    methods.push('cod');
  }
  return methods;
}
