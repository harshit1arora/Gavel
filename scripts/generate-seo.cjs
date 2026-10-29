const fs = require('fs');
const path = require('path');
const config = require('../src/data/seo-config.json');

const DOMAIN = 'https://www.trygavel.com';

// ── Only pages with real, indexable content ────────────────────────────────
// NOTE: /upload, /apply, /analyzing are EXCLUDED; they are auth-gated and
// return thin/empty content, which hurts domain trust as soft-404s.
const staticPages = [
  { path: '', priority: 1.00, changefreq: 'daily' },
  // Platform: the product tour. High priority: this is what a lender evaluates.
  { path: '/try', priority: 0.98, changefreq: 'weekly' },
  { path: '/demo', priority: 0.95, changefreq: 'weekly' },
  { path: '/platform', priority: 0.95, changefreq: 'weekly' },
  { path: '/platform/underwriting', priority: 0.85, changefreq: 'monthly' },
  { path: '/platform/portfolio', priority: 0.80, changefreq: 'monthly' },
  { path: '/platform/disbursements', priority: 0.80, changefreq: 'monthly' },
  { path: '/platform/collections', priority: 0.80, changefreq: 'monthly' },
  { path: '/platform/sentinel', priority: 0.80, changefreq: 'monthly' },
  { path: '/platform/compliance', priority: 0.80, changefreq: 'monthly' },
  { path: '/platform/analytics', priority: 0.75, changefreq: 'monthly' },
  { path: '/platform/developer', priority: 0.75, changefreq: 'monthly' },
  { path: '/loan-approval-predictor', priority: 0.95, changefreq: 'daily' },
  { path: '/tools', priority: 0.90, changefreq: 'weekly' },
  { path: '/sandbox', priority: 0.80, changefreq: 'weekly' },
  { path: '/blog', priority: 0.75, changefreq: 'weekly' },
  // Blog posts
  { path: '/blog/how-nbfcs-can-reduce-loan-tat-automated-underwriting', priority: 0.70, changefreq: 'monthly' },
  { path: '/blog/rbi-compliant-underwriting-nbfcs-2025', priority: 0.70, changefreq: 'monthly' },
  { path: '/blog/bank-statement-analysis-api-nbfcs', priority: 0.70, changefreq: 'monthly' },
  // SEO hub pages
  { path: '/all-guides', priority: 0.85, changefreq: 'weekly' },
  { path: '/loan-rejection-guides', priority: 0.80, changefreq: 'weekly' },
  { path: '/financial-health-tools', priority: 0.80, changefreq: 'weekly' },
  { path: '/cibil-score-guides', priority: 0.80, changefreq: 'weekly' },
  { path: '/bank-statement-analysis', priority: 0.80, changefreq: 'weekly' },
  { path: '/loan-eligibility-center', priority: 0.80, changefreq: 'weekly' },
  { path: '/emi-education-hub', priority: 0.80, changefreq: 'weekly' },
  // Company pages
  { path: '/about', priority: 0.50, changefreq: 'monthly' },
  { path: '/contact', priority: 0.40, changefreq: 'monthly' },
  { path: '/security', priority: 0.40, changefreq: 'monthly' },
  { path: '/privacy-policy', priority: 0.30, changefreq: 'yearly' },
  { path: '/terms-of-service', priority: 0.30, changefreq: 'yearly' },
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

const fmt = (n) => {
  if (n >= 10000000) return (n / 10000000) + 'cr';
  if (n >= 100000) return (n / 100000) + 'l';
  if (n >= 1000) return (n / 1000) + 'k';
  return '' + n;
};

const getSlugs = () => {
  const slugs = [];

  config.salaries.forEach(s => {
    slugs.push(`loan-eligibility-${fmt(s)}-salary`);
  });

  config.loanAmounts.forEach(amt => {
    slugs.push(`${fmt(amt)}-personal-loan`);
  });

  config.cities.forEach(city => {
    slugs.push(`personal-loan-in-${city}`);
    slugs.push(`home-loan-in-${city}`);
  });

  config.professions.forEach(prof => {
    slugs.push(`personal-loan-for-${prof}`);
  });

  config.banks.forEach(bank => {
    slugs.push(`${bank}-personal-loan-eligibility`);
    slugs.push(`${bank}-loan-rejection-reasons`);
    slugs.push(`${bank}-loan-analysis`);
  });

  config.intents.forEach(intent => {
    slugs.push(intent);
  });

  slugs.push('average-approval-score-by-profession');
  slugs.push('most-common-rejection-reasons');
  slugs.push('financial-trends-by-salary-range');
  slugs.push('emi-stress-trends');

  return slugs;
};

function generate() {
  const today = new Date().toISOString().split('T')[0];
  const slugs = getSlugs();

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  for (const page of staticPages) {
    xml += ` <url>\n <loc>${DOMAIN}${page.path}</loc>\n <lastmod>${today}</lastmod>\n <changefreq>${page.changefreq}</changefreq>\n <priority>${page.priority.toFixed(2)}</priority>\n </url>\n`;
  }

  for (const tool of toolPages) {
    xml += ` <url>\n <loc>${DOMAIN}/tools/${tool}</loc>\n <lastmod>${today}</lastmod>\n <changefreq>weekly</changefreq>\n <priority>0.80</priority>\n </url>\n`;
  }

  for (const slug of slugs) {
    xml += ` <url>\n <loc>${DOMAIN}/${slug}</loc>\n <lastmod>${today}</lastmod>\n <changefreq>monthly</changefreq>\n <priority>0.60</priority>\n </url>\n`;
  }

  xml += '</urlset>';

  const robots = `User-agent: *
Allow: /
Allow: /tools/
Allow: /blog/
Allow: /loan-approval-predictor
Allow: /all-guides
Allow: /loan-rejection-guides
Allow: /financial-health-tools
Allow: /cibil-score-guides
Allow: /bank-statement-analysis
Allow: /loan-eligibility-center
Allow: /emi-education-hub

# Disallow auth-gated and thin pages; these have no SEO value
Disallow: /upload
Disallow: /apply
Disallow: /analyzing
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
Disallow: /brand

# Sitemap
Sitemap: ${DOMAIN}/sitemap.xml
`;

  const publicDir = path.join(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), robots);

  const totalPages = staticPages.length + toolPages.length + slugs.length;
  console.log(`✅ Sitemap generated: ${totalPages} URLs (removed thin/auth pages)`);
  console.log(`✅ robots.txt updated: thin pages disallowed`);
}

generate();
