import { normalizeValidIsoCountry } from '../src/lib/heroGeoCopy';

const VARY_GEO_HEADERS =
  'cf-ipcountry, x-vercel-ip-country, x-appengine-country, cloudfront-viewer-country, fastly-client-country, x-country-code';

/**
 * Edge / serverless country-level geolocation endpoint.
 * Reads ONLY trusted hosting platform headers (never collects, logs, or returns raw IP addresses).
 */
export default function handler(req: any, res: any) {
  const headers = req?.headers || {};
  const headerCandidates: Array<[string, string | undefined]> = [
    ['cf-ipcountry', headers['cf-ipcountry']],
    ['x-vercel-ip-country', headers['x-vercel-ip-country']],
    ['x-appengine-country', headers['x-appengine-country']],
    ['cloudfront-viewer-country', headers['cloudfront-viewer-country']],
    ['fastly-client-country', headers['fastly-client-country']],
    ['x-country-code', headers['x-country-code']],
  ];

  let countryCode: string | null = null;
  let source = 'unavailable';

  for (const [headerName, rawVal] of headerCandidates) {
    const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
    const valid = normalizeValidIsoCountry(val);
    if (valid) {
      countryCode = valid;
      source = `edge_header:${headerName}`;
      break;
    }
  }

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Vary', VARY_GEO_HEADERS);
  res.status(200).json({
    success: true,
    countryCode,
    source,
  });
}
