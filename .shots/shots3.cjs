const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const p2 = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  await p2.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p2.waitForTimeout(14000);
  await p2.screenshot({ path: '.shots/mobile.png', timeout: 150000 });
  console.log('mobile ok');
  const p1 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p1.goto('http://localhost:3001/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await p1.waitForTimeout(14000);
  await p1.screenshot({ path: '.shots/desktop-urus.png', timeout: 150000 });
  console.log('desktop ok');
  await browser.close();
})();
