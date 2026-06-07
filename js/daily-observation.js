// ========================================
// 交易环境雷达 — 每日手动更新
// ========================================

const dailyObservation = {
  // 日期
  date: "2026-06-07",

  // 总状态：Risk-on / 中性 / 中性偏防御 / Risk-off
  regime: "中性偏防御",

  // 一句话总结（上一交易日全球资产表现说明什么）
  summary: "上周五美股走势分化：Nasdaq和SOX延续回调，BTC继续探底，10Y收益率上行压制成长股估值。亚洲盘偏弱，全球风险偏好下降，AI硬件主线进入估值消化期。",

  // 四类资产表现
  assetGroups: [
    {
      label: "风险资产",
      items: [
        { name: "Nasdaq",  change: "回调",  direction: "down" },
        { name: "SOX",     change: "偏弱",   direction: "down" },
        { name: "BTC",     change: "探底中",  direction: "down" },
      ],
    },
    {
      label: "亚洲市场",
      items: [
        { name: "KOSPI",   change: "走低",   direction: "down" },
        { name: "日经225",  change: "偏弱",   direction: "down" },
        { name: "上证指数",  change: "震荡",   direction: "neutral" },
        { name: "恒生科技",  change: "承压",   direction: "down" },
      ],
    },
    {
      label: "利率流动性",
      items: [
        { name: "10Y美债",  change: "上行",   direction: "up" },
        { name: "DXY",     change: "偏强",   direction: "up" },
      ],
    },
    {
      label: "商品避险",
      items: [
        { name: "黄金",    change: "偏强",   direction: "up" },
        { name: "布伦特原油", change: "震荡", direction: "neutral" },
      ],
    },
  ],

  // 下一交易日提示
  nextSession: {
    aShare: "不追高位后排，只看AI硬件核心方向回踩确认；若指数偏弱，降低题材交易频率。",
    usStock: "关注AI硬件龙头是否止跌，不做短期期权追涨，等开盘确认，不被盘前波动带节奏。",
    risk: "BTC若破位可能引发高β资产继续去杠杆；10Y继续上行则成长股估值承压。",
  },

  // 历史回看
  hindsight: {
    verdict: "上周判断市场进入估值消化期，建议防御姿态。实际走势验证：AI硬件主线未破但高位票回调，整体方向判断正确，但存储股（MU）跌幅超预期，对BTC探底深度判断不足。",
    verdictResult: "部分验证",
  },
};
