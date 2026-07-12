// ========================================
// 一键分享：复制标题+摘要+链接到剪贴板
// ========================================

const _siteName = "XXY Alpha";

function shareArticle() {
    const title = document.title
        .replace(/\s+[—|]\s+(Leslie 投资笔记|XXY Alpha)$/, '')
        .trim();
    const url = window.location.href;

    // 取文章第一段有效内容作为简介
    let summary = '';
    const content = document.querySelector('.article-content');
    if (content) {
        const ps = content.querySelectorAll('p');
        for (let p of ps) {
            const text = p.textContent.trim();
            if (text.length > 20 && text.length < 200) { summary = text; break; }
        }
    }

    const shareText = `📄 ${title}\n${summary || ''}\n${url}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareText).then(() => {
            _showToast('已复制，可分享到微信等');
        }).catch(() => _fallbackCopy(shareText));
    } else {
        _fallbackCopy(shareText);
    }
}

// 标的分享（抽屉页用）
function shareStock(name, code) {
    const url = window.location.href;
    const text = `📄 ${name} (${code})
${url}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            _showToast('已复制，可分享到微信等');
        }).catch(() => _fallbackCopy(text));
    } else {
        _fallbackCopy(text);
    }
}

function _fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); _showToast('已复制，可分享到微信等'); }
    catch { _showToast('复制失败，请手动复制'); }
    document.body.removeChild(ta);
}

function _showToast(msg) {
    let el = document.getElementById('_share_toast');
    if (!el) {
        el = document.createElement('div');
        el.id = '_share_toast';
        el.style.cssText = `
            position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
            background:#1d1d1f;color:#fff;padding:10px 24px;border-radius:10px;
            font-size:14px;font-weight:500;opacity:0;transition:opacity .3s;
            z-index:9999;pointer-events:none;white-space:nowrap;
            font-family:-apple-system,"PingFang SC",sans-serif;
            box-shadow:0 4px 16px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(el);
    }
    el.textContent = '✅ ' + msg;
    el.style.opacity = '1';
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}

function _slugHeading(text, index, usedIds) {
    const base = text
        .toLowerCase()
        .trim()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '') || `section-${index + 1}`;
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    return id;
}

function _buildArticleToc(content) {
    const headings = [...content.querySelectorAll('h2, h3')];
    if (headings.length < 4) return;

    const usedIds = new Set();
    headings.forEach((heading, index) => {
        heading.id = heading.id || _slugHeading(heading.textContent, index, usedIds);
        usedIds.add(heading.id);
    });

    const toc = document.createElement('details');
    toc.className = 'article-toc';
    toc.open = window.matchMedia('(min-width: 900px)').matches;
    toc.innerHTML = `
        <summary>文章目录 <span>${headings.length} 节</span></summary>
        <nav aria-label="文章目录">
            ${headings.map(heading => `
                <a class="toc-${heading.tagName.toLowerCase()}" href="#${heading.id}">${heading.textContent.trim()}</a>
            `).join('')}
        </nav>
    `;
    const meta = document.querySelector('.article-meta');
    meta?.insertAdjacentElement('afterend', toc);

    toc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (window.matchMedia('(max-width: 899px)').matches) toc.open = false;
        });
    });
}

function _buildReadingProgress(content) {
    const progress = document.createElement('div');
    progress.className = 'reading-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.innerHTML = '<span></span>';
    document.body.prepend(progress);
    const bar = progress.querySelector('span');
    let ticking = false;

    const update = () => {
        const start = content.getBoundingClientRect().top + window.scrollY;
        const distance = Math.max(1, content.offsetHeight - window.innerHeight * 0.35);
        const value = Math.min(1, Math.max(0, (window.scrollY - start) / distance));
        bar.style.transform = `scaleX(${value})`;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
}

function _enhanceArticleTables(content) {
    content.querySelectorAll('table').forEach(table => {
        if (table.parentElement?.classList.contains('article-table-wrap')) return;
        const wrapper = document.createElement('div');
        wrapper.className = 'article-table-wrap';
        table.insertAdjacentElement('beforebegin', wrapper);
        wrapper.appendChild(table);
    });
    content.querySelectorAll('a[target="_blank"]').forEach(link => {
        link.rel = 'noopener noreferrer';
    });
}

function _escapeArticleText(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

function _renderArticleConnections(items) {
    const currentPath = window.location.pathname.replace(/\/?$/, '/');
    const current = items.find(item => item.file.replace(/\/?$/, '/') === currentPath);
    if (!current) return;

    const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
    const currentIndex = sorted.findIndex(item => item.id === current.id);
    const newer = currentIndex > 0 ? sorted[currentIndex - 1] : null;
    const older = currentIndex >= 0 && currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
    const currentTags = new Set(current.tags || []);
    const related = items
        .filter(item => item.id !== current.id)
        .map(item => {
            let score = 0;
            if (item.category === current.category) score += 3;
            if (item.subcategory && item.subcategory === current.subcategory) score += 4;
            (item.tags || []).forEach(tag => { if (currentTags.has(tag)) score += 2; });
            return { item, score };
        })
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || new Date(b.item.date) - new Date(a.item.date))
        .slice(0, 3)
        .map(entry => entry.item);

    const main = document.querySelector('.article-page');
    if (!main || (!related.length && !newer && !older)) return;
    const section = document.createElement('section');
    section.className = 'article-connections';
    section.innerHTML = `
        ${related.length ? `
            <div class="article-related">
                <h2>同主题阅读</h2>
                <div class="article-related-list">
                    ${related.map(item => `
                        <a href="${_escapeArticleText(item.file)}">
                            <span>${_escapeArticleText(item.category)}${item.subcategory ? ` · ${_escapeArticleText(item.subcategory)}` : ''}</span>
                            <strong>${_escapeArticleText(item.title)}</strong>
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : ''}
        <nav class="article-adjacent" aria-label="相邻文章">
            ${newer ? `<a href="${_escapeArticleText(newer.file)}"><span>较新一篇</span><strong>${_escapeArticleText(newer.title)}</strong></a>` : '<span></span>'}
            ${older ? `<a href="${_escapeArticleText(older.file)}"><span>较早一篇</span><strong>${_escapeArticleText(older.title)}</strong></a>` : '<span></span>'}
        </nav>
    `;
    main.appendChild(section);
}

function _loadArticleIndex(callback) {
    if (typeof articles !== 'undefined') {
        callback(articles);
        return;
    }
    const script = document.createElement('script');
    script.src = '/js/articles.js';
    script.onload = () => { if (typeof articles !== 'undefined') callback(articles); };
    document.head.appendChild(script);
}

document.addEventListener('DOMContentLoaded', () => {
    const content = document.querySelector('.article-content');
    if (!content) return;
    _buildReadingProgress(content);
    _buildArticleToc(content);
    _enhanceArticleTables(content);
    _loadArticleIndex(_renderArticleConnections);
});
