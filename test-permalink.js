const { chromium } = require('playwright');

// Ensure output directory exists
const fs = require('fs');
if (!fs.existsSync('playwright-output')) {
  fs.mkdirSync('playwright-output', { recursive: true });
}

async function testPermalink() {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();
  
  console.log('Testing permalink functionality...\n');
  
  // Test 1: Direct link to a package
  console.log('1. Testing direct link to curl package...');
  await page.goto('http://localhost:8081/#curl', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  
  // Check if curl is loaded
  const searchValue = await page.$eval('#search', el => el.value);
  console.log(`   Search box shows: ${searchValue}`);
  console.log(`   URL: ${page.url()}`);
  
  await page.screenshot({ path: 'playwright-output/permalink-curl.png' });
  
  // Test 2: Navigate to another package and check URL
  console.log('\n2. Clicking on a dependency node...');
  const nodes = await page.$$('circle');
  if (nodes.length > 1) {
    await nodes[1].click();
    await page.waitForTimeout(2000);
    
    const newUrl = page.url();
    const newSearch = await page.$eval('#search', el => el.value);
    console.log(`   New URL: ${newUrl}`);
    console.log(`   Search box: ${newSearch}`);
    
    // Test 3: Use browser back button
    console.log('\n3. Testing browser back button...');
    await page.goBack();
    await page.waitForTimeout(2000);
    
    const backUrl = page.url();
    const backSearch = await page.$eval('#search', el => el.value);
    console.log(`   After back - URL: ${backUrl}`);
    console.log(`   Search box: ${backSearch}`);
    
    // Test 4: Use browser forward button
    console.log('\n4. Testing browser forward button...');
    await page.goForward();
    await page.waitForTimeout(2000);
    
    const forwardUrl = page.url();
    const forwardSearch = await page.$eval('#search', el => el.value);
    console.log(`   After forward - URL: ${forwardUrl}`);
    console.log(`   Search box: ${forwardSearch}`);
  }
  
  // Test 5: Search for a package
  console.log('\n5. Testing search updates URL...');
  await page.fill('#search', '');
  await page.type('#search', 'python', { delay: 50 });
  await page.waitForTimeout(2000);
  
  const searchUrl = page.url();
  console.log(`   After search - URL: ${searchUrl}`);
  
  // Test 6: Copy link
  console.log('\n6. Shareable link test...');
  const shareableLink = page.url();
  console.log(`   Current shareable link: ${shareableLink}`);
  console.log('   You can share this link to show the same package!\n');
  
  await page.screenshot({ path: 'playwright-output/permalink-final.png' });
  
  console.log('Permalink testing complete! Browser will stay open for manual testing.');
  
  // Keep browser open
  await new Promise(() => {});
}

testPermalink().catch(console.error);