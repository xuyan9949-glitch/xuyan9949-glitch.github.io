// ========================================
// 逻辑验证日历 — 月度聚焦
// 规则：只保留未来 30 天内、有明确时间锚点的事件
// 虚的（Q3/H1/中旬无日期）不入库
// ========================================

const calendarEvents = [
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
  { date: "2026-06-25", title: "MU财报：HBM与DRAM涨价弹性验证", stocks: "MU / DRAM" },
  { date: "2026-06-25", title: "NVIDIA GTC中国站：CPO与AI Factory线索", stocks: "NVDA / LITE / COHR" },
  { date: "2026-06中旬", title: "ASTS发射：卫星部署节奏验证", stocks: "ASTS" },
];
