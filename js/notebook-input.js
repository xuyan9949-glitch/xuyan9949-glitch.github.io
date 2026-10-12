/* Preserve unfinished company notes separately from saved research records. */
(() => {
  const form = document.getElementById('note-form');
  if (!form) return;
  const status = document.getElementById('input-status');
  const company = new URLSearchParams(location.search).get('company') || '';
  const key = 'xxyalpha.research-notebook.v1.input.' + (company || 'general');
  const fields = ['title', 'eventDate', 'kind', 'observed', 'judgment', 'action', 'source', 'company', 'event', 'revises'];
  let previous = null, available = true;
  function valid(value) {
    return value && value.version === 1 && value.values &&
      fields.every(name => typeof value.values[name] === 'string' && value.values[name].length <= (name === 'title' ? 160 : 50000));
  }
  function snapshot() {
    return Object.fromEntries(fields.map(name => [name, form.elements.namedItem(name).value]));
  }
  function unchanged() {
    if (localStorage.getItem(key) !== previous) throw Error('changed');
  }
  function failure(error) {
    available = false;
    status.textContent = error.message === 'changed'
      ? '另一页面更新了这份输入，已暂停自动暂存。请保留当前内容，再刷新核对。'
      : '自动暂存不可用，请保留当前输入并手动保存记录。';
  }
  try {
    previous = localStorage.getItem(key);
    if (previous) {
      const saved = JSON.parse(previous);
      if (!valid(saved)) throw Error('invalid');
      for (const name of fields) {
        const field = form.elements.namedItem(name);
        if (field.tagName === 'SELECT' && !Array.from(field.options).some(o => o.value === saved.values[name])) continue;
        field.value = saved.values[name];
      }
      document.getElementById('private-notebook').open = true;
      status.textContent = '已恢复尚未保存的输入。仅保存在此浏览器，未发布。';
    }
  } catch (error) { failure(error); }
  function stash() {
    if (!available) return;
    try {
      unchanged();
      const value = { version: 1, values: snapshot() };
      if (!valid(value)) throw Error('invalid');
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      previous = serialized;
      status.textContent = '输入已自动暂存到此浏览器；点击保存后才成为记录。';
    } catch (error) { failure(error); }
  }
  form.addEventListener('input', stash);
  form.addEventListener('change', stash);
  form.addEventListener('notebook:saved', () => {
    if (!available) return;
    try {
      unchanged();
      localStorage.removeItem(key);
      previous = null;
      status.textContent = '';
    } catch (error) { failure(error); }
  });
})();
