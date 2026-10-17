const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3001/', { waitUntil: 'load' });
  await page.waitForTimeout(12000);
  const d = await page.evaluate(() => ({
    car: window.__carDebug,
    cam: window.__camDebug,
    canvas: (() => { const c = document.querySelector('canvas'); return c ? { w: c.clientWidth, h: c.clientHeight, aw: c.width, ah: c.height } : null; })(),
  }));
  console.log(JSON.stringify(d, null, 2));
  await browser.close();
})();
