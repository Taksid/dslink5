import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';

export interface FaqSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalCount: number;
  resultCount: number;
  placeholder?: string;
  suggestions?: Array<{ labelBn: string; labelMy: string; labelEn: string; keyword: string }>;
  inputId?: string;
  className?: string;
}

export const DEFAULT_FAQ_SUGGESTIONS: NonNullable<FaqSearchBarProps['suggestions']> = [
  { labelBn: '5TB লিমিট', labelMy: '5TB ကန့်သတ်ချက်', labelEn: '5TB', keyword: '5TB' },
  { labelBn: 'Bangla QR', labelMy: 'Bangla QR', labelEn: 'Bangla QR', keyword: 'Bangla QR' },
  { labelBn: 'নিবন্ধিত ঠিকানা', labelMy: 'မှတ်ပုံတင်လိပ်စာ', labelEn: 'Address', keyword: 'address' },
  { labelBn: 'রোমিং', labelMy: 'Roaming', labelEn: 'Roaming', keyword: 'Roaming' },
  { labelBn: 'রেন্টাল ৳৩,০০০', labelMy: 'Rental ৳3,000', labelEn: 'Rental ৳3,000', keyword: '3,000' },
  { labelBn: 'COD', labelMy: 'COD', labelEn: 'COD', keyword: 'COD' },
];

/**
 * Multi-keyword real-time FAQ matcher.
 * Every whitespace-separated token must match at least one of the provided text fields.
 */
export function matchesFaqKeywords(query: string, fields: Array<string | undefined | null>): boolean {
  const tokens = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const combined = fields
    .filter((f): f is string => typeof f === 'string' && f.length > 0)
    .join(' ')
    .toLowerCase();

  return tokens.every((token) => combined.includes(token));
}

/**
 * Safely highlights matched search keywords inside text using pure React nodes.
 */
export function highlightFaqText(text: string, query: string): React.ReactNode {
  const tokens = query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return text;

  const escaped = tokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    const isMatch = tokens.some((t) => part.toLowerCase() === t.toLowerCase());
    return isMatch ? (
      <mark
        key={i}
        className="bg-white/25 text-white rounded-[2px] px-0.5 font-semibold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    );
  });
}

export const FaqSearchBar: React.FC<FaqSearchBarProps> = ({
  value,
  onChange,
  totalCount,
  resultCount,
  placeholder,
  suggestions = DEFAULT_FAQ_SUGGESTIONS,
  inputId = 'faq-search-input',
  className = '',
}) => {
  const { language, t3 } = useGeoLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasQuery = value.trim().length > 0;

  const resolvedPlaceholder =
    placeholder ||
    t3(
      'কীওয়ার্ড দিয়ে প্রশ্ন খুঁজুন (যেমন: 5TB, Bangla QR, ঠিকানা, Roaming, COD)...',
      'စကားလုံးဖြင့် မေးခွန်းရှာဖွေရန် (ဥပမာ: 5TB, Bangla QR, လိပ်စာ, COD)...',
      'Search FAQs by keyword (e.g. 5TB, Bangla QR, address, Roaming, COD)...'
    );

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
    <div className={`w-full space-y-2.5 ${className}`} role="search">
      <label htmlFor={inputId} className="sr-only">
        {t3('সচরাচর জিজ্ঞাসিত প্রশ্ন খুঁজুন', 'မေးခွန်းများ ရှာဖွေရန်', 'Search frequently asked questions')}
      </label>

      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        />

        <input
          ref={inputRef}
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={resolvedPlaceholder}
          autoComplete="off"
          className="w-full pl-10 pr-24 py-3 rounded-[4px] bg-[#111113] border border-white/15 text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/60 transition-colors min-h-[44px]"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {hasQuery && (
            <>
              <span
                aria-live="polite"
                className="text-[11px] font-mono text-neutral-400 tabular-nums px-1.5 select-none"
              >
                {resultCount}/{totalCount}
              </span>
              <button
                type="button"
                onClick={handleClear}
                aria-label={t3('সার্চ মুছুন', 'ရှာဖွေမှု ရှင်းရန်', 'Clear search')}
                className="p-1.5 rounded-[3px] text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Quick Keyword Filters + Live Status */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {suggestions.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-neutral-500 mr-0.5">
              {t3('জনপ্রিয়:', 'အမြန်ရှာရန်:', 'Quick filter:')}
            </span>
            {suggestions.map((item) => {
              const label =
                language === 'my'
                  ? item.labelMy
                  : language === 'en'
                  ? item.labelEn
                  : item.labelBn;
              const isSelected = value.trim().toLowerCase() === item.keyword.toLowerCase();
              return (
                <button
                  key={item.keyword}
                  type="button"
                  onClick={() => onChange(isSelected ? '' : item.keyword)}
                  className={`px-2 py-1 rounded-[3px] text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-black border-white font-semibold'
                      : 'bg-white/[0.04] text-neutral-300 border-white/15 hover:border-white/35 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {hasQuery && (
          <div aria-live="polite" className="text-[11px] text-neutral-400 font-mono">
            {resultCount === 0
              ? t3('কোনো প্রশ্ন পাওয়া যায়নি', 'မေးခွန်း မတွေ့ပါ', 'No matching questions')
              : t3(
                  `${resultCount}টি প্রশ্ন পাওয়া গেছে`,
                  `မေးခွန်း ${resultCount} ခု တွေ့ရှိသည်`,
                  `${resultCount} matching ${resultCount === 1 ? 'question' : 'questions'}`
                )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaqSearchBar;
