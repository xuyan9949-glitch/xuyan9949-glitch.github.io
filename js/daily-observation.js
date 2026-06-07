// ========================================
// 交易环境雷达 — 每日手动更新
// ========================================

const dailyObservation = {
  date: "2026-06-07",

  // 环境评级
  regime: "中性偏防御",
  regimeDetail: "防御观察",

  // 一句话判断
  summary: "上一个交易日科技成长股出现极端风险释放：QQQ 705.06（-4.8%）、SOX（-5.6%）且盘中单边下跌；10Y收益率同步上行，说明成长股估值压力加大。下一交易日不宜追高，重点观察AI硬件龙头是否止跌，以及A股科技映射是否高开低走。",

  // 四类资产表现
  assetGroups: [
    {
      label: "风险资产",
      items: [
        { name: "QQQ",  close: "705.06（-4.8%）",  structure: "单边下跌",  level: "极端大跌",  meaning: "成长股风险偏好急剧下降" },
        { name: "SOX",  close: "-5.6%",            structure: "放量下跌",  level: "极端杀估值", meaning: "半导体高β资金撤退" },
        { name: "BTC",  close: "62,400（-3.2%）",   structure: "探底弱修复", level: "风险偏弱",   meaning: "加密链谨慎" },
      ],
    },
    {
      label: "亚洲市场",
      items: [
        { name: "KOSPI",  close: "-2.1%",  structure: "低开低走",   level: "明显走弱", meaning: "亚洲半导体承压" },
        { name: "日经225", close: "-1.4%",  structure: "高开低走",   level: "偏弱",     meaning: "亚洲风险偏好下降" },
        { name: "上证指数", close: "-0.6%",  structure: "震荡走弱",   level: "普通回调", meaning: "A股情绪一般" },
        { name: "恒生科技", close: "-2.8%",  structure: "单边走低",   level: "明显走弱", meaning: "中国科技映射承压" },
      ],
    },
    {
      label: "利率与流动性",
      items: [
        { name: "10Y美债收益率", close: "4.62%（+9bp）", structure: "持续上行",   level: "明显逆风",     meaning: "成长股估值承压" },
        { name: "DXY",          close: "105.2（+0.7%）", structure: "单边走强",   level: "流动性收紧",   meaning: "全球风险资产承压" },
      ],
    },
    {
      label: "商品与避险",
      items: [
        { name: "黄金",      close: "+1.3%",   structure: "震荡上行", level: "避险升温", meaning: "风险偏好下降" },
        { name: "布伦特原油", close: "-0.4%",   structure: "冲高回落", level: "中性",     meaning: "通胀压力暂未扩大" },
      ],
    },
  ],

  // 下一交易日提示
  nextSession: {
    aShare: "不追高科技映射，尤其防范AI硬件、半导体、光模块、PCB等方向高开低走。若核心龙头能抗跌并放量回升，再考虑低吸；若指数和港股科技继续弱，降低题材交易频率。",
    usStock: "AI硬件主线不是逻辑破坏，而是进入估值压力测试。下一交易日重点看QQQ、SOX能否从单边下跌转为探底回升；若10Y继续上行，不做短期期权追涨。",
    risk: "若QQQ/SOX继续放量下跌，说明高β成长股仍在去杠杆；若BTC同步破位，加密链和小盘高弹性资产需要继续降风险。",
  },
};
