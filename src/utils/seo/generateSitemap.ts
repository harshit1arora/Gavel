import { getAllSlugs } from '../../data/seo-content';

const DOMAIN = 'https://www.trygavel.com';

const staticPages = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/loan-approval-predictor', priority: 0.95, changefreq: 'daily' },
  { path: '/tools', priority: 0.9, changefreq: 'weekly' },
  { path: '/upload', priority: 0.8, changefreq: 'weekly' },
  { path: '/apply', priority: 0.8, changefreq: 'weekly' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly' },
  { path: '/about', priority: 0.5, changefreq: 'monthly' },
  { path: '/contact', priority: 0.4, changefreq: 'monthly' },
  { path: '/security', priority: 0.4, changefreq: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.3, changefreq: 'yearly' },
];

const toolPages = [
  'emi-calculator', 'salary-loan-eligibility', 'credit-utilization',
  'home-loan-affordability', 'dti-calculator', 'car-loan-emi-calculator',
  'credit-score-simulator', 'loan-affordability-calculator',
  'emergency-fund-calculator', 'interest-rate-comparison',
  'loan-tenure-optimizer', 'prepayment-impact-calculator',
  'business-loan-eligibility', 'education-loan-calculator',
  'credit-card-debt-payoff', 'salary-loan-mapping',
  'nbfc-vs-bank-comparison', 'monthly-budget-planner',
  'financial-health-check',
];

export function generateSitemapXML(): string {
  const today = new Date().toISOString().split('T')[0];
  const seoSlugs = getAllSlugs();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Static pages
  for (const page of staticPages) {
    xml += `  <url>\n    <loc>${DOMAIN}${page.path}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${page.changefreq}</changefreq>\n    <priority>${page.priority}</priority>\n  </url>\n`;
  }

  // Tool pages
  for (const tool of toolPages) {
    xml += `  <url>\n    <loc>${DOMAIN}/tools/${tool}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
  }

  // SEO pages (all generated)
  for (const slug of seoSlugs) {
    xml += `  <url>\n    <loc>${DOMAIN}/${slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
  }

  xml += '</urlset>';
  return xml;
}

export function generateRobotsTxt(): string {
  return `User-agent: *
Allow: /
Allow: /tools/
Allow: /loan-approval-predictor
Allow: /blog/

Disallow: /dashboard
Disallow: /console
Disallow: /playground
Disallow: /setup-wizard
Disallow: /usage-billing
Disallow: /metrics-roi
Disallow: /sales-pipeline
Disallow: /collections
Disallow: /loan-origination
Disallow: /compliance
Disallow: /agents
Disallow: /portfolio
Disallow: /api-reference

Sitemap: ${DOMAIN}/sitemap.xml
`;
}
