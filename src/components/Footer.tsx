import React from 'react';
import { ShieldCheck, Phone, Mail, MapPin, RefreshCw, Truck } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';
import { useGlobalCurrency } from '../lib/currencyConfig';
import { PWAInstallButton } from './PWAInstallButton';
import { GlobalFooterPreferences } from './GlobalFooterPreferences';
import { GLOBAL_DELIVERY_COPY, useCentralPricing } from '../lib/pricingConfig';
import { buildLocalePath } from '../lib/localeRouting';

export function Footer() {
  const { language, t, t3 } = useGeoLanguage();
  const { formatPrice } = useGlobalCurrency();
  const { rentalKitPrice, standard4xPrice, miniKitPrice } = useCentralPricing();

  const stdDisplay = formatPrice(standard4xPrice);
  const miniDisplay = formatPrice(miniKitPrice);
  const rentalDisplay = formatPrice(rentalKitPrice);
  const intlShipDisplay = formatPrice(2500);
  const hrefFor = (path: string) => buildLocalePath(path, language);

  return (
    <footer className="mt-16 border-t border-white/15 bg-black pt-12 pb-24 lg:pb-12 px-4 text-xs text-neutral-400 relative safe-bottom">
      {/* Footer-Only Language, Country & Currency Preferences */}
      <GlobalFooterPreferences />

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand & Description */}
        <div className="space-y-4 md:col-span-2 min-w-0">
          <div className="flex items-center">
            <img
              src="/devspark-header-logo.svg"
              alt="DEVSPARK LINK — DSLINK | DEV SPARK SOFT LIMITED"
              width={308}
              height={74}
              className="w-[172px] sm:w-[192px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
            />
          </div>
          <p className="text-neutral-300 text-xs leading-relaxed max-w-md tabular-nums">
            <b>DEVSPARK LINK (DSLINK)</b> BY <b>DEV SPARK SOFT LIMITED</b> —{' '}
            {t3(
              `বাংলাদেশ, মিয়ানমার ও বিশ্বব্যাপী Starlink Standard Kit 4X (${stdDisplay}), Starlink Mini Kit (${miniDisplay}) ও Starlink Rental Kit (${rentalDisplay} এককালীন চার্জ)। বাংলাদেশে ফ্রি ডেলিভারি ও COD (Steadfast/Pathao); বিশ্বব্যাপী DHL/FedEx ডেলিভারি ${intlShipDisplay}। মাসিক Starlink সাবস্ক্রিপশন আলাদা।`,
              `Starlink Standard Kit 4X (${stdDisplay})၊ Starlink Mini Kit (${miniDisplay}) နှင့် Starlink Rental Kit (${rentalDisplay} One-Time)။ မြန်မာနှင့် ကမ္ဘာတစ်ဝှမ်း DHL/FedEx ပို့ဆောင်ခ ${intlShipDisplay}။`,
              `Starlink Kits in Bangladesh, Myanmar & Worldwide: Standard Kit 4X (${stdDisplay}), Mini Kit (${miniDisplay}), and Rental Kit (${rentalDisplay} One-Time). FREE Bangladesh delivery & COD (Steadfast/Pathao); Worldwide DHL/FedEx shipping ${intlShipDisplay} (Prepaid). Monthly Starlink subscriptions are charged separately.`
            )}
          </p>
          <p className="text-[11px] text-neutral-400 leading-relaxed max-w-md">
            <strong className="text-neutral-200">
              {t3(
                GLOBAL_DELIVERY_COPY.headlineBn,
                GLOBAL_DELIVERY_COPY.headlineMy,
                GLOBAL_DELIVERY_COPY.headlineEn
              )}
            </strong>{' '}
            —{' '}
            {t3(
              GLOBAL_DELIVERY_COPY.disclaimerBn,
              GLOBAL_DELIVERY_COPY.disclaimerMy,
              GLOBAL_DELIVERY_COPY.disclaimerEn
            )}
          </p>
          <div className="text-[11px] font-mono text-neutral-400">
            Trade License: <span className="text-white font-semibold">DNCC/037306</span> · USA
            Registration:{' '}
            <span className="text-white font-semibold">Alaska Entity #10237739</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-neutral-300">
            <a href={hrefFor('/warranty')} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <ShieldCheck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t3(
                  '২৪ মাস DSLink রিপ্লেসমেন্ট ওয়ারেন্টি',
                  '၂၄ လ DSLink အစားထိုးအာမခံ',
                  '24-Month DSLink Replacement Warranty'
                )}
              </span>
            </a>
            <a href={hrefFor('/money-back')} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t3(
                  '৯০ দিনের রোমিং মানি-ব্যাক গ্যারান্টি',
                  'ရက် ၉၀ Roaming ငွေပြန်အမ်းအာမခံ',
                  '90-Day Roaming Money-Back Guarantee'
                )}
              </span>
            </a>
            <a href={hrefFor('/worldwide-delivery')} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <Truck className="w-4 h-4 text-neutral-400 shrink-0" />
              <span>
                {t3('বিশ্বব্যাপী DHL/FedEx', 'DHL/FedEx ပို့ဆောင်ရေး', 'Worldwide DHL / FedEx')}
              </span>
            </a>
          </div>
          <div className="pt-1">
            <PWAInstallButton />
          </div>
        </div>

        {/* Col 2: Global Store, Warranty & Regional Links */}
        <div className="space-y-3 min-w-0">
          <h4 className="font-semibold text-white text-sm tracking-wide">
            {t3(
              'স্টোর, ডেলিভারি ও গ্যারান্টি',
              'စတိုး၊ ပို့ဆောင်ရေးနှင့် အာမခံ',
              'Store, Delivery & Guarantees'
            )}
          </h4>
          <ul className="space-y-2 text-xs text-neutral-400">
            <li>
              <a href={hrefFor('/kits')} className="hover:text-white transition-colors block py-0.5 tabular-nums">
                Starlink Kits ({stdDisplay} / {miniDisplay})
              </a>
            </li>
            <li>
              <a href={hrefFor('/rental')} className="hover:text-white transition-colors block py-0.5 tabular-nums">
                Starlink Rental Kit ({rentalDisplay} One-Time)
              </a>
            </li>
            <li>
              <a href={hrefFor('/roaming-packages')} className="hover:text-white transition-colors block py-0.5">
                {t3('রোমিং প্যাকেজসমূহ (Roaming)', 'Roaming ပက်ကေ့ချ်များ', 'Roaming Packages')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/worldwide-delivery')} className="hover:text-white transition-colors block py-0.5">
                {t3('বিশ্বব্যাপী ডেলিভারি (DHL/FedEx)', 'ကမ္ဘာတစ်ဝှမ်း ပို့ဆောင်ရေး', 'Worldwide Delivery')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/starlink-bangladesh')} className="hover:text-white transition-colors block py-0.5">
                Starlink Bangladesh (FREE Delivery &amp; COD)
              </a>
            </li>
            <li>
              <a href={hrefFor('/starlink-myanmar')} className="hover:text-white transition-colors block py-0.5">
                Starlink Myanmar (DHL / FedEx)
              </a>
            </li>
            <li>
              <a href={hrefFor('/warranty')} className="hover:text-white transition-colors block py-0.5">
                {t3('২৪ মাস রিপ্লেসমেন্ট ওয়ারেন্টি পোর্টাল', '၂၄ လ အာမခံ ပေါ်တယ်', '24-Month Replacement Warranty')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/money-back')} className="hover:text-white transition-colors block py-0.5">
                {t3('৯০ দিনের রোমিং মানি-ব্যাক ক্লেইম', 'ရက် ၉၀ Roaming ငွေပြန်အမ်း', '90-Day Roaming Money-Back')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/cart')} className="hover:text-white transition-colors block py-0.5">
                {t3('শপিং কার্ট ও চেকআউট (Cart)', 'ဈေးခြင်း (Cart)', 'Shopping Cart & Checkout')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/track')} className="hover:text-white transition-colors block py-0.5">
                {t3('অর্ডার ট্র্যাক করুন (Track Order)', 'မှာယူမှု စစ်ဆေးရန်', 'Track Order')}
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Legal, Account & Support */}
        <div className="space-y-3 min-w-0">
          <h4 className="font-semibold text-white text-sm tracking-wide">
            {t3(
              'লিগ্যাল, অ্যাকাউন্ট ও যোগাযোগ',
              'မူဝါဒများနှင့် ဆက်သွယ်ရန်',
              'Legal, Account & Contact'
            )}
          </h4>
          <ul className="space-y-1.5 text-xs text-neutral-400 mb-4">
            <li>
              <a href={hrefFor('/Legal')} className="text-white font-medium hover:text-neutral-300 transition-colors block py-0.5">
                {t3('লিগ্যাল ও নীতিমালা কেন্দ্র (/Legal)', 'ဥပဒေနှင့် မူဝါဒ စင်တာ', 'Legal & Policies Center (/Legal)')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/Legal/rental-policy')} className="hover:text-white transition-colors block py-0.5">
                {t3('রেন্টাল পলিসি (Rental Policy)', 'ငှားရမ်းခြင်း မူဝါဒ', 'Rental Policy & Restrictions')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/red-policy-alert')} className="hover:text-white transition-colors block py-0.5">
                Red Policy Alert
              </a>
            </li>
            <li>
              <a href={hrefFor('/price-syndicate-alert')} className="hover:text-white transition-colors block py-0.5">
                Price Syndicate Alert
              </a>
            </li>
            <li>
              <a href={hrefFor('/resell')} className="text-emerald-400 font-semibold hover:text-emerald-300 transition-colors block py-0.5">
                {t3('স্টারলিংক রিসেলার আবেদন (/resell)', 'Starlink Reseller လျှောက်လွှာ', 'Starlink Reseller Application (/resell)')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/resell/authorized-retailer')} className="hover:text-white transition-colors block py-0.5">
                {t3('অথরাইজড রিটেইলার ইনকোয়ারি', 'Authorized Retailer Inquiry', 'Authorized Retailer Inquiry')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/resell/business-partnership')} className="hover:text-white transition-colors block py-0.5">
                {t3('বিজনেস পার্টনারশিপ ইনকোয়ারি', 'Business Partnership Inquiry', 'Business Partnership Inquiry')}
              </a>
            </li>
            <li>
              <a href="/reseller/portal" className="hover:text-white transition-colors block py-0.5">
                {t3('রিসেলার ড্যাশবোর্ড ও পোর্টাল', 'Reseller Portal & Dashboard', 'Reseller Portal & Dashboard')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/account')} className="hover:text-white transition-colors block py-0.5">
                {t3('কাস্টমার ড্যাশবোর্ড (Account)', 'အကောင့် ဒက်ရှ်ဘုတ်', 'Customer Dashboard')}
              </a>
            </li>
            <li>
              <a href={hrefFor('/support')} className="hover:text-white transition-colors block py-0.5">
                {t3('২৪/৭ সাপোর্ট (Support)', 'အကူအညီ (Support)', 'Contact Support')}
              </a>
            </li>
          </ul>

          <div className="space-y-2 text-xs pt-2 border-t border-white/10">
            <a
              href="https://wa.me/+8801326370218"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>
                WhatsApp: <b className="text-white">+880 1326-370218</b>
              </span>
            </a>
            <div className="flex items-center gap-2 text-neutral-300">
              <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">support@devsparksoft.com.bd</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span>{t3('ঢাকা, বাংলাদেশ', 'ဒါကာ၊ ဘင်္ဂလားဒေ့ရှ်', 'Dhaka, Bangladesh')}</span>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-2" data-testid="footer-social-contacts">
              <a
                href="https://www.facebook.com/share/1AM85YcqNL/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Contact"
                data-testid="footer-facebook-contact"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 text-neutral-200 hover:text-white transition-colors text-[11px] font-medium"
              >
                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
                <span>Facebook</span>
              </a>
              <a
                href="https://www.instagram.com/dslinkbd?evlk=MXRiYzMzdndqeHNzNg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Contact"
                data-testid="footer-instagram-contact"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 text-neutral-200 hover:text-white transition-colors text-[11px] font-medium"
              >
                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                <span>Instagram</span>
              </a>
              <a
                href="https://t.me/profwht"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Telegram Contact"
                data-testid="footer-telegram-contact"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] border border-white/15 bg-white/5 hover:bg-white/15 hover:border-white/30 text-neutral-200 hover:text-white transition-colors text-[11px] font-medium"
              >
                <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                </svg>
                <span>Telegram (@profwht)</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-neutral-500">
        <div className="space-y-1">
          <p className="text-neutral-300">
            {t('company.operatedByPrefix', 'DSLink is operated by ')}
            <a
              href="https://devsparksoft.com.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white font-semibold underline underline-offset-4 hover:text-neutral-200 transition-colors"
            >
              Dev Spark Soft Limited
            </a>
            {t('company.operatedBySuffix', '.')}
          </p>
          <p>
            © 2026 <strong className="text-white">DEVSPARK LINK</strong> BY{' '}
            <strong className="text-white">DEV SPARK SOFT LIMITED</strong>. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-neutral-400 font-medium">
            Trade License: DNCC/037306 · USA Alaska Entity #10237739
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
