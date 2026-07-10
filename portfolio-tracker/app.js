const STORAGE_KEY = "portfolio-tracker-us-data-v1";
const MARKET_KEY = "portfolio-tracker-active-market-v1";
const LEGACY_STORAGE_KEY = "portfolio-tracker-data-v1";
const LEGACY_KEYS = [];
const THEME_KEY = "portfolio-tracker-theme";
const CLEAR_BACKUP_KEY = "portfolio-tracker-last-clear-v1";
const marketMeta = {
  US: { label:"美股", unit:"position", storageKey:STORAGE_KEY, defaultCurrency:"USD", defaultCapital:100000 },
  CN: { label:"A股", unit:"shares", storageKey:"portfolio-tracker-cn-data-v1", defaultCurrency:"CNY", defaultCapital:100000 }
};
const currencyMeta = {
  USD: { label:"美元", symbol:"$", locale:"en-US" },
  CNY: { label:"人民币", symbol:"¥", locale:"zh-CN" }
};
const buyActions = ["买入"];
const sellActions = ["卖出"];

let activeMarket = normalizeMarket(localStorage.getItem(MARKET_KEY));
let state = { trades: [], accountCapital: marketMeta[activeMarket].defaultCapital, currency: marketMeta[activeMarket].defaultCurrency, market: activeMarket, source: "local" };
let rangeDays = 30;
let analysisDays = 30;
let sortKey = "position";
let sortDirection = -1;
let lastClearSnapshot = loadClearBackup();

function daysAgo(days, hour) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 30, 0, 0);
  return d.toISOString();
}
function normalizeAction(action) {
  if (["加仓", "买入"].includes(action)) return "买入";
  if (["减仓", "卖出", "清仓"].includes(action)) return "卖出";
  return action;
}
function normalizeMarket(market) { return marketMeta[market] ? market : "US"; }
function activeMarketConfig() { return marketMeta[activeMarket]; }
function isShareMode() { return activeMarketConfig().unit === "shares"; }
function defaultStateForMarket(market=activeMarket) {
  const meta = marketMeta[normalizeMarket(market)];
  return { trades: [], accountCapital:meta.defaultCapital, currency:meta.defaultCurrency, market:normalizeMarket(market), isDemo:false, source:"local" };
}
function marketCurrency(market=activeMarket) { return marketMeta[normalizeMarket(market)].defaultCurrency; }
function normalizeTrade(t) {
  const symbol = String(t.symbol || t.name || t.code || "").trim().toUpperCase();
  const market = normalizeMarket(t.market || activeMarket);
  const quantity = Number(t.quantity || 0);
  const price = Number(t.price);
  const capital = Number(state.accountCapital) || marketMeta[market].defaultCapital;
  const positionChange = marketMeta[market].unit === "shares" && quantity > 0
    ? price * quantity / capital * 100
    : Number(t.positionChange || 10);
  return {
    id:t.id||crypto.randomUUID(),
    name:symbol,
    code:symbol,
    market,
    action:normalizeAction(t.action),
    positionType:t.positionType==="底仓"?"底仓":"波段仓",
    price,
    quantity: marketMeta[market].unit === "shares" ? quantity : null,
    positionChange,
    date:new Date(t.date || Date.now()).toISOString(),
    closeLotId:String(t.closeLotId||""),
    note:String(t.note||"")
  };
}
function fallbackState(market=activeMarket) {
  const normalizedMarket = normalizeMarket(market);
  const keys = [marketMeta[normalizedMarket].storageKey, ...(normalizedMarket === "US" ? [LEGACY_STORAGE_KEY] : []), ...LEGACY_KEYS];
  try {
    for (const key of keys) {
      const saved = JSON.parse(localStorage.getItem(key));
      if (saved?.trades) {
        const meta = marketMeta[normalizedMarket];
        return { trades:saved.trades.map(t=>normalizeTrade({...t, market:normalizedMarket})), accountCapital:Number(saved.accountCapital)||meta.defaultCapital, currency:marketCurrency(normalizedMarket), market:normalizedMarket, isDemo:false, source:"local" };
      }
      const legacy = JSON.parse(localStorage.getItem(key));
      if (legacy?.trades) return { trades:legacy.trades.map(t=>normalizeTrade({...t, market:normalizedMarket})), accountCapital:Number(legacy.accountCapital)||marketMeta[normalizedMarket].defaultCapital, currency:marketCurrency(normalizedMarket), market:normalizedMarket, isDemo:false, source:"local" };
    }
    return defaultStateForMarket(normalizedMarket);
  } catch { return defaultStateForMarket(normalizedMarket); }
}
function saveState() {
  state.market = activeMarket;
  state.currency = marketCurrency(activeMarket);
  localStorage.setItem(activeMarketConfig().storageKey, JSON.stringify(state));
  localStorage.setItem(MARKET_KEY, activeMarket);
}
function cloneState(value) { return JSON.parse(JSON.stringify(value)); }
function loadClearBackup() {
  try {
    const backup = JSON.parse(localStorage.getItem(CLEAR_BACKUP_KEY));
    return backup?.state?.trades?.length ? backup : null;
  } catch { return null; }
}
function saveClearBackup(snapshot) {
  lastClearSnapshot = snapshot;
  localStorage.setItem(CLEAR_BACKUP_KEY, JSON.stringify(snapshot));
}
function clearClearBackup() {
  lastClearSnapshot = null;
  localStorage.removeItem(CLEAR_BACKUP_KEY);
}
function undoLastClear() {
  const backup = lastClearSnapshot || loadClearBackup();
  if (!backup?.state?.trades?.length) {
    toast("没有可恢复的数据");
    return;
  }
  activeMarket = normalizeMarket(backup.market);
  state = {
    ...defaultStateForMarket(activeMarket),
    ...backup.state,
    trades: backup.state.trades.map(t=>normalizeTrade({...t, market:activeMarket})),
    market: activeMarket,
    currency: marketCurrency(activeMarket),
    isDemo:false,
    source:"local"
  };
  saveState();
  clearClearBackup();
  render();
  toast("已恢复清空前数据");
}
function esc(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmt(n,digits=1) { return Number(n || 0).toFixed(digits).replace(/\.0$/,""); }
function normalizeCurrency(currency) { return currencyMeta[currency] ? currency : "USD"; }
function activeCurrency() { return currencyMeta[marketCurrency(activeMarket)]; }
function money(n) { return formatCurrency(n); }
function usd(n) { return formatCurrency(n); }
function formatCurrency(n) {
  const meta = activeCurrency();
  const sign = Number(n) < 0 ? "-" : "";
  return `${sign}${meta.symbol}${Math.abs(Number(n)||0).toLocaleString(meta.locale,{maximumFractionDigits:2,minimumFractionDigits:2})}`;
}
function toggleCurrency() {
  state.currency = state.currency === "USD" ? "CNY" : "USD";
  saveState();
  render();
  const btn = document.getElementById("currencyBtn");
  if (btn) btn.textContent = state.currency;
}
function setText(id,text) { document.getElementById(id).textContent=text; }
function value(id){ return document.getElementById(id).value; }
function isSell(action) { return sellActions.includes(action); }
function formatDate(value, includeTime=false) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const opts = { month:"2-digit", day:"2-digit" };
  if (includeTime) Object.assign(opts,{hour:"2-digit",minute:"2-digit",hour12:false});
  return new Intl.DateTimeFormat("zh-CN",opts).format(d).replace(/\//g,".");
}

function computeLedger(trades=state.trades) {
  const ordered = [...trades].sort((a,b)=>new Date(a.date)-new Date(b.date));
  const lots = [];
  const pairs = [];
  const capital = Number(state.accountCapital) || activeMarketConfig().defaultCapital;

  for (const t of ordered) {
    const pos = Number(t.positionChange) || 0;
    const quantity = Number(t.quantity) || 0;
    if (buyActions.includes(t.action)) {
      lots.push({ ...t, lotId:t.id, openPosition:pos, remainingPosition:pos, openQuantity:quantity, remainingQuantity:quantity });
      continue;
    }
    if (!isSell(t.action)) continue;

    let remainingPos = pos;
    let remainingQty = quantity;
    const candidates = t.closeLotId
      ? lots.filter(l=>l.lotId===t.closeLotId && l.remainingPosition>0)
      : lots.filter(l=>l.code===t.code && l.positionType===t.positionType && l.remainingPosition>0);

    for (const lot of candidates) {
      if (quantity > 0 ? remainingQty <= 0 : remainingPos <= 0) break;
      const shareLot = Number(lot.remainingQuantity) > 0;
      const matchedQuantity = shareLot ? Math.min(remainingQty, lot.remainingQuantity) : 0;
      const matchedPosition = shareLot
        ? Math.min(lot.remainingPosition, Number(lot.price) * matchedQuantity / capital * 100)
        : Math.min(remainingPos, lot.remainingPosition);
      const pnlPct = lot.price ? (Number(t.price)-Number(lot.price))/Number(lot.price)*100 : 0;
      const contribution = shareLot
        ? (Number(t.price)-Number(lot.price)) * matchedQuantity / capital * 100
        : matchedPosition * pnlPct / 100;
      if (matchedPosition <= 0 && matchedQuantity <= 0) continue;

      lot.remainingPosition = Math.max(0, lot.remainingPosition - matchedPosition);
      remainingPos = Math.max(0, remainingPos - matchedPosition);
      if (shareLot) {
        lot.remainingQuantity = Math.max(0, lot.remainingQuantity - matchedQuantity);
        remainingQty = Math.max(0, remainingQty - matchedQuantity);
      }

      pairs.push({
        id:`${t.id}-${lot.lotId}-${matchedPosition}`,
        name:t.name,
        code:t.code,
        positionType:t.positionType || lot.positionType,
        openTrade:lot,
        closeTrade:t,
        position:matchedPosition,
        quantity:matchedQuantity || null,
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
  const capital = Number(state.accountCapital) || activeMarketConfig().defaultCapital;
  for (const lot of lots.filter(l=>isLotOpen(l))) {
    const key = `${lot.code}__${lot.positionType}`;
    if (!map[key]) map[key] = { key, code:lot.code, name:lot.name, position:0, quantity:0, costValue:0, positionType:lot.positionType, lastTrade:lot };
    const h = map[key];
    h.name = lot.name;
    h.positionType = lot.positionType;
    if (isShareMode()) {
      const remainingQuantity = Number(lot.remainingQuantity) || 0;
      const costAmount = (Number(lot.price) || 0) * remainingQuantity;
      h.quantity += remainingQuantity;
      h.costValue += costAmount;
      h.position += capital ? costAmount / capital * 100 : 0;
    } else {
      h.position += Number(lot.remainingPosition) || 0;
      h.costValue += (Number(lot.price) || 0) * (Number(lot.remainingPosition) || 0);
    }
    if (new Date(lot.date) > new Date(h.lastTrade.date)) h.lastTrade = lot;
  }
  return Object.values(map).map(h=>({ ...h, cost:h.quantity ? h.costValue / h.quantity : h.position ? h.costValue / h.position : 0 }));
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
      winContribution:0,
      lossContribution:0,
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
    if (p.pnlPct >= 0) { s.wins += 1; s.winContribution += p.contribution; }
    else { s.losses += 1; s.lossContribution += p.contribution; }
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
function computeClosedPerformance(stats) {
  const closed = stats.filter(s=>s.pairCount > 0);
  const pairCount = closed.reduce((sum,s)=>sum+s.pairCount,0);
  const wins = closed.reduce((sum,s)=>sum+s.wins,0);
  const losses = closed.reduce((sum,s)=>sum+s.losses,0);
  const winContribution = closed.reduce((sum,s)=>sum+Math.max(0,s.winContribution||0),0);
  const lossContribution = Math.abs(closed.reduce((sum,s)=>sum+Math.min(0,s.lossContribution||0),0));
  const capital = Number(state.accountCapital) || activeMarketConfig().defaultCapital;
  const avgWinContribution = wins ? winContribution / wins : 0;
  const avgLossContribution = losses ? lossContribution / losses : 0;
  return {
    pairCount,
    wins,
    losses,
    winRate: pairCount ? wins / pairCount * 100 : null,
    avgWinContribution,
    avgLossContribution,
    avgWinAmount: capital * avgWinContribution / 100,
    avgLossAmount: capital * avgLossContribution / 100,
    profitLossRatio: avgLossContribution ? avgWinContribution / avgLossContribution : null
  };
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

function render() {
  const holdings = getHoldings();
  const ledger = computeLedger();
  const capital = Number(state.accountCapital) || 100000;
  const total = holdings.reduce((s,h)=>s+h.position,0);
  const base = holdings.filter(h=>h.positionType==="底仓").reduce((s,h)=>s+h.position,0);
  const swing = total-base;
  const timeline = computeTimeline();
  const previous = timeline.length > 1 ? timeline[timeline.length-2].total : total;
  const change = total-previous;
  const realizedPct = ledger.pairs.reduce((s,p)=>s+p.contribution,0);
  const realizedDollar = capital * realizedPct / 100;
  const usedCapital = capital * total / 100;

  document.querySelectorAll("#marketSwitch button").forEach(btn=>btn.classList.toggle("active", btn.dataset.market===activeMarket));
  document.querySelector(".market-status").innerHTML = `<i></i> ${activeMarketConfig().label} · 本机私有数据`;
  setText("totalPosition",`${fmt(total)}%`);
  state.currency = marketCurrency(activeMarket);
  setText("accountCapital",usd(capital));
  setText("capitalUsed",`已占用 ${usd(usedCapital)}`);
  setText("realizedPnl",usd(realizedDollar));
  setText("realizedPct",`${realizedPct>=0?"+":""}${fmt(realizedPct,2)}%`);
  setText("closedCount",`已平 ${ledger.pairs.length} 笔配对`);
  setText("basePosition",`${fmt(base)}%`);
  setText("swingPosition",`${fmt(swing)}%`);
  setText("baseCount",`${holdings.filter(h=>h.positionType==="底仓").length} 只底仓标的`);
  setText("cashPosition",`可用仓位 ${fmt(Math.max(0,100-total))}%`);
  setText("profitCount",ledger.pairs.filter(p=>p.pnlPct>=0).length);
  setText("lossCount",ledger.pairs.filter(p=>p.pnlPct<0).length);
  const latest = [...state.trades].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
  setText("lastUpdated",state.updatedAt ? formatDate(state.updatedAt,true) : latest ? formatDate(latest.date,true) : "暂无数据");
  ["totalBar","capitalUsedBar","baseBar","swingBar"].forEach((id,i)=>document.getElementById(id).style.width=`${Math.min(100,[total,total,base,swing][i])}%`);
  const changeEl = document.getElementById("totalChange");
  changeEl.className=`change ${change>0?"up":change<0?"down":"neutral"}`;
  changeEl.textContent=change===0?"无变化":`${change>0?"+":""}${fmt(change)}%`;
  const realizedEl = document.getElementById("realizedPct");
  realizedEl.className=`change ${realizedPct>0?"up":realizedPct<0?"down":"neutral"}`;

  renderHoldings(holdings);
  const stats = computeSymbolStats(holdings, ledger);
  renderAnalytics(stats, computeRiskProfile(holdings, stats, ledger));
  renderPairs(ledger.pairs);
  renderActivity();
  renderChart();
}

function renderHoldings(holdings) {
  const capital = Number(state.accountCapital) || 100000;
  const q=document.getElementById("searchInput").value.trim().toLowerCase();
  const filter=document.getElementById("statusFilter").value;
  const visible=holdings.filter(h=>(!q||h.name.toLowerCase().includes(q))&&(filter==="all"||h.positionType===filter))
    .sort((a,b)=>(a[sortKey]-b[sortKey])*sortDirection);
  const body=document.getElementById("holdingsBody");
  body.innerHTML=visible.map(h=>`<tr>
    <td data-label="标的"><div class="stock"><span class="stock-avatar">${esc(h.name[0])}</span><span><b>${esc(h.name)}</b></span></div></td>
    <td data-label="状态"><span class="status ${h.positionType==="底仓"?"base":"swing"}">${esc(h.positionType)}</span></td>
    <td data-label="仓位"><div class="position-cell"><b>${fmt(h.position)}%</b>${isShareMode()?`<small>${fmt(h.quantity,0)} 股</small>`:""}<div class="position-mini"><i style="width:${Math.min(100,h.position*3)}%"></i></div></div></td>
    <td data-label="占用资金"><b>${usd(capital*h.position/100)}</b></td>
    <td data-label="持仓成本"><div class="price-stack"><b>${money(h.cost)}</b><small>按仓位加权均价</small></div></td>
    <td data-label="最近操作"><span class="latest-action">${esc(h.lastTrade.action)} · ${formatDate(h.lastTrade.date)}</span><button class="mini-btn row-actions" title="编辑最近记录" onclick="editTrade('${h.lastTrade.id}')">✎</button></td>
  </tr>`).join("");
  document.getElementById("holdingsEmpty").hidden=visible.length>0;
}

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
  renderClosedPerformance(computeClosedPerformance(stats));
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

function setInsight(prefix, stat, meta) {
  setText(`${prefix}Symbol`, stat?.symbol || "—");
  setText(`${prefix}Meta`, meta);
}
function renderClosedPerformance(perf) {
  setText("closedWinRate", perf.winRate===null ? "—" : `${fmt(perf.winRate,0)}%`);
  setText("closedWinRateMeta", perf.pairCount ? `${perf.wins} 赢 / ${perf.losses} 亏 · ${perf.pairCount} 笔` : "暂无已平仓");
  setText("profitLossRatio", perf.profitLossRatio===null ? "—" : `${fmt(perf.profitLossRatio,2)} : 1`);
  setText("profitLossRatioMeta", perf.losses ? `平均盈利是平均亏损的 ${fmt(perf.profitLossRatio,2)} 倍` : "暂无亏损样本");
  setText("avgWinAmount", perf.wins ? usd(perf.avgWinAmount) : "—");
  setText("avgWinMeta", perf.wins ? `${perf.wins} 笔盈利平仓 · ${fmt(perf.avgWinContribution,2)}%/笔` : "暂无盈利平仓");
  setText("avgLossAmount", perf.losses ? usd(perf.avgLossAmount) : "—");
  setText("avgLossMeta", perf.losses ? `${perf.losses} 笔亏损平仓 · -${fmt(perf.avgLossContribution,2)}%/笔` : "暂无亏损平仓");
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
    <td data-label="平仓仓位"><b>${fmt(p.position)}%</b><br><small>${p.quantity?`${fmt(p.quantity,0)} 股`:"仓位"}</small></td>
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
    const sizeText = isShareMode() && t.quantity ? `${fmt(t.quantity,0)} 股 · 折算 ${fmt(t.positionChange,2)}%` : `${fmt(t.positionChange)}%`;
    return `<div class="activity-item">
      <div class="action-icon ${buy?"buy":"sell"}">${buy?"↑":"↓"}</div>
      <div class="activity-main">
        <div class="activity-title"><b>${esc(t.action)} · ${esc(t.name)}</b><time>${formatDate(t.date,true)}</time></div>
        <div class="activity-detail">价格 <strong>${money(t.price)}</strong> · ${isShareMode()?"股数":"仓位"} <strong>${buy?"+":"−"}${sizeText}</strong> · 折算 <strong>${usd(capital*t.positionChange/100)}</strong> · ${esc(t.positionType)}</div>
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
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="仓位趋势图">
    <defs><linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2864dc" stop-opacity=".18"/><stop offset="1" stop-color="#2864dc" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v=>`<line class="grid" x1="${pad.l}" y1="${y(v)}" x2="${W-pad.r}" y2="${y(v)}"/><text x="2" y="${y(v)+3}">${v}%</text>`).join("")}
    <path d="${area}" fill="url(#areaFill)"/><path d="${line("total")}" fill="none" stroke="var(--blue)" stroke-width="2.5" vector-effect="non-scaling-stroke"/>
    <path d="${line("base")}" fill="none" stroke="#83a9f6" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
    ${points.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.total)}" r="${points.length<15?3:1.5}" fill="var(--blue)"><title>${formatDate(p.date)} 总仓位 ${fmt(p.total)}%</title></circle>`).join("")}
    ${labels.map(i=>`<text text-anchor="${i===0?"start":i===points.length-1?"end":"middle"}" x="${x(i)}" y="${H-5}">${formatDate(points[i].date)}</text>`).join("")}
  </svg>`;
}

function getOpenLotsForForm(trade=null) {
  const trades = state.trades.filter(t=>t.id!==trade?.id);
  return computeLedger(trades).lots.filter(l=>isLotOpen(l));
}
function isLotOpen(lot) {
  return isShareMode()
    ? Number(lot.remainingQuantity) > 0.0001
    : Number(lot.remainingPosition) > 0.0001;
}
function getMatchingCloseLots(trade=null) {
  const code = value("name").trim().toUpperCase();
  const positionType = value("positionType");
  return getOpenLotsForForm(trade).filter(l=>(!code || l.code===code) && l.positionType===positionType);
}
function refreshCloseLotOptions(trade=null) {
  const row = document.getElementById("closeLotRow");
  const select = document.getElementById("closeLotId");
  const action = value("action");
  const code = value("name").trim().toUpperCase();
  row.hidden = !isSell(action);
  if (!isSell(action)) { select.innerHTML=""; return; }
  const positionType = value("positionType");
  const lots = getMatchingCloseLots(trade);
  const emptyText = code ? `暂无 ${positionType} 的 ${code} 买入记录` : `先输入标的，只显示 ${positionType} 买入记录`;
  select.innerHTML = lots.length
    ? [`<option value="">自动匹配最早 ${positionType} 开仓</option>`, ...lots.map(l=>`<option value="${l.lotId}">${formatDate(l.date,true)} · ${esc(l.name)} · ${esc(l.positionType)} · ${isShareMode()?`剩 ${fmt(l.remainingQuantity,0)} 股`:`剩 ${fmt(l.remainingPosition)}%`} · ${money(l.price)}</option>`)].join("")
    : `<option value="">${esc(emptyText)}</option>`;
  select.value = lots.some(l=>l.lotId===trade?.closeLotId) ? trade.closeLotId : "";
}
function configureTradeFormMode() {
  const input = document.getElementById("positionChange");
  const quick = document.getElementById("quickPosition");
  const sharesLabel = document.getElementById("quickSharesLabel");
  if (isShareMode()) {
    document.getElementById("quickPositionLabel").firstChild.textContent = "快捷股数";
    document.getElementById("positionInputLabel").textContent = "股数";
    input.min = "0";
    input.max = "100000000";
    input.step = "100";
    input.placeholder = "例如：100";
    document.getElementById("positionMinus").textContent = "-100";
    document.getElementById("positionPlus").textContent = "+100";
    quick.innerHTML = `<option value="100">1 手 100 股</option><option value="200">2 手 200 股</option><option value="500">500 股</option><option value="1000">1000 股</option><option value="">手动输入</option>`;
    if (sharesLabel) sharesLabel.style.display = "none";
  } else {
    document.getElementById("quickPositionLabel").firstChild.textContent = "快捷仓位";
    document.getElementById("positionInputLabel").textContent = "仓位变化（%）";
    input.min = "0";
    input.max = "100";
    input.step = "5";
    input.placeholder = "例如：5";
    document.getElementById("positionMinus").textContent = "-5%";
    document.getElementById("positionPlus").textContent = "+5%";
    quick.innerHTML = `<option value="10">常用 10%</option><option value="5">一半 5%</option><option value="15">15%</option><option value="20">20%</option><option value="">手动输入</option>`;
    if (sharesLabel) sharesLabel.style.display = "";
  }
}
function applyQuickShares(shares) {
  const price = Number(document.getElementById("price").value);
  const capital = Number(state.accountCapital) || activeMarketConfig().defaultCapital;
  if (!price || !capital) {
    toast("请先输入价格和本金");
    return;
  }
  const pct = shares * price / capital * 100;
  document.getElementById("positionChange").value = fmt(pct, 2);
  document.getElementById("quickPosition").value = "";
  updatePositionSignedPreview();
}
function syncQuickPosition() {
  const quick = value("quickPosition");
  if (quick !== "") document.getElementById("positionChange").value = quick;
  updatePositionSignedPreview();
}
function getSymbolSuggestions() {
  const map = new Map();
  for (const t of state.trades) {
    if (!t.code || !buyActions.includes(t.action)) continue;
    const item = map.get(t.code) || { code:t.code, count:0, lastDate:"" };
    item.count += 1;
    if (!item.lastDate || new Date(t.date) > new Date(item.lastDate)) item.lastDate = t.date;
    map.set(t.code, item);
  }
  return [...map.values()].sort((a,b)=>b.count-a.count || new Date(b.lastDate)-new Date(a.lastDate)).slice(0,12);
}
function refreshSymbolSuggestions() {
  const list = document.getElementById("symbolSuggestions");
  if (!list) return;
  list.innerHTML = getSymbolSuggestions().map(s=>`<option value="${esc(s.code)}" label="买入 ${s.count} 次"></option>`).join("");
}
function updatePositionSignedPreview() {
  const el = document.getElementById("positionSignedPreview");
  if (!el) return;
  const n = Number(value("positionChange")) || 0;
  const sign = isSell(value("action")) ? "−" : "+";
  if (isShareMode()) {
    const price = Number(value("price")) || 0;
    const capital = Number(state.accountCapital) || activeMarketConfig().defaultCapital;
    const pct = price && n ? price * n / capital * 100 : 0;
    el.textContent = `实际记为 ${sign}${fmt(n,0)} 股，折算 ${fmt(pct,2)}% 仓位`;
  } else {
    el.textContent = `实际记为 ${sign}${fmt(n)}%`;
  }
}
function adjustPositionByStep(delta) {
  const input = document.getElementById("positionChange");
  const current = Number(input.value) || 0;
  const step = isShareMode() ? 100 : 5;
  const max = isShareMode() ? 100000000 : 100;
  const next = Math.min(max, Math.max(step, current + (delta > 0 ? step : -step)));
  input.value = fmt(next);
  document.getElementById("quickPosition").value = (isShareMode() ? ["100","200","500","1000"] : ["5","10","15","20"]).includes(String(input.value)) ? String(input.value) : "";
  updatePositionSignedPreview();
}
function openTrade(trade=null) {
  document.getElementById("tradeForm").reset();
  configureTradeFormMode();
  refreshSymbolSuggestions();
  document.getElementById("editId").value=trade?.id||"";
  document.getElementById("dialogTitle").textContent=trade?"编辑操作":"记录操作";
  const ids=["name","action","positionType","price","note"];
  ids.forEach(id=>document.getElementById(id).value=trade?.[id]??"");
  document.getElementById("positionChange").value = isShareMode() ? (trade?.quantity ?? "") : (trade?.positionChange ?? "");
  document.getElementById("tradeDate").value=toLocalInput(trade?.date||new Date().toISOString());
  if (!trade) {
    document.getElementById("action").value="买入";
    document.getElementById("positionType").value="波段仓";
    document.getElementById("quickPosition").value=isShareMode()?"100":"10";
    document.getElementById("positionChange").value=isShareMode()?"100":"10";
  } else {
    const formValue = isShareMode() ? String(trade.quantity || "") : String(trade.positionChange);
    const quick = (isShareMode() ? ["100","200","500","1000"] : ["5","10","15","20"]).includes(formValue) ? formValue : "";
    document.getElementById("quickPosition").value = quick;
  }
  refreshCloseLotOptions(trade);
  updatePositionSignedPreview();
  document.getElementById("tradeDialog").showModal();
}
function toLocalInput(iso) {
  const d=new Date(iso), local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
window.editTrade=id=>openTrade(state.trades.find(t=>t.id===id));
window.deleteTrade=id=>{
  if (!confirm("确定删除这条操作记录？删除后持仓和平仓配对将重新计算。")) return;
  state.trades=state.trades.filter(t=>t.id!==id); state.isDemo=false; saveState(); render(); toast("记录已删除");
};
function close(id){ document.getElementById(id).close(); }
function toast(message, action=null) {
  const el=document.getElementById("toast");
  el.innerHTML=`<span>${esc(message)}</span>${action?`<button type="button" id="toastAction">${esc(action.label)}</button>`:""}`;
  el.classList.add("show");
  const actionBtn=document.getElementById("toastAction");
  if(actionBtn) actionBtn.onclick=action.onClick;
  clearTimeout(toast.timer);
  if(!action) toast.timer=setTimeout(()=>el.classList.remove("show"),2200);
}
function download(content,type,filename) {
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([content],{type})); a.download=filename;
  a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function csvEscape(v){ const s=String(v??""); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; }
function exportCsv() {
  const fields=["date","name","action","positionType","price","positionChange","quantity","closeLotId","note"];
  const labels=["操作时间","标的","操作类型","持仓类型","操作价格","仓位变化","股数","对应开仓ID","备注"];
  download("\ufeff"+[labels,...state.trades.map(t=>fields.map(f=>csvEscape(t[f])))].map(r=>r.join(",")).join("\n"),"text/csv;charset=utf-8",`${activeMarketConfig().label}操作记录.csv`);
  close("exportDialog"); toast("CSV 已导出");
}
function exportJson() {
  download(JSON.stringify({version:2,market:activeMarket,exportedAt:new Date().toISOString(),accountCapital:Number(state.accountCapital)||activeMarketConfig().defaultCapital,currency:marketCurrency(activeMarket),trades:state.trades},null,2),"application/json",`${activeMarketConfig().label}操作记录.json`);
  close("exportDialog"); toast("JSON 已导出");
}
function parseCsv(text) {
  const rows=[]; let row=[],cell="",quoted=false;
  for(let i=0;i<text.length;i++){ const c=text[i],n=text[i+1]; if(c==='"'&&quoted&&n==='"'){cell+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===","&&!quoted){row.push(cell);cell="";}else if((c==="\n"||c==="\r")&&!quoted){if(c==="\r"&&n==="\n")i++;row.push(cell);if(row.some(Boolean))rows.push(row);row=[];cell="";}else cell+=c; }
  row.push(cell); if(row.some(Boolean)) rows.push(row);
  if(rows.length<2) throw new Error("CSV 中没有数据");
  const aliases={操作时间:"date",标的:"name",标的名称:"name",标的代码:"code",操作类型:"action",持仓类型:"positionType",操作价格:"price",仓位变化:"positionChange",股数:"quantity",对应开仓ID:"closeLotId",备注:"note"};
  const headers=rows[0].map(h=>aliases[h.trim()]||h.trim());
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]??""])));
}
function validateTrades(items) {
  if (!Array.isArray(items)) throw new Error("文件格式不正确");
  return items.map((t,i)=>{
    if(!(t.name||t.code||t.symbol)||!t.action||!t.date) throw new Error(`第 ${i+1} 条记录缺少必要字段`);
    if(![...buyActions,...sellActions].includes(normalizeAction(t.action))) throw new Error(`第 ${i+1} 条操作类型不支持`);
    const price=Number(t.price), positionChange=Number(t.positionChange), quantity=Number(t.quantity);
    if(Number.isNaN(price) || price <= 0) throw new Error(`第 ${i+1} 条价格不正确`);
    if(isShareMode()) {
      if(Number.isNaN(quantity) || quantity <= 0) throw new Error(`第 ${i+1} 条股数不正确`);
    } else if(Number.isNaN(positionChange) || positionChange <= 0) throw new Error(`第 ${i+1} 条仓位变化不正确`);
    return normalizeTrade({...t, market:activeMarket});
  });
}
function switchMarket(market) {
  const nextMarket = normalizeMarket(market);
  if (nextMarket === activeMarket) return;
  saveState();
  activeMarket = nextMarket;
  state = fallbackState(activeMarket);
  document.getElementById("searchInput").value = "";
  document.getElementById("statusFilter").value = "all";
  render();
  toast(`已切换到${activeMarketConfig().label}看板`);
}

document.getElementById("addBtn").onclick=()=>openTrade();
document.getElementById("closeDialog").onclick=()=>close("tradeDialog");
document.getElementById("cancelDialog").onclick=()=>close("tradeDialog");
document.getElementById("exportBtn").onclick=()=>document.getElementById("exportDialog").showModal();
document.getElementById("closeExport").onclick=()=>close("exportDialog");
document.getElementById("exportCsv").onclick=exportCsv;
document.getElementById("exportJson").onclick=exportJson;
document.getElementById("importBtn").onclick=()=>document.getElementById("fileInput").click();
document.getElementById("marketSwitch").onclick=e=>{ if(e.target.dataset.market) switchMarket(e.target.dataset.market); };
document.getElementById("action").onchange=()=>{ refreshCloseLotOptions(); updatePositionSignedPreview(); };
document.getElementById("name").onfocus=refreshSymbolSuggestions;
document.getElementById("name").oninput=()=>refreshCloseLotOptions();
document.getElementById("price").oninput=updatePositionSignedPreview;
document.getElementById("positionType").onchange=()=>refreshCloseLotOptions();
document.getElementById("quickPosition").onchange=syncQuickPosition;
document.getElementById("positionMinus").onclick=()=>adjustPositionByStep(-5);
document.getElementById("positionPlus").onclick=()=>adjustPositionByStep(5);
document.getElementById("positionChange").oninput=()=>{ document.getElementById("quickPosition").value=""; updatePositionSignedPreview(); };
document.getElementById("fileInput").onchange=async e=>{
  const file=e.target.files[0]; if(!file)return;
  try {
    const text=await file.text();
    const raw=file.name.toLowerCase().endsWith(".json")?(JSON.parse(text).trades||JSON.parse(text)):parseCsv(text);
    const imported=validateTrades(raw);
    if(!confirm(`将导入 ${imported.length} 条记录并替换当前数据，是否继续？`))return;
    const parsed = file.name.toLowerCase().endsWith(".json") ? JSON.parse(text) : null;
    state={trades:imported,accountCapital:Number(parsed?.accountCapital)||Number(state.accountCapital)||activeMarketConfig().defaultCapital,currency:marketCurrency(activeMarket),market:activeMarket,isDemo:false,source:"local"};saveState();render();toast(`已导入 ${imported.length} 条${activeMarketConfig().label}记录`);
  } catch(err){ alert(`导入失败：${err.message}`); }
  finally {e.target.value="";}
};
document.getElementById("tradeForm").onsubmit=e=>{
  e.preventDefault();
  const id=document.getElementById("editId").value;
  const editingTrade = state.trades.find(t=>t.id===id);
  const sizeValue = Number(value("positionChange"));
  if (!Number.isFinite(Number(value("price"))) || Number(value("price")) <= 0) {
    alert("请输入有效的操作价格。");
    return;
  }
  if (!Number.isFinite(sizeValue) || sizeValue <= 0) {
    alert(isShareMode() ? "请输入有效的股数。" : "请输入有效的仓位变化。");
    return;
  }
  if (isSell(value("action")) && !value("closeLotId") && !getMatchingCloseLots(editingTrade).length) {
    alert("当前标的和持仓类型下没有可卖出的买入批次，请先确认标的或持仓类型。");
    return;
  }
  const trade=normalizeTrade({
    id:id||crypto.randomUUID(),
    name:value("name").trim(),
    action:value("action"),
    positionType:value("positionType"),
    price:Number(value("price")),
    quantity:isShareMode()?Number(value("positionChange")):null,
    positionChange:isShareMode()?undefined:Number(value("positionChange")),
    date:new Date(value("tradeDate")).toISOString(),
    closeLotId:value("closeLotId"),
    note:value("note").trim(),
    market:activeMarket
  });
  if(id) state.trades=state.trades.map(t=>t.id===id?trade:t); else state.trades.push(trade);
  state.isDemo=false; state.source="local"; saveState();refreshSymbolSuggestions();close("tradeDialog");render();toast(id?"记录已更新":"操作已记录");
};
document.getElementById("capitalBtn").onclick=()=>{
  const current = Number(state.accountCapital) || 100000;
  const raw = prompt(`输入账户本金（${activeCurrency().label}）`, String(current));
  if (raw === null) return;
  const next = Number(String(raw).replace(/[$¥￥,\s]/g,""));
  if (!Number.isFinite(next) || next <= 0) { alert("请输入有效的本金金额"); return; }
  state.accountCapital = next;
  state.isDemo=false; state.source="local"; saveState(); render(); toast("本金已更新");
};
document.getElementById("searchInput").oninput=()=>renderHoldings(getHoldings());
document.getElementById("statusFilter").onchange=()=>renderHoldings(getHoldings());
document.querySelectorAll(".sortable").forEach(th=>th.onclick=()=>{
  const key=th.dataset.sort; if(sortKey===key)sortDirection*=-1;else{sortKey=key;sortDirection=-1;}renderHoldings(getHoldings());
});
document.getElementById("rangeTabs").onclick=e=>{
  if(!e.target.dataset.days)return;
  rangeDays=e.target.dataset.days;document.querySelectorAll("#rangeTabs button").forEach(b=>b.classList.toggle("active",b===e.target));renderChart();
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
  const label = activeMarketConfig().label;
  if(confirm(`这会清空【${label}】看板的全部操作记录，不只是清空流水展示。清空后可撤销一次。是否继续？`)){
    saveClearBackup({ market:activeMarket, clearedAt:new Date().toISOString(), state:cloneState(state) });
    state={trades:[],accountCapital:Number(state.accountCapital)||activeMarketConfig().defaultCapital,currency:marketCurrency(activeMarket),market:activeMarket,isDemo:false,source:"local"};
    saveState();
    render();
    toast(`已清空${label}看板`, { label:"撤销", onClick:undoLastClear });
  }
};
document.getElementById("themeBtn").onclick=()=>{
  document.body.classList.toggle("dark");localStorage.setItem(THEME_KEY,document.body.classList.contains("dark")?"dark":"light");
};
if(localStorage.getItem(THEME_KEY)==="dark")document.body.classList.add("dark");
async function init() {
  activeMarket = normalizeMarket(localStorage.getItem(MARKET_KEY));
  state = fallbackState(activeMarket);
  render();
  lastClearSnapshot = loadClearBackup();
  if (lastClearSnapshot?.state?.trades?.length) {
    toast(`检测到上次清空前备份`, { label:"恢复", onClick:undoLastClear });
  } else if (!state.trades.length) toast(`已进入${activeMarketConfig().label}账本，可开始记录`);
  const currBtn = document.getElementById("currencyBtn");
  if (currBtn) {
    currBtn.onclick = toggleCurrency;
    currBtn.textContent = state.currency;
  }
  document.querySelectorAll(".share-btn").forEach(btn => {
    btn.onclick = () => applyQuickShares(Number(btn.dataset.shares));
  });
}
init();
