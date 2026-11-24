import { generateRobotsTxt, resolveDomainFromRequest } from '../src/lib/domainConfig';

export default function handler(req: any, res: any) {
  const host = req.headers?.['x-forwarded-host'] || req.headers?.host || '';
  const queryDomain = req.query?.domain || '';
  const domain = resolveDomainFromRequest(String(host), req.url || '/robots.txt', String(queryDomain));

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
  res.status(200).send(generateRobotsTxt(domain));
}
