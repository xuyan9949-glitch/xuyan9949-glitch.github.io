document.addEventListener('DOMContentLoaded', () => {
    // ---- Mobile nav toggle ----
    const toggle = document.getElementById('nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (toggle && navLinks) {
        toggle.addEventListener('click', () => {
            navLinks.classList.toggle('open');
        });
        // Close on link click
        navLinks.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => navLinks.classList.remove('open'));
        });
    }

    // ---- Render Research Map ----
    const researchEl = document.getElementById('research-list');
    if (researchEl) {
        const research = [
            { icon: '🏛️', title: '美股科技投资', desc: '半导体、存储、光互连、AI 基础设施——以产业链研究驱动配置决策。' },
            { icon: '⚡', title: 'AI 基础设施', desc: '数据中心、电力/核电、液冷、PCB、光模块——从 CapEx 到产业链的逐层传导。' },
            { icon: '🔬', title: '光通信 / 半导体', desc: 'InP 衬底、EML 激光器、硅光技术——AI 时代最上游的物理入口。' },
            { icon: '📈', title: 'A 股产业映射', desc: '美股→A 股产业链对标，题材轮动节奏，龙一→龙二→补涨扩散规律。' },
            { icon: '🧠', title: '投资方法论', desc: '三类资产框架、Follow the Money、周期定位——可复用的思维模型。' },
        ];
        researchEl.innerHTML = research.map(r => `
            <div class="research-card">
                <span class="icon">${r.icon}</span>
                <h3>${r.title}</h3>
                <p>${r.desc}</p>
            </div>
        `).join('');
    }

    // ---- Render Featured Notes ----
    const notesEl = document.getElementById('notes-list');
    if (notesEl && typeof articles !== 'undefined') {
        if (articles.length === 0) {
            notesEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0;">笔记整理中，即将发布。</p>';
        } else {
            notesEl.innerHTML = articles.map(a => `
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
    }

    // ---- Render Frameworks ----
    const frameworksEl = document.getElementById('frameworks-list');
    if (frameworksEl) {
        const frameworks = [
            { num: '01', title: '公司研究框架', desc: '从商业模式、竞争壁垒、财务健康、管理层、估值五个维度扫描标的。' },
            { num: '02', title: '产业趋势判断', desc: 'Follow the Money：CapEx → 订单 → 产能 → 涨价 → 设备交期 → 财报指引 → 客户认证。' },
            { num: '03', title: 'A 股题材传导', desc: '龙一兑现 → 龙二补涨 → 上游扩散 → 设备耗材 → 低位小市值 → 蹭概念 → 退潮。' },
            { num: '04', title: '交易纪律框架', desc: '三类资产（0→1 / 1→100 / 供需失衡）对应的不同买卖点与风控规则。' },
        ];
        frameworksEl.innerHTML = frameworks.map(f => `
            <div class="framework-card">
                <div class="num">${f.num}</div>
                <h3>${f.title}</h3>
                <p>${f.desc}</p>
            </div>
        `).join('');
    }
});
