document.addEventListener('DOMContentLoaded', () => {

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
        
        // 速报：最近一条是否在最后访问之后
        if (typeof newsItems !== 'undefined' && newsItems.length > 0) {
            const latest = new Date(newsItems[0].date).getTime();
            const lastSeen = seen.news || 0;
            const dot = document.querySelector('.nav-dot[data-section="news"]');
            if (dot) dot.classList.toggle('show', latest > lastSeen);
        }
        
        // 标的追踪：最近更新是否在最后访问之后
        if (typeof trackingData !== 'undefined') {
            const allStocks = [...(trackingData['a-shares'] || []), ...(trackingData['us-stocks'] || [])];
            const dates = allStocks.map(s => new Date(s.lastUpdated).getTime()).filter(d => !isNaN(d));
            if (dates.length > 0) {
                const latest = Math.max(...dates);
                const lastSeen = seen.tracking || 0;
                const dot = document.querySelector('.nav-dot[data-section="tracking"]');
                if (dot) dot.classList.toggle('show', latest > lastSeen);
            }
        }
        
        // 笔记：最近文章日期
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
    const researchEl = document.getElementById('research-list');
    if (researchEl) {
        const research = [
            { icon: '\u{1F3DB}\u{FE0F}', title: '美股科技投资', desc: '半导体、存储、光互连、AI 基础设施——以产业链研究驱动配置决策。' },
            { icon: '\u26A1', title: 'AI 基础设施', desc: '数据中心、电力/核电、液冷、PCB、光模块——从 CapEx 到产业链的逐层传导。' },
            { icon: '\u{1F52C}', title: '光通信 / 半导体', desc: 'InP 衬底、EML 激光器、硅光技术——AI 时代最上游的物理入口。' },
            { icon: '\u{1F4C8}', title: 'A 股产业映射', desc: '美股→A 股产业链对标，题材轮动节奏，龙一→龙二→补涨扩散规律。' },
            { icon: '\u{1F9E0}', title: '投资方法论', desc: '三类资产框架、Follow the Money、周期定位——可复用的思维模型。' },
        ];
        researchEl.innerHTML = research.map(r => `
            <div class="research-card">
                <span class="icon">${r.icon}</span>
                <h3>${r.title}</h3>
                <p>${r.desc}</p>
            </div>
        `).join('');
    }

    // ---- Category filter + Notes ----
    const notesEl = document.getElementById('notes-list');
    const catTags = document.querySelectorAll('.cat-tag');

    function renderNotes(category) {
        if (!notesEl || typeof articles === 'undefined') return;

        let filtered = articles;
        if (category !== 'all') {
            filtered = articles.filter(a => a.category === category);
        }
        // Pinned articles first, then by date descending
        filtered.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date) - new Date(a.date);
        });
        
        if (filtered.length === 0) {
            notesEl.innerHTML = '<div class="empty-notes">暂无内容，持续更新中。</div>';
            return;
        }

        notesEl.innerHTML = filtered.map(a => `
            <a href="${a.file}" class="note-card">
                <div class="meta">
                    <span>${a.date}</span>
                    <span class="dot"></span>
                    <span>${a.tags.map(t => {
                        // Make stock-name tags clickable → jump to tracking
                        const stockId = findStockIdByTag(t);
                        return stockId 
                            ? `<span class="tag-stock-link" onclick="event.preventDefault();event.stopPropagation();openStockTracking('${stockId}')">${t}</span>`
                            : t;
                    }).join(' · ')}</span>
                    ${a.pinned ? '<span class="pin-badge">📌 置顶</span>' : ''}
                </div>
                <h3>${a.title}</h3>
                <p>${a.summary}</p>
                <div class="tags">
                    ${a.tags.map(t => `<span>${t}</span>`).join('')}
                </div>
            </a>
        `).join('');
    }

    if (catTags.length > 0) {
        catTags.forEach(el => {
            el.addEventListener('click', () => {
                catTags.forEach(t => t.classList.remove('active'));
                el.classList.add('active');
                renderNotes(el.dataset.cat);
            });
        });
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
                    '卖什么 → 卖给谁（产品定位与客户画像）',
                    '为什么持续买（复购逻辑 / 护城河）',
                    '怎么收钱（现金流质量）',
                    '市场在交易什么（当前price in了什么预期）',
                    '未来 12-24 个月验证点',
                ]
            },
            { 
                num: '02', title: '财务分析框架',
                items: [
                    '利润是否被现金撑住',
                    '营运资本是否健康',
                    '产能是否在扩张',
                    '扩张是否有危险（供过于求风险）',
                ]
            },
            { 
                num: '03', title: '产业趋势判断',
                desc: 'Follow the Money：巨头CapEx → 供应链订单 → 产能扩张 → 上游涨价 → 设备交期拉长 → 财报指引上修 → 客户认证加速。'
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
                desc: '三类资产（0→1 / 1→100 / 供需失衡）对应不同的买卖点与风控规则。'
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

    function renderCards(market) {
        const grid = document.getElementById('trk-grid');
        const summary = document.getElementById('trk-summary');
        if (!grid || typeof trackingData === 'undefined') return;

        const marketKey = market === 'a' ? 'a-shares' : 'us-stocks';
        let stocks = trackingData[marketKey];
        if (!stocks || stocks.length === 0) {
            grid.innerHTML = '<div class="trk-empty">暂无可展示的标的</div>';
            if (summary) summary.innerHTML = '';
            return;
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
            const status = s.trackingStatus || (s.investmentLogic ? s.investmentLogic.status : '—');
            return `
            <div class="trk-card" data-id="${s.id}" data-mkt="${market}">
                <div class="trk-card-header">
                    <span class="trk-card-name">
                        ${(() => {
                            const c = getStatusColor(s.trackingStatus);
                            return c ? `<span class="status-dot" style="background:${c.dot}"></span> ` : '';
                        })()}
                        ${s.name}
                    </span>
                    <span class="trk-card-code">${s.code}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">
                    ${getTypeBadge(s.type)}
                    ${(() => {
                        const c = getStatusColor(s.trackingStatus);
                        return c ? `<span class="status-label" style="background:${c.bg};color:${c.text}">${s.trackingStatus}</span>` : '';
                    })()}
                    ${s.ahShare ? `<span class="trk-card-type" style="background:#8b5cf615;color:#8b5cf6;font-size:10px;border:1px solid #8b5cf640">A+H</span>` : ''}
                    ${s.logicStatus ? `<span class="trk-card-type" style="background:#22c55e15;color:#22c55e;font-size:11px">${s.logicStatus}</span>` : ''}
                    ${s.priority ? `<span class="trk-card-type" style="background:#ef444415;color:#ef4444;font-size:11px">优先级${s.priority}</span>` : ''}
                </div>
                <p class="trk-card-reason">${s.reason}</p>
                <div class="trk-card-meta">
                    <span>${status}</span>
                    <span class="dot"></span>
                    <span>⚡ ${catalystCount} 催化</span>
                    ${s.tradeCycle ? `<span class="dot"></span><span>${s.tradeCycle}</span>` : ''}
                    <span style="margin-left:auto">${s.lastUpdated}</span>
                </div>
                <span class="trk-card-arrow">→</span>
            </div>
        `}).join('');

        grid.querySelectorAll('.trk-card').forEach(el => {
            el.addEventListener('click', () => {
                openDrawer(el.dataset.id, el.dataset.mkt);
            });
        });
    }

    // ---- US Stock Sector Tabs ----
    const usSectors = ['七姐妹','光互联','半导体','AI基础设施','加密/金融','太空','量子计算'];
    const US_SECTOR_COLORS = {
        '光互联': '#3b82f6', '半导体': '#ef4444', 'AI基础设施': '#f59e0b',
        '加密/金融': '#22c55e', '太空': '#8b5cf6', '七姐妹': '#6366f1', '量子计算': '#06b6d4'
    };
    
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
    if (tabs.length > 0) {
        let currentMarket = 'a';
        renderCards(currentMarket);

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
                renderCards(currentMarket);
            });
        });
    }

    // =====================================================
    // Drawer — 投资逻辑 · 催化剂看板 · 操作计划
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
                        <div class="value">${logic.validUntil || '—'}${logic.validNote ? `<br><span style="font-size:12px;color:var(--text-muted);margin-top:4px;display:inline-block">${logic.validNote}</span>` : ''}</div>
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
                    <span style="font-size:12px;color:var(--text-muted)">PE(TTM) ${val.peTTM || '—'} · PE(Fwd) ${val.peForward || '—'} · PB ${val.pb || '—'} · 总市值 ${val.marketCap || '—'}</span>
                </div>
                ${rows ? `
                <div class="trk-val-table-wrap">
                    <table class="trk-val-table">
                        <thead>
                            <tr>
                                <th>版本</th>
                                <th>合理市值</th>
                                <th>对应A股股价</th>
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
            : plan.buyPlan || '—';
        
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
                        <div class="value">${plan.addConditions || '—'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">减仓条件</div>
                        <div class="value">${plan.reduceConditions || '—'}</div>
                    </div>
                    <div class="trk-plan-item" style="grid-column:1/-1">
                        <div class="label">逻辑破坏条件</div>
                        <div class="value">${plan.invalidateConditions || '—'}</div>
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
    // US Stock Drawer — 基本面验证系统
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
                    <strong style="color:var(--text)">市场正在交易：</strong><br>${mt}</p>
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

        const marketKey = market === 'a' ? 'a-shares' : 'us-stocks';
        const stocks = trackingData[marketKey];
        const s = stocks.find(x => x.id === id);
        if (!s) return;

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
        if (s.priority) badges.push(`<span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:600;background:#ef444415;color:#ef4444">优先级:${s.priority}</span>`);
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

            <!-- 概览 — 一句话快照 -->
            <div class="trk-detail-section">
                <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;background:var(--bg-alt);padding:12px 14px;border-radius:8px;">
                    ${s.reason}<br>
                    <span style="color:var(--text-muted)">策略：${s.strategy}</span>
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

    // Auto-switch tab if URL has tracking hash with market param
    if (window.location.hash === '#tracking') {
        // check if there's a stored preference or just show A-shares by default
    }

    // ---- Render News Flash ----
    const newsList = document.getElementById('news-flash-list');
    if (newsList && typeof newsItems !== 'undefined') {
        const latest = newsItems.slice(0, 5);
        newsList.innerHTML = latest.map((n, idx) => {
            const impactIcon = n.impact === '利好' ? '🟢' : n.impact === '利空' ? '🔴' : '🟡';
            const stocksHtml = n.stocks && n.stocks.length > 0
                ? ' · ' + n.stocks.map(s => `<span class="nf-stock" data-stock="${s.toLowerCase()}">${s}</span>`).join(' ')
                : '';
            return `
                <div class="nf-row" data-idx="${idx}">
                    <span class="nf-date">${n.date.slice(5)}</span>
                    <span class="nf-dot">·</span>
                    <span class="nf-impact-icon">${impactIcon}</span>
                    <span class="nf-title">${n.title}</span>
                    <span class="nf-footer-info">${stocksHtml}</span>
                </div>
                <div class="nf-detail" id="nf-detail-${idx}" style="display:none">
                    <p>${n.detail}</p>
                    ${n.source ? `<p style="color:var(--text-muted);font-size:11px;margin-top:4px">来源：${n.source}</p>` : ''}
                </div>
            `;
        }).join('');
        
        // Click to expand
        // Click row to expand/collapse
        newsList.querySelectorAll('.nf-row').forEach(el => {
            el.addEventListener('click', (e) => {
                if (e.target.closest('.nf-stock')) return; // let stock clicks handle separately
                const idx = el.dataset.idx;
                const detail = document.getElementById(`nf-detail-${idx}`);
                if (detail) {
                    const isOpen = detail.style.display === 'block';
                    detail.style.display = isOpen ? 'none' : 'block';
                    el.classList.toggle('active', !isOpen);
                }
            });
        });
        
        // Stock tag clicks → navigate to tracking drawer
        document.querySelectorAll('.nf-stock').forEach(el => {
            el.addEventListener('click', function(e) {
                e.stopPropagation();
                const stockId = this.dataset.stock;
                if (!stockId) return;
                // Navigate to tracking section
                window.location.hash = '#tracking';
                // Determine market by checking the stock in trackingData
                for (const mkt of ['a-shares', 'us-stocks']) {
                    const found = trackingData[mkt]?.find(s => s.id === stockId);
                    if (found) {
                        const marketCode = mkt === 'a-shares' ? 'a' : 'us';
                        setTimeout(() => {
                            // Switch to correct market tab
                            const tab = document.querySelector(`.trk-tab[data-mkt="${marketCode}"]`);
                            if (tab) tab.click();
                            // Open drawer after a brief delay for rendering
                            setTimeout(() => {
                                openDrawer(stockId, marketCode);
                            }, 400);
                        }, 100);
                        break;
                    }
                }
            });
        });
    }

});

// ---- Global: stock tag click → tracking drawer ----
function findStockIdByTag(tag) {
    if (typeof trackingData === 'undefined') return null;
    for (const key of ['a-shares', 'us-stocks']) {
        const stock = trackingData[key]?.find(s => s.name === tag || s.code === tag);
        if (stock) return stock.id;
    }
    return null;
}

function openStockTracking(stockId) {
    if (!stockId) return;
    for (const key of ['a-shares', 'us-stocks']) {
        const found = trackingData[key]?.find(s => s.id === stockId);
        if (found) {
            const marketCode = key === 'a-shares' ? 'a' : 'us';
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
