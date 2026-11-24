import React, { useState } from 'react';
import {
  MARKETING_MEDIA,
  MarketingImageKey,
  buildSrcSet,
  getLocalizedMediaText,
} from '../lib/marketingMedia';
import { useGeoLanguage } from '../lib/geoLanguage';

interface ResponsiveMarketingImageProps {
  mediaKey: MarketingImageKey;
  /** Set true for purely decorative backgrounds so alt="" is emitted */
  decorative?: boolean;
  /** Override localized alt text if a placement needs custom copy */
  altOverride?: string;
  /** Responsive sizes attribute for browser image selection */
  sizes?: string;
  /** Eager load with high fetch priority for above-the-fold images */
  priority?: boolean;
  /** Additional classes for the <img> element */
  imgClassName?: string;
  /** Additional classes for the <picture> wrapper */
  className?: string;
  /** Override object-position classes */
  objectPositionClass?: string;
}

export const ResponsiveMarketingImage: React.FC<ResponsiveMarketingImageProps> = ({
  mediaKey,
  decorative = false,
  altOverride,
  sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 420px',
  priority = false,
  imgClassName = '',
  className = '',
  objectPositionClass,
}) => {
  const { language } = useGeoLanguage();
  const [failed, setFailed] = useState(false);
  const asset = MARKETING_MEDIA[mediaKey];

  const altText = decorative
    ? ''
    : altOverride ?? getLocalizedMediaText(asset.alt, language);

  if (failed) {
    return (
      <div
        role={decorative ? undefined : 'img'}
        aria-label={decorative ? undefined : altText}
        className={`w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-950 to-black flex items-center justify-center ${className}`}
      />
    );
  }

  return (
    <picture className={`block w-full h-full ${className}`}>
      <source
        type="image/avif"
        srcSet={buildSrcSet(asset.basePath, asset.widths, 'avif')}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={buildSrcSet(asset.basePath, asset.widths, 'webp')}
        sizes={sizes}
      />
      <img
        src={asset.fallbackSrc}
        alt={altText}
        width={asset.width}
        height={asset.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${
          objectPositionClass || asset.objectPositionClass
        } ${imgClassName}`}
      />
    </picture>
  );
};

/**
 * Dedicated homepage Hero background <picture>:
 * - Desktop (md+): Full-bleed 16:9 Dhaka twilight rooftop showcase behind the hero.
 * - Mobile / PWA (< md): Soft ambient twilight backdrop behind the translucent glass cards,
 *   paired with <HeroMobileCoverBanner /> above the hero text so all 3 Starlink dishes,
 *   team, and skyline remain 100% visible without awkward vertical face cropping.
 */
export const HeroMarketingPicture: React.FC = () => {
  const asset = MARKETING_MEDIA['dhaka-rooftop-hero'];

  return (
    <picture className="block w-full h-full">
      <source
        type="image/avif"
        srcSet={buildSrcSet(asset.basePath, asset.widths, 'avif')}
        sizes="100vw"
      />
      <source
        type="image/webp"
        srcSet={buildSrcSet(asset.basePath, asset.widths, 'webp')}
        sizes="100vw"
      />
      <img
        src={asset.fallbackSrc}
        alt=""
        aria-hidden="true"
        width={asset.width}
        height={asset.height}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        className="w-full h-full object-cover object-center opacity-50 blur-[6px] scale-110 md:opacity-100 md:blur-0 md:scale-100 md:object-[55%_42%]"
      />
    </picture>
  );
};

const MOBILE_PWA_HERO_SLIDES = [
  'https://i.ibb.co.com/mCMtyFPR/7fb3e93a-d45f-4c2c-bdf5-75caf4b879ac.png',
  'https://i.ibb.co.com/9mbX7bW1/354c90c4-60ee-4e77-a168-a7f220ee9777.png',
  'https://i.ibb.co.com/B5VFF6CW/878dda45-f7c0-4551-b4d6-b353d44cb7d5.png',
  'https://i.ibb.co.com/prfg2VTg/6cb795b5-d786-43b6-8efc-e74feabc6437.png',
  'https://i.ibb.co.com/v6nFZ5fF/e4636415-52e1-4245-b4f9-ad3e9449f866.png',
  'https://i.ibb.co.com/zTKTZ7Nz/c31fd7a4-10d9-44fd-a885-60e53728851a.png',
] as const;

/**
 * Uncropped 16:9 mobile & PWA auto-running hero cover carousel (hidden on PC/desktop md+).
 * Cycles smoothly through all 6 16:9 showcase images (1672x941) with swipe support
 * and graceful local fallback, while desktop stays normal full-bleed hero.
 */
export const HeroMobileCoverBanner: React.FC = () => {
  const { language } = useGeoLanguage();
  const asset = MARKETING_MEDIA['dhaka-rooftop-hero'];
  const altText = getLocalizedMediaText(asset.alt, language);
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedSlides, setFailedSlides] = useState<Record<number, boolean>>({});
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % MOBILE_PWA_HERO_SLIDES.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 36) return;
    setActiveIndex((prev) =>
      delta < 0
        ? (prev + 1) % MOBILE_PWA_HERO_SLIDES.length
        : (prev - 1 + MOBILE_PWA_HERO_SLIDES.length) % MOBILE_PWA_HERO_SLIDES.length
    );
  };

  return (
    <div
      data-testid="hero-mobile-cover"
      className="md:hidden relative w-full z-20 overflow-hidden bg-slate-950 select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-slate-950">
        {MOBILE_PWA_HERO_SLIDES.map((src, idx) => {
          const isCurrent = idx === activeIndex;
          const imgSrc = failedSlides[idx] ? asset.fallbackSrc : src;
          return (
            <img
              key={src}
              src={imgSrc}
              alt={isCurrent ? altText : ''}
              aria-hidden={!isCurrent}
              width={1672}
              height={941}
              loading={idx <= 1 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={idx === 0 ? 'high' : 'auto'}
              onError={() =>
                setFailedSlides((prev) => (prev[idx] ? prev : { ...prev, [idx]: true }))
              }
              className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${
                isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            />
          );
        })}

        {/* Smooth bottom blend into hero content */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 z-20 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent"
        />

        {/* Compact slide progress bar */}
        <div
          role="tablist"
          aria-label="Hero showcase slides"
          className="absolute bottom-2.5 inset-x-0 z-30 flex items-center justify-center gap-1.5 px-4"
        >
          {MOBILE_PWA_HERO_SLIDES.map((src, idx) => {
            const isCurrent = idx === activeIndex;
            return (
              <button
                key={src}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={`Slide ${idx + 1} of ${MOBILE_PWA_HERO_SLIDES.length}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isCurrent
                    ? 'w-6 bg-white shadow-[0_0_8px_rgba(255,255,255,0.65)]'
                    : 'w-1.5 bg-white/40 hover:bg-white/65'
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveMarketingImage;
