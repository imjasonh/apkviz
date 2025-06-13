const { chromium } = require('playwright');

async function testSearch() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  
  // Search for java
  await page.type('#search', 'java');
  await page.waitForTimeout(2000);
  
  // Check for errors
  const hasErrors = logs.some(log => log.includes('node not found'));
  console.log('Has errors after search:', hasErrors);
  
  if (hasErrors) {
    console.log('\nError logs:');
    logs.filter(log => log.includes('ERROR') || log.includes('error')).forEach(log => console.log(log));
  }
  
  // Take screenshot
  await page.screenshot({ path: 'playwright-output/search-result.png', fullPage: true });
  console.log('\nScreenshot saved to search-result.png');
  
  // Get visualization state
  const vizState = await page.evaluate(() => {
    const circles = document.querySelectorAll('circle');
    const lines = document.querySelectorAll('line');
    return {
      nodeCount: circles.length,
      linkCount: lines.length,
      nodes: Array.from(circles).slice(0, 5).map(c => c.parentElement?.textContent || 'unknown')
    };
  });
  
  console.log('\nVisualization state:');
  console.log(`Nodes: ${vizState.nodeCount}, Links: ${vizState.linkCount}`);
  console.log('First few nodes:', vizState.nodes);
  
  await browser.close();
}

testSearch().catch(console.error);