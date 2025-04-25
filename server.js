import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 10000;
app.use(express.json());

app.get("/", (req, res) => res.send("✅ TCGPlayer Scraper is live!"));

app.post("/scrape-price", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes("tcgplayer.com/product"))
    return res.status(400).json({ error: "Invalid TCGPlayer URL" });

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox","--disable-setuid-sandbox"]
    });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 15_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Mobile/15E148 Safari/604.1"
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Try multiple selectors
    const selectors = [
      ".price-points__upper__price",
      ".spotlight__price"
    ];
    let price = null;
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 10000 });
        price = await page.$eval(sel, el => el.textContent.trim());
        break;
      } catch {}
    }
    if (!price) throw new Error("Could not find price with any selector");

    res.json({ price });
  } catch (err) {
    console.error("Scrape error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
