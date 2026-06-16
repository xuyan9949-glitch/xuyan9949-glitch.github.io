// ========================================
// 产业图示 — 图片数据（按分类存放）
// 手动维护，按需添加
// ========================================

const diagrams = [
  // === 存储 ===
  { file: "industry-map-01.jpg", title: "AI存储产业链：钱到底流向哪里？", category: "存储", dir: "存储" },
  { file: "industry-map-02.jpg", title: "AI服务器存储层级图", category: "存储", dir: "存储" },
  { file: "industry-map-03.jpg", title: "为什么AI芯片离不开HBM？", category: "存储", dir: "存储" },
  { file: "industry-map-04.jpg", title: "HBM解剖：3D堆叠是怎么回事？", category: "存储", dir: "存储" },
  { file: "industry-map-05.jpg", title: "CoWoS先进封装：AI GPU出货的关键瓶颈", category: "存储", dir: "存储" },
  { file: "industry-map-06.jpg", title: "AI存储扩产受益链：设备商订单能见度提升", category: "存储", dir: "存储" },
  { file: "industry-map-07.jpg", title: "存储周期四阶段：涨价、扩产、过剩、减产", category: "存储", dir: "存储" },
  { file: "industry-map-08.jpg", title: "2026存储四条主线：HBM、涨价周期、设备商、CXL", category: "存储", dir: "存储" },
  { file: "industry-map-09.jpg", title: "HBM三强格局：SK海力士为什么领先？", category: "存储", dir: "存储" },
  // === 光 ===
  { file: "industry-map-10.jpg", title: "光模块到底是什么？", category: "光", dir: "光" },
  { file: "industry-map-11.jpg", title: "AI集群为什么需要光模块？", category: "光", dir: "光" },
  { file: "industry-map-12.jpg", title: "光模块供应链看什么？", category: "光", dir: "光" },
  { file: "industry-map-13.jpg", title: "光模块未来往哪走？", category: "光", dir: "光" },
  // === PCB / 电子材料 ===
  { file: "pcb-market-cap.png", title: "PCB及载板市值空间测算（天风电新0614）", category: "PCB", dir: "pcb" },
  // === 日历 ===
  { file: "june-calendar-part1.webp", title: "6月重点投资日历（上）", category: "日历", dir: "日历" },
  { file: "june-calendar-part2.webp", title: "6月重点投资日历（下）", category: "日历", dir: "日历" },

  // === 光新增（CPO/硅光系列） ===
  { file: "01-cpo-guide.jpg", title: "01 图解CPO", category: "光", dir: "光" },
  { file: "02-optical-engine-guide.jpg", title: "02 图解光引擎", category: "光", dir: "光" },
  { file: "03-silicon-photonics-guide.jpg", title: "03 图解硅光", category: "光", dir: "光" },
  { file: "04-silicon-doesnt-emit-light.jpg", title: "04 硅自己不发光，那光从哪来", category: "光", dir: "光" },
  { file: "05-electricity-to-light.jpg", title: "05 把电变成光，怎么实现", category: "光", dir: "光" },
  { file: "06-cpo-fiber-alignment.jpg", title: "06 CPO最难一步：把光纤对准到0.5微米", category: "光", dir: "光" },
  { file: "07-cpo-vs-pluggable.jpg", title: "07 了解完CPO：可插拔的龙头会被颠覆吗", category: "光", dir: "光" },
  { file: "08-cpo-timeline.jpg", title: "08 CPO渗透时间节奏", category: "光", dir: "光" },
  { file: "09-cpo-full-overview.jpg", title: "09 一张图看全CPO", category: "光", dir: "光" },
  // === 电源 ===

  { file: "800v-power-system.jpg", title: "图解800V电源系统", category: "电源", dir: "电源" },
  { file: "from-grid-to-gpu.jpg", title: "跟着电走一遍：从电网到GPU", category: "电源", dir: "电源" },
  { file: "sic-vs-gan.jpg", title: "高压靠SiC，高频靠GaN", category: "电源", dir: "电源" },
  { file: "capacitor-types.jpg", title: "同样叫电容，一个当水库一个当水杯", category: "电源", dir: "电源" },
  { file: "magnetic-materials.jpg", title: "磁芯是料，电感是用料绕成的成品", category: "电源", dir: "电源" },
  { file: "power-backup-hierarchy.jpg", title: "砍了UPS，靠三层电接力不断电", category: "电源", dir: "电源" },
  { file: "voltage-evolution.jpg", title: "12V→48V→800V", category: "电源", dir: "电源" },
  { file: "800v-investment-map.jpg", title: "同样喊800V，谁在吃业绩、谁在讲故事", category: "电源", dir: "电源" },
  // === 组合 ===
  { file: "portfolio-0617.png", title: "AI主线核心组合（基础参考版）6.17", category: "组合", dir: "组合" },
];

