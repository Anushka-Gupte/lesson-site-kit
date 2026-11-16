const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');
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

async function runLighthouseAudit() {
  const rootDir = path.resolve(__dirname, '..');
  const lhDir = path.join(__dirname, 'lighthouse');
  if (!fs.existsSync(lhDir)) {
    fs.mkdirSync(lhDir, { recursive: true });
  }

  const server = await createStaticServer(rootDir, 3105);
  console.log('Test static server started on http://127.0.0.1:3105');

  const execPath = getExecutablePath();
  const browser = await puppeteer.launch({
    executablePath: execPath,
    headless: true,
    args: ['--remote-debugging-port=9222', '--no-sandbox', '--disable-gpu'],
  });

  const endpoint = browser.wsEndpoint();
  const port = 9222;

  const lighthouse = (await import('lighthouse')).default;
  const results = {};

  try {
    for (const p of PAGES) {
      console.log(`\n[LIGHTHOUSE] Auditing ${p.name} (Mobile)...`);
      const runnerResult = await lighthouse(p.url, {
        port,
        output: 'json',
        logLevel: 'error',
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 360,
          height: 640,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttlingMethod: 'provided', // Do not artificially throttle local file serving
      });

      const reportJson = JSON.parse(runnerResult.report);
      const categories = reportJson.categories;

      const scores = {
        performance: Math.round((categories.performance ? categories.performance.score : 0) * 100),
        accessibility: Math.round((categories.accessibility ? categories.accessibility.score : 0) * 100),
        bestPractices: Math.round((categories['best-practices'] ? categories['best-practices'].score : 0) * 100),
        seo: Math.round((categories.seo ? categories.seo.score : 0) * 100),
      };

      results[p.slug] = {
        name: p.name,
        url: p.url,
        scores,
      };

      // Save individual report
      fs.writeFileSync(path.join(lhDir, `${p.slug}.json`), runnerResult.report, 'utf-8');

      console.log(`  Performance:    ${scores.performance}`);
      console.log(`  Accessibility:  ${scores.accessibility}`);
      console.log(`  Best Practices: ${scores.bestPractices}`);
      console.log(`  SEO:            ${scores.seo}`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  // Save consolidated scores
  const summaryPath = path.join(__dirname, 'lighthouse-scores.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`\nConsolidated Lighthouse scores saved to: ${summaryPath}`);

  console.log('\n============================================================');
  console.log('LIGHTHOUSE MOBILE AUDIT SUMMARY');
  console.log('============================================================');
  console.log('Page                  | Perf | A11y | BestPractices | SEO');
  console.log('----------------------|------|------|---------------|----');
  for (const [slug, data] of Object.entries(results)) {
    const s = data.scores;
    console.log(
      `${slug.padEnd(21)} | ${String(s.performance).padStart(4)} | ${String(s.accessibility).padStart(4)} | ${String(s.bestPractices).padStart(13)} | ${String(s.seo).padStart(3)}`
    );
  }

  return 0;
}

if (require.main === module) {
  runLighthouseAudit()
    .then((code) => process.exit(code))
    .catch((err) => {
      console.error('Fatal error running Lighthouse audit:', err);
      process.exit(1);
    });
}
