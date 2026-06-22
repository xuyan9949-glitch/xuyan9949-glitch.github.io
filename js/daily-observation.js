// ========================================
// 交易环境雷达 — 每日手动更新
// 
// 数据源: 长桥 OpenAPI
// Symbol 映射见上方注释
// ========================================

const dailyObservation = {
  date: "2026-06-18",  // 上一交易日（周四，周五Juneteenth休市）

  regime: "结构性Risk-on，板块极端分化",
  regimeDetail: "存储/半导体全面暴涨，光通信/加密/航天全线重挫。存储超级周期兑现+MRVL/INTC等暴涨与LITE/AXTI形成21%的极端日内分化。纳指+2.42%，半导体+5.79%。美光财报（6/24）前资金集中涌入存储，抽血光学标的。",

  summary: "6/18美股板块极度分裂。QQQ收$740.68（+2.51%），SMH $662.60（+6.19%），SPY $747.10（+1.09%）。存储全面爆发：MU +9.73%、DRAM +10.86%、MRVL +13.13%、INTC +10.83%。但光通信重挫：AXTI -9.01%、ASTS -6.89%、AAOI -3.32%、LITE -2.64%。加密同样承压：MSTR -3.75%、CRCL -1.52%。核电偏强：CEG +2.58%、OKLO +4.00%。分化的核心逻辑：资金从光学/加密/航天抽血涌入存储/半导体，美光财报（6/24）预期驱动资金提前布局。本周末美国Juneteenth休市。",

  assetGroups: [
    {
      label: "风险资产",
      items: [
        { name: "QQQ（纳指）",  close: "740.68（+2.51%）",       structure: "半导体驱动上行",  level: "强势",     meaning: "全线科技股反弹，存储/MRVL/INTC为主要贡献者" },
        { name: "SMH（半导体）", close: "662.60（+6.19%）",        structure: "存储+传统半导体暴涨", level: "极端",  meaning: "MU/MRVL/INTC领涨，但光学相关芯片（LITE）逆势下跌，板块内部分裂" },
        { name: "VIX", close: "—",         structure: "—",  level: "—", meaning: "Juneteenth假期前数据暂停" },
        { name: "BTC", close: "—（—）",         structure: "加密承压",  level: "走弱", meaning: "MSTR -3.75%，加密跟随光学/航天同步走弱" },
      ],
    },
    {
      label: "亚洲市场",
      items: [
        { name: "KOSPI（韩综）",  close: "—（—）",     structure: "待观察",     level: "—",     meaning: "Juneteenth休市期间，本周关注MU财报对韩股存储方向的传导" },
        { name: "日经225", close: "—（—）",       structure: "待观察",   level: "—",   meaning: "休市" },
        { name: "上证指数", close: "—（—）",  structure: "待观察",   level: "—",   meaning: "A股上周五（6/19）东山精密+6.26%/剑桥+5.53%领涨，光通信A股未跟随美股光学走弱" },
        { name: "恒生科技", close: "—（—）",  structure: "待观察",   level: "—",   meaning: "休市" },
      ],
    },
    {
      label: "利率与流动性",
      items: [
        { name: "10Y美债",  close: "—（—）",  structure: "—", level: "—",   meaning: "Juneteenth休市" },
        { name: "DXY（美元指数）",  close: "—（—）",               structure: "—",          level: "—", meaning: "休市" },
      ],
    },
    {
      label: "商品与避险",
      items: [
        { name: "GLD（黄金）",      close: "—（—）", structure: "—",      level: "—",   meaning: "休市" },
        { name: "USO（美国原油）",      close: "—（—）",  structure: "—",      level: "—",   meaning: "休市" },
      ],
    },
  ],

  nextSession: {
    aShare: "上周五A股独立走强，东山精密+6.26%、剑桥科技+5.53%，未跟随美股光学板块回调。本周关注存储/PCB/光通信的A股映射。美光财报（6/24）是本周核心催化，存储概念可能在A股提前发酵。",
    usStock: "本周一（6/22）美股复盘。核心事件：6/24周三盘后美光FYQ3财报。市场已提前定价存储超级周期，MU上周五+9.73%。关键是beat幅度+guidance+毛利率+资本开支信号。光通信板块上周四急跌，需观察周一是否修复。本周还有FOMC会议纪要（待确认）。",
    risk: "⚠️ 美光财报（6/24盘后）是本周最大事件。存储当前仓位偏重（名义35%），财报预期极高。若出现sell-the-news，存储回调可能拖累整体组合。光学板块上周四放量下跌（VIAV 4.8x量、AAOI 2.4x量），需关注是否延续。加密/航天同为承压板块，MU涨幅过大可能带动risk-off蔓延。",
  },
};
