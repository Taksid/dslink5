import React, { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { OFFICIAL_HEADER_LOGO_URL } from '../lib/domainConfig';
import { useGeoLanguage } from '../lib/geoLanguage';
import { useCart } from '../lib/cartStore';
import { buildLocalePath, parseLocalePath } from '../lib/localeRouting';

interface SiteHeaderProps {
  sectionLabel?: string;
  onNavigate?: (path: string) => void;
  onBackToMainSite?: () => void;
}

/**
 * Shared standalone page header with WCAG AA dark + cyan tokens, collision-free desktop nav,
 * and an accessible mobile menu drawer (switching below lg / 1024px before links collide).
 * Language selector resides exclusively in the Footer.
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({
  sectionLabel,
  onNavigate,
  onBackToMainSite,
}) => {
  const { language, t } = useGeoLanguage();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hrefFor = (path: string) => buildLocalePath(path, language);
  const currentBasePath =
    typeof window !== 'undefined'
      ? parseLocalePath(window.location.pathname).basePath.toLowerCase()
      : '/';

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navigateTo = (e: React.MouseEvent, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setMobileMenuOpen(false);
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

  const navItems = [
    { path: '/kits', label: t('nav.kits', 'Starlink Kits') },
    { path: '/rental', label: t('nav.rental', 'Rental') },
    { path: '/roaming-packages', label: t('nav.roaming', 'Roaming') },
    { path: '/worldwide-delivery', label: t('nav.delivery', 'Delivery') },
    { path: '/warranty', label: t('nav.warranty', 'Warranty') },
    { path: '/resell', label: t('nav.resell', 'Resell') },
    { path: '/Legal', label: t('nav.legal', 'Legal') },
  ];

  const isNavActive = (path: string) => {
    const p = path.toLowerCase();
    if (p === '/kits') return currentBasePath === '/kits' || currentBasePath.startsWith('/kits/');
    if (p === '/legal') return currentBasePath === '/legal' || currentBasePath.startsWith('/legal/');
    if (p === '/resell') return currentBasePath === '/resell' || currentBasePath.startsWith('/resell/');
    return currentBasePath === p;
  };

  return (
    <>
      <a href="#main-content" className="ds-skip-link">
        Skip to main content
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-700/60 bg-[#04070c]/95 backdrop-blur-md safe-top">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6 min-h-[60px] py-2 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 min-w-0 shrink">
            <a
              href={hrefFor('/')}
              onClick={(e) => navigateTo(e, '/')}
              className="flex items-center min-h-[44px] py-1 shrink min-w-0 rounded focus-visible:outline-cyan-400"
            >
              <img
                src={OFFICIAL_HEADER_LOGO_URL}
                alt="DEVSPARK LINK — DSLINK | DEV SPARK SOFT LIMITED"
                width={308}
                height={74}
                className="w-[132px] min-[375px]:w-[152px] sm:w-[172px] lg:w-[180px] max-w-full h-auto aspect-[308/74] object-contain object-left block"
              />
            </a>
            {sectionLabel && (
              <span className="hidden 2xl:inline-block text-xs font-mono uppercase tracking-wider text-slate-300 border-l border-slate-700 pl-3 truncate max-w-[200px]">
                {sectionLabel}
              </span>
            )}
          </div>

          {/* Desktop Navigation — switches to mobile menu below lg (1024px) to guarantee zero collisions */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium"
          >
            {navItems.map((item) => {
              const active = isNavActive(item.path);
              return (
                <a
                  key={item.path}
                  href={hrefFor(item.path)}
                  onClick={(e) => navigateTo(e, item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-2.5 xl:px-3 py-2 min-h-[40px] inline-flex items-center rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'text-cyan-300 font-semibold underline decoration-cyan-400 decoration-2 underline-offset-8 bg-cyan-400/10'
                      : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-800/70'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right Controls: Cart + Mobile Menu Toggle (all >= 44x44 CSS px on mobile) */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={hrefFor('/cart')}
              onClick={(e) => navigateTo(e, '/cart')}
              aria-label={`Shopping Cart (${itemCount} items)`}
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] min-w-[44px] px-3 rounded-lg border border-cyan-400/40 bg-cyan-400/10 hover:bg-cyan-400/20 text-sm font-semibold text-white transition-colors whitespace-nowrap tabular-nums"
            >
              <ShoppingBag className="w-4 h-4 text-cyan-300 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t('nav.cart', 'Cart')}</span>
              <span className="font-mono font-bold text-cyan-200">{itemCount}</span>
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls="ds-mobile-nav"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="lg:hidden inline-flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 hover:border-cyan-400/60 text-white transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-cyan-300" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-slate-100" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Accessible Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <nav
            id="ds-mobile-nav"
            aria-label="Mobile Navigation"
            className="lg:hidden border-t border-slate-700/70 bg-[#070b12] px-4 py-4 shadow-2xl max-h-[calc(100dvh-64px)] overflow-y-auto"
          >
            <ul className="space-y-1.5">
              <li>
                <a
                  href={hrefFor('/')}
                  onClick={(e) => navigateTo(e, '/')}
                  aria-current={currentBasePath === '/' ? 'page' : undefined}
                  className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    currentBasePath === '/'
                      ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/40'
                      : 'text-slate-100 hover:bg-slate-800/80'
                  }`}
                >
                  <span>Home</span>
                  {currentBasePath === '/' && (
                    <span className="text-xs font-mono text-cyan-300">Current</span>
                  )}
                </a>
              </li>
              {navItems.map((item) => {
                const active = isNavActive(item.path);
                return (
                  <li key={item.path}>
                    <a
                      href={hrefFor(item.path)}
                      onClick={(e) => navigateTo(e, item.path)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center justify-between min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-cyan-400/15 text-cyan-200 border border-cyan-400/40'
                          : 'text-slate-100 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{item.label}</span>
                      {active && <span className="text-xs font-mono text-cyan-300">Current</span>}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 pt-4 border-t border-slate-700/70 grid grid-cols-2 gap-2.5">
              <a
                href={hrefFor('/track')}
                onClick={(e) => navigateTo(e, '/track')}
                className="flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white text-center"
              >
                Track Order
              </a>
              <a
                href={hrefFor('/account')}
                onClick={(e) => navigateTo(e, '/account')}
                className="flex items-center justify-center min-h-[44px] px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white text-center"
              >
                Account
              </a>
            </div>
          </nav>
        )}
      </header>
    </>
  );
};

export default SiteHeader;
