// ========================================
// 逻辑验证日历 — 月度聚焦
// 规则：只保留未来 30 天内有明确时间锚点的催化事件
// 虚的（Q3/H1/下旬无日期、验证描述）不入库
// ========================================

const calendarEvents = [
  {
    date: "2026-06-12",
    title: "SpaceX IPO 上市",
    type: "IPO",
    stocks: "SpaceX / RKLB / ASTS / 太空概念",
    importance: "极高",
    status: "等待验证",
    marketExpect: "传闻6月12日上市，SpaceX估值或超3000亿美元",
    verifyPoint: "上市日期是否确认、发行定价、市场反应",
    impactPath: "若成功上市，可能重塑太空经济板块估值体系，RKLB/ASTS或面临比价压力或联动上涨",
    topPriority: true,
  },
  {
    date: "2026-06-16",
    title: "FOMC 利率决议（6月会议·含新闻发布会）",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY / 所有风险资产",
    importance: "极高",
    status: "等待验证",
    marketExpect: "市场Price in维持利率不变，关注点阵图和鲍威尔讲话",
    verifyPoint: "点阵图是否暗示下半年降息路径、通胀预期是否上调、经济预测摘要",
    impactPath: "若释放降息信号，科技成长股（NVDA/AVGO/LITE/AAOI）可能反弹；若偏鹰，继续压制估值",
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
    impactPath: "若指引上修，可能带动存储设备（AMAT/LRCX）与A股材料链扩散",
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

// 近期最重要三件事
const topThree = [
  { date: "2026-06-12", title: "SpaceX IPO上市：太空板块估值重塑", stocks: "SpaceX / RKLB / ASTS" },
  { date: "2026-06-16", title: "FOMC利率决议：点阵图决定Q3方向", stocks: "QQQ / 10Y" },
  { date: "2026-06-25", title: "MU财报 + GTC中国站：AI链核心验证日", stocks: "MU / NVDA / LITE / COHR" },
];
