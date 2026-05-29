// ========================================
// 分享功能：复制链接 / 复制摘要 / 生成分享图
// ========================================

const siteName = "Leslie 投资笔记";

function getPageTitle() {
    return document.title.replace(" — " + siteName, "").trim();
}

function getSummary() {
    const content = document.querySelector('.article-content');
    if (!content) return '';
    const ps = content.querySelectorAll('p');
    for (let p of ps) {
        const text = p.textContent.trim();
        if (text.length > 20 && text.length < 200) return text;
    }
    // Fallback: try first paragraph with any text
    for (let p of ps) {
        const text = p.textContent.trim();
        if (text.length > 10) return text;
    }
    return '';
}

// ---------- Toast ----------
function showToast(msg) {
    let toast = document.getElementById('share-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'share-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            background: #1d1d1f;
            color: #fff;
            padding: 10px 24px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transition: opacity .3s;
            z-index: 9999;
            pointer-events: none;
            white-space: nowrap;
            font-family: -apple-system, "PingFang SC", sans-serif;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ---------- 复制链接 ----------
function shareCopyLink() {
    const url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
            showToast('✅ 链接已复制，可发送到微信');
        }).catch(() => fallbackCopy(url));
    } else {
        fallbackCopy(url);
    }
}

// ---------- 复制摘要 ----------
function shareCopySummary() {
    const title = getPageTitle();
    const summary = getSummary();
    const url = window.location.href;
    const text = `📄 ${title}\n${summary || ''}\n${url}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('✅ 摘要已复制，可直接粘贴微信');
        }).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}

// fallback: 老式 clipboard
function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast('✅ 已复制');
    } catch (e) {
        showToast('❌ 复制失败，请手动复制');
    }
    document.body.removeChild(ta);
}

// ---------- 生成分享图 ----------
function shareSaveImage() {
    const title = getPageTitle();
    const summary = getSummary();
    const hostname = window.location.hostname;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    // 背景渐变
    const bg = ctx.createLinearGradient(0, 0, 600, 400);
    bg.addColorStop(0, '#f0f4ff');
    bg.addColorStop(1, '#f5f5f7');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 400);

    // 顶部分隔线 + 品牌
    ctx.fillStyle = '#2d6cff';
    ctx.fillRect(0, 0, 600, 4);
    ctx.font = '500 12px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#2d6cff';
    ctx.fillText(siteName, 32, 30);

    // 标题
    ctx.font = '700 22px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#1d1d1f';
    ctx.textBaseline = 'top';
    const maxW = 536;
    const titleLines = wrapText(ctx, title, maxW);
    let y = 56;
    for (let line of titleLines) {
        ctx.fillText(line, 32, y);
        y += 30;
        if (y > 240) break; // 防止溢出
    }

    // 简介
    if (summary) {
        ctx.font = '400 14px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#6b6b80';
        const summaryLines = wrapText(ctx, summary, maxW);
        y += 16;
        let count = 0;
        for (let line of summaryLines) {
            if (count >= 3) break;
            ctx.fillText(line, 32, y);
            y += 22;
            count++;
        }
    }

    // 底部
    y = Math.max(y + 20, 340);
    ctx.strokeStyle = '#e8e8ee';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(32, y);
    ctx.lineTo(568, y);
    ctx.stroke();

    ctx.font = '400 11px -apple-system, "PingFang SC", sans-serif';
    ctx.fillStyle = '#9a9ab0';
    ctx.textAlign = 'left';
    ctx.fillText('基于个人研究，不构成投资建议', 32, y + 14);
    ctx.textAlign = 'right';
    ctx.fillText(hostname, 568, y + 14);
    ctx.textAlign = 'left';

    // 下载
    const link = document.createElement('a');
    const safeName = title.replace(/[\/\\?%*:|"<>]/g, '').slice(0, 30);
    link.download = safeName + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('✅ 分享图已保存');
}

// 文字换行辅助
function wrapText(ctx, text, maxWidth) {
    const chars = text.split('');
    const lines = [];
    let line = '';
    for (let ch of chars) {
        const testLine = line + ch;
        if (ctx.measureText(testLine).width > maxWidth && line) {
            lines.push(line);
            line = ch;
        } else {
            line = testLine;
        }
    }
    if (line) lines.push(line);
    return lines.length > 0 ? lines : [text];
}
