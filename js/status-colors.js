// ========================================
// 标的状态 → 颜色映射
// ========================================

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
    return STATUS_COLORS['观察']; // default
}
