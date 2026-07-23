// ============================================================
//  Level 3 — Electrical Station 完整世界书
// ============================================================

import type { LevelWorldBook } from '../../worldbook/levelWorldBook';

export const LEVEL_3_WORLD_BOOK: LevelWorldBook = {
  levelId: 'level-3',
  levelName: 'Electrical Station — 变电站',
  meta: {
    survivalClass: 'Class 4',
    atmosphere: ['brick walls', 'cables', 'electrical hum', 'ozone', 'sparks', 'machinery'],
    entityIds: ['entity-3-1', 'entity-3-2', 'entity-9'],
    itemIds: ['object-1', 'object-7', 'object-15'],
    exitTo: ['level-2'],
  },
  entries: [
    // ─── 常驻：氛围描写 ───
    {
      id: -1,
      uid: 'level-3-atmosphere',
      comment: '[level-3] 氛围描写',
      content: `## 当前环境：Level 3 — Electrical Station（变电站）

你站在一个巨大的、古老的电气设施内部。这里被称为"变电站"——据说它在为整个后室提供电力。

**视觉**：墙壁是用旧红砖砌成的，颜色深浅不一，有些地方被烟熏成了黑色。地面是积满灰尘的混凝土板，上面有无数脚印——有些是鞋子留下的，有些不像。天花板是金属的，上面悬挂着锈蚀的配电箱和乱成一团的电缆。电缆从天花板垂下来、从墙壁里伸出来、从地板下钻出来——它们无处不在。应急灯以3-5秒为周期闪烁，每次闪烁间有短暂的黑暗。远处有微弱的电火花在闪烁，像萤火虫一样点缀在黑暗中。

**听觉**：低沉的电嗡鸣是所有声音的底色，像一座巨大的变压器永不停止地工作。电火花噼啪声此起彼伏。远处机器的运转声、齿轮的转动声、继电器的咔嗒声交织在一起。偶尔会有一种低沉的、像是呼吸声的声响——但那不是机器发出的。

**嗅觉**：臭氧的气味刺鼻而尖锐——这是电火花电离空气的味道。混着绝缘橡胶烧焦的焦糊味，以及干燥灰尘的土腥味。偶尔有一股类似铜锈的金属味，让你感到牙齿发酸。

**触觉**：空气温暖而干燥，和Level 2的湿热形成鲜明对比。地面有些地方在震动——那是地下机器运转的震动。有些墙壁是微热的——那是墙内电缆发出的热量。

**感觉**：这里的能量几乎是有形的——你能感受到空气中电荷的刺痛感。头发可能会因为静电而竖起。这个层级在告诉你一个事实：这里的电力足以杀死你一百次。小心移动。`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'before_char',
      insertionOrder: 10,
      order: 10,
    },

    // ─── 常驻：层级规则 ───
    {
      id: -2,
      uid: 'level-3-rules',
      comment: '[level-3] 层级规则',
      content: `## Level 3 已知规则

变电站是后室中最危险的层级之一，也是资源最丰富的层级之一。以下是必须遵守的规则：

- **不要触碰裸露的电线。** 接触会导致电击、瘫痪、甚至死亡。即使看起来没有通电的电线，也可能突然来电流。
- **灯光闪烁频率加快意味着危险正在靠近。** 这个层级的应急灯闪烁频率似乎与实体活动有关。当闪烁变快时，找地方躲起来。
- **配电柜中可能藏有物资，但打开前先听一听。** 有些配电柜是实体藏身的地方。先敲两下门，如果有回应，立即离开。
- **绝对不要相信穿着维修服的人。** 这个层级中的"工作人员"不是人类。它们的领口没有影子、它们的脚步没有声音、它们不需要呼吸。
- **如果听到身后有脚步声但回头看不到人，不要停。** 加快脚步，不要跑——跑了就会被追。
- **窗户外面什么都没有。** 如果你看到窗户，可以往窗外看——但只有灰色的云和无尽的虚空。不要试图打开窗户。`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 20,
      order: 20,
    },

    // ─── 常驻：出口条件 ───
    {
      id: -3,
      uid: 'level-3-exits',
      comment: '[level-3] 出口/切出条件',
      content: `## Level 3 出口

- → Level 2：找到向下走的维护楼梯。楼梯通常位于变电站的边缘区域，沿着墙壁可以找到。

**切出描写指引**：
- 从Level 3离开时，空气会从干燥变得潮湿，电嗡鸣会被蒸汽嘶嘶替代
- 出口通常是一个下行的楼梯或打开的维护井盖`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 30,
      order: 30,
    },

    // ─── 关键词触发：实体 — 窃皮者 ───
    {
      id: -100,
      uid: 'level-3-entity-skin-stealer',
      comment: '[level-3] 实体: 窃皮者',
      content: `### 实体：窃皮者（Skin-Stealers）

窃皮者是Level 3中最危险的实体之一。它们会模仿人类的形态——穿着维修工的旧工作服，戴着安全帽，看起来就像普通的工程师在检查设备。

**如何识别**：
- 它们的脸部表情是固定的——不是僵硬，而是一种"不太对劲"的生动
- 它们没有呼吸起伏——不管站得多近，你都看不到胸口的起伏
- 它们的脚步声非常轻——轻到几乎听不见，即使在满是碎石的地面上
- 它们会发出声音来引诱你——设备故障的声音、工具掉落的声音、甚至求救声

**应对方法**：
- 如果看到有人影，先观察几秒钟——确认有呼吸
- 不要背对着它们
- 如果它开始朝你走来，慢慢后退，保持目光接触
- 它们不喜欢被直视——长时间的直视可能会让它迟疑`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['窃皮者', '维修工', '工作人员', '工人', '人影', '安全帽', '工作服', 'stealer'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 50,
      order: 50,
    },

    // ─── 关键词触发：实体 — 无面灵群 ───
    {
      id: -101,
      uid: 'level-3-entity-faceling-swarm',
      comment: '[level-3] 实体: 无面灵群',
      content: `### 实体：无面灵群（Faceling Swarms）

无面灵在Level 3中成群出现，比单体的Facelings更具威胁。

它们的外表像普通人的轮廓——身高、体型、穿着都正常——但它们的脸是空白的。没有眼睛、没有鼻子、没有嘴巴。只是一块光滑的皮肤。

**行为模式**：
- 通常3-8个一组，无声地在走廊里移动
- 它们不主动寻找猎物——它们只是"存在"在某个区域
- 但如果你闯入它们的空间（约5米内），它们会集体转向你
- 然后发出高频尖啸——刺入耳膜，让你耳鸣、头晕、恶心
- 在尖啸声中，它们会围拢过来

**应对方法**：
- 注意走廊的尽头——如果看到一群模糊的黑影，不要靠近
- 如果不小心闯入，不要尖叫（会引来其他实体），按来的路慢慢退回去
- 如果被包围，找可以爬上去的地方——配电柜顶部、管道上方——它们不擅长攀爬
- 保护耳朵——捂住耳朵可以减少尖啸的影响`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['无面', '群', '一群', '黑影', '围', '尖啸', '耳鸣', 'faceling', '一群人'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 51,
      order: 51,
    },

    // ─── 关键词触发：物品 — 物资箱 ───
    {
      id: -200,
      uid: 'level-3-item-supply-crate',
      comment: '[level-3] 物品: 废旧物资箱',
      content: `### 物品：废旧物资箱

Level 3有一个其他地方难以比拟的特点——资源丰富。在这个层级的配电室和小隔间里，经常可以找到各种物资箱。

箱子里可能包含：
- 瓶装杏仁水（最珍贵的发现）
- 罐头食品（虽然标签已经模糊）
- 急救包（绷带、消毒液、止痛药）
- 荧光棒（在这个层级中非常有用）
- 笔记或地图（其他流浪者留下的信息）
- 偶尔——一件可以保暖的衣服

**注意**：物资箱有时也是陷阱——有些箱子里什么都没有，但当你打开时，会发出声响吸引实体。打开时要安静。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['箱子', '物资', '柜子', '补给', '食物', '罐头', '绷带', '急救', '发现'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 60,
      order: 60,
    },

    // ─── 关键词触发：物品 — 电缆铜线 ───
    {
      id: -201,
      uid: 'level-3-item-copper-wire',
      comment: '[level-3] 物品: 电缆铜线',
      content: `### 物品：电缆铜线

在一些废弃的配电箱里，你可以找到已经断开的电缆。如果电缆没有被通电，可以抽出其中的铜线。

铜线的用途：
- 可以制作简易的捆绑工具
- 可以用来制作陷阱（绊索、警示铃）
- 可以用于维修简单的设备
- 可以和杏仁水交易（在某些层级，铜线是有价值的交易品）

**安全警告**：只有在确认电缆完全断电后才能触碰。有电的电缆通常会发出微弱的嗡鸣声——当心这个声音。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['电缆', '铜线', '电线', '线', '金属线', '材料', '工具'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 61,
      order: 61,
    },

    // ─── 关键词触发：安全屋 ───
    {
      id: -300,
      uid: 'level-3-safe-room',
      comment: '[level-3] 安全区域: 带灯的走廊',
      content: `### 安全区域：宁静的走廊

在Level 3的某些深处区域，偶尔可以找到一段特殊的走廊——这里的灯光比别处更亮、更稳定。墙壁上的电缆和管道集中排列在顶部，不像其他地方那么混乱。

奇怪的是——这些走廊中从未有实体袭击的报告。没有人知道为什么。

这里的空气更凉爽，电嗡鸣更低，甚至连灰尘都更少。你可以在这里休息，可以在这里整理装备——但不要待太久。

**需要注意**：这些走廊通向哪里似乎是不确定的。你从这条走廊出去后，可能出现在Level 3的任何一个位置。没人能解释这个现象。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['安全', '休息', '走廊', '亮', '安静', '宁静', '安全区'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 70,
      order: 70,
    },
  ],
};
