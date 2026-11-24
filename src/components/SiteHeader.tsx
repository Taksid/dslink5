import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { OFFICIAL_HEADER_LOGO_URL } from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';
import { useCart } from '../lib/cartStore';
import { buildLocalePath } from '../lib/localeRouting';

interface SiteHeaderProps {
  sectionLabel?: string;
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

/**
 * Shared standalone page header.
 * Strictly omits language selector per Part 4.10 (language selector resides exclusively in Footer).
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({
  sectionLabel,
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t } = useGeoLanguage();
  const { itemCount } = useCart();

  const hrefFor = (path: string) => buildLocalePath(path, language);

  const navigateTo = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    } else if (path === '/' && onBackToMainSite) {
      onBackToMainSite();
    } else {
      const target = hrefFor(path);
      window.history.pushState({}, '', target);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-black/95 backdrop-blur-md safe-top">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-6 min-h-14 sm:min-h-16 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <a
            href={hrefFor('/')}
            onClick={(e) => navigateTo(e, '/')}
            className="flex items-center shrink min-w-0"
          >
            <img
              src={OFFICIAL_HEADER_LOGO_URL}
              alt="DEVSPARK LINK — DSLINK | DEV SPARK SOFT LIMITED"
              width={308}
              height={74}
              className="w-[136px] min-[375px]:w-[154px] sm:w-[176px] md:w-[190px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
            />
          </a>
          {sectionLabel && (
            <span className="hidden lg:inline-block text-[11px] font-mono uppercase tracking-widest text-neutral-400 border-l border-white/15 pl-3 truncate">
              {sectionLabel}
            </span>
          )}
        </div>

        <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-neutral-300">
          <a href={hrefFor('/kits')} onClick={(e) => navigateTo(e, '/kits')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.kits', 'Starlink Kits')}
          </a>
          <a href={hrefFor('/rental')} onClick={(e) => navigateTo(e, '/rental')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.rental', 'Rental')}
          </a>
          <a href={hrefFor('/resell')} onClick={(e) => navigateTo(e, '/resell')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.resell', 'Resell & Partner')}
          </a>
          <a href={hrefFor('/roaming-packages')} onClick={(e) => navigateTo(e, '/roaming-packages')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.roaming', 'Roaming')}
          </a>
          <a href={hrefFor('/worldwide-delivery')} onClick={(e) => navigateTo(e, '/worldwide-delivery')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.delivery', 'Worldwide Delivery')}
          </a>
          <a href={hrefFor('/warranty')} onClick={(e) => navigateTo(e, '/warranty')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.warranty', 'Warranty')}
          </a>
          <a href={hrefFor('/Legal')} onClick={(e) => navigateTo(e, '/Legal')} className="hover:text-white transition-colors whitespace-nowrap">
            {t('nav.legal', 'Legal')}
          </a>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={hrefFor('/cart')}
            onClick={(e) => navigateTo(e, '/cart')}
            aria-label="Shopping Cart"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-white/10 hover:bg-white/20 text-xs font-medium text-white transition-colors whitespace-nowrap tabular-nums"
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{t('nav.cart', 'Cart')}</span>
            <span className="font-mono font-semibold">{itemCount}</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default SiteHeader;
