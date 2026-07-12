document.addEventListener('DOMContentLoaded', () => {
    if (typeof articles === 'undefined') return;

    const PAGE_SIZE = 12;
    const listEl = document.getElementById('archive-notes-list');
    const categoriesEl = document.getElementById('archive-categories');
    const paginationEl = document.getElementById('archive-pagination');
    const searchEl = document.getElementById('archive-search');
    const summaryEl = document.getElementById('archive-summary');
    const categoryOrder = ['美股', 'A股', '产业思考', '近期热点', '见贤思齐'];
    const params = new URLSearchParams(window.location.search);
    const state = {
        category: params.get('category') || 'all',
        query: params.get('q') || '',
        page: Math.max(1, Number(params.get('page')) || 1),
    };

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        })[char]);
    }

    function sortedArticles() {
        return [...articles].sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });
    }

    function filteredArticles() {
        const query = state.query.trim().toLowerCase();
        return sortedArticles().filter(article => {
            const categoryMatch = state.category === 'all' || article.category === state.category;
            if (!categoryMatch) return false;
            if (!query) return true;
            const haystack = [
                article.title,
                article.summary,
                article.keywords || '',
                article.category,
                article.subcategory || '',
                ...(article.tags || []),
            ].join(' ').toLowerCase();
            return haystack.includes(query);
        });
    }

    function updateUrl() {
        const next = new URLSearchParams();
        if (state.category !== 'all') next.set('category', state.category);
        if (state.query) next.set('q', state.query);
        if (state.page > 1) next.set('page', state.page);
        const query = next.toString();
        window.history.replaceState(null, '', query ? `${window.location.pathname}?${query}` : window.location.pathname);
    }

    function renderCategories() {
        const available = new Set(articles.map(article => article.category));
        const categories = ['all', ...categoryOrder.filter(category => available.has(category))];
        categoriesEl.innerHTML = categories.map(category => {
            const active = state.category === category;
            const label = category === 'all' ? '全部' : category;
            return `<button type="button" class="cat-tag${active ? ' active' : ''}" data-category="${escapeHtml(category)}" aria-pressed="${active}">${escapeHtml(label)}</button>`;
        }).join('');

        categoriesEl.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                state.category = button.dataset.category;
                state.page = 1;
                render();
            });
        });
    }

    function renderCards(items) {
        if (!items.length) {
            listEl.innerHTML = '<div class="empty-notes">没有找到匹配的笔记。</div>';
            return;
        }

        listEl.innerHTML = items.map(article => `
            <a href="${escapeHtml(article.file)}" class="note-card${article.pinned ? ' note-pinned' : ''}">
                <div class="meta">
                    <span>${escapeHtml(article.date)}</span>
                    <span class="dot"></span>
                    <span>${escapeHtml(article.category)}${article.subcategory ? ` · ${escapeHtml(article.subcategory)}` : ''}</span>
                </div>
                <h3>${escapeHtml(article.title)}</h3>
                <p>${escapeHtml(article.summary)}</p>
                <div class="tags">${(article.tags || []).slice(0, 4).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
            </a>
        `).join('');
    }

    function pageItems(totalPages) {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
        const items = [1];
        const start = Math.max(2, state.page - 1);
        const end = Math.min(totalPages - 1, state.page + 1);
        if (start > 2) items.push('start-ellipsis');
        for (let page = start; page <= end; page++) items.push(page);
        if (end < totalPages - 1) items.push('end-ellipsis');
        items.push(totalPages);
        return items;
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationEl.innerHTML = '';
            return;
        }

        const controls = [
            `<button type="button" class="notes-page-btn" data-page="${state.page - 1}" aria-label="上一页" ${state.page === 1 ? 'disabled' : ''}>‹</button>`,
            ...pageItems(totalPages).map(item => typeof item === 'number'
                ? `<button type="button" class="notes-page-btn${item === state.page ? ' active' : ''}" data-page="${item}" aria-label="第 ${item} 页" ${item === state.page ? 'disabled aria-current="page"' : ''}>${item}</button>`
                : '<span class="notes-page-ellipsis" aria-hidden="true">…</span>'),
            `<button type="button" class="notes-page-btn" data-page="${state.page + 1}" aria-label="下一页" ${state.page === totalPages ? 'disabled' : ''}>›</button>`,
        ];
        paginationEl.innerHTML = controls.join('');

        paginationEl.querySelectorAll('button:not([disabled])').forEach(button => {
            button.addEventListener('click', () => {
                state.page = Number(button.dataset.page);
                render();
                document.querySelector('.archive-header')?.scrollIntoView({ block: 'start' });
            });
        });
    }

    function render() {
        renderCategories();
        const filtered = filteredArticles();
        const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
        state.page = Math.min(state.page, totalPages);
        const start = (state.page - 1) * PAGE_SIZE;
        renderCards(filtered.slice(start, start + PAGE_SIZE));
        renderPagination(totalPages);
        summaryEl.textContent = `共 ${filtered.length} 篇`;
        updateUrl();
    }

    searchEl.value = state.query;
    searchEl.addEventListener('input', () => {
        state.query = searchEl.value.trim();
        state.page = 1;
        render();
    });

    render();
});
