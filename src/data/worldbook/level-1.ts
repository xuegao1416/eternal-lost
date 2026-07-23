// ============================================================
//  Level 1 — Pipe Dreams 完整世界书
// ============================================================

import type { LevelWorldBook } from '../../worldbook/levelWorldBook';

export const LEVEL_1_WORLD_BOOK: LevelWorldBook = {
  levelId: 'level-1',
  levelName: 'Pipe Dreams',
  meta: {
    survivalClass: 'Class 2',
    atmosphere: ['metal pipes', 'narrow corridors', 'steam hiss', 'rust', 'oil smell', 'darkness'],
    entityIds: ['entity-1-1', 'entity-2-1'],
    itemIds: ['object-1', 'object-7'],
    exitTo: ['level-0', 'level-2'],
  },
  entries: [
    // ─── 常驻：氛围描写 ───
    {
      id: -1,
      uid: 'level-1-atmosphere',
      comment: '[level-1] 氛围描写',
      content: `## 当前环境：Level 1 — Pipe Dreams（管道迷宫）

你置身于一个由灰暗混凝土维护隧道和金属管道构成的迷宫中。

**视觉**：墙壁是粗糙的灰色混凝土，上面有深色的污渍和锈迹。沿着墙壁和天花板，密密麻麻的管道交织成网——有些粗得需要双手才能环抱，有些细得如手指。管道上覆盖着厚厚的灰尘和铁锈。头顶的灯管间距很远，灯光昏暗，大片区域被黑暗吞噬。

**听觉**：蒸汽嘶嘶声从墙壁中传出，像是这个层级在呼吸。远处偶尔传来金属的呻吟声——热胀冷缩，或者别的什么。管道中有液体流动的声音。你的脚步声在狭窄的走廊里回荡。

**嗅觉**：空气中弥漫着机油、铁锈和焦油的气味。越往深处走，气味越浓烈。有时你会闻到一股甜腻的、不属于这里的味道。

**触觉**：空气又热又湿，像桑拿房。管道摸起来是温热的，有些地方甚至烫手。墙壁上有一种粘腻的触感。

**感觉**：狭窄的空间让你感到压抑。你总觉得自己正在被什么东西注视着——但每次回头，都只有空荡荡的走廊。`,
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
      uid: 'level-1-rules',
      comment: '[level-1] 层级规则',
      content: `## Level 1 已知规则

以下是关于这个层级的规则，通过流浪者的经验总结而来：

- **不要进入直径小于60厘米的管道。** 那些窄管道看起来像捷径，但进去之后你可能再也出不来了。有些人进去了，然后永远消失了。
- **听到水流声时远离。** 这个层级确实有水流，但不是所有的水声都是安全的。有些"水声"是实体移动的声音。
- **注意温度变化。** 管道变热意味着蒸汽即将喷出。管道变冷意味着你正在靠近危险区域。
- **标记你的路径。** 这个迷宫不是静态的，但标记至少能帮你排除一些已经走过的路。
- **不要相信寂静。** 这个层级永远在发出声音。如果它突然安静下来，那意味着有什么东西正在靠近——而且它不想被你听到。`,
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
      uid: 'level-1-exits',
      comment: '[level-1] 出口/切出条件',
      content: `## Level 1 出口

- → Level 0：找到向上的梯子并爬上去。这些梯子通常出现在走廊尽头的小房间里。
- → Level 2：在管道迷宫深处找到一扇红色的门。这扇门很少出现，但如果你看到它，推开它。

**切出描写指引**：
- 层级的转换应当是渐进的：环境的变化、声音的变化、气流的变化
- 用感官过渡来表现层级切换——从一种气味到另一种，从一种触感到另一种
- 出口本身通常是出乎意料的：一扇看起来普通的门、一个突然出现的通道、一次踩空`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 30,
      order: 30,
    },

    // ─── 关键词触发：实体 — 管道声响 ───
    {
      id: -100,
      uid: 'level-1-entity-pipe-sounds',
      comment: '[level-1] 实体: 管道中的声响',
      content: `### 实体：管道中的声响

有东西在管道的另一边。

你听到了刮擦声——像是指甲划过金属的声音。声音很轻，几乎被蒸汽的嘶嘶声掩盖，但它确实存在。

声音会移动。它跟着你。如果你停下来，它也会停下来。如果你加快脚步，它也会加快脚步。它从不靠近，但也从不远离。

**不要试图找到它。** 管道的缝隙比看起来要窄，而且有些东西你看到了就再也忘不掉。

**不要和它说话。** 有些流浪者曾经对它喊过话，然后他们就消失了——不是死亡，而是消失。管道里再也传不出声音了。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['声音', '刮擦', '管道', '后面', '跟着', '跟踪', '跟随', '声响'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 50,
      order: 50,
    },

    // ─── 关键词触发：实体 — 潜伏者 ───
    {
      id: -101,
      uid: 'level-1-entity-lurker',
      comment: '[level-1] 实体: 潜伏者（来自Level 2的早期入侵）',
      content: `### 实体：潜伏者

在Level 1的深处，靠近通往Level 2的通道附近，偶尔可以看到一种危险的存在。

潜伏者的身体是惨白色的，在黑暗中发出微弱的磷光。它们通常蜷缩在管道上方，或者倒挂在天花板上。当灯光熄灭时，它们会移动。它们移动得很慢，非常慢——但当你再次有光时，它们已经比之前近了一些。

**不要用手电筒照它们。** 光会让它们兴奋——不是惧怕光，而是对光做出反应。

**不要跑。** 它们会根据你的速度调整自己的速度。跑得越快，它们追得越快。慢慢地、稳稳地走开。

**最安全的选择是根本不要进入它们出没的区域。** 如果你看到管道上有白色的痕迹——那是它们留下的——立即掉头。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['潜伏者', '白色', '苍白', '天花板', '阴影', '倒挂', '磷光', '发光'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 51,
      order: 51,
    },

    // ─── 关键词触发：物品 — 杏仁水补给 ───
    {
      id: -200,
      uid: 'level-1-item-almond-water',
      comment: '[level-1] 物品: 管道渗出的杏仁水',
      content: `### 物品：管道渗出的杏仁水

你看到一段管道接口处有液体缓慢渗出，滴落在地上形成一小滩。

这液体看起来和水一样清澈，但闻起来有淡淡的杏仁味——这是杏仁水。在Level 1中，部分管道中的液体含有杏仁水的成分，但并非所有管道都是安全的。

**鉴别方法**：
1. 观察颜色：清澈透明是安全的，浑浊或发黑的是危险的
2. 闻气味：杏仁味是正品，铁锈味或焦油味则表明被污染
3. 少量尝试：先蘸一点在手指上，等几秒钟——如果没有刺痛感，才是安全的

**从管道收集的杏仁水不如瓶装的安全**，但在这个层级中，每一滴液体都可能是珍稀资源。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['水', '液体', '滴', '渗', '漏', '杏仁水', '管道水', '喝'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 60,
      order: 60,
    },

    // ─── 关键词触发：物品 — 旧扳手 ───
    {
      id: -201,
      uid: 'level-1-item-wrench',
      comment: '[level-1] 物品: 旧扳手',
      content: `### 物品：旧扳手

地上有一个生锈的扳手，看起来是某个流浪者留下的。

它很重，浸满了机油，握把处有防滑纹路。虽然锈迹斑斑，但铁质依然坚固。

**可以作为武器使用**——虽然不是什么杀伤性武器，但在紧急情况下，一个挥舞的金属物件足以让你争取到逃跑的时间。

**也可以用来拧动管道上的阀门**——有些阀门需要用工具才能操作，而它们后面可能藏着通道或补给。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['扳手', '工具', '铁', '金属', '武器', '防身'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 61,
      order: 61,
    },

    // ─── 关键词触发：隐藏区域 — 维护室 ───
    {
      id: -300,
      uid: 'level-1-secret-room',
      comment: '[level-1] 隐藏区域: 废弃维护室',
      content: `### 隐藏区域：废弃维护室

在走廊的侧面，有一扇几乎和墙壁融为一体的铁门。如果不仔细观察，你可能会直接走过它。

门没有锁——或者说，锁已经锈死了，轻轻一推就能打开。

维护室很小，大约只有几平方米。里面有几个空置的工具架、一个落满灰尘的工作台，以及一些被遗忘的物品。墙上贴着一张发黄的图纸，似乎是这个层级的一部分管道布局——但已经褪色到几乎无法辨认。

**注意**：门关上后可能无法从里面打开。如果你进去了，确保门保持敞开。

维护室是一个暂时的安全区。实体很少进入这种封闭空间，但待久了它会变成一个陷阱。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['门', '铁门', '维护', '房间', '隐藏', '小房间', '工作间', '工具间'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 70,
      order: 70,
    },
  ],
};
