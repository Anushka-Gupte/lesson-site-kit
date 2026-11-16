const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const { createStaticServer } = require('./server');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

function getExecutablePath() {
  for (const p of CHROME_PATHS) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No Chrome or Edge browser executable found on system.');
}

const PAGES = [
  { slug: 'home', name: 'Home (index.html)', url: 'http://127.0.0.1:3105/index.html' },
  { slug: '404', name: '404 Page (404.html)', url: 'http://127.0.0.1:3105/404.html' },
  { slug: 'transformer', name: 'Transformer Lesson', url: 'http://127.0.0.1:3105/lessons/transformer/index.html' },
  { slug: 'harness', name: 'Harness Lesson', url: 'http://127.0.0.1:3105/lessons/harness/index.html' },
  { slug: 'roofline', name: 'Roofline Lesson', url: 'http://127.0.0.1:3105/lessons/roofline/index.html' },
];

const VIEWPORTS = [
  { name: '360px', width: 360, height: 640 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1280px', width: 1280, height: 800 },
];

const THEMES = ['light', 'dark'];

async function runResponsiveChecks() {
  const rootDir = path.resolve(__dirname, '..');
  const screensDir = path.join(__dirname, 'screens');
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  const server = await createStaticServer(rootDir, 3105);
  console.log('Test static server started on http://127.0.0.1:3105');

  const execPath = getExecutablePath();
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const results = [];
  let overflowCount = 0;
  let consoleErrorCount = 0;

  try {
    for (const pageInfo of PAGES) {
      for (const vp of VIEWPORTS) {
        for (const theme of THEMES) {
          const page = await browser.newPage();
          const pageConsoleErrors = [];

          page.on('console', (msg) => {
            if (msg.type() === 'error') {
              pageConsoleErrors.push(msg.text());
            }
          });

          page.on('pageerror', (err) => {
            pageConsoleErrors.push(err.message || String(err));
          });

          await page.setViewport({ width: vp.width, height: vp.height });
          await page.emulateMediaFeatures([
            { name: 'prefers-color-scheme', value: theme },
          ]);

          await page.goto(pageInfo.url, { waitUntil: 'networkidle0' });

          // Set data-theme attribute
          await page.evaluate((th) => {
            document.documentElement.setAttribute('data-theme', th);
          }, theme);

          // Allow any transitions to settle
          await new Promise((r) => setTimeout(r, 200));

          // Check horizontal overflow
          const overflowData = await page.evaluate(() => {
            const docWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const bodyScrollWidth = document.body ? document.body.scrollWidth : 0;
            const maxScroll = Math.max(scrollWidth, bodyScrollWidth);
            const hasOverflow = maxScroll > docWidth + 1; // 1px threshold for subpixel rounding

            let offending = [];
            if (hasOverflow) {
              const allElements = document.querySelectorAll('*');
              for (const el of allElements) {
                const rect = el.getBoundingClientRect();
                if (rect.right > docWidth + 1) {
                  offending.push({
                    tag: el.tagName.toLowerCase(),
                    id: el.id,
                    className: el.className,
                    right: Math.round(rect.right),
                    docWidth: docWidth,
                  });
                  if (offending.length >= 5) break;
                }
              }
            }

            return {
              clientWidth: docWidth,
              scrollWidth: maxScroll,
              hasOverflow,
              offending,
            };
          });

          if (overflowData.hasOverflow) {
            overflowCount++;
          }
          if (pageConsoleErrors.length > 0) {
            consoleErrorCount += pageConsoleErrors.length;
          }

          // Capture Screenshot
          const screenshotName = `${pageInfo.slug}-${vp.name}-${theme}.png`;
          const screenshotPath = path.join(screensDir, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          results.push({
            page: pageInfo.name,
            slug: pageInfo.slug,
            viewport: vp.name,
            theme,
            hasOverflow: overflowData.hasOverflow,
            scrollWidth: overflowData.scrollWidth,
            clientWidth: overflowData.clientWidth,
            offendingElements: overflowData.offending,
            consoleErrors: pageConsoleErrors,
            screenshot: screenshotName,
          });

          const statusStr = [
            overflowData.hasOverflow ? 'OVERFLOW_FAIL' : 'OK',
            pageConsoleErrors.length > 0 ? `${pageConsoleErrors.length}_CONSOLE_ERRORS` : 'NO_ERRORS',
          ].join(' | ');

          console.log(`[RESPONSIVE] ${pageInfo.slug} @ ${vp.name} (${theme}) -> ${statusStr} (Saved ${screenshotName})`);

          await page.close();
        }
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Save JSON report
  const outputPath = path.join(__dirname, 'responsive-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nResponsive results saved to: ${outputPath}`);

  console.log('\n============================================================');
  console.log('RESPONSIVE & VIEWPORT AUDIT SUMMARY');
  console.log('============================================================');
  console.log(`Total configurations checked: ${results.length} (5 pages x 3 viewports x 2 themes)`);
  console.log(`Horizontal Overflows detected: ${overflowCount}`);
  console.log(`Console Errors detected:       ${consoleErrorCount}`);

  if (overflowCount > 0 || consoleErrorCount > 0) {
    console.log('\nFAILED: Layout overflows or console errors detected.');
    return 1;
  } else {
    console.log('\nPASSED: 0 horizontal overflows and 0 console errors across all viewports and themes.');
    return 0;
  }
}

if (require.main === module) {
  runResponsiveChecks()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Fatal error running responsive checks:', err);
      process.exit(1);
    });
}
