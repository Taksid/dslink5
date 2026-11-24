import React from 'react';

export const _: any;
export const c: any;
export const g: any;

export const AuthProvider: React.FC<{ children: React.ReactNode }>;
export const useAuth: () => {
  user: any;
  isAdmin: boolean;
  adminUser: string | null;
  loading: boolean;
  accessToken: string | null;
  loginAdmin: (username: string, password?: string, token?: string) => Promise<boolean>;
  logoutAdmin: () => void;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }>;
export const useLanguage: () => {
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  toggleLanguage: () => void;
  t: (bn: string, en: string) => string;
};

export const testConnection: () => Promise<void>;
export const db: any;
export const auth: any;
export const app: any;
export const OperationType: any;
export const handleFirestoreError: (err: unknown, op: any, path: string | null) => never;

export const SEO: React.FC<any>;
export const CustomerLoginModal: React.FC<any>;
export const AdminLoginModal: React.FC<any>;
export const LiveCameraScannerModal: React.FC<any>;
export const SelfSubscriptionModal: React.FC<any>;
export const PaymentQrCameraScannerModal: React.FC<any>;
export const Navbar: React.FC<any>;
export const WhatsAppIcon: React.FC<any>;
export const Footer: React.FC<any>;
export const FloatingWhatsApp: React.FC<any>;
export const PublicLayout: React.FC<any>;
export const AdminSidebar: React.FC<any>;
export const AdminHeader: React.FC<any>;
export const AdminLoginFormCard: React.FC<any>;
export const AdminLayout: React.FC<any>;
export const CustomerLayout: React.FC<any>;

export const Home: React.FC<any>;
export const Packages: React.FC<any>;
export const Products: React.FC<any>;
export const ProductDetail: React.FC<any>;
export const Support: React.FC<any>;
export const FAQ: React.FC<any>;
export const ImageGallery: React.FC<any>;
export const Blog: React.FC<any>;
export const BlogPostDetail: React.FC<any>;
export const Checkout: React.FC<any>;
export const SingleCheckout: React.FC<any>;
export const PromoAdmin: React.FC<any>;
export const TrackOrder: React.FC<any>;
export const Offers: React.FC<any>;
export const OrderSuccess: React.FC<any>;
export const PrivacyPolicy: React.FC<any>;
export const WarrantyPolicy: React.FC<any>;
export const MoneyBackPolicy: React.FC<any>;
export const BanglaQrPolicy: React.FC<any>;
export const Partnerships: React.FC<any>;
export const DataDeletionRequest: React.FC<any>;
export const Unsubscribe: React.FC<any>;
export const ViewInvoice: React.FC<any>;

export const CustomerDashboardView: React.FC<any>;
export const CustomerOrdersView: React.FC<any>;
export const CustomerInvoicesView: React.FC<any>;
export const CustomerServicesView: React.FC<any>;
export const CustomerTicketsView: React.FC<any>;
export const CustomerSubscriptionView: React.FC<any>;

export const AdminDashboard: React.FC<any>;
export const AdminProducts: React.FC<any>;
export const AdminServices: React.FC<any>;
export const AdminPackages: React.FC<any>;
export const AdminCoupons: React.FC<any>;
export const AdminOrders: React.FC<any>;
export const AdminInvoices: React.FC<any>;
export const InvoiceEditor: React.FC<any>;
export const AdminCustomers: React.FC<any>;
export const AdminSupportTickets: React.FC<any>;
export const EmailManager: React.FC<any>;
export const AdminSponsors: React.FC<any>;
export const AdminContent: React.FC<any>;
export const AdminUsers: React.FC<any>;
export const AdminAuditLogs: React.FC<any>;
export const AdminKnowledgeBase: React.FC<any>;
export const AdminSettings: React.FC<any>;
export const NotFound: React.FC<any>;
export const MobileBottomNav: React.FC<any>;
export const AppRoutes: React.FC<any>;
export const ScrollToTop: React.FC<any>;
export const WifiRedirect: React.FC<any>;
export const AppContent: React.FC<any>;
export const OriginalApp: React.FC<any>;
