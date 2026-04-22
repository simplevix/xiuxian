import type { Effect } from '../effect/types'

/**
 * 装备词缀类型
 */
export type AffixType = 
  | 'prefix'   // 前缀
  | 'suffix'   // 后缀
  | 'implicit' // 固有词缀
  | 'enchant'  // 附魔词缀

/**
 * 装备词缀
 */
export interface EquipmentAffix {
  id: string
  name: string
  type: AffixType
  description: string
  
  // 词缀等级
  level: number
  tier: number  // 1-10，越高越好
  
  // 属性加成
  stats?: {
    stat: string
    value: number
    operation: 'Add' | 'Multiply' | 'AddPercent'
  }[]
  
  // 效果绑定
  effects?: Effect[]
  
  // 触发器
  triggers?: {
    trigger: string
    chance: number
    effects: Effect[]
  }[]
  
  // 适用装备类型
  allowedSlots: string[]
  
  // 品质要求
  minQuality: string
  maxQuality: string
  
  // 等级要求
  minLevel: number
  maxLevel: number
}

/**
 * 装备效果模板
 */
export interface EquipmentEffectTemplate {
  id: string
  name: string
  description: string
  
  // 触发条件
  trigger: string
  triggerChance: number
  cooldown: number
  
  // 效果
  effects: Effect[]
  
  // 视觉表现
  visual?: {
    effect: string
    color: string
  }
}

/**
 * 装备套装效果
 */
export interface SetBonus {
  setId: string
  setName: string
  
  // 2件套效果
  bonus2?: {
    stats?: { stat: string; value: number }[]
    effects?: Effect[]
    description: string
  }
  
  // 4件套效果
  bonus4?: {
    stats?: { stat: string; value: number }[]
    effects?: Effect[]
    description: string
  }
  
  // 6件套效果
  bonus6?: {
    stats?: { stat: string; value: number }[]
    effects?: Effect[]
    description: string
  }
}

/**
 * 强化等级定义
 */
export interface EnhancementLevel {
  level: number
  name: string
  
  // 属性加成倍率
  statMultiplier: number
  
  // 额外词缀槽
  extraAffixSlots: number
  
  // 特殊效果解锁
  unlocksEffect?: string
  
  // 视觉变化
  visualEffect?: string
  
  // 所需材料
  requiredMaterials: {
    itemId: string
    count: number
  }[]
  
  // 成功率
  successRate: number
  
  // 失败惩罚
  failurePenalty?: {
    levelDrop: boolean
    destroyChance: number
  }
}

/**
 * 强化等级配置（+0到+12）
 */
export const ENHANCEMENT_LEVELS: EnhancementLevel[] = [
  { level: 0, name: '+0', statMultiplier: 1.0, extraAffixSlots: 0, requiredMaterials: [], successRate: 1.0 },
  { level: 1, name: '+1', statMultiplier: 1.1, extraAffixSlots: 0, requiredMaterials: [{ itemId: 'enhance_stone', count: 1 }], successRate: 1.0 },
  { level: 2, name: '+2', statMultiplier: 1.2, extraAffixSlots: 0, requiredMaterials: [{ itemId: 'enhance_stone', count: 2 }], successRate: 1.0 },
  { level: 3, name: '+3', statMultiplier: 1.3, extraAffixSlots: 0, requiredMaterials: [{ itemId: 'enhance_stone', count: 3 }], successRate: 1.0 },
  { level: 4, name: '+4', statMultiplier: 1.4, extraAffixSlots: 0, requiredMaterials: [{ itemId: 'enhance_stone', count: 5 }], successRate: 0.95 },
  { level: 5, name: '+5', statMultiplier: 1.5, extraAffixSlots: 0, requiredMaterials: [{ itemId: 'enhance_stone', count: 8 }], successRate: 0.9 },
  { level: 6, name: '+6', statMultiplier: 1.6, extraAffixSlots: 1, requiredMaterials: [{ itemId: 'enhance_stone', count: 12 }], successRate: 0.85 },
  { level: 7, name: '+7', statMultiplier: 1.7, extraAffixSlots: 1, requiredMaterials: [{ itemId: 'enhance_stone', count: 18 }], successRate: 0.8 },
  { level: 8, name: '+8', statMultiplier: 1.8, extraAffixSlots: 1, requiredMaterials: [{ itemId: 'enhance_stone', count: 25 }], successRate: 0.75 },
  { level: 9, name: '+9', statMultiplier: 1.9, extraAffixSlots: 2, requiredMaterials: [{ itemId: 'enhance_stone', count: 35 }], successRate: 0.7 },
  { level: 10, name: '+10', statMultiplier: 2.0, extraAffixSlots: 2, requiredMaterials: [{ itemId: 'enhance_stone', count: 50 }], successRate: 0.65 },
  { level: 11, name: '+11', statMultiplier: 2.2, extraAffixSlots: 2, requiredMaterials: [{ itemId: 'enhance_stone', count: 70 }], successRate: 0.6 },
  { level: 12, name: '+12', statMultiplier: 2.5, extraAffixSlots: 3, requiredMaterials: [{ itemId: 'enhance_stone', count: 100 }], successRate: 0.5, visualEffect: 'golden_glow' }
]

/**
 * 词缀注册表
 */
export class AffixRegistry {
  private affixes: Map<string, EquipmentAffix> = new Map()
  private byType: Map<AffixType, EquipmentAffix[]> = new Map()
  private bySlot: Map<string, EquipmentAffix[]> = new Map()

  register(affix: EquipmentAffix): void {
    this.affixes.set(affix.id, affix)
    
    // 按类型索引
    if (!this.byType.has(affix.type)) {
      this.byType.set(affix.type, [])
    }
    this.byType.get(affix.type)!.push(affix)
    
    // 按槽位索引
    for (const slot of affix.allowedSlots) {
      if (!this.bySlot.has(slot)) {
        this.bySlot.set(slot, [])
      }
      this.bySlot.get(slot)!.push(affix)
    }
  }

  get(id: string): EquipmentAffix | undefined {
    return this.affixes.get(id)
  }

  getByType(type: AffixType): EquipmentAffix[] {
    return this.byType.get(type) || []
  }

  getBySlot(slot: string): EquipmentAffix[] {
    return this.bySlot.get(slot) || []
  }

  getRandomForSlot(slot: string, quality: string, level: number, type?: AffixType): EquipmentAffix | null {
    let candidates = this.getBySlot(slot).filter(a => {
      if (type && a.type !== type) return false
      if (level < a.minLevel || level > a.maxLevel) return false
      // 品质检查
      const qualityOrder = ['common', 'good', 'rare', 'epic', 'legendary']
      const itemQualityIdx = qualityOrder.indexOf(quality)
      const minQualityIdx = qualityOrder.indexOf(a.minQuality)
      const maxQualityIdx = qualityOrder.indexOf(a.maxQuality)
      return itemQualityIdx >= minQualityIdx && itemQualityIdx <= maxQualityIdx
    })

    if (candidates.length === 0) return null
    return candidates[Math.floor(Math.random() * candidates.length)]
  }
}

// 全局词缀注册表
export const affixRegistry = new AffixRegistry()

/**
 * 预定义词缀
 */
export const DEFAULT_AFFIXES: EquipmentAffix[] = [
  // 攻击类前缀
  {
    id: 'sharp',
    name: '锋利的',
    type: 'prefix',
    description: '增加攻击力',
    level: 1,
    tier: 1,
    stats: [{ stat: 'attack', value: 5, operation: 'Add' }],
    allowedSlots: ['weapon', 'ring'],
    minQuality: 'common',
    maxQuality: 'legendary',
    minLevel: 1,
    maxLevel: 100
  },
  {
    id: 'powerful',
    name: '强力的',
    type: 'prefix',
    description: '大幅增加攻击力',
    level: 10,
    tier: 3,
    stats: [{ stat: 'attack', value: 15, operation: 'Add' }],
    allowedSlots: ['weapon', 'ring'],
    minQuality: 'good',
    maxQuality: 'legendary',
    minLevel: 10,
    maxLevel: 100
  },
  {
    id: 'devastating',
    name: '毁灭的',
    type: 'prefix',
    description: '极大增加攻击力',
    level: 30,
    tier: 5,
    stats: [{ stat: 'attack', value: 0.1, operation: 'AddPercent' }],
    allowedSlots: ['weapon'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 30,
    maxLevel: 100
  },

  // 防御类前缀
  {
    id: 'sturdy',
    name: '坚固的',
    type: 'prefix',
    description: '增加防御力',
    level: 1,
    tier: 1,
    stats: [{ stat: 'defense', value: 3, operation: 'Add' }],
    allowedSlots: ['armor', 'helmet', 'boots', 'shield'],
    minQuality: 'common',
    maxQuality: 'legendary',
    minLevel: 1,
    maxLevel: 100
  },
  {
    id: 'fortified',
    name: '强化的',
    type: 'prefix',
    description: '大幅增加防御力',
    level: 15,
    tier: 3,
    stats: [{ stat: 'defense', value: 10, operation: 'Add' }],
    allowedSlots: ['armor', 'helmet', 'shield'],
    minQuality: 'good',
    maxQuality: 'legendary',
    minLevel: 15,
    maxLevel: 100
  },

  // 生命类前缀
  {
    id: 'vital',
    name: '生命的',
    type: 'prefix',
    description: '增加生命值',
    level: 1,
    tier: 2,
    stats: [{ stat: 'maxHp', value: 20, operation: 'Add' }],
    allowedSlots: ['armor', 'helmet', 'belt', 'amulet'],
    minQuality: 'common',
    maxQuality: 'legendary',
    minLevel: 1,
    maxLevel: 100
  },
  {
    id: 'vigorous',
    name: '旺盛的',
    type: 'prefix',
    description: '大幅增加生命值',
    level: 20,
    tier: 4,
    stats: [{ stat: 'maxHp', value: 0.05, operation: 'AddPercent' }],
    allowedSlots: ['armor', 'belt'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 20,
    maxLevel: 100
  },

  // 暴击类后缀
  {
    id: 'of_critical',
    name: '之暴击',
    type: 'suffix',
    description: '增加暴击率',
    level: 5,
    tier: 2,
    stats: [{ stat: 'critRate', value: 0.03, operation: 'Add' }],
    allowedSlots: ['weapon', 'ring', 'amulet'],
    minQuality: 'good',
    maxQuality: 'legendary',
    minLevel: 5,
    maxLevel: 100
  },
  {
    id: 'of_destruction',
    name: '之毁灭',
    type: 'suffix',
    description: '增加暴击伤害',
    level: 15,
    tier: 4,
    stats: [{ stat: 'critDamage', value: 0.1, operation: 'Add' }],
    allowedSlots: ['weapon', 'ring'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 15,
    maxLevel: 100
  },

  // 闪避类后缀
  {
    id: 'of_evasion',
    name: '之闪避',
    type: 'suffix',
    description: '增加闪避率',
    level: 5,
    tier: 2,
    stats: [{ stat: 'dodgeRate', value: 0.02, operation: 'Add' }],
    allowedSlots: ['boots', 'ring', 'amulet'],
    minQuality: 'good',
    maxQuality: 'legendary',
    minLevel: 5,
    maxLevel: 100
  },

  // 吸血类后缀
  {
    id: 'of_leeching',
    name: '之吸血',
    type: 'suffix',
    description: '增加生命偷取',
    level: 20,
    tier: 4,
    stats: [{ stat: 'lifesteal', value: 0.03, operation: 'Add' }],
    allowedSlots: ['weapon', 'ring'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 20,
    maxLevel: 100
  },

  // 特殊效果词缀
  {
    id: 'burning_weapon',
    name: '燃烧的',
    type: 'prefix',
    description: '攻击时有几率造成燃烧',
    level: 25,
    tier: 5,
    triggers: [{
      trigger: 'ON_HIT',
      chance: 0.2,
      effects: [{
        type: 'AddBuff',
        data: {
          buffId: 'burn',
          duration: 3,
          stacks: 1
        }
      }]
    }],
    allowedSlots: ['weapon'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 25,
    maxLevel: 100
  },
  {
    id: 'poison_weapon',
    name: '淬毒的',
    type: 'prefix',
    description: '攻击时有几率使敌人中毒',
    level: 20,
    tier: 4,
    triggers: [{
      trigger: 'ON_HIT',
      chance: 0.25,
      effects: [{
        type: 'AddBuff',
        data: {
          buffId: 'poison',
          duration: 4,
          stacks: 1
        }
      }]
    }],
    allowedSlots: ['weapon'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 20,
    maxLevel: 100
  },
  {
    id: 'reflect_damage',
    name: '荆棘的',
    type: 'prefix',
    description: '受到伤害时反射部分伤害',
    level: 30,
    tier: 5,
    stats: [{ stat: 'reflectDamage', value: 0.1, operation: 'Add' }],
    allowedSlots: ['armor', 'shield'],
    minQuality: 'epic',
    maxQuality: 'legendary',
    minLevel: 30,
    maxLevel: 100
  },
  {
    id: 'damage_reduction',
    name: '守护的',
    type: 'prefix',
    description: '减少受到的伤害',
    level: 25,
    tier: 4,
    stats: [{ stat: 'damageReduction', value: 0.05, operation: 'Add' }],
    allowedSlots: ['armor', 'helmet', 'shield'],
    minQuality: 'rare',
    maxQuality: 'legendary',
    minLevel: 25,
    maxLevel: 100
  },

  // 固有词缀（特定装备自带）
  {
    id: 'sword_implicit',
    name: '剑之锋锐',
    type: 'implicit',
    description: '剑类武器固有属性',
    level: 1,
    tier: 1,
    stats: [{ stat: 'critRate', value: 0.02, operation: 'Add' }],
    allowedSlots: ['weapon'],
    minQuality: 'common',
    maxQuality: 'legendary',
    minLevel: 1,
    maxLevel: 100
  },
  {
    id: 'armor_implicit',
    name: '护甲坚韧',
    type: 'implicit',
    description: '护甲固有属性',
    level: 1,
    tier: 1,
    stats: [{ stat: 'damageReduction', value: 0.02, operation: 'Add' }],
    allowedSlots: ['armor'],
    minQuality: 'common',
    maxQuality: 'legendary',
    minLevel: 1,
    maxLevel: 100
  }
]

// 注册默认词缀
DEFAULT_AFFIXES.forEach(affix => affixRegistry.register(affix))

/**
 * 套装定义
 */
export const SET_BONUSES: SetBonus[] = [
  {
    setId: 'dragon_slayer',
    setName: '屠龙者套装',
    bonus2: {
      stats: [{ stat: 'attack', value: 20 }],
      description: '2件套：攻击力+20'
    },
    bonus4: {
      stats: [{ stat: 'critRate', value: 0.05 }],
      effects: [{
        type: 'AddBuff',
        data: { buffId: 'attack_up', duration: 5, stacks: 1 }
      }],
      description: '4件套：暴击率+5%，攻击时有几率获得攻击提升'
    }
  },
  {
    setId: 'immortal_guardian',
    setName: '不朽守护者',
    bonus2: {
      stats: [{ stat: 'maxHp', value: 100 }],
      description: '2件套：生命值+100'
    },
    bonus4: {
      stats: [{ stat: 'defense', value: 30 }],
      description: '4件套：防御力+30'
    },
    bonus6: {
      effects: [{
        type: 'Trigger',
        data: { trigger: 'ON_BEING_HIT', chance: 0.1, effect: 'heal_10_percent' }
      }],
      description: '6件套：受到伤害时10%几率恢复10%生命值'
    }
  }
]
