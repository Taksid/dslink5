import React, { useEffect, useMemo } from 'react';
import {
  buildFaqPageJsonLd,
  type LocalizedFaqEntry,
} from '../data/rentalFaqData';

export interface FaqJsonLdProps {
  items: LocalizedFaqEntry[];
  inLanguage?: string;
  pageUrl?: string;
  scriptId?: string;
}

/**
 * Safely serializes JSON-LD so `</script>` sequences can never break HTML parsing.
 */
function serializeJsonLd(data: Record<string, any>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Renders Google-compliant Schema.org FAQPage JSON-LD structured data with
 * individual Question/Answer entities (`@id`, `url` anchors, `position`, `about`,
 * `answerCount`, `inLanguage`, and `acceptedAnswer`) directly inside FAQ components,
 * while deduplicating any stale head-injected FAQPage script on hydration.
 */
export const FaqJsonLd: React.FC<FaqJsonLdProps> = ({
  items,
  inLanguage,
  pageUrl,
  scriptId = 'faq-page-jsonld',
}) => {
  const jsonLdString = useMemo(() => {
    if (!items || items.length === 0) return '';
    const resolvedUrl =
      pageUrl ||
      (typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}`
        : undefined);

    const schema = buildFaqPageJsonLd(items, {
      inLanguage,
      pageUrl: resolvedUrl,
    });
    return serializeJsonLd(schema);
  }, [items, inLanguage, pageUrl]);

  // Prevent Google Rich Results "Duplicate FAQPage" warnings by removing stale head-level FAQPage scripts once hydrated
  useEffect(() => {
    if (!jsonLdString || typeof document === 'undefined') return;
    const scripts = document.querySelectorAll('head script[type="application/ld+json"]');
    scripts.forEach((script) => {
      if (script.id === scriptId) return;
      try {
        const parsed = JSON.parse(script.textContent || '');
        if (parsed && parsed['@type'] === 'FAQPage') {
          script.remove();
        }
      } catch {
        // Ignore non-JSON or unrelated scripts
      }
    });
  }, [jsonLdString, scriptId]);

  if (!jsonLdString) return null;

  return (
    <script
      id={scriptId}
      type="application/ld+json"
      data-faq-schema="true"
      dangerouslySetInnerHTML={{ __html: jsonLdString }}
    />
  );
};

export default FaqJsonLd;
