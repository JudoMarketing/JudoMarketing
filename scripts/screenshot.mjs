import { chromium } from 'playwright-core';
const out = process.env.SCRATCH || '.';
const base = 'http://localhost:3100';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const shot = async (url, name, opts = {}) => {
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  // Scroll por toda la página para disparar los reveals
  await page.evaluate(async () => {
    const h = document.body.scrollHeight;
    for (let y = 0; y <= h; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 90));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/${name}.png`, ...opts });
};

await shot('/es', 'home-es', { fullPage: true });
await shot('/es/servicios', 'services-es', { fullPage: true });
await shot('/es/login', 'login-es');
await page.setViewportSize({ width: 390, height: 844 });
await shot('/es', 'home-es-mobile', { fullPage: true });
await browser.close();
console.log('screenshots ok');
