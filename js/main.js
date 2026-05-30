document.addEventListener('DOMContentLoaded', () => {

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

        if (filtered.length === 0) {
            notesEl.innerHTML = '<div class="empty-notes">暂无内容，持续更新中。</div>';
            return;
        }

        notesEl.innerHTML = filtered.map(a => `
            <a href="${a.file}" class="note-card">
                <div class="meta">
                    <span>${a.date}</span>
                    <span class="dot"></span>
                    <span>${a.tags.join(' · ')}</span>
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
        if (!grid || typeof trackingData === 'undefined') return;

        const marketKey = market === 'a' ? 'a-shares' : 'us-stocks';
        const stocks = trackingData[marketKey];
        if (!stocks || stocks.length === 0) {
            grid.innerHTML = '<div class="trk-empty">暂无可展示的标的</div>';
            return;
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

    // ---- Tracking Tabs ----
    const tabs = document.querySelectorAll('.trk-tab');
    if (tabs.length > 0) {
        let currentMarket = 'a';
        renderCards(currentMarket);

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                currentMarket = tab.dataset.mkt;
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
        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">💰</span> 估值分析</h3>
                <div class="trk-val-grid">
                    <div class="trk-val-item">
                        <div class="label">PE(TTM)</div>
                        <div class="value">${val.peTTM || '—'}</div>
                    </div>
                    <div class="trk-val-item">
                        <div class="label">PE(Forward)</div>
                        <div class="value">${val.peForward || '—'}</div>
                    </div>
                    <div class="trk-val-item">
                        <div class="label">PB</div>
                        <div class="value">${val.pb || '—'}</div>
                    </div>
                    <div class="trk-val-item">
                        <div class="label">总市值</div>
                        <div class="value">${val.marketCap || '—'}</div>
                    </div>
                    <div class="trk-val-item full">
                        <div class="label">估值评价</div>
                        <div class="value">${val.assessment || '—'}</div>
                    </div>
                    <div class="trk-val-item full">
                        <div class="label">同业对比</div>
                        <div class="value">${val.peerComparison || '—'}</div>
                    </div>
                    <div class="trk-val-item full">
                        <div class="label">估值风险</div>
                        <div class="value" style="color:var(--text-secondary)">${val.riskNote || '—'}</div>
                    </div>
                </div>
            </div>`;
    }

    function renderOperationPlan(plan) {
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
                </div>
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

            ${renderInvestmentLogic(s.investmentLogic)}
            ${renderCatalysts(s.catalysts)}
            ${renderValuation(s.valuation)}
            ${renderOperationPlan(s.operationPlan)}
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

});
