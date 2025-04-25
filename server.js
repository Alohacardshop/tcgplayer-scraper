import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ TCGPlayer Scraper is live!");
});

app.post("/scrape-price", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes("tcgplayer.com/product")) {
    return res.status(400).json({ error: "Invalid TCGPlayer URL" });
  }

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1"
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".price-points__upper__price", { timeout: 10000 });
    const price = await page.$eval(".price-points__upper__price", el => el.textContent.trim());
    res.json({ price });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
