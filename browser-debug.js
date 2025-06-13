const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function debugWebApp() {
  const browser = await chromium.launch({
    headless: false, // Set to true for headless mode
    devtools: true  // Opens DevTools automatically
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Create debug output directory
  const debugDir = path.join(__dirname, 'playwright-output');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }

  // Capture console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleLogs.push(logEntry);
    console.log(`[${logEntry.type}] ${logEntry.text}`);
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    const errorEntry = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    pageErrors.push(errorEntry);
    console.error('Page error:', error.message);
  });

  // Capture network failures
  const networkErrors = [];
  page.on('requestfailed', request => {
    const failureEntry = {
      url: request.url(),
      method: request.method(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    };
    networkErrors.push(failureEntry);
    console.error('Request failed:', request.url(), request.failure());
  });

  try {
    // Navigate to your app
    console.log('Navigating to http://localhost:8080...');
    await page.goto('http://localhost:8080', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Wait a bit for any dynamic content
    await page.waitForTimeout(2000);

    // Take screenshots
    await page.screenshot({ 
      path: path.join(debugDir, 'screenshot-full.png'), 
      fullPage: true 
    });
    console.log('Screenshot saved to playwright-output/screenshot-full.png');

    // Get page metrics
    const metrics = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: {
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
      }
    }));

    // Save debug information
    const debugInfo = {
      timestamp: new Date().toISOString(),
      metrics,
      consoleLogs,
      pageErrors,
      networkErrors
    };

    fs.writeFileSync(
      path.join(debugDir, 'debug-info.json'),
      JSON.stringify(debugInfo, null, 2)
    );
    console.log('Debug info saved to playwright-output/debug-info.json');

    // Optional: Interactive debugging
    // Uncomment to pause and allow manual interaction
    // console.log('Browser is open. Press Ctrl+C to close...');
    // await page.pause();

  } catch (error) {
    console.error('Error during debugging:', error);
    await page.screenshot({ 
      path: path.join(debugDir, 'error-screenshot.png') 
    });
  }

  // Keep browser open for manual inspection if needed
  // Comment out to auto-close
  console.log('Browser will remain open. Press Ctrl+C to exit...');
  await new Promise(() => {}); // Keep script running

  // Uncomment to auto-close
  // await browser.close();
}

// Run the debug script
debugWebApp().catch(console.error);