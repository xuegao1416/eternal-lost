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
];

/** 获取层级 */
export function getLevelById(id: string): LevelDef | undefined {
  return BUILTIN_LEVELS.find(l => l.id === id);
}

/** 获取所有层级 ID */
export function getAllLevelIds(): string[] {
  return BUILTIN_LEVELS.map(l => l.id);
}
