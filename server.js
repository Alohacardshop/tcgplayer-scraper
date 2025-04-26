import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors()); // ✅ Allow Cross-Origin requests
app.use(express.json());

app.post('/scrape-price', async (req, res) => {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Emulate mobile user-agent
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Wait for the mobile price element
    const priceElement = await page.waitForSelector('.price-points__upper__price', { timeout: 10000 });

    const price = await priceElement.textContent();

    if (!price) {
      throw new Error('Price not found on page');
    }

    res.json({ price: price.trim() });

  } catch (error) {
    console.error('Scrape error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to scrape price data' });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
