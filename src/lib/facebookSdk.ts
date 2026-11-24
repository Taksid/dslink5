// Facebook JavaScript SDK, Meta Pixel & Conversions API (CAPI) Integration for DSLINK Standard 4X

export interface FacebookAdsConfig {
  pixelId: string;
  appId: string;
  pageId: string;
  adAccountId: string;
  campaignName: string;
  adSetName: string;
  capiEnabled: boolean;
  testEventCode: string;
  currency: 'BDT' | 'USD';
  productValue: number;
  whatsappNumber: string;
  domainUrl: string;
}

export interface FacebookTrackingParams {
  fbclid?: string;
  fbp?: string;
  fbc?: string;
  pixelId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  adId?: string;
  campaignId?: string;
}

export interface FiredFbEvent {
  id: string;
  eventName: string;
  timestamp: string;
  value: number;
  currency: string;
  contentName: string;
  channel: 'Pixel + CAPI' | 'Pixel Only';
  payload: Record<string, any>;
}

const FB_CONFIG_STORAGE_KEY = 'dslink_fb_ads_config_v1';

export const DEFAULT_FB_ADS_CONFIG: FacebookAdsConfig = {
  pixelId: '1711007877296235',
  appId: '948271630592814',
  pageId: '104928374650192',
  adAccountId: 'act_38492019482',
  campaignName: 'DSLINK_Starlink_Standard_4X_BD_21500',
  adSetName: 'BD_All_64_Districts_18_55_Tech_ISP',
  capiEnabled: true,
  testEventCode: 'TEST84920',
  currency: 'BDT',
  productValue: 21500,
  whatsappNumber: '+880 1326-370218',
  domainUrl: 'devsparksoft.com.bd',
};

const eventListeners = new Set<(events: FiredFbEvent[]) => void>();
let firedEventsLog: FiredFbEvent[] = [];

export function subscribeToFbEvents(cb: (events: FiredFbEvent[]) => void) {
  eventListeners.add(cb);
  cb(firedEventsLog);
  return () => {
    eventListeners.delete(cb);
  };
}

function notifyListeners() {
  eventListeners.forEach((cb) => cb([...firedEventsLog]));
}

export function getSavedFbAdsConfig(): FacebookAdsConfig {
  if (typeof window === 'undefined') return DEFAULT_FB_ADS_CONFIG;
  try {
    const raw = localStorage.getItem(FB_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_FB_ADS_CONFIG, ...parsed, productValue: 21500 };
    }
  } catch {
    // Ignore storage read error
  }
  return DEFAULT_FB_ADS_CONFIG;
}

export async function saveFbAdsConfig(config: Partial<FacebookAdsConfig>): Promise<FacebookAdsConfig> {
  const merged: FacebookAdsConfig = {
    ...getSavedFbAdsConfig(),
    ...config,
    productValue: 21500,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FB_CONFIG_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore storage error
    }
  }
  try {
    await fetch('/api/fb-ads-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(merged),
    });
  } catch {
    // Ignore offline error
  }
  initFacebookSdkAndPixel(merged);
  return merged;
}

export function extractTrackingParams(): FacebookTrackingParams {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get('fbclid') || undefined;
  const cfg = getSavedFbAdsConfig();

  // Construct _fbp and _fbc cookies/identifiers per Meta specification
  const now = Date.now();
  const fbp = `fb.1.${now}.${Math.floor(100000000 + Math.random() * 900000000)}`;
  const fbc = fbclid ? `fb.1.${now}.${fbclid}` : undefined;

  return {
    fbclid,
    fbp,
    fbc,
    pixelId: cfg.pixelId,
    utmSource: params.get('utm_source') || 'facebook_ads',
    utmMedium: params.get('utm_medium') || 'paid_social_video_9x16',
    utmCampaign: params.get('utm_campaign') || cfg.campaignName,
    utmContent: params.get('utm_content') || 'dslink_standard_4x_21500_video_ad',
    utmTerm: params.get('utm_term') || 'starlink_bangladesh',
    adId: params.get('ad_id') || 'ad_dslink_4x_21500',
    campaignId: params.get('campaign_id') || 'camp_starlink_bd_4x',
  };
}

export function initFacebookSdkAndPixel(customConfig?: FacebookAdsConfig) {
  if (typeof window === 'undefined') return;
  const config = customConfig || getSavedFbAdsConfig();
  const w = window as any;

  // 1. Initialize Meta Pixel (fbq)
  if (!w.fbq) {
    const n: any = (w.fbq = function (...args: any[]) {
      if (n.callMethod) {
        n.callMethod.apply(n, args);
      } else {
        n.queue.push(args);
      }
    });
    if (!w._fbq) w._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onerror = () => {
      // Graceful fallback in ad-blocked or sandboxed preview environments
    };
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }
  }

  try {
    w.fbq('init', config.pixelId);
  } catch {
    // Ignore init warning
  }

  // 2. Initialize Facebook JavaScript SDK (window.FB)
  w.fbAsyncInit = function () {
    if (w.FB) {
      w.FB.init({
        appId: config.appId,
        cookie: true,
        xfbml: true,
        autoLogAppEvents: true,
        version: 'v21.0',
      });
    }
  };

  if (!document.getElementById('facebook-jssdk')) {
    const js = document.createElement('script');
    js.id = 'facebook-jssdk';
    js.async = true;
    js.defer = true;
    js.crossOrigin = 'anonymous';
    js.src = 'https://connect.facebook.net/en_US/sdk.js';
    js.onerror = () => {
      // Graceful fallback in sandboxed preview
    };
    const fjs = document.getElementsByTagName('script')[0];
    if (fjs && fjs.parentNode) {
      fjs.parentNode.insertBefore(js, fjs);
    }
  }
}

export async function trackFacebookEvent(
  eventName: 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'AddPaymentInfo' | 'Contact' | 'Purchase' | 'Lead',
  customData: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;
  const config = getSavedFbAdsConfig();
  const tracking = extractTrackingParams();
  const eventId = `dslink_${eventName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  const payload = {
    content_name: 'Starlink Standard 4X Kit',
    content_category: 'Satellite Internet Hardware',
    content_ids: ['starlink-standard-4x'],
    content_type: 'product',
    value: customData.value ?? 21500,
    currency: config.currency || 'BDT',
    ...customData,
  };

  // Fire browser pixel
  const w = window as any;
  if (typeof w.fbq === 'function') {
    try {
      w.fbq('track', eventName, payload, { eventID: eventId });
    } catch {
      // Ignore pixel error
    }
  }

  // Record in local live event log
  const entry: FiredFbEvent = {
    id: eventId,
    eventName,
    timestamp: new Date().toLocaleTimeString(),
    value: Number(payload.value) || 21500,
    currency: payload.currency,
    contentName: payload.content_name,
    channel: config.capiEnabled ? 'Pixel + CAPI' : 'Pixel Only',
    payload,
  };

  firedEventsLog = [entry, ...firedEventsLog].slice(0, 25);
  notifyListeners();

  // Forward to server CAPI if enabled
  if (config.capiEnabled) {
    try {
      await fetch('/api/fb-capi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          eventName,
          value: payload.value,
          currency: payload.currency,
          contentName: payload.content_name,
          fbclid: tracking.fbclid,
          utmCampaign: tracking.utmCampaign,
        }),
      });
    } catch {
      // Ignore network error
    }
  }
}
