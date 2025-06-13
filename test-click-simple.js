const { chromium } = require('playwright');

async function testClickSimple() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Start with busybox (default)
  console.log('Starting with busybox (default)');
  const initialSearch = await page.$eval('#search', el => el.value);
  console.log('Initial search box:', initialSearch);
  
  await page.screenshot({ path: 'playwright-output/nav-1-busybox.png', fullPage: true });
  
  // Click on the first visible circle (any dependency)
  const firstCircle = await page.$('circle');
  if (firstCircle) {
    console.log('\nClicking on a node...');
    await firstCircle.click();
    await page.waitForTimeout(2000);
    
    // Check what happened
    const newSearch = await page.$eval('#search', el => el.value);
    console.log('Search box after click:', newSearch);
    
    // Get package details
    const packageName = await page.$eval('#package-info h3', el => el.textContent);
    console.log('Package details showing:', packageName);
    
    await page.screenshot({ path: 'playwright-output/nav-2-clicked.png', fullPage: true });
    
    // Count nodes to see if view changed
    const nodeCount = await page.$$eval('circle', circles => circles.length);
    console.log('Number of nodes in view:', nodeCount);
  }
  
  await browser.close();
}

testClickSimple().catch(console.error);