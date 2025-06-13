const { chromium } = require('playwright');

async function demoImpressive() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  console.log('🚀 Welcome to the Wolfi APK Dependency Visualizer Demo!');
  console.log('   Prepare to be impressed...\n');
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // 1. Show the most critical packages
  console.log('1. Let\'s see the most critical packages in Wolfi...');
  await page.click('#show-top-packages');
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'playwright-output/demo-critical-packages.png' });
  
  // Click on the top package
  const topPackage = await page.$('.critical-package');
  if (topPackage) {
    console.log('2. Clicking on the most critical package...');
    await topPackage.click();
    await page.waitForTimeout(3000);
    
    // Check the stats
    const stats = await page.$eval('#package-stats', el => el.textContent);
    console.log('   Impressive stats found!');
    
    await page.screenshot({ path: 'playwright-output/demo-critical-stats.png' });
  }
  
  // 3. Search for a heavy package
  console.log('\n3. Let\'s look at a package with deep dependencies...');
  await page.fill('#search', '');
  await page.type('#search', 'gcc', { delay: 100 });
  await page.waitForTimeout(3000);
  
  await page.screenshot({ path: 'playwright-output/demo-gcc-deps.png' });
  
  // 4. Navigate through dependencies
  console.log('\n4. Click on nodes to explore the dependency graph...');
  const nodes = await page.$$('circle');
  if (nodes.length > 5) {
    await nodes[5].click();
    await page.waitForTimeout(2000);
    console.log('   Navigated to a dependency!');
  }
  
  console.log('\n✨ Demo complete! The browser will stay open for exploration.');
  console.log('\nThings to try:');
  console.log('- Search for "python", "nodejs", "rust" to see their ecosystems');
  console.log('- Click any node to re-center and see its dependencies');
  console.log('- Check out the stats panel for impressive metrics');
  console.log('- Toggle "Show transitive dependencies" to see different views');
  
  // Keep browser open
  await new Promise(() => {});
}

demoImpressive().catch(console.error);