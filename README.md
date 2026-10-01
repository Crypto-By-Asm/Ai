# Crypto Bot by ASM Traders

**GitHub Pages ready** — 100% client-side crypto signals, charts, demo trading & AI blog.

No server. No backend. No database. Everything runs in the browser.

## Live Features

- Live Binance market data (candlestick charts via Lightweight Charts)
- Technical indicators: RSI, MACD, EMA20/50/200, ADX, ATR, Volume
- Selective **LONG / SHORT / WAIT** signal engine
- Entry + Stop Loss + TP1/TP2/TP3 + Risk/Reward
- Dynamic signal validity (6–20 minutes)
- Local demo / paper trading (saved in browser)
- Local register/login (localStorage only)
- Optional Gemini AI explanations & blog generation (your own API key)

## Important

- Model score is **relative strength**, not a guaranteed win probability.
- No hard-coded 98%/99% accuracy claims.
- Educational tool only. Not financial advice.

## Deploy on GitHub Pages (2 minutes)

### Method 1 — New repository

1. Create a new GitHub repository (e.g. `crypto-bot-asm`)
2. Upload **all files** from this folder to the root of the repo  
   (or put them inside a `/docs` folder)
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` (or `master`) → folder: `/ (root)` or `/docs`
6. Save → wait 1–2 minutes
7. Open: `https://YOUR_USERNAME.github.io/REPO_NAME/`

### Method 2 — Already have a repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
# copy all files from this folder into the repo root
git add .
git commit -m "Deploy Crypto Bot by ASM Traders"
git push
```

Then enable GitHub Pages as above.

## Gemini API Key (optional)

1. Get a free key: https://aistudio.google.com/apikey
2. Open the website → scroll to **Settings**
3. Paste the key → Save
4. Key stays **only in your browser** (localStorage). Never sent to any of our servers.

## Local testing

Just open `index.html` in a browser, or:

```bash
# simple local server (optional)
npx serve .
# or
python -m http.server 8080
```

## File Structure

```
index.html
css/style.css
js/
  indicators.js      # RSI, MACD, EMA, ADX, ATR
  signal-engine.js   # LONG/SHORT/WAIT logic
  app.js             # UI, Binance, Gemini, Demo, Auth
README.md
```

## Notes for GitHub Pages

- Binance public API allows browser requests (CORS open)
- Gemini calls go directly from browser → Google (using your key)
- Auth & demo trades are stored in `localStorage` (per browser)
- No Python, no FastAPI, no SQLite required

---

Built for ASM Traders · 2026
