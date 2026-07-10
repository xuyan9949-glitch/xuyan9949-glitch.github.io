const STORAGE_KEY = "zhao-tracker-data-v5";
const LEGACY_KEYS = [];
const THEME_KEY = "zhao-tracker-theme";
const SHARED_DATA_URL = "data/tracker-data.json";
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

let state = { trades: [], accountCapital: 100000, isDemo: false, source: "loading" };
let rangeDays = 30;
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
function esc(value="") { return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function fmt(n,digits=1) { return Number(n || 0).toFixed(digits).replace(/\.0$/,""); }
function money(n) { return `$${fmt(n,2)}`; }
function usd(n) {
  const sign = Number(n) < 0 ? "-" : "";
  return `${sign}$${Math.abs(Number(n)||0).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2})}`;
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

  setText("totalPosition",`${fmt(total)}%`);
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
    <td data-label="仓位"><div class="position-cell"><b>${fmt(h.position)}%</b><div class="position-mini"><i style="width:${Math.min(100,h.position*3)}%"></i></div></div></td>
    <td data-label="占用资金"><b>${usd(capital*h.position/100)}</b></td>
    <td data-label="持仓成本"><div class="price-stack"><b>${money(h.cost)}</b><small>按仓位加权均价</small></div></td>
    <td data-label="最近操作"><span class="latest-action">${esc(h.lastTrade.action)} · ${formatDate(h.lastTrade.date)}</span><button class="mini-btn row-actions" title="编辑最近记录" onclick="editTrade('${h.lastTrade.id}')">✎</button></td>
  </tr>`).join("");
  document.getElementById("holdingsEmpty").hidden=visible.length>0;
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
window.deleteTrade=id=>{
  if (!confirm("确定删除这条操作记录？删除后持仓和平仓配对将重新计算。")) return;
  state.trades=state.trades.filter(t=>t.id!==id); state.isDemo=false; saveState(); render(); toast("记录已删除");
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
  download("\ufeff"+[labels,...state.trades.map(t=>fields.map(f=>csvEscape(t[f])))].map(r=>r.join(",")).join("\n"),"text/csv;charset=utf-8","赵哥操作记录.csv");
  close("exportDialog"); toast("CSV 已导出");
}
function exportJson() {
  download(JSON.stringify({version:5,exportedAt:new Date().toISOString(),accountCapital:Number(state.accountCapital)||100000,trades:state.trades},null,2),"application/json","赵哥操作记录.json");
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
document.getElementById("tradeForm").onsubmit=e=>{
  e.preventDefault();
  const id=document.getElementById("editId").value;
  const trade=normalizeTrade({id:id||crypto.randomUUID(),name:value("name").trim(),action:value("action"),positionType:value("positionType"),price:Number(value("price")),positionChange:Number(value("positionChange")),date:new Date(value("tradeDate")).toISOString(),closeLotId:value("closeLotId"),note:value("note").trim()});
  if(id) state.trades=state.trades.map(t=>t.id===id?trade:t); else state.trades.push(trade);
  state.isDemo=false; state.source="local"; saveState();close("tradeDialog");render();toast(id?"本机预览已更新":"本机预览已记录");
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
document.querySelectorAll(".sortable").forEach(th=>th.onclick=()=>{
  const key=th.dataset.sort; if(sortKey===key)sortDirection*=-1;else{sortKey=key;sortDirection=-1;}renderHoldings(getHoldings());
});
document.getElementById("rangeTabs").onclick=e=>{
  if(!e.target.dataset.days)return;
  rangeDays=e.target.dataset.days;document.querySelectorAll("#rangeTabs button").forEach(b=>b.classList.toggle("active",b===e.target));renderChart();
};
document.getElementById("clearBtn").onclick=()=>{
  if(!state.trades.length)return;
  if(confirm("确定清空全部操作记录？此操作只影响本机预览，建议先导出备份。")){state={trades:[],accountCapital:Number(state.accountCapital)||100000,isDemo:false,source:"local"};saveState();render();toast("本机预览已清空");}
};
document.getElementById("themeBtn").onclick=()=>{
  document.body.classList.toggle("dark");localStorage.setItem(THEME_KEY,document.body.classList.contains("dark")?"dark":"light");
};
if(localStorage.getItem(THEME_KEY)==="dark")document.body.classList.add("dark");
async function init() {
  state = await loadSharedState();
  render();
  if (state.source === "shared") toast("已加载 GitHub 共享数据");
  else if (state.loadError) toast("共享数据加载失败，已使用本机数据");
}
init();
