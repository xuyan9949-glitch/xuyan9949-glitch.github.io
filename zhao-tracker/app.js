const STORAGE_KEY = "zhao-tracker-data-v5";
const LEGACY_KEYS = [];
const THEME_KEY = "zhao-tracker-theme";
const SHARED_DATA_URL = "./data/tracker-data.json";
const QUOTE_API_URL = "https://quotes.xxyalpha.cn/quotes";
const CANDLE_API_URL = "https://quotes.xxyalpha.cn/candles";
const TRADE_API_URL = "http://127.0.0.1:18765/trades";
const QUOTE_REFRESH_MS = 30000;
const QUOTE_SYMBOL_ALIASES = { "谷歌A":"GOOGL" };
const buyActions = ["买入", "加仓"];
const sellActions = ["减仓", "卖出", "清仓"];

const demoTrades = [
  { id: crypto.randomUUID(), name:"AVGO", code:"AVGO", action:"买入", positionType:"波段仓", price:397, positionChange:10, date:daysAgo(12,10), note:"截图复盘：397 那部分，默认 10%" },
  { id: crypto.randomUUID(), name:"AVGO", code:"AVGO", action:"加仓", positionType:"波段仓", price:361, positionChange:10, date:daysAgo(10,10), note:"截图复盘：361 那部分，默认 10%" },
  { id: crypto.randomUUID(), name:"NOK", code:"NOK", action:"买入", positionType:"波段仓", price:12.05, positionChange:10, date:daysAgo(9,10), note:"截图复盘：12.05 成本，默认 10%" },
  { id: crypto.randomUUID(), name:"LITE", code:"LITE", action:"买入", positionType:"波段仓", price:691, positionChange:10, date:daysAgo(8,10), note:"截图复盘：691 成本，默认 10%" },
  { id: crypto.randomUUID(), name:"NVDL", code:"NVDL", action:"买入", positionType:"波段仓", price:28.35, positionChange:10, date:daysAgo(7,10), note:"截图复盘：28.35 成本，默认 10%" },
  { id: crypto.randomUUID(), name:"AVGO", code:"AVGO", action:"减仓", positionType:"波段仓", price:403.5, positionChange:15, date:daysAgo(1,20), note:"403.5 出掉 397 的那部分；361 的 AVGO 出一半" },
  { id: crypto.randomUUID(), name:"NOK", code:"NOK", action:"减仓", positionType:"波段仓", price:12.35, positionChange:5, date:daysAgo(1,20), note:"12.35 出掉，12.05 成本剩下一半" },
  { id: crypto.randomUUID(), name:"LITE", code:"LITE", action:"减仓", positionType:"波段仓", price:738.2, positionChange:5, date:daysAgo(1,20), note:"738.2 出掉，691 成本剩下一半" },
  { id: crypto.randomUUID(), name:"NVDL", code:"NVDL", action:"减仓", positionType:"波段仓", price:31.58, positionChange:5, date:daysAgo(1,20), note:"31.58 出掉，28.35 成本剩下一半" }
];

let state = { trades: [], accountCapital: 100000, isDemo: false, source: "loading", quotes: {}, quoteUpdatedAt: "", quoteError: "", candles: {}, candleError: "" };
let rangeDays = 30;
let returnRangeDays = 30;
let analysisDays = 30;
let sortKey = "position";
let sortDirection = -1;

function daysAgo(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}
function normalizeTrade(t) {
  const symbol = String(t.symbol || t.name || t.code || "").trim().toUpperCase();
  return {
    id:t.id||crypto.randomUUID(),
    name:symbol,
    code:symbol,
    action:t.action,
    positionType:t.positionType==="底仓"?"底仓":"波段仓",
    price:Number(t.price),
    positionChange:Number(t.positionChange || 10),
    date:new Date(t.date || Date.now()).toISOString(),
    closeLotId:String(t.closeLotId||""),
    note:String(t.note||"")
  };
}
function fallbackState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.trades) return { trades:saved.trades.map(normalizeTrade), accountCapital:Number(saved.accountCapital)||100000, isDemo:false, source:"local" };
    for (const key of LEGACY_KEYS) {
      const legacy = JSON.parse(localStorage.getItem(key));
      if (legacy?.trades) return { trades:legacy.trades.map(normalizeTrade), accountCapital:Number(legacy.accountCapital)||100000, isDemo:false, source:"local" };
    }
    return { trades: demoTrades.map(normalizeTrade), accountCapital:100000, isDemo: true, source:"demo" };
  } catch { return { trades: demoTrades.map(normalizeTrade), accountCapital:100000, isDemo: true, source:"demo" }; }
}
async function loadSharedState() {
  try {
    const res = await fetch(`${SHARED_DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data.trades)) throw new Error("共享数据缺少 trades");
    return {
      trades:data.trades.map(normalizeTrade),
      accountCapital:Number(data.accountCapital)||100000,
      updatedAt:data.updatedAt||"",
      isDemo:false,
      source:"shared"
    };
  } catch (err) {
    const fallback = fallbackState();
    fallback.loadError = err.message;
    return fallback;
  }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
async function syncSharedTrade(operation, trade) {
  const response = await fetch(TRADE_API_URL, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({operation,trade})
  });
  const result = await response.json().catch(()=>({}));
  if (!response.ok || !result.ok) throw new Error(result.error || "同步服务暂时不可用");
  return result;
}
function esc(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmt(n,digits=1) { return Number(n || 0).toFixed(digits).replace(/\.0$/,""); }
function money(n) { return `$${fmt(n,2)}`; }
function usd(n) {
  const sign = Number(n) < 0 ? "-" : "";
  return `${sign}$${Math.abs(Number(n)||0).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2})}`;
}
function setText(id,text) { document.getElementById(id).textContent=text; }
function quoteSymbol(code) { return QUOTE_SYMBOL_ALIASES[code] || code; }
function quoteFor(code) { return state.quotes?.[quoteSymbol(code)] || null; }
function currentCostMarkup(holding) {
  const quote = quoteFor(holding.code);
  if (!quote) return `<div class="quote-stack quote-pending"><b>—</b><small>${state.quoteError ? "行情未连接" : "读取中"}</small></div>`;
  return `<div class="quote-stack"><b>${money(quote.last)}</b><small>成本 ${money(holding.cost)}</small></div>`;
}
function pnlMarkup(amount, pct, pending=false) {
  if (pending || !Number.isFinite(pct)) return `<div class="pnl-stack quote-pending"><b>—</b><small>等待昨收价</small></div>`;
  const cls = pct >= 0 ? "up" : "down";
  return `<div class="pnl-stack ${cls}"><b>${usd(amount)}</b><small>${pct>=0?"+":""}${fmt(pct,2)}%</small></div>`;
}
function dayPnlMarkup(holding, capital) {
  const quote = quoteFor(holding.code);
  const prevClose = Number(quote?.prevClose);
  if (!quote || !(prevClose > 0)) return pnlMarkup(0, NaN, true);
  const pct = (quote.last - prevClose) / prevClose * 100;
  return pnlMarkup(capital * holding.position / 100 * pct / 100, pct);
}
function holdingPnlMarkup(holding, capital) {
  const quote = quoteFor(holding.code);
  if (!quote || !(holding.cost > 0)) return pnlMarkup(0, NaN, true);
  const pct = (quote.last - holding.cost) / holding.cost * 100;
  return pnlMarkup(capital * holding.position / 100 * pct / 100, pct);
}
async function refreshQuotes() {
  const holdings = getHoldings();
  if (!holdings.length) return;
  const status = document.getElementById("quoteStatus");
  try {
    const symbols = [...new Set(holdings.map(h=>quoteSymbol(h.code)).filter(code=>/^[A-Z0-9.-]{1,20}$/.test(code)))].join(",");
    if (!symbols) throw new Error("没有可查询的股票代码");
    const response = await fetch(`${QUOTE_API_URL}?symbols=${encodeURIComponent(symbols)}`, { cache:"no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.quotes = data.quotes || {};
    state.quoteUpdatedAt = data.updatedAt || new Date().toISOString();
    state.quoteError = "";
    if (status) {
      status.className = "market-status quote-status connected";
      status.textContent = `实时行情 · ${new Intl.DateTimeFormat("zh-CN",{hour:"2-digit",minute:"2-digit",hour12:false}).format(new Date(state.quoteUpdatedAt))}`;
    }
  } catch (error) {
    state.quoteError = error.message;
    if (status) {
      status.className = "market-status quote-status disconnected";
      status.textContent = "本机行情未连接";
    }
  }
  render();
}
async function refreshAccountReturnHistory() {
  const symbols = [...new Set(state.trades.map(trade=>quoteSymbol(trade.code)).filter(code=>/^[A-Z0-9.-]{1,20}$/.test(code)))];
  if (!symbols.length) return;
  try {
    const response = await fetch(`${CANDLE_API_URL}?symbols=${encodeURIComponent(symbols.join(","))}&days=90`, { cache:"no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    state.candles = data.candles || {};
    state.candleError = "";
  } catch (error) {
    state.candleError = error.message;
  }
  renderReturnChart();
}
function value(id){ return document.getElementById(id).value; }
function isSell(action) { return sellActions.includes(action); }
function formatDate(value, includeTime=false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const opts = { month:"2-digit", day:"2-digit" };
  if (includeTime) Object.assign(opts,{hour:"2-digit",minute:"2-digit",hour12:false});
  return new Intl.DateTimeFormat("zh-CN",opts).format(d).replace(/\//g,".");
}
function marketDateKey(value) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone:"Asia/Shanghai", year:"numeric", month:"2-digit", day:"2-digit" }).formatToParts(new Date(value));
  const pick = type => parts.find(part=>part.type===type)?.value;
  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

function computeLedger(trades=state.trades) {
  const ordered = [...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const lots = [];
  const pairs = [];

  for (const t of ordered) {
    const pos = Number(t.positionChange) || 0;
    if (buyActions.includes(t.action)) {
      lots.push({ ...t, lotId:t.id, openPosition:pos, remainingPosition:pos });
      continue;
    }
    if (!isSell(t.action)) continue;

    let remainingPos = t.action === "清仓" && pos <= 0 ? 100 : pos;
    const candidates = t.closeLotId
      ? lots.filter(l=>l.lotId===t.closeLotId && l.remainingPosition>0)
      : lots.filter(l=>l.code===t.code && l.remainingPosition>0);

    for (const lot of candidates) {
      if (remainingPos <= 0) break;
      const matchedPosition = Math.min(remainingPos, lot.remainingPosition);
      const pnlPct = lot.price ? (Number(t.price)-Number(lot.price))/Number(lot.price)*100 : 0;
      const contribution = matchedPosition * pnlPct / 100;

      lot.remainingPosition = Math.max(0, lot.remainingPosition - matchedPosition);
      remainingPos = Math.max(0, remainingPos - matchedPosition);

      pairs.push({
        id:`${t.id}-${lot.lotId}-${matchedPosition}`,
        name:t.name,
        code:t.code,
        positionType:t.positionType || lot.positionType,
        openTrade:lot,
        closeTrade:t,
        position:matchedPosition,
        buyPrice:Number(lot.price),
        sellPrice:Number(t.price),
        pnlPct,
        contribution
      });
    }
  }
  return { lots, pairs };
}

function getHoldings(trades=state.trades) {
  const { lots } = computeLedger(trades);
  const map = {};
  for (const lot of lots.filter(l=>l.remainingPosition>0.0001)) {
    if (!map[lot.code]) map[lot.code] = { code:lot.code, name:lot.name, position:0, costValue:0, positionType:lot.positionType, lastTrade:lot };
    const h = map[lot.code];
    h.name = lot.name;
    h.positionType = lot.positionType;
    h.position += Number(lot.remainingPosition) || 0;
    h.costValue += (Number(lot.price) || 0) * (Number(lot.remainingPosition) || 0);
    if (new Date(lot.date) > new Date(h.lastTrade.date)) h.lastTrade = lot;
  }
  return Object.values(map).map(h=>({ ...h, cost:h.position ? h.costValue / h.position : 0 }));
}

function computeSymbolStats(holdings=getHoldings(), ledger=computeLedger()) {
  const capital = Number(state.accountCapital) || 100000;
  const holdingMap = Object.fromEntries(holdings.map(h=>[h.code,h]));
  const cutoff = analysisDays === "all" ? null : (()=>{ const d=new Date(); d.setDate(d.getDate()-Number(analysisDays)); return d; })();
  const inWindow = value => !cutoff || new Date(value) >= cutoff;
  const periodTrades = state.trades.filter(t=>inWindow(t.date));
  const periodPairs = ledger.pairs.filter(p=>inWindow(p.closeTrade.date));
  const stats = {};
  const ensure = symbol => {
    if (!stats[symbol]) stats[symbol] = {
      symbol,
      tradeCount:0,
      buyCount:0,
      sellCount:0,
      grossBuyPosition:0,
      grossSellPosition:0,
      currentPosition:holdingMap[symbol]?.position || 0,
      realizedContribution:0,
      closedPosition:0,
      weightedHoldDays:0,
      pairCount:0,
      wins:0,
      losses:0,
      firstDate:null,
      lastDate:null
    };
    return stats[symbol];
  };

  for (const h of holdings) ensure(h.code);

  for (const t of periodTrades) {
    const s = ensure(t.code);
    const pos = Number(t.positionChange) || 0;
    const date = new Date(t.date);
    s.tradeCount += 1;
    if (buyActions.includes(t.action)) { s.buyCount += 1; s.grossBuyPosition += pos; }
    if (sellActions.includes(t.action)) { s.sellCount += 1; s.grossSellPosition += pos; }
    if (!s.firstDate || date < s.firstDate) s.firstDate = date;
    if (!s.lastDate || date > s.lastDate) s.lastDate = date;
  }

  for (const p of periodPairs) {
    const s = ensure(p.code);
    const holdDays = Math.max(0, (new Date(p.closeTrade.date) - new Date(p.openTrade.date)) / 86400000);
    s.realizedContribution += p.contribution;
    s.closedPosition += p.position;
    s.weightedHoldDays += holdDays * p.position;
    s.pairCount += 1;
    if (p.pnlPct >= 0) s.wins += 1; else s.losses += 1;
  }

  return Object.values(stats).map(s=>{
    const avgHoldDays = s.closedPosition ? s.weightedHoldDays / s.closedPosition : null;
    const realizedReturn = s.closedPosition ? s.realizedContribution / s.closedPosition * 100 : 0;
    const realizedDollar = capital * s.realizedContribution / 100;
    const useEfficiency = s.grossBuyPosition ? s.realizedContribution / s.grossBuyPosition * 100 : 0;
    const winRate = s.pairCount ? s.wins / s.pairCount * 100 : null;
    const spanDays = s.firstDate && s.lastDate ? Math.max(1, (s.lastDate - s.firstDate) / 86400000) : 1;
    const tradesPerWeek = s.tradeCount / spanDays * 7;
    return { ...s, avgHoldDays, realizedReturn, realizedDollar, useEfficiency, winRate, tradesPerWeek };
  }).sort((a,b)=>b.tradeCount-a.tradeCount || b.realizedContribution-a.realizedContribution);
}

function computeRiskProfile(holdings, stats, ledger) {
  const totalExposure = holdings.reduce((sum,h)=>sum+h.position,0);
  const topHolding = [...holdings].sort((a,b)=>b.position-a.position)[0];
  const pnlStats = stats.filter(s=>Math.abs(s.realizedContribution)>0.0001);
  const totalAbsContribution = pnlStats.reduce((sum,s)=>sum+Math.abs(s.realizedContribution),0);
  const topPnl = [...pnlStats].sort((a,b)=>Math.abs(b.realizedContribution)-Math.abs(a.realizedContribution))[0];
  const pnlConcentration = totalAbsContribution && topPnl ? Math.abs(topPnl.realizedContribution)/totalAbsContribution*100 : 0;
  const capital = Number(state.accountCapital) || 100000;
  return {
    totalExposure,
    exposureLevel: totalExposure >= 80 ? "偏高" : totalExposure >= 50 ? "中等" : "较低",
    topHolding,
    topHoldingShare: totalExposure && topHolding ? topHolding.position/totalExposure*100 : 0,
    topPnl,
    pnlConcentration,
    capitalUsed: capital*totalExposure/100,
    totalPairs: ledger.pairs.length
  };
}

function median(values=[]) {
  const ordered=[...values].filter(Number.isFinite).sort((a,b)=>a-b);
  if (!ordered.length) return 0;
  const middle=Math.floor(ordered.length/2);
  return ordered.length%2 ? ordered[middle] : (ordered[middle-1]+ordered[middle])/2;
}

function scoreMedianReturn(value) {
  if (value>=5) return 20;
  if (value>=3) return 16;
  if (value>=2) return 12;
  if (value>=1) return 8;
  if (value>0) return 3;
  return 0;
}

function scoreMedianHoldHours(hours) {
  if (hours<=1) return 15;
  if (hours<=4) return 13;
  if (hours<=12) return 10;
  if (hours<=24) return 8;
  if (hours<=48) return 5;
  if (hours<=96) return 2;
  return 0;
}

function scoreDecayedNetBuy(value) {
  if (value>=2.5) return 15;
  if (value>=1) return 12;
  if (value>=0.25) return 9;
  if (value>=-0.25) return 7;
  if (value>=-1) return 4;
  if (value>=-2.5) return 2;
  return 0;
}

function confidenceBase(samples) {
  if (samples<=0) return 0;
  if (samples===1) return 25;
  if (samples===2) return 40;
  if (samples===3) return 55;
  if (samples===4) return 65;
  if (samples===5) return 75;
  if (samples<=7) return 82;
  if (samples<=9) return 86;
  return 90;
}

function dateKey(value) {
  const d=new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0,10);
}

function computeTScoreboard(holdings=getHoldings(), ledger=computeLedger()) {
  const holdingMap=Object.fromEntries(holdings.map(h=>[h.code,h]));
  const allBuys=state.trades.filter(t=>buyActions.includes(t.action));
  const codes=[...new Set(allBuys.map(t=>t.code))];
  const referenceDate=new Date();
  const allTradeDays=[...new Set(state.trades.map(t=>dateKey(t.date)).filter(Boolean))].sort().reverse().slice(0,20);
  const scoringDays=new Set(allTradeDays);

  return codes.map(code=>{
    const buys=allBuys.filter(t=>t.code===code);
    const pairs=ledger.pairs.filter(p=>p.code===code);
    const batchMap=new Map();
    for (const pair of pairs) {
      const id=pair.openTrade.id;
      if (!batchMap.has(id)) batchMap.set(id,{ openTrade:pair.openTrade, pairs:[] });
      batchMap.get(id).pairs.push(pair);
    }
    const batches=[...batchMap.values()].map(batch=>{
      const closedPosition=batch.pairs.reduce((sum,p)=>sum+p.position,0);
      const weightedReturn=closedPosition ? batch.pairs.reduce((sum,p)=>sum+p.position*p.pnlPct,0)/closedPosition : 0;
      const weightedHours=closedPosition ? batch.pairs.reduce((sum,p)=>sum+p.position*Math.max(0,(new Date(p.closeTrade.date)-new Date(p.openTrade.date))/3600000),0)/closedPosition : 0;
      return { ...batch, closedPosition, weightedReturn, weightedHours, contribution:batch.pairs.reduce((sum,p)=>sum+p.contribution,0) };
    });
    const samples=batches.length;
    const totalBuyPosition=buys.reduce((sum,t)=>sum+Number(t.positionChange||0),0);
    const realizedPosition=pairs.reduce((sum,p)=>sum+p.position,0);
    const realizationRate=totalBuyPosition ? Math.min(1,realizedPosition/totalBuyPosition) : 0;
    const medianReturn=median(batches.map(b=>b.weightedReturn));
    const medianHoldHours=median(batches.map(b=>b.weightedHours));
    const positiveRate=samples ? batches.filter(b=>b.weightedReturn>0).length/samples : 0;
    const contribution=pairs.reduce((sum,p)=>sum+p.contribution,0);
    const codeTrades=state.trades.filter(t=>t.code===code);
    const netBuy=codeTrades.reduce((sum,t)=>{
      const age=Math.max(0,(referenceDate-new Date(t.date))/86400000);
      const direction=buyActions.includes(t.action)?1:isSell(t.action)?-1:0;
      return sum+direction*Number(t.positionChange||0)*Math.pow(.5,age/3);
    },0);
    const latestBuy=[...buys].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
    const latestBuyDays=latestBuy ? Math.max(0,(referenceDate-new Date(latestBuy.date))/86400000) : Infinity;
    const recencyScore=latestBuyDays<=1?5:latestBuyDays<=3?4:latestBuyDays<=5?3:latestBuyDays<=7?2:0;
    const buyDayCount=new Set(buys.map(t=>dateKey(t.date)).filter(day=>scoringDays.has(day))).size;
    const efficiency=scoreMedianReturn(medianReturn)+scoreMedianHoldHours(medianHoldHours)+realizationRate*10+positiveRate*10;
    const preference=scoreDecayedNetBuy(netBuy)+recencyScore+Math.min(5,buyDayCount);
    const contributionScore=contribution>=.4?20:contribution>=.3?17:contribution>=.2?14:contribution>=.1?10:contribution>=.05?6:contribution>0?3:0;
    const rawScore=efficiency+preference+contributionScore;
    const completeness=buys.length ? samples/buys.length : 0;
    const confidence=Math.min(90,confidenceBase(samples)*(.8+.2*completeness));
    const score=50+(rawScore-50)*confidence/100;
    const position=holdingMap[code]?.position||0;
    const status=score>=65&&confidence>=50&&samples>=3&&position>0 ? "重点跟随"
      : score>=55&&(netBuy<-.25||position<=0) ? "等待再次买入"
      : "样本观察";
    return { code, score, rawScore, confidence, samples, medianReturn, medianHoldHours, realizationRate, positiveRate, contribution, netBuy, position, efficiency, preference, contributionScore, status };
  }).sort((a,b)=>b.score-a.score || b.confidence-a.confidence);
}

function computeTimeline() {
  const ordered = [...state.trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  return ordered.map((trade,i)=>{
    const holdings = getHoldings(ordered.slice(0,i+1));
    return {
      date:new Date(trade.date),
      total:holdings.reduce((s,h)=>s+h.position,0),
      base:holdings.filter(h=>h.positionType==="底仓").reduce((s,h)=>s+h.position,0)
    };
  });
}

function computeReturnTimeline() {
  const closeMaps = new Map(Object.entries(state.candles || {}).map(([code, rows])=>[
    code, new Map((rows || []).map(row=>[marketDateKey(row.date), Number(row.close)]).filter(([,close])=>close>0))
  ]));
  const days = [...new Set([...closeMaps.values()].flatMap(map=>[...map.keys()]))].sort();
  const ordered = [...state.trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const capital = Number(state.accountCapital) || 100000;
  const snapshots = days.map(day=>{
    const cutoff = new Date(`${day}T23:59:59+08:00`);
    const dayTrades = ordered.filter(trade=>new Date(trade.date)<=cutoff);
    const ledger = computeLedger(dayTrades);
    const realized = ledger.pairs.reduce((sum,pair)=>sum + capital*(Number(pair.contribution)||0)/100,0);
    const holdings = getHoldings(dayTrades);
    const total = holdings.reduce((sum,holding)=>sum+holding.position,0);
    let covered = 0, unrealized = 0;
    holdings.forEach(holding=>{
      const close = closeMaps.get(holding.code)?.get(day);
      if (!(close>0) || !(holding.cost>0)) return;
      covered += holding.position;
      unrealized += capital*holding.position/100*(close-holding.cost)/holding.cost;
    });
    return { date:new Date(`${day}T12:00:00+08:00`), value:(realized+unrealized)/capital*100, realized:realized/capital*100, unrealized:unrealized/capital*100, total, covered, hasTrades:dayTrades.length>0, live:false };
  }).filter(point=>point.hasTrades && (point.total===0 || point.covered/point.total>=.75));
  const currentLedger = computeLedger();
  const currentRealized = currentLedger.pairs.reduce((sum,pair)=>sum + capital*(Number(pair.contribution)||0)/100,0);
  const holdings = getHoldings();
  const total = holdings.reduce((sum,holding)=>sum+holding.position,0);
  let covered = 0, unrealized = 0;
  holdings.forEach(holding=>{
    const quote = quoteFor(holding.code);
    if (!(Number(quote?.last)>0) || !(holding.cost>0)) return;
    covered += holding.position;
    unrealized += capital*holding.position/100*(Number(quote.last)-holding.cost)/holding.cost;
  });
  if (total===0 || covered/total>=.75) snapshots.push({ date:new Date(), value:(currentRealized+unrealized)/capital*100, realized:currentRealized/capital*100, unrealized:unrealized/capital*100, total, covered, live:true });
  return snapshots;
}

function render() {
  const holdings = getHoldings();
  const ledger = computeLedger();
  const capital = Number(state.accountCapital) || 100000;
  const total = holdings.reduce((s,h)=>s+h.position,0);
  const timeline = computeTimeline();
  const previous = timeline.length > 1 ? timeline[timeline.length-2].total : total;
  const change = total-previous;
  const realizedPct = ledger.pairs.reduce((s,p)=>s+p.contribution,0);
  const realizedDollar = capital * realizedPct / 100;
  const usedCapital = capital * total / 100;
  const buyingPower = capital * 1.3;
  const availableCash = buyingPower - usedCapital;
  const availablePosition = Math.max(0, 100 - total);
  const quotedHoldings = holdings.filter(h=>quoteFor(h.code)?.last > 0 && h.cost > 0);
  const quotedCost = quotedHoldings.reduce((sum,h)=>sum + capital*h.position/100,0);
  const unrealizedDollar = quotedHoldings.reduce((sum,h)=>sum + capital*h.position/100*(quoteFor(h.code).last-h.cost)/h.cost,0);
  const unrealizedPct = quotedCost ? unrealizedDollar / quotedCost * 100 : 0;
  const accountTotalDollar = realizedDollar + unrealizedDollar;
  const accountTotalPct = capital ? accountTotalDollar / capital * 100 : 0;

  setText("totalPosition",`${fmt(total)}%`);
  setText("availablePosition",`${fmt(availablePosition)}%`);
  setText("accountTotalReturn",quotedHoldings.length || !holdings.length ? `${accountTotalPct>=0?"+":""}${fmt(accountTotalPct,2)}%` : "—");
  setText("accountTotalPnl",quotedHoldings.length || !holdings.length ? usd(accountTotalDollar) : "—");
  setText("accountTotalMeta",quotedHoldings.length || !holdings.length ? `本金 ${usd(capital)} · 已实现 ${usd(realizedDollar)} · 按 ${quotedHoldings.length}/${holdings.length} 只当前报价估算` : `本金 ${usd(capital)} · 等待长桥行情`);
  setText("realizedPnl",usd(realizedDollar));
  setText("realizedPct",`${realizedPct>=0?"+":""}${fmt(realizedPct,2)}%`);
  setText("closedCount",`已平 ${ledger.pairs.length} 笔配对`);
  setText("unrealizedPnl",quotedHoldings.length ? usd(unrealizedDollar) : "—");
  setText("unrealizedPct",quotedHoldings.length ? `${unrealizedPct>=0?"+":""}${fmt(unrealizedPct,2)}%` : "—");
  setText("quoteCount",quotedHoldings.length);
  setText("unrealizedMeta",quotedHoldings.length ? `按 ${quotedHoldings.length}/${holdings.length} 只当前报价计算` : "等待长桥行情");
  setText("availableCash",usd(availableCash));
  setText("buyingPowerMeta",`总购买力 ${usd(buyingPower)} · 已占用 ${usd(usedCapital)} · 含 30% 融资`);
  setText("profitCount",ledger.pairs.filter(p=>p.pnlPct>=0).length);
  setText("lossCount",ledger.pairs.filter(p=>p.pnlPct<0).length);
  const latest = [...state.trades].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  setText("lastUpdated",state.updatedAt ? formatDate(state.updatedAt,true) : latest ? formatDate(latest.date,true) : "暂无数据");
  document.getElementById("totalBar").style.width=`${Math.min(100,total)}%`;
  const changeEl = document.getElementById("totalChange");
  changeEl.className=`change ${change>0?"up":change<0?"down":"neutral"}`;
  changeEl.textContent=change===0?"无变化":`${change>0?"+":""}${fmt(change)}%`;
  const realizedEl = document.getElementById("realizedPct");
  realizedEl.className=`change ${realizedPct>0?"up":realizedPct<0?"down":"neutral"}`;
  const unrealizedEl = document.getElementById("unrealizedPct");
  unrealizedEl.className=`change ${!quotedHoldings.length?"neutral":unrealizedPct>0?"up":unrealizedPct<0?"down":"neutral"}`;
  const accountTotalEl = document.getElementById("accountTotalPnl");
  accountTotalEl.className=`change ${!(quotedHoldings.length || !holdings.length)?"neutral":accountTotalPct>0?"up":accountTotalPct<0?"down":"neutral"}`;

  renderHoldings(holdings);
  renderClosedSymbols(holdings, ledger);
  const stats = computeSymbolStats(holdings, ledger);
  renderScoreboard(computeTScoreboard(holdings, ledger));
  renderAnalytics(stats, computeRiskProfile(holdings, stats, ledger));
  renderPairs(ledger.pairs);
  renderActivity();
  renderChart();
  renderReturnChart();
}

function renderHoldings(holdings) {
  const capital = Number(state.accountCapital) || 100000;
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  const filter=document.getElementById("statusFilter").value;
  const visible=holdings.filter(h=>(!q||h.name.toLowerCase().includes(q))&&(filter==="all"||h.positionType===filter))
    .sort((a,b)=>(a[sortKey]-b[sortKey])*sortDirection);
  const body=document.getElementById("holdingsBody");
  body.innerHTML=visible.map(h=>`<tr>
    <td data-label="标的"><div class="stock"><span class="stock-avatar">${esc(h.name[0])}</span><span class="stock-info"><b>${esc(h.name)}</b><span class="stock-actions"><button class="detail-btn" onclick="openSymbolDetail('${h.code}')">综合情况 →</button></span></span></div></td>
    <td data-label="状态"><span class="status ${h.positionType==="底仓"?"base":"swing"}">${esc(h.positionType)}</span></td>
    <td data-label="仓位"><div class="position-cell"><b>${fmt(h.position)}%</b><div class="position-mini"><i style="width:${Math.min(100,h.position*3)}%"></i></div></div></td>
    <td data-label="现价 / 成本">${currentCostMarkup(h)}</td>
    <td data-label="当日盈亏">${dayPnlMarkup(h,capital)}</td>
    <td data-label="持仓盈亏">${holdingPnlMarkup(h,capital)}</td>
    <td data-label="最近操作"><span class="latest-action">${esc(h.lastTrade.action)} · ${formatDate(h.lastTrade.date)}</span><button class="mini-btn row-actions" title="编辑最近记录" onclick="editTrade('${h.lastTrade.id}')">✎</button></td>
  </tr>`).join("");
  document.getElementById("holdingsEmpty").hidden=visible.length>0;
}

function getSymbolSummary(code, holdings=getHoldings(), ledger=computeLedger()) {
  const capital = Number(state.accountCapital) || 100000;
  const trades = state.trades.filter(t=>t.code===code).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const pairs = ledger.pairs.filter(p=>p.code===code).sort((a,b)=>new Date(a.closeTrade.date)-new Date(b.closeTrade.date));
  const holding = holdings.find(h=>h.code===code);
  const buyPosition = trades.filter(t=>buyActions.includes(t.action)).reduce((s,t)=>s+Number(t.positionChange||0),0);
  const sellPosition = trades.filter(t=>sellActions.includes(t.action)).reduce((s,t)=>s+Number(t.positionChange||0),0);
  const closedPosition = pairs.reduce((s,p)=>s+p.position,0);
  const realizedContribution = pairs.reduce((s,p)=>s+p.contribution,0);
  const realizedReturn = closedPosition ? realizedContribution/closedPosition*100 : 0;
  const wins = pairs.filter(p=>p.pnlPct>=0).length;
  const avgHoldDays = closedPosition ? pairs.reduce((s,p)=>s+Math.max(0,(new Date(p.closeTrade.date)-new Date(p.openTrade.date))/86400000)*p.position,0)/closedPosition : null;
  return {
    code, trades, pairs, holding, buyPosition, sellPosition, closedPosition,
    realizedContribution, realizedReturn, realizedDollar:capital*realizedContribution/100,
    winRate:pairs.length?wins/pairs.length*100:null, avgHoldDays,
    firstDate:trades[0]?.date, lastDate:trades[trades.length-1]?.date
  };
}

function renderClosedSymbols(holdings, ledger) {
  const q = document.getElementById("closedSearchInput").value.trim().toLowerCase();
  const openCodes = new Set(holdings.map(h=>h.code));
  const codes = [...new Set(state.trades.filter(t=>buyActions.includes(t.action)).map(t=>t.code))]
    .filter(code=>!openCodes.has(code) && (!q||code.toLowerCase().includes(q)))
    .map(code=>getSymbolSummary(code,holdings,ledger))
    .sort((a,b)=>new Date(b.lastDate)-new Date(a.lastDate));
  const list = document.getElementById("closedSymbols");
  list.innerHTML = codes.map(s=>`<article class="closed-card">
    <span class="stock-avatar">${esc(s.code[0])}</span>
    <div class="closed-card-main">
      <div class="closed-card-title"><b>${esc(s.code)}</b><span class="closed-badge">已清仓</span></div>
      <div class="closed-card-meta">${s.trades.length} 笔操作 · 最后 ${formatDate(s.lastDate,true)}</div>
      <div class="closed-card-pnl pnl ${s.realizedContribution>=0?"up":"down"}">已实现 ${s.realizedReturn>=0?"+":""}${fmt(s.realizedReturn,2)}% · ${usd(s.realizedDollar)}</div>
      <button class="detail-btn" onclick="openSymbolDetail('${s.code}')">查看完整操盘档案 →</button>
    </div>
  </article>`).join("");
  document.getElementById("closedSymbolsEmpty").hidden=codes.length>0;
}

window.openSymbolDetail=code=>{
  const summary = getSymbolSummary(code);
  const capital = Number(state.accountCapital) || 100000;
  const currentPosition = summary.holding?.position || 0;
  const status = currentPosition>0 ? "当前持仓" : "已清仓";
  setText("symbolDialogTitle",`${code} 综合情况`);
  setText("symbolDialogSubtitle",summary.firstDate?`${formatDate(summary.firstDate,true)} 至 ${formatDate(summary.lastDate,true)}`:"暂无记录");
  document.getElementById("symbolStatus").innerHTML=`<span class="status ${currentPosition>0?"swing":"base"}">${status}</span><span>累计买入 ${fmt(summary.buyPosition)}% · 累计卖出 ${fmt(summary.sellPosition)}%</span>`;
  const metrics = [
    ["当前仓位",`${fmt(currentPosition)}%`,summary.holding?`占用 ${usd(capital*currentPosition/100)}`:"仓位已归零"],
    ["当前成本",summary.holding?money(summary.holding.cost):"—",summary.holding?"按剩余批次加权":"已清仓"],
    ["已实现收益",usd(summary.realizedDollar),`${summary.realizedReturn>=0?"+":""}${fmt(summary.realizedReturn,2)}% 已平仓收益率`],
    ["操作次数",`${summary.trades.length} 笔`,`${summary.pairs.length} 笔平仓配对`],
    ["累计使用",`${fmt(summary.buyPosition)}%`,usd(capital*summary.buyPosition/100)],
    ["已配对仓位",`${fmt(summary.closedPosition)}%`,"按开平批次计算"],
    ["平仓胜率",summary.winRate===null?"—":`${fmt(summary.winRate,0)}%`,summary.pairs.length?`${summary.pairs.filter(p=>p.pnlPct>=0).length} 盈利 / ${summary.pairs.filter(p=>p.pnlPct<0).length} 亏损`:"暂无平仓"],
    ["平均持仓",summary.avgHoldDays===null?"—":`${fmt(summary.avgHoldDays,1)} 天`,"按已平仓仓位加权"]
  ];
  document.getElementById("symbolMetrics").innerHTML=metrics.map(([label,value,meta])=>`<article class="symbol-metric"><span>${label}</span><strong>${value}</strong><small>${meta}</small></article>`).join("");
  const orderedTrades=[...summary.trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
  setText("symbolTradeCount",`${orderedTrades.length} 笔`);
  document.getElementById("symbolTrades").innerHTML=orderedTrades.length?orderedTrades.map(t=>{
    const buy=buyActions.includes(t.action);
    return `<div class="symbol-trade"><div class="symbol-trade-head"><b class="pnl ${buy?"up":"down"}">${esc(t.action)} · ${money(t.price)}</b><time>${formatDate(t.date,true)}</time></div><div class="symbol-trade-meta">仓位 ${buy?"+":"−"}${fmt(t.positionChange)}% · ${esc(t.positionType)}</div>${t.note?`<div class="symbol-trade-note">${esc(t.note)}</div>`:""}</div>`;
  }).join(""):'<div class="symbol-empty">暂无操作流水</div>';
  const orderedPairs=[...summary.pairs].sort((a,b)=>new Date(b.closeTrade.date)-new Date(a.closeTrade.date));
  setText("symbolPairCount",`${orderedPairs.length} 笔`);
  document.getElementById("symbolPairs").innerHTML=orderedPairs.length?orderedPairs.map(p=>`<div class="symbol-pair"><div class="symbol-pair-head"><b class="pnl ${p.pnlPct>=0?"up":"down"}">${p.pnlPct>=0?"+":""}${fmt(p.pnlPct,2)}% · ${usd(capital*p.contribution/100)}</b><span>${formatDate(p.closeTrade.date,true)}</span></div><div class="symbol-pair-meta">${money(p.buyPrice)} 买入 → ${money(p.sellPrice)} 卖出 · ${fmt(p.position)}% 仓位</div></div>`).join(""):'<div class="symbol-empty">暂无可配对的平仓记录</div>';
  document.getElementById("symbolDialog").showModal();
};

function statTags(s) {
  const tags = [];
  if (s.tradeCount >= 3) tags.push("高频操作");
  if (s.grossBuyPosition >= 20) tags.push("资金占用高");
  if (s.realizedReturn >= 8) tags.push("收益效率高");
  if (s.realizedReturn < 0) tags.push("负收益");
  if (s.avgHoldDays !== null && s.avgHoldDays <= 3) tags.push("快进快出");
  if (s.avgHoldDays !== null && s.avgHoldDays >= 10) tags.push("慢速持仓");
  if (!tags.length) tags.push("观察中");
  return tags;
}

function renderAnalytics(stats, risk) {
  const body = document.getElementById("analyticsBody");
  const capital = Number(state.accountCapital) || 100000;
  const closed = stats.filter(s=>s.closedPosition > 0);
  const mostActive = [...stats].sort((a,b)=>b.tradeCount-a.tradeCount)[0];
  const bestReturn = [...closed].sort((a,b)=>b.realizedReturn-a.realizedReturn)[0];
  const fastest = [...closed].filter(s=>s.avgHoldDays!==null).sort((a,b)=>a.avgHoldDays-b.avgHoldDays)[0];
  const slowest = [...closed].filter(s=>s.avgHoldDays!==null).sort((a,b)=>b.avgHoldDays-a.avgHoldDays)[0];

  setInsight("mostActive", mostActive, mostActive ? `${mostActive.tradeCount} 笔 · 累计使用 ${fmt(mostActive.grossBuyPosition)}%` : "暂无数据");
  setInsight("bestReturn", bestReturn, bestReturn ? `${bestReturn.realizedReturn>=0?"+":""}${fmt(bestReturn.realizedReturn,2)}% · ${usd(bestReturn.realizedDollar)}` : "暂无已平仓");
  setInsight("fastest", fastest, fastest ? `平均 ${fmt(fastest.avgHoldDays,1)} 天 · ${fastest.pairCount} 笔配对` : "暂无已平仓");
  setInsight("slowest", slowest, slowest ? `平均 ${fmt(slowest.avgHoldDays,1)} 天 · ${slowest.pairCount} 笔配对` : "暂无已平仓");
  renderRiskAndRecap({ stats, risk, mostActive, bestReturn, fastest, slowest });

  body.innerHTML = stats.map(s=>{
    const tags = statTags(s).map(t=>`<span class="analysis-tag">${esc(t)}</span>`).join("");
    const holdText = s.avgHoldDays===null ? "未平仓" : `${fmt(s.avgHoldDays,1)} 天`;
    const winText = s.winRate===null ? "—" : `${fmt(s.winRate,0)}% 胜率`;
    return `<tr>
      <td data-label="标的"><div class="stock"><span class="stock-avatar">${esc(s.symbol[0])}</span><span><b>${esc(s.symbol)}</b></span></div></td>
      <td data-label="操作频率"><b>${s.tradeCount} 笔</b><br><small>${fmt(s.tradesPerWeek,1)} 笔/周</small></td>
      <td data-label="累计使用"><b>${fmt(s.grossBuyPosition)}%</b><br><small>${usd(capital*s.grossBuyPosition/100)}</small></td>
      <td data-label="当前占用"><b>${fmt(s.currentPosition)}%</b><br><small>${usd(capital*s.currentPosition/100)}</small></td>
      <td data-label="已平收益"><span class="pnl ${s.realizedContribution>=0?"up":"down"}">${s.realizedReturn>=0?"+":""}${fmt(s.realizedReturn,2)}%</span><br><small>${usd(s.realizedDollar)} · ${winText}</small></td>
      <td data-label="平均周期"><b>${holdText}</b><br><small>${s.pairCount} 笔配对</small></td>
      <td data-label="复盘标签"><div class="analysis-tags">${tags}</div></td>
    </tr>`;
  }).join("");
  document.getElementById("analyticsEmpty").hidden=stats.length>0;
}

function renderScoreboard(scores) {
  const highlights=document.getElementById("scoreHighlights");
  highlights.innerHTML=scores.slice(0,3).map((item,index)=>`<article class="score-highlight ${index===0?"top":""}">
    <span>TOP ${index+1} · ${esc(item.status)}</span><strong>${esc(item.code)} <em>${fmt(item.score,1)}</em></strong>
    <small>置信度 ${fmt(item.confidence,0)}% · ${item.samples} 个有效批次 · 中位收益 ${item.medianReturn>=0?"+":""}${fmt(item.medianReturn,2)}%</small>
  </article>`).join("");
  const body=document.getElementById("scoreBody");
  body.innerHTML=scores.map(item=>`<tr>
    <td data-label="标的"><div class="stock"><span class="stock-avatar">${esc(item.code[0])}</span><span><b>${esc(item.code)}</b><small>效率 ${fmt(item.efficiency,1)}/55 · 偏好 ${fmt(item.preference,1)}/25 · 贡献 ${fmt(item.contributionScore)}/20</small></span></div></td>
    <td data-label="做T评分"><b class="score-value">${fmt(item.score,1)}</b><br><small>原始 ${fmt(item.rawScore,1)}</small></td>
    <td data-label="置信度"><b>${fmt(item.confidence,0)}%</b><br><small>样本完整度</small></td>
    <td data-label="有效批次"><b>${item.samples}</b><br><small>独立开仓</small></td>
    <td data-label="中位收益"><span class="pnl ${item.medianReturn>=0?"up":"down"}">${item.medianReturn>=0?"+":""}${fmt(item.medianReturn,2)}%</span></td>
    <td data-label="中位持时"><b>${fmt(item.medianHoldHours,1)} 小时</b></td>
    <td data-label="兑现率"><b>${fmt(item.realizationRate*100,0)}%</b><br><small>已匹配卖出</small></td>
    <td data-label="当前判断"><span class="score-status ${item.status==="重点跟随"?"follow":item.status==="等待再次买入"?"wait":"watch"}">${esc(item.status)}</span></td>
  </tr>`).join("");
  document.getElementById("scoreEmpty").hidden=scores.length>0;
}

function setInsight(prefix, stat, meta) {
  setText(`${prefix}Symbol`, stat?.symbol || "—");
  setText(`${prefix}Meta`, meta);
}

function renderRiskAndRecap({ stats, risk, mostActive, bestReturn, fastest, slowest }) {
  setText("riskTotalExposure", `${fmt(risk.totalExposure)}%`);
  setText("riskTotalMeta", `${risk.exposureLevel} · 已占用 ${usd(risk.capitalUsed)}`);
  setText("riskTopSymbol", risk.topHolding?.code || "—");
  setText("riskTopMeta", risk.topHolding ? `${fmt(risk.topHolding.position)}% 仓位 · 占当前持仓 ${fmt(risk.topHoldingShare,0)}%` : "暂无持仓");
  setText("riskPnlConcentration", risk.topPnl ? `${fmt(risk.pnlConcentration,0)}%` : "—");
  setText("riskPnlMeta", risk.topPnl ? `主要来自 ${risk.topPnl.symbol} · ${usd(risk.topPnl.realizedDollar)}` : "暂无已平收益");

  const lines = [];
  if (mostActive) lines.push(`${mostActive.symbol} 是当前周期操作最频繁的标的，共 ${mostActive.tradeCount} 笔，累计使用 ${fmt(mostActive.grossBuyPosition)}% 仓位。`);
  if (bestReturn) lines.push(`${bestReturn.symbol} 的已平收益率最高，为 ${bestReturn.realizedReturn>=0?"+":""}${fmt(bestReturn.realizedReturn,2)}%，折算 ${usd(bestReturn.realizedDollar)}。`);
  if (fastest) lines.push(`${fastest.symbol} 进出最快，平均持仓 ${fmt(fastest.avgHoldDays,1)} 天，适合重点复盘短线执行。`);
  if (slowest && slowest !== fastest) lines.push(`${slowest.symbol} 节奏最慢，平均持仓 ${fmt(slowest.avgHoldDays,1)} 天，适合检查资金占用效率。`);
  if (risk.topHolding) lines.push(`当前最大风险暴露在 ${risk.topHolding.code}，占用 ${fmt(risk.topHolding.position)}% 仓位。`);
  if (!lines.length) lines.push("当前数据还不足，先积累几笔开仓和平仓记录后再复盘。");

  document.getElementById("recapList").innerHTML = lines.slice(0,5).map(line=>`<div class="recap-item">${esc(line)}</div>`).join("");
}

function renderPairs(pairs) {
  const capital = Number(state.accountCapital) || 100000;
  const body=document.getElementById("pairsBody");
  const ordered=[...pairs].sort((a,b)=>new Date(b.closeTrade.date)-new Date(a.closeTrade.date));
  body.innerHTML=ordered.map(p=>`<tr>
    <td data-label="标的"><div class="stock"><span class="stock-avatar">${esc(p.name[0])}</span><span><b>${esc(p.name)}</b></span></div></td>
    <td data-label="开仓批次"><span class="latest-action">${formatDate(p.openTrade.date,true)}</span><br><small>${esc(p.openTrade.action)} ${money(p.buyPrice)}</small></td>
    <td data-label="平仓记录"><span class="latest-action">${formatDate(p.closeTrade.date,true)}</span><br><small>${esc(p.closeTrade.action)} ${money(p.sellPrice)}</small></td>
    <td data-label="平仓仓位"><b>${fmt(p.position)}%</b><br><small>仓位</small></td>
    <td data-label="买入/卖出"><div class="price-stack"><b>${money(p.buyPrice)} / ${money(p.sellPrice)}</b><small>${p.pnlPct>=0?"+":""}${fmt(p.pnlPct,2)}%</small></div></td>
    <td data-label="已实现收益"><span class="pnl ${p.contribution>=0?"up":"down"}">${usd(capital*p.contribution/100)}</span><br><small>${p.contribution>=0?"+":""}${fmt(p.contribution,2)}% 总账户</small></td>
  </tr>`).join("");
  document.getElementById("pairsEmpty").hidden=ordered.length>0;
}

function renderActivity() {
  const capital = Number(state.accountCapital) || 100000;
  const list=document.getElementById("activityList");
  const ordered=[...state.trades].sort((a,b)=>new Date(b.date)-new Date(a.date));
  list.innerHTML=ordered.map(t=>{
    const buy=buyActions.includes(t.action);
    return `<div class="activity-item">
      <div class="action-icon ${buy?"buy":"sell"}">${buy?"↑":"↓"}</div>
      <div class="activity-main">
        <div class="activity-title"><b>${esc(t.action)} · ${esc(t.name)}</b><time>${formatDate(t.date,true)}</time></div>
        <div class="activity-detail">价格 <strong>${money(t.price)}</strong> · 仓位 <strong>${buy?"+":"−"}${fmt(t.positionChange)}%</strong> · 折算 <strong>${usd(capital*t.positionChange/100)}</strong> · ${esc(t.positionType)}</div>
        ${t.note?`<div class="activity-note">${esc(t.note)}</div>`:""}
      </div>
      <div class="activity-actions"><button class="mini-btn" onclick="editTrade('${t.id}')" title="编辑">✎</button><button class="mini-btn danger" onclick="deleteTrade('${t.id}')" title="删除">×</button></div>
    </div>`;
  }).join("");
  document.getElementById("activityEmpty").hidden=ordered.length>0;
}

function renderChart() {
  let points=computeTimeline();
  if (rangeDays!=="all") {
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-Number(rangeDays));
    points=points.filter(p=>p.date>=cutoff);
  }
  const el=document.getElementById("trendChart");
  if (!points.length) { el.innerHTML='<div class="empty-state"><p>暂无趋势数据</p></div>'; return; }
  const W=500,H=210,pad={l:36,r:12,t:12,b:26};
  const max=Math.max(100,...points.map(p=>p.total));
  const x=i=>pad.l+(points.length===1?(W-pad.l-pad.r)/2:i/(points.length-1)*(W-pad.l-pad.r));
  const y=v=>pad.t+(1-v/max)*(H-pad.t-pad.b);
  const line=key=>points.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ");
  const area=`${line("total")} L${x(points.length-1)},${y(0)} L${x(0)},${y(0)} Z`;
  const ticks=[0,25,50,75,100].filter(v=>v<=max);
  const labels=[0,Math.floor((points.length-1)/2),points.length-1].filter((v,i,a)=>a.indexOf(v)===i);
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="仓位趋势图，可悬浮查看日期和仓位数值">
    <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2864dc" stop-opacity=".18"/><stop offset="1" stop-color="#2864dc" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line class="grid" x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}"/><text x="2" y="${y(v)+3}">${v}%</text>`).join("")}
    <path d="${area}" fill="url(#areaFill)"/><path d="${line("total")}" fill="none" stroke="var(--blue)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    <path d="${line("base")}" fill="none" stroke="#83a9f6" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
    ${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.total)}" r="${points.length<15?3:1.5}" fill="var(--blue)"><title>${formatDate(p.date)} 总仓位 ${fmt(p.total)}%</title></circle>`).join("")}
    ${labels.map(i=>`<text text-anchor="${i===0?"start":i===points.length-1?"end":"middle"}" x="${x(i)}" y="${H-5}">${formatDate(points[i].date)}</text>`).join("")}
    <g class="trend-hover-guide" hidden aria-hidden="true"><line x1="0" y1="${pad.t}" x2="0" y2="${H-pad.b}"/><circle class="trend-hover-total" cx="0" cy="0" r="4"/><circle class="trend-hover-base" cx="0" cy="0" r="3"/></g>
  </svg><div class="trend-tooltip" hidden></div>`;
  const svg=el.querySelector("svg");
  const guide=svg.querySelector(".trend-hover-guide");
  const tooltip=el.querySelector(".trend-tooltip");
  const clearHover=()=>{ guide.hidden=true; tooltip.hidden=true; };
  const showHover=event=>{
    const rect=svg.getBoundingClientRect();
    const svgX=(event.clientX-rect.left)/rect.width*W;
    const index=points.length===1 ? 0 : Math.max(0,Math.min(points.length-1,Math.round((svgX-pad.l)/(W-pad.l-pad.r)*(points.length-1))));
    const point=points[index], pointX=x(index);
    guide.hidden=false;
    guide.querySelector("line").setAttribute("x1",pointX); guide.querySelector("line").setAttribute("x2",pointX);
    const totalDot=guide.querySelector(".trend-hover-total"), baseDot=guide.querySelector(".trend-hover-base");
    totalDot.setAttribute("cx",pointX); totalDot.setAttribute("cy",y(point.total));
    baseDot.setAttribute("cx",pointX); baseDot.setAttribute("cy",y(point.base));
    tooltip.innerHTML=`<b>${formatDate(point.date,true)}</b><span>总仓位 ${fmt(point.total)}%</span><span>底仓 ${fmt(point.base)}%</span>`;
    tooltip.hidden=false;
    const relativeX=(rect.left-el.getBoundingClientRect().left)+(pointX/W)*rect.width;
    tooltip.style.left=`${Math.max(8,Math.min(el.clientWidth-tooltip.offsetWidth-8,relativeX))}px`;
    tooltip.style.top=`${Math.max(4,(y(point.total)/H)*rect.height-tooltip.offsetHeight-8)}px`;
  };
  svg.addEventListener("pointermove",showHover);
  svg.addEventListener("pointerdown",showHover);
  svg.addEventListener("pointerleave",clearHover);
}

function renderReturnChart() {
  let points=computeReturnTimeline();
  if (returnRangeDays!=="all") {
    const cutoff=new Date(); cutoff.setDate(cutoff.getDate()-Number(returnRangeDays));
    points=points.filter(p=>p.date>=cutoff);
  }
  const el=document.getElementById("returnChart");
  if (points.length<2) { el.innerHTML=`<div class="empty-state"><div>${state.candleError ? "收盘快照暂不可用" : "正在读取账户收盘快照"}</div><p>${state.candleError ? "请确认本机长桥行情已启动，再刷新页面。" : "将按每日收盘价还原账户整体收益率。"}</p></div>`; return; }
  const W=500,H=210,pad={l:42,r:12,t:12,b:26};
  const values=points.map(p=>p.value);
  const extent=Math.max(1,...values.map(v=>Math.abs(v)));
  const min=Math.min(0,...values,-extent*.12), max=Math.max(0,...values,extent*.12);
  const x=i=>pad.l+(points.length===1?(W-pad.l-pad.r)/2:i/(points.length-1)*(W-pad.l-pad.r));
  const y=v=>pad.t+(max-v)/(max-min)*(H-pad.t-pad.b);
  const line=points.map((p,i)=>`${i?"L":"M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const zeroY=y(0);
  const area=`${line} L${x(points.length-1)},${zeroY} L${x(0)},${zeroY} Z`;
  const ticks=[min,(min+max)/2,max].map(v=>Number(v.toFixed(2))).filter((v,i,a)=>a.indexOf(v)===i);
  const labels=[0,Math.floor((points.length-1)/2),points.length-1].filter((v,i,a)=>a.indexOf(v)===i);
  const positive=points.at(-1).value>=0;
  const color=positive?"#df4b59":"#15946b";
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="账户整体收益率走势，可悬浮查看每日数值">
    <defs><linearGradient id="returnAreaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".18"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line class="grid" x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}"/><text x="2" y="${y(v)+3}">${v>=0?"+":""}${fmt(v,2)}%</text>`).join("")}
    <line class="zero-line" x1="${pad.l}" y1="${zeroY}" x2="${W-pad.r}" y2="${zeroY}"/>
    <path d="${area}" fill="url(#returnAreaFill)"/><path d="${line}" fill="none" stroke="${color}" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    ${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.value)}" r="${p.live?4:points.length<15?3:1.5}" fill="${p.live?"#c57b16":color}"/>`).join("")}
    ${labels.map(i=>`<text text-anchor="${i===0?"start":i===points.length-1?"end":"middle"}" x="${x(i)}" y="${H-5}">${formatDate(points[i].date)}</text>`).join("")}
    <g class="return-hover-guide" hidden aria-hidden="true"><line x1="0" y1="${pad.t}" x2="0" y2="${H-pad.b}"/><circle cx="0" cy="0" r="4"/></g>
  </svg><div class="trend-tooltip return-tooltip" hidden></div>`;
  const svg=el.querySelector("svg"), guide=svg.querySelector(".return-hover-guide"), tooltip=el.querySelector(".return-tooltip");
  const clearHover=()=>{ guide.hidden=true; tooltip.hidden=true; };
  const showHover=event=>{
    const rect=svg.getBoundingClientRect();
    const svgX=(event.clientX-rect.left)/rect.width*W;
    const index=Math.max(0,Math.min(points.length-1,Math.round((svgX-pad.l)/(W-pad.l-pad.r)*(points.length-1))));
    const point=points[index], pointX=x(index);
    guide.hidden=false; guide.querySelector("line").setAttribute("x1",pointX); guide.querySelector("line").setAttribute("x2",pointX);
    const dot=guide.querySelector("circle"); dot.setAttribute("cx",pointX); dot.setAttribute("cy",y(point.value)); dot.setAttribute("stroke",point.value>=0?"#df4b59":"#15946b");
    tooltip.innerHTML=`<b>${point.live?"实时估算 · ":"收盘快照 · "}${formatDate(point.date,true)}</b><span>账户整体 ${point.value>=0?"+":""}${fmt(point.value,2)}%</span><span>已实现 ${point.realized>=0?"+":""}${fmt(point.realized,2)}% · 未实现 ${point.unrealized>=0?"+":""}${fmt(point.unrealized,2)}%</span>`;
    tooltip.hidden=false;
    const relativeX=(rect.left-el.getBoundingClientRect().left)+(pointX/W)*rect.width;
    tooltip.style.left=`${Math.max(8,Math.min(el.clientWidth-tooltip.offsetWidth-8,relativeX))}px`;
    tooltip.style.top=`${Math.max(4,(y(point.value)/H)*rect.height-tooltip.offsetHeight-8)}px`;
  };
  svg.addEventListener("pointermove",showHover); svg.addEventListener("pointerdown",showHover); svg.addEventListener("pointerleave",clearHover);
}

function getOpenLotsForForm(trade=null) {
  const trades = state.trades.filter(t=>t.id!==trade?.id);
  return computeLedger(trades).lots.filter(l=>l.remainingPosition>0.0001);
}
function refreshCloseLotOptions(trade=null) {
  const row = document.getElementById("closeLotRow");
  const select = document.getElementById("closeLotId");
  const action = value("action");
  const code = value("name").trim().toUpperCase();
  row.hidden = !isSell(action);
  if (!isSell(action)) { select.innerHTML=""; return; }
  const lots = getOpenLotsForForm(trade).filter(l=>!code || l.code===code);
  select.innerHTML = [`<option value="">自动匹配最早开仓</option>`, ...lots.map(l=>`<option value="${l.lotId}">${formatDate(l.date,true)} · ${esc(l.name)} 剩 ${fmt(l.remainingPosition)}% · ${money(l.price)}</option>`)].join("");
  select.value = trade?.closeLotId || "";
}
function syncQuickPosition() {
  const quick = value("quickPosition");
  if (quick !== "") document.getElementById("positionChange").value = quick;
}
function openTrade(trade=null) {
  document.getElementById("tradeForm").reset();
  document.getElementById("editId").value=trade?.id||"";
  document.getElementById("dialogTitle").textContent=trade?"编辑操作":"记录操作";
  const ids=["name","action","positionType","price","positionChange","note"];
  ids.forEach(id=>document.getElementById(id).value=trade?.[id]??"");
  document.getElementById("tradeDate").value=toLocalInput(trade?.date||new Date().toISOString());
  if (!trade) {
    document.getElementById("action").value="买入";
    document.getElementById("positionType").value="波段仓";
    document.getElementById("quickPosition").value="10";
    document.getElementById("positionChange").value="10";
  } else {
    const quick = ["10","5","3.3"].includes(String(trade.positionChange)) ? String(trade.positionChange) : "";
    document.getElementById("quickPosition").value = quick;
  }
  refreshCloseLotOptions(trade);
  document.getElementById("tradeDialog").showModal();
}
function toLocalInput(iso) {
  const d=new Date(iso), local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
window.editTrade=id=>openTrade(state.trades.find(t=>t.id===id));
window.deleteTrade=async id=>{
  if (!confirm("确定删除这条操作记录？删除后持仓和平仓配对将重新计算。")) return;
  const trade = state.trades.find(t=>t.id===id);
  if (!trade) return;
  try {
    await syncSharedTrade("delete", trade);
    state.trades=state.trades.filter(t=>t.id!==id);
    state.isDemo=false; state.source="shared"; saveState(); render();
    toast("已同步删除，线上面板正在刷新");
  } catch (error) { alert(`删除未同步：${error.message}`); }
};
function close(id){ document.getElementById(id).close(); }
function toast(message) {
  const el=document.getElementById("toast"); el.textContent=message; el.classList.add("show");
  clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),2200);
}
function download(content,type,filename) {
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=filename;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function csvEscape(v){ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function exportCsv() {
  const fields=["date","name","action","positionType","price","positionChange","closeLotId","note"];
  const labels=["操作时间","标的","操作类型","持仓类型","操作价格","仓位变化","对应开仓ID","备注"];
  download("\ufeff"+[labels,...state.trades.map(t=>fields.map(f=>csvEscape(t[f])))].map(r=>r.join(",")).join("\n"),"text/csv;charset=utf-8","Lucky Follow 操作记录.csv");
  close("exportDialog"); toast("CSV 已导出");
}
function exportJson() {
  download(JSON.stringify({version:5,exportedAt:new Date().toISOString(),accountCapital:Number(state.accountCapital)||100000,trades:state.trades},null,2),"application/json","Lucky Follow 操作记录.json");
  close("exportDialog"); toast("JSON 已导出");
}
function parseCsv(text) {
  const rows=[]; let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){ const c=text[i],n=text[i+1]; if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=c; }
  row.push(cell); if(row.some(Boolean)) rows.push(row);
  if(rows.length<2) throw new Error("CSV 中没有数据");
  const aliases={操作时间:"date",标的:"name",标的名称:"name",标的代码:"code",操作类型:"action",持仓类型:"positionType",操作价格:"price",仓位变化:"positionChange",对应开仓ID:"closeLotId",备注:"note"};
  const headers=rows[0].map(h=>aliases[h.trim()]||h.trim());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}
function validateTrades(items) {
  if (!Array.isArray(items)) throw new Error("文件格式不正确");
  return items.map((t,i)=>{
    if(!(t.name||t.code||t.symbol)||!t.action||!t.date) throw new Error(`第 ${i+1} 条记录缺少必要字段`);
    if(![...buyActions,...sellActions].includes(t.action)) throw new Error(`第 ${i+1} 条操作类型不支持`);
    const price=Number(t.price), positionChange=Number(t.positionChange);
    if([price,positionChange].some(Number.isNaN) || positionChange <= 0) throw new Error(`第 ${i+1} 条数字字段不正确`);
    return normalizeTrade(t);
  });
}

document.getElementById("addBtn").onclick=()=>openTrade();
document.getElementById("closeDialog").onclick=()=>close("tradeDialog");
document.getElementById("cancelDialog").onclick=()=>close("tradeDialog");
document.getElementById("exportBtn").onclick=()=>document.getElementById("exportDialog").showModal();
document.getElementById("closeExport").onclick=()=>close("exportDialog");
document.getElementById("closeSymbolDialog").onclick=()=>close("symbolDialog");
document.getElementById("exportCsv").onclick=exportCsv;
document.getElementById("exportJson").onclick=exportJson;
document.getElementById("importBtn").onclick=()=>document.getElementById("fileInput").click();
document.getElementById("action").onchange=()=>refreshCloseLotOptions();
document.getElementById("name").oninput=()=>refreshCloseLotOptions();
document.getElementById("quickPosition").onchange=syncQuickPosition;
document.getElementById("positionChange").oninput=()=>document.getElementById("quickPosition").value="";
document.getElementById("fileInput").onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  try {
    const text=await file.text();
    const raw=file.name.toLowerCase().endsWith(".json")?(JSON.parse(text).trades||JSON.parse(text)):parseCsv(text);
    const imported=validateTrades(raw);
    if(!confirm(`将导入 ${imported.length} 条记录并替换当前数据，是否继续？`))return;
    const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : null;
    state={trades:imported,accountCapital:Number(parsed?.accountCapital)||Number(state.accountCapital)||100000,isDemo:false,source:"local"};saveState();render();toast(`已导入 ${imported.length} 条本机预览记录`);
  } catch(err){ alert(`导入失败：${err.message}`); }
  finally {e.target.value="";}
};
document.getElementById("tradeForm").onsubmit=async e=>{
  e.preventDefault();
  const id=document.getElementById("editId").value;
  const trade=normalizeTrade({id:id||crypto.randomUUID(),name:value("name").trim(),action:value("action"),positionType:value("positionType"),price:Number(value("price")),positionChange:Number(value("positionChange")),date:new Date(value("tradeDate")).toISOString(),closeLotId:value("closeLotId"),note:value("note").trim()});
  const submit = e.currentTarget.querySelector('button[type="submit"]');
  submit.disabled=true; submit.textContent="正在同步…";
  try {
    const result = await syncSharedTrade(id?"update":"create", trade);
    if(id) state.trades=state.trades.map(t=>t.id===id?trade:t); else state.trades.push(trade);
    state.updatedAt=result.updatedAt; state.isDemo=false; state.source="shared"; saveState();
    close("tradeDialog"); render();
    toast(id?"已同步更新，线上面板正在刷新":"已同步记录，线上面板正在刷新");
  } catch (error) {
    alert(`未能同步保存：${error.message}`);
  } finally {
    submit.disabled=false; submit.textContent=id?"保存修改":"保存记录";
  }
};
document.getElementById("capitalBtn").onclick=()=>{
  const current = Number(state.accountCapital) || 100000;
  const raw = prompt("输入账户本金（美元）", String(current));
  if (raw === null) return;
  const next = Number(String(raw).replace(/[$,\s]/g,""));
  if (!Number.isFinite(next) || next <= 0) { alert("请输入有效的本金金额"); return; }
  state.accountCapital = next;
  state.isDemo=false; state.source="local"; saveState(); render(); toast("本机预览本金已更新");
};
document.getElementById("searchInput").oninput=()=>renderHoldings(getHoldings());
document.getElementById("statusFilter").onchange=()=>renderHoldings(getHoldings());
document.getElementById("closedSearchInput").oninput=()=>renderClosedSymbols(getHoldings(),computeLedger());
document.querySelectorAll(".sortable").forEach(th=>th.onclick=()=>{
  const key=th.dataset.sort; if(sortKey===key)sortDirection*=-1;else{sortKey=key;sortDirection=-1;}renderHoldings(getHoldings());
});
document.getElementById("rangeTabs").onclick=e=>{
  if(!e.target.dataset.days)return;
  rangeDays=e.target.dataset.days;document.querySelectorAll("#rangeTabs button").forEach(b=>b.classList.toggle("active",b===e.target));renderChart();
};
document.getElementById("returnRangeTabs").onclick=e=>{
  if(!e.target.dataset.days)return;
  returnRangeDays=e.target.dataset.days;document.querySelectorAll("#returnRangeTabs button").forEach(b=>b.classList.toggle("active",b===e.target));renderReturnChart();
};
document.getElementById("analysisRangeTabs").onclick=e=>{
  if(!e.target.dataset.days)return;
  analysisDays=e.target.dataset.days;
  document.querySelectorAll("#analysisRangeTabs button").forEach(b=>b.classList.toggle("active",b===e.target));
  const holdings = getHoldings();
  const ledger = computeLedger();
  const stats = computeSymbolStats(holdings, ledger);
  renderAnalytics(stats, computeRiskProfile(holdings, stats, ledger));
};
document.getElementById("clearBtn").onclick=()=>{
  if(!state.trades.length)return;
  if(confirm("确定清空全部操作记录？此操作只影响本机预览，建议先导出备份。")){state={trades:[],accountCapital:Number(state.accountCapital)||100000,isDemo:false,source:"local"};saveState();render();toast("本机预览已清空");}
};
document.getElementById("themeBtn").onclick=()=>{
  document.body.classList.toggle("dark");localStorage.setItem(THEME_KEY,document.body.classList.contains("dark")?"dark":"light");
};
if(localStorage.getItem(THEME_KEY)==="dark")document.body.classList.add("dark");
function ensureTrendStackLayout() {
  if (document.getElementById("trendStackLayoutFix")) return;
  const style=document.createElement("style");
  style.id="trendStackLayoutFix";
  style.textContent=".trend-stack{display:grid!important;gap:14px;align-content:start}.trend-stack .return-panel{margin:0!important}";
  document.head.appendChild(style);
}
async function init() {
  ensureTrendStackLayout();
  state = await loadSharedState();
  render();
  refreshQuotes();
  refreshAccountReturnHistory();
  window.setInterval(refreshQuotes, QUOTE_REFRESH_MS);
  if (state.source === "shared") toast("已加载 GitHub 共享数据");
  else if (state.loadError) toast("共享数据加载失败，已使用本机数据");
}
init();
