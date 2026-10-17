const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3001/', { waitUntil: 'load' });
  await page.waitForTimeout(11000);
  const read = () => page.evaluate(() => Array.from(document.querySelectorAll('aside [data-aos]')).map((el) => ({
    t: el.textContent.trim().slice(0, 18),
    cls: el.className.includes('aos-animate'),
    op: getComputedStyle(el).opacity,
    tr: getComputedStyle(el).transform,
  })));
  console.log('BEFORE', JSON.stringify(await read()));
  await page.getByRole('button', { name: 'urus.glb' }).click();
  await page.waitForTimeout(2000);
  console.log('AFTER', JSON.stringify(await read()));
  await browser.close();
})();
