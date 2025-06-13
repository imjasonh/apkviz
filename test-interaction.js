const { chromium } = require('playwright');

async function testInteraction() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Click on the busybox node
  await page.click('circle');
  await page.waitForTimeout(1000);
  
  // Get the package details
  const details = await page.evaluate(() => {
    const detailsEl = document.getElementById('package-info');
    return detailsEl ? detailsEl.innerText : 'No details found';
  });
  
  console.log('Package details after click:');
  console.log(details);
  
  // Take screenshot
  await page.screenshot({ path: 'playwright-output/after-interaction.png', fullPage: true });
  console.log('Screenshot saved to after-interaction.png');
  
  await browser.close();
}

testInteraction().catch(console.error);