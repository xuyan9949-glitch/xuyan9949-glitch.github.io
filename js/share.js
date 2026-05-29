// ========================================
// 一键分享：复制标题+摘要+链接到剪贴板
// ========================================

const _siteName = "Leslie 投资笔记";

function shareArticle() {
    const title = document.title.replace(" — " + _siteName, "").trim();
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
