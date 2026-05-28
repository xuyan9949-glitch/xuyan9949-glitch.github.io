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
        frameworksEl.innerHTML = frameworks.map(f => `
            <div class="framework-card">
                <div class="num">${f.num}</div>
                <h3>${f.title}</h3>
                ${f.desc ? `<p class="fw-desc">${f.desc}</p>` : ''}
                ${f.items ? `<ul class="fw-list">${f.items.map(i => `<li>${i}</li>`).join('')}</ul>` : ''}
            </div>
        `).join('');
    }

    // =====================================================
    // Stock Tracking
    // =====================================================

    function getTypeBadge(type) {
        const colors = { '长线': '#22c55e', '波段': '#f59e0b', '监控': '#6366f1' };
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
            return `
            <div class="trk-card" data-id="${s.id}" data-mkt="${market}">
                <div class="trk-card-header">
                    <span class="trk-card-name">${s.name}</span>
                    <span class="trk-card-code">${s.code}</span>
                </div>
                <div>
                    ${getTypeBadge(s.type)}
                    <span style="margin-left:6px;font-size:12px;color:var(--text-muted)">${s.sector}</span>
                </div>
                <p class="trk-card-reason">${s.reason}</p>
                <div class="trk-card-meta">
                    ${hasLogic ? `<span>📋 ${s.investmentLogic.status || '—'}</span>` : '<span>📋 待补充</span>'}
                    <span class="dot"></span>
                    <span>⚡ ${catalystCount} 催化</span>
                    ${hasPlan ? '' : '<span class="dot"></span><span>📄 待补充</span>'}
                    <span style="margin-left:auto">${s.lastUpdated} 更新</span>
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
                        <div class="value">${logic.coreReason}</div>
                    </div>
                    <div class="trk-logic-item">
                        <div class="label">逻辑状态</div>
                        <div class="value">${getStatusBadge(logic.status)}</div>
                    </div>
                    <div class="trk-logic-item">
                        <div class="label">逻辑有效期</div>
                        <div class="value">${logic.validUntil || '—'}</div>
                    </div>
                    <div class="trk-logic-item full">
                        <div class="label">需要验证的问题</div>
                        <div class="value">${logic.questionsToVerify || '—'}</div>
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

    function renderOperationPlan(plan) {
        if (!plan) return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">🎯</span> 操作计划</h3>
                <div class="trk-empty-data">暂未填写</div>
            </div>`;
        return `
            <div class="trk-detail-section">
                <h3><span class="sec-icon">🎯</span> 操作计划</h3>
                <div class="trk-plan-grid">
                    <div class="trk-plan-item">
                        <div class="label">当前状态</div>
                        <div class="value">${plan.currentStatus}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">买入计划</div>
                        <div class="value">${plan.buyPlan || '—'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">加仓条件</div>
                        <div class="value">${plan.addConditions || '—'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">减仓条件</div>
                        <div class="value">${plan.reduceConditions || '—'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">逻辑破坏条件</div>
                        <div class="value">${plan.invalidateConditions || '—'}</div>
                    </div>
                    <div class="trk-plan-item">
                        <div class="label">最大仓位</div>
                        <div class="value">${plan.maxPosition || '—'}</div>
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

        content.innerHTML = `
            <div class="trk-detail-header">
                <div class="name-row">
                    <h2>${s.name}</h2>
                    <span class="code">${s.code}</span>
                </div>
                ${getTypeBadge(s.type)}
                <span style="margin-left:6px;font-size:13px;color:var(--text-muted)">${s.sector}</span>
                <span style="margin-left:8px;font-size:12px;color:var(--text-muted)">最后更新 ${s.lastUpdated}</span>
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

});
