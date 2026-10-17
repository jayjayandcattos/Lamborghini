const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p.waitForTimeout(20000);
  await p.screenshot({ path: '.shots/final-desktop.png', timeout: 150000 });
  console.log('ok');
  await browser.close();
})();
