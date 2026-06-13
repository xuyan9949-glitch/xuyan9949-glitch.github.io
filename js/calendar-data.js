// ========================================
// 关键验证日历 — 月度聚焦
// ========================================

// 当前（未来）事件
const calendarEvents = [
  {
    date: "2026-06-16",
    title: "FOMC 利率决议（6月会议·含新闻发布会）",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY / 所有风险资产",
    importance: "极高",
    status: "等待验证",
    marketExpect: "市场Price in维持利率不变，关注点阵图和鲍威尔讲话",
    verifyPoint: "点阵图是否暗示下半年降息路径、通胀预期是否上调、经济预测摘要",
    impactPath: "若释放降息信号，科技成长股可能反弹；若偏鹰，继续压制估值",
    topPriority: true,
  },
  {
    date: "2026-06-25",
    title: "美光（MU）FY2026 Q3 财报",
    type: "财报",
    stocks: "MU / DRAM / HBM",
    importance: "高",
    status: "等待验证",
    marketExpect: "HBM供给紧张、DRAM涨价继续传导",
    verifyPoint: "HBM收入占比是否继续提升、毛利率是否改善、数据中心需求指引是否上修",
    impactPath: "若指引上修，可能带动存储设备与A股材料链扩散",
    topPriority: true,
  },
  {
    date: "2026-06-25",
    title: "NVIDIA GTC 中国站",
    type: "会议",
    stocks: "NVDA / LITE / COHR / AAOI",
    importance: "高",
    status: "等待验证",
    marketExpect: "CPO量产进展、Spectrum-X订单、AI Factory架构更新",
    verifyPoint: "CPO量产时间表是否明确、光器件供应链是否继续紧缺",
    impactPath: "若CPO路线确认加速，LITE/COHR的瓶颈溢价可能进一步提升",
    topPriority: true,
  },
  {
    date: "2026-06-中旬",
    title: "ASTS 三颗 BlueBird 卫星发射",
    type: "发射",
    stocks: "ASTS",
    importance: "高",
    status: "等待验证",
    marketExpect: "公司已确认6月中旬SpaceX Falcon 9发射窗口",
    verifyPoint: "发射是否成功、卫星部署节奏是否支持2026覆盖扩张预期",
    impactPath: "若发射成功并进入商业覆盖阶段，可能推动ASTS估值上修",
    topPriority: false,
  },
];

// 历史事件归档（已发生、含结果回顾）
const calendarHistory = [
  {
    date: "2026-06-10",
    title: "Oracle（ORCL）Q4 FY2026 财报（盘后）",
    type: "财报",
    stocks: "ORCL / AI云 / 企业IT",
    importance: "高",
    result: "营收$191.84亿（+21%）超预期，OCI +93%，RPO $6380亿。但CapEx暴增至$556亿，FCF转负，盘后跌-10%。市场重新定价AI基建重资产逻辑",
    verification: "需求端验证，但财务质量引发估值重估",
  },
  {
    date: "2026-06-11",
    title: "5月CPI（8:30 ET）",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY / SOX",
    importance: "极高",
    result: "同比+4.2%，符合预期。核心环比+0.2%，低于0.4-0.5%的担忧情形。能源驱动通胀而非经济过热。市场解读为'预防性去风险'后反弹",
    verification: "通胀确实回来但没有失控，第一颗雷拆除",
  },
  {
    date: "2026-06-12",
    title: "5月PPI",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY",
    importance: "中",
    result: "接力CPI数据，成本端通胀路径确认温和",
    verification: "PPI+CPI组合指向通胀可控",
  },
  {
    date: "2026-06-11",
    title: "SpaceX IPO 定价日",
    type: "IPO",
    stocks: "SPCX / RKLB / ASTS",
    importance: "极高",
    result: "定价$135/股，$1.77T估值，融资$750亿，史上最大IPO。超额认购倍数强劲",
    verification: "定价完全按预期执行",
  },
  {
    date: "2026-06-12",
    title: "SpaceX 上市首日（Nasdaq: SPCX）",
    type: "IPO",
    stocks: "SPCX / RKLB / ASTS / 太空概念",
    importance: "极高",
    result: "首日IPO $135→高$175→收$165（+22%）。但ASTS -15%/RKLB -10%，太空板块资金分流严重",
    verification: "SPCX大涨符合预期；ASTS/RKLB暴跌反映替代品被抛弃",
  },
];

// 近期最重要三件事（仅未来）
const topThree = [
  { date: "2026-06-16", title: "FOMC利率决议：点阵图决定Q3方向", stocks: "QQQ / 10Y" },
  { date: "2026-06-25", title: "MU财报 + GTC中国站：AI链核心验证日", stocks: "MU / NVDA / LITE / COHR" },
  { date: "2026-06-中旬", title: "ASTS BlueBird卫星发射", stocks: "ASTS" },
];
