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
        // Fallback: render all articles
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
});
