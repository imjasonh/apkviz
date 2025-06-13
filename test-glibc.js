const { chromium } = require('playwright');

async function testGlibc() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Search for glibc
  await page.type('#search', 'glibc');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'playwright-output/glibc-deps.png', fullPage: true });
  console.log('Screenshot saved to glibc-deps.png');
  
  // Get visualization state
  const vizState = await page.evaluate(() => {
    const circles = document.querySelectorAll('circle');
    const lines = document.querySelectorAll('line');
    return {
      nodeCount: circles.length,
      linkCount: lines.length,
      linkTypes: Array.from(lines).map(l => l.getAttribute('class')).filter((v, i, a) => a.indexOf(v) === i)
    };
  });
  
  console.log('\nVisualization state:');
  console.log(`Nodes: ${vizState.nodeCount}, Links: ${vizState.linkCount}`);
  console.log('Link types:', vizState.linkTypes);
  
  // Check for errors
  const errors = logs.filter(log => log.includes('ERROR') || log.includes('error'));
  if (errors.length > 0) {
    console.log('\nErrors found:');
    errors.forEach(err => console.log(err));
  }
  
  await browser.close();
}

testGlibc().catch(console.error);