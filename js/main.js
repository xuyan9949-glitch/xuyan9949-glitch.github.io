document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('article-list');
    const tagEls = document.querySelectorAll('.tag');
    let activeTag = 'all';

    function render(tag) {
        const filtered = tag === 'all' ? articles : articles.filter(a => a.tags.includes(tag));
        list.innerHTML = filtered.map(a => `
            <a href="${a.file}" class="article-card">
                <div class="meta">
                    <span>${a.date}</span>
                    <span class="dot"></span>
                    <span>${a.tags.join(' · ')}</span>
                </div>
                <h2>${a.title}</h2>
                <p>${a.summary}</p>
                <div class="tags-row">
                    ${a.tags.map(t => `<span>${t}</span>`).join('')}
                </div>
            </a>
        `).join('');
    }

    tagEls.forEach(el => {
        el.addEventListener('click', () => {
            tagEls.forEach(t => t.classList.remove('active'));
            el.classList.add('active');
            activeTag = el.dataset.tag;
            render(activeTag);
        });
    });

    render('all');
});
