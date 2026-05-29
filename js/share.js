// ========================================
// 分享功能：复制链接 / 复制摘要 / 生成分享图
// ========================================

(function() {

    const siteName = "Leslie 投资笔记";
    const pageTitle = document.title.replace(" — " + siteName, "").trim();
    const pageUrl = window.location.href;

    // 从文章中提取第一段作为简介
    function getSummary() {
        const content = document.querySelector('.article-content');
        if (!content) return '';
        const ps = content.querySelectorAll('p');
        for (let p of ps) {
            const text = p.textContent.trim();
            if (text.length > 20 && text.length < 200) return text;
        }
        return '';
    }

    // ---------- 复制链接 ----------
    window.shareCopyLink = function() {
        navigator.clipboard.writeText(pageUrl).then(() => {
            showToast('链接已复制，可发送到微信');
        }).catch(() => {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = pageUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('链接已复制');
        });
    };

    // ---------- 复制摘要 ----------
    window.shareCopySummary = function() {
        const summary = getSummary();
        const text = `📄 ${pageTitle}\n${summary || ''}\n${pageUrl}`;
        navigator.clipboard.writeText(text).then(() => {
            showToast('摘要已复制，可直接粘贴到微信');
        }).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast('摘要已复制');
        });
    };

    // ---------- 生成分享图（轻量 Canvas） ----------
    window.shareSaveImage = function() {
        const summary = getSummary();
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');

        // 背景
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
        ctx.fillText(siteName, 32, 32);

        // 标题
        ctx.font = '700 22px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#1d1d1f';
        ctx.textBaseline = 'top';

        // 自动换行
        const maxW = 536;
        const titleLines = wrapText(ctx, pageTitle, maxW);
        let y = 56;
        for (let line of titleLines) {
            ctx.fillText(line, 32, y);
            y += 30;
        }

        // 简介
        if (summary) {
            ctx.font = '400 14px -apple-system, "PingFang SC", sans-serif';
            ctx.fillStyle = '#6b6b80';
            const summaryLines = wrapText(ctx, summary, maxW);
            y += 16;
            let maxLines = 0;
            for (let line of summaryLines) {
                if (maxLines >= 4) break;
                ctx.fillText(line, 32, y);
                y += 22;
                maxLines++;
            }
        }

        // 网址 + 分隔线
        y = Math.max(y + 24, 340);
        ctx.strokeStyle = '#e8e8ee';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(568, y);
        ctx.stroke();

        ctx.font = '400 11px -apple-system, "PingFang SC", sans-serif';
        ctx.fillStyle = '#9a9ab0';
        ctx.fillText('基于个人研究，不构成投资建议', 32, y + 14);
        ctx.textAlign = 'right';
        ctx.fillText(new URL(pageUrl).hostname, 568, y + 14);
        ctx.textAlign = 'left';

        // 下载
        const link = document.createElement('a');
        link.download = `${pageTitle.slice(0, 30)}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('分享图已保存');
    };

    // 文字换行
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
        return lines;
    }

    // ---------- Toast 提示 ----------
    function showToast(msg) {
        let toast = document.getElementById('share-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'share-toast';
            toast.style.cssText = `
                position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
                background: #1d1d1f; color: #fff; padding: 10px 20px;
                border-radius: 10px; font-size: 13px; font-weight: 500;
                opacity: 0; transition: opacity .3s; z-index: 999;
                pointer-events: none; white-space: nowrap;
                font-family: -apple-system, "PingFang SC", sans-serif;
            `;
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
    }

})();
