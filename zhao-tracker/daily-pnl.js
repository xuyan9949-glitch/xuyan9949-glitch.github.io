/* Percent-of-capital ledger: each lot has synthetic shares based on its entry. */
function marketDate(value) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
}
function calculateDailyPnl({trades, ledger, capital, quotes={}, quoteUpdatedAt, quoteError, now=new Date(), symbolFor=code=>code}) {
  const date=marketDate(now), issues=new Set(), byCode={};
  let held=0, sold=0, heldMissing=false, soldMissing=false;
  const today=t=>marketDate(t.date)===date;
  const row=code=>byCode[code] ||= {held:0,sold:0,heldMissing:false,soldMissing:false};
  const quoteValue=(code,key)=>{
    const quote=quotes[symbolFor(code)], stamp=quote?.updatedAt || quoteUpdatedAt;
    const age=Number(now)-new Date(stamp).getTime();
    const weekday=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',weekday:'short'}).format(now);
    if (quoteError || !stamp || !Number.isFinite(age) || age>120000 || age < -60000 || marketDate(stamp)!==date || ['Sat','Sun'].includes(weekday) || !(Number(quote?.[key])>0)) return null;
    return Number(quote[key]);
  };
  const add=(lot,position,exit,kind)=>{
    const r=row(lot.code), base=today(lot)?Number(lot.price):quoteValue(lot.code,'prevClose');
    if (!(Number(lot.price)>0) || !(base>0) || !(exit>0)) {
      issues.add(lot.code); r[kind+'Missing']=true;
      if(kind==='held') heldMissing=true; else soldMissing=true;
      return;
    }
    const value=capital*position/100/Number(lot.price)*(exit-base);
    r[kind]+=value;
    if(kind==='held') held+=value; else sold+=value;
  };
  for(const lot of ledger.lots) if(lot.remainingPosition>0.0001) add(lot,lot.remainingPosition,quoteValue(lot.code,'last'),'held');
  for(const pair of ledger.pairs) if(today(pair.closeTrade)) add(pair.openTrade,pair.position,Number(pair.sellPrice),'sold');
  for(const trade of trades.filter(t=>today(t)&&['减仓','卖出','清仓'].includes(t.action))) {
    const matched=ledger.pairs.filter(p=>p.closeTrade.id===trade.id).reduce((sum,p)=>sum+p.position,0);
    if(matched+0.0001<Number(trade.positionChange) || !matched) {
      issues.add(`${trade.code}（卖出未完整配对）`); soldMissing=true; row(trade.code).soldMissing=true;
    }
  }
  return {date,held,sold,total:held+sold,heldMissing,soldMissing,complete:!heldMissing&&!soldMissing,issues:[...issues],byCode};
}
if(typeof module!=='undefined') module.exports={marketDate,calculateDailyPnl};
