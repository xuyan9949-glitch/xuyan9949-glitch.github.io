document.addEventListener('DOMContentLoaded', () => {
    if (typeof diagrams === 'undefined') return;

    const grid = document.getElementById('diagram-page-grid');
    const tabs = document.getElementById('diagram-page-tabs');
    const summary = document.getElementById('diagram-summary');
    const lightbox = document.getElementById('diagram-page-lightbox');
    const lightboxImage = document.getElementById('diagram-page-image');
    const lightboxTitle = document.getElementById('diagram-page-title');
    const closeButton = document.getElementById('diagram-page-close');
    const preferredOrder = ['存储', '光', 'PCB', '电源', '日历', '组合', 'serenity'];
    let activeCategory = 'all';
    let returnFocus = null;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function imagePath(item) {
        return `/images/diagrams/${item.dir}/${item.file}`;
    }

    function renderTabs() {
        const available = new Set(diagrams.map(item => item.category));
        const categories = ['all', ...preferredOrder.filter(category => available.has(category))];
        tabs.innerHTML = categories.map(category => {
            const active = category === activeCategory;
            const label = category === 'all' ? '全部' : category === 'serenity' ? 'Serenity' : category;
            return `<button type="button" class="diagram-tab${active ? ' active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
        }).join('');

        tabs.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                activeCategory = button.dataset.category;
                render();
            });
        });
    }

    function openDiagram(item, trigger) {
        returnFocus = trigger;
        lightboxImage.src = imagePath(item);
        lightboxImage.alt = item.title;
        lightboxTitle.textContent = item.title;
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        closeButton.focus();
    }

    function closeDiagram() {
        lightbox.classList.remove('open');
        lightbox.setAttribute('aria-hidden', 'true');
        lightboxImage.src = '';
        document.body.style.overflow = '';
        returnFocus?.focus();
    }

    function render() {
        renderTabs();
        const visible = activeCategory === 'all'
            ? diagrams
            : diagrams.filter(item => item.category === activeCategory);
        summary.textContent = `共 ${visible.length} 张`;
        grid.innerHTML = visible.map((item, index) => `
            <button type="button" class="diagram-card" data-index="${index}" aria-label="查看大图：${escapeHtml(item.title)}">
                <img src="${escapeHtml(imagePath(item))}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async">
                <span class="diagram-label">${escapeHtml(item.title)}</span>
            </button>
        `).join('');

        grid.querySelectorAll('.diagram-card').forEach(button => {
            button.addEventListener('click', () => openDiagram(visible[Number(button.dataset.index)], button));
        });
    }

    closeButton.addEventListener('click', closeDiagram);
    lightbox.addEventListener('click', event => {
        if (event.target === lightbox) closeDiagram();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && lightbox.classList.contains('open')) closeDiagram();
    });

    render();
});
