import React from 'react';
import { Truck, AlertTriangle } from 'lucide-react';
import { getCompactShippingNotice, INTERNATIONAL_SHIPPING_FEE_BDT } from '../lib/shippingConfig';
import { useGlobalCurrency } from '../lib/currencyConfig';

interface CompactShippingNoticeProps {
  countryCode: string;
  isRental?: boolean;
  onInquiryClick?: () => void;
  className?: string;
}

/**
 * Compact checkout shipping notice placed directly below the delivery country selector.
 * Small readable font, automatic wrapping, no fixed positioning, never overlaps checkout buttons.
 */
export const CompactShippingNotice: React.FC<CompactShippingNoticeProps> = ({
  countryCode,
  isRental = false,
  onInquiryClick,
  className = '',
}) => {
  const { currency, formatPrice } = useGlobalCurrency();
  const formattedIntlFee =
    currency === 'BDT'
      ? `৳${INTERNATIONAL_SHIPPING_FEE_BDT.toLocaleString('en-US')}`
      : `৳${INTERNATIONAL_SHIPPING_FEE_BDT.toLocaleString('en-US')} (${formatPrice(INTERNATIONAL_SHIPPING_FEE_BDT, { includeEstimateLabel: true })})`;

  const notice = getCompactShippingNotice(countryCode, formattedIntlFee);

  if (notice.mode === 'inquiry') {
    return (
      <div
        role="status"
        className={`mt-2 rounded-[4px] border border-amber-500/35 bg-amber-950/20 px-3 py-2 text-xs text-amber-200 leading-relaxed break-words ${className}`}
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
          <div className="min-w-0 space-y-1">
            <p className="font-medium text-amber-100">{notice.compactLine}</p>
            <p className="text-[11px] text-amber-200/80">
              Standard DHL Express / FedEx checkout is unavailable for this destination.{' '}
              {onInquiryClick ? (
                <button
                  type="button"
                  onClick={onInquiryClick}
                  className="underline underline-offset-2 text-white font-semibold cursor-pointer"
                >
                  Open Delivery Inquiry
                </button>
              ) : (
                <a href="/worldwide-delivery#delivery-inquiry" className="underline underline-offset-2 text-white font-semibold">
                  Submit Delivery Inquiry
                </a>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      data-testid="compact-shipping-notice"
      className={`mt-2 rounded-[4px] border border-white/15 bg-[#111114] px-3 py-2 text-xs text-neutral-200 leading-relaxed break-words ${className}`}
    >
      <div className="flex items-start gap-2">
        <Truck className="w-3.5 h-3.5 text-neutral-300 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <span className="font-medium text-white">
            {isRental && notice.mode === 'bangladesh'
              ? 'FREE Delivery (৳0) | Bangla QR Prepaid (No COD on Rental) | Steadfast / Pathao'
              : notice.compactLine}
          </span>
          {notice.mode === 'international' && (
            <span className="block text-[11px] text-neutral-400 mt-0.5">
              Subject to carrier, customs, local laws &amp; Starlink regional eligibility.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompactShippingNotice;
