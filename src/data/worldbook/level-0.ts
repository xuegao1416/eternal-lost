// ============================================================
//  Level 0 — The Lobby 完整世界书
// ============================================================

import type { LevelWorldBook } from '../../worldbook/levelWorldBook';

export const LEVEL_0_WORLD_BOOK: LevelWorldBook = {
  levelId: 'level-0',
  levelName: 'The Lobby',
  meta: {
    survivalClass: 'Class 1',
    atmosphere: ['yellow wallpaper', 'fluorescent lights', 'damp carpet', 'buzzing', 'musty'],
    entityIds: ['entity-2', 'entity-9'],
    itemIds: ['object-1', 'object-10'],
    exitTo: ['level-1', 'level-0.01', 'level-0-red'],
  },
  entries: [
    // ─── 常驻：氛围描写 ───
    {
      id: -1,
      uid: 'level-0-atmosphere',
      comment: '[level-0] 氛围描写',
      content: `## 当前环境：Level 0 — The Lobby

你站在一个似乎无限延伸的空间里。

**视觉**：泛黄的墙纸覆盖着每一面墙，图案已经褪色，只剩下模糊的花纹。天花板上每隔几米就有一根荧光灯管，发出苍白的光，有些在不停地闪烁。脚下是潮湿的地毯，颜色已经分辨不清，可能是米色，也可能是灰色。

**听觉**：荧光灯发出持续的嗡嗡声，像是远处有一群蜜蜂。偶尔会听到滴水声，但你找不到水滴的来源。你的脚步声在地毯上被吸收，只剩下沉闷的回响。

**嗅觉**：空气中弥漫着霉味和旧地毯的味道，像是一个很久没有人住过的房间。偶尔会有一丝消毒水的气味飘过。

**触觉**：墙壁摸起来是潮湿的，地毯是粘腻的。空气有些闷热，但不至于让人窒息。

**感觉**：一种挥之不去的压抑感笼罩着你。你知道这里不对劲，但你说不出哪里不对劲。`,
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
      uid: 'level-0-rules',
      comment: '[level-0] 层级规则',
      content: `## Level 0 已知规则

以下是关于 Level 0 的已知规则。有些是被验证过的，有些只是传闻。

- 不要在黑暗中停留太久。当灯管熄灭时，尽快找到有光的地方。
- 不要跑。跑步会消耗体力，而且可能会惊动某些东西。
- 听。仔细听周围的声音。如果嗡嗡声突然停止，那意味着有危险。
- 不要触碰墙纸。有些墙纸下面有东西。
- 如果你看到一扇门，考虑清楚再打开。有些门只能从一侧打开。
- 标记你的路径。用任何你能找到的东西——刮痕、记号、或者只是记住转角的特征。
- 杏仁水是安全的。如果你找到一瓶透明的液体，闻起来有杏仁味，喝下去。`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 20,
      order: 20,
    },

    // ─── 常驻：出口/切出条件 ───
    {
      id: -3,
      uid: 'level-0-exits',
      comment: '[level-0] 出口/切出条件',
      content: `## Level 0 出口

从 Level 0 离开的方式有几种：

- → Level 1: 沿着走廊一直走，直到墙壁的颜色开始变化。或者找到一扇生锈的铁门。
- → Level 0.01: 在某个区域停留太久，可能会发现自己在一个小房间里。那扇门不会带你离开。
- → Level 0 (Red Rooms): 如果你注意到墙纸的颜色开始变红，灯管的闪烁频率改变，你可能已经进入了 Red Rooms。

**切出描写指引**：
当玩家即将离开 Level 0 时，用以下方式描写过渡：
- 走廊的尽头出现了一扇之前没有的门
- 墙壁的颜色开始从黄色变成灰色
- 荧光灯的嗡嗡声逐渐变低，取而代之的是另一种声音
- 脚下的地毯突然变得干燥，或者突然变得更加潮湿
- 用一行空行 + "——" 分隔，然后描述新环境的第一个感官印象`,
      constant: true,
      enabled: true,
      selective: false,
      keys: [],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 30,
      order: 30,
    },

    // ─── 关键词触发：实体 — Windows ───
    {
      id: -100,
      uid: 'level-0-entity-windows',
      comment: '[level-0] 实体: Windows',
      content: `### 实体：Windows

你看到了一扇窗户。窗户嵌在墙纸里，看起来像是不应该出现在这里的东西。

窗户的玻璃是模糊的，你无法看清外面是什么。有时候，你会觉得玻璃后面有什么东西在移动。但当你靠近时，那东西就消失了。

**不要打破窗户。** 你不知道窗户后面是什么，而且打破窗户的声音会吸引其他东西。

**不要长时间盯着窗户看。** 有些人说他们在窗户里看到了自己的脸，但那张脸在笑。而他们自己并没有在笑。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['窗户', '窗', '玻璃', 'window', '窗外'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 50,
      order: 50,
    },

    // ─── 关键词触发：实体 — Facelings ───
    {
      id: -101,
      uid: 'level-0-entity-facelings',
      comment: '[level-0] 实体: Facelings',
      content: `### 实体：Facelings

你看到了一个人影。

不，不是人。是一个长得像人的东西。它穿着普通的衣服，走在走廊里，就像一个普通的路人。但它的脸……它的脸是平的。没有眼睛，没有鼻子，没有嘴巴。只是一块光滑的皮肤。

Facelings 通常不会主动攻击。它们只是……存在。它们会走路，会开门，会坐下，但它们不会看你。它们没有眼睛可以看。

**不要试图和它们交流。** 它们不会回应，而且你不知道它们会怎么反应。

**不要挡住它们的路。** 如果一个 Faceling 走向你，让开。它们会直接走过你，就像你不存在一样。

**不要触摸它们。** 有些人说触摸 Faceling 会让你的脸也开始消失。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['人影', 'faceling', '无脸', '没有脸', '平脸', '人脸', '路人'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 51,
      order: 51,
    },

    // ─── 关键词触发：物品 — 杏仁水 ───
    {
      id: -200,
      uid: 'level-0-item-almond-water',
      comment: '[level-0] 物品: 杏仁水',
      content: `### 物品：杏仁水

你找到了一瓶液体。瓶子是透明的，里面的液体也是透明的，但闻起来有淡淡的杏仁味。

**杏仁水是 Level 0 中最重要的资源。**

喝下杏仁水会让你感觉好一些。你的口渴会消失，你的疲惫会减轻，你的恐惧也会稍微平息一些。有些人说杏仁水有治愈伤口的效果，但这可能是心理作用。

**不要喝太多。** 一瓶就够了。喝太多会让你恶心。

**保存一些。** 你不知道什么时候会再找到一瓶。

**不要喝闻起来不对的液体。** 如果液体闻起来不是杏仁味，而是其他什么味道——比如铁锈味，或者血腥味——不要喝。那是液态痛苦。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['杏仁水', '水', '喝', '口渴', '瓶子', '液体', 'almond water'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 60,
      order: 60,
    },

    // ─── 关键词触发：物品 — 地毯液 ───
    {
      id: -201,
      uid: 'level-0-item-carpet-fluid',
      comment: '[level-0] 物品: 地毯液',
      content: `### 物品：地毯液

你注意到地毯上有一滩液体。它看起来像是水，但颜色有些发黄，而且闻起来……很难形容。不是难闻，但也不是好闻。

**地毯液的性质不明。**

有些人说喝了地毯液会让人产生幻觉。有些人说它只是普通的水，被地毯污染了。有些人说它是杏仁水的稀释版本。

**建议不要喝。** 除非你已经很久没有找到杏仁水，而且你快要渴死了。在这种情况下，风险可能值得冒。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['地毯', '液体', '一滩', '地上', '湿'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 61,
      order: 61,
    },

    // ─── 关键词触发：隐藏区域 ───
    {
      id: -300,
      uid: 'level-0-secret-rooms',
      comment: '[level-0] 隐藏区域',
      content: `### 隐藏区域

有时候，你会发现墙纸上有一块颜色稍微不同的区域。或者地毯有一块翘起来的角落。或者灯管的排列方式有些奇怪。

这些可能是通往隐藏区域的入口。

**如何进入**：
- 推动看起来不同的墙纸
- 掀开翘起来的地毯
- 转动看起来松动的灯管

**隐藏区域可能包含**：
- 杏仁水
- 关于其他层级的笔记
- 通往其他层级的通道
- 也可能什么都没有，或者更糟

**注意**：不是所有看起来异常的地方都是隐藏区域。有些只是 Level 0 的自然变化。你需要自己判断。`,
      constant: false,
      enabled: true,
      selective: true,
      keys: ['隐藏', '秘密', '墙纸', '异常', '不同', '奇怪', '推开', '掀开'],
      secondaryKeys: [],
      position: 'after_char',
      insertionOrder: 70,
      order: 70,
    },
  ],
};
