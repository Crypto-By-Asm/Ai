/**
 * Crypto Bot by ASM Traders - GitHub Pages (100% client-side)
 */

const BINANCE = "https://api.binance.com/api/v3/klines";
const BLOG_TOPICS = [
  "How crypto market volatility works",
  "How RSI is used in crypto analysis",
  "MACD explained for crypto traders",
  "EMA and trend identification",
  "What is ADX in technical analysis",
  "How volume confirms market moves",
  "Support and resistance basics",
  "How stop loss works",
  "How take profit works",
  "Risk reward ratio explained",
  "What is paper trading",
  "How backtesting works",
  "Multi timeframe crypto analysis",
  "Common crypto trading mistakes",
  "How to build a trading plan",
  "What is market liquidity",
  "Crypto candlestick basics",
  "How volatility affects stop loss",
  "How to avoid overtrading",
  "Understanding crypto market cycles",
  "Bitcoin dominance explained",
  "Altcoin market analysis basics",
  "Crypto trading indicators overview",
  "Why signals can fail",
  "How to evaluate a trading strategy",
  "Demo trading vs live trading",
  "How to read a crypto chart",
  "Trading psychology basics",
  "Risk management for beginners",
  "Crypto trading glossary",
];

let chart = null;
let candleSeries = null;
let currentSignal = null;
let currentUser = JSON.parse(localStorage.getItem("cb_user") || "null");

// ---------- Storage helpers ----------
function getUsers() {
  return JSON.parse(localStorage.getItem("cb_users") || "{}");
}
function saveUsers(users) {
  localStorage.setItem("cb_users", JSON.stringify(users));
}
function getDemo(email) {
  return JSON.parse(localStorage.getItem("cb_demo_" + email) || "null");
}
function saveDemo(email, data) {
  localStorage.setItem("cb_demo_" + email, JSON.stringify(data));
}
function getGeminiKey() {
  return localStorage.getItem("cb_gemini_key") || "";
}
function setGeminiKey(key) {
  if (key) localStorage.setItem("cb_gemini_key", key);
  else localStorage.removeItem("cb_gemini_key");
}

// ---------- Auth (localStorage only) ----------
function setCurrentUser(user) {
  currentUser = user;
  if (user) localStorage.setItem("cb_user", JSON.stringify(user));
  else localStorage.removeItem("cb_user");
  updateHeader();
  loadDemoAccount();
}

function updateHeader() {
  const el = document.getElementById("headerActions");
  if (currentUser) {
    el.innerHTML = `
      <span style="color:var(--muted);font-size:13px;margin-right:8px;">Hi, ${currentUser.username}</span>
      <button class="btn ghost" onclick="logout()">Logout</button>
    `;
    document.getElementById("accountTitle").textContent = `Welcome, ${currentUser.username}`;
    document.getElementById("accountDesc").textContent = "Local account active. Demo trades saved in this browser.";
    document.getElementById("accountActions").innerHTML = `<button class="btn ghost" onclick="logout()">Logout</button>`;
  } else {
    el.innerHTML = `
      <button class="btn ghost" onclick="openModal('login')">Login</button>
      <button class="btn primary" onclick="openModal('register')">Get Started</button>
    `;
    document.getElementById("accountTitle").textContent = "Local account";
    document.getElementById("accountDesc").textContent = "Register locally to save demo trades and preferences in this browser.";
    document.getElementById("accountActions").innerHTML = `<button class="btn primary" onclick="openModal('register')">Create Local Account</button>`;
  }
}

function openModal(type) {
  document.getElementById("authModal").classList.add("active");
  switchAuth(type);
  document.getElementById("authError").textContent = "";
}
function closeModal() {
  document.getElementById("authModal").classList.remove("active");
}
function switchAuth(type) {
  document.getElementById("loginForm").style.display = type === "login" ? "block" : "none";
  document.getElementById("registerForm").style.display = type === "register" ? "block" : "none";
}

function doRegister() {
  const username = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim().toLowerCase();
  const password = document.getElementById("regPassword").value;
  const err = document.getElementById("authError");
  if (!username || !email || password.length < 4) {
    err.textContent = "Please fill all fields (password min 4 chars).";
    return;
  }
  const users = getUsers();
  if (users[email]) {
    err.textContent = "Email already registered on this browser.";
    return;
  }
  users[email] = { username, email, password };
  saveUsers(users);
  // init demo
  saveDemo(email, {
    balance: 10000,
    equity: 10000,
    total_pnl: 0,
    win_count: 0,
    loss_count: 0,
    trades: [],
  });
  setCurrentUser({ username, email });
  closeModal();
}

function doLogin() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const err = document.getElementById("authError");
  const users = getUsers();
  const u = users[email];
  if (!u || u.password !== password) {
    err.textContent = "Incorrect email or password.";
    return;
  }
  setCurrentUser({ username: u.username, email: u.email });
  closeModal();
}

function logout() {
  setCurrentUser(null);
  document.getElementById("demoAccount").innerHTML = `<p class="muted">Login or register (local) to start paper trading.</p>`;
  document.getElementById("tradeHistory").innerHTML = `<p class="muted">No trades yet.</p>`;
}

// ---------- Gemini Key ----------
function saveGeminiKey() {
  const key = document.getElementById("geminiKey").value.trim();
  setGeminiKey(key);
  document.getElementById("keyStatus").textContent = key
    ? "Key saved in this browser only."
    : "Key cleared.";
}
function clearGeminiKey() {
  document.getElementById("geminiKey").value = "";
  setGeminiKey("");
  document.getElementById("keyStatus").textContent = "Key cleared.";
}

// ---------- Chart ----------
function initChart() {
  const container = document.getElementById("chart");
  if (!container || typeof LightweightCharts === "undefined") return;
  chart = LightweightCharts.createChart(container, {
    layout: {
      background: { type: "solid", color: "transparent" },
      textColor: "#91a6c0",
    },
    grid: {
      vertLines: { color: "rgba(148,163,184,0.08)" },
      horzLines: { color: "rgba(148,163,184,0.08)" },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: "rgba(148,163,184,0.2)" },
    timeScale: { borderColor: "rgba(148,163,184,0.2)", timeVisible: true },
    width: container.clientWidth,
    height: 420,
  });
  candleSeries = chart.addCandlestickSeries({
    upColor: "#4ade80",
    downColor: "#fb7185",
    borderUpColor: "#4ade80",
    borderDownColor: "#fb7185",
    wickUpColor: "#4ade80",
    wickDownColor: "#fb7185",
  });
  window.addEventListener("resize", () => {
    if (chart && container) chart.applyOptions({ width: container.clientWidth });
  });
}

// ---------- Market + Signal ----------
async function fetchKlines(symbol, interval, limit = 300) {
  const url = `${BINANCE}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Binance API error");
  const raw = await res.json();
  return raw.map(k => ({
    open_time: k[0],
    open: +k[1],
    high: +k[2],
    low: +k[3],
    close: +k[4],
    volume: +k[5],
    time: Math.floor(k[0] / 1000),
  }));
}

async function explainWithGemini(signal) {
  const key = getGeminiKey();
  if (!key) return "Add your Gemini API key in Settings to enable AI explanations.";

  const prompt = `You are a professional crypto market analyst for "Crypto Bot by ASM Traders".
Explain this signal in clear English under 200 words.
Do NOT invent numbers. Do NOT claim guaranteed profits.
Base explanation ONLY on provided data. Mention risks and invalidation.

SIGNAL:
${JSON.stringify(signal, null, 2)}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return `AI error: ${err.error?.message || res.statusText}`;
    }
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "No explanation returned.";
  } catch (e) {
    return `AI unavailable: ${e.message}`;
  }
}

async function loadDashboard() {
  const symbol = (document.getElementById("symbol").value || "BTCUSDT").trim().toUpperCase();
  const interval = document.getElementById("interval").value;
  const wantExplain = document.getElementById("aiExplain").checked;
  const panel = document.getElementById("signalPanel");
  panel.innerHTML = "<p class='muted'>Loading...</p>";

  try {
    const candles = await fetchKlines(symbol, interval, 300);
    const signal = generateSignal(candles);
    signal.symbol = symbol;
    signal.timeframe = interval;
    currentSignal = signal;

    // Chart
    if (candleSeries) {
      candleSeries.setData(
        candles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
      );
      chart.timeScale().fitContent();
    }

    const sideClass =
      signal.signal === "LONG" ? "signal-long" :
      signal.signal === "SHORT" ? "signal-short" : "signal-wait";
    const p = signal.plan || {};
    const ind = signal.indicators || {};

    let html = `
      <div class="mini-label">${signal.symbol} · ${signal.timeframe}</div>
      <div class="signal-main ${sideClass}">${signal.signal}</div>
      <div class="signal-meta">
        <div>Model score: <b>${(signal.score * 100).toFixed(0)}%</b> <small style="color:var(--muted)">(not a guaranteed probability)</small></div>
        <div>Price: <b>${Number(signal.price).toFixed(4)}</b></div>
        <div>Entry: <b>${p.entry ?? "—"}</b></div>
        <div>Stop Loss: <b>${p.stop_loss ?? "—"}</b></div>
        <div>TP1 / TP2 / TP3: <b>${p.tp1 ?? "—"}</b> / <b>${p.tp2 ?? "—"}</b> / <b>${p.tp3 ?? "—"}</b></div>
        <div>R:R (TP2): <b>${p.risk_reward_tp2 ?? "—"}</b></div>
        <div>Validity: <b>~${signal.duration_minutes} min</b></div>
        <div>RSI: <b>${ind.rsi ?? "—"}</b> · ADX: <b>${ind.adx ?? "—"}</b></div>
      </div>
    `;
    if (signal.reasons?.length) {
      html += `<ul class="reasons">${signal.reasons.map(r => `<li>${r}</li>`).join("")}</ul>`;
    }

    panel.innerHTML = html;

    if (wantExplain) {
      panel.innerHTML += `<div class="ai-box"><strong>AI Insight</strong><br>Generating...</div>`;
      const explanation = await explainWithGemini(signal);
      const box = panel.querySelector(".ai-box");
      if (box) box.innerHTML = `<strong>AI Insight</strong><br>${explanation.replace(/\n/g, "<br>")}`;
    }

    const btn = document.getElementById("btnOpenFromSignal");
    if (btn) btn.disabled = !(signal.signal === "LONG" || signal.signal === "SHORT") || !currentUser;
  } catch (e) {
    console.error(e);
    panel.innerHTML = `<p>Failed to load market data. ${e.message}</p>`;
  }
}

// ---------- Demo Trading ----------
function ensureDemo() {
  if (!currentUser) return null;
  let d = getDemo(currentUser.email);
  if (!d) {
    d = { balance: 10000, equity: 10000, total_pnl: 0, win_count: 0, loss_count: 0, trades: [] };
    saveDemo(currentUser.email, d);
  }
  return d;
}

function loadDemoAccount() {
  if (!currentUser) return;
  const d = ensureDemo();
  const openCount = d.trades.filter(t => t.is_open).length;
  const totalClosed = d.win_count + d.loss_count;
  const winRate = totalClosed ? ((d.win_count / totalClosed) * 100).toFixed(1) : 0;

  document.getElementById("demoAccount").innerHTML = `
    <div class="stat-row"><span>Balance</span><b>$${d.balance.toLocaleString(undefined,{maximumFractionDigits:2})}</b></div>
    <div class="stat-row"><span>Equity</span><b>$${d.equity.toLocaleString(undefined,{maximumFractionDigits:2})}</b></div>
    <div class="stat-row"><span>Total P&L</span><b class="${d.total_pnl >= 0 ? "pnl-pos" : "pnl-neg"}">$${d.total_pnl.toFixed(2)}</b></div>
    <div class="stat-row"><span>Win / Loss</span><b>${d.win_count} / ${d.loss_count}</b></div>
    <div class="stat-row"><span>Win Rate</span><b>${winRate}%</b></div>
    <div class="stat-row"><span>Open Trades</span><b>${openCount}</b></div>
  `;

  if (!d.trades.length) {
    document.getElementById("tradeHistory").innerHTML = `<p class="muted">No trades yet. Open one from a signal.</p>`;
  } else {
    const rows = [...d.trades].reverse().slice(0, 20).map((t, idx) => {
      const realIdx = d.trades.length - 1 - idx;
      return `
        <tr>
          <td>${t.symbol}</td>
          <td class="${t.side === "LONG" ? "pnl-pos" : "pnl-neg"}">${t.side}</td>
          <td>${Number(t.entry_price).toFixed(4)}</td>
          <td>${t.status}</td>
          <td class="${t.pnl >= 0 ? "pnl-pos" : "pnl-neg"}">${t.is_open ? "—" : "$" + t.pnl.toFixed(2)}</td>
          <td>${t.is_open ? `<button class="btn ghost" style="padding:4px 10px;font-size:12px;" onclick="closeTrade(${realIdx})">Close</button>` : "—"}</td>
        </tr>`;
    }).join("");
    document.getElementById("tradeHistory").innerHTML = `
      <table>
        <thead><tr><th>Symbol</th><th>Side</th><th>Entry</th><th>Status</th><th>P&L</th><th>Action</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>`;
  }
}

function openTradeFromSignal() {
  if (!currentUser || !currentSignal?.plan) {
    alert("Login and generate a LONG/SHORT signal first.");
    return;
  }
  const qty = prompt("Quantity (e.g. 0.01 for BTC):", "0.01");
  if (!qty || isNaN(qty) || +qty <= 0) return;

  const d = ensureDemo();
  const p = currentSignal.plan;
  const cost = +qty * p.entry;
  if (cost > d.balance) {
    alert("Insufficient demo balance.");
    return;
  }

  d.balance -= cost;
  d.equity = d.balance;
  d.trades.push({
    symbol: currentSignal.symbol,
    side: currentSignal.signal,
    entry_price: p.entry,
    stop_loss: p.stop_loss,
    tp1: p.tp1,
    tp2: p.tp2,
    tp3: p.tp3,
    quantity: +qty,
    status: "OPEN",
    exit_price: null,
    pnl: 0,
    is_open: true,
    opened_at: new Date().toISOString(),
  });
  saveDemo(currentUser.email, d);
  alert("Demo trade opened!");
  loadDemoAccount();
}

function closeTrade(idx) {
  if (!currentUser) return;
  const d = ensureDemo();
  const t = d.trades[idx];
  if (!t || !t.is_open) return;
  const price = prompt("Exit price:", String(t.entry_price));
  if (!price || isNaN(price)) return;

  const exit = +price;
  let pnl;
  if (t.side === "LONG") pnl = (exit - t.entry_price) * t.quantity;
  else pnl = (t.entry_price - exit) * t.quantity;

  t.exit_price = exit;
  t.pnl = +pnl.toFixed(4);
  t.status = "CLOSED";
  t.is_open = false;
  t.closed_at = new Date().toISOString();

  d.balance += t.quantity * t.entry_price + pnl;
  d.equity = d.balance;
  d.total_pnl += pnl;
  if (pnl >= 0) d.win_count++;
  else d.loss_count++;

  saveDemo(currentUser.email, d);
  alert(`Closed. P&L: $${pnl.toFixed(2)}`);
  loadDemoAccount();
}

// ---------- Blog ----------
function loadBlogTopics() {
  const container = document.getElementById("blogTopics");
  const saved = JSON.parse(localStorage.getItem("cb_blogs") || "{}");
  container.innerHTML = BLOG_TOPICS.map((topic, i) => {
    const article = saved[topic];
    return `
      <article class="glass blog-item" onclick="${article ? `showBlog('${encodeURIComponent(topic)}')` : `generateBlogFor('${encodeURIComponent(topic)}')`}">
        <div class="mini-label">${article ? "GENERATED" : "TOPIC"} ${String(i + 1).padStart(2, "0")}</div>
        <h3>${topic}</h3>
        <p>${article ? (article.excerpt || "Click to read") : "Click to generate with Gemini (key required)"}</p>
      </article>`;
  }).join("");
}

async function generateBlogFor(encodedTopic) {
  const topic = decodeURIComponent(encodedTopic);
  const key = getGeminiKey();
  if (!key) {
    alert("Please add your Gemini API key in the Settings section first.");
    document.getElementById("settings").scrollIntoView({ behavior: "smooth" });
    return;
  }

  const container = document.getElementById("blogTopics");
  // simple loading
  alert("Generating article... this may take 10-20 seconds.");

  const prompt = `Write a complete educational blog article (900-1200 words) on: "${topic}".
Use markdown headings. Professional, beginner-friendly. No guaranteed profit claims.
At the end after the article write exactly:
---META---
{"title":"...","excerpt":"2 sentence summary","reading_time_minutes":6}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error("Gemini API error");
    const data = await res.json();
    let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    let content = text;
    let meta = { title: topic, excerpt: topic, reading_time_minutes: 5 };
    if (text.includes("---META---")) {
      const [body, metaPart] = text.split("---META---");
      content = body.trim();
      try {
        const m = metaPart.replace(/```json|```/g, "").trim();
        meta = { ...meta, ...JSON.parse(m) };
      } catch (_) {}
    }
    const saved = JSON.parse(localStorage.getItem("cb_blogs") || "{}");
    saved[topic] = { content, ...meta };
    localStorage.setItem("cb_blogs", JSON.stringify(saved));
    loadBlogTopics();
    showBlog(encodedTopic);
  } catch (e) {
    alert("Failed to generate: " + e.message);
  }
}

function generateOneBlog() {
  // find first not generated
  const saved = JSON.parse(localStorage.getItem("cb_blogs") || "{}");
  const next = BLOG_TOPICS.find(t => !saved[t]);
  if (!next) {
    alert("All 30 topics already generated in this browser.");
    return;
  }
  generateBlogFor(encodeURIComponent(next));
}

function showBlog(encodedTopic) {
  const topic = decodeURIComponent(encodedTopic);
  const saved = JSON.parse(localStorage.getItem("cb_blogs") || "{}");
  const article = saved[topic];
  if (!article) return;
  document.getElementById("blogModalContent").innerHTML = `
    <div class="mini-label">${article.reading_time_minutes || 5} min read</div>
    <h2 style="margin-bottom:12px;">${article.title || topic}</h2>
    <div class="blog-content">${simpleMarkdown(article.content)}</div>
  `;
  document.getElementById("blogModal").classList.add("active");
}
function closeBlogModal() {
  document.getElementById("blogModal").classList.remove("active");
}

function simpleMarkdown(text) {
  return text
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h2>$1</h2>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>");
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  initChart();
  updateHeader();
  loadDashboard();
  loadBlogTopics();
  if (currentUser) loadDemoAccount();

  const key = getGeminiKey();
  if (key) {
    document.getElementById("geminiKey").value = key;
    document.getElementById("keyStatus").textContent = "Key loaded from this browser.";
  }

  setInterval(() => loadDashboard().catch(console.error), 60000);

  document.getElementById("authModal")?.addEventListener("click", e => {
    if (e.target.id === "authModal") closeModal();
  });
  document.getElementById("blogModal")?.addEventListener("click", e => {
    if (e.target.id === "blogModal") closeBlogModal();
  });
});
