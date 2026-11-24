export interface ActivityNotifyPayload {
  activityType: string;
  title: string;
  page?: string;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  details?: Record<string, string | number | boolean | null | undefined>;
}

const recentSentMap = new Map<string, number>();

/**
 * Sends a non-blocking user activity alert to the backend (/api/activity-notify),
 * which delivers a Resend email notification to taksidwalid150@gmail.com.
 * Deduplicates identical events client-side for 30 seconds.
 */
export function notifyAdminActivity(payload: ActivityNotifyPayload): void {
  if (typeof window === 'undefined') return;

  try {
    const page = payload.page || window.location.pathname || '/';
    const dedupeKey = `${payload.activityType}::${payload.title}::${page}::${payload.userPhone || ''}`;
    const now = Date.now();
    const last = recentSentMap.get(dedupeKey) || 0;
    if (now - last < 30_000) return;
    recentSentMap.set(dedupeKey, now);

    const body = JSON.stringify({
      ...payload,
      page,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });

    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/activity-notify', blob);
      if (queued) return;
    }

    fetch('/api/activity-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Never block UX on background telemetry
    });
  } catch {
    // Ignore client notification errors
  }
}
