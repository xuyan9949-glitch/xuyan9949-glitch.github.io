// ========================================
// 关键验证日历 — 2026年7月
// 最后核对: 2026-06-27
// ========================================

// certainty: "confirmed" | "estimated"
// 未来30天 + 整个7月（含7/28-31超出30天范围也纳入）

const calendarEvents = [
  // ─── 7月1日 ───
  {
    date: "2026-07-01",
    type: "会议",
    title: "ECB央行论坛政策圆桌 — 美联储/欧央行/英央行同场",
    stocks: "QQQ / 10Y / DXY / EURUSD",
    certainty: "confirmed",
    marketExpect: "主要央行负责人同场，市场重点捕捉对通胀、增长和政策分化的最新判断",
    verifyPoint: "美联储主席Warsh对通胀粘性和利率路径的表述；欧央行是否偏向增长或通胀风险",
    impactPath: "美联储偏鹰、欧洲偏鸽 → 美元及美债收益率上行，压制长久期科技估值",
    status: "等待验证",
  },

  // ─── 7月2日 ───
  {
    date: "2026-07-02",
    type: "宏观",
    title: "美国6月非农就业报告 — 重新定价FOMC 7月路径",
    stocks: "QQQ / 10Y / DXY / IWM",
    certainty: "confirmed",
    marketExpect: "判断美国经济是否仍保持较强韧性，修正7月FOMC利率预期",
    verifyPoint: "新增非农、失业率、平均时薪、劳动参与率、前月修正",
    impactPath: "就业工资过强 → 利率上行压力；温和降温 → 利好科技；快速恶化 → 衰退交易",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月3日 ───
  {
    date: "2026-07-03",
    type: "产品",
    title: "美国独立日补休，美股全天休市",
    stocks: "SPY / QQQ / 所有美股资产",
    certainty: "confirmed",
    marketExpect: "7/2为长周末前最后交易日，流动性下降",
    verifyPoint: "是否出现集中减仓、期权平仓或宏观对冲",
    impactPath: "成交量下降可能放大个股波动，不应把低流动性行情直接解读为基本面变化",
    status: "等待验证",
  },

  // ─── 7月4日 ───
  {
    date: "2026-07-04",
    type: "产品",
    title: "特朗普账户正式启动 — 建国250周年",
    stocks: "SPY / QQQ / 美国宽基指数基金",
    certainty: "confirmed",
    marketExpect: "账户可接收缴款，儿童开始获财政部$1,000试点资金",
    verifyPoint: "实际开户数量、资金到账节奏、企业配捐参与程度",
    impactPath: "长期有利于权益资产配置和指数化资金沉淀；短期买盘渐进形成，不宜按单日数百亿交易",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月8日 ───
  {
    date: "2026-07-08",
    type: "宏观",
    title: "美联储6月FOMC会议纪要",
    stocks: "QQQ / 10Y / DXY",
    certainty: "confirmed",
    marketExpect: "验证6月议息会议中委员真实分歧及点阵图背后讨论",
    verifyPoint: "对通胀风险的判断、加息/降息门槛、就业下行容忍度",
    impactPath: "偏鹰 → 美债收益率上行；多数更担忧就业 → 科技成长股获估值支撑",
    status: "等待验证",
  },

  // ─── 7月10日 ───
  {
    date: "2026-07-10",
    type: "订单",
    title: "台积电6月月度营收",
    stocks: "TSM / NVDA / AVGO / AMD / ASML / SOXX",
    certainty: "confirmed",
    marketExpect: "补齐Q2数据，判断是否达到公司指引上沿",
    verifyPoint: "月度营收同比/环比及Q2累计表现",
    impactPath: "超预期 → 强化先进制程/CoWoS/AI加速器逻辑；低预期需区分汇率与出货节奏",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月10日 ───
  {
    date: "2026-07-10",
    type: "IPO",
    title: "SK海力士ADR登陆纳斯达克",
    stocks: "SKHY / 000660.KS / DRAM / MU / ASML",
    certainty: "confirmed",
    marketExpect: "美股投资者获直接投资SK海力士渠道，存储估值重估窗口",
    verifyPoint: "发行价格、ADR换股比例、新股稀释、募资规模、首日成交量",
    impactPath: "定价强势 → 存储板块估值重估；超大发行可能短期吸收流动性",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月14日 ───
  {
    date: "2026-07-14",
    type: "宏观",
    title: "美国6月CPI",
    stocks: "QQQ / 10Y / DXY / 黄金 / 所有风险资产",
    certainty: "confirmed",
    marketExpect: "直接影响7月FOMC路径定价",
    verifyPoint: "核心CPI环比、住房通胀、核心服务、能源价格、关税传导",
    impactPath: "核心通胀加速 → 利空高估值科技；温和下降且就业未失速 → 软着陆理想组合",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月15日 ───
  {
    date: "2026-07-15",
    type: "宏观",
    title: "美国6月PPI + 美联储褐皮书",
    stocks: "QQQ / 10Y / DXY / 工业股",
    certainty: "confirmed",
    marketExpect: "PPI验证成本端压力，褐皮书提供FOMC前最后一轮区域经济信息",
    verifyPoint: "服务业PPI、生产成本传导；各地区招聘/工资/消费及企业提价能力",
    impactPath: "偏热 → 提升政策收紧风险；需求趋弱 → 压低收益率但需警惕盈利下修",
    status: "等待验证",
  },

  // ─── 7月15日 ───
  {
    date: "2026-07-15",
    type: "财报",
    title: "ASML 2026年Q2财报",
    stocks: "ASML / TSM / 000660.KS / AMAT / LRCX",
    certainty: "confirmed",
    marketExpect: "通过新增订单判断先进逻辑/HBM/DRAM扩产能否延续至2027后",
    verifyPoint: "新增订单、EUV出货、存储客户订单占比、中国收入、毛利率及全年指引",
    impactPath: "订单强劲 → AI资本开支向设备端扩散确认；低于预期需区分推迟验收与真实削减",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月16日 ───
  {
    date: "2026-07-16",
    type: "宏观",
    title: "美国6月零售销售",
    stocks: "AMZN / WMT / XLY / QQQ / 10Y",
    certainty: "confirmed",
    marketExpect: "判断消费是否继续支撑Q2经济增长",
    verifyPoint: "剔除汽车汽油后核心零售、控制组数据、可选消费和线上零售",
    impactPath: "消费强劲 → 利好收入但也可能推高收益率；转弱 → 不利零售板块",
    status: "等待验证",
  },

  // ─── 7月16日 ───
  {
    date: "2026-07-16",
    type: "财报",
    title: "台积电 2026年Q2财报及电话会",
    stocks: "TSM / NVDA / AVGO / AMD / AAPL / ASML / AI产业链",
    certainty: "confirmed",
    marketExpect: "Q2收入指引$390-402亿，毛利率65.5%-67.5%",
    verifyPoint: "AI/HPC收入增速、CoWoS产能、2nm进度、全年CapEx、毛利率持续性",
    impactPath: "指引上修 → GPU/ASIC/先进封装/PCB/光互联全链扩散；仅收入增而毛利率低于预期 → AI投资回报下降交易",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月16日 ───
  {
    date: "2026-07-16",
    type: "财报",
    title: "Netflix 2026年Q2财报",
    stocks: "NFLX / GOOGL / META / AMZN",
    certainty: "confirmed",
    marketExpect: "验证广告业务和订阅变现能否继续推动利润率改善",
    verifyPoint: "收入增速、营业利润率、广告套餐增长、用户参与度、下季度指引",
    impactPath: "强劲广告和利润率 → 互联网平台估值支撑；增长靠提价而参与度下降 → 增长质量质疑",
    status: "等待验证",
  },

  // ─── 7月23日 ───
  {
    date: "2026-07-23",
    type: "宏观",
    title: "欧洲央行利率决议及新闻发布会",
    stocks: "EURUSD / DXY / 10Y / QQQ",
    certainty: "confirmed",
    marketExpect: "判断欧央行在增长放缓、能源价格和通胀风险之间的取舍",
    verifyPoint: "利率决定、拉加德后续路径表述、工资和服务通胀判断",
    impactPath: "偏鸽 → 压低欧元推高美元 → 美股跨国公司收入折算及高估值资产承压",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月28-29日 ───
  {
    date: "2026-07-28",
    type: "宏观",
    title: "美联储7月FOMC利率决议及新闻发布会 (7/28-29)",
    stocks: "QQQ / 10Y / DXY / 黄金 / 所有风险资产",
    certainty: "confirmed",
    marketExpect: "7月最重要单一宏观事件，结合非农/CPI/PPI/零售重新判断政策方向",
    verifyPoint: "利率决定、声明措辞、委员投票分歧、Warsh对通胀和就业风险的权重",
    impactPath: "偏鹰 → 推升实际利率压缩科技估值；偏鸽但源于经济恶化 → 未必持续利好",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月30日 ───
  {
    date: "2026-07-30",
    type: "宏观",
    title: "美国Q2 GDP初值 + 6月PCE通胀",
    stocks: "QQQ / 10Y / DXY / IWM / 黄金",
    certainty: "confirmed",
    marketExpect: "同日公布经济增长与核心通胀指标，月末最重要数据组合",
    verifyPoint: "GDP增长结构、核心PCE环比/同比、服务通胀、个人收入支出",
    impactPath: "增长强通胀高→利率上行；增长稳通胀降→最利风险资产；增长弱通胀高→滞胀；双降→先交易降息后关注盈利下修",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月30-31日 ───
  {
    date: "2026-07-30",
    type: "宏观",
    title: "英国央行利率决议 (7/30) + 日本央行利率决议 (7/30-31)",
    stocks: "USDJPY / GBPUSD / 日经 / 美债 / QQQ",
    certainty: "confirmed",
    marketExpect: "日本央行是否调整利率或购债政策；英央行通胀与增长预测",
    verifyPoint: "日银利率决定、经济展望、工资通胀和日元判断",
    impactPath: "日银超预期收紧 → 日元升值+套息交易平仓 → 对高杠杆高估值资产影响更大",
    topPriority: true,
    status: "等待验证",
  },

  // ─── 7月31日 ───
  {
    date: "2026-07-31",
    type: "宏观",
    title: "美国Q2就业成本指数ECI",
    stocks: "10Y / DXY / QQQ",
    certainty: "confirmed",
    marketExpect: "观察工资和福利成本的低噪声指标",
    verifyPoint: "私营部门工资、福利成本及季度环比变化",
    impactPath: "加速 → 提高长期利率中枢；温和下降 → 缓解工资—服务通胀压力",
    status: "等待验证",
  },

  // ─── 待官宣：大科技财报 ───
  {
    date: "2026-07-22",
    type: "财报",
    title: "Tesla Q2交付与Alphabet财报（预计窗口）",
    stocks: "TSLA / GOOGL / 汽车 / 云计算",
    certainty: "estimated",
    marketExpect: "Robotaxi/汽车利润；云计算、AI搜索、CapEx",
    verifyPoint: "官宣日期后更新",
    impactPath: "待确认日期后分析",
    status: "等待验证",
  },
  {
    date: "2026-07-29",
    type: "财报",
    title: "Microsoft + Meta 财报（预计窗口）",
    stocks: "MSFT / META / Azure / AI收入",
    certainty: "estimated",
    marketExpect: "Azure AI收入、广告增长、AI CapEx与折旧",
    verifyPoint: "官宣日期后更新",
    impactPath: "待确认日期后分析",
    status: "等待验证",
  },
  {
    date: "2026-07-30",
    type: "财报",
    title: "Apple + Amazon 财报（预计窗口）",
    stocks: "AAPL / AMZN / 存储成本 / AWS",
    certainty: "estimated",
    marketExpect: "存储成本、iPhone需求；AWS AI收入、CapEx与利润率",
    verifyPoint: "官宣日期后更新",
    impactPath: "待确认日期后分析",
    status: "等待验证",
  },
  {
    date: "2026-07-下旬",
    type: "财报",
    title: "Intel、三星电子完整财报、SK海力士完整财报（预计窗口）",
    stocks: "INTC / 005930.KS / SKHY / 存储",
    certainty: "estimated",
    marketExpect: "晶圆代工、服务器CPU；HBM/DRAM供需与扩产",
    verifyPoint: "官宣日期后更新",
    impactPath: "待确认日期后分析",
    status: "等待验证",
  },
];

// ─── 2026年下半年补充日程 ───
// confirmed 仅表示机构已公布日期；estimated 表示仍需等公司正式确认。
calendarEvents.push(
  {
    id: "fomc-2026-09",
    date: "2026-09-15",
    dateLabel: "9月15–16日",
    type: "会议",
    title: "美联储9月FOMC会议及新闻发布会",
    stocks: "QQQ / 10Y / DXY / 黄金",
    certainty: "confirmed",
    marketExpect: "市场关注利率决定、经济预测和主席发布会对年内降息路径的重新定价。",
    verifyPoint: "利率决定、点阵图、通胀与就业风险权重，以及声明措辞是否变化。",
    impactPath: "偏鹰可能抬升实际利率并压缩成长股估值；偏鸽但若源于经济走弱，则需要同时观察盈利预期。",
    status: "待跟踪",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
  },
  {
    id: "nvda-fy27-q2-earnings",
    date: "2026-08-26",
    type: "财报",
    title: "NVIDIA FY2027 Q2 财报及电话会",
    stocks: "NVDA / AMD / AVGO / TSM / MU",
    certainty: "confirmed",
    marketExpect: "验证Blackwell交付、数据中心需求和下一代Rubin平台预期是否继续上修。",
    verifyPoint: "数据中心收入、毛利率、下一季度指引、客户集中度和资本开支传导。",
    impactPath: "收入与指引上修会强化AI基础设施主线；若收入强但毛利率或订单质量走弱，市场可能交易回报率拐点。",
    status: "已发生 · 待补复盘",
    sourceUrl: "https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Sets-Conference-Call-for-Second-Quarter-Financial-Results/",
  },
  {
    id: "fomc-2026-10",
    date: "2026-10-27",
    dateLabel: "10月27–28日",
    type: "会议",
    title: "美联储10月FOMC会议及新闻发布会",
    stocks: "QQQ / 10Y / DXY / 黄金",
    certainty: "confirmed",
    marketExpect: "观察9月决策后的数据变化，重新判断年末利率中枢和科技股估值空间。",
    verifyPoint: "政策声明、新闻发布会、就业与通胀判断，以及市场隐含的年末利率路径。",
    impactPath: "政策路径越明确，久期资产波动越可能收敛；意外转向会先影响利率，再扩散到高估值科技。",
    status: "待跟踪",
    sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
  },
  {
    id: "nvda-fy27-q3-earnings-estimated",
    date: "2026-11-18",
    dateLabel: "预计 11月18日",
    type: "财报",
    title: "NVIDIA FY2027 Q3 财报（预计日期）",
    stocks: "NVDA / AMD / AVGO / TSM / MU",
    certainty: "estimated",
    marketExpect: "继续观察Rubin切换、AI集群订单和客户资本开支能否兑现为收入与利润。",
    verifyPoint: "以NVIDIA正式公告为准，届时更新财报日期、指引与电话会重点。",
    impactPath: "真正重要的是订单可见度与毛利率持续性，而不是单季收入是否再次创纪录。",
    status: "预计 · 待确认",
    sourceUrl: "https://investor.nvidia.com/events-and-presentations/",
  },
  {
    id: "us-columbus-day-2026",
    date: "2026-10-12",
    type: "节日",
    title: "美国哥伦布日 / 原住民人民日",
    stocks: "NYSE / Nasdaq",
    certainty: "confirmed",
    marketExpect: "美股正常交易，但银行和部分美国机构休假，宏观数据与企业沟通节奏可能变化。",
    verifyPoint: "确认交易所是否开市，以及当周重要数据发布时间是否调整。",
    impactPath: "节日本身不是基本面催化剂，主要影响流动性、数据发布节奏和跨机构沟通。",
    status: "市场日历",
    sourceUrl: "https://www.nyse.com/markets/hours-calendars",
  },
  {
    id: "us-veterans-day-2026",
    date: "2026-11-11",
    type: "节日",
    title: "美国退伍军人节",
    stocks: "NYSE / Nasdaq",
    certainty: "confirmed",
    marketExpect: "美股正常交易，部分美国金融机构休假。",
    verifyPoint: "确认交易所开市状态及重要数据发布时间。",
    impactPath: "主要作为交易安排提醒，不作为投资逻辑本身。",
    status: "市场日历",
    sourceUrl: "https://www.nyse.com/markets/hours-calendars",
  },
  {
    id: "us-thanksgiving-2026",
    date: "2026-11-26",
    type: "节日",
    title: "美国感恩节，美股休市",
    stocks: "NYSE / Nasdaq",
    certainty: "confirmed",
    marketExpect: "美股休市，次日为感恩节后的缩短交易日。",
    verifyPoint: "留意11月27日提前收市及假期前后的成交量变化。",
    impactPath: "假期前后流动性下降，个股波动可能被放大，不宜把低成交量误判为趋势确认。",
    status: "市场日历",
    sourceUrl: "https://www.nyse.com/markets/hours-calendars",
  },
  {
    id: "us-christmas-2026",
    date: "2026-12-25",
    type: "节日",
    title: "圣诞节，美股休市",
    stocks: "NYSE / Nasdaq",
    certainty: "confirmed",
    marketExpect: "美股休市，年底交易进入低流动性阶段。",
    verifyPoint: "确认年末最后交易日与提前收市安排。",
    impactPath: "节日影响交易节奏而非基本面，适合做年度复盘和下一年事件清单整理。",
    status: "市场日历",
    sourceUrl: "https://www.nyse.com/markets/hours-calendars",
  },
);

// ─── 顶部关键锚点（六大事件） ───
const topThree = [
  { date: "2026-07-02", title: "美国6月非农：重新定价美联储7月路径", stocks: "QQQ / 10Y / DXY / IWM" },
  { date: "2026-07-10", title: "台积电月营收 + SK海力士美股上市：AI存储核心验证日", stocks: "TSM / SKHY / MU / DRAM / ASML" },
  { date: "2026-07-14-16", title: "CPI + PPI + ASML + 台积电 + Netflix 密集发布", stocks: "QQQ / SOXX / NVDA / ASML / TSM" },
  { date: "2026-07-23", title: "欧洲央行利率决议：全球利率与美元方向验证", stocks: "EURUSD / DXY / 10Y" },
  { date: "2026-07-28-31", title: "FOMC + GDP/PCE + 英日央行：月末超级宏观周", stocks: "QQQ / 10Y / DXY / USDJPY" },
  { date: "2026-07-下旬", title: "美股大科技财报周（时间待官宣）", stocks: "TSLA / GOOGL / MSFT / META / AAPL / AMZN  "},
];

// ─── 历史事件归档 ───
const calendarHistory = [
  {
    date: "2026-06-25",
    title: "美光（MU）FY2026 Q3 财报",
    type: "财报",
    stocks: "MU / DRAM / HBM",
    result: "系统性超预期：DRAM/NAND价格涨幅远超预期，五年期战略客户协议重塑商业模式。毛利率84.9%",
    verification: "仓位逻辑验证，存储超级周期确认",
  },
  {
    date: "2026-06-16",
    title: "FOMC 利率决议（6月·含新闻发布会）",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY",
    result: "维持利率不变，点阵图未暗示降息路径，偏鹰表态打压科技股估值",
    verification: "验证偏鹰，后续关注非农和CPI数据",
  },
  {
    date: "2026-06-11",
    title: "5月CPI",
    type: "宏观",
    stocks: "QQQ / 10Y / DXY",
    result: "同比+4.2%符合预期，核心环比+0.2%低于担忧情形，能源驱动而非经济过热",
    verification: "通胀回来但没有失控，核心雷拆除",
  },
  {
    date: "2026-06-11",
    title: "SpaceX IPO 定价（Nasdaq: SPCX）",
    type: "IPO",
    stocks: "SPCX / RKLB / ASTS",
    result: "定价$135/股，$1.77T估值，史上最大IPO。首日+22%但RKLB/ASTS暴跌",
    verification: "SPCX定价与首日符合预期；太空板块资金分流明显",
  },
];
