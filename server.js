import express from "express";
import { chromium, devices } from "playwright";

const app = express();
app.use(express.json());

const iPhone = devices["iPhone 12"];

app.post("/scrape-price", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("tcgplayer.com/product")) {
    return res.status(400).json({ error: "Invalid or missing TCGPlayer URL" });
  }

  try {
    const browser = await chromium.launch({ args: ["--no-sandbox"] });
    const context = await browser.newContext({ ...iPhone });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForSelector(".price-points__upper__price", { timeout: 10000 });
    const price = await page.$eval(".price-points__upper__price", el => el.textContent.trim());

    await browser.close();
    return res.json({ price });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ TCGPlayer Scraper is live!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
