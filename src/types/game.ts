// 境界配置 - 10个境界，每个境界10层，对应1-100级
export const REALMS = [
  { id: 'liangqi', name: '炼气期', spiritCap: 100, spiritPerSec: 1, realmLevelCap: 10 },
  { id: 'zhuji', name: '筑基期', spiritCap: 300, spiritPerSec: 3, realmLevelCap: 10 },
  { id: 'jindan', name: '金丹期', spiritCap: 700, spiritPerSec: 5, realmLevelCap: 10 },
  { id: 'yuanying', name: '元婴期', spiritCap: 1500, spiritPerSec: 8, realmLevelCap: 10 },
  { id: 'chuqiao', name: '出窍期', spiritCap: 2800, spiritPerSec: 12, realmLevelCap: 10 },
  { id: 'huashen', name: '化神期', spiritCap: 5000, spiritPerSec: 18, realmLevelCap: 10 },
  { id: 'heti', name: '合体期', spiritCap: 8500, spiritPerSec: 25, realmLevelCap: 10 },
  { id: 'dujie', name: '渡劫期', spiritCap: 14000, spiritPerSec: 35, realmLevelCap: 10 },
  { id: 'dacheng', name: '大乘期', spiritCap: 22000, spiritPerSec: 50, realmLevelCap: 10 },
  { id: 'renxian', name: '人仙期', spiritCap: Infinity, spiritPerSec: 80, realmLevelCap: 10 }
] as const

export type RealmId = typeof REALMS[number]['id']

// 装备品质
export const QUALITIES = {
  common: { name: '普通', color: '#9e9e9e', multiplier: 1 },
  good: { name: '优秀', color: '#4caf50', multiplier: 1.5 },
  rare: { name: '稀有', color: '#2196f3', multiplier: 2 },
  epic: { name: '史诗', color: '#9c27b0', multiplier: 3 },
  legendary: { name: '仙器', color: '#ff9800', multiplier: 5 },
  divine: { name: '神话', color: '#e91e63', multiplier: 8 },
  primordial: { name: '太古', color: '#ffd700', multiplier: 12 }
} as const

export type QualityId = keyof typeof QUALITIES

// 装备类型
export type EquipmentType = 'weapon' | 'armor' | 'helmet' | 'pants' | 'boots' | 'necklace' | 'ring'

// ==================== 套装系统 ====================

// 套装效果
export interface SetBonus {
  pieces: number      // 需要件数
  name: string        // 效果名称
  description: string // 效果描述
  attackPercent: number   // 攻击力加成百分比
  defensePercent: number  // 防御力加成百分比
  hpPercent: number       // 生命值加成百分比
  critRate: number        // 暴击率加成
  spiritPerSec: number    // 灵气/秒加成
  lifesteal: number       // 吸血比例
}

// 套装配置
export interface SetConfig {
  id: string
  name: string              // 套装名称
  prefix: string            // 装备前缀
  color: string             // 套装颜色
  description: string       // 套装描述
  realmIndex: number        // 对应境界索引
  minLevel: number          // 最低等级要求
  baseAttack: number        // 基础攻击力
  baseDefense: number       // 基础防御力
  baseHp: number            // 基础生命值
  bonuses: SetBonus[]       // 套装效果
}

// 套装定义 —— 数据来源：data/equipment/set_configs.csv & set_bonuses.csv
// 通过 equipmentLoader 在运行时解析，此处导出懒加载代理
import { getSetConfigs as _getSetConfigs, getSetEquipmentTemplates as _getSetEquipmentTemplates } from '@/utils/equipmentLoader'

export const SET_CONFIGS: SetConfig[] = /* @__PURE__ */ _getSetConfigs()

// 套装装备模板（每个套装6件核心装备）—— 数据来源：data/equipment/set_items.csv
export const SET_EQUIPMENT_TEMPLATES: Record<string, { name: string; type: EquipmentType; slotIndex: number }[]> = /* @__PURE__ */ _getSetEquipmentTemplates()

// 套装部件类型
export interface SetPiece {
  setId: string
  pieceIndex: number  // 0-5，对应6个装备槽位
}

// ==================== 阵法系统 ====================

// 阵法节点类型
export type FormationNodeType = 'spirit' | 'capacity' | 'efficiency'

// 阵法节点状态
export interface FormationNode {
  type: FormationNodeType      // 节点类型
  level: number                // 当前等级 (0-10)
  activated: boolean           // 是否已激活
}

// 阵法节点配置
export interface FormationNodeConfig {
  type: FormationNodeType
  name: string                  // 节点名称
  icon: string                  // 图标
  description: string           // 效果描述
  baseEffect: number            // 基础效果值
  perLevelBonus: number         // 每级增加效果
  maxLevel: number              // 最大等级
  baseCost: number              // 基础灵石消耗
  costIncrease: number          // 每级增加消耗
}

// 阵法配置
export interface FormationConfig {
  id: string
  name: string                  // 阵法名称
  realmIndex: number            // 对应境界索引
  description: string           // 阵法描述
  icon: string                  // 阵法图标
  color: string                 // 阵法颜色
  nodes: FormationNodeConfig[]  // 包含的节点
  totalBonus: {                 // 满级总效果
    spiritBonus: number         // 灵气/秒加成
    capacityBonus: number       // 灵气容量加成
    efficiencyBonus: number     // 灵气效率百分比
  }
}

// 阵法配置（每个境界一个阵法，每个阵法3个节点）
export const FORMATION_CONFIGS: FormationConfig[] = [
  // ==================== 炼气期：聚灵阵 ====================
  {
    id: 'juling',
    name: '聚灵阵',
    realmIndex: 0,
    description: '最简单的灵气聚集阵法，适合初入修炼的修士',
    icon: '🌱',
    color: '#8bc34a',
    nodes: [
      { type: 'spirit', name: '灵窍', icon: '💧', description: '灵气汇聚加快', baseEffect: 0.5, perLevelBonus: 0.2, maxLevel: 10, baseCost: 50, costIncrease: 30 },
      { type: 'capacity', name: '灵池', icon: '🕳️', description: '灵气容量扩大', baseEffect: 20, perLevelBonus: 10, maxLevel: 10, baseCost: 40, costIncrease: 25 },
      { type: 'efficiency', name: '灵纹', icon: '✨', description: '灵气利用效率提升', baseEffect: 3, perLevelBonus: 2, maxLevel: 10, baseCost: 60, costIncrease: 40 }
    ],
    totalBonus: { spiritBonus: 2.5, capacityBonus: 120, efficiencyBonus: 23 }
  },
  // ==================== 筑基期：灵引阵 ====================
  {
    id: 'lingyin',
    name: '灵引阵',
    realmIndex: 1,
    description: '引导灵气流转，使修炼事半功倍',
    icon: '💠',
    color: '#03a9f4',
    nodes: [
      { type: 'spirit', name: '灵泉', icon: '⛲', description: '灵气如泉涌出', baseEffect: 1.5, perLevelBonus: 0.5, maxLevel: 10, baseCost: 150, costIncrease: 80 },
      { type: 'capacity', name: '灵海', icon: '🌊', description: '灵气如海般深邃', baseEffect: 60, perLevelBonus: 25, maxLevel: 10, baseCost: 120, costIncrease: 60 },
      { type: 'efficiency', name: '灵网', icon: '🕸️', description: '灵气脉络四通八达', baseEffect: 5, perLevelBonus: 3, maxLevel: 10, baseCost: 180, costIncrease: 100 }
    ],
    totalBonus: { spiritBonus: 6.5, capacityBonus: 310, efficiencyBonus: 35 }
  },
  // ==================== 金丹期：凝元阵 ====================
  {
    id: 'ningyuan',
    name: '凝元阵',
    realmIndex: 2,
    description: '凝聚天地元气，孕育无上金丹',
    icon: '🔮',
    color: '#ff5722',
    nodes: [
      { type: 'spirit', name: '元池', icon: '🔥', description: '元气汇聚成池', baseEffect: 3, perLevelBonus: 1, maxLevel: 10, baseCost: 400, costIncrease: 200 },
      { type: 'capacity', name: '元海', icon: '☀️', description: '元力浩瀚如海', baseEffect: 150, perLevelBonus: 60, maxLevel: 10, baseCost: 320, costIncrease: 160 },
      { type: 'efficiency', name: '元纹', icon: '⚡', description: '元力流转无阻', baseEffect: 8, perLevelBonus: 4, maxLevel: 10, baseCost: 480, costIncrease: 240 }
    ],
    totalBonus: { spiritBonus: 13, capacityBonus: 750, efficiencyBonus: 48 }
  },
  // ==================== 元婴期：纳虚阵 ====================
  {
    id: 'naxu',
    name: '纳虚阵',
    realmIndex: 3,
    description: '吸纳天地精华，孕育元婴',
    icon: '🌟',
    color: '#9c27b0',
    nodes: [
      { type: 'spirit', name: '虚窍', icon: '🌙', description: '虚空中汲取灵气', baseEffect: 5, perLevelBonus: 2, maxLevel: 10, baseCost: 1000, costIncrease: 500 },
      { type: 'capacity', name: '虚渊', icon: '🕳️', description: '深不见底的虚渊', baseEffect: 300, perLevelBonus: 120, maxLevel: 10, baseCost: 800, costIncrease: 400 },
      { type: 'efficiency', name: '虚网', icon: '🌐', description: '虚实交织的灵网', baseEffect: 12, perLevelBonus: 6, maxLevel: 10, baseCost: 1200, costIncrease: 600 }
    ],
    totalBonus: { spiritBonus: 25, capacityBonus: 1500, efficiencyBonus: 72 }
  },
  // ==================== 出窍期：太虚阵 ====================
  {
    id: 'taixu_formation',
    name: '太虚阵',
    realmIndex: 4,
    description: '太虚之气环绕，神识遨游天地',
    icon: '🔯',
    color: '#607d8b',
    nodes: [
      { type: 'spirit', name: '太虚灵窍', icon: '🌫️', description: '太虚之气凝聚', baseEffect: 8, perLevelBonus: 3, maxLevel: 10, baseCost: 2500, costIncrease: 1200 },
      { type: 'capacity', name: '太虚灵海', icon: '🌌', description: '灵气如星河倒悬', baseEffect: 500, perLevelBonus: 200, maxLevel: 10, baseCost: 2000, costIncrease: 1000 },
      { type: 'efficiency', name: '太虚灵纹', icon: '✴️', description: '大道至简的灵纹', baseEffect: 15, perLevelBonus: 8, maxLevel: 10, baseCost: 3000, costIncrease: 1500 }
    ],
    totalBonus: { spiritBonus: 38, capacityBonus: 2500, efficiencyBonus: 95 }
  },
  // ==================== 化神期：天机阵 ====================
  {
    id: 'tianji',
    name: '天机阵',
    realmIndex: 5,
    description: '天机运转，洞悉天地奥秘',
    icon: '⭐',
    color: '#ffd700',
    nodes: [
      { type: 'spirit', name: '天窍', icon: '☄️', description: '天机灵窍', baseEffect: 12, perLevelBonus: 5, maxLevel: 10, baseCost: 6000, costIncrease: 3000 },
      { type: 'capacity', name: '天池', icon: '🌈', description: '天机灵气之池', baseEffect: 800, perLevelBonus: 350, maxLevel: 10, baseCost: 5000, costIncrease: 2500 },
      { type: 'efficiency', name: '天网', icon: '🕸️', description: '天罗地网般的灵脉', baseEffect: 20, perLevelBonus: 10, maxLevel: 10, baseCost: 7200, costIncrease: 3600 }
    ],
    totalBonus: { spiritBonus: 62, capacityBonus: 4300, efficiencyBonus: 120 }
  },
  // ==================== 合体期：混沌阵 ====================
  {
    id: 'hundun',
    name: '混沌阵',
    realmIndex: 6,
    description: '混沌初开，蕴含创世之力',
    icon: '⚫',
    color: '#e91e63',
    nodes: [
      { type: 'spirit', name: '混沌灵窍', icon: '🌪️', description: '混沌灵气漩涡', baseEffect: 18, perLevelBonus: 8, maxLevel: 10, baseCost: 15000, costIncrease: 7500 },
      { type: 'capacity', name: '混沌灵海', icon: '🌀', description: '混沌如海', baseEffect: 1200, perLevelBonus: 500, maxLevel: 10, baseCost: 12000, costIncrease: 6000 },
      { type: 'efficiency', name: '混沌灵纹', icon: '🔮', description: '混沌化生的灵纹', baseEffect: 25, perLevelBonus: 12, maxLevel: 10, baseCost: 18000, costIncrease: 9000 }
    ],
    totalBonus: { spiritBonus: 98, capacityBonus: 6200, efficiencyBonus: 145 }
  },
  // ==================== 渡劫期：天劫阵 ====================
  {
    id: 'tianjie_formation',
    name: '天劫阵',
    realmIndex: 7,
    description: '历经天劫淬炼，阵法蕴含天威',
    icon: '⛈️',
    color: '#00bcd4',
    nodes: [
      { type: 'spirit', name: '劫窍', icon: '⚡', description: '吸收天劫之力', baseEffect: 25, perLevelBonus: 12, maxLevel: 10, baseCost: 35000, costIncrease: 18000 },
      { type: 'capacity', name: '劫池', icon: '🌊', description: '天劫灵气汇聚', baseEffect: 1800, perLevelBonus: 800, maxLevel: 10, baseCost: 28000, costIncrease: 14000 },
      { type: 'efficiency', name: '劫网', icon: '💫', description: '天劫灵纹网络', baseEffect: 30, perLevelBonus: 15, maxLevel: 10, baseCost: 42000, costIncrease: 21000 }
    ],
    totalBonus: { spiritBonus: 145, capacityBonus: 9800, efficiencyBonus: 180 }
  },
  // ==================== 大乘期：仙道阵 ====================
  {
    id: 'xiandao_formation',
    name: '仙道阵',
    realmIndex: 8,
    description: '仙道法则加持，阵法近乎通神',
    icon: '✨',
    color: '#ffffff',
    nodes: [
      { type: 'spirit', name: '仙窍', icon: '🌟', description: '仙道灵窍', baseEffect: 35, perLevelBonus: 18, maxLevel: 10, baseCost: 80000, costIncrease: 40000 },
      { type: 'capacity', name: '仙海', icon: '🌠', description: '仙力如海', baseEffect: 2500, perLevelBonus: 1200, maxLevel: 10, baseCost: 65000, costIncrease: 32000 },
      { type: 'efficiency', name: '仙纹', icon: '🔯', description: '仙道灵纹', baseEffect: 40, perLevelBonus: 20, maxLevel: 10, baseCost: 96000, costIncrease: 48000 }
    ],
    totalBonus: { spiritBonus: 215, capacityBonus: 14500, efficiencyBonus: 240 }
  },
  // ==================== 人仙期：大道阵 ====================
  {
    id: 'dadao_formation',
    name: '大道阵',
    realmIndex: 9,
    description: '大道至简，阵法蕴含天地至理',
    icon: '🌈',
    color: '#ff00ff',
    nodes: [
      { type: 'spirit', name: '道窍', icon: '💎', description: '大道灵窍', baseEffect: 50, perLevelBonus: 25, maxLevel: 10, baseCost: 200000, costIncrease: 100000 },
      { type: 'capacity', name: '道海', icon: '🌌', description: '道力无穷', baseEffect: 4000, perLevelBonus: 2000, maxLevel: 10, baseCost: 160000, costIncrease: 80000 },
      { type: 'efficiency', name: '道纹', icon: '☯️', description: '太极大道纹', baseEffect: 50, perLevelBonus: 25, maxLevel: 10, baseCost: 240000, costIncrease: 120000 }
    ],
    totalBonus: { spiritBonus: 300, capacityBonus: 24000, efficiencyBonus: 300 }
  }
]

// 玩家激活的阵法数据
export interface PlayerFormation {
  formationId: string           // 当前激活的阵法ID
  nodes: FormationNode[]         // 各节点状态
  realmIndex: number             // 解锁该阵法的境界
}

// 法宝技能类型
export type ArtifactSkillType = 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'summon'

// 法宝技能
export interface ArtifactSkill {
  id: string
  name: string
  description: string
  type: ArtifactSkillType
  value: number
  cooldown: number
  currentCooldown: number
}

// 法宝
export interface Artifact {
  id: string
  name: string
  quality: QualityId
  level: number
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  skill: Omit<ArtifactSkill, 'currentCooldown'>
  skillLevel: number
}

// 法宝模板（100种）
export const ARTIFACT_TEMPLATES: Record<string, Omit<Artifact, 'id'>> = {
  // ==================== 普通品质（炼气期）20种 ====================
  'spirit_sword': {
    name: '灵剑·青光', quality: 'common', level: 5,
    attackBonus: 30, defenseBonus: 5, hpBonus: 100,
    skill: { id: 'skill_001', name: '剑气斩', description: '对敌人造成120%攻击力的伤害', type: 'damage', value: 1.2, cooldown: 3 },
    skillLevel: 1
  },
  'peace_bottle': {
    name: '安神瓶', quality: 'common', level: 8,
    attackBonus: 15, defenseBonus: 20, hpBonus: 150,
    skill: { id: 'skill_002', name: '安神诀', description: '恢复自身15%最大生命值', type: 'heal', value: 0.15, cooldown: 4 },
    skillLevel: 1
  },
  'wooden_shield': {
    name: '木灵盾', quality: 'common', level: 6,
    attackBonus: 10, defenseBonus: 25, hpBonus: 120,
    skill: { id: 'skill_003', name: '木甲术', description: '生成等于自身30%防御力的护盾', type: 'shield', value: 0.3, cooldown: 4 },
    skillLevel: 1
  },
  'fire_bead': {
    name: '火灵珠', quality: 'common', level: 10,
    attackBonus: 45, defenseBonus: 8, hpBonus: 80,
    skill: { id: 'skill_004', name: '火球术', description: '对敌人造成100%攻击力的伤害', type: 'damage', value: 1.0, cooldown: 2 },
    skillLevel: 1
  },
  'water_charm': {
    name: '水灵符', quality: 'common', level: 7,
    attackBonus: 20, defenseBonus: 15, hpBonus: 130,
    skill: { id: 'skill_005', name: '水疗术', description: '恢复自身20%最大生命值', type: 'heal', value: 0.2, cooldown: 5 },
    skillLevel: 1
  },
  'wind_bell': {
    name: '清风铃', quality: 'common', level: 9,
    attackBonus: 35, defenseBonus: 12, hpBonus: 100,
    skill: { id: 'skill_006', name: '风刃', description: '对敌人造成110%攻击力的伤害', type: 'damage', value: 1.1, cooldown: 3 },
    skillLevel: 1
  },
  'earth_talisman': {
    name: '土灵符', quality: 'common', level: 8,
    attackBonus: 12, defenseBonus: 30, hpBonus: 140,
    skill: { id: 'skill_007', name: '厚土诀', description: '生成等于自身40%防御力的护盾', type: 'shield', value: 0.4, cooldown: 5 },
    skillLevel: 1
  },
  'ice_crystal': {
    name: '寒冰晶', quality: 'common', level: 10,
    attackBonus: 40, defenseBonus: 10, hpBonus: 90,
    skill: { id: 'skill_008', name: '冰刺', description: '对敌人造成105%攻击力的伤害，有几率减缓敌人速度', type: 'damage', value: 1.05, cooldown: 3 },
    skillLevel: 1
  },
  'lightning_pendant': {
    name: '雷引坠', quality: 'common', level: 12,
    attackBonus: 50, defenseBonus: 5, hpBonus: 70,
    skill: { id: 'skill_009', name: '雷击', description: '对敌人造成130%攻击力的伤害', type: 'damage', value: 1.3, cooldown: 4 },
    skillLevel: 1
  },
  'healing_pendant': {
    name: '愈心坠', quality: 'common', level: 11,
    attackBonus: 8, defenseBonus: 18, hpBonus: 180,
    skill: { id: 'skill_010', name: '愈心术', description: '恢复自身25%最大生命值', type: 'heal', value: 0.25, cooldown: 5 },
    skillLevel: 1
  },
  'iron_fan': {
    name: '铁折扇', quality: 'common', level: 9,
    attackBonus: 38, defenseBonus: 15, hpBonus: 95,
    skill: { id: 'skill_011', name: '风卷残云', description: '对敌人造成115%攻击力的伤害', type: 'damage', value: 1.15, cooldown: 3 },
    skillLevel: 1
  },
  'jade_rings': {
    name: '玉环', quality: 'common', level: 10,
    attackBonus: 18, defenseBonus: 22, hpBonus: 125,
    skill: { id: 'skill_012', name: '光环护体', description: '生成等于自身35%防御力的护盾', type: 'shield', value: 0.35, cooldown: 4 },
    skillLevel: 1
  },
  'thunder_stone': {
    name: '雷鸣石', quality: 'common', level: 13,
    attackBonus: 55, defenseBonus: 3, hpBonus: 65,
    skill: { id: 'skill_013', name: '落雷', description: '对敌人造成140%攻击力的伤害', type: 'damage', value: 1.4, cooldown: 4 },
    skillLevel: 1
  },
  'moon_mirror': {
    name: '月华镜', quality: 'common', level: 11,
    attackBonus: 25, defenseBonus: 20, hpBonus: 140,
    skill: { id: 'skill_014', name: '月华普照', description: '恢复自身22%最大生命值', type: 'heal', value: 0.22, cooldown: 5 },
    skillLevel: 1
  },
  'bamboo_staff': {
    name: '青竹杖', quality: 'common', level: 8,
    attackBonus: 22, defenseBonus: 28, hpBonus: 110,
    skill: { id: 'skill_015', name: '坚韧', description: '生成等于自身45%防御力的护盾', type: 'shield', value: 0.45, cooldown: 5 },
    skillLevel: 1
  },
  'cloud_robe': {
    name: '云雾袍', quality: 'common', level: 12,
    attackBonus: 10, defenseBonus: 35, hpBonus: 160,
    skill: { id: 'skill_016', name: '云雾缭绕', description: '生成等于自身50%防御力的护盾', type: 'shield', value: 0.5, cooldown: 5 },
    skillLevel: 1
  },
  'fire_fan': {
    name: '烈火扇', quality: 'common', level: 14,
    attackBonus: 60, defenseBonus: 5, hpBonus: 60,
    skill: { id: 'skill_017', name: '烈火掌', description: '对敌人造成125%攻击力的伤害', type: 'damage', value: 1.25, cooldown: 3 },
    skillLevel: 1
  },
  'herb_pouch': {
    name: '灵草囊', quality: 'common', level: 10,
    attackBonus: 12, defenseBonus: 15, hpBonus: 200,
    skill: { id: 'skill_018', name: '灵草疗伤', description: '恢复自身30%最大生命值', type: 'heal', value: 0.3, cooldown: 6 },
    skillLevel: 1
  },
  'metal_ball': {
    name: '混元球', quality: 'common', level: 11,
    attackBonus: 28, defenseBonus: 25, hpBonus: 115,
    skill: { id: 'skill_019', name: '混元击', description: '对敌人造成118%攻击力的伤害', type: 'damage', value: 1.18, cooldown: 3 },
    skillLevel: 1
  },
  'spring_brush': {
    name: '春毫笔', quality: 'common', level: 9,
    attackBonus: 20, defenseBonus: 18, hpBonus: 145,
    skill: { id: 'skill_020', name: '春回大地', description: '恢复自身18%最大生命值', type: 'heal', value: 0.18, cooldown: 4 },
    skillLevel: 1
  },

  // ==================== 优秀品质（筑基期）25种 ====================
  'silver_sword': {
    name: '银霜剑', quality: 'good', level: 15,
    attackBonus: 85, defenseBonus: 20, hpBonus: 250,
    skill: { id: 'skill_021', name: '银光斩', description: '对敌人造成150%攻击力的伤害', type: 'damage', value: 1.5, cooldown: 3 },
    skillLevel: 1
  },
  'jade_bottle': {
    name: '玉净瓶', quality: 'epic', level: 30,
    attackBonus: 80, defenseBonus: 100, hpBonus: 1200,
    skill: { id: 'skill_022', name: '甘露术', description: '恢复自身30%最大生命值', type: 'heal', value: 0.3, cooldown: 5 },
    skillLevel: 1
  },
  'tower_essence': {
    name: '玲珑塔', quality: 'epic', level: 35,
    attackBonus: 60, defenseBonus: 200, hpBonus: 2000,
    skill: { id: 'skill_023', name: '护体神光', description: '生成等于自身50%防御力的护盾', type: 'shield', value: 0.5, cooldown: 4 },
    skillLevel: 1
  },
  'thunder_drum': {
    name: '雷神鼓', quality: 'legendary', level: 45,
    attackBonus: 300, defenseBonus: 100, hpBonus: 1500,
    skill: { id: 'skill_024', name: '雷霆万钧', description: '对所有敌人造成200%攻击力的伤害', type: 'damage', value: 2.0, cooldown: 6 },
    skillLevel: 1
  },
  'yin_yang_mirror': {
    name: '阴阳镜', quality: 'legendary', level: 50,
    attackBonus: 200, defenseBonus: 150, hpBonus: 3000,
    skill: { id: 'skill_025', name: '生死转换', description: '将受到伤害的50%转化为治疗', type: 'buff', value: 0.5, cooldown: 8 },
    skillLevel: 1
  },
  'azure_cloud_sword': {
    name: '青云剑', quality: 'good', level: 18,
    attackBonus: 100, defenseBonus: 25, hpBonus: 280,
    skill: { id: 'skill_026', name: '青云直上', description: '对敌人造成155%攻击力的伤害', type: 'damage', value: 1.55, cooldown: 3 },
    skillLevel: 1
  },
  'phoenix_flame_fan': {
    name: '凤凰火扇', quality: 'good', level: 20,
    attackBonus: 120, defenseBonus: 15, hpBonus: 200,
    skill: { id: 'skill_027', name: '凤羽天降', description: '对敌人造成160%攻击力的伤害，附带灼烧效果', type: 'damage', value: 1.6, cooldown: 4 },
    skillLevel: 1
  },
  'moonlight_robe': {
    name: '月光袍', quality: 'good', level: 19,
    attackBonus: 30, defenseBonus: 60, hpBonus: 350,
    skill: { id: 'skill_028', name: '月华护体', description: '生成等于自身60%防御力的护盾', type: 'shield', value: 0.6, cooldown: 5 },
    skillLevel: 1
  },
  'golden_bell': {
    name: '金钟罩', quality: 'good', level: 22,
    attackBonus: 25, defenseBonus: 80, hpBonus: 400,
    skill: { id: 'skill_029', name: '金钟护体', description: '生成等于自身70%防御力的护盾', type: 'shield', value: 0.7, cooldown: 5 },
    skillLevel: 1
  },
  'jade_spirit_bottle': {
    name: '玉灵瓶', quality: 'good', level: 21,
    attackBonus: 45, defenseBonus: 40, hpBonus: 380,
    skill: { id: 'skill_030', name: '灵液回春', description: '恢复自身35%最大生命值', type: 'heal', value: 0.35, cooldown: 5 },
    skillLevel: 1
  },
  'crimson_blade': {
    name: '赤焰刀', quality: 'good', level: 23,
    attackBonus: 130, defenseBonus: 20, hpBonus: 220,
    skill: { id: 'skill_031', name: '赤焰斩', description: '对敌人造成165%攻击力的伤害', type: 'damage', value: 1.65, cooldown: 3 },
    skillLevel: 1
  },
  'frost_pendant': {
    name: '玄冰坠', quality: 'good', level: 24,
    attackBonus: 95, defenseBonus: 45, hpBonus: 300,
    skill: { id: 'skill_032', name: '玄冰刺', description: '对敌人造成145%攻击力的伤害，有几率冻结敌人', type: 'damage', value: 1.45, cooldown: 4 },
    skillLevel: 1
  },
  'wind_ruler': {
    name: '风灵尺', quality: 'good', level: 20,
    attackBonus: 110, defenseBonus: 30, hpBonus: 260,
    skill: { id: 'skill_033', name: '风卷残云', description: '对敌人造成150%攻击力的伤害', type: 'damage', value: 1.5, cooldown: 3 },
    skillLevel: 1
  },
  'earth_gem': {
    name: '厚土珠', quality: 'good', level: 22,
    attackBonus: 40, defenseBonus: 90, hpBonus: 420,
    skill: { id: 'skill_034', name: '大地之护', description: '生成等于自身80%防御力的护盾', type: 'shield', value: 0.8, cooldown: 6 },
    skillLevel: 1
  },
  'herb_sprout_bottle': {
    name: '灵芽瓶', quality: 'good', level: 21,
    attackBonus: 35, defenseBonus: 35, hpBonus: 450,
    skill: { id: 'skill_035', name: '枯木逢春', description: '恢复自身40%最大生命值', type: 'heal', value: 0.4, cooldown: 6 },
    skillLevel: 1
  },
  'thunder_eye': {
    name: '雷眼', quality: 'good', level: 25,
    attackBonus: 140, defenseBonus: 15, hpBonus: 180,
    skill: { id: 'skill_036', name: '天雷滚滚', description: '对敌人造成170%攻击力的伤害', type: 'damage', value: 1.7, cooldown: 4 },
    skillLevel: 1
  },
  'spirit_banner': {
    name: '灵幡', quality: 'good', level: 23,
    attackBonus: 80, defenseBonus: 55, hpBonus: 320,
    skill: { id: 'skill_037', name: '灵魂之力', description: '增加自身攻击力20%，持续3回合', type: 'buff', value: 0.2, cooldown: 7 },
    skillLevel: 1
  },
  'nine_clover': {
    name: '九转还魂草', quality: 'good', level: 24,
    attackBonus: 25, defenseBonus: 30, hpBonus: 500,
    skill: { id: 'skill_038', name: '九转回魂', description: '恢复自身50%最大生命值', type: 'heal', value: 0.5, cooldown: 8 },
    skillLevel: 1
  },
  'black_iron_hammer': {
    name: '玄铁锤', quality: 'good', level: 26,
    attackBonus: 150, defenseBonus: 25, hpBonus: 200,
    skill: { id: 'skill_039', name: '重锤击', description: '对敌人造成180%攻击力的伤害', type: 'damage', value: 1.8, cooldown: 4 },
    skillLevel: 1
  },
  'cloud_step_shoes': {
    name: '云步鞋', quality: 'good', level: 20,
    attackBonus: 60, defenseBonus: 70, hpBonus: 340,
    skill: { id: 'skill_040', name: '云盾术', description: '生成等于自身65%防御力的护盾', type: 'shield', value: 0.65, cooldown: 5 },
    skillLevel: 1
  },
  'dragon_scale_armor': {
    name: '龙鳞甲', quality: 'good', level: 28,
    attackBonus: 50, defenseBonus: 100, hpBonus: 480,
    skill: { id: 'skill_041', name: '龙鳞护体', description: '生成等于自身85%防御力的护盾', type: 'shield', value: 0.85, cooldown: 6 },
    skillLevel: 1
  },
  'blood_flower': {
    name: '血花', quality: 'good', level: 25,
    attackBonus: 125, defenseBonus: 35, hpBonus: 280,
    skill: { id: 'skill_042', name: '嗜血一击', description: '对敌人造成160%攻击力的伤害，吸取30%伤害转化为生命', type: 'damage', value: 1.6, cooldown: 5 },
    skillLevel: 1
  },
  'five_thunder_whip': {
    name: '五雷鞭', quality: 'good', level: 27,
    attackBonus: 145, defenseBonus: 20, hpBonus: 210,
    skill: { id: 'skill_043', name: '五雷轰顶', description: '对敌人造成175%攻击力的伤害', type: 'damage', value: 1.75, cooldown: 4 },
    skillLevel: 1
  },
  'spirit_binding_net': {
    name: '缚魂网', quality: 'good', level: 26,
    attackBonus: 70, defenseBonus: 60, hpBonus: 350,
    skill: { id: 'skill_044', name: '灵魂锁链', description: '减少敌人攻击力15%，持续2回合', type: 'debuff', value: 0.15, cooldown: 6 },
    skillLevel: 1
  },
  'pure_essence_bottle': {
    name: '纯元瓶', quality: 'good', level: 28,
    attackBonus: 55, defenseBonus: 50, hpBonus: 520,
    skill: { id: 'skill_045', name: '纯元润体', description: '恢复自身45%最大生命值', type: 'heal', value: 0.45, cooldown: 6 },
    skillLevel: 1
  },

  // ==================== 稀有品质（金丹期）25种 ====================
  'crystal_sword': {
    name: '晶芒剑', quality: 'rare', level: 30,
    attackBonus: 180, defenseBonus: 40, hpBonus: 450,
    skill: { id: 'skill_046', name: '晶芒破空', description: '对敌人造成180%攻击力的伤害', type: 'damage', value: 1.8, cooldown: 3 },
    skillLevel: 1
  },
  'azure_dragon_sword': {
    name: '青龙剑', quality: 'rare', level: 35,
    attackBonus: 220, defenseBonus: 50, hpBonus: 500,
    skill: { id: 'skill_047', name: '青龙摆尾', description: '对敌人造成200%攻击力的伤害', type: 'damage', value: 2.0, cooldown: 4 },
    skillLevel: 1
  },
  'sun_moon_bottle': {
    name: '日月瓶', quality: 'rare', level: 32,
    attackBonus: 100, defenseBonus: 120, hpBonus: 800,
    skill: { id: 'skill_048', name: '日月精华', description: '恢复自身55%最大生命值', type: 'heal', value: 0.55, cooldown: 6 },
    skillLevel: 1
  },
  'seven_star_dart': {
    name: '七星镖', quality: 'rare', level: 34,
    attackBonus: 200, defenseBonus: 35, hpBonus: 380,
    skill: { id: 'skill_049', name: '七星连珠', description: '对敌人造成190%攻击力的伤害', type: 'damage', value: 1.9, cooldown: 3 },
    skillLevel: 1
  },
  'nine_dragon_ring': {
    name: '九龙环', quality: 'rare', level: 36,
    attackBonus: 160, defenseBonus: 100, hpBonus: 600,
    skill: { id: 'skill_050', name: '九龙出海', description: '对所有敌人造成150%攻击力的伤害', type: 'damage', value: 1.5, cooldown: 5 },
    skillLevel: 1
  },
  'golden_tower': {
    name: '金塔', quality: 'rare', level: 38,
    attackBonus: 80, defenseBonus: 200, hpBonus: 1000,
    skill: { id: 'skill_051', name: '金光护体', description: '生成等于自身100%防御力的护盾', type: 'shield', value: 1.0, cooldown: 6 },
    skillLevel: 1
  },
  'red_cloud_robe': {
    name: '红云袍', quality: 'rare', level: 33,
    attackBonus: 120, defenseBonus: 150, hpBonus: 750,
    skill: { id: 'skill_052', name: '红云护法', description: '生成等于自身90%防御力的护盾', type: 'shield', value: 0.9, cooldown: 5 },
    skillLevel: 1
  },
  'thousand_mile_eye': {
    name: '千里眼', quality: 'rare', level: 35,
    attackBonus: 190, defenseBonus: 60, hpBonus: 480,
    skill: { id: 'skill_053', name: '洞察先机', description: '增加自身攻击力25%，持续3回合', type: 'buff', value: 0.25, cooldown: 7 },
    skillLevel: 1
  },
  'life_death_flag': {
    name: '生死幡', quality: 'rare', level: 37,
    attackBonus: 210, defenseBonus: 45, hpBonus: 420,
    skill: { id: 'skill_054', name: '生死一念', description: '对敌人造成210%攻击力的伤害', type: 'damage', value: 2.1, cooldown: 4 },
    skillLevel: 1
  },
  'green_mushroom': {
    name: '灵芝', quality: 'rare', level: 36,
    attackBonus: 70, defenseBonus: 80, hpBonus: 1100,
    skill: { id: 'skill_055', name: '起死回生', description: '恢复自身70%最大生命值', type: 'heal', value: 0.7, cooldown: 8 },
    skillLevel: 1
  },
  'sky_hammer': {
    name: '天锤', quality: 'rare', level: 40,
    attackBonus: 250, defenseBonus: 30, hpBonus: 350,
    skill: { id: 'skill_056', name: '开天辟地', description: '对敌人造成230%攻击力的伤害', type: 'damage', value: 2.3, cooldown: 5 },
    skillLevel: 1
  },
  'five_element_ball': {
    name: '五行珠', quality: 'rare', level: 38,
    attackBonus: 170, defenseBonus: 110, hpBonus: 650,
    skill: { id: 'skill_057', name: '五行轮转', description: '对敌人造成185%攻击力的伤害，并减少其防御力20%', type: 'damage', value: 1.85, cooldown: 4 },
    skillLevel: 1
  },
  'ghost_head_vase': {
    name: '摄魂瓶', quality: 'rare', level: 39,
    attackBonus: 140, defenseBonus: 90, hpBonus: 580,
    skill: { id: 'skill_058', name: '摄魂夺魄', description: '减少敌人攻击力30%，持续3回合', type: 'debuff', value: 0.3, cooldown: 7 },
    skillLevel: 1
  },
  'celestial_sword': {
    name: '天璇剑', quality: 'rare', level: 42,
    attackBonus: 280, defenseBonus: 40, hpBonus: 400,
    skill: { id: 'skill_059', name: '天璇破军', description: '对敌人造成220%攻击力的伤害', type: 'damage', value: 2.2, cooldown: 4 },
    skillLevel: 1
  },
  'moon_reflecting_pool': {
    name: '映月池', quality: 'rare', level: 40,
    attackBonus: 90, defenseBonus: 140, hpBonus: 900,
    skill: { id: 'skill_060', name: '月华凝霜', description: '生成等于自身95%防御力的护盾', type: 'shield', value: 0.95, cooldown: 6 },
    skillLevel: 1
  },
  'fire_phoenix_flag': {
    name: '火凤幡', quality: 'rare', level: 41,
    attackBonus: 230, defenseBonus: 55, hpBonus: 460,
    skill: { id: 'skill_061', name: '凤舞九天', description: '对敌人造成200%攻击力的伤害，附带灼烧效果', type: 'damage', value: 2.0, cooldown: 4 },
    skillLevel: 1
  },
  'holy_water_vial': {
    name: '圣水瓶', quality: 'rare', level: 39,
    attackBonus: 85, defenseBonus: 100, hpBonus: 1050,
    skill: { id: 'skill_062', name: '圣光洗礼', description: '恢复自身60%最大生命值', type: 'heal', value: 0.6, cooldown: 7 },
    skillLevel: 1
  },
  'thunder_cloud_flag': {
    name: '雷云幡', quality: 'rare', level: 43,
    attackBonus: 260, defenseBonus: 35, hpBonus: 380,
    skill: { id: 'skill_063', name: '雷云翻滚', description: '对所有敌人造成160%攻击力的伤害', type: 'damage', value: 1.6, cooldown: 5 },
    skillLevel: 1
  },
  'mountain_moving_stamp': {
    name: '移山印', quality: 'rare', level: 42,
    attackBonus: 240, defenseBonus: 80, hpBonus: 520,
    skill: { id: 'skill_064', name: '山崩地裂', description: '对敌人造成215%攻击力的伤害', type: 'damage', value: 2.15, cooldown: 4 },
    skillLevel: 1
  },
  'world_tree_leaf': {
    name: '世界树叶', quality: 'rare', level: 41,
    attackBonus: 110, defenseBonus: 130, hpBonus: 980,
    skill: { id: 'skill_065', name: '生命绽放', description: '恢复自身65%最大生命值并增加20%防御', type: 'heal', value: 0.65, cooldown: 7 },
    skillLevel: 1
  },
  'demon_slayer_sword': {
    name: '斩魔剑', quality: 'rare', level: 44,
    attackBonus: 290, defenseBonus: 45, hpBonus: 420,
    skill: { id: 'skill_066', name: '诛魔斩', description: '对敌人造成240%攻击力的伤害', type: 'damage', value: 2.4, cooldown: 5 },
    skillLevel: 1
  },
  'ice_dragon_orb': {
    name: '冰龙珠', quality: 'rare', level: 43,
    attackBonus: 200, defenseBonus: 120, hpBonus: 600,
    skill: { id: 'skill_067', name: '冰龙吐息', description: '对敌人造成195%攻击力的伤害，有几率冻结', type: 'damage', value: 1.95, cooldown: 4 },
    skillLevel: 1
  },
  'chaos_bell': {
    name: '混沌钟', quality: 'rare', level: 45,
    attackBonus: 150, defenseBonus: 180, hpBonus: 850,
    skill: { id: 'skill_068', name: '混沌护体', description: '生成等于自身110%防御力的护盾', type: 'shield', value: 1.1, cooldown: 7 },
    skillLevel: 1
  },
  'soul_devouring_flag': {
    name: '噬魂幡', quality: 'rare', level: 44,
    attackBonus: 220, defenseBonus: 70, hpBonus: 500,
    skill: { id: 'skill_069', name: '魂噬天地', description: '对敌人造成205%攻击力的伤害，吸取20%伤害转化为生命', type: 'damage', value: 2.05, cooldown: 5 },
    skillLevel: 1
  },
  'immortal_calling_paper': {
    name: '召仙符', quality: 'rare', level: 42,
    attackBonus: 130, defenseBonus: 90, hpBonus: 720,
    skill: { id: 'skill_070', name: '召唤仙灵', description: '召唤一个仙灵助战，造成自身攻击力50%的伤害', type: 'summon', value: 0.5, cooldown: 8 },
    skillLevel: 1
  },

  // ==================== 史诗品质（元婴期-合体期）18种 ====================
  'eight_immortals_flask': {
    name: '八仙葫芦', quality: 'epic', level: 48,
    attackBonus: 250, defenseBonus: 200, hpBonus: 1800,
    skill: { id: 'skill_071', name: '八仙过海', description: '恢复自身80%最大生命值', type: 'heal', value: 0.8, cooldown: 7 },
    skillLevel: 1
  },
  'tianluo_disk': {
    name: '天罗伞', quality: 'epic', level: 50,
    attackBonus: 180, defenseBonus: 350, hpBonus: 2500,
    skill: { id: 'skill_072', name: '天罗地网', description: '生成等于自身150%防御力的护盾', type: 'shield', value: 1.5, cooldown: 8 },
    skillLevel: 1
  },
  'dragon_tiger_gauntlet': {
    name: '龙虎拳套', quality: 'epic', level: 52,
    attackBonus: 400, defenseBonus: 120, hpBonus: 1000,
    skill: { id: 'skill_073', name: '龙虎争锋', description: '对敌人造成280%攻击力的伤害', type: 'damage', value: 2.8, cooldown: 5 },
    skillLevel: 1
  },
  'heaven_earth_furnace': {
    name: '乾坤炉', quality: 'epic', level: 55,
    attackBonus: 300, defenseBonus: 280, hpBonus: 2200,
    skill: { id: 'skill_074', name: '炉火纯青', description: '对所有敌人造成200%攻击力的伤害', type: 'damage', value: 2.0, cooldown: 6 },
    skillLevel: 1
  },
  'world_destroying_blade': {
    name: '灭世刀', quality: 'epic', level: 58,
    attackBonus: 450, defenseBonus: 80, hpBonus: 800,
    skill: { id: 'skill_075', name: '毁灭斩击', description: '对敌人造成320%攻击力的伤害', type: 'damage', value: 3.2, cooldown: 6 },
    skillLevel: 1
  },
  'celestial_dragon_pearl': {
    name: '天龙珠', quality: 'epic', level: 56,
    attackBonus: 350, defenseBonus: 250, hpBonus: 2000,
    skill: { id: 'skill_076', name: '天龙出海', description: '对敌人造成260%攻击力的伤害，有几率眩晕', type: 'damage', value: 2.6, cooldown: 5 },
    skillLevel: 1
  },
  'phoenix_ Nirvana_fan': {
    name: '凤凰涅槃扇', quality: 'epic', level: 60,
    attackBonus: 420, defenseBonus: 180, hpBonus: 1500,
    skill: { id: 'skill_077', name: '涅槃之火', description: '对敌人造成290%攻击力的伤害，附带灼烧和吸血', type: 'damage', value: 2.9, cooldown: 5 },
    skillLevel: 1
  },
  'immortal_shield': {
    name: '仙盾', quality: 'epic', level: 54,
    attackBonus: 150, defenseBonus: 400, hpBonus: 3000,
    skill: { id: 'skill_078', name: '仙灵护体', description: '生成等于自身180%防御力的护盾', type: 'shield', value: 1.8, cooldown: 8 },
    skillLevel: 1
  },
  'chaotic_heaven_flag': {
    name: '混元幡', quality: 'epic', level: 57,
    attackBonus: 380, defenseBonus: 220, hpBonus: 1800,
    skill: { id: 'skill_079', name: '混元一气', description: '增加自身攻击力40%，持续4回合', type: 'buff', value: 0.4, cooldown: 10 },
    skillLevel: 1
  },
  'elixir_furnace': {
    name: '丹药炉', quality: 'epic', level: 55,
    attackBonus: 200, defenseBonus: 300, hpBonus: 2800,
    skill: { id: 'skill_080', name: '丹药回天', description: '恢复自身100%最大生命值', type: 'heal', value: 1.0, cooldown: 10 },
    skillLevel: 1
  },
  'world_ring': {
    name: '天地环', quality: 'epic', level: 59,
    attackBonus: 320, defenseBonus: 320, hpBonus: 2400,
    skill: { id: 'skill_081', name: '天地共鸣', description: '对所有敌人造成220%攻击力的伤害', type: 'damage', value: 2.2, cooldown: 6 },
    skillLevel: 1
  },
  'seven_kills_sword': {
    name: '七杀剑', quality: 'epic', level: 62,
    attackBonus: 480, defenseBonus: 100, hpBonus: 900,
    skill: { id: 'skill_082', name: '七杀诀', description: '对敌人造成350%攻击力的伤害', type: 'damage', value: 3.5, cooldown: 7 },
    skillLevel: 1
  },
  'thousand_soul_flag': {
    name: '千魂幡', quality: 'epic', level: 60,
    attackBonus: 360, defenseBonus: 200, hpBonus: 1600,
    skill: { id: 'skill_083', name: '万魂噬天', description: '对敌人造成270%攻击力的伤害，吸取30%伤害', type: 'damage', value: 2.7, cooldown: 5 },
    skillLevel: 1
  },
  'yuan_chen_flag': {
    name: '元辰镜', quality: 'epic', level: 58,
    attackBonus: 280, defenseBonus: 350, hpBonus: 2600,
    skill: { id: 'skill_084', name: '时光回溯', description: '减少敌人攻击力50%，持续3回合', type: 'debuff', value: 0.5, cooldown: 9 },
    skillLevel: 1
  },
  'celestial_master_seal': {
    name: '天师印', quality: 'epic', level: 65,
    attackBonus: 420, defenseBonus: 250, hpBonus: 2000,
    skill: { id: 'skill_085', name: '天师降魔', description: '对敌人造成310%攻击力的伤害', type: 'damage', value: 3.1, cooldown: 6 },
    skillLevel: 1
  },
  'nine heavens_furnace': {
    name: '九转炼丹炉', quality: 'epic', level: 63,
    attackBonus: 350, defenseBonus: 380, hpBonus: 3200,
    skill: { id: 'skill_086', name: '九转回阳', description: '恢复自身90%最大生命值并清除负面状态', type: 'heal', value: 0.9, cooldown: 9 },
    skillLevel: 1
  },
  'world_extinguishing_palm': {
    name: '灭世掌', quality: 'epic', level: 68,
    attackBonus: 500, defenseBonus: 150, hpBonus: 1100,
    skill: { id: 'skill_087', name: '灭世一击', description: '对敌人造成380%攻击力的伤害', type: 'damage', value: 3.8, cooldown: 8 },
    skillLevel: 1
  },
  'celestial_dragon_orb': {
    name: '天机珠', quality: 'epic', level: 66,
    attackBonus: 380, defenseBonus: 300, hpBonus: 2500,
    skill: { id: 'skill_088', name: '天机不可泄露', description: '增加自身攻击力35%并免疫控制，持续4回合', type: 'buff', value: 0.35, cooldown: 10 },
    skillLevel: 1
  },

  // ==================== 仙器品质（渡劫期-人仙期）12种 ====================
  'god_slaying_spear': {
    name: '弑神枪', quality: 'legendary', level: 70,
    attackBonus: 600, defenseBonus: 200, hpBonus: 3000,
    skill: { id: 'skill_089', name: '弑神一击', description: '对敌人造成450%攻击力的伤害', type: 'damage', value: 4.5, cooldown: 8 },
    skillLevel: 1
  },
  'world_destroying_furnace': {
    name: '灭世炉', quality: 'legendary', level: 75,
    attackBonus: 500, defenseBonus: 500, hpBonus: 8000,
    skill: { id: 'skill_090', name: '毁灭之火', description: '对所有敌人造成350%攻击力的伤害', type: 'damage', value: 3.5, cooldown: 7 },
    skillLevel: 1
  },
  'immortal_peach_branch': {
    name: '仙桃枝', quality: 'legendary', level: 72,
    attackBonus: 300, defenseBonus: 400, hpBonus: 10000,
    skill: { id: 'skill_091', name: '仙桃献寿', description: '恢复自身120%最大生命值', type: 'heal', value: 1.2, cooldown: 10 },
    skillLevel: 1
  },
  'celestial_fold': {
    name: '天机图', quality: 'legendary', level: 78,
    attackBonus: 450, defenseBonus: 450, hpBonus: 6000,
    skill: { id: 'skill_092', name: '天机神算', description: '增加自身攻击力60%并减少敌人防御40%，持续5回合', type: 'buff', value: 0.6, cooldown: 12 },
    skillLevel: 1
  },
  'ten_thousand_buddha_cup': {
    name: '万佛杯', quality: 'legendary', level: 76,
    attackBonus: 350, defenseBonus: 600, hpBonus: 9000,
    skill: { id: 'skill_093', name: '佛光普照', description: '生成等于自身200%防御力的护盾', type: 'shield', value: 2.0, cooldown: 10 },
    skillLevel: 1
  },
  'nine_yang_sword': {
    name: '九阳剑', quality: 'legendary', level: 80,
    attackBonus: 700, defenseBonus: 250, hpBonus: 3500,
    skill: { id: 'skill_094', name: '九阳破天', description: '对敌人造成500%攻击力的伤害', type: 'damage', value: 5.0, cooldown: 9 },
    skillLevel: 1
  },
  'world_origin_staff': {
    name: '太初杖', quality: 'legendary', level: 82,
    attackBonus: 550, defenseBonus: 550, hpBonus: 7000,
    skill: { id: 'skill_095', name: '太初之力', description: '对所有敌人造成400%攻击力的伤害', type: 'damage', value: 4.0, cooldown: 8 },
    skillLevel: 1
  },
  'three_pure_ones_flag': {
    name: '三清幡', quality: 'legendary', level: 85,
    attackBonus: 650, defenseBonus: 400, hpBonus: 5000,
    skill: { id: 'skill_096', name: '三清道祖', description: '召唤三位道祖助战，每位造成自身攻击力80%的伤害', type: 'summon', value: 0.8, cooldown: 15 },
    skillLevel: 1
  },
  'world_core_ring': {
    name: '混沌珠', quality: 'legendary', level: 88,
    attackBonus: 600, defenseBonus: 600, hpBonus: 10000,
    skill: { id: 'skill_097', name: '混沌归元', description: '免疫所有伤害2回合并反弹50%伤害', type: 'shield', value: 2.5, cooldown: 15 },
    skillLevel: 1
  },
  'creation_flag': {
    name: '创世幡', quality: 'legendary', level: 90,
    attackBonus: 800, defenseBonus: 500, hpBonus: 8000,
    skill: { id: 'skill_098', name: '创世之力', description: '对所有敌人造成550%攻击力的伤害', type: 'damage', value: 5.5, cooldown: 12 },
    skillLevel: 1
  },
  'celestial_eye': {
    name: '天道眼', quality: 'legendary', level: 92,
    attackBonus: 700, defenseBonus: 700, hpBonus: 12000,
    skill: { id: 'skill_099', name: '天眼洞察', description: '增加自身攻击力80%并免疫控制，持续6回合', type: 'buff', value: 0.8, cooldown: 15 },
    skillLevel: 1
  },
  'primordial_cauldron': {
    name: '元始丹炉', quality: 'legendary', level: 100,
    attackBonus: 1000, defenseBonus: 1000, hpBonus: 20000,
    skill: { id: 'skill_100', name: '元始归一', description: '恢复自身150%最大生命值，全属性提升50%持续5回合', type: 'heal', value: 1.5, cooldown: 20 },
    skillLevel: 1
  }
}

// 装备
export interface Equipment {
  id: string
  name: string
  type: EquipmentType
  quality: QualityId
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  // 套装属性
  setId?: string        // 所属套装ID
  setPieceIndex?: number // 套装部件索引 (0-5)
  // 强化属性
  enhancementLevel?: number  // 强化等级（0-无限）
}

// 装备栏类型
export interface EquipmentSlots {
  weapon?: Equipment
  armor?: Equipment
  helmet?: Equipment
  pants?: Equipment
  boots?: Equipment
  necklace?: Equipment
  ring1?: Equipment  // 戒指槽1（兼容旧数据）
  ring2?: Equipment  // 戒指槽2（兼容旧数据）
}

// 灵宠
export interface Pet {
  id: string
  name: string
  level: number
  attack: number
  defense: number
  ability: string
  spirit: number
  maxSpirit: number
  exp: number
  maxExp: number
  loyalty: number  // 亲密度
  grade: number     // 品阶 (1-5)
}

// 玩家
export interface Player {
  id: string
  name: string
  userId?: string  // 绑定的用户ID（用于账号关联）
  realmIndex: number
  realmLevel: number
  level: number  // 总等级
  hp: number
  maxHp: number
  mp: number  // 法力值
  maxMp: number
  sp: number  // 怒气/能量
  maxSp: number
  attack: number
  defense: number
  spiritEnergy: number
  spiritStones: number
  spiritRoot: number  // 灵根品质 (1-10)
  
  // 战斗属性
  critRate: number
  critDamage: number
  dodgeRate: number
  hitRate: number
  attackSpeed: number
  lifesteal: number
  damageReduction: number
  reflectDamage: number
  
  // 修炼属性
  wisdom: number      // 悟性
  willpower: number   // 意志力
  insight: number     // 感悟值
  maxInsight: number  // 感悟上限
  
  equipment: EquipmentSlots
  inventory: Equipment[]
  artifacts: Artifact[]
  equippedArtifactId?: string
  pets: Pet[]
  currentPetId?: string
  realmLevelExp: number
  totalKills: number
  lastOnline: number
  createdAt: number
  
  // 功法系统
  techniques: Technique[]
  equippedTechniqueIds: string[]  // 最多装备3个功法
  
  // 阵法系统
  formation?: PlayerFormation      // 当前激活的阵法
  unlockedFormations: string[]     // 已解锁的阵法ID列表
  
  // Engine系统数据
  buffs: any[]           // Buff列表
  shields: any[]         // 护盾列表
  injuries: any[]        // 伤势列表
  learnedSkills: string[] // 已学习的技能ID
  
  // 自动出售设置
  autoSellSetting?: AutoSellSetting

  // 秘境系统
  secretRealm?: PlayerSecretRealmState
}

// 自动出售设置
export interface AutoSellSetting {
  enabled: boolean        // 是否启用自动出售
  minQuality: EquipmentQuality  // 低于此品质的装备自动出售（不包括此品质）
  sellSetEquipment: boolean     // 是否自动出售套装装备
}

// 装备品质类型
// common→good→rare→epic→legendary→divine→primordial
export type EquipmentQuality = 'common' | 'good' | 'rare' | 'epic' | 'legendary' | 'divine' | 'primordial'

// 装备品质配置
export const EQUIPMENT_QUALITY_CONFIG = {
  common: { name: '普通', color: '#9e9e9e', multiplier: 1.0 },
  good: { name: '优秀', color: '#4caf50', multiplier: 1.5 },
  rare: { name: '稀有', color: '#2196f3', multiplier: 2.0 },
  epic: { name: '史诗', color: '#9c27b0', multiplier: 3.0 },
  legendary: { name: '仙器', color: '#ff9800', multiplier: 5.0 },
  divine: { name: '神话', color: '#e91e63', multiplier: 8.0 },
  primordial: { name: '太古', color: '#ffd700', multiplier: 12.0 }
}

// 怪物
export interface Monster {
  id: string
  name: string
  level: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  expReward: number
  stoneReward: number
  dropTable: DropRate[]
  boss: boolean
}

// 掉落表
export interface DropRate {
  itemId?: string
  itemName?: string
  quality?: QualityId
  type?: EquipmentType  // 装备类型（仅用于装备掉落）
  chance: number
  dropType?: 'equipment' | 'artifact' | 'pet' | 'technique'  // 特殊掉落类型
}

// 场景
export interface Scene {
  id: string
  name: string
  description: string
  minLevel: number
  maxLevel: number
  monsters: Monster[]
  canRest: boolean
  artifacts?: string[]  // 该场景可掉落的法宝ID
}

// 奇遇
export interface Encounter {
  id: string
  type: 'pet' | 'treasure' | 'herb' | 'legend'
  title: string
  description: string
  reward: any
  probability: number
}

// 世界配置 - 10个地图，每个对应10级区间(1-100级)
export const SCENES: Scene[] = [
  // ==================== 第1图：1-10级（炼气期）====================
  {
    id: 'spirit_forest',
    name: '灵气森林',
    description: '灵气充沛的森林，是修士起步的绝佳之地',
    minLevel: 1,
    maxLevel: 10,
    canRest: true,
    artifacts: ['spirit_sword', 'peace_bottle', 'wooden_shield', 'fire_bead', 'water_charm', 'wind_bell', 'earth_talisman', 'ice_crystal', 'lightning_pendant', 'healing_pendant', 'iron_fan', 'jade_rings', 'thunder_stone', 'moon_mirror', 'bamboo_staff', 'cloud_robe', 'fire_fan', 'herb_pouch', 'metal_ball', 'spring_brush'],
    monsters: [
      // 小怪等级1-9级
      { id: 'gray_rabbit', name: '灰兔', level: 1, hp: 40, maxHp: 40, attack: 6, defense: 2, expReward: 25, stoneReward: 8, boss: false, dropTable: [{ chance: 0.1, quality: 'common', type: 'weapon' }, { chance: 0.02, dropType: 'artifact', itemId: 'spirit_sword' }] },
      { id: 'forest_snake', name: '青蛇', level: 2, hp: 60, maxHp: 60, attack: 10, defense: 4, expReward: 20, stoneReward: 10, boss: false, dropTable: [{ chance: 0.12, quality: 'common', type: 'ring' }, { chance: 0.02, dropType: 'artifact', itemId: 'peace_bottle' }] },
      { id: 'wild_wolf', name: '野狼', level: 3, hp: 80, maxHp: 80, attack: 12, defense: 5, expReward: 28, stoneReward: 14, boss: false, dropTable: [{ chance: 0.15, quality: 'common', type: 'armor' }, { chance: 0.02, dropType: 'artifact', itemId: 'wooden_shield' }] },
      { id: 'wild_boar', name: '野猪', level: 4, hp: 110, maxHp: 110, attack: 16, defense: 7, expReward: 40, stoneReward: 20, boss: false, dropTable: [{ chance: 0.15, quality: 'good', type: 'boots' }, { chance: 0.02, dropType: 'artifact', itemId: 'fire_bead' }] },
      { id: 'spirit_fox', name: '灵狐', level: 5, hp: 140, maxHp: 140, attack: 20, defense: 8, expReward: 50, stoneReward: 22, boss: false, dropTable: [{ chance: 0.2, quality: 'good', type: 'necklace' }, { chance: 0.02, dropType: 'artifact', itemId: 'water_charm' }] },
      { id: 'spirit_butterfly', name: '灵蝶', level: 6, hp: 100, maxHp: 100, attack: 18, defense: 6, expReward: 50, stoneReward: 25, boss: false, dropTable: [{ chance: 0.18, quality: 'good', type: 'helmet' }, { chance: 0.02, dropType: 'artifact', itemId: 'wind_bell' }] },
      { id: 'forest_spider', name: '毒蛛', level: 7, hp: 160, maxHp: 160, attack: 22, defense: 9, expReward: 65, stoneReward: 32, boss: false, dropTable: [{ chance: 0.2, quality: 'rare', type: 'weapon' }, { chance: 0.02, dropType: 'artifact', itemId: 'earth_talisman' }] },
      { id: 'treant', name: '小树精', level: 8, hp: 200, maxHp: 200, attack: 25, defense: 12, expReward: 78, stoneReward: 36, boss: false, dropTable: [{ chance: 0.22, quality: 'rare', type: 'armor' }, { chance: 0.02, dropType: 'artifact', itemId: 'ice_crystal' }] },
      { id: 'forest_ape', name: '山猿', level: 9, hp: 250, maxHp: 250, attack: 30, defense: 15, expReward: 90, stoneReward: 42, boss: false, dropTable: [{ chance: 0.25, quality: 'rare', type: 'weapon' }, { chance: 0.02, dropType: 'artifact', itemId: 'lightning_pendant' }] },
      // BOSS固定10级
      { id: 'forest_boss', name: '千年树妖', level: 10, hp: 600, maxHp: 600, attack: 40, defense: 20, expReward: 350, stoneReward: 150, boss: true, dropTable: [{ chance: 0.5, quality: 'rare', type: 'weapon' }, { chance: 0.3, quality: 'good', type: 'helmet' }, { chance: 0.15, dropType: 'pet', itemName: '灵宠·小木灵', itemId: 'pet_wood' }, { chance: 0.05, dropType: 'artifact', itemId: 'thunder_stone' }] }
    ]
  },
  // ==================== 第2图：11-20级（筑基期）====================
  {
    id: 'misty_valley',
    name: '迷雾峡谷',
    description: '常年云雾缭绕的峡谷，隐藏着无数妖兽',
    minLevel: 11,
    maxLevel: 20,
    canRest: false,
    artifacts: ['silver_sword', 'azure_cloud_sword', 'phoenix_flame_fan', 'moonlight_robe', 'golden_bell', 'jade_spirit_bottle', 'crimson_blade', 'frost_pendant', 'wind_ruler', 'earth_gem', 'herb_sprout_bottle', 'thunder_eye', 'spirit_banner', 'nine_clover', 'black_iron_hammer', 'cloud_step_shoes', 'dragon_scale_armor', 'blood_flower', 'five_thunder_whip', 'spirit_binding_net', 'pure_essence_bottle', 'jade_bottle', 'tower_essence'],
    monsters: [
      // 小怪等级11-19级
      { id: 'mist_wolf', name: '雾狼', level: 11, hp: 280, maxHp: 280, attack: 45, defense: 18, expReward: 100, stoneReward: 50, boss: false, dropTable: [{ chance: 0.15, quality: 'rare', type: 'weapon' }, { chance: 0.03, dropType: 'artifact', itemId: 'silver_sword' }] },
      { id: 'poison_frog', name: '毒蛙', level: 12, hp: 250, maxHp: 250, attack: 50, defense: 15, expReward: 110, stoneReward: 55, boss: false, dropTable: [{ chance: 0.16, quality: 'rare', type: 'ring' }, { chance: 0.03, dropType: 'artifact', itemId: 'azure_cloud_sword' }] },
      { id: 'wind_eagle', name: '风鹰', level: 13, hp: 320, maxHp: 320, attack: 58, defense: 20, expReward: 125, stoneReward: 62, boss: false, dropTable: [{ chance: 0.18, quality: 'rare', type: 'boots' }, { chance: 0.03, dropType: 'artifact', itemId: 'phoenix_flame_fan' }] },
      { id: 'stone_golem', name: '石傀', level: 14, hp: 450, maxHp: 450, attack: 55, defense: 35, expReward: 195, stoneReward: 80, boss: false, dropTable: [{ chance: 0.2, quality: 'rare', type: 'armor' }, { chance: 0.03, dropType: 'artifact', itemId: 'moonlight_robe' }] },
      { id: 'earth_bear', name: '岩熊', level: 15, hp: 550, maxHp: 550, attack: 65, defense: 40, expReward: 160, stoneReward: 80, boss: false, dropTable: [{ chance: 0.22, quality: 'rare', type: 'helmet' }, { chance: 0.03, dropType: 'artifact', itemId: 'golden_bell' }] },
      { id: 'mist_tiger', name: '雾虎', level: 16, hp: 480, maxHp: 480, attack: 70, defense: 30, expReward: 180, stoneReward: 90, boss: false, dropTable: [{ chance: 0.24, quality: 'rare', type: 'weapon' }, { chance: 0.03, dropType: 'artifact', itemId: 'jade_spirit_bottle' }] },
      { id: 'venom_scorpion', name: '毒蝎', level: 17, hp: 380, maxHp: 380, attack: 75, defense: 22, expReward: 200, stoneReward: 100, boss: false, dropTable: [{ chance: 0.25, quality: 'epic', type: 'ring' }, { chance: 0.04, dropType: 'artifact', itemId: 'crimson_blade' }] },
      { id: 'crystal_beetle', name: '晶甲虫', level: 18, hp: 520, maxHp: 520, attack: 72, defense: 45, expReward: 220, stoneReward: 110, boss: false, dropTable: [{ chance: 0.26, quality: 'epic', type: 'armor' }, { chance: 0.04, dropType: 'artifact', itemId: 'frost_pendant' }] },
      { id: 'thunder_bird', name: '雷鸟', level: 19, hp: 450, maxHp: 450, attack: 85, defense: 25, expReward: 250, stoneReward: 125, boss: false, dropTable: [{ chance: 0.28, quality: 'epic', type: 'necklace' }, { chance: 0.04, dropType: 'artifact', itemId: 'wind_ruler' }] },
      // BOSS固定20级
      { id: 'valley_boss', name: '峡谷巨蟒', level: 20, hp: 2000, maxHp: 2000, attack: 120, defense: 60, expReward: 1200, stoneReward: 500, boss: true, dropTable: [{ chance: 0.6, quality: 'epic', type: 'weapon' }, { chance: 0.3, quality: 'legendary', type: 'armor' }, { chance: 0.15, dropType: 'pet', itemName: '灵宠·白蛇', itemId: 'pet_white_snake' }, { chance: 0.1, dropType: 'artifact', itemId: 'jade_bottle' }] }
    ]
  },
  // ==================== 第3图：21-30级（金丹期）====================
  {
    id: 'flame_mountain',
    name: '烈焰山脉',
    description: '火山活跃的地带，火属性妖兽横行',
    minLevel: 21,
    maxLevel: 30,
    canRest: false,
    artifacts: ['crystal_sword', 'azure_dragon_sword', 'sun_moon_bottle', 'seven_star_dart', 'nine_dragon_ring', 'golden_tower', 'red_cloud_robe', 'thousand_mile_eye', 'life_death_flag', 'green_mushroom', 'sky_hammer', 'five_element_ball', 'ghost_head_vase', 'celestial_sword', 'moon_reflecting_pool', 'fire_phoenix_flag', 'holy_water_vial', 'thunder_cloud_flag', 'mountain_moving_stamp', 'world_tree_leaf', 'demon_slayer_sword', 'ice_dragon_orb', 'chaos_bell', 'soul_devouring_flag', 'immortal_calling_paper'],
    monsters: [
      // 小怪等级21-29级
      { id: 'fire_wolf', name: '炎狼', level: 21, hp: 650, maxHp: 650, attack: 95, defense: 35, expReward: 350, stoneReward: 150, boss: false, dropTable: [{ chance: 0.2, quality: 'rare', type: 'weapon' }, { chance: 0.04, dropType: 'artifact', itemId: 'crystal_sword' }] },
      { id: 'lava_slug', name: '熔岩蛞蝓', level: 22, hp: 800, maxHp: 800, attack: 80, defense: 60, expReward: 380, stoneReward: 165, boss: false, dropTable: [{ chance: 0.22, quality: 'rare', type: 'armor' }, { chance: 0.04, dropType: 'artifact', itemId: 'azure_dragon_sword' }] },
      { id: 'flame_spirit', name: '火灵', level: 23, hp: 550, maxHp: 550, attack: 110, defense: 25, expReward: 420, stoneReward: 185, boss: false, dropTable: [{ chance: 0.24, quality: 'epic', type: 'necklace' }, { chance: 0.04, dropType: 'artifact', itemId: 'sun_moon_bottle' }] },
      { id: 'magma_turtle', name: '熔岩龟', level: 24, hp: 1100, maxHp: 1100, attack: 85, defense: 80, expReward: 460, stoneReward: 200, boss: false, dropTable: [{ chance: 0.25, quality: 'epic', type: 'helmet' }, { chance: 0.04, dropType: 'artifact', itemId: 'seven_star_dart' }] },
      { id: 'ash_phoenix', name: '灰烬鸟', level: 25, hp: 700, maxHp: 700, attack: 120, defense: 35, expReward: 510, stoneReward: 230, boss: false, dropTable: [{ chance: 0.26, quality: 'epic', type: 'boots' }, { chance: 0.04, dropType: 'artifact', itemId: 'nine_dragon_ring' }] },
      { id: 'inferno_scorpion', name: '地狱蝎', level: 26, hp: 850, maxHp: 850, attack: 130, defense: 45, expReward: 560, stoneReward: 260, boss: false, dropTable: [{ chance: 0.28, quality: 'epic', type: 'ring' }, { chance: 0.04, dropType: 'artifact', itemId: 'golden_tower' }] },
      { id: 'volcanic_worm', name: '火山蠕虫', level: 27, hp: 1300, maxHp: 1300, attack: 100, defense: 70, expReward: 620, stoneReward: 290, boss: false, dropTable: [{ chance: 0.3, quality: 'legendary', type: 'pants' }, { chance: 0.05, dropType: 'artifact', itemId: 'red_cloud_robe' }] },
      { id: 'ember_drake', name: '烬龙幼崽', level: 28, hp: 950, maxHp: 950, attack: 145, defense: 50, expReward: 680, stoneReward: 320, boss: false, dropTable: [{ chance: 0.32, quality: 'legendary', type: 'weapon' }, { chance: 0.05, dropType: 'artifact', itemId: 'thousand_mile_eye' }] },
      { id: 'magma_elemental', name: '岩浆元素', level: 29, hp: 1500, maxHp: 1500, attack: 115, defense: 90, expReward: 750, stoneReward: 350, boss: false, dropTable: [{ chance: 0.35, quality: 'legendary', type: 'armor' }, { chance: 0.05, dropType: 'artifact', itemId: 'life_death_flag' }] },
      // BOSS固定30级
      { id: 'flame_boss', name: '炎魔领主', level: 30, hp: 4000, maxHp: 4000, attack: 200, defense: 120, expReward: 2500, stoneReward: 1000, boss: true, dropTable: [{ chance: 0.7, quality: 'legendary', type: 'weapon' }, { chance: 0.4, quality: 'legendary', type: 'necklace' }, { chance: 0.2, dropType: 'pet', itemName: '灵宠·火焰鸟', itemId: 'pet_firebird' }, { chance: 0.12, dropType: 'artifact', itemId: 'fire_phoenix_flag' }] }
    ]
  },
  // ==================== 第4图：31-40级（元婴期）====================
  {
    id: 'thunder_peak',
    name: '雷霆峰',
    description: '雷电交加的险峰，只有元婴期修士才能踏足',
    minLevel: 31,
    maxLevel: 40,
    canRest: false,
    artifacts: ['green_mushroom', 'sky_hammer', 'five_element_ball', 'ghost_head_vase', 'celestial_sword', 'moon_reflecting_pool', 'holy_water_vial', 'thunder_cloud_flag', 'mountain_moving_stamp', 'world_tree_leaf', 'demon_slayer_sword', 'ice_dragon_orb', 'chaos_bell', 'soul_devouring_flag', 'immortal_calling_paper', 'thunder_drum', 'yin_yang_mirror'],
    monsters: [
      // 小怪等级31-39级
      { id: 'thunder_ape', name: '雷猿', level: 31, hp: 1200, maxHp: 1200, attack: 160, defense: 60, expReward: 620, stoneReward: 310, boss: false, dropTable: [{ chance: 0.25, quality: 'epic', type: 'weapon' }, { chance: 0.05, dropType: 'artifact', itemId: 'green_mushroom' }] },
      { id: 'lightning_falcon', name: '闪电隼', level: 32, hp: 900, maxHp: 900, attack: 180, defense: 40, expReward: 660, stoneReward: 330, boss: false, dropTable: [{ chance: 0.26, quality: 'epic', type: 'boots' }, { chance: 0.05, dropType: 'artifact', itemId: 'sky_hammer' }] },
      { id: 'storm_tiger', name: '风暴虎', level: 33, hp: 1400, maxHp: 1400, attack: 170, defense: 70, expReward: 700, stoneReward: 350, boss: false, dropTable: [{ chance: 0.28, quality: 'legendary', type: 'helmet' }, { chance: 0.05, dropType: 'artifact', itemId: 'five_element_ball' }] },
      { id: 'thunder_spirit', name: '雷灵', level: 34, hp: 850, maxHp: 850, attack: 200, defense: 35, expReward: 750, stoneReward: 375, boss: false, dropTable: [{ chance: 0.3, quality: 'legendary', type: 'necklace' }, { chance: 0.05, dropType: 'artifact', itemId: 'ghost_head_vase' }] },
      { id: 'electric_eel', name: '雷鳗', level: 35, hp: 1600, maxHp: 1600, attack: 155, defense: 85, expReward: 800, stoneReward: 400, boss: false, dropTable: [{ chance: 0.32, quality: 'legendary', type: 'ring' }, { chance: 0.05, dropType: 'artifact', itemId: 'celestial_sword' }] },
      { id: 'storm_drake', name: '风暴幼龙', level: 36, hp: 1800, maxHp: 1800, attack: 190, defense: 80, expReward: 860, stoneReward: 430, boss: false, dropTable: [{ chance: 0.34, quality: 'legendary', type: 'weapon' }, { chance: 0.05, dropType: 'artifact', itemId: 'moon_reflecting_pool' }] },
      { id: 'thunder_beast', name: '雷兽', level: 37, hp: 2000, maxHp: 2000, attack: 185, defense: 95, expReward: 920, stoneReward: 460, boss: false, dropTable: [{ chance: 0.36, quality: 'legendary', type: 'armor' }, { chance: 0.05, dropType: 'artifact', itemId: 'holy_water_vial' }] },
      { id: 'lightning_queen', name: '雷后蜂', level: 38, hp: 1100, maxHp: 1100, attack: 220, defense: 50, expReward: 980, stoneReward: 490, boss: false, dropTable: [{ chance: 0.38, quality: 'legendary', type: 'ring' }, { chance: 0.05, dropType: 'artifact', itemId: 'thunder_cloud_flag' }] },
      { id: 'storm_giant', name: '风暴巨人', level: 39, hp: 2500, maxHp: 2500, attack: 200, defense: 110, expReward: 1050, stoneReward: 525, boss: false, dropTable: [{ chance: 0.4, quality: 'legendary', type: 'pants' }, { chance: 0.05, dropType: 'artifact', itemId: 'mountain_moving_stamp' }] },
      // BOSS固定40级
      { id: 'thunder_boss', name: '雷鹏', level: 40, hp: 6000, maxHp: 6000, attack: 300, defense: 150, expReward: 3500, stoneReward: 1500, boss: true, dropTable: [{ chance: 0.75, quality: 'legendary', type: 'weapon' }, { chance: 0.5, quality: 'legendary', type: 'armor' }, { chance: 0.3, dropType: 'pet', itemName: '灵宠·雷鹰', itemId: 'pet_thunder_eagle' }, { chance: 0.15, dropType: 'artifact', itemId: 'thunder_drum' }] }
    ]
  },
  // ==================== 第5图：41-50级（出窍期）====================
  {
    id: 'nether_abyss',
    name: '幽冥深渊',
    description: '阴气深重的地下世界，危险与机遇并存',
    minLevel: 41,
    maxLevel: 50,
    canRest: false,
    artifacts: ['eight_immortals_flask', 'tianluo_disk', 'dragon_tiger_gauntlet', 'heaven_earth_furnace', 'world_destroying_blade', 'celestial_dragon_pearl', 'phoenix_Nirvana_fan', 'immortal_shield', 'chaotic_heaven_flag', 'elixir_furnace', 'world_ring', 'seven_kills_sword', 'thousand_soul_flag', 'yuan_chen_flag', 'celestial_master_seal', 'nine_heavens_furnace', 'world_extinguishing_palm', 'celestial_dragon_orb'],
    monsters: [
      // 小怪等级41-49级
      { id: 'ghost_warrior', name: '鬼武士', level: 41, hp: 2200, maxHp: 2200, attack: 230, defense: 100, expReward: 1500, stoneReward: 600, boss: false, dropTable: [{ chance: 0.3, quality: 'legendary', type: 'weapon' }, { chance: 0.06, dropType: 'artifact', itemId: 'eight_immortals_flask' }] },
      { id: 'soul_devourer', name: '噬魂虫', level: 42, hp: 1400, maxHp: 1400, attack: 260, defense: 55, expReward: 1600, stoneReward: 650, boss: false, dropTable: [{ chance: 0.32, quality: 'legendary', type: 'necklace' }, { chance: 0.06, dropType: 'artifact', itemId: 'tianluo_disk' }] },
      { id: 'bone_dragon', name: '骨龙', level: 43, hp: 3000, maxHp: 3000, attack: 220, defense: 130, expReward: 1700, stoneReward: 700, boss: false, dropTable: [{ chance: 0.34, quality: 'legendary', type: 'armor' }, { chance: 0.06, dropType: 'artifact', itemId: 'dragon_tiger_gauntlet' }] },
      { id: 'shadow_assassin', name: '暗影刺客', level: 44, hp: 1600, maxHp: 1600, attack: 290, defense: 60, expReward: 1290, stoneReward: 645, boss: false, dropTable: [{ chance: 0.36, quality: 'legendary', type: 'boots' }, { chance: 0.06, dropType: 'artifact', itemId: 'heaven_earth_furnace' }] },
      { id: 'wraith_king', name: '怨灵王', level: 45, hp: 2600, maxHp: 2600, attack: 250, defense: 115, expReward: 1360, stoneReward: 680, boss: false, dropTable: [{ chance: 0.38, quality: 'legendary', type: 'helmet' }, { chance: 0.06, dropType: 'artifact', itemId: 'world_destroying_blade' }] },
      { id: 'nether_worm', name: '幽冥蠕虫', level: 46, hp: 3800, maxHp: 3800, attack: 210, defense: 150, expReward: 1430, stoneReward: 715, boss: false, dropTable: [{ chance: 0.4, quality: 'legendary', type: 'pants' }, { chance: 0.06, dropType: 'artifact', itemId: 'celestial_dragon_pearl' }] },
      { id: 'death_knight', name: '死亡骑士', level: 47, hp: 3200, maxHp: 3200, attack: 280, defense: 140, expReward: 1500, stoneReward: 750, boss: false, dropTable: [{ chance: 0.42, quality: 'legendary', type: 'weapon' }, { chance: 0.06, dropType: 'artifact', itemId: 'phoenix_Nirvana_fan' }] },
      { id: 'soul_reaper', name: '夺魂者', level: 48, hp: 2000, maxHp: 2000, attack: 320, defense: 70, expReward: 1580, stoneReward: 790, boss: false, dropTable: [{ chance: 0.44, quality: 'legendary', type: 'ring' }, { chance: 0.06, dropType: 'artifact', itemId: 'immortal_shield' }] },
      { id: 'abyss_horror', name: '深渊恐魔', level: 49, hp: 4500, maxHp: 4500, attack: 260, defense: 160, expReward: 2300, stoneReward: 1000, boss: false, dropTable: [{ chance: 0.46, quality: 'legendary', type: 'armor' }, { chance: 0.06, dropType: 'artifact', itemId: 'chaotic_heaven_flag' }] },
      // BOSS固定50级
      { id: 'nether_boss', name: '冥王', level: 50, hp: 9000, maxHp: 9000, attack: 400, defense: 200, expReward: 5500, stoneReward: 2500, boss: true, dropTable: [{ chance: 0.8, quality: 'legendary', type: 'weapon' }, { chance: 0.6, quality: 'legendary', type: 'necklace' }, { chance: 0.25, dropType: 'pet', itemName: '灵宠·白蛇', itemId: 'pet_white_snake' }, { chance: 0.15, dropType: 'artifact', itemId: 'elixir_furnace' }] }
    ]
  },
  // ==================== 第6图：51-60级（化神期）====================
  {
    id: 'immortal_ruins',
    name: '仙迹废墟',
    description: '上古仙人留下的遗迹，充满神秘力量',
    minLevel: 51,
    maxLevel: 60,
    canRest: false,
    artifacts: ['world_ring', 'seven_kills_sword', 'thousand_soul_flag', 'yuan_chen_flag', 'celestial_master_seal', 'nine_heavens_furnace', 'world_extinguishing_palm', 'celestial_dragon_orb'],
    monsters: [
      // 小怪等级51-59级：legendary为主，57级开始出现divine
      { id: 'ruin_guardian', name: '遗迹守卫', level: 51, hp: 3500, maxHp: 3500, attack: 300, defense: 150, expReward: 1750, stoneReward: 875, boss: false, dropTable: [{ chance: 0.35, quality: 'legendary', type: 'armor' }, { chance: 0.07, dropType: 'artifact', itemId: 'world_ring' }] },
      { id: 'ancient_spirit', name: '古灵', level: 52, hp: 2200, maxHp: 2200, attack: 350, defense: 80, expReward: 1830, stoneReward: 915, boss: false, dropTable: [{ chance: 0.37, quality: 'legendary', type: 'necklace' }, { chance: 0.07, dropType: 'artifact', itemId: 'seven_kills_sword' }] },
      { id: 'stone_sage', name: '石贤者', level: 53, hp: 4200, maxHp: 4200, attack: 280, defense: 180, expReward: 1910, stoneReward: 955, boss: false, dropTable: [{ chance: 0.39, quality: 'legendary', type: 'helmet' }, { chance: 0.07, dropType: 'artifact', itemId: 'thousand_soul_flag' }] },
      { id: 'rune_beast', name: '符文兽', level: 54, hp: 3000, maxHp: 3000, attack: 340, defense: 110, expReward: 2000, stoneReward: 1000, boss: false, dropTable: [{ chance: 0.41, quality: 'legendary', type: 'weapon' }, { chance: 0.07, dropType: 'artifact', itemId: 'yuan_chen_flag' }] },
      { id: 'time_wraith', name: '时光幽灵', level: 55, hp: 2500, maxHp: 2500, attack: 380, defense: 90, expReward: 2090, stoneReward: 1045, boss: false, dropTable: [{ chance: 0.43, quality: 'legendary', type: 'ring' }, { chance: 0.07, dropType: 'artifact', itemId: 'celestial_master_seal' }] },
      { id: 'immortal_slime', name: '仙灵史莱姆', level: 56, hp: 5500, maxHp: 5500, attack: 260, defense: 220, expReward: 2180, stoneReward: 1090, boss: false, dropTable: [{ chance: 0.45, quality: 'legendary', type: 'pants' }, { chance: 0.07, dropType: 'artifact', itemId: 'nine_heavens_furnace' }] },
      // 57级开始出现divine
      { id: 'sword_spirit', name: '剑灵', level: 57, hp: 3200, maxHp: 3200, attack: 400, defense: 100, expReward: 2270, stoneReward: 1135, boss: false, dropTable: [{ chance: 0.47, quality: 'divine', type: 'weapon' }, { chance: 0.07, dropType: 'artifact', itemId: 'world_extinguishing_palm' }] },
      { id: 'seal_guardian', name: '封印守护者', level: 58, hp: 4800, maxHp: 4800, attack: 330, defense: 190, expReward: 2360, stoneReward: 1180, boss: false, dropTable: [{ chance: 0.49, quality: 'divine', type: 'armor' }, { chance: 0.07, dropType: 'artifact', itemId: 'celestial_dragon_orb' }] },
      { id: 'forgotten_god', name: '遗忘之神', level: 59, hp: 6000, maxHp: 6000, attack: 360, defense: 200, expReward: 2460, stoneReward: 1230, boss: false, dropTable: [{ chance: 0.51, quality: 'divine', type: 'boots' }, { chance: 0.08, dropType: 'artifact', itemId: 'world_ring' }] },
      // BOSS固定60级：divine为主
      { id: 'ruins_boss', name: '上古仙傀', level: 60, hp: 12000, maxHp: 12000, attack: 500, defense: 280, expReward: 4500, stoneReward: 2250, boss: true, dropTable: [{ chance: 0.85, quality: 'divine', type: 'weapon' }, { chance: 0.65, quality: 'divine', type: 'armor' }, { chance: 0.3, type: 'pet', itemName: '灵宠·古灵', itemId: 'pet_ancient_spirit' }, { chance: 0.2, dropType: 'artifact', itemId: 'celestial_master_seal' }] }
    ]
  },
  // ==================== 第7图：61-70级（合体期）====================
  {
    id: 'demon_realm',
    name: '魔域边界',
    description: '魔界与人界的交界处，魔气弥漫',
    minLevel: 61,
    maxLevel: 70,
    canRest: false,
    artifacts: ['god_slaying_spear', 'world_destroying_furnace', 'immortal_peach_branch', 'celestial_fold'],
    monsters: [
      // 小怪等级61-69级：divine为主
      { id: 'demon_soldier', name: '魔兵', level: 61, hp: 4500, maxHp: 4500, attack: 380, defense: 170, expReward: 2560, stoneReward: 1280, boss: false, dropTable: [{ chance: 0.4, quality: 'divine', type: 'weapon' }, { chance: 0.08, dropType: 'artifact', itemId: 'god_slaying_spear' }] },
      { id: 'blood_fiend', name: '血魔', level: 62, hp: 3500, maxHp: 3500, attack: 430, defense: 110, expReward: 2660, stoneReward: 1330, boss: false, dropTable: [{ chance: 0.42, quality: 'divine', type: 'necklace' }, { chance: 0.08, dropType: 'artifact', itemId: 'world_destroying_furnace' }] },
      { id: 'shadow_demon', name: '影魔', level: 63, hp: 3000, maxHp: 3000, attack: 460, defense: 90, expReward: 2760, stoneReward: 1380, boss: false, dropTable: [{ chance: 0.44, quality: 'divine', type: 'boots' }, { chance: 0.08, dropType: 'artifact', itemId: 'immortal_peach_branch' }] },
      { id: 'corruption_beast', name: '腐化兽', level: 64, hp: 6000, maxHp: 6000, attack: 350, defense: 230, expReward: 2860, stoneReward: 1430, boss: false, dropTable: [{ chance: 0.46, quality: 'divine', type: 'armor' }, { chance: 0.08, dropType: 'artifact', itemId: 'celestial_fold' }] },
      { id: 'demon_mage', name: '魔导师', level: 65, hp: 3800, maxHp: 3800, attack: 480, defense: 130, expReward: 2970, stoneReward: 1485, boss: false, dropTable: [{ chance: 0.48, quality: 'divine', type: 'ring' }, { chance: 0.08, dropType: 'artifact', itemId: 'god_slaying_spear' }] },
      { id: 'chaos_warrior', name: '混沌战士', level: 66, hp: 5500, maxHp: 5500, attack: 420, defense: 200, expReward: 3080, stoneReward: 1540, boss: false, dropTable: [{ chance: 0.5, quality: 'divine', type: 'helmet' }, { chance: 0.08, dropType: 'artifact', itemId: 'world_destroying_furnace' }] },
      { id: 'abyss_demon', name: '深渊恶魔', level: 67, hp: 7000, maxHp: 7000, attack: 390, defense: 250, expReward: 3190, stoneReward: 1595, boss: false, dropTable: [{ chance: 0.52, quality: 'divine', type: 'pants' }, { chance: 0.08, dropType: 'artifact', itemId: 'immortal_peach_branch' }] },
      { id: 'soul_demon', name: '噬魂魔', level: 68, hp: 4200, maxHp: 4200, attack: 510, defense: 120, expReward: 3300, stoneReward: 1650, boss: false, dropTable: [{ chance: 0.54, quality: 'divine', type: 'weapon' }, { chance: 0.08, dropType: 'artifact', itemId: 'celestial_fold' }] },
      { id: 'demon_general', name: '魔将', level: 69, hp: 8000, maxHp: 8000, attack: 450, defense: 270, expReward: 3420, stoneReward: 1710, boss: false, dropTable: [{ chance: 0.56, quality: 'divine', type: 'armor' }, { chance: 0.09, dropType: 'artifact', itemId: 'god_slaying_spear' }] },
      // BOSS固定70级
      { id: 'demon_boss', name: '魔王', level: 70, hp: 16000, maxHp: 16000, attack: 650, defense: 350, expReward: 6000, stoneReward: 3000, boss: true, dropTable: [{ chance: 0.9, quality: 'divine', type: 'weapon' }, { chance: 0.7, quality: 'divine', type: 'armor' }, { chance: 0.35, type: 'pet', itemName: '灵宠·魔灵', itemId: 'pet_demon' }, { chance: 0.22, dropType: 'artifact', itemId: 'world_destroying_furnace' }] }
    ]
  },
  // ==================== 第8图：71-80级（渡劫期）====================
  {
    id: 'heaven_gate',
    name: '天门外域',
    description: '通往天界的门户，仙气与劫雷交织',
    minLevel: 71,
    maxLevel: 80,
    canRest: false,
    artifacts: ['ten_thousand_buddha_cup', 'nine_yang_sword', 'world_origin_staff', 'three_pure_ones_flag'],
    monsters: [
      // 小怪等级71-79级：divine为主，77级开始出现primordial
      { id: 'celestial_guard', name: '天兵', level: 71, hp: 6000, maxHp: 6000, attack: 480, defense: 220, expReward: 3540, stoneReward: 1770, boss: false, dropTable: [{ chance: 0.45, quality: 'divine', type: 'weapon' }, { chance: 0.09, dropType: 'artifact', itemId: 'ten_thousand_buddha_cup' }] },
      { id: 'thunder_spirit_king', name: '雷灵王', level: 72, hp: 4500, maxHp: 4500, attack: 550, defense: 130, expReward: 3660, stoneReward: 1830, boss: false, dropTable: [{ chance: 0.47, quality: 'divine', type: 'necklace' }, { chance: 0.09, dropType: 'artifact', itemId: 'nine_yang_sword' }] },
      { id: 'cloud_beast', name: '云兽', level: 73, hp: 8000, maxHp: 8000, attack: 420, defense: 280, expReward: 3780, stoneReward: 1890, boss: false, dropTable: [{ chance: 0.49, quality: 'divine', type: 'armor' }, { chance: 0.09, dropType: 'artifact', itemId: 'world_origin_staff' }] },
      { id: 'star_fairy', name: '星灵', level: 74, hp: 3800, maxHp: 3800, attack: 600, defense: 100, expReward: 3910, stoneReward: 1955, boss: false, dropTable: [{ chance: 0.51, quality: 'divine', type: 'ring' }, { chance: 0.09, dropType: 'artifact', itemId: 'three_pure_ones_flag' }] },
      { id: 'wind_god', name: '风神', level: 75, hp: 5500, maxHp: 5500, attack: 530, defense: 180, expReward: 4040, stoneReward: 2020, boss: false, dropTable: [{ chance: 0.53, quality: 'divine', type: 'boots' }, { chance: 0.09, dropType: 'artifact', itemId: 'ten_thousand_buddha_cup' }] },
      { id: 'light_beast', name: '光兽', level: 76, hp: 9500, maxHp: 9500, attack: 460, defense: 310, expReward: 4170, stoneReward: 2085, boss: false, dropTable: [{ chance: 0.55, quality: 'divine', type: 'helmet' }, { chance: 0.09, dropType: 'artifact', itemId: 'nine_yang_sword' }] },
      // 77级开始出现primordial
      { id: 'thunder_general', name: '雷将', level: 77, hp: 7000, maxHp: 7000, attack: 580, defense: 240, expReward: 4310, stoneReward: 2155, boss: false, dropTable: [{ chance: 0.57, quality: 'primordial', type: 'weapon' }, { chance: 0.09, dropType: 'artifact', itemId: 'world_origin_staff' }] },
      { id: 'moon_spirit', name: '月灵', level: 78, hp: 4800, maxHp: 4800, attack: 650, defense: 140, expReward: 4450, stoneReward: 2225, boss: false, dropTable: [{ chance: 0.59, quality: 'primordial', type: 'necklace' }, { chance: 0.09, dropType: 'artifact', itemId: 'three_pure_ones_flag' }] },
      { id: 'sun_beast', name: '日兽', level: 79, hp: 11000, maxHp: 11000, attack: 520, defense: 340, expReward: 4590, stoneReward: 2295, boss: false, dropTable: [{ chance: 0.61, quality: 'primordial', type: 'armor' }, { chance: 0.1, dropType: 'artifact', itemId: 'ten_thousand_buddha_cup' }] },
      // BOSS固定80级
      { id: 'heaven_boss', name: '天劫使者', level: 80, hp: 22000, maxHp: 22000, attack: 800, defense: 450, expReward: 8000, stoneReward: 4000, boss: true, dropTable: [{ chance: 0.95, quality: 'primordial', type: 'weapon' }, { chance: 0.75, quality: 'primordial', type: 'armor' }, { chance: 0.4, type: 'pet', itemName: '灵宠·天灵', itemId: 'pet_celestial' }, { chance: 0.25, dropType: 'artifact', itemId: 'nine_yang_sword' }] }
    ]
  },
  // ==================== 第9图：81-90级（大乘期）====================
  {
    id: 'immortal_palace',
    name: '仙宫遗迹',
    description: '上古仙宫废墟，残留着仙帝的威压',
    minLevel: 81,
    maxLevel: 90,
    canRest: false,
    artifacts: ['world_core_ring', 'creation_flag', 'celestial_eye', 'primordial_cauldron'],
    monsters: [
      // 小怪等级81-89级：primordial为主
      { id: 'immortal_guard', name: '仙卫', level: 81, hp: 8000, maxHp: 8000, attack: 580, defense: 280, expReward: 4740, stoneReward: 2370, boss: false, dropTable: [{ chance: 0.5, quality: 'primordial', type: 'weapon' }, { chance: 0.1, dropType: 'artifact', itemId: 'world_core_ring' }] },
      { id: 'jade_beast', name: '玉兽', level: 82, hp: 12000, maxHp: 12000, attack: 480, defense: 360, expReward: 4890, stoneReward: 2445, boss: false, dropTable: [{ chance: 0.52, quality: 'primordial', type: 'armor' }, { chance: 0.1, dropType: 'artifact', itemId: 'creation_flag' }] },
      { id: 'phoenix_spirit', name: '凤凰灵', level: 83, hp: 6000, maxHp: 6000, attack: 700, defense: 160, expReward: 5040, stoneReward: 2520, boss: false, dropTable: [{ chance: 0.54, quality: 'primordial', type: 'necklace' }, { chance: 0.1, dropType: 'artifact', itemId: 'celestial_eye' }] },
      { id: 'dragon_soul', name: '龙魂', level: 84, hp: 10000, maxHp: 10000, attack: 620, defense: 300, expReward: 5200, stoneReward: 2600, boss: false, dropTable: [{ chance: 0.56, quality: 'primordial', type: 'helmet' }, { chance: 0.1, dropType: 'artifact', itemId: 'primordial_cauldron' }] },
      { id: 'golden_lion', name: '金狮', level: 85, hp: 14000, maxHp: 14000, attack: 550, defense: 380, expReward: 5360, stoneReward: 2680, boss: false, dropTable: [{ chance: 0.58, quality: 'primordial', type: 'boots' }, { chance: 0.1, dropType: 'artifact', itemId: 'world_core_ring' }] },
      { id: 'immortal_sage', name: '仙贤', level: 86, hp: 7500, maxHp: 7500, attack: 750, defense: 180, expReward: 5530, stoneReward: 2765, boss: false, dropTable: [{ chance: 0.6, quality: 'primordial', type: 'ring' }, { chance: 0.1, dropType: 'artifact', itemId: 'creation_flag' }] },
      { id: 'void_beast', name: '虚空兽', level: 87, hp: 16000, maxHp: 16000, attack: 600, defense: 400, expReward: 5700, stoneReward: 2850, boss: false, dropTable: [{ chance: 0.62, quality: 'primordial', type: 'pants' }, { chance: 0.1, dropType: 'artifact', itemId: 'celestial_eye' }] },
      { id: 'immortal_sword', name: '仙剑灵', level: 88, hp: 8500, maxHp: 8500, attack: 800, defense: 200, expReward: 5870, stoneReward: 2935, boss: false, dropTable: [{ chance: 0.64, quality: 'primordial', type: 'weapon' }, { chance: 0.1, dropType: 'artifact', itemId: 'primordial_cauldron' }] },
      { id: 'chaos_beast', name: '混沌兽', level: 89, hp: 18000, maxHp: 18000, attack: 680, defense: 420, expReward: 6050, stoneReward: 3025, boss: false, dropTable: [{ chance: 0.66, quality: 'primordial', type: 'armor' }, { chance: 0.11, dropType: 'artifact', itemId: 'world_core_ring' }] },
      // BOSS固定90级
      { id: 'palace_boss', name: '仙帝残魂', level: 90, hp: 35000, maxHp: 35000, attack: 1000, defense: 550, expReward: 10000, stoneReward: 5000, boss: true, dropTable: [{ chance: 1.0, quality: 'primordial', type: 'weapon' }, { chance: 0.8, quality: 'primordial', type: 'armor' }, { chance: 0.45, type: 'pet', itemName: '灵宠·仙灵', itemId: 'pet_immortal' }, { chance: 0.28, dropType: 'artifact', itemId: 'primordial_cauldron' }] }
    ]
  },
  // ==================== 第10图：91-100级（人仙期）====================
  {
    id: 'xianlou_tower',
    name: '登仙台',
    description: '通往仙界的最终试炼之地',
    minLevel: 91,
    maxLevel: 100,
    canRest: false,
    artifacts: ['world_core_ring', 'creation_flag', 'celestial_eye', 'primordial_cauldron'],
    monsters: [
      // 小怪等级91-99级：全primordial
      { id: 'immortal_general', name: '仙将', level: 91, hp: 10000, maxHp: 10000, attack: 700, defense: 350, expReward: 6220, stoneReward: 3110, boss: false, dropTable: [{ chance: 0.55, quality: 'primordial', type: 'weapon' }, { chance: 0.11, dropType: 'artifact', itemId: 'creation_flag' }] },
      { id: 'celestial_beast', name: '天兽', level: 92, hp: 15000, maxHp: 15000, attack: 600, defense: 450, expReward: 6400, stoneReward: 3200, boss: false, dropTable: [{ chance: 0.57, quality: 'primordial', type: 'armor' }, { chance: 0.11, dropType: 'artifact', itemId: 'celestial_eye' }] },
      { id: 'divine_spirit', name: '神灵', level: 93, hp: 8000, maxHp: 8000, attack: 850, defense: 200, expReward: 6580, stoneReward: 3290, boss: false, dropTable: [{ chance: 0.59, quality: 'primordial', type: 'necklace' }, { chance: 0.11, dropType: 'artifact', itemId: 'primordial_cauldron' }] },
      { id: 'golden_dragon', name: '金龙', level: 94, hp: 13000, maxHp: 13000, attack: 750, defense: 380, expReward: 6770, stoneReward: 3385, boss: false, dropTable: [{ chance: 0.61, quality: 'primordial', type: 'helmet' }, { chance: 0.11, dropType: 'artifact', itemId: 'world_core_ring' }] },
      { id: 'phoenix_god', name: '凤凰神', level: 95, hp: 18000, maxHp: 18000, attack: 680, defense: 480, expReward: 6960, stoneReward: 3480, boss: false, dropTable: [{ chance: 0.63, quality: 'primordial', type: 'boots' }, { chance: 0.11, dropType: 'artifact', itemId: 'creation_flag' }] },
      { id: 'primordial_beast', name: '洪荒兽', level: 96, hp: 22000, maxHp: 22000, attack: 720, defense: 500, expReward: 7160, stoneReward: 3580, boss: false, dropTable: [{ chance: 0.65, quality: 'primordial', type: 'pants' }, { chance: 0.11, dropType: 'artifact', itemId: 'celestial_eye' }] },
      { id: 'dao_spirit', name: '道灵', level: 97, hp: 9500, maxHp: 9500, attack: 900, defense: 220, expReward: 7360, stoneReward: 3680, boss: false, dropTable: [{ chance: 0.67, quality: 'primordial', type: 'ring' }, { chance: 0.11, dropType: 'artifact', itemId: 'primordial_cauldron' }] },
      { id: 'heavenly_soldier', name: '天兵统领', level: 98, hp: 20000, maxHp: 20000, attack: 800, defense: 450, expReward: 7560, stoneReward: 3780, boss: false, dropTable: [{ chance: 0.69, quality: 'primordial', type: 'weapon' }, { chance: 0.12, dropType: 'artifact', itemId: 'world_core_ring' }] },
      { id: 'celestial_guardian', name: '天界守护者', level: 99, hp: 25000, maxHp: 25000, attack: 850, defense: 500, expReward: 7760, stoneReward: 3880, boss: false, dropTable: [{ chance: 0.71, quality: 'primordial', type: 'armor' }, { chance: 0.12, dropType: 'artifact', itemId: 'creation_flag' }] },
      // BOSS固定100级：三件primordial
      { id: 'xianlou_boss', name: '仙界之主', level: 100, hp: 50000, maxHp: 50000, attack: 2000, defense: 1000, expReward: 20000, stoneReward: 15000, boss: true, dropTable: [{ chance: 1.0, quality: 'primordial', type: 'weapon' }, { chance: 0.9, quality: 'primordial', type: 'armor' }, { chance: 0.8, quality: 'primordial', type: 'necklace' }, { chance: 0.5, type: 'pet', itemName: '灵宠·真龙', itemId: 'pet_true_dragon' }, { chance: 0.35, dropType: 'artifact', itemId: 'primordial_cauldron' }] }
    ]
  }
]

// 仙器/神话/太古品质装备 —— 数据来源：data/equipment/special_items.csv
import { getSpecialItems as _getSpecialItems } from '@/utils/equipmentLoader'

const _specialItemsCache = /* @__PURE__ */ _getSpecialItems()

// 仙器列表（41-60级，出窍-化神期）
export const LEGENDARY_ITEMS: Omit<Equipment, 'id'>[] = /* @__PURE__ */ _specialItemsCache.legendaryItems

// 神话品质装备列表（61-80级，合体期-渡劫期）
export const DIVINE_ITEMS: Omit<Equipment, 'id'>[] = /* @__PURE__ */ _specialItemsCache.divineItems

// 太古品质装备列表（81-100级，大乘期-人仙期）
export const PRIMORDIAL_ITEMS: Omit<Equipment, 'id'>[] = /* @__PURE__ */ _specialItemsCache.primordialItems

// 灵宠模板
export const PET_TEMPLATES: Record<string, Omit<Pet, 'id' | 'spirit' | 'maxSpirit' | 'exp' | 'maxExp' | 'loyalty' | 'grade'>> = {
  'pet_wood': { name: '小木灵', level: 1, attack: 5, defense: 3, ability: '生机回复：战斗每回合回复少量生命' },
  'pet_white_snake': { name: '白蛇', level: 30, attack: 80, defense: 40, ability: '寒毒：攻击附带减速效果' },
  'pet_qinglong': { name: '青龙幼崽', level: 50, attack: 200, defense: 100, ability: '龙威：增加主人攻击力' },
  'pet_fox': { name: '小狐狸', level: 10, attack: 25, defense: 15, ability: '魅惑：一定概率使敌人攻击落空' },
  'pet_firebird': { name: '火焰鸟', level: 40, attack: 150, defense: 60, ability: '烈焰：攻击附带灼烧伤害' },
  'pet_thunder_eagle': { name: '雷鹰', level: 60, attack: 280, defense: 120, ability: '雷霆：攻击附带雷电伤害' },
  'pet_demon': { name: '魔灵', level: 70, attack: 380, defense: 180, ability: '魔化：增加主人暴击率' },
  'pet_celestial': { name: '天灵', level: 80, attack: 500, defense: 250, ability: '天佑：减少主人受到的伤害' },
  'pet_immortal': { name: '仙灵', level: 90, attack: 650, defense: 320, ability: '仙护：战斗开始时生成护盾' },
  'pet_true_dragon': { name: '真龙', level: 100, attack: 800, defense: 400, ability: '龙神：全面提升主人属性' }
}

// ==================== 功法系统 ====================
// 参考《万界道友》Daoyou 项目设计

// 功法品质（8级品质体系）
export const TECHNIQUE_QUALITIES = {
  common: { name: '凡品', color: '#9e9e9e', multiplier: 1, realmRange: [0, 0] },     // 炼气期
  fine: { name: '灵品', color: '#4caf50', multiplier: 1.5, realmRange: [0, 1] },      // 炼气-筑基
  rare: { name: '玄品', color: '#2196f3', multiplier: 2, realmRange: [1, 2] },        // 筑基-金丹
  epic: { name: '真品', color: '#9c27b0', multiplier: 2.5, realmRange: [2, 3] },     // 金丹-元婴
  excellent: { name: '地品', color: '#ff9800', multiplier: 3, realmRange: [3, 5] },  // 元婴-化神
  superior: { name: '天品', color: '#00bcd4', multiplier: 4, realmRange: [5, 6] },   // 炼虚-合体
  immortal: { name: '仙品', color: '#e91e63', multiplier: 5, realmRange: [6, 7] },    // 大乘
  divine: { name: '神品', color: '#ffd700', multiplier: 8, realmRange: [7, 8] }      // 渡劫
} as const

export type TechniqueQualityId = keyof typeof TECHNIQUE_QUALITIES

// 功法效果类型（参考 Daoyou 的词条体系）
export type TechniqueEffectType = 
  | 'attackBonus'       // 攻击力加成
  | 'defenseBonus'      // 防御力加成
  | 'hpBonus'           // 生命值加成（强体）
  | 'critRate'          // 暴击率加成
  | 'critDamage'        // 暴击伤害加成
  | 'dodgeRate'         // 闪避率加成（身法）
  | 'lifesteal'         // 吸血比例
  | 'spiritPerSec'      // 灵气回复速度
  | 'damageReduction'   // 伤害减免
  | 'reflectDamage'     // 反弹伤害（镜像诀）
  | 'regenPerSec'       // 每秒回复生命

// 功法效果
export interface TechniqueEffect {
  type: TechniqueEffectType
  value: number
  description: string
}

// 功法
export interface Technique {
  id: string
  name: string
  quality: TechniqueQualityId
  level: number            // 功法等级(1-10)
  effects: TechniqueEffect[]
  description: string      // 功法描述
  realmRequirement: number // 境界要求
  category: 'body' | 'spirit' | 'combat' | 'element' | 'ultimate'  // 功法类别
}

// 功法类别说明
export const TECHNIQUE_CATEGORIES = {
  body: { name: '炼体', icon: '💪', desc: '增强体魄，提升生命与防御' },
  spirit: { name: '炼气', icon: '✨', desc: '吸纳灵气，加速修炼' },
  combat: { name: '斗战', icon: '⚔️', desc: '增强战斗能力' },
  element: { name: '五行', icon: '🌟', desc: '五行元素伤害加成' },
  ultimate: { name: '大道', icon: '🔮', desc: '终极功法，全能加成' }
}

// ==================== 秘境系统 ====================

// 秘境类型
export type SecretRealmType = 'resource' | 'inheritance' | 'cave' | 'trial' | 'ancient'

// 秘境类型配置
export const SECRET_REALM_TYPE_CONFIG: Record<SecretRealmType, { name: string; icon: string; color: string; description: string }> = {
  resource: { name: '资源秘境', icon: '💎', color: '#4fc3f7', description: '产出灵石和基础材料' },
  inheritance: { name: '传承秘境', icon: '📜', color: '#81c784', description: '有概率获得功法或称号' },
  cave: { name: '洞府秘境', icon: '🏛️', color: '#ffb74d', description: '难度较高，掉落品质更好' },
  trial: { name: '试炼秘境', icon: '⚔️', color: '#e57373', description: '考验实力，通关奖励丰厚' },
  ancient: { name: '上古秘境', icon: '🗿', color: '#ba68c8', description: '极限挑战，极品掉落' }
}

// 秘境楼层配置
export interface SecretRealmFloor {
  floor: number
  name: string
  monsterCount: number
  bossFloor: boolean
  expReward: number
  stoneReward: number
  qualityBonus: number
}

// 秘境配置
export interface SecretRealmConfig {
  id: string
  name: string
  type: SecretRealmType
  realmIndex: number
  description: string
  icon: string
  color: string
  minLevel: number
  entryCost: number
  cooldownSeconds: number
  totalFloors: number
  floors: SecretRealmFloor[]
  dropQualityBonus: number
  specialReward?: {
    name: string
    description: string
    chance: number
  }
}

// 秘境特殊奖励
export interface SecretRealmSpecialReward {
  name: string
  description: string
  chance: number
}

// 玩家秘境状态
export interface PlayerSecretRealmState {
  currentRealmId: string | null
  currentFloor: number
  remainingMonsters: number
  enteredRealms: string[]
  realmCooldowns: Record<string, number>
  realmBestScores: Record<string, { floorsCleared: number; totalReward: number }>
  realmChestKeys: number
  completedRealms: string[]
  realmTitles: string[]
}

// 秘境数据
export const SECRET_REALMS: SecretRealmConfig[] = [
  // 炼气期秘境
  {
    id: 'spirit_cave',
    name: '灵气洞府',
    type: 'resource',
    realmIndex: 0,
    description: '炼气期弟子的入门秘境，灵气充沛，适合练手',
    icon: '🌋',
    color: '#81c784',
    minLevel: 1,
    entryCost: 50,
    cooldownSeconds: 300,
    totalFloors: 3,
    dropQualityBonus: 1.0,
    floors: [
      { floor: 1, name: '灵气洞口', monsterCount: 3, bossFloor: false, expReward: 30, stoneReward: 20, qualityBonus: 1.0 },
      { floor: 2, name: '灵气深处', monsterCount: 4, bossFloor: false, expReward: 50, stoneReward: 35, qualityBonus: 1.2 },
      { floor: 3, name: '洞府核心', monsterCount: 2, bossFloor: true, expReward: 100, stoneReward: 80, qualityBonus: 1.5 }
    ]
  },
  {
    id: 'spirit_trial',
    name: '炼气试炼',
    type: 'trial',
    realmIndex: 0,
    description: '考验战斗能力的试炼秘境，通过可获得称号',
    icon: '⚔️',
    color: '#e57373',
    minLevel: 3,
    entryCost: 80,
    cooldownSeconds: 600,
    totalFloors: 3,
    dropQualityBonus: 1.2,
    specialReward: {
      name: '炼气修士',
      description: '试炼称号：攻击+5%',
      chance: 0.3
    },
    floors: [
      { floor: 1, name: '初试身手', monsterCount: 4, bossFloor: false, expReward: 40, stoneReward: 25, qualityBonus: 1.1 },
      { floor: 2, name: '渐入佳境', monsterCount: 5, bossFloor: false, expReward: 60, stoneReward: 40, qualityBonus: 1.3 },
      { floor: 3, name: '终极试炼', monsterCount: 3, bossFloor: true, expReward: 150, stoneReward: 100, qualityBonus: 1.8 }
    ]
  },
  // 筑基期秘境
  {
    id: 'foundation_cave',
    name: '筑基洞府',
    type: 'cave',
    realmIndex: 1,
    description: '筑基期修士历练的秘境，难度提升',
    icon: '🏛️',
    color: '#ffb74d',
    minLevel: 10,
    entryCost: 150,
    cooldownSeconds: 600,
    totalFloors: 4,
    dropQualityBonus: 1.5,
    floors: [
      { floor: 1, name: '洞府外层', monsterCount: 4, bossFloor: false, expReward: 80, stoneReward: 50, qualityBonus: 1.3 },
      { floor: 2, name: '洞府中层', monsterCount: 5, bossFloor: false, expReward: 120, stoneReward: 80, qualityBonus: 1.5 },
      { floor: 3, name: '洞府内层', monsterCount: 3, bossFloor: false, expReward: 180, stoneReward: 120, qualityBonus: 1.8 },
      { floor: 4, name: '洞府核心', monsterCount: 2, bossFloor: true, expReward: 300, stoneReward: 200, qualityBonus: 2.2 }
    ]
  },
  {
    id: 'foundation_inheritance',
    name: '传承秘境',
    type: 'inheritance',
    realmIndex: 1,
    description: '蕴含上古传承的秘境，有几率获得珍贵功法',
    icon: '📜',
    color: '#81c784',
    minLevel: 12,
    entryCost: 200,
    cooldownSeconds: 900,
    totalFloors: 3,
    dropQualityBonus: 1.3,
    specialReward: {
      name: '筑基功法',
      description: '随机获得一本筑基期功法',
      chance: 0.2
    },
    floors: [
      { floor: 1, name: '传承入口', monsterCount: 5, bossFloor: false, expReward: 100, stoneReward: 60, qualityBonus: 1.2 },
      { floor: 2, name: '传承之路', monsterCount: 6, bossFloor: false, expReward: 150, stoneReward: 100, qualityBonus: 1.5 },
      { floor: 3, name: '传承核心', monsterCount: 3, bossFloor: true, expReward: 280, stoneReward: 180, qualityBonus: 2.0 }
    ]
  },
  // 金丹期秘境
  {
    id: 'golden_cave',
    name: '金丹福地',
    type: 'cave',
    realmIndex: 2,
    description: '金丹期修士的历练圣地，资源丰富',
    icon: '🌟',
    color: '#ffb74d',
    minLevel: 20,
    entryCost: 400,
    cooldownSeconds: 1200,
    totalFloors: 5,
    dropQualityBonus: 2.0,
    floors: [
      { floor: 1, name: '福地外围', monsterCount: 5, bossFloor: false, expReward: 200, stoneReward: 120, qualityBonus: 1.6 },
      { floor: 2, name: '福地深处', monsterCount: 6, bossFloor: false, expReward: 300, stoneReward: 180, qualityBonus: 1.9 },
      { floor: 3, name: '福地核心', monsterCount: 4, bossFloor: false, expReward: 450, stoneReward: 280, qualityBonus: 2.2 },
      { floor: 4, name: '秘境深处', monsterCount: 3, bossFloor: false, expReward: 600, stoneReward: 380, qualityBonus: 2.6 },
      { floor: 5, name: '福地终层', monsterCount: 2, bossFloor: true, expReward: 900, stoneReward: 600, qualityBonus: 3.0 }
    ]
  },
  {
    id: 'golden_trial',
    name: '金丹天劫试炼',
    type: 'trial',
    realmIndex: 2,
    description: '模拟天劫的试炼秘境，通过可获得称号',
    icon: '⚡',
    color: '#e57373',
    minLevel: 22,
    entryCost: 500,
    cooldownSeconds: 1800,
    totalFloors: 5,
    dropQualityBonus: 2.2,
    specialReward: {
      name: '金丹真人',
      description: '试炼称号：防御+8%',
      chance: 0.25
    },
    floors: [
      { floor: 1, name: '天劫初临', monsterCount: 6, bossFloor: false, expReward: 250, stoneReward: 150, qualityBonus: 1.8 },
      { floor: 2, name: '天劫加身', monsterCount: 7, bossFloor: false, expReward: 380, stoneReward: 230, qualityBonus: 2.1 },
      { floor: 3, name: '天劫洗练', monsterCount: 5, bossFloor: false, expReward: 550, stoneReward: 350, qualityBonus: 2.5 },
      { floor: 4, name: '天劫淬体', monsterCount: 4, bossFloor: false, expReward: 750, stoneReward: 480, qualityBonus: 2.9 },
      { floor: 5, name: '天劫渡完', monsterCount: 3, bossFloor: true, expReward: 1200, stoneReward: 800, qualityBonus: 3.5 }
    ]
  },
  // 元婴期秘境
  {
    id: 'nascent_cave',
    name: '元婴圣地',
    type: 'ancient',
    realmIndex: 3,
    description: '蕴含上古秘密的秘境，挑战与机遇并存',
    icon: '🏔️',
    color: '#ba68c8',
    minLevel: 30,
    entryCost: 800,
    cooldownSeconds: 2400,
    totalFloors: 5,
    dropQualityBonus: 2.8,
    floors: [
      { floor: 1, name: '圣地外围', monsterCount: 6, bossFloor: false, expReward: 500, stoneReward: 300, qualityBonus: 2.2 },
      { floor: 2, name: '圣地深处', monsterCount: 7, bossFloor: false, expReward: 750, stoneReward: 450, qualityBonus: 2.6 },
      { floor: 3, name: '圣地核心', monsterCount: 5, bossFloor: false, expReward: 1100, stoneReward: 700, qualityBonus: 3.1 },
      { floor: 4, name: '秘境禁区', monsterCount: 4, bossFloor: false, expReward: 1600, stoneReward: 1000, qualityBonus: 3.6 },
      { floor: 5, name: '圣地终域', monsterCount: 3, bossFloor: true, expReward: 2500, stoneReward: 1600, qualityBonus: 4.2 }
    ]
  },
  // 出窍期秘境
  {
    id: 'soul_cave',
    name: '出窍幻境',
    type: 'ancient',
    realmIndex: 4,
    description: '考验神魂的幻境秘境，奖励极为丰厚',
    icon: '🌌',
    color: '#ba68c8',
    minLevel: 40,
    entryCost: 1200,
    cooldownSeconds: 3600,
    totalFloors: 6,
    dropQualityBonus: 3.5,
    floors: [
      { floor: 1, name: '幻境入口', monsterCount: 7, bossFloor: false, expReward: 800, stoneReward: 500, qualityBonus: 2.8 },
      { floor: 2, name: '心魔幻境', monsterCount: 8, bossFloor: false, expReward: 1200, stoneReward: 750, qualityBonus: 3.2 },
      { floor: 3, name: '幻境深处', monsterCount: 6, bossFloor: false, expReward: 1800, stoneReward: 1100, qualityBonus: 3.8 },
      { floor: 4, name: '幻境核心', monsterCount: 5, bossFloor: false, expReward: 2600, stoneReward: 1600, qualityBonus: 4.4 },
      { floor: 5, name: '幻境禁区', monsterCount: 4, bossFloor: false, expReward: 3800, stoneReward: 2400, qualityBonus: 5.0 },
      { floor: 6, name: '幻境终层', monsterCount: 3, bossFloor: true, expReward: 6000, stoneReward: 4000, qualityBonus: 6.0 }
    ]
  },
  // 化神期秘境
  {
    id: 'divine_cave',
    name: '化神遗迹',
    type: 'ancient',
    realmIndex: 5,
    description: '上古仙人遗迹，通关可获得神话装备',
    icon: '🗿',
    color: '#e91e63',
    minLevel: 50,
    entryCost: 2000,
    cooldownSeconds: 7200,
    totalFloors: 6,
    dropQualityBonus: 4.5,
    floors: [
      { floor: 1, name: '遗迹外围', monsterCount: 8, bossFloor: false, expReward: 1500, stoneReward: 900, qualityBonus: 3.6 },
      { floor: 2, name: '遗迹通道', monsterCount: 9, bossFloor: false, expReward: 2200, stoneReward: 1400, qualityBonus: 4.2 },
      { floor: 3, name: '遗迹大厅', monsterCount: 7, bossFloor: false, expReward: 3200, stoneReward: 2000, qualityBonus: 4.8 },
      { floor: 4, name: '遗迹核心', monsterCount: 6, bossFloor: false, expReward: 4500, stoneReward: 2800, qualityBonus: 5.5 },
      { floor: 5, name: '遗迹禁区', monsterCount: 5, bossFloor: false, expReward: 6500, stoneReward: 4000, qualityBonus: 6.2 },
      { floor: 6, name: '遗迹终域', monsterCount: 3, bossFloor: true, expReward: 10000, stoneReward: 6500, qualityBonus: 7.5 }
    ]
  },
  // 大乘期秘境
  {
    id: 'transcendent_realm',
    name: '飞升之路',
    type: 'ancient',
    realmIndex: 8,
    description: '传说中通往仙界的试炼，通关可获得太古装备',
    icon: '🚀',
    color: '#ffd700',
    minLevel: 80,
    entryCost: 5000,
    cooldownSeconds: 14400,
    totalFloors: 7,
    dropQualityBonus: 6.0,
    floors: [
      { floor: 1, name: '仙路起点', monsterCount: 10, bossFloor: false, expReward: 5000, stoneReward: 3000, qualityBonus: 5.0 },
      { floor: 2, name: '天门之前', monsterCount: 12, bossFloor: false, expReward: 8000, stoneReward: 5000, qualityBonus: 5.8 },
      { floor: 3, name: '九重天阶', monsterCount: 10, bossFloor: false, expReward: 12000, stoneReward: 7500, qualityBonus: 6.6 },
      { floor: 4, name: '仙宫外围', monsterCount: 8, bossFloor: false, expReward: 18000, stoneReward: 11000, qualityBonus: 7.5 },
      { floor: 5, name: '仙宫核心', monsterCount: 7, bossFloor: false, expReward: 28000, stoneReward: 18000, qualityBonus: 8.5 },
      { floor: 6, name: '天道禁区', monsterCount: 5, bossFloor: false, expReward: 45000, stoneReward: 30000, qualityBonus: 9.5 },
      { floor: 7, name: '飞升之门', monsterCount: 3, bossFloor: true, expReward: 80000, stoneReward: 50000, qualityBonus: 12.0 }
    ]
  }
]

// 功法模板（参考 Daoyou 的功法词条设计理念）
export const TECHNIQUE_TEMPLATES: Record<string, Omit<Technique, 'id'>> = {

  // ==================== 凡品功法（炼气期）====================
  // 主词条：基础属性

  'vitality_1': {
    name: '强身诀', quality: 'common', level: 1, category: 'body',
    realmRequirement: 0,
    description: '最基础的炼体法门，锻炼体魄，增强生命力',
    effects: [{ type: 'hpBonus', value: 50, description: '生命上限+50' }]
  },
  'spirit_1': {
    name: '聚气诀', quality: 'common', level: 1, category: 'spirit',
    realmRequirement: 0,
    description: '吸纳天地灵气，凝聚丹田气海',
    effects: [{ type: 'spiritPerSec', value: 0.5, description: '灵气+0.5/s' }]
  },
  'attack_1': {
    name: '引气入体', quality: 'common', level: 1, category: 'combat',
    realmRequirement: 0,
    description: '将灵气引入体内，增强攻击之力',
    effects: [{ type: 'attackBonus', value: 8, description: '攻击力+8' }]
  },
  'defense_1': {
    name: '护体术', quality: 'common', level: 2, category: 'body',
    realmRequirement: 0,
    description: '凝聚灵气护住周身，抵御外邪入侵',
    effects: [{ type: 'defenseBonus', value: 5, description: '防御力+5' }]
  },
  'dodge_1': {
    name: '灵巧身法', quality: 'common', level: 2, category: 'combat',
    realmRequirement: 0,
    description: '身形轻盈，灵巧闪避敌人攻击',
    effects: [{ type: 'dodgeRate', value: 2, description: '闪避率+2%' }]
  },
  'crit_1': {
    name: '凝元功', quality: 'common', level: 3, category: 'combat',
    realmRequirement: 0,
    description: '凝聚元气于一点，专注攻击要害',
    effects: [{ type: 'critRate', value: 3, description: '暴击率+3%' }]
  },

  // ==================== 灵品功法（炼气-筑基）====================
  // 主词条+副词条组合

  'vitality_2': {
    name: '铜皮铁骨', quality: 'fine', level: 5, category: 'body',
    realmRequirement: 0,
    description: '皮如铜铁，骨若金刚，炼体入门功法',
    effects: [
      { type: 'hpBonus', value: 120, description: '生命上限+120' },
      { type: 'defenseBonus', value: 10, description: '防御力+10' }
    ]
  },
  'spirit_2': {
    name: '灵气潮汐', quality: 'fine', level: 5, category: 'spirit',
    realmRequirement: 0,
    description: '灵气如潮水般涌动，加速周天运转',
    effects: [
      { type: 'spiritPerSec', value: 1.2, description: '灵气+1.2/s' },
      { type: 'attackBonus', value: 5, description: '攻击力+5' }
    ]
  },
  'attack_2': {
    name: '青云剑气', quality: 'fine', level: 6, category: 'combat',
    realmRequirement: 1,
    description: '剑气凝聚如青云，出手凌厉无匹',
    effects: [
      { type: 'attackBonus', value: 25, description: '攻击力+25' },
      { type: 'critRate', value: 4, description: '暴击率+4%' }
    ]
  },
  'defense_2': {
    name: '玄铁护体', quality: 'fine', level: 6, category: 'body',
    realmRequirement: 1,
    description: '身披玄铁之甲，防御坚不可摧',
    effects: [
      { type: 'defenseBonus', value: 20, description: '防御力+20' },
      { type: 'damageReduction', value: 4, description: '伤害减免+4%' }
    ]
  },
  'lifesteal_1': {
    name: '吸灵大法', quality: 'fine', level: 7, category: 'combat',
    realmRequirement: 1,
    description: '吸取敌人灵气化为生机，回血能力强',
    effects: [
      { type: 'lifesteal', value: 3, description: '吸血+3%' },
      { type: 'hpBonus', value: 80, description: '生命上限+80' }
    ]
  },
  'critdamage_1': {
    name: '致命一击', quality: 'fine', level: 7, category: 'combat',
    realmRequirement: 1,
    description: '攻击附带致命效果，暴击伤害提升',
    effects: [
      { type: 'critRate', value: 3, description: '暴击率+3%' },
      { type: 'critDamage', value: 25, description: '暴击伤害+25%' }
    ]
  },

  // ==================== 玄品功法（筑基-金丹）====================
  // 主词条+2个副词条

  'body_master_1': {
    name: '金刚不坏', quality: 'rare', level: 10, category: 'body',
    realmRequirement: 1,
    description: '体若金刚，坚不可摧，炼体小成',
    effects: [
      { type: 'hpBonus', value: 300, description: '生命上限+300' },
      { type: 'defenseBonus', value: 35, description: '防御力+35' },
      { type: 'damageReduction', value: 5, description: '伤害减免+5%' }
    ]
  },
  'spirit_master_1': {
    name: '吞天噬地', quality: 'rare', level: 10, category: 'spirit',
    realmRequirement: 1,
    description: '吞噬天地灵气化为己用，修炼速度大增',
    effects: [
      { type: 'spiritPerSec', value: 2.5, description: '灵气+2.5/s' },
      { type: 'attackBonus', value: 15, description: '攻击力+15' }
    ]
  },
  'attack_master_1': {
    name: '烈焰斩', quality: 'rare', level: 11, category: 'combat',
    realmRequirement: 2,
    description: '凝聚烈焰之力，斩敌于千里之外',
    effects: [
      { type: 'attackBonus', value: 50, description: '攻击力+50' },
      { type: 'critRate', value: 6, description: '暴击率+6%' },
      { type: 'critDamage', value: 35, description: '暴击伤害+35%' }
    ]
  },
  'defense_master_1': {
    name: '不动如山', quality: 'rare', level: 11, category: 'body',
    realmRequirement: 2,
    description: '稳如磐石，万法不侵',
    effects: [
      { type: 'defenseBonus', value: 45, description: '防御力+45' },
      { type: 'damageReduction', value: 10, description: '伤害减免+10%' },
      { type: 'hpBonus', value: 200, description: '生命上限+200' }
    ]
  },
  'dodge_master_1': {
    name: '虚空步', quality: 'rare', level: 12, category: 'combat',
    realmRequirement: 2,
    description: '行走虚空，来去无踪',
    effects: [
      { type: 'dodgeRate', value: 8, description: '闪避率+8%' },
      { type: 'defenseBonus', value: 20, description: '防御力+20' }
    ]
  },
  'regen_1': {
    name: '生生不息', quality: 'rare', level: 12, category: 'body',
    realmRequirement: 2,
    description: '生机绵绵不绝，每时每刻都在恢复',
    effects: [
      { type: 'regenPerSec', value: 5, description: '每秒回复+5' },
      { type: 'lifesteal', value: 4, description: '吸血+4%' }
    ]
  },

  // ==================== 真品功法（金丹-元婴）====================
  // 高阶战斗功法

  'body_advanced_1': {
    name: '不灭金身', quality: 'epic', level: 15, category: 'body',
    realmRequirement: 2,
    description: '肉身不灭，滴血可重生，炼体大成',
    effects: [
      { type: 'hpBonus', value: 500, description: '生命上限+500' },
      { type: 'lifesteal', value: 8, description: '吸血+8%' },
      { type: 'regenPerSec', value: 8, description: '每秒回复+8' }
    ]
  },
  'spirit_advanced_1': {
    name: '仙灵纳气', quality: 'epic', level: 15, category: 'spirit',
    realmRequirement: 2,
    description: '吸纳仙灵之气，修炼速度大幅提升',
    effects: [
      { type: 'spiritPerSec', value: 5, description: '灵气+5/s' },
      { type: 'hpBonus', value: 300, description: '生命上限+300' },
      { type: 'attackBonus', value: 30, description: '攻击力+30' }
    ]
  },
  'attack_advanced_1': {
    name: '天雷破空', quality: 'epic', level: 16, category: 'combat',
    realmRequirement: 3,
    description: '天雷降世，破灭苍穹',
    effects: [
      { type: 'attackBonus', value: 100, description: '攻击力+100' },
      { type: 'critRate', value: 10, description: '暴击率+10%' },
      { type: 'critDamage', value: 80, description: '暴击伤害+80%' }
    ]
  },
  'defense_advanced_1': {
    name: '天罗万象', quality: 'epic', level: 16, category: 'body',
    realmRequirement: 3,
    description: '万象森罗，护体无疆',
    effects: [
      { type: 'defenseBonus', value: 80, description: '防御力+80' },
      { type: 'damageReduction', value: 18, description: '伤害减免+18%' },
      { type: 'hpBonus', value: 400, description: '生命上限+400' }
    ]
  },
  'crit_master_1': {
    name: '天诛地灭', quality: 'epic', level: 17, category: 'combat',
    realmRequirement: 3,
    description: '天地同诛，毁灭一击',
    effects: [
      { type: 'critRate', value: 18, description: '暴击率+18%' },
      { type: 'critDamage', value: 120, description: '暴击伤害+120%' },
      { type: 'attackBonus', value: 60, description: '攻击力+60' }
    ]
  },
  'reflect_1': {
    name: '镜像诀', quality: 'epic', level: 17, category: 'body',
    realmRequirement: 3,
    description: '以彼之道还施彼身，被攻击时反弹伤害',
    effects: [
      { type: 'reflectDamage', value: 15, description: '反弹伤害+15%' },
      { type: 'defenseBonus', value: 50, description: '防御力+50' },
      { type: 'damageReduction', value: 8, description: '伤害减免+8%' }
    ]
  },
  'dodge_advanced_1': {
    name: '仙影迷踪', quality: 'epic', level: 18, category: 'combat',
    realmRequirement: 4,
    description: '仙人步法，幻影难测',
    effects: [
      { type: 'dodgeRate', value: 12, description: '闪避率+12%' },
      { type: 'defenseBonus', value: 40, description: '防御力+40' },
      { type: 'damageReduction', value: 6, description: '伤害减免+6%' }
    ]
  },
  'lifesteal_advanced_1': {
    name: '血魔大法', quality: 'epic', level: 18, category: 'combat',
    realmRequirement: 4,
    description: '吸血为生，战意越强，吸血越多',
    effects: [
      { type: 'lifesteal', value: 15, description: '吸血+15%' },
      { type: 'attackBonus', value: 50, description: '攻击力+50' },
      { type: 'hpBonus', value: 250, description: '生命上限+250' }
    ]
  },

  // ==================== 地品功法（元婴-化神）====================
  // 五行元素功法

  'fire_essence': {
    name: '火灵诀', quality: 'excellent', level: 20, category: 'element',
    realmRequirement: 3,
    description: '凝聚火灵之气，灼烧敌人',
    effects: [
      { type: 'attackBonus', value: 120, description: '攻击力+120' },
      { type: 'critRate', value: 8, description: '暴击率+8%' },
      { type: 'critDamage', value: 60, description: '暴击伤害+60%' }
    ]
  },
  'thunder_essence': {
    name: '雷神诀', quality: 'excellent', level: 20, category: 'element',
    realmRequirement: 3,
    description: '引动天雷之力，雷霆万钧',
    effects: [
      { type: 'attackBonus', value: 110, description: '攻击力+110' },
      { type: 'critRate', value: 12, description: '暴击率+12%' },
      { type: 'critDamage', value: 50, description: '暴击伤害+50%' }
    ]
  },
  'ice_essence': {
    name: '冰魄诀', quality: 'excellent', level: 21, category: 'element',
    realmRequirement: 4,
    description: '凝练冰魄真气，冰封万物',
    effects: [
      { type: 'defenseBonus', value: 100, description: '防御力+100' },
      { type: 'damageReduction', value: 15, description: '伤害减免+15%' },
      { type: 'dodgeRate', value: 5, description: '闪避率+5%' }
    ]
  },
  'wind_essence': {
    name: '风之精髓', quality: 'excellent', level: 21, category: 'element',
    realmRequirement: 4,
    description: '御风而行，快如闪电',
    effects: [
      { type: 'dodgeRate', value: 15, description: '闪避率+15%' },
      { type: 'attackBonus', value: 80, description: '攻击力+80' },
      { type: 'critRate', value: 6, description: '暴击率+6%' }
    ]
  },
  'earth_essence': {
    name: '地之精髓', quality: 'excellent', level: 22, category: 'element',
    realmRequirement: 4,
    description: '大地之力，厚重如山',
    effects: [
      { type: 'hpBonus', value: 800, description: '生命上限+800' },
      { type: 'defenseBonus', value: 80, description: '防御力+80' },
      { type: 'damageReduction', value: 12, description: '伤害减免+12%' }
    ]
  },
  'metal_essence': {
    name: '金之精髓', quality: 'excellent', level: 22, category: 'element',
    realmRequirement: 5,
    description: '金气淬体，锋芒毕露',
    effects: [
      { type: 'attackBonus', value: 150, description: '攻击力+150' },
      { type: 'critDamage', value: 80, description: '暴击伤害+80%' },
      { type: 'critRate', value: 5, description: '暴击率+5%' }
    ]
  },
  'wood_essence': {
    name: '木之精髓', quality: 'excellent', level: 23, category: 'element',
    realmRequirement: 5,
    description: '木灵生气，生生不息',
    effects: [
      { type: 'regenPerSec', value: 15, description: '每秒回复+15' },
      { type: 'lifesteal', value: 10, description: '吸血+10%' },
      { type: 'hpBonus', value: 500, description: '生命上限+500' }
    ]
  },
  'ultimate_body': {
    name: '不死之身', quality: 'excellent', level: 24, category: 'ultimate',
    realmRequirement: 5,
    description: '滴血重生，永生不灭',
    effects: [
      { type: 'hpBonus', value: 1000, description: '生命上限+1000' },
      { type: 'lifesteal', value: 20, description: '吸血+20%' },
      { type: 'regenPerSec', value: 20, description: '每秒回复+20' },
      { type: 'damageReduction', value: 10, description: '伤害减免+10%' }
    ]
  },

  // ==================== 天品功法（炼虚-合体）====================
  // 高阶功法

  'attack_superior': {
    name: '弑神诀', quality: 'superior', level: 25, category: 'combat',
    realmRequirement: 5,
    description: '弑杀神明之力，威能惊天动地',
    effects: [
      { type: 'attackBonus', value: 250, description: '攻击力+250' },
      { type: 'critRate', value: 15, description: '暴击率+15%' },
      { type: 'critDamage', value: 180, description: '暴击伤害+180%' },
      { type: 'lifesteal', value: 10, description: '吸血+10%' }
    ]
  },
  'defense_superior': {
    name: '天道护体', quality: 'superior', level: 25, category: 'body',
    realmRequirement: 5,
    description: '天道法则护体，金身不坏',
    effects: [
      { type: 'defenseBonus', value: 180, description: '防御力+180' },
      { type: 'damageReduction', value: 28, description: '伤害减免+28%' },
      { type: 'hpBonus', value: 1200, description: '生命上限+1200' },
      { type: 'dodgeRate', value: 8, description: '闪避率+8%' }
    ]
  },
  'spirit_superior': {
    name: '太初混沌', quality: 'superior', level: 26, category: 'spirit',
    realmRequirement: 6,
    description: '太初混沌之气，蕴含无穷伟力',
    effects: [
      { type: 'spiritPerSec', value: 12, description: '灵气+12/s' },
      { type: 'attackBonus', value: 100, description: '攻击力+100' },
      { type: 'defenseBonus', value: 100, description: '防御力+100' },
      { type: 'hpBonus', value: 600, description: '生命上限+600' }
    ]
  },
  'ultimate_attack': {
    name: '天罚神雷', quality: 'superior', level: 27, category: 'combat',
    realmRequirement: 6,
    description: '神雷降世，天罚无敌',
    effects: [
      { type: 'critRate', value: 25, description: '暴击率+25%' },
      { type: 'critDamage', value: 250, description: '暴击伤害+250%' },
      { type: 'attackBonus', value: 180, description: '攻击力+180' }
    ]
  },
  'ultimate_dodge': {
    name: '大虚空术', quality: 'superior', level: 28, category: 'combat',
    realmRequirement: 6,
    description: '穿梭虚空，来去自如',
    effects: [
      { type: 'dodgeRate', value: 22, description: '闪避率+22%' },
      { type: 'damageReduction', value: 18, description: '伤害减免+18%' },
      { type: 'defenseBonus', value: 80, description: '防御力+80' }
    ]
  },
  'ultimate_spirit': {
    name: '万灵归元', quality: 'superior', level: 29, category: 'spirit',
    realmRequirement: 6,
    description: '万灵归一，返璞归真',
    effects: [
      { type: 'spiritPerSec', value: 20, description: '灵气+20/s' },
      { type: 'hpBonus', value: 800, description: '生命上限+800' },
      { type: 'attackBonus', value: 80, description: '攻击力+80' },
      { type: 'regenPerSec', value: 15, description: '每秒回复+15' }
    ]
  },

  // ==================== 仙品功法（大乘期）====================
  // 仙级功法

  'immortal_attack': {
    name: '天帝诀', quality: 'immortal', level: 30, category: 'ultimate',
    realmRequirement: 6,
    description: '天帝所创功法，威压万界',
    effects: [
      { type: 'attackBonus', value: 400, description: '攻击力+400' },
      { type: 'critRate', value: 20, description: '暴击率+20%' },
      { type: 'critDamage', value: 300, description: '暴击伤害+300%' },
      { type: 'lifesteal', value: 18, description: '吸血+18%' }
    ]
  },
  'immortal_defense': {
    name: '天罗地网', quality: 'immortal', level: 30, category: 'body',
    realmRequirement: 6,
    description: '天罗地网，无处可逃，无物可破',
    effects: [
      { type: 'defenseBonus', value: 300, description: '防御力+300' },
      { type: 'damageReduction', value: 35, description: '伤害减免+35%' },
      { type: 'hpBonus', value: 2000, description: '生命上限+2000' },
      { type: 'dodgeRate', value: 10, description: '闪避率+10%' }
    ]
  },
  'immortal_body': {
    name: '不灭仙体', quality: 'immortal', level: 31, category: 'ultimate',
    realmRequirement: 7,
    description: '成就不灭仙体，与天地同寿',
    effects: [
      { type: 'hpBonus', value: 3000, description: '生命上限+3000' },
      { type: 'lifesteal', value: 30, description: '吸血+30%' },
      { type: 'regenPerSec', value: 40, description: '每秒回复+40' },
      { type: 'damageReduction', value: 20, description: '伤害减免+20%' }
    ]
  },
  'immortal_spirit': {
    name: '混沌归元', quality: 'immortal', level: 32, category: 'spirit',
    realmRequirement: 7,
    description: '混沌初开，万气归元',
    effects: [
      { type: 'spiritPerSec', value: 30, description: '灵气+30/s' },
      { type: 'attackBonus', value: 200, description: '攻击力+200' },
      { type: 'defenseBonus', value: 150, description: '防御力+150' },
      { type: 'hpBonus', value: 1500, description: '生命上限+1500' }
    ]
  },
  'immortal_crit': {
    name: '灭世神罚', quality: 'immortal', level: 33, category: 'combat',
    realmRequirement: 7,
    description: '神罚降临，灭世一击',
    effects: [
      { type: 'critRate', value: 35, description: '暴击率+35%' },
      { type: 'critDamage', value: 400, description: '暴击伤害+400%' },
      { type: 'attackBonus', value: 300, description: '攻击力+300' }
    ]
  },

  // ==================== 神品功法（渡劫期）====================
  // 终极功法

  'divine_attack': {
    name: '大道独尊', quality: 'divine', level: 35, category: 'ultimate',
    realmRequirement: 7,
    description: '大道独尊，唯我独仙',
    effects: [
      { type: 'attackBonus', value: 600, description: '攻击力+600' },
      { type: 'critRate', value: 25, description: '暴击率+25%' },
      { type: 'critDamage', value: 500, description: '暴击伤害+500%' },
      { type: 'lifesteal', value: 25, description: '吸血+25%' }
    ]
  },
  'divine_defense': {
    name: '万劫不灭', quality: 'divine', level: 35, category: 'ultimate',
    realmRequirement: 7,
    description: '万劫加身而不灭，永生不灭',
    effects: [
      { type: 'defenseBonus', value: 450, description: '防御力+450' },
      { type: 'damageReduction', value: 45, description: '伤害减免+45%' },
      { type: 'hpBonus', value: 4000, description: '生命上限+4000' },
      { type: 'reflectDamage', value: 30, description: '反弹伤害+30%' }
    ]
  },
  'divine_body': {
    name: '神魂不灭', quality: 'divine', level: 36, category: 'ultimate',
    realmRequirement: 8,
    description: '神魂永存，肉身不朽',
    effects: [
      { type: 'hpBonus', value: 5000, description: '生命上限+5000' },
      { type: 'lifesteal', value: 40, description: '吸血+40%' },
      { type: 'regenPerSec', value: 80, description: '每秒回复+80' },
      { type: 'damageReduction', value: 25, description: '伤害减免+25%' }
    ]
  },
  'divine_spirit': {
    name: '永恒真仙', quality: 'divine', level: 38, category: 'ultimate',
    realmRequirement: 8,
    description: '永恒真仙，万古长存',
    effects: [
      { type: 'spiritPerSec', value: 50, description: '灵气+50/s' },
      { type: 'attackBonus', value: 400, description: '攻击力+400' },
      { type: 'defenseBonus', value: 300, description: '防御力+300' },
      { type: 'hpBonus', value: 3000, description: '生命上限+3000' },
      { type: 'critRate', value: 20, description: '暴击率+20%' }
    ]
  },
  'ultimate_divine': {
    name: '大道归一', quality: 'divine', level: 40, category: 'ultimate',
    realmRequirement: 8,
    description: '万法归一，大道至简，超脱一切',
    effects: [
      { type: 'attackBonus', value: 800, description: '攻击力+800' },
      { type: 'defenseBonus', value: 500, description: '防御力+500' },
      { type: 'hpBonus', value: 6000, description: '生命上限+6000' },
      { type: 'critRate', value: 30, description: '暴击率+30%' },
      { type: 'critDamage', value: 600, description: '暴击伤害+600%' },
      { type: 'damageReduction', value: 35, description: '伤害减免+35%' },
      { type: 'lifesteal', value: 30, description: '吸血+30%' },
      { type: 'dodgeRate', value: 20, description: '闪避率+20%' },
      { type: 'spiritPerSec', value: 30, description: '灵气+30/s' },
      { type: 'regenPerSec', value: 50, description: '每秒回复+50' }
    ]
  }
}
