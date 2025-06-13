const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function quickDebug(command = 'screenshot') {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console output
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[ERROR] ${err.message}`));
  page.on('requestfailed', req => logs.push(`[NETWORK] Failed: ${req.url()}`));

  try {
    await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 10000 });
    
    switch(command) {
      case 'screenshot':
        await page.screenshot({ path: 'playwright-output/debug.png', fullPage: true });
        console.log('Screenshot saved to debug.png');
        break;
        
      case 'console':
        await page.waitForTimeout(2000);
        logs.forEach(log => console.log(log));
        break;
        
      case 'state':
        const state = await page.evaluate(() => ({
          title: document.title,
          url: window.location.href,
          errors: Array.from(document.querySelectorAll('.error, [data-error]')).map(el => el.textContent),
          bodyPreview: document.body.innerText.substring(0, 200)
        }));
        console.log(JSON.stringify(state, null, 2));
        break;
        
      case 'click':
        const selector = process.argv[3];
        if (selector) {
          await page.click(selector);
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'after-click.png', fullPage: true });
          console.log('Clicked and saved screenshot');
        }
        break;
    }
    
    // Always save logs
    // Ensure output directory exists
    if (!fs.existsSync('playwright-output')) {
      fs.mkdirSync('playwright-output');
    }
    fs.writeFileSync('playwright-output/debug-logs.txt', logs.join('\n'));
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'playwright-output/error.png' }).catch(() => {});
  }
  
  await browser.close();
}

quickDebug(process.argv[2]);