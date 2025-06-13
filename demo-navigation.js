const { chromium } = require('playwright');

async function demoNavigation() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Search for python
  console.log('1. Searching for python...');
  await page.type('#search', 'python', { delay: 100 });
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'playwright-output/demo-1-python.png' });
  
  // Find and click on a dependency
  const nodes = await page.$$('g.node');
  console.log(`Found ${nodes.length} nodes`);
  
  // Click on the 3rd node (likely a dependency)
  if (nodes.length > 3) {
    console.log('2. Clicking on a dependency...');
    await nodes[3].click();
    await page.waitForTimeout(2000);
    
    const newPackage = await page.$eval('#search', el => el.value);
    console.log(`   Navigated to: ${newPackage}`);
    await page.screenshot({ path: 'playwright-output/demo-2-dependency.png' });
  }
  
  console.log('\nDemo complete! Browser will stay open for manual exploration.');
  console.log('Close the browser window when done.');
  
  // Keep browser open for manual exploration
  await new Promise(() => {});
}

demoNavigation().catch(console.error);