// ============================================================
//  内置层级索引
// ============================================================
import type { LevelDef } from '../level-schema';

// 初始层级数据（后续从 JSON 文件加载）
export const BUILTIN_LEVELS: LevelDef[] = [
  {
    id: 'level-0',
    name: '大厅',
    subtitle: '生存难度: Class 1',
    description: '你睁开眼睛，发现自己站在一个巨大的、空旷的大厅里。天花板上的荧光灯管发出微弱的嗡嗡声，有些灯管在不停地闪烁。墙壁是泛黄的墙纸，上面有褪色的花纹。地面是潮湿的地毯，散发着霉味。走廊向四面八方延伸，看不到尽头。',
    atmosphere: '空旷、潮湿、荧光灯嗡鸣、霉味、压抑',
    entities: [],
    rules: [
      {
        id: 'rule-0-1',
        content: '不要在黑暗中停留太久',
        source: 'observed',
        confidence: 'suspected',
      },
    ],
    exits: [
      {
        id: 'exit-0-1',
        targetLevelId: 'level-1',
        condition: '沿着走廊一直走，直到墙壁的颜色开始变化',
        method: 'conditional',
        reliability: 'sometimes',
      },
    ],
    tags: ['大厅', '荧光灯', '潮湿', '安全'],
    survivalDifficulty: 'Class 1',
  },
  {
    id: 'level-1',
    name: '管道迷宫',
    subtitle: '生存难度: Class 2',
    description: '你穿过一扇生锈的铁门，发现自己置身于一个由金属管道组成的迷宫中。管道大小不一，有些可以通行，有些只够一个人侧身挤过。空气中弥漫着铁锈和机油的味道。远处传来水流声，但你分不清方向。',
    atmosphere: '金属、铁锈、狭窄、水流声、黑暗',
    entities: [
      {
        id: 'entity-1-1',
        name: '管道中的声响',
        description: '你听到了管道中传来的刮擦声，像是有什么东西在里面移动',
        behavior: '跟随但不靠近',
        danger: 'low',
        encounters: '你听到身后传来金属刮擦的声音，回头却什么也看不到',
      },
    ],
    rules: [
      {
        id: 'rule-1-1',
        content: '不要进入直径小于60厘米的管道',
        source: 'survived',
        confidence: 'confirmed',
      },
      {
        id: 'rule-1-2',
        content: '听到水流声时远离，那可能不是水',
        source: 'told',
        confidence: 'suspected',
      },
    ],
    exits: [
      {
        id: 'exit-1-1',
        targetLevelId: 'level-0',
        condition: '找到向上的梯子并爬上去',
        method: 'triggered',
        reliability: 'always',
      },
      {
        id: 'exit-1-2',
        targetLevelId: 'level-2',
        condition: '在管道迷宫深处找到一扇红色的门',
        method: 'conditional',
        reliability: 'rare',
      },
    ],
    tags: ['管道', '迷宫', '铁锈', '狭窄', '危险'],
    survivalDifficulty: 'Class 2',
  },
  {
    id: 'level-2',
    name: '管道之梦',
    subtitle: '生存难度: Class 3',
    description: '你穿过那扇红色的门，扑面而来的是湿热的气息。这里是一个由灰色混凝土维护隧道组成的巨大迷宫，墙壁上密密麻麻地布满了生锈的管道和通风管。管道中流淌着一种黑色的粘稠液体，散发着机油和焦油的气味。空气又热又湿，让人透不过气来。头顶的荧光灯发出昏暗的黄光，有些已经熄灭，留下大片的黑暗区域。远处传来蒸汽嘶嘶声和金属的呻吟声——这个层级是活着的。',
    atmosphere: '湿热、机油味、蒸汽嘶嘶、混凝土、管道、黑暗',
    entities: [
      {
        id: 'entity-2-1',
        name: '潜伏者',
        description: '黑暗中移动的影子，闪烁着惨白的光',
        behavior: '潜伏在黑暗区域，在光线熄灭时靠近',
        danger: 'high',
        encounters: '你看到前方的一盏灯闪烁了几下，然后熄灭了。在彻底变暗的那一瞬间，你看到了一个苍白的身影站在走廊尽头——然后它消失了。',
      },
      {
        id: 'entity-2-2',
        name: '死亡猎犬',
        description: '四足行走的实体，身体残破不全，发出金属摩擦般的刺耳嘶吼',
        behavior: '依靠听觉和嗅觉追踪猎物，通常在开阔区域成群出没',
        danger: 'lethal',
        encounters: '你听到了金属摩擦声——不像管道的热胀冷缩，而是别的什么。声音越来越近，越来越快。然后你看到了它：一只残缺不全的生物，用扭曲的四肢在地上爬行。',
      },
    ],
    rules: [
      {
        id: 'rule-2-1',
        content: '灯光熄灭时不要动，等待它重新亮起',
        source: 'survived',
        confidence: 'confirmed',
      },
      {
        id: 'rule-2-2',
        content: '不要触碰烫手的管道——里面有高温蒸汽',
        source: 'observed',
        confidence: 'confirmed',
      },
      {
        id: 'rule-2-3',
        content: '管道中流淌的黑色液体含有杏仁水成分，但直接饮用是致命的',
        source: 'told',
        confidence: 'rumor',
      },
    ],
    exits: [
      {
        id: 'exit-2-1',
        targetLevelId: 'level-1',
        condition: '找到向上的维护通道',
        method: 'triggered',
        reliability: 'always',
      },
      {
        id: 'exit-2-2',
        targetLevelId: 'level-3',
        condition: '找到一扇标有"高压危险"的铁门',
        method: 'conditional',
        reliability: 'sometimes',
      },
    ],
    tags: ['管道', '蒸汽', '混凝土', '炎热', '实体密集'],
    survivalDifficulty: 'Class 3',
  },
  {
    id: 'level-3',
    name: '变电站',
    subtitle: '生存难度: Class 4',
    description: '你推开那扇沉重的铁门，眼前的景象令人窒息。这是一个巨大的废弃电气设施——砖墙上布满了裸露的电线和电缆，混凝土地面覆盖着厚厚的灰尘。头顶的金属天花板上悬挂着各种配电箱和老化线路。无数机器在工作，发出持续的嗡鸣和电火花噼啪声。空气中弥漫着刺鼻的臭氧味和橡胶烧焦的气味。灯光不稳定——应急灯以3-5秒为周期闪烁，大片的区域沉浸在黑暗中。据说这个层级可能在为整个后室提供电力。',
    atmosphere: '电火花、臭氧味、嗡鸣、砖墙、电缆、闪烁',
    entities: [
      {
        id: 'entity-3-1',
        name: '窃皮者',
        description: '伪装成维修工人或流浪者的实体，没有明显的呼吸起伏',
        behavior: '潜伏在配电柜后，模仿设备故障的声音引诱靠近',
        danger: 'high',
        encounters: '你看到前方有人影——一个穿着维修服的人正在检查配电箱。他背对着你，动作看起来很自然。但你注意到一件事：他的肩膀没有起伏。他没有呼吸。',
      },
      {
        id: 'entity-3-2',
        name: '无面灵群',
        description: '成群出现的模糊黑影，没有面部特征，移动时无声无息',
        behavior: '当入侵者进入其活动范围（5米内）时会集体围拢并发高频尖啸',
        danger: 'high',
        encounters: '灯光闪烁的间隙，你看到走廊里多了几个黑影。一开始你以为是自己的幻觉，但当你再次眨眼时，它们更近了。它们没有脸——或者说，它们的脸只是一片空白。',
      },
    ],
    rules: [
      {
        id: 'rule-3-1',
        content: '不要触碰裸露的电线——会导致暂时性瘫痪',
        source: 'observed',
        confidence: 'confirmed',
      },
      {
        id: 'rule-3-2',
        content: '灯光闪烁的频率加快意味着危险逼近',
        source: 'survived',
        confidence: 'confirmed',
      },
      {
        id: 'rule-3-3',
        content: '配电柜里可能藏有物资，但打开前先听一听',
        source: 'told',
        confidence: 'suspected',
      },
    ],
    exits: [
      {
        id: 'exit-3-1',
        targetLevelId: 'level-2',
        condition: '找到向下走的维护楼梯',
        method: 'triggered',
        reliability: 'always',
      },
    ],
    tags: ['电气', '电缆', '机器', '臭氧', '黑暗', '高价值资源'],
    survivalDifficulty: 'Class 4',
  },
];

/** 获取层级 */
export function getLevelById(id: string): LevelDef | undefined {
  return BUILTIN_LEVELS.find(l => l.id === id);
}

/** 获取所有层级 ID */
export function getAllLevelIds(): string[] {
  return BUILTIN_LEVELS.map(l => l.id);
}
