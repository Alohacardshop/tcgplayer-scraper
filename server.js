import express from 'express';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.post('/scrape-price', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid URL' });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for the price element to show up
    await page.waitForSelector('.price-points__upper__price', { timeout: 10000 });

    const priceEl = await page.$('.price-points__upper__price');
    const price = await priceEl?.textContent();

    if (!price) {
      throw new Error('Price not found on page');
    }

    res.json({ price: price.trim() });

  } catch (err) {
    console.error('Scrape error:', err.message || err);
    res.status(500).json({
      error: err.message || 'Failed to scrape price data',
      details: 'Failed to scrape price data'
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.get('/', (req, res) => {
  res.send('Price scraper is running!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
