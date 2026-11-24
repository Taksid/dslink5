import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import * as esbuild from 'esbuild';

const rootDir = process.cwd();
const distDir = path.resolve(rootDir, 'dist');
const publicDir = path.resolve(rootDir, 'public');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[generate-domain-seo] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const baseHtml = fs.readFileSync(indexPath, 'utf-8');

// Bundle src/lib/domainConfig.ts + src/lib/localeRouting.ts so static generation uses the exact same single source of truth as SSR.
const tmpBundlePath = path.join(distDir, '.seo-generator-bundle.mjs');
esbuild.buildSync({
  stdin: {
    contents: `
      export {
        buildDomainHtmlDocument,
        generateRobotsTxt,
        generateSitemapXml,
        getIndexableSitemapBasePages,
      } from './src/lib/domainConfig.ts';
      export {
        PUBLISHED_SEO_LOCALES,
        buildLocalePath,
      } from './src/lib/localeRouting.ts';
    `,
    resolveDir: rootDir,
    loader: 'ts',
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: tmpBundlePath,
});

try {
  const mod = await import(`${pathToFileURL(tmpBundlePath).href}?t=${Date.now()}`);
  const {
    buildDomainHtmlDocument,
    generateRobotsTxt,
    generateSitemapXml,
    getIndexableSitemapBasePages,
    PUBLISHED_SEO_LOCALES,
    buildLocalePath,
  } = mod;

  const staticVisitorCountry = { countryCode: null, source: 'static_fallback' };

  // 1. Domain root entry HTML files (default localized hero; client applies geo variant via /api/geo)
  const dslinkRootHtml = buildDomainHtmlDocument(baseHtml, 'dslink.cyou', '/', staticVisitorCountry);
  const devsparkRootHtml = buildDomainHtmlDocument(
    baseHtml,
    'devsparksoft.com.bd',
    '/',
    staticVisitorCountry
  );

  fs.writeFileSync(path.join(distDir, 'dslink.html'), dslinkRootHtml, 'utf-8');
  fs.writeFileSync(path.join(distDir, 'devsparksoft.html'), devsparkRootHtml, 'utf-8');
  fs.writeFileSync(indexPath, dslinkRootHtml, 'utf-8');

  // 2. Prerender static localized HTML for every published locale route (dslink.cyou default static output)
  const basePages = getIndexableSitemapBasePages('dslink.cyou');
  let prerenderedCount = 0;

  for (const page of basePages) {
    for (const loc of PUBLISHED_SEO_LOCALES) {
      const localizedPath = buildLocalePath(page.path, loc.code);
      if (localizedPath === '/') continue; // already written to dist/index.html

      const cleanRel = localizedPath.replace(/^\/+/, '');
      const targetDir = path.join(distDir, cleanRel);
      fs.mkdirSync(targetDir, { recursive: true });

      const html = buildDomainHtmlDocument(
        baseHtml,
        'dslink.cyou',
        localizedPath,
        staticVisitorCountry
      );
      fs.writeFileSync(path.join(targetDir, 'index.html'), html, 'utf-8');
      prerenderedCount++;
    }
  }

  // 3. Synchronize XML sitemaps and robots.txt for both domains in dist/ and public/
  const dslinkSitemap = generateSitemapXml('dslink.cyou');
  const devsparkSitemap = generateSitemapXml('devsparksoft.com.bd');
  const dslinkRobots = generateRobotsTxt('dslink.cyou');
  const devsparkRobots = generateRobotsTxt('devsparksoft.com.bd');

  for (const targetDir of [distDir, publicDir]) {
    if (!fs.existsSync(targetDir)) continue;
    fs.writeFileSync(path.join(targetDir, 'sitemap-dslink.xml'), dslinkSitemap, 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'sitemap-devsparksoft.xml'), devsparkSitemap, 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'robots-dslink.txt'), dslinkRobots, 'utf-8');
    fs.writeFileSync(path.join(targetDir, 'robots-devsparksoft.txt'), devsparkRobots, 'utf-8');
  }

  console.log(
    `[generate-domain-seo] Generated domain roots, ${prerenderedCount} prerendered multilingual HTML pages, sitemaps, and robots.txt.`
  );
} finally {
  if (fs.existsSync(tmpBundlePath)) {
    fs.unlinkSync(tmpBundlePath);
  }
}
