import React from 'react';
import { ExternalLink, MapPin, ShieldCheck } from 'lucide-react';
import { useGeoLanguage } from '../lib/geoLanguage';
import { ResponsiveMarketingImage } from './ResponsiveMarketingImage';

export const AboutCompanySection: React.FC = () => {
  const { t, t3 } = useGeoLanguage();

  return (
    <section
      id="about-dev-spark-soft"
      aria-labelledby="about-devspark-heading"
      className="pt-4"
    >
      <div className="rounded-[4px] border border-white/15 bg-[#0b0b0e] overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-400">
              {t3(
                'অপারেটিং কোম্পানি · বাংলাদেশ',
                'လည်ပတ်ဆောင်ရွက်သော ကုမ္ပဏီ · ဘင်္ဂလားဒေ့ရှ်',
                'OPERATING COMPANY · BANGLADESH'
              )}
            </div>

            <h2
              id="about-devspark-heading"
              className="text-2xl sm:text-3xl font-bold text-white tracking-tight text-balance"
            >
              {t('company.aboutHeading', 'About Dev Spark Soft Limited')}
            </h2>

            <p className="text-sm sm:text-base text-neutral-200 leading-relaxed">
              {t(
                'company.aboutDescription',
                'Dev Spark Soft Limited operates DSLink, a Bangladesh-based business offering Starlink kits and customer support.'
              )}
            </p>

            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {t3(
                'ঢাকা, বাংলাদেশ থেকে পরিচালিত Dev Spark Soft Limited সফটওয়্যার ও ডিজিটাল টেকনোলজি সল্যুশন এবং DSLink-এর মাধ্যমে স্টারলিংক হার্ডওয়্যার কিট, রেন্টাল, ২৪ মাসের রিপ্লেসমেন্ট ওয়ারেন্টি ও সার্বক্ষণিক কাস্টমার সাপোর্ট প্রদান করে।',
                'ဒါကာ၊ ဘင်္ဂလားဒေ့ရှ်အခြေစိုက် Dev Spark Soft Limited သည် ဆော့ဖ်ဝဲနည်းပညာဝန်ဆောင်မှုများနှင့် DSLink မှတဆင့် Starlink စက်ပစ္စည်းများ၊ ၂၄ လ အစားထိုးအာမခံနှင့် ဖောက်သည်ဝန်ဆောင်မှုများကို ပံ့ပိုးပေးပါသည်။',
                'Headquartered in Dhaka, Bangladesh, Dev Spark Soft Limited delivers technology solutions alongside DSLink Starlink hardware sales, rentals, 24-month store replacement warranty, and dedicated technical support.'
              )}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </span>
              <span aria-hidden="true" className="text-neutral-600">
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                <span>Trade License: DNCC/037306</span>
              </span>
              <span aria-hidden="true" className="text-neutral-600">
                ·
              </span>
              <span className="font-mono">Alaska Entity #10237739</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="https://devsparksoft.com.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[4px] bg-white hover:bg-neutral-200 text-black text-xs sm:text-sm font-bold transition-colors whitespace-nowrap"
            >
              <span>{t('company.visitButton', 'Visit Dev Spark Soft Limited')}</span>
              <ExternalLink className="w-4 h-4 shrink-0" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-6 relative aspect-[16/9] lg:aspect-auto lg:min-h-[320px] bg-neutral-950 overflow-hidden">
          <ResponsiveMarketingImage
            mediaKey="coastal-community-support"
            sizes="(max-width: 1024px) 100vw, 600px"
            imgClassName="lg:h-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </div>
      </div>
    </section>
  );
};

export default AboutCompanySection;
