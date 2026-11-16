const puppeteer = require('puppeteer-core');
const axe = require('axe-core');
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
  { name: 'Home (index.html)', url: 'http://127.0.0.1:3105/index.html' },
  { name: '404 Page (404.html)', url: 'http://127.0.0.1:3105/404.html' },
  { name: 'Transformer Lesson', url: 'http://127.0.0.1:3105/lessons/transformer/index.html' },
  { name: 'Harness Lesson', url: 'http://127.0.0.1:3105/lessons/harness/index.html' },
  { name: 'Roofline Lesson', url: 'http://127.0.0.1:3105/lessons/roofline/index.html' },
];

const THEMES = ['light', 'dark'];

async function runAxeAudit() {
  const rootDir = path.resolve(__dirname, '..');
  const server = await createStaticServer(rootDir, 3105);
  console.log('Test static server started on http://127.0.0.1:3105');

  const execPath = getExecutablePath();
  console.log(`Using browser executable: ${execPath}`);

  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const fullResults = {};
  let totalCritical = 0;
  let totalSerious = 0;
  let totalModerate = 0;
  let totalMinor = 0;

  try {
    for (const pageInfo of PAGES) {
      fullResults[pageInfo.name] = {};
      for (const theme of THEMES) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.emulateMediaFeatures([
          { name: 'prefers-color-scheme', value: theme },
        ]);

        await page.goto(pageInfo.url, { waitUntil: 'networkidle0' });

        // Ensure theme class or data-theme matches if toggled
        await page.evaluate((th) => {
          document.documentElement.setAttribute('data-theme', th);
        }, theme);

        // Inject axe-core
        await page.evaluate(axe.source);

        // Run axe
        const results = await page.evaluate(async () => {
          return await window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
            },
          });
        });

        const violations = results.violations || [];
        const critical = violations.filter((v) => v.impact === 'critical');
        const serious = violations.filter((v) => v.impact === 'serious');
        const moderate = violations.filter((v) => v.impact === 'moderate');
        const minor = violations.filter((v) => v.impact === 'minor');

        totalCritical += critical.length;
        totalSerious += serious.length;
        totalModerate += moderate.length;
        totalMinor += minor.length;

        fullResults[pageInfo.name][theme] = {
          passes: results.passes.length,
          violations: violations.map((v) => ({
            id: v.id,
            impact: v.impact,
            description: v.description,
            help: v.help,
            helpUrl: v.helpUrl,
            nodes: v.nodes.map((n) => ({
              html: n.html,
              target: n.target,
              failureSummary: n.failureSummary,
            })),
          })),
        };

        console.log(
          `[AXE] ${pageInfo.name} (${theme}): ${results.passes.length} passes | ` +
            `Critical: ${critical.length}, Serious: ${serious.length}, Moderate: ${moderate.length}, Minor: ${minor.length}`
        );

        if (violations.length > 0) {
          violations.forEach((v) => {
            console.log(`    - [${v.impact.toUpperCase()}] ${v.id}: ${v.help} (${v.nodes.length} occurrences)`);
          });
        }

        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Save full JSON report
  const outputPath = path.join(__dirname, 'axe-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(fullResults, null, 2), 'utf-8');
  console.log(`\nFull axe results saved to: ${outputPath}`);

  console.log('\n============================================================');
  console.log('AXE-CORE ACCESSIBILITY AUDIT SUMMARY');
  console.log('============================================================');
  console.log(`Total Critical Violations: ${totalCritical}`);
  console.log(`Total Serious Violations:  ${totalSerious}`);
  console.log(`Total Moderate Violations: ${totalModerate}`);
  console.log(`Total Minor Violations:    ${totalMinor}`);

  if (totalCritical > 0 || totalSerious > 0) {
    console.log('\nFAILED: axe-core reported serious or critical accessibility violations.');
    return 1;
  } else {
    console.log('\nPASSED: 0 critical and 0 serious violations across all pages (WCAG AA compliant).');
    return 0;
  }
}

if (require.main === module) {
  runAxeAudit()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Fatal error running axe audit:', err);
      process.exit(1);
    });
}
