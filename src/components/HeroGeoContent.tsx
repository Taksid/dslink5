import React from 'react';
import { getHeroGeoCopy } from '../lib/heroGeoCopy';
import { useGeoLanguage, useVisitorCountry, type AppLanguage } from '../lib/geoLanguage';
import { formatBdt, formatBdtBn, useCentralPricing } from '../lib/pricingConfig';
import { buildLocalePath } from '../lib/localeRouting';

interface HeroGeoContentProps {
  language?: AppLanguage;
}

/**
 * Renders the country-aware homepage hero heading, shipping description,
 * localized service line, visible liquid-glass pricing cards, and worldwide shipping note.
 * Keeps hero background, pricing cards, and CTA buttons intact while scoping geo copy solely to hero text.
 */
export const HeroGeoContent: React.FC<HeroGeoContentProps> = ({ language: propLanguage }) => {
  const { language: liveLanguage } = useGeoLanguage();
  const { countryCode } = useVisitorCountry();
  const {
    rentalKitPrice,
    standard4xPrice,
    miniKitPrice,
    standard4xBdResidentialPrice,
    miniBdResidentialPrice,
  } = useCentralPricing();

  const activeLanguage: AppLanguage = liveLanguage || propLanguage || 'en';
  const copy = getHeroGeoCopy(activeLanguage, countryCode);
  const isBangla = activeLanguage === 'bn';

  const fmt = (amount: number) => (isBangla ? formatBdtBn(amount) : formatBdt(amount));

  const rentalHref = buildLocalePath('/rental', activeLanguage);
  const stdHref = buildLocalePath('/kits/starlink-standard-4x', activeLanguage);
  const miniHref = buildLocalePath('/kits/starlink-mini-kit', activeLanguage);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const countrySim = params.get('country');
    const finalTarget =
      countrySim && !target.includes('?')
        ? `${target}?country=${encodeURIComponent(countrySim)}`
        : target;
    window.history.pushState({}, '', finalTarget);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4 flex flex-col items-center">
        <h1
          data-testid="hero-geo-heading"
          data-visitor-country={copy.order.visitorCountryCode || 'DEFAULT'}
          className={`text-[clamp(1.5rem,3.9vw+0.4rem,3.65rem)] font-bold tracking-normal text-white max-w-5xl mx-auto leading-[1.22] drop-shadow-md py-1 px-1 sm:px-2 break-words [text-wrap:balance] ${
            isBangla ? 'font-bengali' : ''
          }`}
        >
          {copy.heading}
        </h1>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        <p
          data-testid="hero-geo-description"
          className={`text-sm md:text-base text-slate-100 font-medium max-w-3xl mx-auto leading-relaxed ${
            isBangla ? 'font-bengali' : ''
          }`}
        >
          {copy.description}
        </p>

        <p
          data-testid="hero-service-line"
          className={`text-xs sm:text-sm text-white/90 font-medium max-w-2xl mx-auto leading-relaxed ${
            isBangla ? 'font-bengali' : ''
          }`}
        >
          {copy.serviceLine}
        </p>

        {/* Visible liquid-glass pricing cards (translucent backdrop showing hero background clearly) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-3xl mx-auto text-left">
          <a
            href={stdHref}
            onClick={(e) => handleLinkClick(e, stdHref)}
            className="rounded-xl border border-white/25 bg-white/15 hover:bg-white/25 backdrop-blur-md hover:border-white/50 px-3.5 py-3 transition-all duration-200 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
          >
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/80">
              {copy.standardCardTitle}
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums drop-shadow-sm">
              {fmt(standard4xBdResidentialPrice)} · {fmt(standard4xPrice)}
            </div>
            <div className="text-[11px] text-white/80 mt-0.5">
              BD Residential · Roam Unlimited
            </div>
          </a>

          <a
            href={miniHref}
            onClick={(e) => handleLinkClick(e, miniHref)}
            className="rounded-xl border border-white/25 bg-white/15 hover:bg-white/25 backdrop-blur-md hover:border-white/50 px-3.5 py-3 transition-all duration-200 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
          >
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/80">
              {copy.miniCardTitle}
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums drop-shadow-sm">
              {fmt(miniBdResidentialPrice)} · {fmt(miniKitPrice)}
            </div>
            <div className="text-[11px] text-white/80 mt-0.5">
              BD Residential · Global Roam
            </div>
          </a>

          <a
            href={rentalHref}
            onClick={(e) => handleLinkClick(e, rentalHref)}
            className="rounded-xl border border-white/25 bg-white/15 hover:bg-white/25 backdrop-blur-md hover:border-white/50 px-3.5 py-3 transition-all duration-200 flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
          >
            <div className="text-[11px] font-mono uppercase tracking-wider text-white/80">
              Standard 4X Rental
            </div>
            <div className="text-sm sm:text-base font-bold text-white mt-1 font-mono tabular-nums drop-shadow-sm">
              {fmt(rentalKitPrice)} One-Time
            </div>
            <div className="text-[11px] text-white/80 mt-0.5">
              Fixed BD Residential · Monthly Separate
            </div>
          </a>
        </div>
      </div>
    </>
  );
};

export const HeroWorldwideNote: React.FC<HeroGeoContentProps> = ({ language: propLanguage }) => {
  const { language: liveLanguage } = useGeoLanguage();
  const { countryCode } = useVisitorCountry();

  const activeLanguage: AppLanguage = liveLanguage || propLanguage || 'en';
  const copy = getHeroGeoCopy(activeLanguage, countryCode);
  const isBangla = activeLanguage === 'bn';

  const legalHref = buildLocalePath('/Legal', activeLanguage);
  const supportHref = buildLocalePath('/support', activeLanguage);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const countrySim = params.get('country');
    const finalTarget =
      countrySim && !target.includes('?')
        ? `${target}?country=${encodeURIComponent(countrySim)}`
        : target;
    window.history.pushState({}, '', finalTarget);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo(0, 0);
  };

  return (
    <p
      data-testid="hero-worldwide-note"
      className={`text-xs text-neutral-200 max-w-3xl mx-auto leading-relaxed pt-2 relative z-50 ${
        isBangla ? 'font-bengali' : ''
      }`}
    >
      {copy.worldwideNote}{' '}
      <a
        href={legalHref}
        onClick={(e) => handleLinkClick(e, legalHref)}
        className="text-white underline underline-offset-4 hover:text-neutral-200"
      >
        {copy.legalLabel}
      </a>
      {' · '}
      <a
        href={supportHref}
        onClick={(e) => handleLinkClick(e, supportHref)}
        className="text-white underline underline-offset-4 hover:text-neutral-200"
      >
        {copy.supportLabel}
      </a>
    </p>
  );
};

export default HeroGeoContent;
