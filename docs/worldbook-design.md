# 永恒迷途录 — 世界书系统设计

## 核心理念

旧项目的世界书是"关键词触发式"（酒馆蓝灯/绿灯），适合自由创作。
本项目需要的是**游戏状态驱动式**——根据玩家当前状态自动注入上下文。

## 禁忌

- **绝对不出现数值**：没有 HP、MP、攻击力、防御力、经验值
- **模糊化状态**：用"你受了伤""你很疲惫""你快撑不住了"代替数值
- **规则可以有数字**："不要在黑暗中停留超过30秒"是规则，不是数值

## 世界书条目类型

### 1. Level 条目（层级定义）

当玩家处于某个层级时，自动注入该层级的所有条目。

```yaml
type: level
id: level-0
name: "The Lobby"
trigger: currentLevel == "level-0"
inject:
  - atmosphere    # 氛围描写（常驻）
  - rules         # 该层级的规则（常驻）
  - entities      # 可能出现的实体（常驻）
  - exits         # 出口/切出条件（常驻）
  - secrets       # 隐藏内容（发现后才注入）
```

### 2. Rule 条目（规则）

规则是玩家可以"发现"的生存指南。发现前不注入，发现后常驻注入。

```yaml
type: rule
id: rule-0-1
level: level-0
content: "不要在黑暗中停留超过30秒"
discovery:
  method: observe  # observe/told/survive/experiment
  hint: "你注意到，每次灯管闪烁超过30秒，就会有什么东西出现"
status: undiscovered  # undiscovered -> suspected -> confirmed
```

### 3. Entity 条目（实体）

实体在特定层级可能出现。玩家遇到后解锁详细信息。

```yaml
type: entity
id: entity-3
name: "Smilers"
appears_in: [level-0, level-2, level-5, level-6]
inject:
  - description   # 外观描述（遇到时注入）
  - behavior      # 行为模式（遇到后注入）
  - survival      # 生存建议（幸存后注入）
encounter:
  first_sighting: "你在黑暗中看到两点发光的东西，像是牙齿..."
  danger_level: high
```

### 4. Transition 条目（层级切换）

定义层级之间的切换规则。

```yaml
type: transition
id: transition-0-1
from: level-0
to: level-1
conditions:
  - "沿着走廊一直走，直到墙壁颜色开始变化"
  - "找到一扇生锈的铁门"
  - "在某个区域停留超过2小时"
method: walk  # walk/door/fall/noclip/warp
reliability: sometimes  # always/sometimes/rare
```

### 5. Item 条目（物品）

物品可以在层级中找到，影响玩家状态。

```yaml
type: item
id: item-almond-water
name: "杏仁水"
found_in: [level-0, level-4, level-37]
effects:
  - "喝了之后你会感觉好一些"
  - "你的伤口似乎不那么疼了"
description: "一瓶透明的液体，闻起来有淡淡的杏仁味"
```

### 6. Atmosphere 条目（氛围）

每个层级的感官描写，常驻注入。

```yaml
type: atmosphere
id: atmosphere-0
level: level-0
visual: "黄色墙纸、闪烁的荧光灯、潮湿的地毯"
audio: "嗡嗡的电流声、远处的滴水声"
smell: "霉味、旧地毯的味道"
touch: "潮湿的墙壁、粘腻的地毯"
feeling: "压抑、不安、被困的感觉"
```

## 注入逻辑

```
玩家输入
  ↓
系统检查：当前层级 → 注入 Level 条目 + Atmosphere 条目
  ↓
系统检查：已发现的规则 → 注入 Rule 条目
  ↓
系统检查：已遇到的实体 → 注入 Entity 条目
  ↓
系统检查：背包物品 → 注入 Item 条目
  ↓
系统检查：可能的出口 → 注入 Transition 条目
  ↓
组装完整 system prompt
  ↓
发送给 AI
```

## 与旧系统的区别

| 旧系统（酒馆式） | 新系统（状态驱动式） |
|-----------------|---------------------|
| 关键词触发 | 游戏状态触发 |
| 蓝灯=常驻，绿灯=关键词 | Level/Rule/Entity/Transition 分类 |
| 静态文本注入 | 动态上下文组装 |
| 适合自由创作 | 适合游戏叙事 |
| 无状态 | 有游戏状态（当前位置、已发现规则等） |

## 文件结构

```
src/data/worldbook/
├── levels/           # 层级定义
│   ├── level-0.yaml
│   ├── level-1.yaml
│   └── ...
├── entities/         # 实体定义
│   ├── smilers.yaml
│   ├── facelings.yaml
│   └── ...
├── rules/            # 规则定义
│   ├── level-0-rules.yaml
│   └── ...
├── transitions/      # 层级切换
│   ├── level-0-transitions.yaml
│   └── ...
├── items/            # 物品定义
│   ├── almond-water.yaml
│   └── ...
└── atmosphere/       # 氛围描写
    ├── level-0-atmosphere.yaml
    └── ...
```
