(() => {
  const params = new URLSearchParams(location.search);
  const company = window.archiveData?.companies?.find(c => c.id === params.get('company'));
  document.querySelectorAll('[data-publisher]').forEach(a => {
    const url = new URL(a.href);
    if (company) url.searchParams.set('company', company.id);
    if (params.get('event')) url.searchParams.set('event', params.get('event'));
    a.href = url.href;
  });
  const context = document.getElementById('workbench-company');
  if (company && context) {
    context.hidden = false;
    const link = context.querySelector('a');
    link.textContent = company.id + ' · ' + company.name;
    link.href = '/research/' + company.id.toLowerCase() + '/?tab=journal';
  }
  if (location.hash === '#private-notebook') document.getElementById('private-notebook').open = true;
})();
