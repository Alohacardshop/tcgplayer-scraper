import { exec } from 'child_process';
import { promisify } from 'util';
import express from 'express';
import bodyParser from 'body-parser';
import { chromium } from 'playwright';

const execAsync = promisify(exec);

// Ensure Playwright's Chromium is installed at runtime
async function ensureChromium() {
  try {
    const browser = await chromium.launch();
    await browser.close();
  } catch (e) {
    console.log('Chromium not found, installing...');
    await execAsync('npx playwright install chromium');
  }
}
await ensureChromium();

const app = express();
app.use(bodyParser.json());

app.post('/scrape-price', async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes('tcgplayer.com/product')) {
    return res.status(400).json({ error: 'Invalid TCGPlayer URL' });
  }

  try {
    // Launch headless Chromium
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) ' +
                 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1',
      viewport: { width: 375, height: 667 }
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // Extract mobile view price
    const selector = '.spotlight__price';
    await page.waitForSelector(selector, { timeout: 10000 });
    const price = await page.$eval(selector, el => el.textContent.trim());

    await browser.close();
    res.json({ price });
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
