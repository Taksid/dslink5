import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { LegalPolicyDocument } from '../data/legalPolicies';
import { useGeoLanguage } from '../lib/geoLanguage';

export interface LegalPolicySearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  resultCount: number;
  controlsId?: string;
  inputId?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

interface QuickFilterChip {
  labelBn: string;
  labelMy: string;
  labelEn: string;
  keyword: string;
}

const LEGAL_QUICK_FILTERS: QuickFilterChip[] = [
  { labelBn: '5TB লিমিট', labelMy: '5TB ကန့်သတ်ချက်', labelEn: '5TB', keyword: '5TB' },
  { labelBn: 'Bangla QR', labelMy: 'Bangla QR', labelEn: 'Bangla QR', keyword: 'Bangla QR' },
  { labelBn: 'শিপিং', labelMy: 'ပို့ဆောင်ရေး', labelEn: 'Shipping', keyword: 'shipping' },
  { labelBn: 'লোকেশন', labelMy: 'တည်နေရာ', labelEn: 'Location', keyword: 'location' },
  { labelBn: 'রিটার্ন / ফেরত', labelMy: 'ပြန်အပ်ခြင်း', labelEn: 'Return', keyword: 'return' },
  { labelBn: 'প্রাইভেসি', labelMy: 'ကိုယ်ရေးလုံခြုံမှု', labelEn: 'Privacy', keyword: 'privacy' },
];

/**
 * Builds a complete lowercase searchable corpus for a policy document
 * covering all three supported languages (bn, my, en), metadata, sections, and conditions.
 */
function buildPolicySearchHaystack(policy: LegalPolicyDocument): string {
  const parts: string[] = [
    policy.slug,
    policy.path,
    policy.titleBn,
    policy.titleMy,
    policy.titleEn,
    policy.shortDescBn,
    policy.shortDescMy,
    policy.shortDescEn,
    policy.introBn,
    policy.introMy,
    policy.introEn,
    ...policy.conditionsBn,
    ...policy.conditionsMy,
    ...policy.conditionsEn,
    ...policy.sections.flatMap((section) => [
      section.headingBn,
      section.headingMy,
      section.headingEn,
      ...(section.paragraphsBn || []),
      ...(section.paragraphsMy || []),
      ...(section.paragraphsEn || []),
      ...(section.bulletsBn || []),
      ...(section.bulletsMy || []),
      ...(section.bulletsEn || []),
    ]),
  ];

  return parts.join(' ').toLowerCase();
}

/**
 * Live multi-keyword matcher: every whitespace-separated token in the query
 * must match somewhere in the policy card's multilingual content.
 */
export function matchesLegalPolicyQuery(
  policy: LegalPolicyDocument,
  query: string
): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (tokens.length === 0) return true;

  const haystack = buildPolicySearchHaystack(policy);
  return tokens.every((token) => haystack.includes(token));
}

/**
 * Safely highlights matched search tokens inside policy card titles & descriptions.
 */
export function highlightPolicyText(text: string, query: string): React.ReactNode {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((token) => token.length >= 2);

  if (tokens.length === 0) return text;

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    const isMatch = tokens.some((t) => part.toLowerCase() === t.toLowerCase());
    return isMatch ? (
      <mark
        key={idx}
        className="bg-white/25 text-white rounded-[2px] px-0.5 font-semibold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    );
  });
}

export const LegalPolicySearchBar: React.FC<LegalPolicySearchBarProps> = ({
  value,
  onChange,
  totalCount,
  resultCount,
  controlsId = 'legal-policy-grid',
  inputId = 'legal-policy-search',
  inputRef: externalInputRef,
}) => {
  const { language, t3 } = useGeoLanguage();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;

  const hasQuery = value.trim().length > 0;
  const hiddenCount = Math.max(0, totalCount - resultCount);

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && hasQuery) {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="pt-2 max-w-2xl space-y-2.5" role="search">
      <label htmlFor={inputId} className="sr-only">
        {t3('নীতিমালা খুঁজুন', 'မူဝါဒ ရှာဖွေရန်', 'Filter legal policies')}
      </label>

      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="w-4 h-4 text-slate-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        />

        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-controls={controlsId}
          autoComplete="off"
          spellCheck={false}
          placeholder={t3(
            'নীতিমালা ফিল্টার করুন (যেমন: 5TB, Bangla QR, শিপিং, লোকেশন, রিটার্ন...)',
            'မူဝါဒ စစ်ထုတ်ရန် (ဥပမာ: 5TB, Bangla QR, ပို့ဆောင်ခ, လိပ်စာ...)',
            'Filter policies live (e.g. 5TB, Bangla QR, shipping, location, return...)'
          )}
          className="w-full pl-10 pr-24 py-3 rounded-lg bg-[#0b0f17] border border-slate-600/80 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors min-h-[46px] [&::-webkit-search-cancel-button]:hidden"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {hasQuery && (
            <>
              <span
                aria-live="polite"
                className="text-xs font-mono text-slate-300 tabular-nums px-1.5 select-none"
              >
                {resultCount}/{totalCount}
              </span>
              <button
                type="button"
                onClick={handleClear}
                aria-label={t3('সার্চ মুছুন', 'ရှာဖွေမှု ရှင်းရန်', 'Clear policy filter')}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Keyword Filters & Live Filter Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-mono text-slate-300 mr-0.5">
            {t3('দ্রুত ফিল্টার:', 'အမြန်စစ်ထုတ်ရန်:', 'Quick filter:')}
          </span>
          {LEGAL_QUICK_FILTERS.map((chip) => {
            const label =
              language === 'my'
                ? chip.labelMy
                : language === 'en'
                ? chip.labelEn
                : chip.labelBn;
            const isSelected = value.trim().toLowerCase() === chip.keyword.toLowerCase();

            return (
              <button
                key={chip.keyword}
                type="button"
                onClick={() => onChange(isSelected ? '' : chip.keyword)}
                aria-pressed={isSelected}
                className={`px-2.5 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap min-h-[34px] ${
                  isSelected
                    ? 'bg-cyan-400 text-[#04131a] border-cyan-300 font-bold'
                    : 'bg-white/[0.06] text-slate-200 border-slate-600/80 hover:border-cyan-400/60 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="text-xs font-mono text-slate-300">
          {hasQuery ? (
            resultCount === 0 ? (
              t3('কোনো নীতিমালা মেলেনি', 'ကိုက်ညီသော မူဝါဒ မတွေ့ပါ', 'No matching policies')
            ) : (
              t3(
                `${totalCount}টির মধ্যে ${resultCount}টি নীতিমালা দেখানো হচ্ছে (${hiddenCount}টি লুকানো)`,
                `မူဝါဒ ${totalCount} ခုအနက် ${resultCount} ခု ပြသနေသည်`,
                `Showing ${resultCount} of ${totalCount} ${resultCount === 1 ? 'policy' : 'policies'}`
              )
            )
          ) : (
            t3(
              `মোট ${totalCount}টি নীতিমালা`,
              `စုစုပေါင်း မူဝါဒ ${totalCount} ခု`,
              `${totalCount} policies available`
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default LegalPolicySearchBar;
