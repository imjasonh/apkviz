const { chromium } = require('playwright');

// Ensure output directory exists
const fs = require('fs');
if (!fs.existsSync('playwright-output')) {
  fs.mkdirSync('playwright-output', { recursive: true });
}

async function testStats() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Search for different packages to see their stats
  const testPackages = ['glibc', 'gcc', 'python', 'nodejs'];
  
  for (const pkg of testPackages) {
    console.log(`\nTesting ${pkg}...`);
    
    // Clear search and type new package
    await page.fill('#search', '');
    await page.type('#search', pkg, { delay: 50 });
    await page.waitForTimeout(2000);
    
    // Check if stats are visible
    const statsVisible = await page.$('#package-stats');
    if (statsVisible) {
      const statsContent = await page.$eval('#package-stats', el => el.textContent);
      console.log('Stats found:', statsContent.substring(0, 100) + '...');
      
      // Take screenshot
      await page.screenshot({ path: `stats-${pkg}.png`, fullPage: true });
    } else {
      console.log('No stats panel found');
    }
  }
  
  console.log('\nKeeping browser open for manual inspection...');
  // Keep browser open
  await new Promise(() => {});
}

testStats().catch(console.error);