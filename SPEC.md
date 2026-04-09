# 仙途问路 - 技术规范文档

## 1. 项目概述

**项目名称**: 仙途问路  
**类型**: 文字修仙RPG挂机游戏  
**技术栈**: Vue3 + Element Plus + Pinia + TypeScript  
**部署**: Docker Compose + NAS存储

---

## 2. 技术架构

### 前端
- **框架**: Vue 3 (Composition API + `<script setup>`)
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **多端适配**: CSS媒体查询 + 响应式布局
- **构建工具**: Vite

### 后端（可选/轻量）
- 若需后端存储，使用 Node.js + SQLite
- 或是纯前端 + localStorage 存储

### 部署
- Docker Compose 一键部署
- 支持 NAS 挂载 volume

---

## 3. 核心系统设计

### 3.1 挂机修炼系统

```
┌─────────────────────────────────────────────┐
│              灵气修炼槽                      │
│  [████████░░] 80/100 境界: 练气期三层        │
│  每秒 +1 灵气，修炼中...                     │
└─────────────────────────────────────────────┘
```

**机制**:
| 境界 | 灵气上限 | 每秒获取 | 突破所需 |
|------|---------|---------|---------|
| 练气期 | 100 | 1 | 100 |
| 筑基期 | 300 | 3 | 300 |
| 金丹期 | 700 | 5 | 700 |
| ... | ... | ... | ... |

**离线收益**: 上线时补发离线期间的50%灵气（上限24小时）

### 3.2 装备/法宝系统

**装备品质**:
| 品质 | 颜色 | 概率 | 强化倍率 |
|------|-----|------|---------|
| 普通 | 灰色 | 50% | 1x |
| 优秀 | 绿色 | 30% | 1.5x |
| 稀有 | 蓝色 | 15% | 2x |
| 史诗 | 紫色 | 4% | 3x |
| 仙器 | 橙色 | 1% | 5x |

**装备类型**:
- 武器（剑、刀、戟、法杖）
- 防具（甲、衣、靴、帽）
- 饰品（项链、戒指、手镯）

**神器示例**:
- 紫晶破晓戟（武器·仙器）
- 寒霜凝露链（项链·仙器）
- 九天混元甲（防具·仙器）
- 乾坤戒（戒指·仙器）

**获得方式**:
- 刷怪掉落（概率与怪物等级相关）
- 抽奖消耗灵石
- 任务奖励
- 奇遇事件

### 3.3 战斗系统

**自动战斗**:
- 玩家选择场景后自动进入战斗
- 每3秒一回合，玩家先手
- 伤害 = 攻击 - 敌方防御（最少1）

**怪物分布**:
| 场景 | 怪物等级 | 怪物示例 |
|------|---------|---------|
| 灵气森林 | 1-10 | 灰兔、野狼、灵狐 |
| 幽冥深渊 | 11-30 | 鬼魂、僵尸、骷髅王 |
| 极霄峰 | 31-50 | 雪怪、守护兽、青龙 |

### 3.4 剧情与奇遇系统

**触发条件**:
- 击败特定怪物
- 探索特定场景
- 随机事件（挂机时）

**奇遇示例**:
| 事件 | 触发条件 | 结果 |
|------|---------|------|
| 灵宠白蛇 | 幽冥深渊Boss概率15% | 收服灵宠，战斗帮手 |
| 仙人传承 | 极霄峰探索概率5% | 获得仙器 |
| 灵草采摘 | 灵气森林随机 | 获得药材，可炼药 |

**灵宠系统**:
- 灵宠有等级和属性
- 战斗时可协助攻击
- 可通过修炼提升

---

## 4. 数据模型

### 4.1 角色 (Player)

```typescript
interface Player {
  id: string;
  name: string;
  // 属性
  realm: string;           // 当前境界
  realmLevel: number;      // 境界内等级
  hp: number;             // 当前生命
  maxHp: number;         // 最大生命
  attack: number;        // 攻击力
  defense: number;       // 防御力
  // 修炼
  spiritEnergy: number;   // 当前灵气
  maxSpiritEnergy: number; // 灵气上限
  spiritPerSecond: number; // 每秒灵气获取
  // 资产
  spiritStones: number;  // 灵石
  // 装备
  equipment: {
    weapon?: Equipment;
    armor?: Equipment;
    boots?: Equipment;
    helmet?: Equipment;
    necklace?: Equipment;
    ring?: Equipment;
  };
  // 灵宠
  pets: Pet[];
  // 时间
  lastOnline: number;
  createdAt: number;
}
```

### 4.2 装备 (Equipment)

```typescript
interface Equipment {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'boots' | 'helmet' | 'necklace' | 'ring';
  quality: 'common' | 'good' | 'rare' | 'epic' | 'legendary';
  attackBonus: number;
  defenseBonus: number;
  hpBonus: number;
}
```

### 4.3 灵宠 (Pet)

```typescript
interface Pet {
  id: string;
  name: string;
  level: number;
  attack: number;
  defense: number;
  ability: string;  // 特殊能力描述
}
```

---

## 5. 模块划分

### 5.1 Pinia Store

| Store | 职责 |
|-------|------|
| usePlayerStore | 玩家数据、状态更新 |
| useEquipmentStore | 装备背包、穿戴 |
| useBattleStore | 战斗状态、怪物 |
| useWorldStore | 场景数据、奇遇 |
| useSettingsStore | 设置、存储 |

### 5.2 组件结构

```
src/
├── components/
│   ├── player/
│   │   ├── PlayerStatus.vue      # 状态面板
│   │   ├── PlayerEquip.vue    # 装备展示
│   │   └── PlayerPets.vue    # 灵宠面板
│   ├── battle/
│   │   ├── BattlePanel.vue   # 战斗区域
│   │   ├── MonsterInfo.vue   # 怪物信息
│   │   └── BattleLog.vue    # 战斗日志
│   ├── world/
│   │   ├── WorldMap.vue      # 地图选择
│   │   └── Encounter.vue    # 奇遇事件
│   ├── cultivation/
│   │   ├── SpiritBar.vue     # 灵气条
│   │   └── RealmDisplay.vue # 境界显示
│   └── common/
│       ├── GameHeader.vue   # 顶部栏
│       └── SaveControl.vue  # 存档控制
├── views/
│   ├── HomeView.vue        # 首页/创建角色
│   ├── GameView.vue       # 游戏主界面
│   └── ShopView.vue       # 商店
├── stores/
│   └── *.ts
└── utils/
    ├── storage.ts          # localStorage封装
    ├── random.ts         # 随机数工具
    └── combat.ts         # 战斗计算
```

---

## 6. 部署配置

### Docker Compose

```yaml
version: '3.8'
services:
  xiantu:
    build: .
    ports:
      - "3000:80"
    volumes:
      - game-data:/app/data
    environment:
      - NODE_ENV=production

volumes:
  game-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /path/to/nas/game-data
```

---

## 7. 验收清单

- [x] 项目使用 Vue3 + Element Plus + Pinia
- [x] 支持 PC 和移动端自适应
- [x] 挂机修炼：自动获取灵气，每秒速度显示
- [x] 离线收益：上线补发灵气（50%，最多24小时）
- [x] 装备系统：5种品质，随机掉落
- [x] 法宝示例：至少10种神器
- [x] 自动战斗：2.5秒一回合
- [x] 奇遇系统：灵宠收服、传承等
- [x] 灵宠系统：协助战斗、可切换出战
- [x] Docker Compose 一键部署
- [x] NAS 存储支持
- [x] 商店系统：5档抽奖 + 直购商店
- [x] 地图场景等级解锁机制
- [x] 境界突破视觉特效
- [x] 挂机实时统计面板
- [x] 战斗日志彩色分类显示
- [x] 装备格子图标化

## 8. 2026-04-09 优化记录

### 新增功能
- **商店系统**：新增「商店」Tab，含5档抽奖（青铜/白银/黄金/钻石/仙缘）和直购商店（每分钟刷新）
- **灵宠切换**：背包页可点击切换出战/休息灵宠
- **场景解锁**：地图场景按玩家总等级解锁，未解锁场景显示锁定状态

### 界面优化
- **战斗面板**：挂机实时统计条（击杀/灵石/经验）、彩色战斗日志、BOSS动画抖动、玩家血条
- **灵气条**：显示每秒灵气获取速度
- **玩家面板**：境界突破时全屏闪光+飘字特效、装备列表显示图标+品质颜色边框
- **装备格子**：6个槽位显示对应图标、悬停显示卸下提示
- **地图面板**：锁定场景灰显显示等级要求

### 体验优化
- 战斗日志自动滚到底部
- 战斗日志保留最近100条（原来80条）
- 挂机统计本场累计（切换场景时重置）

---

## 9. 2026-04-09 背包与宠物页面重构

### 新增功能
- **人形装备栏**：全新「人形」UI，按身体部位排列（头盔/项链/武器/胸甲/裤子/靴子/戒指×2）
- **双戒指槽**：支持同时装备两枚戒指（戒指Ⅰ、戒指Ⅱ）
- **裤子装备位**：新增裤子装备槽位，完善人形装备系统
- **宠物专属页面**：新建「灵宠」Tab页面，移除背包页的宠物功能
- **灵宠培养系统**：
  - 经验条显示升级进度
  - 亲密度培养（喂养灵石提升）
  - 品阶觉醒（可升至5星神品）
- **法宝系统**：
  - 5种法宝模板（灵剑·青光/玉净瓶/玲珑塔/雷神鼓/阴阳镜）
  - 法宝拥有特殊技能（伤害/治疗/护盾/Buff）
  - 装备法宝获得属性加成
  - 专属法宝商店（按境界解锁）
  - 法宝可从BOSS掉落
- **商店新增法宝Tab**：玩家可使用灵石购买法宝

### 装备类型清单
| 槽位 | 图标 | 说明 |
|------|------|------|
| 头盔 | 🪖 | 防御型装备 |
| 项链 | 📿 | HP加成 |
| 武器 | ⚔️ | 攻击型装备 |
| 胸甲 | 🛡️ | 综合防御 |
| 裤子 | 👖 | 防御型装备 |
| 靴子 | 👢 | 移动/防御 |
| 戒指Ⅰ | 💍 | 属性加成 |
| 戒指Ⅱ | 💎 | 属性加成 |

### 法宝技能列表
| 法宝 | 品质 | 技能 | 效果 |
|------|------|------|------|
| 灵剑·青光 | 稀有 | 剑气斩 | 150%攻击力伤害 |
| 玉净瓶 | 史诗 | 甘露术 | 恢复30%最大生命 |
| 玲珑塔 | 史诗 | 护体神光 | 生成50%防御力护盾 |
| 雷神鼓 | 仙器 | 雷霆万钧 | 200%攻击力伤害 |
| 阴阳镜 | 仙器 | 生死转换 | 伤害50%转化为治疗 |

### 数据模型更新
- `EquipmentType` 新增 `pants`, `ring1`, `ring2`
- `Player.equipment` 类型更新为 `EquipmentSlots`（含8个槽位）
- `Player.artifacts` 新增法宝数组
- `Player.equippedArtifactId` 当前装备法宝ID
- `Pet` 新增 `exp`, `maxExp`, `loyalty`, `grade` 字段
- `Artifact` 新增法宝实体类型
- `ArtifactSkill` 法宝技能定义

## 10. 2026-04-09 战斗与交互优化

### 新增功能
- **伤害浮字动画**：战斗中对怪物/玩家造成伤害时显示浮动数字动画，暴击时特殊金色放大效果
- **层级经验进度条**：PlayerPanel显示当前层级经验获取进度，带条纹动画效果
- **背包页灵宠切换**：InventoryPanel新增灵宠上阵面板，点击即可切换出战灵宠

### 战斗特效
- 玩家伤害浮字：蓝色数字向上飘动（暴击时金色放大旋转）
- 怪物伤害浮字：红色数字向上飘动
- 暴击提示：💥 图标 + 1.5倍放大动画

### 灵宠交互
- 背包页灵宠卡片展示：头像、名称、星阶、属性、等级
- 点击切换灵宠状态（出战/休息）
- 出战状态高亮显示
