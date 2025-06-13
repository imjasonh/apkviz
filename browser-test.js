const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runBrowserTest(options = {}) {
  const {
    url = 'http://localhost:8080',
    headless = true,
    actions = [],
    waitForSelector = null,
    screenshotName = 'test-screenshot.png'
  } = options;

  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  const results = {
    timestamp: new Date().toISOString(),
    url,
    consoleLogs: [],
    errors: [],
    networkErrors: [],
    screenshots: []
  };

  // Set up event listeners
  page.on('console', msg => {
    results.consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      args: msg.args().length
    });
  });

  page.on('pageerror', error => {
    results.errors.push({
      message: error.message,
      stack: error.stack
    });
  });

  page.on('requestfailed', request => {
    results.networkErrors.push({
      url: request.url(),
      failure: request.failure()
    });
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // Wait for specific selector if provided
    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    // Execute custom actions
    for (const action of actions) {
      switch (action.type) {
        case 'click':
          await page.click(action.selector);
          break;
        case 'type':
          await page.type(action.selector, action.text);
          break;
        case 'wait':
          await page.waitForTimeout(action.duration);
          break;
        case 'waitForSelector':
          await page.waitForSelector(action.selector);
          break;
        case 'evaluate':
          results.customEval = await page.evaluate(action.fn);
          break;
      }
    }

    // Take screenshot
    const screenshotPath = path.join(__dirname, 'debug-output', screenshotName);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    results.screenshots.push(screenshotName);

    // Get page state
    results.pageState = await page.evaluate(() => ({
      title: document.title,
      url: window.location.href,
      bodyText: document.body.innerText.substring(0, 500),
      elementCount: document.querySelectorAll('*').length,
      hasErrors: document.querySelectorAll('.error, .alert-danger, [data-error]').length > 0
    }));

  } catch (error) {
    results.error = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    await browser.close();
  }

  return results;
}

// Example usage
async function exampleTests() {
  // Basic page load test
  console.log('Running basic page load test...');
  const basicTest = await runBrowserTest({
    url: 'http://localhost:8080',
    screenshotName: 'basic-load.png'
  });
  console.log('Console logs:', basicTest.consoleLogs.length);
  console.log('Errors:', basicTest.errors.length);

  // Test with interactions
  console.log('\nRunning interaction test...');
  const interactionTest = await runBrowserTest({
    url: 'http://localhost:8080',
    actions: [
      { type: 'wait', duration: 1000 },
      // Add more actions as needed based on your app
      // { type: 'click', selector: '#some-button' },
      // { type: 'type', selector: '#search-input', text: 'test query' },
    ],
    screenshotName: 'after-interaction.png'
  });

  // Save results
  const debugDir = path.join(__dirname, 'debug-output');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir);
  }

  fs.writeFileSync(
    path.join(debugDir, 'test-results.json'),
    JSON.stringify({ basicTest, interactionTest }, null, 2)
  );
  console.log('\nTest results saved to playwright-output/test-results.json');
}

// Export for use in other scripts
module.exports = { runBrowserTest };

// Run if called directly
if (require.main === module) {
  exampleTests().catch(console.error);
}