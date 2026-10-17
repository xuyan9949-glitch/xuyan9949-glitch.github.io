(function (root) {
  'use strict';
  const roles = ['地主', '农民上家', '农民下家'];
  const rooms = ['初级场', '中级场', '高级场', '大师场', '其他'];
  function number(value) {
    if (value === '' || value === null || value === undefined || typeof value === 'boolean') return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  function net(row) {
    const start = number(row.start), end = number(row.end), flow = number(row.flow);
    return start === null || end === null ? null : end - start - (flow === null ? 0 : flow);
  }
  function summarize(rows) {
    let total = 0, peak = 0, drawdown = 0, complete = 0, wins = 0, outcomes = 0;
    const points = [];
    rows.forEach(row => {
      const value = net(row);
      if (value === null) return;
      complete++; total += value; peak = Math.max(peak, total); drawdown = Math.max(drawdown, peak - total);
      if (['胜', '负'].includes(row.result)) { outcomes++; if (row.result === '胜') wins++; }
      points.push({ id: row.id, net: value, total, drawdown: peak - total });
    });
    return { complete, total: complete ? total : null, average: complete ? total / complete : null,
      winRate: outcomes ? wins / outcomes : null, wins, outcomes, drawdown: complete ? drawdown : null, points };
  }
  function validateRows(input) {
    if (!Array.isArray(input) || input.length > 10000) throw Error('备份必须为不超过10000条的记录数组。');
    const ids = new Set();
    return input.map((r, i) => {
      if (!r || typeof r !== 'object' || Array.isArray(r)) throw Error(`第${i + 1}条记录格式错误。`);
      if (!roles.includes(r.role) || !rooms.includes(r.room)) throw Error(`第${i + 1}条身份或场次无效。`);
      if (!['', '胜', '负'].includes(r.result || '')) throw Error(`第${i + 1}条胜负无效。`);
      for (const k of ['start','end','flow']) {
        if (r[k] !== '' && r[k] !== null && r[k] !== undefined && (number(r[k]) === null || Math.abs(number(r[k])) > 1e12)) throw Error(`第${i + 1}条余额无效。`);
      }
      if (number(r.start) !== null && number(r.start) < 0 || number(r.end) !== null && number(r.end) < 0) throw Error(`第${i + 1}条余额不能为负。`);
      const id = String(r.id || `import-${i}`).slice(0,80);
      if (ids.has(id)) throw Error('备份包含重复记录ID。'); ids.add(id);
      const date = String(r.date || '').slice(0,30);
      if (date && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{3})?Z?)?$/.test(date)) throw Error(`第${i+1}条日期无效。`);
      if (date) {
        const d = new Date(date), month=Number(date.slice(5,7)), day=Number(date.slice(8,10)), year=Number(date.slice(0,4));
        if (!Number.isFinite(d.getTime()) || month<1 || month>12 || day<1 || day>new Date(year,month,0).getDate()) throw Error(`第${i+1}条日期无效。`);
      }
      return { id, date, room: r.room, role: r.role, hero: String(r.hero || '').slice(0,30), result: r.result || '',
        start: number(r.start), end: number(r.end), flow: number(r.flow) ?? 0, note: String(r.note || '').slice(0,2000) };
    });
  }
  function filterHeroes(heroes, state) {
    const q = (state.q || '').trim().toLowerCase();
    const list = heroes.filter(h => (state.faction === '全部' || h.faction === state.faction) &&
      (!state.newOnly || h.new) && (!state.favoritesOnly || (state.favorites || []).includes(h.name)) &&
      (state.tag === '全部机制' || h.tags.includes(state.tag)) &&
      (state.evidence === '全部证据' || (state.evidence === '含用户资料' ? h.sources.some(s=>s.kind==='用户资料') : h.evidence.includes(state.evidence))) &&
      (!q || JSON.stringify([h.name,h.aliases,h.skillNames,h.summary,h.notes,h.strategy,h.skills]).toLowerCase().includes(q)));
    if (state.sort === 'date') list.sort((a,b)=>b.sourceDate.localeCompare(a.sourceDate));
    else if (state.sort === 'name') list.sort((a,b)=>a.name.localeCompare(b.name,'zh-CN'));
    else list.sort((a,b)=>Number(b.new)-Number(a.new)||b.sourceDate.localeCompare(a.sourceDate)||a.name.localeCompare(b.name,'zh-CN'));
    return list;
  }
  const api = { number, net, summarize, validateRows, filterHeroes, roles, rooms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BJPLogic = api;
})(typeof window !== 'undefined' ? window : globalThis);
