const articles = [
  {
    id: "industry-glossary-2026",
    title: "AI产业术语全解：从CPO到TGV的23个核心概念",
    date: "2026-06-02",
    category: "产业思考",
    subcategory: "光通信",
    tags: ["光通信", "产业链", "AI", "先进封装"],
    summary: "按'它是什么→产业链位置→投资含义'拆解CPO、NPO、PD、OCS、DSP、EML、CW Laser、FAU、TIA、Driver、SerDes、硅光、轻相干、AEC、CoWoS、TGV、Interposer、Glass Core、ABF等23个核心概念。",
    keywords: "CPO NPO PD OCS DSP EML CW Laser FAU TIA Driver SerDes 硅光 轻相干 AEC Scale-up Scale-out CoWoS TGV Interposer Glass Core ABF 光互连 先进封装",
    file: "/articles/industry-glossary-2026/"
  },
  {
    id: "investment-framework",
    title: "投资框架笔记",
    date: "2026-05-28",
    category: "产业思考",
    pinned: true,
    tags: ["框架", "A股", "美股"],
    summary: "底层信念、Follow the Money、三类钱框架、买卖点、A股轮动规律——投资的完整思维模型。",
    keywords: "投资框架 方法论 底层信念 三类资产 买卖点 轮动 Follow the Money 产业链",
    file: "/articles/investment-framework/"
  },
  {
    id: "server-bom-analysis",
    title: "AI服务器代际升级BOM分析",
    date: "2026-05-21",
    category: "美股",
    tags: ["AI", "产业链", "美股"],
    summary: "从GB300到VR200——AI服务器单柜BOM成本+95%，HBM增+435%，PCB增+233%，系统级价值量全面升级。",
    keywords: "AI服务器 BOM GB300 VR200 HBM PCB 代际升级 价值量 英伟达 NVIDIA 供应链",
    file: "/articles/server-bom-analysis/"
  },
  {
    id: "ai-nuclear-chain",
    title: "AI核电全产业链拆解",
    date: "2026-05-27",
    category: "美股",
    tags: ["AI", "产业链", "美股"],
    summary: "从铀矿到SMR到核电运营商——AI数据中心电力需求驱动核电价值重估。LEU逻辑最硬，CEG最稳，OKLO彩票最高。",
    keywords: "核电 AI电力 SMR 铀矿 LEU CEG OKLO VST 数据中心 能源",
    file: "/articles/ai-nuclear-chain/"
  },
  {
    id: "a-share-rules",
    title: "A股市场定价规则",
    date: "2026-05-25",
    category: "A股",
    tags: ["A股", "框架"],
    summary: "叙事弹性、题材节奏、估值潜规则、产业链轮动——A股21条不成文的市场定价规则。",
    keywords: "A股 规则 叙事弹性 题材 估值 游资 公募 轮动 龙一 龙二",
    file: "/articles/a-share-rules/"
  },
  {
    id: "ai-industry-profit-chain",
    title: "AI产业链收益排序分析",
    date: "2026-05-25",
    category: "产业思考",
    tags: ["AI", "产业链", "A股"],
    summary: "利润兑现、卡脖子、受益时序、A股弹性——四维度拆解AI基础设施链条的投资顺序。",
    keywords: "AI产业链 收益排序 卡脖子 GPU HBM CoWoS 光模块 电力 液冷 存储",
    file: "/articles/ai-industry-profit-chain/"
  },
  {
    id: "asia-market-correlation",
    title: "亚盘四国联动分析",
    date: "2026-05-28",
    category: "A股",
    tags: ["复盘", "A股"],
    summary: "上证 vs KOSPI vs 日经 vs 台股——85%方向同步率背后的幅度差异与A股独立性。",
    keywords: "亚盘 联动 上证 KOSPI 日经 台股 韩国 日本 台湾 A股 复盘",
    file: "/articles/asia-market-correlation/"
  },
  {
    id: "a-share-framework",
    title: "A股炒作传导逻辑框架",
    date: "2026-05-29",
    category: "A股",
    tags: ["A股", "框架"],
    summary: "龙一→龙二→细分瓶颈→低位补涨→参股蹭概念→退潮——A股题材炒作从启动到退潮的完整传导路径与判断框架。",
    keywords: "A股炒作 传导 龙一 龙二 补涨 瓶颈 参股 蹭概念 退潮 情绪 题材 轮动",
    file: "/articles/a-share-framework/"
  },
  {
    id: "a-share-optical-mapping",
    title: "AI光通信下一层瓶颈：从光模块到EML、InP与互联芯片",
    date: "2026-05-28",
    category: "A股",
    tags: ["A股", "光通信"],
    summary: "A股光通信五层映射模型——从EML/激光器到InP衬底到互联芯片到平台型到模块龙头，三种排序框架（瓶颈/确定性/弹性）。",
    keywords: "光通信 EML InP 互联芯片 源杰科技 澜起科技 中际旭创 新易盛 光模块 LITE AXTI MRVL",
    file: "/articles/a-share-optical-mapping/"
  },
  {
    id: "dongshan-clarification",
    title: "东山精密：市场传言澄清与核心基本面梳理",
    date: "2026-06-01",
    category: "A股",
    tags: ["A股", "东山精密"],
    summary: "针对网络三条谣言的逐一澄清——收购审批已全部通关、实控人正常履职、港股上市独立推进。光芯片产能22KK→28KK/月，AWS/Oracle/Meta订单落地。",
    file: "/articles/dongshan-clarification/"
  },
  {
    id: "gtc-taipei-2026",
    title: "英伟达台北 GTC 2026：AI 投资从'买 GPU'进入'建 AI 工厂'",
    date: "2026-06-01",
    category: "近期热点",
    tags: ["美股", "AI", "产业链"],
    summary: "Vera Rubin量产爬坡、Spectrum-X CPO光互联方案、AI Factory BOM价值量重估——台北GTC确认AI投资从买GPU进入建AI工厂阶段。",
    file: "/articles/gtc-taipei-2026/"
  },
  {
    id: "june-market-outlook",
    title: "六月行情展望：不是简单看多看空，而是进入'产业约束筛选月'",
    date: "2026-05-31",
    category: "近期热点",
    tags: ["美股", "A股", "AI"],
    pinned: true,
    summary: "世界杯注意力折价、巨型IPO再平衡、FOMC利率定价、AI硬件扩散——六月不是简单看多看空，而是产业约束筛选月。",
    keywords: "六月 行情 展望 世界杯 FOMC SpaceX IPO 长鑫 产业约束 光互联 HBM PCB 瓶颈",
    file: "/articles/june-market-outlook/"
  },
  {
    id: "ai-pcb-hvlp-copper-foil",
    title: "AI PCB 上游材料扩散：HVLP 铜箔正在成为新一轮瓶颈",
    date: "2026-05-31",
    category: "A股",
    tags: ["A股", "产业链"],
    summary: "AI服务器高速互联推动PCB材料体系整体升级——从HVLP4/5铜箔到电子布、硅微粉、mSAP药水，资金从PCB龙头扩散到上游瓶颈环节。",
    keywords: "PCB HVLP 铜箔 铜冠铜箔 德福科技 生益科技 CCL 电子布 硅微粉 mSAP 泰金新能 三孚新科",
    file: "/articles/ai-pcb-hvlp-copper-foil/"
  },
  {
    id: "daodejing-chapter-3",
    title: "《道德经》第三章：少一点刺激，心就不容易乱",
    date: "2026-05-31",
    category: "学点道德经",
    tags: ["学点道德经"],
    summary: "少一点外界的刺激，心就少一点混乱；多一点真实的根基，人就多一点安定。人不是靠更多刺激变清醒，而是靠减少刺激恢复清醒。",
    keywords: "道德经 第三章 欲望 刺激 比较 焦虑 投资 心态 降噪",
    file: "/articles/daodejing-chapter-3/"
  },
  {
    id: "space-sector-analysis",
    title: "SpaceX估值下修、Blue Origin事故，对太空股到底意味着什么？",
    date: "2026-05-30",
    category: "近期热点",
    tags: ["航天", "美股"],
    summary: "SpaceX估值锚从2万亿下修到1.8万亿，Blue Origin事故影响发射排期——12个Q&A拆解太空股调整的本质：从主题行情进入兑现行情。",
    keywords: "SpaceX Blue Origin ASTS RKLB 太空 航天 IPO 估值 发射 New Glenn 卫星 商业航天",
    file: "/articles/space-sector-analysis/"
  },
  {
    id: "daodejing-chapter-2",
    title: "《道德经》第二章：不要在比较里失去自己",
    date: "2026-05-29",
    category: "学点道德经",
    tags: ["学点道德经"],
    summary: "比较可以帮助我们认识差异，但执着于比较，会让人失去自己。知道世界有高下，但心不必随之倾斜。",
    keywords: "道德经 第二章 比较 无为 功成弗居 投资 心态",
    file: "/articles/daodejing-chapter-2/"
  },
  {
    id: "daodejing-chapter-1",
    title: "《道德经》第一章：不要急着给世界命名",
    date: "2026-05-29",
    category: "学点道德经",
    tags: ["学点道德经"],
    summary: "不要急着给世界命名，也不要被自己起的名字困住。世界比我们的判断更大，人生比某个阶段更长，市场也比任何一个故事更复杂。",
    keywords: "道德经 第一章 道 名 命名 投资 认知 标签 判断",
    file: "/articles/daodejing-chapter-1/"
  },
  {
    id: "eml-bottleneck",
    title: "EML涨价背后：AI光通信产业链的真实瓶颈正在上移",
    date: "2026-05-28",
    category: "产业思考",
    subcategory: "光通信",
    tags: ["光通信", "产业链", "AI"],
    summary: "EML涨价、交期拉长、InP产能紧张——AI光通信瓶颈从光模块上移至光芯片，LITE/COHR最直接受益，国产替代有窗口但需验证。",
    keywords: "EML InP 光通信 激光器 LITE COHR 源杰科技 长光华芯 光模块 涨价 瓶颈 AXTI 磷化铟",
    file: "/articles/eml-bottleneck/"
  },
  {
    id: "inp-industry-chain",
    title: "InP（磷化铟）产业链全景",
    date: "2026-05-28",
    category: "产业思考",
    subcategory: "光通信",
    tags: ["产业链", "AI"],
    summary: "从衬底到光模块到AI数据中心——InP是AI光通信最上游的\"卖水人\"。",
    keywords: "InP 磷化铟 衬底 光通信 EML 激光器 LITE COHR AXTI 6英寸 外延 光模块",
    file: "/articles/inp-industry-chain/"
  }
];
