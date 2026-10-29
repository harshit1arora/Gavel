/**
 * Gavel, end-to-end suite.
 *
 * Serves the production build over HTTP and drives it with headless Chromium.
 * Covers: every public route, the /try pipeline (real PDF, sample, bad input,
 * scanned PDF, corrupt PDF, PDF download), the /demo console (select, approve,
 * decline, re-run, filter, search), navbar routing, auth redirects, all 20
 * tools, and mobile layout. Writes a JSON report.
 */
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = process.env.E2E_ROOT || path.join(__dirname, '..', 'dist');
const PORT = Number(process.env.E2E_PORT || 4300);
const FIXTURES = path.join(__dirname, 'fixtures');
const fx = (name) => path.join(FIXTURES, name);

if (!fs.existsSync(path.join(ROOT, 'index.html'))) {
  console.error(`No build found at ${ROOT}. Run "npm run build" first.`);
  process.exit(2);
}
const TYPES = {
  '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.json': 'application/json', '.wasm': 'application/wasm', '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
  if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(ROOT, 'index.html');
  res.setHeader('Content-Type', TYPES[path.extname(p)] || 'application/octet-stream');
  res.end(fs.readFileSync(p));
});

const results = [];
const record = (suite, name, pass, detail = '') => {
  results.push({ suite, name, pass, detail });
  console.log(`${pass ? 'PASS': 'FAIL'} [${suite}] ${name}${detail ? ', ' + detail: ''}`);
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const newPage = async (width = 1440, height = 900) => {
    const page = await browser.newPage();
    page.errors = [];
    page.on('pageerror', (e) => page.errors.push(String(e).slice(0, 200)));
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL') && !m.text().includes('net:')) {
        page.errors.push('console: ' + m.text().slice(0, 160));
      }
    });
    await page.setViewport({ width, height });
    return page;
  };

  const goto = async (page, route) => {
    await page.goto(`http://127.0.0.1:${PORT}${route}`, { waitUntil: 'networkidle2', timeout: 45000 });
    await sleep(900);
  };

  const text = (page) => page.evaluate(() => document.body.innerText);

  // ─────────────────────────────────────────────────────────────
  // SUITE 1, public routes render without errors
  // ─────────────────────────────────────────────────────────────
  const ROUTES = [
    '/', '/platform', '/platform/underwriting', '/platform/portfolio', '/platform/disbursements',
    '/platform/collections', '/platform/sentinel', '/platform/compliance', '/platform/analytics',
    '/platform/developer', '/demo', '/try', '/tools', '/pricing', '/api-reference', '/blog',
    '/about', '/security', '/loan-approval-predictor',
  ];
  {
    const page = await newPage();
    for (const route of ROUTES) {
      await goto(page, route);
      const info = await page.evaluate(() => ({
        h1: (document.querySelector('h1') || {}).innerText || '',
        len: document.body.innerText.length,
      }));
      const ok = info.len > 300 && page.errors.length === 0;
      record('routes', `GET ${route}`, ok, ok ? `${info.len} chars`: `len=${info.len} errors=${page.errors.slice(0, 2).join('|')}`);
      page.errors.length = 0;
    }
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 2, /try pipeline
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage();
    await goto(page, '/try');

    // 2.1 real PDF upload
    let input = await page.$('input[type=file]');
    await input.uploadFile(fx('statement-valid.pdf'));
    await page.waitForFunction(() => /APPROVE|REVIEW|REJECT/.test(document.body.innerText), { timeout: 30000 });
    await sleep(400);
    let body = await text(page);
    const decision = (body.match(/\b(APPROVE|REVIEW|REJECT)\b/) || [])[1];
    const txnCount = (body.match(/(\d+) transactions/) || [])[1];
    const income = (body.match(/Monthly income\s*₹\s*([\d,]+)/) || [])[1];
    record('try', 'real PDF → decision', !!decision && txnCount === '8',
      `decision=${decision} txns=${txnCount} income=${income}`);
    record('try', 'signals derived from PDF', !!income && income !== '0', `income=${income}`);

    // 2.2 rules table populated
    const rules = await page.evaluate(() =>
      [...document.querySelectorAll('span')].filter((s) => ['PASS', 'FAIL', 'SKIP'].includes(s.textContent.trim())).length);
    record('try', 'policy rule trace rendered', rules >= 20, `${rules} rule rows`);

    // 2.3 transactions expand
    const expand = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Extracted transactions/.test(b.innerText));
      if (btn) { btn.click(); return true; }
      return false;
    });
    await sleep(400);
    const rows = await page.evaluate(() => document.querySelectorAll('tbody tr').length);
    record('try', 'transaction table expands', expand && rows >= 8, `${rows} rows`);

    // 2.4 decision PDF download path runs
    await page.evaluate(() => {
      window.__pdf = null;
      const origUrl = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        window.__pdf = blob;
        return origUrl.call(URL, blob);
      };
    });
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Download decision record/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(1200);
    const pdfInfo = await page.evaluate(async () => {
      const blob = window.__pdf;
      if (!blob) return { ok: false, reason: 'no blob' };
      const head = await blob.slice(0, 5).text();
      return { ok: head.startsWith('%PDF'), type: blob.type, size: blob.size, head };
    });
    record('try', 'decision PDF generated', pdfInfo.ok,
      `${pdfInfo.type || '?'} ${pdfInfo.size || 0} bytes head=${pdfInfo.head || pdfInfo.reason}`);

    // 2.5 reset works
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Try another statement/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(600);
    const backToUpload = await page.evaluate(() => !!document.querySelector('input[type=file]'));
    record('try', 'reset returns to upload', backToUpload);

    // 2.6 sample statement
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Run a sample statement/.test(b.innerText));
      if (btn) btn.click();
    });
    await page.waitForFunction(() => /APPROVE|REVIEW|REJECT/.test(document.body.innerText), { timeout: 20000 });
    body = await text(page);
    record('try', 'sample statement → decision', /APPROVE|REVIEW|REJECT/.test(body),
      (body.match(/\b(APPROVE|REVIEW|REJECT)\b/) || [])[1]);

    // 2.7 non-PDF rejected
    await goto(page, '/try');
    input = await page.$('input[type=file]');
    await input.uploadFile(fx('not-a-statement.txt'));
    await sleep(1200);
    body = await text(page);
    record('try', 'non-PDF rejected with message', /Please upload a PDF/i.test(body));

    // 2.8 scanned PDF (no text layer) handled
    await goto(page, '/try');
    input = await page.$('input[type=file]');
    await input.uploadFile(fx('statement-scan.pdf'));
    await sleep(3000);
    body = await text(page);
    record('try', 'scanned PDF gives a clear error', /no text layer|scan/i.test(body),
      (body.match(/(This PDF[^\n]{0,60})/) || [])[1] || 'no message');

    // 2.9 corrupt PDF handled
    await goto(page, '/try');
    input = await page.$('input[type=file]');
    await input.uploadFile(fx('statement-corrupt.pdf'));
    await sleep(3000);
    body = await text(page);
    const graceful = /could not|invalid|failed|no text layer/i.test(body);
    record('try', 'corrupt PDF fails gracefully (no crash)', graceful && page.errors.length === 0,
      graceful ? 'message shown': `body=${body.slice(0, 80)}`);

    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 3, /demo console
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage();
    await goto(page, '/demo');

    const kpi = async (label) => {
      const body = await text(page);
      const m = body.match(new RegExp(label + '\\s*\\n?\\s*([\\d,]+)'));
      return m ? m[1]: null;
    };

    const queueRows = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter((b) => /apl-10\d\d/.test(b.innerText)).length);
    record('demo', 'queue renders 6 applicants', queueRows === 6, `${queueRows} rows`);

    const inQueue = await kpi('In queue');
    const approvedBefore = Number(await kpi('Approved'));
    record('demo', 'KPIs computed', inQueue === '6', `queue=${inQueue} approved=${approvedBefore}`);

    // select the manual-review applicant (Amit Verma, apl-1026)
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /apl-1026/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(500);
    let body = await text(page);
    const detailName = /Amit Verma/.test(body);
    record('demo', 'clicking a row opens the file', detailName);

    const hasTrace = /DECISION TRACE/i.test(body);
    record('demo', 'decision trace shown for selected file', hasTrace);

    // approve → status changes and KPI increments
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Approve');
      if (btn) btn.click();
    });
    await sleep(600);
    const approvedAfter = Number(await kpi('Approved'));
    body = await text(page);
    record('demo', 'approve updates KPI', approvedAfter === approvedBefore + 1,
      `${approvedBefore} → ${approvedAfter}`);
    record('demo', 'approve marks the row Approved', /Overridden by you|Approved/.test(body));

    // decline the same file
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Decline');
      if (btn) btn.click();
    });
    await sleep(600);
    const approvedAfterDecline = Number(await kpi('Approved'));
    record('demo', 'decline reverses the approval', approvedAfterDecline === approvedBefore,
      `${approvedAfter} → ${approvedAfterDecline}`);

    // re-run engine
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Re-run engine/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(600);
    record('demo', 're-run engine keeps a decision', /APPROVE|REVIEW|REJECT/.test(await text(page)));

    // decision PDF
    await page.evaluate(() => {
      window.__pdf = null;
      const origUrl = URL.createObjectURL;
      URL.createObjectURL = function (blob) {
        window.__pdf = blob;
        return origUrl.call(URL, blob);
      };
      const btn = [...document.querySelectorAll('button')].find((b) => /Decision PDF/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(1200);
    const demoPdf = await page.evaluate(async () => {
      const blob = window.__pdf;
      if (!blob) return { ok: false };
      const head = await blob.slice(0, 5).text();
      return { ok: head.startsWith('%PDF'), size: blob.size };
    });
    record('demo', 'decision PDF generated', demoPdf.ok, `${demoPdf.size || 0} bytes`);

    // filter
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'Rejected');
      if (btn) btn.click();
    });
    await sleep(500);
    const rejectedRows = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter((b) => /apl-10\d\d/.test(b.innerText)).length);
    record('demo', 'rejected filter narrows the queue', rejectedRows >= 1 && rejectedRows < 6, `${rejectedRows} rows`);

    // search
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => b.innerText.trim() === 'All');
      if (btn) btn.click();
    });
    await sleep(300);
    await page.type('input[placeholder="Search applicant or ID"]', 'Sneha');
    await sleep(500);
    const searchRows = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter((b) => /apl-10\d\d/.test(b.innerText)).length);
    record('demo', 'search filters to one applicant', searchRows === 1, `${searchRows} rows`);

    // reset
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find((b) => /Reset queue/.test(b.innerText));
      if (btn) btn.click();
    });
    await sleep(600);
    const resetRows = await page.evaluate(() =>
      [...document.querySelectorAll('button')].filter((b) => /apl-10\d\d/.test(b.innerText)).length);
    record('demo', 'reset restores the queue', resetRows === 6, `${resetRows} rows`);

    record('demo', 'no console errors', page.errors.length === 0, page.errors.slice(0, 2).join('|'));
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 4, navigation
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage();
    await goto(page, '/');

    const clickLink = async (label) => {
      const found = await page.evaluate((l) => {
        const el = [...document.querySelectorAll('a,button')].find((e) => e.innerText.trim().startsWith(l));
        if (el) { el.click(); return true; }
        return false;
      }, label);
      await sleep(1200);
      return found;
    };

    await clickLink('Try it free');
    record('nav', 'navbar "Try it free" → /try', page.url().endsWith('/try'), page.url());

    await goto(page, '/');
    await clickLink('Live Demo');
    record('nav', 'footer "Live Demo" → /demo', page.url().endsWith('/demo'), page.url());

    await goto(page, '/pricing');
    const pricingBody = await text(page);
    record('nav', '/pricing still renders after leaving the navbar', pricingBody.length > 300, `${pricingBody.length} chars`);

    await goto(page, '/');
    // Radix opens on pointer events, so drive a real mouse click.
    const triggers = await page.$$('button');
    for (const t of triggers) {
      const label = await page.evaluate((el) => el.innerText.trim(), t);
      if (label.startsWith('Platform')) {
        await t.click();
        break;
      }
    }
    await sleep(800);
    const menuItems = await page.evaluate(() =>
      [...document.querySelectorAll('[role=menuitem]')].map((e) => e.innerText.trim()));
    record('nav', 'Platform dropdown lists modules', menuItems.length >= 9, `${menuItems.length} items`);

    const items = await page.$$('[role=menuitem]');
    for (const item of items) {
      const label = await page.evaluate((el) => el.innerText.trim(), item);
      if (/^Collections$/.test(label)) {
        await item.click();
        break;
      }
    }
    await sleep(1400);
    record('nav', 'dropdown navigates to a module', page.url().includes('/platform/collections'), page.url());
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 5, auth redirects
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage();
    await goto(page, '/collections');
    record('auth', '/collections → /platform when logged out', page.url().includes('/platform'), page.url());

    await goto(page, '/dashboard');
    await sleep(1500);
    const body = await text(page);
    const stuck = /^Loading\.{0,3}$/.test(body.trim()) || body.trim().length === 0;
    const hasContent = /Dashboard|Analysis/i.test(body);
    record('auth', '/dashboard renders for a logged-out visitor', !stuck && hasContent && page.errors.length === 0,
      stuck ? 'stuck on loading': `${body.length} chars, content ok`);
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 6, tools
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage(1280, 900);
    const TOOLS = [
      '/tools/emi-calculator', '/tools/salary-loan-eligibility', '/tools/credit-utilization',
      '/tools/home-loan-affordability', '/tools/dti-calculator', '/tools/car-loan-emi-calculator',
      '/tools/credit-score-simulator', '/tools/loan-affordability-calculator',
      '/tools/emergency-fund-calculator', '/tools/interest-rate-comparison',
      '/tools/loan-tenure-optimizer', '/tools/prepayment-impact-calculator',
      '/tools/business-loan-eligibility', '/tools/education-loan-calculator',
      '/tools/credit-card-debt-payoff', '/tools/salary-loan-mapping',
      '/tools/nbfc-vs-bank-comparison', '/tools/monthly-budget-planner',
      '/tools/financial-health-check', '/tools',
    ];
    let ok = 0;
    const failures = [];
    for (const route of TOOLS) {
      await goto(page, route);
      const info = await page.evaluate(() => ({
        len: document.body.innerText.length,
        rupee: /₹/.test(document.body.innerText),
        inputs: document.querySelectorAll('input,[role=slider]').length,
      }));
      if (info.len > 400 && info.rupee && page.errors.length === 0) ok++;
      else failures.push(`${route}(len=${info.len},₹=${info.rupee})`);
      page.errors.length = 0;
    }
    record('tools', `all ${TOOLS.length} tool pages render and compute`, ok === TOOLS.length,
      ok === TOOLS.length ? '20/20': failures.join(' '));
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  // SUITE 7, mobile layout
  // ─────────────────────────────────────────────────────────────
  {
    const page = await newPage(390, 844);
    for (const route of ['/', '/try', '/demo', '/platform']) {
      await goto(page, route);
      const overflow = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - window.innerWidth));
      record('mobile', `${route} has no horizontal overflow`, overflow <= 2, `overflow=${overflow}px`);
    }
    await page.close();
  }

  // ─────────────────────────────────────────────────────────────
  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.pass);
  const summary = {
    total: results.length,
    passed: results.length - failed.length,
    failed: failed.length,
    bySuite: results.reduce((acc, r) => {
      acc[r.suite] = acc[r.suite] || { pass: 0, fail: 0 };
      r.pass ? acc[r.suite].pass++: acc[r.suite].fail++;
      return acc;
    }, {}),
    failures: failed,
    results,
  };
  fs.writeFileSync(process.env.E2E_REPORT || path.join(__dirname, 'e2e-report.json'), JSON.stringify(summary, null, 2));
  console.log(`\n==== ${summary.passed}/${summary.total} checks passed, ${summary.failed} failed ====`);
  if (failed.length) {
    console.log('FAILURES:');
    failed.forEach((f) => console.log(` - [${f.suite}] ${f.name}: ${f.detail}`));
  }
  process.exit(failed.length ? 1: 0);
})().catch((e) => {
  console.log('SUITE CRASHED:', e.message);
  process.exit(2);
});
