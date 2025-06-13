const { chromium } = require('playwright');

async function testClickNavigation() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Search for glibc first
  await page.type('#search', 'glibc');
  await page.waitForTimeout(3000);
  
  console.log('Initial search: glibc');
  await page.screenshot({ path: 'playwright-output/click-nav-1.png', fullPage: true });
  
  // Click on a dependent package (let's try to find gcc)
  const gccNode = await page.$('g.node:has-text("gcc")');
  if (gccNode) {
    console.log('Clicking on gcc node...');
    await gccNode.click();
    await page.waitForTimeout(3000);
    
    // Check if search box updated
    const searchValue = await page.$eval('#search', el => el.value);
    console.log('Search box now shows:', searchValue);
    
    await page.screenshot({ path: 'playwright-output/click-nav-2.png', fullPage: true });
    
    // Get current visualization state
    const state = await page.evaluate(() => {
      const circles = document.querySelectorAll('circle');
      const centerNode = Array.from(circles).find(c => {
        const transform = c.parentElement?.parentElement?.getAttribute('transform');
        return transform && transform.includes('translate(640'); // Near center
      });
      return {
        nodeCount: circles.length,
        centerNodeText: centerNode?.parentElement?.textContent || 'unknown'
      };
    });
    
    console.log('\nAfter clicking gcc:');
    console.log('Total nodes:', state.nodeCount);
    console.log('Center node (approx):', state.centerNodeText);
  } else {
    console.log('Could not find gcc node to click');
  }
  
  await browser.close();
}

testClickNavigation().catch(console.error);