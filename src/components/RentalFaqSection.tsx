import React, { useMemo, useState } from 'react';
import { ChevronDown, ArrowRight, Phone } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';
import { getLocaleSeoMeta } from '../lib/multilingualSeo';
import {
  RENTAL_FAQ_ITEMS,
  getLocalizedFaqEntries,
  type RentalFaqCategory,
  type RentalFaqItem,
} from '../data/rentalFaqData';
import { FaqJsonLd } from './FaqJsonLd';
import {
  FaqSearchBar,
  highlightFaqText,
  matchesFaqKeywords,
} from './FaqSearchBar';
import { formatBdt, formatBdtBn, useCentralPricing } from '../lib/pricingConfig';

export { RENTAL_FAQ_ITEMS, type RentalFaqCategory, type RentalFaqItem };

interface RentalFaqSectionProps {
  id?: string;
  showSearch?: boolean;
  className?: string;
}

export const RentalFaqSection: React.FC<RentalFaqSectionProps> = ({
  id = 'rental-faq',
  showSearch = true,
  className = '',
}) => {
  const { language, t3 } = useGeoLanguage();
  const { rentalKitPrice } = useCentralPricing();
  const [selectedCategory, setSelectedCategory] = useState<RentalFaqCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    'usage-limit-5tb': true,
  });

  const categories: { id: RentalFaqCategory; label: string }[] = [
    {
      id: 'all',
      label: t3('সকল প্রশ্ন (৯)', 'အားလုံး (၉)', 'All Topics (9)'),
    },
    {
      id: '5tb_limit',
      label: t3('৫ টিবি ব্যবহার সীমা', '5 TB ကန့်သတ်ချက်', '5TB Usage Limit'),
    },
    {
      id: 'address',
      label: t3('রেজিস্ট্রেশন ঠিকানা', 'မှတ်ပုံတင်လိပ်စာ', 'Registration Address'),
    },
    {
      id: 'payment',
      label: t3('সাবস্ক্রিপশন ও পেমেন্ট', 'လစဉ်ကြေးနှင့် ငွေပေးချေမှု', 'Subscription & Payment'),
    },
  ];

  const getLocalizedItem = (item: RentalFaqItem) => {
    const categoryLabel =
      language === 'en'
        ? item.categoryEn
        : language === 'my'
          ? item.categoryMy
          : item.categoryBn;
    const question =
      language === 'en' ? item.qEn : language === 'my' ? item.qMy : item.qBn;
    const answer =
      language === 'en' ? item.aEn : language === 'my' ? item.aMy : item.aBn;
    return { categoryLabel, question, answer };
  };

  const filteredItems = useMemo(() => {
    return RENTAL_FAQ_ITEMS.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      return matchesFaqKeywords(searchQuery, [
        item.qEn,
        item.aEn,
        item.categoryEn,
        item.qBn,
        item.aBn,
        item.categoryBn,
        item.qMy,
        item.aMy,
        item.categoryMy,
      ]);
    });
  }, [selectedCategory, searchQuery]);

  const schemaItems = useMemo(
    () => getLocalizedFaqEntries(RENTAL_FAQ_ITEMS, language),
    [language]
  );

  const toggleItem = (itemId: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`py-16 md:py-20 bg-black border-t border-white/10 text-white ${className}`}
    >
      <FaqJsonLd
        scriptId={`${id}-jsonld`}
        items={schemaItems}
        inLanguage={getLocaleSeoMeta(language).inLanguage}
      />
      <div className="max-w-5xl mx-auto px-4 md:px-8 space-y-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              {t3(
                'রেন্টাল ও ব্যবহার নীতিমালা · সচরাচর জিজ্ঞাসিত প্রশ্ন',
                'ငှားရမ်းခြင်းနှင့် အသုံးပြုမှု မေးခွန်းများ',
                'Rental Policy & Billing · Frequently Asked Questions'
              )}
            </div>
            <h2
              id={`${id}-heading`}
              className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white [text-wrap:balance]"
            >
              {t3(
                '৫ টিবি ডেটা লিমিট, নিবন্ধিত ঠিকানা ও সাবস্ক্রিপশন পেমেন্ট জিজ্ঞাসা',
                '5 TB ကန့်သတ်ချက်၊ လိပ်စာနှင့် လစဉ်ကြေး ပေးချေမှု မေးခွန်းများ',
                '5TB Usage Limit, Registration Address & Subscription Payment FAQ'
              )}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {t3(
                `Starlink Rental Kit (${formatBdtBn(rentalKitPrice)} এককালীন চার্জ)-এর মাসিক 5 TB সীমা, প্রথম নিবন্ধিত লোকেশন, একবার অ্যাড্রেস পরিবর্তন এবং QR পেমেন্ট ও আলাদা মাসিক সাবস্ক্রিপশন প্রক্রিয়ার সব উত্তর।`,
                `Starlink Rental Kit (${formatBdt(rentalKitPrice)} One-Time Charge) ၏ 5 TB ကန့်သတ်ချက်၊ မှတ်ပုံတင်လိပ်စာ စည်းကမ်းများနှင့် QR ငွေပေးချေမှုအတွက် အသေးစိတ်အဖြေများ။`,
                `Clear answers on the Starlink Rental Kit (${formatBdt(rentalKitPrice)} One-Time Charge), monthly 5 TB cap, first registered residential address lock, 1-time address change, and separate monthly subscription billing.`
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="/rental"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] bg-white text-black hover:bg-neutral-200 font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {t3(
                  `রেন্টাল কিট অর্ডার (${formatBdtBn(rentalKitPrice)})`,
                  `Rental Kit အော်ဒါ (${formatBdt(rentalKitPrice)})`,
                  `Order Rental Kit (${formatBdt(rentalKitPrice)})`
                )}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <a
              href="/rental-policy"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[4px] border border-white/25 hover:bg-white/10 text-white font-medium text-xs transition-colors whitespace-nowrap shrink-0"
            >
              <span>{t3('রেন্টাল পলিসি', 'ငှားရမ်းခြင်း မူဝါဒ', 'Full Policy')}</span>
            </a>
          </div>
        </div>

        {/* Real-Time FAQ Search Bar + Category Tabs */}
        <div className="space-y-4">
          {showSearch && (
            <FaqSearchBar
              inputId={`${id}-search`}
              value={searchQuery}
              onChange={setSearchQuery}
              totalCount={RENTAL_FAQ_ITEMS.length}
              resultCount={filteredItems.length}
            />
          )}

          <div
            role="tablist"
            aria-label={t3('FAQ ক্যাটাগরি ফিল্টার', 'FAQ အမျိုးအစား', 'FAQ Category Filter')}
            className="flex flex-wrap items-center gap-1.5 p-1 bg-[#111113] border border-white/15 rounded-[4px]"
          >
            {categories.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-2 text-xs font-medium rounded-[3px] transition-colors cursor-pointer whitespace-nowrap shrink-0 min-h-[36px] ${
                    active
                      ? 'bg-white text-black font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion List */}
        {filteredItems.length === 0 ? (
          <div className="p-8 rounded-[4px] bg-[#0a0a0a] border border-white/15 text-center space-y-3">
            <p className="text-sm text-neutral-300">
              {t3(
                'আপনার সার্চের সাথে মিল রেখে কোনো প্রশ্ন পাওয়া যায়নি।',
                'သင့်ရှာဖွေမှုနှင့် ကိုက်ညီသော မေးခွန်း မတွေ့ပါ။',
                'No matching questions found for your search.'
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 rounded-[4px] bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
            >
              {t3('সব প্রশ্ন দেখান', 'အားလုံးပြန်ပြပါ', 'Reset Filter')}
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10 border border-white/15 rounded-[4px] bg-[#0a0a0a] overflow-hidden">
            {filteredItems.map((item, idx) => {
              const { categoryLabel, question, answer } = getLocalizedItem(item);
              const hasSearch = searchQuery.trim().length > 0;
              const isOpen = hasSearch ? true : !!openIds[item.id];
              const panelId = `${id}-panel-${item.id}`;
              const btnId = `${id}-btn-${item.id}`;
              const numLabel = String(idx + 1).padStart(2, '0');

              return (
                <div
                  key={item.id}
                  id={`faq-${item.id}`}
                  className="bg-[#0a0a0a] transition-colors scroll-mt-24"
                >
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                    className="w-full px-5 sm:px-6 py-4 sm:py-5 text-left flex items-start justify-between gap-4 hover:bg-[#111113] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/80 transition-colors cursor-pointer min-h-[52px]"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400 uppercase tracking-wider tabular-nums">
                        <span>{numLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span>{categoryLabel}</span>
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-white leading-snug">
                        {highlightFaqText(question, searchQuery)}
                      </h3>
                    </div>

                    <ChevronDown
                      aria-hidden="true"
                      className={`w-4 h-4 text-neutral-300 shrink-0 mt-1 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      className="px-5 sm:px-6 pb-5 pt-1 bg-[#111113] border-t border-white/10 text-xs sm:text-sm text-neutral-300 leading-relaxed"
                    >
                      <p className="pt-2.5 max-w-4xl">{highlightFaqText(answer, searchQuery)}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quiet Bottom Help Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 text-xs text-neutral-400">
          <span>
            {t3(
              'আরও বিস্তারিত জানতে আমাদের সাপোর্ট টিমে সরাসরি যোগাযোগ করুন — ০১৩২৬-৩৭০২১৮',
              'အသေးစိတ်သိရှိလိုပါက +880 1326-370218 သို့ ဆက်သွယ်မေးမြန်းနိုင်ပါသည်။',
              'Need help verifying your installation address or Bangla QR TrxID? Call or message +880 1326-370218.'
            )}
          </span>
          <a
            href="https://wa.me/8801326370218"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-white hover:underline font-medium whitespace-nowrap shrink-0"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t3('হোয়াটসঅ্যাপ সাপোর্ট', 'WhatsApp ဆက်သွယ်ရန်', 'WhatsApp Support')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default RentalFaqSection;
