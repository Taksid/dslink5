import { generateSitemapXml, resolveDomainFromRequest } from '../src/lib/domainConfig';

export default function handler(req: any, res: any) {
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const queryDomain = req.query?.domain || '';
  const domain = resolveDomainFromRequest(String(host), req.url || '/sitemap.xml', String(queryDomain));

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(generateSitemapXml(domain));
}
