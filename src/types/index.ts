export type OrderStatus = 'Received' | 'Processing' | 'Confirmed' | 'Accepted' | 'Preparing' | 'Shipped' | 'In Transit' | 'Delivered' | 'Installation' | 'Completed' | 'Cancelled' | 'Returned';
export type PaymentStatus = 'Pending' | 'Paid' | 'Failed';
export type InstallationStatus = 'Pending' | 'Completed';
export type DiscountType = 'percentage' | 'fixed';

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  images: string[];
  stock: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  dataAllowance: string;
  description: string;
  features: string[];
  terms: string;
  active: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  active: boolean;
}

export interface Order {
  id: string;
  orderId: string;
  uid?: string;
  customerName: string;
  mobile: string;
  email: string;
  address: string;
  district: string;
  upazila: string;
  postalCode: string;
  installationRequired: boolean;
  preferredInstallationDate?: string;
  notes?: string;
  productId?: string;
  packageId?: string;
  productName?: string;
  packageName?: string;
  monthlyPackage?: string;
  quantity: number;
  originalPrice: number;
  discount: number;
  advancePaid?: number;
  remainingBalance?: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  paymentProof?: string;
  trxId?: string;
  senderAccountNo?: string;
  installationStatus: InstallationStatus;
  paymentDetails?: {
    method: string;
    transactionId?: string;
    screenshot?: string;
  };
  cancellationReason?: string;
  source?: string;
  // Courier & Pathao Tracking
  courierName?: string;
  trackingUrl?: string;
  consignmentId?: string;
  pathaoTrackingData?: PathaoTrackingData;
  // Email Tracking
  emailStatus?: 'pending' | 'sent' | 'failed' | 'not_provided';
  emailSentAt?: string;
  emailError?: string;
  // Invoice Reference
  invoiceId?: string;
  invoiceNumber?: string;
  starlinkKitNumber?: string;
  // Bangla QR 3-Month Free Promo Offer
  isBanglaQrEligible?: boolean;
  banglaQrOfferApplied?: boolean;
  banglaQrPaymentProof?: string;
  banglaQrTrxId?: string;
  banglaQrBankName?: string;
  banglaQrAccountNo?: string;
  subscriptionStatus?: string;
  fullName?: string;
  deliveryAddress?: string;
  unitPrice?: number;
  discountAmount?: number;
  appliedCoupon?: string;
  promotionalCreditMonths?: number;
  promotionalCreditValue?: number;
  promotionalCreditStatus?: 'ineligible' | 'pending_verification' | 'active' | 'applied' | 'revoked';
  promotionalCreditActivatedAt?: string;
  promotionalCreditActivatedBy?: string;
  shippingFee?: number;
  // Facebook SDK & Tracking Parameters
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  pixelId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adId?: string;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PathaoTrackingEvent {
  time: string;
  title: string;
  description: string;
  location?: string;
  completed: boolean;
}

export interface PathaoTrackingData {
  consignmentId: string;
  trackingUrl: string;
  status: string; // e.g. 'Order Placed' | 'Picked Up' | 'In Transit' | 'At Hub' | 'Out for Delivery' | 'Delivered'
  courierName: string;
  merchantName?: string;
  recipientName?: string;
  recipientPhone?: string;
  deliveryAddress?: string;
  hubName?: string;
  riderName?: string;
  riderPhone?: string;
  lastUpdated: string;
  events: PathaoTrackingEvent[];
}

export interface PromotionalCredit {
  id: string;
  orderId: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  packageId?: string;
  packageName?: string;
  packageMonthlyPrice: number;
  creditMonths: number;
  creditTotalAmount: number;
  paymentMethod: string;
  paymentTrxId?: string;
  paymentBank?: string;
  status: 'pending_verification' | 'active' | 'applied' | 'revoked';
  firstMonthVerified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  validUntil?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoicePaymentStatus = 'draft' | 'unpaid' | 'partially_paid' | 'paid' | 'overdue' | 'refunded' | 'cancelled';
export type InvoiceEmailStatus = 'draft' | 'pending' | 'sent' | 'failed';
export type CurrencyCode = 'BDT' | 'USD';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  total: number;
  starlinkKitNumber?: string;
}

export interface InvoiceBusinessInfo {
  name: string;
  legalName?: string;
  logoUrl?: string;
  address: string;
  city?: string;
  country?: string;
  email: string;
  phone: string;
  website: string;
  taxNumber?: string; // BIN / VAT / TIN
  bankDetails: string;
  ceoTitle?: string;
  ceoName?: string;
  ceoEmail?: string;
  authorizedSignatureUrl?: string;
  stampUrl?: string;
}

export const DEFAULT_BUSINESS_INFO: InvoiceBusinessInfo = {
  name: "DEVSPARK LINK (DSLINK)",
  legalName: "DEV SPARK SOFT LIMITED",
  logoUrl: "/favicon-devspark.jpg",
  address: "House 42, Road 11, Block D, Banani, Dhaka-1213, Bangladesh",
  city: "Dhaka",
  country: "Bangladesh",
  email: "billing@devsparksoft.com.bd",
  phone: "+8801326370218 / +8801862109990",
  website: "https://devsparksoft.com.bd",
  taxNumber: "BIN: 004819231-0101 (VAT 5%)",
  bankDetails: "Bank Name: City Bank\nAccount Name: WALID HASAN TAKSID\nAccount Number: 2104227151001\nBranch Name: BAGERHAT SUB BRANCH (BAGERHAT)\nBranch District: KHULNA\nRouting Number: 225471548\nMFS & Bank Transfer (bKash / Nagad / City Bank / Cash on Delivery): Supported",
  ceoTitle: "CEO",
  ceoName: "WALID HASAN TAKSID",
  ceoEmail: "walid@taksid.com",
  authorizedSignatureUrl: "/ceo-signature.png",
  stampUrl: ""
};

export interface InvoiceCustomerInfo {
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  billingAddress: string;
  deliveryAddress?: string;
  customerId?: string;
}

export interface InvoiceEmailLog {
  id: string;
  timestamp: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  provider: 'resend' | 'smtp';
  messageId?: string;
  error?: string;
  attemptNumber: number;
}

export interface InvoiceAuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  orderId?: string;
  starlinkKitNumber?: string;
  accessToken: string; // Unguessable token for secure customer invoice view
  issueDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  paymentDate?: string; // YYYY-MM-DD when paid
  status: InvoicePaymentStatus;
  currency: CurrencyCode;
  businessInfo: InvoiceBusinessInfo;
  customerInfo: InvoiceCustomerInfo;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  shippingCharges: number;
  additionalCharges: number;
  grandTotal: number;
  amountPaid: number;
  outstandingBalance: number;
  paymentMethod: string;
  paymentReference?: string; // Transaction or collection reference
  codCollected?: boolean;
  codCollectionRef?: string;
  codCollectedAt?: string;
  notes?: string;
  terms?: string;
  emailStatus: InvoiceEmailStatus;
  lastEmailSentAt?: string;
  lastEmailRecipient?: string;
  emailAttempts: number;
  emailLogs?: InvoiceEmailLog[];
  auditHistory?: InvoiceAuditLog[];
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  orders: string[];
  blocked: boolean;
}

export interface Setting {
  id: string;
  key: string;
  value: string;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  location: string;
  rating: number;
  headline: string;
  comment: string;
  date: string;
  verifiedBuyer: boolean;
  speedMeasured?: string;
  pingMeasured?: string;
  useCase?: string;
  helpfulCount: number;
  badge?: string;
}

export interface MeasurementServer {
  id: string;
  name: string;
  displayName: string;
  region: string;
  country: string;
  city: string;
  endpoint: string;
  pingEndpoint: string;
  downloadEndpoint: string;
  uploadEndpoint: string;
  status: 'online' | 'offline' | 'probing';
  capabilities: string[];
  provider?: string;
  flag?: string;
  type?: 'starlink' | 'transit';
  isDefault?: boolean;
}

export type TicketStatus = 
  | 'Open' 
  | 'AI'
  | 'AI Reviewing' 
  | 'Waiting for User' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Waiting for Internal Team' 
  | 'Resolved' 
  | 'Closed';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface SupportTicket {
  id: string;
  ticketId: string;
  userId?: string;
  email?: string;
  userEmail: string;
  userName: string;
  mobile: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  priorityExplanation?: string;
  description: string;
  attachments?: string[];
  status: TicketStatus;
  lastUpdated?: string;
  assignedAdmin?: string;
  aiControlled?: boolean;
  internalNotes?: string[];
  aiAnalysis?: {
    summary: string;
    issue: string;
    likelyCause: string;
    confidence: string;
    policyCheck: string;
    recommendedAction: string;
    customerResponseDraft: string;
    escalationRequired: boolean;
    escalationReason?: string;
  };
  resolutionInfo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  sender?: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'admin' | 'ai';
  text?: string;
  message: string;
  timestamp?: string;
  attachments?: string[];
  createdAt: string;
  read?: boolean;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  status: 'Published' | 'Draft';
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

