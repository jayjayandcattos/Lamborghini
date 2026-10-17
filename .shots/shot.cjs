const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message.slice(0, 400)));
  await page.goto('http://localhost:3001/', { waitUntil: 'load' });
  await page.waitForTimeout(14000);
  await page.screenshot({ path: '.shots/desktop.png', timeout: 120000, animations: 'disabled' });
  console.log('ok');
  await browser.close();
})();
