// ========================================
// 交易环境雷达 — 每日手动更新
// 
// 数据源: 长桥 OpenAPI
// 生成逻辑: 按上一交易日收盘数据分析
//
// 长桥 Symbol 映射:
//   QQQ -> QQQ.US      SOX代理 -> SOXX.US
//   BTC代理 -> IBIT.US  KOSPI代理 -> EWY.US
//   日经225代理 -> EWJ.US  上证指数 -> 000001.SH
//   恒生科技 -> HSTECH.HK  10Y美债代理 -> IEF.US
//   DXY代理 -> UUP.US  黄金 -> GLD.US
//   布伦特原油 -> BNO.US
//
// IEF注意事项：价格与收益率反向，上行=收益率下行
// ========================================

const dailyObservation = {
  date: "2026-06-05",  // 上一交易日

  // 环境评级：Risk-on / 结构性Risk-on / 中性 / 中性偏防御 / 防御观察 / Risk-off
  regime: "防御观察",
  regimeDetail: "高β成长股极端杀估值，流动性收紧叠加避险升温",

  // 一句话判断
  summary: "上一个交易日全球风险资产全线暴跌：QQQ -4.8%、SOXX -10.4%、IBIT -5.2%，10Y收益率上行（IEF -0.53%即收益率+7bp）、DXY +0.65%显示美元流动性收紧，黄金-3.65%异常跟跌说明保证金抛售而非避险买盘。亚洲市场同步重挫（EWY韩国-14%、EWJ日本-3.6%、恒生科技-1.75%）。这是典型的Risk-off去杠杆行情，不是普通回调。",

  // 四类资产表现
  assetGroups: [
    {
      label: "风险资产",
      items: [
        { name: "QQQ",  close: "705.06（-4.8%）",       structure: "单边下跌",  level: "极端大跌",     meaning: "成长股风险偏好急剧下降" },
        { name: "SOXX", close: "539.77（-10.4%）",       structure: "放量单边杀跌", level: "极端杀估值",  meaning: "半导体恐慌性去杠杆" },
        { name: "IBIT", close: "34.14（-5.2%）",         structure: "探底弱修复",  level: "加密风险释放", meaning: "加密链持续去杠杆" },
      ],
    },
    {
      label: "亚洲市场",
      items: [
        { name: "EWY",    close: "175.19（-14.1%）",     structure: "崩跌",     level: "极端",     meaning: "韩国政治风险叠加半导体恐慌" },
        { name: "EWJ",    close: "90.72（-3.6%）",       structure: "低开低走",   level: "明显走弱",   meaning: "亚洲风险偏好急剧下降" },
        { name: "上证指数", close: "4027.74（-0.74%）",  structure: "震荡走弱",   level: "普通回调",   meaning: "A股相对抗跌但情绪偏弱" },
        { name: "恒生科技", close: "4888.39（-1.75%）",  structure: "单边走低",   level: "明显走弱",   meaning: "中国科技映射承压" },
      ],
    },
    {
      label: "利率与流动性",
      items: [
        { name: "IEF",  close: "93.62（-0.53%→收益率+7bp）",  structure: "价格下跌(收益率上行)", level: "估值逆风",   meaning: "成长股估值承压" },
        { name: "UUP",  close: "28.02（+0.65%）",               structure: "单边走强",          level: "流动性收紧", meaning: "全球风险资产承压" },
      ],
    },
    {
      label: "商品与避险",
      items: [
        { name: "GLD",      close: "396.24（-3.65%）", structure: "放量下跌",      level: "异常",   meaning: "保证金追缴抛售，非避险买盘" },
        { name: "BNO",      close: "51.20（-2.44%）",  structure: "冲高回落",      level: "偏弱",   meaning: "需求担忧而非供给驱动" },
      ],
    },
  ],

  // 下一交易日提示
  nextSession: {
    aShare: "A股周一大概率低开。关注上证4000点能否守住；若低开后放量回升，AI硬件核心票可视为抗跌验证；若全天单边下行且缩量，继续降低题材仓位。重点观察恒生科技方向是否补跌。",
    usStock: "QQQ/SOXX周五已出现极端单边杀跌，周一焦点是止跌还是继续去杠杆。若开盘继续放量下行，必须减仓；若出现探底回升或缩量止跌，可能进入压力测试阶段而非趋势破坏。10Y收益率和DXY走势仍是核心变量。不做任何短期期权追涨。",
    risk: "⚠️ 黄金-3.65%同步跟跌是最危险的信号——说明市场在卖一切换现金（Cash is King），而非结构性避险。如果周一BTC/QQQ继续破位，说明去杠杆未结束，高β资产仍需降风险。",
  },
};
