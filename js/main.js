document.addEventListener('DOMContentLoaded', () => {
    // ---- US Stock Sectors (defined early for cross-references) ----
    const usSectors = ['七姐妹','光互联','半导体','存储','AI基础设施','加密/金融','太空','量子计算'];
    const US_SECTOR_COLORS = {
        '光互联': '#3b82f6', '半导体': '#ef4444', '存储': '#06b6d4', 'AI基础设施': '#f59e0b',
        '加密/金融': '#22c55e', '太空': '#8b5cf6', '七姐妹': '#6366f1', '量子计算': '#06b6d4'
    };

    // ---- Search ----
    const searchToggle = document.getElementById('nav-search-toggle');
    const searchDropdown = document.getElementById('nav-search-dropdown');
    const searchInput = document.getElementById('nav-search-input');
    const searchResults = document.getElementById('nav-search-results');

    if (searchToggle && searchDropdown) {
        searchToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = searchDropdown.style.display === 'block';
            searchDropdown.style.display = isOpen ? 'none' : 'block';
            if (!isOpen) {
                setTimeout(() => searchInput?.focus(), 100);
                if (typeof articles !== 'undefined') renderSearchResults('');
            }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#nav-search')) {
                searchDropdown.style.display = 'none';
            }
        });
    }

    if (searchInput && searchResults) {
        searchInput.addEventListener('input', () => {
            renderSearchResults(searchInput.value.trim());
        });
    }

    function renderSearchResults(query) {
        if (typeof articles === 'undefined') return;
        if (!searchResults) return;

        if (!query) {
            searchResults.innerHTML = '<div class="nav-search-empty">输入关键词搜索笔记</div>';
            return;
        }

        const q = query.toLowerCase();
        const matches = articles.filter(a => {
            const keywords = a.keywords ? a.keywords.toLowerCase() : '';
            return a.title.toLowerCase().includes(q)
                || a.tags.some(t => t.toLowerCase().includes(q))
                || a.summary.toLowerCase().includes(q)
                || keywords.includes(q);
        }).slice(0, 8);

        if (matches.length === 0) {
            searchResults.innerHTML = '<div class="nav-search-empty">未找到匹配的笔记</div>';
            return;
        }

        searchResults.innerHTML = matches.map(a => `
            <a href="${a.file}" class="nav-search-result" onclick="document.getElementById('nav-search-dropdown').style.display='none'">
                <div class="nsr-title">${highlight(a.title, query)}</div>
                <div class="nsr-meta">${a.date} · ${a.tags.map(t => highlight(t, query)).join(' · ')}</div>
            </a>
        `).join('');
    }

    function highlight(text, query) {
        if (!query) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx < 0) return text;
        return text.slice(0, idx) + '<strong style="color:var(--accent)">' + text.slice(idx, idx + query.length) + '</strong>' + text.slice(idx + query.length);
    }

    // ---- Nav notification dots ----
    function updateNavDots() {
        const now = Date.now();
        const DAY_MS = 86400000;
        const seen = JSON.parse(localStorage.getItem('nav_seen') || '{}');

        // 标的追踪:更新快速卡片数量
        if (typeof trackingData !== 'undefined') {
            const aList = trackingData['a-shares'] || [];
            const usList = trackingData['us-stocks'] || [];
            const aCard = document.querySelector('.track-quick-card[data-mkt="a"] .tqc-sub');
            const usCard = document.querySelector('.track-quick-card[data-mkt="us"] .tqc-sub');
            if (aCard) aCard.textContent = aList.length + '只标的';
            if (usCard) usCard.textContent = usSectors.length + '个板块,' + usList.length + '只标的';
        }
        // 标的追踪:最近更新是否在最后访问之后
        if (typeof trackingData !== 'undefined') {
            const allStocks = [
                ...(trackingData['a-shares'] || []),
                ...(trackingData['us-stocks'] || []),
                ...(trackingData['hk-stocks'] || []),
            ];
            const dates = allStocks.map(s => new Date(s.lastUpdated).getTime()).filter(d => !isNaN(d));
            if (dates.length > 0) {
                const latest = Math.max(...dates);
                const lastSeen = seen.tracking || 0;
                const dot = document.querySelector('.nav-dot[data-section="tracking"]');
                if (dot) dot.classList.toggle('show', latest > lastSeen);
            }
        }

        // 笔记:最近文章日期
        if (typeof articles !== 'undefined' && articles.length > 0) {
            const dates = articles.map(a => new Date(a.date).getTime()).filter(d => !isNaN(d));
            if (dates.length > 0) {
                const latest = Math.max(...dates);
                const lastSeen = seen.notes || 0;
                const dot = document.querySelector('.nav-dot[data-section="notes"]');
                if (dot) dot.classList.toggle('show', latest > lastSeen);
            }
        }
    }

    // Mark section as seen on click
    document.querySelectorAll('.nav-links a[href]').forEach(a => {
        a.addEventListener('click', () => {
            const href = a.getAttribute('href');
            const section = href.replace('#', '');
            const seen = JSON.parse(localStorage.getItem('nav_seen') || '{}');
            seen[section] = Date.now();
            localStorage.setItem('nav_seen', JSON.stringify(seen));
            // Hide dot immediately
            const dot = a.querySelector('.nav-dot');
            if (dot) dot.classList.remove('show');
        });
    });

    updateNavDots();

    // Re-check after page fully loads (data might arrive late)
    setTimeout(updateNavDots, 500);

    // ---- Mobile nav toggle ----
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // ---- Render Research Map ----
    // ---- Category filter + Notes ----
    const notesEl = document.getElementById('notes-list');
    const catTags = document.querySelectorAll('.cat-tag');
    const subcatTags = document.querySelectorAll('.subcat-tag');
    const subcatBar = document.querySelector('.sub-categories');
    const seriesGrid = document.getElementById('series-grid');

    let currentSubcat = 'all';
    let currentSeries = null;

    const NOTE_SERIES = [
        {
            id: 'ai-infra',
            title: 'AI基础设施主线',
            desc: '算力、数据中心、电力、光互联和服务器价值链。',
            keywords: ['AI', 'GPU', '数据中心', '服务器', 'AI基础设施', 'AI工厂', 'AI服务器']
        },
        {
            id: 'optical',
            title: '光通信与CPO',
            desc: '光模块、CPO、InP、硅光和光器件投资框架。',
            keywords: ['光通信', '光互联', 'CPO', 'InP', '硅光', '光模块', 'EML', 'GlassBridge']
        },
        {
            id: 'storage',
            title: '存储超级周期',
            desc: 'MU、HBM、DRAM、NAND 与供需周期跟踪。',
            keywords: ['存储', 'HBM', 'DRAM', 'NAND', 'MU', '美光', 'SNDK']
        },
        {
            id: 'materials',
            title: 'AI电子材料',
            desc: 'PCB、CCL、MLCC、铜箔和散热材料的上游扩散。',
            keywords: ['PCB', 'CCL', 'MLCC', '铜箔', '电子材料', 'AI电子材料', '散热', '金刚石']
        },
        {
            id: 'a-share-map',
            title: 'A股映射与交易框架',
            desc: 'A股产业映射、题材传导、交易规则和估值节奏。',
            keywords: ['A股', '映射', '交易框架', '传导', '中报', '定价规则']
        },
        {
            id: 'tools-mindset',
            title: '工具与投资心法',
            desc: 'AI工具、研究方法、道德经和个人认知框架。',
            keywords: ['AI工具', '数字工具', '研究方法', '道德经', '投资启示', '见贤思齐']
        }
    ];

    // Static subcategory overrides (show even without articles)
    const STATIC_SUBCATS = {
        '美股': ['美股档案'],
        '产业思考': ['AI电子材料', '机器人'],
    };

    function getSubcategories(category) {
        const cats = new Set();
        articles.forEach(a => {
            if (a.category === category && a.subcategory) {
                cats.add(a.subcategory);
            }
        });
        // Add static overrides
        if (STATIC_SUBCATS[category]) {
            STATIC_SUBCATS[category].forEach(s => cats.add(s));
        }
        return Array.from(cats);
    }

    function renderSubcatTags(category) {
        if (!subcatBar) return;
        const subcats = getSubcategories(category);
        if (subcats.length === 0) {
            subcatBar.style.display = 'none';
            return;
        }
        subcatBar.style.display = 'flex';
        let html = '<button type="button" class="subcat-tag active" data-subcat="all" aria-pressed="true">全部</button>';
        subcats.forEach(s => {
            html += `<button type="button" class="subcat-tag" data-subcat="${s}" aria-pressed="false">${s}</button>`;
        });
        subcatBar.innerHTML = html;
        // Re-bind events
        document.querySelectorAll('.subcat-tag').forEach(el => {
            el.addEventListener('click', () => {
                document.querySelectorAll('.subcat-tag').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                document.querySelectorAll('.subcat-tag').forEach(t => t.setAttribute('aria-pressed', String(t === el)));
                currentSubcat = el.dataset.subcat;
                const activeCat = document.querySelector('.cat-tag.active');
                renderNotes(activeCat ? activeCat.dataset.cat : 'all');
            });
        });
    }

    const NOTES_PAGE_SIZE = 6;
    let notesPage = 1;

    function articleMatchesSeries(article, series) {
        const haystack = [
            article.title,
            article.category,
            article.subcategory || '',
            article.summary || '',
            ...(article.tags || []),
            article.keywords || ''
        ].join(' ').toLowerCase();
        return series.keywords.some(k => haystack.includes(k.toLowerCase()));
    }

    function sortArticles(list) {
        return list.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });
    }

    function renderNoteCards(list, page, onPage) {
        if (!notesEl) return;
        const isPreview = notesEl.dataset.mode === 'preview';
        const start = isPreview ? 0 : (page - 1) * NOTES_PAGE_SIZE;
        const end = isPreview
            ? Math.min(NOTES_PAGE_SIZE, list.length)
            : Math.min(page * NOTES_PAGE_SIZE, list.length);
        const shown = list.slice(start, end);

        notesEl.innerHTML = shown.map(a => `
            <a href="${a.file}" class="note-card${a.pinned ? ' note-pinned' : ''}">
                <div class="meta">
                    <span>${a.date}</span>
                    <span class="dot"></span>
                    <span>${a.category}${a.subcategory ? ' · ' + a.subcategory : ''}</span>
                </div>
                <h3>${a.title}</h3>
                <p>${a.summary.length > 80 ? a.summary.slice(0, 80) + '…' : a.summary}</p>
                <div class="tags">
                    ${a.tags.slice(0, 4).map(t => {
                        const stockId = typeof findStockIdByTag === 'function' ? findStockIdByTag(t) : null;
                        return stockId
                            ? `<span class="tag-stock-link" onclick="event.preventDefault();event.stopPropagation();openStockTracking('${stockId}')">${t}</span>`
                            : `<span>${t}</span>`;
                    }).join('')}
                </div>
            </a>
        `).join('');

        const totalPages = Math.ceil(list.length / NOTES_PAGE_SIZE);
        if (!isPreview && totalPages > 1) {
            const pagWrap = document.createElement('div');
            pagWrap.className = 'notes-pagination';
            pagWrap.setAttribute('aria-label', '笔记分页');

            const goToPage = targetPage => {
                onPage(targetPage);
                requestAnimationFrame(() => {
                    document.getElementById('notes')?.scrollIntoView({ block: 'start' });
                });
            };

            const prevBtn = document.createElement('button');
            prevBtn.className = 'notes-page-btn';
            prevBtn.textContent = '‹';
            prevBtn.setAttribute('aria-label', '上一页');
            prevBtn.disabled = page <= 1;
            prevBtn.onclick = () => goToPage(page - 1);
            pagWrap.appendChild(prevBtn);

            const visiblePages = [];
            if (totalPages <= 7) {
                for (let i = 1; i <= totalPages; i++) visiblePages.push(i);
            } else {
                visiblePages.push(1);
                const windowStart = Math.max(2, page - 1);
                const windowEnd = Math.min(totalPages - 1, page + 1);
                if (windowStart > 2) visiblePages.push('ellipsis-start');
                for (let i = windowStart; i <= windowEnd; i++) visiblePages.push(i);
                if (windowEnd < totalPages - 1) visiblePages.push('ellipsis-end');
                visiblePages.push(totalPages);
            }

            visiblePages.forEach(item => {
                if (typeof item !== 'number') {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'notes-page-ellipsis';
                    ellipsis.textContent = '…';
                    ellipsis.setAttribute('aria-hidden', 'true');
                    pagWrap.appendChild(ellipsis);
                    return;
                }
                const pBtn = document.createElement('button');
                pBtn.className = 'notes-page-btn' + (item === page ? ' active' : '');
                pBtn.textContent = item;
                pBtn.setAttribute('aria-label', `第 ${item} 页`);
                pBtn.onclick = () => goToPage(item);
                if (item === page) {
                    pBtn.disabled = true;
                    pBtn.setAttribute('aria-current', 'page');
                }
                pagWrap.appendChild(pBtn);
            });

            const nextBtn = document.createElement('button');
            nextBtn.className = 'notes-page-btn';
            nextBtn.textContent = '›';
            nextBtn.setAttribute('aria-label', '下一页');
            nextBtn.disabled = page >= totalPages;
            nextBtn.onclick = () => goToPage(page + 1);
            pagWrap.appendChild(nextBtn);

            notesEl.appendChild(pagWrap);
        }
    }

    function renderNotes(category, page) {
        if (!notesEl || typeof articles === 'undefined') return;

        if (page === undefined) page = 1;
        notesPage = page;
        currentSeries = null;
        document.querySelectorAll('.series-card').forEach(card => {
            card.classList.remove('active');
            card.setAttribute('aria-pressed', 'false');
        });

        let filtered = articles;
        if (category !== 'all') {
            filtered = articles.filter(a => a.category === category);
            renderSubcatTags(category);
            if (currentSubcat !== 'all') {
                filtered = filtered.filter(a => a.subcategory === currentSubcat);
            }
        } else {
            if (subcatBar) subcatBar.style.display = 'none';
            currentSubcat = 'all';
        }
        sortArticles(filtered);

        if (filtered.length === 0) {
            notesEl.innerHTML = '<div class="empty-notes">暂无内容,持续更新中。</div>';
            return;
        }

        renderNoteCards(filtered, page, nextPage => renderNotes(category, nextPage));
    }

    function renderSeriesNotes(seriesId, page) {
        if (!notesEl || typeof articles === 'undefined') return;
        const series = NOTE_SERIES.find(s => s.id === seriesId);
        if (!series) return;
        if (page === undefined) page = 1;
        currentSeries = seriesId;
        catTags.forEach(t => t.classList.remove('active'));
        if (subcatBar) subcatBar.style.display = 'none';
        document.querySelectorAll('.series-card').forEach(card => {
            const active = card.dataset.series === seriesId;
            card.classList.toggle('active', active);
            card.setAttribute('aria-pressed', String(active));
        });
        const filtered = sortArticles(articles.filter(a => articleMatchesSeries(a, series)));
        renderNoteCards(filtered, page, nextPage => renderSeriesNotes(seriesId, nextPage));
    }

    function renderSeriesGrid() {
        if (!seriesGrid || typeof articles === 'undefined') return;
        seriesGrid.innerHTML = NOTE_SERIES.map(series => {
            const matches = articles.filter(a => articleMatchesSeries(a, series));
            const latest = sortArticles([...matches])[0];
            return `
                <div class="series-card" data-series="${series.id}" role="button" tabindex="0" aria-pressed="false">
                    <h3>${series.title}</h3>
                    <p>${series.desc}</p>
                    <div class="series-meta">
                        <span class="series-count">${matches.length} 篇</span>
                        <span>${latest ? latest.date : '待更新'}</span>
                    </div>
                </div>
            `;
        }).join('');
        seriesGrid.querySelectorAll('.series-card').forEach(card => {
            const activate = () => renderSeriesNotes(card.dataset.series);
            card.addEventListener('click', activate);
            card.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activate();
                }
            });
        });
    }

    if (catTags.length > 0) {
        catTags.forEach(el => {
            el.addEventListener('click', () => {
                catTags.forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                catTags.forEach(t => t.setAttribute('aria-pressed', String(t === el)));
                renderNotes(el.dataset.cat);
            });
        });
        renderSeriesGrid();
        renderNotes('all');

        // Category notification dots
        if (typeof articles !== 'undefined') {
            const catSeen = JSON.parse(localStorage.getItem('cat_seen') || '{}');
            document.querySelectorAll('.cat-tag').forEach(tag => {
                const cat = tag.dataset.cat;
                if (cat === 'all') return;
                const catArticles = articles.filter(a => a.category === cat);
                const latestDate = Math.max(...catArticles.map(a => new Date(a.date).getTime()));
                const lastSeen = catSeen[cat] || 0;
                if (latestDate > lastSeen) {
                    const dot = document.createElement('span');
                    dot.className = 'cat-dot';
                    tag.appendChild(dot);
                }
            });
            // Mark category as seen on click
            document.querySelectorAll('.cat-tag').forEach(tag => {
                tag.addEventListener('click', () => {
                    const cat = tag.dataset.cat;
                    if (cat === 'all') return;
                    const seen = JSON.parse(localStorage.getItem('cat_seen') || '{}');
                    seen[cat] = Date.now();
                    localStorage.setItem('cat_seen', JSON.stringify(seen));
                    const dot = tag.querySelector('.cat-dot');
                    if (dot) dot.remove();
                });
            });
        }
    } else if (notesEl && typeof articles !== 'undefined') {
        renderNotes('all');
    }

    // ---- Render Frameworks ----
    const frameworksEl = document.getElementById('frameworks-list');
    if (frameworksEl) {
        const frameworks = [
            {
                num: '01', title: '公司研究框架',
                items: [
                    '卖什么 → 卖给谁(产品定位与客户画像)',
                    '为什么持续买(复购逻辑 / 护城河)',
                    '怎么收钱(现金流质量)',
                    '市场在交易什么(当前price in了什么预期)',
                    '未来 12-24 个月验证点',
                ]
            },
            {
                num: '02', title: '财务分析框架',
                items: [
                    '利润是否被现金撑住',
                    '营运资本是否健康',
                    '产能是否在扩张',
                    '扩张是否有危险(供过于求风险)',
                ]
            },
            {
                num: '03', title: '产业趋势判断',
                desc: 'Follow the Money:巨头CapEx → 供应链订单 → 产能扩张 → 上游涨价 → 设备交期拉长 → 财报指引上修 → 客户认证加速。'
            },
            {
                num: '04', title: 'A 股题材框架',
                link: '/articles/a-share-framework/',
                items: [
                    '龙一兑现',
                    '龙二补涨',
                    '上游材料扩散',
                    '设备耗材扩散',
                    '低位小市值补涨',
                    '参股蹭概念',
                    '退潮',
                ]
            },
            {
                num: '05', title: '交易纪律框架',
                items: [
                    '不熟不重仓',
                    '短期期权必须止损',
                    '趋势破位先尊重盘面',
                    '好公司也要有好价格',
                ],
                desc: '三类资产(0→1 / 1→100 / 供需失衡)对应不同的买卖点与风控规则。'
            },
        ];
        frameworksEl.innerHTML = frameworks.map(f => {
            const card = `
                <div class="num">${f.num}</div>
                <h3>${f.title}</h3>
                ${f.desc ? `<p class="fw-desc">${f.desc}</p>` : ''}
                ${f.items ? `<ul class="fw-list">${f.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
            `;
            return f.link
                ? `<a href="${f.link}" class="framework-card" style="text-decoration:none;color:inherit">${card}<span class="fw-arrow">→</span></a>`
                : `<div class="framework-card">${card}</div>`;
        }).join('');
    }

    // =====================================================
    // Stock Tracking
    // =====================================================

    function getTypeBadge(type) {
        const colors = { '长线': '#22c55e', '波段': '#f59e0b', '监控': '#6366f1', '短线': '#ef4444' };
        return `<span class="trk-card-type" style="background:${colors[type] || '#6b6b80'}15; color:${colors[type] || '#6b6b80'}">${type}</span>`;
    }

    function getStatusBadge(status) {
        const colors = {
            '持有中': '#22c55e',
            '验证中': '#3b82f6',
            '波段操作中': '#f59e0b',
            '等待中': '#6366f1',
            '待确认': '#f59e0b',
            '已兑现': '#22c55e',
            '已失效': '#ef4444',
            '已清仓': '#6b6b80',
            '逻辑增强': '#22c55e',
            '短线逻辑增强': '#f59e0b',
        };
        const color = colors[status] || '#6b6b80';
        return `<span style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:11px;font-weight:500;background:${color}15;color:${color}">${status}</span>`;
    }

    function getImportanceBadge(importance) {
        const colors = { '高': '#ef4444', '中': '#f59e0b', '低': '#6b6b80' };
        const color = colors[importance] || '#6b6b80';
        return `<span style="font-size:11px;font-weight:500;color:${color}">${importance}</span>`;
    }

    const trackingMarkets = {
        a: 'a-shares',
        us: 'us-stocks',
        hk: 'hk-stocks',
    };

    function getTrackingMarketKey(market) {
        return trackingMarkets[market] || trackingMarkets.a;
    }

    function renderCards(market, showAbandoned) {
        const grid = document.getElementById('trk-grid');
        const summary = document.getElementById('trk-summary');
        if (!grid || typeof trackingData === 'undefined') return;

        const marketKey = getTrackingMarketKey(market);
        let stocks = trackingData[marketKey];
        if (!stocks || stocks.length === 0) {
            grid.innerHTML = '<div class="trk-empty">暂无可展示的标的</div>';
            if (summary) summary.innerHTML = '';
            return;
        }

        // Filter abandoned unless showAbandoned
        if (!showAbandoned) {
            stocks = stocks.filter(s => !s.trackingStatus || !s.trackingStatus.includes('已放弃'));
        } else {
            stocks = stocks.filter(s => s.trackingStatus && s.trackingStatus.includes('已放弃'));
        }

        // US stocks: filter by sector
        if (market === 'us' && currentSector) {
            stocks = stocks.filter(s => s.usSector === currentSector);
        }

        if (stocks.length === 0) {
            grid.innerHTML = '<div class="trk-empty">该分类下暂无可展示的标的</div>';
            if (summary) summary.innerHTML = '<div class="trk-summary-inner">共 0 只标的</div>';
            return;
        }

        // Sort: holdings first, then observing
        stocks.sort((a, b) => {
            const aHold = a.trackingStatus && (a.trackingStatus.includes('持有') || a.trackingStatus.includes('底仓'));
            const bHold = b.trackingStatus && (b.trackingStatus.includes('持有') || b.trackingStatus.includes('底仓'));
            if (aHold && !bHold) return -1;
            if (!aHold && bHold) return 1;
            return 0;
        });

        // Summary bar
        if (summary) {
            const total = stocks.length;
            const catMap = { '持有': 0, '观察': 0, '等回调': 0, '高风险': 0 };
            stocks.forEach(s => {
                const st = s.trackingStatus || '';
                if (st.includes('持有') || st.includes('底仓')) catMap['持有']++;
                else if (st.includes('观察')) catMap['观察']++;
                else if (st.includes('回调')) catMap['等回调']++;
                else catMap['观察']++;
            });
            const labels = [
                catMap['持有'] ? `<span><span class="status-dot" style="background:#22c55e"></span>持有 ${catMap['持有']}</span>` : '',
                catMap['观察'] ? `<span><span class="status-dot" style="background:#3b82f6"></span>观察 ${catMap['观察']}</span>` : '',
                catMap['等回调'] ? `<span><span class="status-dot" style="background:#f59e0b"></span>等回调 ${catMap['等回调']}</span>` : '',
            ].filter(Boolean).join(' · ');
            summary.innerHTML = `<div class="trk-summary-inner">共 ${total} 只${labels ? ' · ' + labels : ''}</div>`;
        }

        grid.innerHTML = stocks.map(s => {
            const hasLogic = s.investmentLogic !== null;
            const catalystCount = s.catalysts ? s.catalysts.length : 0;
            const hasPlan = s.operationPlan !== null;
            const isHolding = s.trackingStatus && (s.trackingStatus.includes('持有') || s.trackingStatus.includes('底仓'));
            const isAbandoned = s.trackingStatus && s.trackingStatus.includes('已放弃');
            
            // Build tag array: [持仓状态, 周期, 板块, 概念] max 4
            const statusShort = s.trackingStatus ? s.trackingStatus.replace(/ \/ .*$/, '').trim() : '';
            const tags = [];
            if (statusShort) tags.push({ text: statusShort, type: 'status' });
            if (s.tradeCycle) tags.push({ text: s.tradeCycle, type: 'cycle' });
            if (s.sector) {
                s.sector.split(/\s*\/\s*/).slice(0, 2).forEach(t => tags.push({ text: t.trim(), type: 'sector' }));
            }
            if (tags.length < 4 && s.themeTags) {
                const needed = 4 - tags.length;
                s.themeTags.split(/\s*\/\s*/).slice(0, needed).forEach(t => tags.push({ text: t.trim(), type: 'concept' }));
            }
            
            return `
            <div class="trk-card${isHolding ? ' trk-card-holding' : ''}${isAbandoned ? ' trk-card-abandoned' : ''}" data-id="${s.id}" data-mkt="${market}" role="button" tabindex="0" aria-label="查看 ${s.name} 追踪详情">
                <div class="trk-card-header">
                    <span class="trk-card-name">${s.name}</span>
                    <span class="trk-card-code">${s.code}</span>
                </div>
                <div class="trk-card-tags">
                    ${tags.map(t => {
                        let cls = 'trk-tag';
                        if (t.type === 'status') {
                            cls += ' trk-tag-status';
                            if (isHolding) cls += ' trk-tag-hold';
                            if (isAbandoned) cls += ' trk-tag-abandoned';
                        }
                        else if (t.type === 'cycle') cls += ' trk-tag-cycle';
                        else if (t.type === 'sector') cls += ' trk-tag-sector';
                        else if (t.type === 'concept') cls += ' trk-tag-concept';
                        return `<span class="${cls}">${t.text}</span>`;
                    }).join('')}
                </div>
                <p class="trk-card-reason">${s.reason}</p>
                <div class="trk-card-meta">
                    <span>\u26A1 ${catalystCount} \u50AC\u5316</span>
                    <span class="dot"></span>
                    <span>\u66F4\u65B0 ${s.lastUpdated}</span>
                </div>
                <span class="trk-card-arrow">→</span>
            </div>
        `}).join('');

        grid.querySelectorAll('.trk-card').forEach(el => {
            const activate = () => openDrawer(el.dataset.id, el.dataset.mkt);
            el.addEventListener('click', activate);
            el.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    activate();
                }
            });
        });
        
        // Check if there's a pending deep link
        if (window._pendingDeepLink) {
            const targetId = window._pendingDeepLink;
            window._pendingDeepLink = null;
            const card = grid.querySelector(`.trk-card[data-id="${targetId}"]`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => card.click(), 300);
            }
        }
    }

    // ---- US Stock Sector Tabs ----
    let currentSector = null;

    function renderSectorTabs() {
        const container = document.getElementById('trk-sector-tabs');
        if (!container) return;
        container.innerHTML = usSectors.map(s => `
            <span class="trk-sector-tab ${currentSector === s ? 'active' : ''}" data-sector="${s}" style="--sector-color:${US_SECTOR_COLORS[s] || '#6b6b80'}">${s}</span>
        `).join('');
        container.style.display = 'flex';

        container.querySelectorAll('.trk-sector-tab').forEach(el => {
            el.addEventListener('click', () => {
                container.querySelectorAll('.trk-sector-tab').forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                currentSector = el.dataset.sector;
                renderCards('us');
            });
        });
    }

    // ---- Tracking Tabs ----
    const tabs = document.querySelectorAll('.trk-tab');
    const sectorContainer = document.getElementById('trk-sector-tabs');
    let showAbandoned = false;
    const historyLink = document.getElementById('trk-history-link');
    if (tabs.length > 0) {
        let currentMarket = 'a';
        renderCards(currentMarket, showAbandoned);

        if (historyLink) {
            historyLink.addEventListener('click', (e) => {
                e.preventDefault();
                showAbandoned = !showAbandoned;
                historyLink.textContent = showAbandoned ? '← 返回当前标的' : '📂 查看过往标的';
                renderCards(currentMarket, showAbandoned);
                // toggle history link visibility
                const hisItems = document.getElementById('trk-history-items');
                if (hisItems) hisItems.style.display = showAbandoned ? 'block' : 'none';
            });
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMarket = tab.dataset.mkt;
                currentSector = currentMarket === 'us' ? (currentSector || usSectors[0]) : null;
                if (currentMarket === 'us') {
                    renderSectorTabs();
                } else {
                    if (sectorContainer) sectorContainer.style.display = 'none';
                }
                renderCards(currentMarket, showAbandoned);
            });
        });
    }

    // =====================================================
    // Drawer - 投资逻辑 · 催化剂看板 · 操作计划
    // =====================================================

    function renderInvestmentLogic(logic) {
        if (!logic) return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">📋</span> 投资逻辑</h3>
                <div class="trk-empty-data">暂未填写</div>
            </div>`;

        const coreReasons = Array.isArray(logic.coreReason)
            ? logic.coreReason.map((r, i) => `<strong>${i+1}.</strong> ${r}`).join('<br>')
            : logic.coreReason;

        const questions = Array.isArray(logic.questionsToVerify)
            ? logic.questionsToVerify.map(q => `<li>${q}</li>`).join('')
            : logic.questionsToVerify;

        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">📋</span> 投资逻辑</h3>
                <div class="trk-logic-grid">
                    <div class="trk-logic-item full">
                        <div class="label">一句话逻辑</div>
                        <div class="value">${logic.oneLiner}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">当前假设</div>
                        <div class="value">${logic.currentHypothesis}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">核心跟踪理由</div>
                        <div class="value" style="line-height:1.7">${coreReasons}</div>
                    </div>
                    <div class="trk-logic-item" style="grid-column:1/-1">
                        <div class="label">逻辑状态</div>
                        <div class="value">${getStatusBadge(logic.status)}${logic.statusNote ? `<br><span style="font-size:12px;color:var(--text-muted);margin-top:4px;display:inline-block">${logic.statusNote}</span>` : ''}</div>
                    </div>
                    <div class="trk-logic-item" style="grid-column:1/-1">
                        <div class="label">逻辑有效期</div>
                        <div class="value">${logic.validUntil || '-'}${logic.validNote ? `<br><span style="font-size:12px;color:var(--text-muted);margin-top:4px;display:inline-block">${logic.validNote}</span>` : ''}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">需要验证的问题</div>
                        <ul style="margin:4px 0 0;padding-left:16px;font-size:13px;color:var(--text-secondary);line-height:1.6">${questions}</ul>
                    </div>
                </div>
            </div>`;
    }

    function renderCatalysts(catalysts) {
        if (!catalysts || catalysts.length === 0) return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">⚡</span> 催化剂看板</h3>
                <div class="trk-empty-data">暂未填写</div>
            </div>`;
        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">⚡</span> 催化剂看板</h3>
                ${catalysts.map(c => `
                    <div class="trk-catalyst-card">
                        <div class="trk-catalyst-header">
                            <span class="trk-catalyst-name">${c.catalyst}</span>
                            ${getStatusBadge(c.status)}
                        </div>
                        <div class="trk-catalyst-grid">
                            <div class="trk-catalyst-item">
                                <div class="label">时间窗口</div>
                                <div class="value">${c.timeWindow}</div>
                            </div>
                            <div class="trk-catalyst-item">
                                <div class="label">重要性</div>
                                <div class="value">${getImportanceBadge(c.importance)}</div>
                            </div>
                            <div class="trk-catalyst-item full">
                                <div class="label">需要看到的证据</div>
                                <div class="value">${c.evidence}</div>
                            </div>
                            <div class="trk-catalyst-item">
                                <div class="label">影响方向</div>
                                <div class="value">${c.direction === '利好' ? '📈 ' : '📉 '}${c.direction}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    }

    function renderValuation(val) {
        if (!val) return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">💰</span> 估值分析</h3>
                <div class="trk-empty-data">暂未填写</div>
            </div>`;

        const rows = val.tiers ? val.tiers.map(t => `
            <tr>
                <td class="trk-val-tier">${t.label}</td>
                <td class="trk-val-num">${t.marketCap}</td>
                <td class="trk-val-num">${t.price}</td>
                <td class="trk-val-desc">${t.logic}</td>
            </tr>
        `).join('') : '';

        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">💰</span> 估值分析</h3>
                <div style="margin-bottom:12px">
                    <span style="font-size:12px;color:var(--text-muted)">PE(TTM) ${val.peTTM || '-'} · PE(Fwd) ${val.peForward || '-'} · PB ${val.pb || '-'} · 总市值 ${val.marketCap || '-'}</span>
                </div>
                ${rows ? `
                <div class="trk-val-table-wrap">
                    <table class="trk-val-table">
                        <thead>
                            <tr>
                                <th>版本</th>
                                <th>合理市值</th>
                                <th>对应股价</th>
                                <th>对应逻辑</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
                ` : ''}
                <div style="margin-top:12px;font-size:13px;color:var(--text-secondary);line-height:1.7">
                    ${val.assessment || ''}
                    ${val.hkNote ? `<br><br><span style="color:var(--text-muted)">${val.hkNote}</span>` : ''}
                </div>
                ${val.riskNote ? `
                <div style="margin-top:10px;padding:10px 12px;background:var(--bg-alt);border-radius:8px;font-size:12px;color:var(--text-muted);line-height:1.6">
                    ⚠️ ${val.riskNote}
                </div>
                ` : ''}
            </div>`;
    }

    function renderOperationPlan(plan, optStrategy) {
        if (!plan) return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">🎯</span> 操作计划</h3>
                <div class="trk-empty-data">暂未填写</div>
            </div>`;

        const buyHtml = Array.isArray(plan.buyPlan)
            ? `<ul style="margin:4px 0 0;padding-left:16px;font-size:13px;color:var(--text-secondary);line-height:1.6">${plan.buyPlan.map(b => `<li>${b}</li>`).join('')}</ul>`
            : plan.buyPlan || '-';

        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">🎯</span> 操作计划</h3>
                <div class="trk-plan-grid">
                    <div class="trk-plan-item" style="grid-column:1/-1">
                        <div class="label">当前状态</div>
                        <div class="value">${plan.currentStatus}</div>
                    </div>
                    <div class="trk-plan-item" style="grid-column:1/-1">
                        <div class="label">买入计划</div>
                        <div class="value">${buyHtml}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">加仓条件</div>
                        <div class="value">${plan.addConditions || '-'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">减仓条件</div>
                        <div class="value">${plan.reduceConditions || '-'}</div>
                    </div>
                    <div class="trk-plan-item" style="grid-column:1/-1">
                        <div class="label">逻辑破坏条件</div>
                        <div class="value">${plan.invalidateConditions || '-'}</div>
                    </div>
                    ${optStrategy ? `
                    <div class="trk-plan-item" style="grid-column:1/-1">
                        <div class="label">期权策略</div>
                        <div class="value" style="font-size:12px">${optStrategy}</div>
                    </div>` : ''}
                </div>
            </div>`;
    }

    // =====================================================
    // US Stock Drawer - 基本面验证系统
    // =====================================================

    function renderExpectedDiff(ed) {
        if (!ed) return '';
        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">🔮</span> 预期差</h3>
                <div class="trk-logic-grid">
                    <div class="trk-logic-item full">
                        <div class="label">市场共识</div>
                        <div class="value" style="color:var(--text-muted)">${ed.consensus}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">我的判断</div>
                        <div class="value">${ed.myView}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">需要验证的证据</div>
                        <div class="value" style="color:var(--text-muted)">${ed.evidence}</div>
                    </div>
                    <div class="trk-logic-item" style="grid-column:1/-1">
                        <div class="label">如果对了</div>
                        <div class="value" style="color:#22c55e">${ed.rightCase}</div>
                    </div>
                    <div class="trk-logic-item" style="grid-column:1/-1">
                        <div class="label">如果错了</div>
                        <div class="value" style="color:#ef4444">${ed.wrongCase}</div>
                    </div>
                </div>
            </div>`;
    }

    function renderKeyMetrics(metrics) {
        if (!metrics || metrics.length === 0) return '';
        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">📊</span> 核心验证指标</h3>
                <div class="trk-val-table-wrap">
                    <table class="trk-val-table">
                        <thead>
                            <tr><th>指标</th><th>当前状态</th><th>重要性</th><th>观察方向</th><th>说明</th></tr>
                        </thead>
                        <tbody>
                            ${metrics.map(m => `
                            <tr>
                                <td style="font-weight:500">${m.metric}</td>
                                <td>${m.status}</td>
                                <td style="color:${m.importance === '高' ? '#ef4444' : '#f59e0b'}">${m.importance}</td>
                                <td>${m.trend}</td>
                                <td style="color:var(--text-muted);font-size:12px">${m.note}</td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
    }

    function renderMarketTrading(mt) {
        if (!mt) return '';
        return `
            <div class="trk-detail-section">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--bg-alt);padding:12px 14px;border-radius:8px;border-left:3px solid var(--accent)">
                    <strong style="color:var(--text)">市场正在交易:</strong><br>${mt}</p>
            </div>`;
    }

    function renderOptionStrategy(os) {
        if (!os) return '';
        return `
            <div class="trk-plan-item" style="grid-column:1/-1">
                <div class="label">期权策略</div>
                <div class="value" style="font-size:12px">${os}</div>
            </div>`;
    }

    function openDrawer(id, market) {
        const overlay = document.getElementById('trk-drawer-overlay');
        const drawer = document.getElementById('trk-drawer');
        const content = document.getElementById('trk-drawer-content');
        if (!overlay || !drawer || !content) return;

        const marketKey = getTrackingMarketKey(market);
        const stocks = trackingData[marketKey];
        const s = stocks.find(x => x.id === id);
        if (!s) return;
        drawer.dataset.id = id;
        drawer.dataset.name = s.name;
        
        // Update URL bar so copying gives deep link
        history.replaceState(null, '', '?stock=' + id);

        // Header badges
        const badges = [];
        if (s.trackingStatus) {
            const sc = getStatusColor(s.trackingStatus);
            const bg = sc ? sc.bg : '#22c55e15';
            const cl = sc ? sc.text : '#22c55e';
            if (sc) badges.push(`<span class="status-dot" style="background:${sc.dot};width:8px;height:8px;display:inline-block;border-radius:50%"></span> `);
            badges.push(`<span class="trk-card-type" style="background:${bg};color:${cl}">${s.trackingStatus}</span>`);
        }
        if (s.tradeCycle) badges.push(`<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:500;background:#6366f115;color:#6366f1">${s.tradeCycle}</span>`);
        if (s.logicStatus) {
            const colors = {'逻辑增强':'#22c55e','验证中':'#3b82f6','持有中':'#22c55e'};
            const c = colors[s.logicStatus] || '#6b6b80';
            badges.push(`<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:500;background:${c}15;color:${c}">${s.logicStatus}</span>`);
        }
        if (s.accountPosition) badges.push(`<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:500;background:#8b5cf615;color:#8b5cf6">${s.accountPosition}</span>`);
        if (s.ahShare) badges.push(`<span style="display:inline-block;padding:1px 8px;border-radius:8px;font-size:10px;font-weight:600;background:#8b5cf615;color:#8b5cf6;border:1px solid #8b5cf640">A+H 港股:${s.ahShare}</span>`);
        if (s.themeTags) badges.push(`<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:400;background:var(--bg-alt);color:var(--text-muted)">${s.themeTags}</span>`);

        content.innerHTML = `
            <div class="trk-detail-header">
                <div class="name-row">
                    <h2>${s.name}</h2>
                    <span class="code">${s.code}</span>
                    <button class="meta-share" onclick="shareStock('${s.name}', '${s.code}')" title="分享" style="margin-left:auto">
                        <svg width="14" height="14" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                        </svg>
                        分享
                    </button>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
                    ${badges.join('')}
                </div>
                <div style="margin-top:6px;font-size:12px;color:var(--text-muted)">${s.sector} · 最后更新 ${s.lastUpdated}</div>
            </div>

            <!-- 概览 - 一句话快照 -->
            <div class="trk-detail-section">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--bg-alt);padding:12px 14px;border-radius:8px;">
                    ${s.reason}<br>
                    <span style="color:var(--text-muted)">策略:${s.strategy}</span>
                </p>
            </div>

            ${renderMarketTrading(s.marketTrading)}
            ${renderInvestmentLogic(s.investmentLogic)}
            ${renderExpectedDiff(s.expectedDiff)}
            ${renderKeyMetrics(s.keyMetrics)}
            ${renderCatalysts(s.catalysts)}
            ${renderValuation(s.valuation)}
            ${renderOperationPlan(s.operationPlan, s.operationPlan ? s.operationPlan.optionStrategy : null)}
        `;

        overlay.classList.add('open');
        drawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        const overlay = document.getElementById('trk-drawer-overlay');
        const drawer = document.getElementById('trk-drawer');
        if (!overlay || !drawer) return;
        overlay.classList.remove('open');
        drawer.classList.remove('open');
        document.body.style.overflow = '';
        // Restore URL bar
        const clean = window.location.pathname + window.location.hash;
        history.replaceState(null, '', clean);
    }

    const closeBtn = document.getElementById('trk-drawer-close');
    const overlay = document.getElementById('trk-drawer-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    // ---- Quick Track Card Tab Switch ----
    window.switchTrackingTab = function(market) {
        // Give the page time to scroll to #tracking
        setTimeout(() => {
            const tab = document.querySelector(`.trk-tab[data-mkt="${market}"]`);
            if (tab) tab.click();
        }, 100);
    };

    // ---- Deep linking via query param: ?stock=xxx ----
    function handleDeepLink() {
        const params = new URLSearchParams(window.location.search);
        const stockId = params.get('stock');
        if (!stockId) return;
        
        const checkData = setInterval(() => {
            if (typeof trackingData === 'undefined') return;
            clearInterval(checkData);
            
            window._pendingDeepLink = stockId;
            
            let market = 'a';
            const usStocks = trackingData['us-stocks'] || [];
            const aStocks = trackingData['a-shares'] || [];
            const hkStocks = trackingData['hk-stocks'] || [];
            const matchingStock = usStocks.find(s => s.id === stockId)
                || aStocks.find(s => s.id === stockId)
                || hkStocks.find(s => s.id === stockId);
            const pendingSector = matchingStock && matchingStock.usSector ? matchingStock.usSector : null;
            
            // Switch to tracking section
            const section = document.getElementById('tracking');
            if (section) section.scrollIntoView({ behavior: 'smooth' });
            
            // Click the correct market tab
            if (matchingStock) {
                if (matchingStock.mkt === 'us' || usStocks.includes(matchingStock)) {
                    market = 'us';
                } else if (matchingStock.mkt === 'hk' || hkStocks.includes(matchingStock)) {
                    market = 'hk';
                } else {
                    market = 'a';
                }
            }
            const tab = document.querySelector(`.trk-tab[data-mkt="${market}"]`);
            if (tab) {
                // For US stocks, we need to set currentSector before clicking
                if (market === 'us' && pendingSector && usSectors.includes(pendingSector)) {
                    currentSector = pendingSector;
                }
                tab.click();
            }
        }, 100);
    }
    handleDeepLink();

    // ---- Render Diagrams ----
    const diagramsGrid = document.getElementById('diagrams-grid');
    let currentDiagramCategory = 'all';

    function renderDiagrams(cat) {
        if (!diagramsGrid || typeof diagrams === 'undefined') return;
        const filtered = cat === 'all' ? diagrams : diagrams.filter(d => d.category === cat);
        const limit = Number(diagramsGrid.dataset.limit || 0);
        const visible = limit > 0 ? filtered.slice(0, limit) : filtered;
        diagramsGrid.innerHTML = visible.map((d, index) => {
            const imgPath = '/images/diagrams/' + d.dir + '/' + d.file;
            return `<button type="button" class="diagram-card" data-index="${index}" aria-label="查看大图：${d.title}">
                <img src="${imgPath}" alt="${d.title}" loading="lazy" decoding="async">
                <span class="diagram-label">${d.title}</span>
            </button>`;
        }).join('');
        diagramsGrid.querySelectorAll('.diagram-card').forEach(card => {
            card.addEventListener('click', () => {
                const item = visible[Number(card.dataset.index)];
                window.openDiagram(item.dir + '/' + item.file, item.title);
            });
        });
    }

    if (diagramsGrid && typeof diagrams !== 'undefined') {
        renderDiagrams('all');
    }

    // Diagram tabs
    const diagramTabs = document.getElementById('diagram-tabs');
    if (diagramTabs) {
        diagramTabs.querySelectorAll('.diagram-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                diagramTabs.querySelectorAll('.diagram-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                diagramTabs.querySelectorAll('.diagram-tab').forEach(t => t.setAttribute('aria-pressed', String(t === tab)));
                currentDiagramCategory = tab.dataset.dcat;
                renderDiagrams(currentDiagramCategory);
            });
        });
    }

    // Create lightbox HTML
    if (!document.getElementById('diagram-lightbox')) {
        const lb = document.createElement('div');
        lb.className = 'diagram-lightbox';
        lb.id = 'diagram-lightbox';
        lb.innerHTML = '<span class="lb-close" onclick="closeDiagram()">✕</span><img id="lb-img" src="" alt=""><span class="lb-title" id="lb-title"></span>';
        document.body.appendChild(lb);
    }

    window.openDiagram = function(path, title) {
        const lb = document.getElementById('diagram-lightbox');
        const img = document.getElementById('lb-img');
        const titleEl = document.getElementById('lb-title');
        if (!lb || !img) return;
        img.src = '/images/diagrams/' + path;
        if (titleEl) titleEl.textContent = title || '';
        lb.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    window.closeDiagram = function() {
        const lb = document.getElementById('diagram-lightbox');
        if (!lb) return;
        lb.classList.remove('open');
        document.body.style.overflow = '';
    };

});

// ---- 逻辑验证日历 ----
const calGrid = document.getElementById('cal-grid');

function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function isCalendarEventPast(event, todayKey = localDateKey()) {
    const exactDate = String(event.date).match(/^(\d{4}-\d{2}-\d{2})/);
    if (exactDate) return exactDate[1] < todayKey;

    const eventMonth = String(event.date).match(/^(\d{4}-\d{2})/);
    return eventMonth ? eventMonth[1] < todayKey.slice(0, 7) : false;
}

function renderCalendar(filter = 'all') {
    if (!calGrid || typeof calendarEvents === 'undefined') return;

    const sorted = [...calendarEvents].sort((a, b) => a.date.localeCompare(b.date));
    const now = localDateKey();
    const upcoming = sorted.filter(event => !isCalendarEventPast(event, now));

    // Determine which events to show
    let filtered = upcoming;
    if (filter === '本周') {
        const today = new Date(now);
        const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
        filtered = upcoming.filter(e => {
            if (e.date.includes('Q') || e.date.includes('H')) return false;
            if (e.date.includes('中旬') || e.date.includes('下旬') || e.date.includes('上旬')) return true;
            if (e.certainty === 'estimated') return true;
            const d = new Date(e.date);
            return d >= today && d <= weekEnd;
        });
    } else if (filter === '未来30天') {
        const today = new Date(now);
        const monthEnd = new Date(today); monthEnd.setDate(today.getDate() + 30);
        filtered = upcoming.filter(e => {
            if (e.date.includes('Q') || e.date.includes('H')) return false;
            if (e.date.includes('中旬') || e.date.includes('下旬') || e.date.includes('上旬')) return true;
            if (e.certainty === 'estimated') return true;
            const d = new Date(e.date);
            return d >= today && d <= monthEnd;
        });
    } else if (filter !== 'all') {
        filtered = upcoming.filter(e => e.type === filter);
    }

    const typeColors = {
        '财报':'#2d6cff','产品':'#22c55e','会议':'#8b5cf6','产能':'#06b6d4','订单':'#f59e0b','监管':'#ef4444','发射':'#1e40af','宏观':'#dc2626','IPO':'#e11d48'
    };
    const statusColors = {
        '等待验证':'#f59e0b15,#f59e0b','预期升温':'#3b82f615,#3b82f6','已验证':'#22c55e15,#22c55e','不及预期':'#ef444415,#ef4444','待复盘':'#8b5cf615,#8b5cf6'
    };

    if (filtered.length === 0) {
        calGrid.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:24px;grid-column:1/-1;font-size:13px">该分类暂无事件</div>';
        return;
    }

    const limit = Number(calGrid.dataset.limit || 0);
    const visibleEvents = limit > 0 ? filtered.slice(0, limit) : filtered;

    calGrid.innerHTML = visibleEvents.map(e => {
        // Countdown
        let countdown = '';
        if (e.date.includes('中旬') || e.date.includes('下旬') || e.date.includes('上旬')) {
            countdown = '本月';
        } else if (!e.date.includes('Q') && !e.date.includes('H') && e.certainty !== 'estimated') {
            const eventDate = new Date(e.date);
            const today = new Date(now);
            const diff = Math.ceil((eventDate - today) / (1000*60*60*24));
            if (diff > 0) countdown = `D-${diff}`;
            else if (diff === 0) countdown = '今日';
            else countdown = '已过';
        } else {
            countdown = e.certainty === 'estimated' ? '待定' : '';
        }

        // Certainty badge
        const certaintyBadge = e.certainty === 'estimated' 
            ? '<span class="cal-uncertain" style="background:#8b5cf615;color:#8b5cf6;font-size:11px;padding:1px 6px;border-radius:3px;margin-left:4px">预计</span>' 
            : '';

        const sc = (statusColors[e.status]||'#6b6b8015,#6b6b80').split(',');

        return `
            <div class="cal-card ${e.topPriority && filter === 'all' ? 'cal-card-top' : ''}">
                <div class="cal-top">
                    <span class="cal-date">${e.date}${certaintyBadge}</span>
                    <span class="cal-type" style="background:${(typeColors[e.type]||'#6b6b80')}15;color:${typeColors[e.type]||'#6b6b80'}">${e.type}</span>
                    <span class="cal-countdown">${countdown}</span>
                </div>
                <div class="cal-title">${e.title}</div>
                <div class="cal-stocks">${e.stocks}</div>
                <div class="cal-sec">
                    <strong>市场预期:</strong>${e.marketExpect}<br>
                    <strong>核心验证:</strong>${e.verifyPoint}<br>
                    <strong>影响路径:</strong>${e.impactPath}
                </div>
                <div class="cal-bottom">
                    <span class="cal-status" style="background:${sc[0]};color:${sc[1]}">${e.status}</span>
                </div>
            </div>
        `;
    }).join('');
}

renderCalendar();

// ---- 筛选栏点击切换 ----
document.querySelectorAll('.cal-filter').forEach(el => {
    el.addEventListener('click', function() {
        document.querySelectorAll('.cal-filter').forEach(f => f.classList.remove('active'));
        this.classList.add('active');
        document.querySelectorAll('.cal-filter').forEach(f => f.setAttribute('aria-pressed', String(f === this)));
        renderCalendar(this.dataset.filter);
    });
});

// ---- 历史事件 ----


// ---- Deep link share ----
function copyStockLink() {
    const drawer = document.getElementById('trk-drawer');
    const stockId = drawer ? drawer.dataset.id : '';
    if (!stockId) return;
    const url = window.location.origin + window.location.pathname + '?stock=' + stockId;
    const name = drawer.dataset.name || '';
    navigator.clipboard.writeText(url + ' ' + name).then(() => {
        const btn = document.getElementById('trk-drawer-share');
        if (btn) { btn.textContent = '✅ 已复制'; setTimeout(() => { btn.textContent = '🔗 分享'; }, 2000); }
    }).catch(() => {});
}

function toggleCalendarHistory() {
    const grid = document.getElementById('cal-history-grid');
    const link = document.querySelector('.cal-history-link');
    if (!grid || typeof calendarHistory === 'undefined') return;
    
    const isHidden = grid.style.display === 'none';
    grid.style.display = isHidden ? 'grid' : 'none';
    const pendingHistory = typeof calendarEvents === 'undefined'
        ? []
        : calendarEvents.filter(event => isCalendarEventPast(event));
    const historyCount = calendarHistory.length + pendingHistory.length;
    link.textContent = isHidden ? '收起历史事件' : `查看历史事件 (${historyCount})`;
    link.setAttribute('aria-expanded', String(isHidden));
    
    if (isHidden && grid.children.length === 0) {
        const reviewed = calendarHistory.map(event => ({ ...event, reviewState: 'reviewed' }));
        const pending = pendingHistory.map(event => ({ ...event, reviewState: 'pending' }));
        const historyItems = [...reviewed, ...pending].sort((a, b) => b.date.localeCompare(a.date));

        grid.innerHTML = historyItems.map(e => {
            const impColor = { '极高':'#ef4444', '高':'#f59e0b', '中':'#6b6b80' }[e.importance] || '#6b6b80';
            const reviewContent = e.reviewState === 'reviewed'
                ? `<div class="cal-result"><strong>结果：</strong>${e.result}</div>
                   <div class="cal-verify"><strong>验证：</strong>${e.verification}</div>`
                : `<div class="cal-result"><strong>原市场预期：</strong>${e.marketExpect}</div>
                   <div class="cal-verify"><strong>原核心验证：</strong>${e.verifyPoint}</div>
                   <div class="cal-review-pending">待复盘</div>`;
            return `<div class="cal-card cal-past">
                <div class="cal-date">${e.date}</div>
                <div class="cal-type" style="background:${impColor}15;color:${impColor}">${e.type}</div>
                <div class="cal-title">${e.title}</div>
                <div class="cal-stocks">${e.stocks}</div>
                ${reviewContent}
            </div>`;
        }).join('');
    }
}

// ---- 近期最重要三件事 ----
const topEl = document.getElementById('cal-top-three');
if (topEl && typeof topThree !== 'undefined') {
    const activeTopEvents = topThree
        .filter(event => !isCalendarEventPast(event))
        .slice(0, 3);
    topEl.innerHTML = activeTopEvents.map(t => `
        <div class="t3-item">
            <span class="t3-date">${t.date}</span>
            <span class="t3-title">${t.title}</span>
            <span class="t3-stocks">${t.stocks}</span>
        </div>
    `).join('');
    topEl.style.display = activeTopEvents.length ? 'block' : 'none';
}

// ---- 追踪颜色 - STATUS_COLORS + getStatusColor ----
const STATUS_COLORS = {
    '持有':   { bg: '#22c55e15', text: '#22c55e', dot: '#22c55e' },
    '观察':   { bg: '#3b82f615', text: '#3b82f6', dot: '#3b82f6' },
    '等回调':  { bg: '#f59e0b15', text: '#f59e0b', dot: '#f59e0b' },
    '高风险':  { bg: '#ef444415', text: '#ef4444', dot: '#ef4444' },
    '已放弃':  { bg: '#6b6b8015', text: '#6b6b80', dot: '#6b6b80' },
};

function getStatusColor(status) {
    if (!status) return null;
    if (status.includes('持有') || status.includes('底仓') || status === '持有中') return STATUS_COLORS['持有'];
    if (status.includes('观察')) return STATUS_COLORS['观察'];
    if (status.includes('回调') || status.includes('等')) return STATUS_COLORS['等回调'];
    if (status.includes('风险') || status.includes('警戒') || status.includes('注意')) return STATUS_COLORS['高风险'];
    if (status.includes('清仓')) return STATUS_COLORS['已放弃'];
    if (status.includes('放弃')) return STATUS_COLORS['已放弃'];
    return STATUS_COLORS['观察'];
}

// ---- Global: stock tag click → tracking drawer ----
function findStockIdByTag(tag) {
    if (typeof trackingData === 'undefined') return null;
    for (const key of ['a-shares', 'us-stocks', 'hk-stocks']) {
        const stock = trackingData[key]?.find(s => s.name === tag || s.code === tag);
        if (stock) return stock.id;
    }
    return null;
}

function openStockTracking(stockId) {
    if (!stockId) return;
    for (const key of ['a-shares', 'us-stocks', 'hk-stocks']) {
        const found = trackingData[key]?.find(s => s.id === stockId);
        if (found) {
            const marketCode = key === 'a-shares' ? 'a' : key === 'hk-stocks' ? 'hk' : 'us';
            window.location.hash = '#tracking';
            setTimeout(() => {
                const tab = document.querySelector(`.trk-tab[data-mkt="${marketCode}"]`);
                if (tab) tab.click();
                setTimeout(() => openDrawer(stockId, marketCode), 400);
            }, 100);
            break;
        }
    }
}
