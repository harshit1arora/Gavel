const puppeteer = require('puppeteer');
const path = require('node:path');
async function main() {
  const browser = await puppeteer.launch({executablePath: process.env.CHROME_PATH || undefined, args: ['--disable-dev-shm-usage']});
  try {
    const page = await browser.newPage();
    await page.goto(new URL('/try', process.env.GAVEL_PUBLIC_URL).href, {waitUntil:'domcontentloaded'});
    const revision = process.env.GAVEL_EXPECTED_REVISION;
    if (revision) {
      const deployed = await page.evaluate(async () => {
        const ui = await fetch('/gavel-revision.txt',{cache:'no-store'});
        const gateway = await fetch('/v1/public/release',{cache:'no-store'});
        return [(await ui.text()).trim(), (await gateway.json()).revision];
      });
      if (deployed.some(value => value !== revision)) throw Error('Public frontend or gateway revision differs from the promoted manifest');
    }
    const input = await page.waitForSelector('input[type=file]');
    await input.uploadFile(path.resolve(__dirname,'../e2e/fixtures/statement-valid.pdf'));
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return /\bAPPROVE\b/.test(text) && /\b8 transactions\b/i.test(text) && /Monthly income\s*₹\s*44,803/i.test(text);
    }, {timeout:45000});
  } finally { await browser.close(); }
}
main().catch(err => { console.error(err); process.exitCode = 1; });
