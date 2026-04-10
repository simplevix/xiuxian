import type { Effect, EffectTrigger } from '../effect/types'

/**
 * Buff标签类型
 */
export type BuffTag = 
  | 'BUFF'      // 增益
  | 'DEBUFF'    // 减益
  | 'CONTROL'   // 控制
  | 'DOT'       // 持续伤害
  | 'HOT'       // 持续治疗
  | 'SHIELD'    // 护盾
  | 'STEALTH'   // 隐身
  | 'INVINCIBLE'// 无敌
  | 'SILENCE'   // 沉默
  | 'STUN'      // 眩晕
  | 'POISON'    // 中毒
  | 'BURN'      // 燃烧
  | 'BLEED'     // 流血
  | 'FROZEN'    // 冰冻

/**
 * Buff模板定义
 */
export interface BuffTemplate {
  id: string
  name: string
  description: string
  icon?: string
  duration: number
  maxStacks: number
  tags: BuffTag[]
  
  // 触发效果
  onApply?: Effect[]      // 获得时触发
  onRemove?: Effect[]     // 移除时触发
  onTick?: Effect[]       // 每回合触发（DOT/HOT）
  onExpire?: Effect[]     // 到期时触发
  
  // 属性修正
  statModifiers?: {
    stat: string
    value: number
    operation: 'Add' | 'Multiply' | 'AddPercent'
  }[]
  
  // 触发器绑定
  triggers?: {
    trigger: EffectTrigger
    effects: Effect[]
    chance?: number
  }[]
  
  // 特殊规则
  canBeDispelled: boolean
  canBeStacked: boolean
  isUnique: boolean       // 是否唯一（同名Buff只能存在一个）
  priority: number        // 优先级（用于相同触发时序）
}

/**
 * Buff实例
 */
export interface BuffInstance {
  id: string              // 实例ID
  templateId: string      // 模板ID
  name: string
  description: string
  icon?: string
  
  duration: number        // 剩余回合
  maxDuration: number     // 最大持续回合
  stacks: number          // 当前层数
  maxStacks: number       // 最大层数
  
  tags: BuffTag[]
  source?: any            // 施加者
  target?: any            // 目标
  
  // 运行时数据
  data: Record<string, any>
  
  // 是否已经触发过期效果
  hasTriggeredExpire: boolean
}

/**
 * Buff注册表
 */
export class BuffRegistry {
  private templates: Map<string, BuffTemplate> = new Map()

  /**
   * 注册Buff模板
   */
  register(template: BuffTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * 获取Buff模板
   */
  get(id: string): BuffTemplate | undefined {
    return this.templates.get(id)
  }

  /**
   * 检查Buff是否存在
   */
  has(id: string): boolean {
    return this.templates.has(id)
  }

  /**
   * 获取所有Buff模板
   */
  getAll(): BuffTemplate[] {
    return Array.from(this.templates.values())
  }

  /**
   * 根据标签获取Buff
   */
  getByTag(tag: BuffTag): BuffTemplate[] {
    return this.getAll().filter(t => t.tags.includes(tag))
  }
}

// 全局Buff注册表实例
export const buffRegistry = new BuffRegistry()

/**
 * 创建Buff实例
 */
export function createBuffInstance(
  templateId: string, 
  source?: any, 
  target?: any,
  initialStacks: number = 1
): BuffInstance | null {
  const template = buffRegistry.get(templateId)
  if (!template) {
    console.warn(`Buff template not found: ${templateId}`)
    return null
  }

  return {
    id: `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    name: template.name,
    description: template.description,
    icon: template.icon,
    duration: template.duration,
    maxDuration: template.duration,
    stacks: Math.min(initialStacks, template.maxStacks),
    maxStacks: template.maxStacks,
    tags: [...template.tags],
    source,
    target,
    data: {},
    hasTriggeredExpire: false
  }
}

/**
 * 预定义的Buff模板
 */
export const DEFAULT_BUFF_TEMPLATES: BuffTemplate[] = [
  // DOT类
  {
    id: 'poison',
    name: '中毒',
    description: '每回合受到持续伤害',
    duration: 3,
    maxStacks: 5,
    tags: ['DEBUFF', 'DOT', 'POISON'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    onTick: [{
      type: 'Damage',
      data: {
        value: 10,
        damageType: 'poison',
        scaling: [{ stat: 'stacks', ratio: 5 }]
      }
    }]
  },
  {
    id: 'burn',
    name: '燃烧',
    description: '每回合受到火焰伤害',
    duration: 3,
    maxStacks: 3,
    tags: ['DEBUFF', 'DOT', 'BURN'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    onTick: [{
      type: 'Damage',
      data: {
        value: 15,
        damageType: 'fire',
        scaling: [{ stat: 'stacks', ratio: 8 }]
      }
    }]
  },
  {
    id: 'bleed',
    name: '流血',
    description: '每回合流失生命',
    duration: 4,
    maxStacks: 5,
    tags: ['DEBUFF', 'DOT', 'BLEED'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    onTick: [{
      type: 'Damage',
      data: {
        value: 8,
        damageType: 'physical',
        scaling: [{ stat: 'stacks', ratio: 4 }]
      }
    }]
  },

  // HOT类
  {
    id: 'regeneration',
    name: '再生',
    description: '每回合恢复生命',
    duration: 5,
    maxStacks: 3,
    tags: ['BUFF', 'HOT'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    onTick: [{
      type: 'Heal',
      data: {
        value: 15,
        scaling: [{ stat: 'stacks', ratio: 5 }]
      }
    }]
  },

  // 控制类
  {
    id: 'stun',
    name: '眩晕',
    description: '无法行动',
    duration: 1,
    maxStacks: 1,
    tags: ['DEBUFF', 'CONTROL', 'STUN'],
    canBeDispelled: true,
    canBeStacked: false,
    isUnique: true,
    priority: 200,
    statModifiers: [
      { stat: 'canAct', value: 0, operation: 'Set' }
    ]
  },
  {
    id: 'frozen',
    name: '冰冻',
    description: '无法行动，受到的伤害增加',
    duration: 2,
    maxStacks: 1,
    tags: ['DEBUFF', 'CONTROL', 'FROZEN'],
    canBeDispelled: true,
    canBeStacked: false,
    isUnique: true,
    priority: 200,
    statModifiers: [
      { stat: 'canAct', value: 0, operation: 'Set' },
      { stat: 'damageTaken', value: 0.2, operation: 'Add' }
    ]
  },
  {
    id: 'silence',
    name: '沉默',
    description: '无法使用技能',
    duration: 2,
    maxStacks: 1,
    tags: ['DEBUFF', 'CONTROL', 'SILENCE'],
    canBeDispelled: true,
    canBeStacked: false,
    isUnique: true,
    priority: 200,
    statModifiers: [
      { stat: 'canUseSkill', value: 0, operation: 'Set' }
    ]
  },

  // 增益类
  {
    id: 'attack_up',
    name: '攻击提升',
    description: '攻击力提升',
    duration: 3,
    maxStacks: 3,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'attack', value: 0.15, operation: 'AddPercent' }
    ]
  },
  {
    id: 'defense_up',
    name: '防御提升',
    description: '防御力提升',
    duration: 3,
    maxStacks: 3,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'defense', value: 0.2, operation: 'AddPercent' }
    ]
  },
  {
    id: 'crit_up',
    name: '暴击提升',
    description: '暴击率提升',
    duration: 3,
    maxStacks: 3,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'critRate', value: 0.1, operation: 'Add' }
    ]
  },
  {
    id: 'speed_up',
    name: '速度提升',
    description: '攻击速度提升',
    duration: 3,
    maxStacks: 3,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'attackSpeed', value: 0.2, operation: 'AddPercent' }
    ]
  },

  // 减益类
  {
    id: 'attack_down',
    name: '攻击削弱',
    description: '攻击力降低',
    duration: 3,
    maxStacks: 3,
    tags: ['DEBUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'attack', value: -0.15, operation: 'AddPercent' }
    ]
  },
  {
    id: 'defense_down',
    name: '防御削弱',
    description: '防御力降低',
    duration: 3,
    maxStacks: 3,
    tags: ['DEBUFF'],
    canBeDispelled: true,
    canBeStacked: true,
    isUnique: false,
    priority: 100,
    statModifiers: [
      { stat: 'defense', value: -0.2, operation: 'AddPercent' }
    ]
  },

  // 特殊类
  {
    id: 'stealth',
    name: '隐身',
    description: '无法被选中为目标',
    duration: 2,
    maxStacks: 1,
    tags: ['BUFF', 'STEALTH'],
    canBeDispelled: false,
    canBeStacked: false,
    isUnique: true,
    priority: 300,
    statModifiers: [
      { stat: 'isStealthed', value: 1, operation: 'Set' }
    ],
    triggers: [{
      trigger: 'ON_ATTACK',
      effects: [{
        type: 'RemoveBuff',
        data: { buffId: 'stealth' }
      }],
      chance: 1
    }]
  },
  {
    id: 'invincible',
    name: '无敌',
    description: '免疫所有伤害',
    duration: 1,
    maxStacks: 1,
    tags: ['BUFF', 'INVINCIBLE'],
    canBeDispelled: false,
    canBeStacked: false,
    isUnique: true,
    priority: 500,
    triggers: [{
      trigger: 'ON_BEFORE_DAMAGE',
      effects: [{
        type: 'ModifyStat',
        data: { stat: 'damageImmunity', value: 1, operation: 'Set' }
      }],
      chance: 1
    }]
  },
  {
    id: 'reflect',
    name: '伤害反射',
    description: '受到伤害时反射部分伤害',
    duration: 3,
    maxStacks: 1,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: false,
    isUnique: true,
    priority: 150,
    triggers: [{
      trigger: 'ON_BEING_HIT',
      effects: [{
        type: 'Damage',
        data: {
          value: 0,
          damageType: 'true',
          scaling: [{ stat: 'damageReceived', ratio: 0.3 }]
        }
      }],
      chance: 1
    }]
  },
  {
    id: 'lifesteal',
    name: '生命偷取',
    description: '造成伤害时恢复生命',
    duration: 3,
    maxStacks: 1,
    tags: ['BUFF'],
    canBeDispelled: true,
    canBeStacked: false,
    isUnique: true,
    priority: 150,
    triggers: [{
      trigger: 'ON_HIT',
      effects: [{
        type: 'Heal',
        data: {
          value: 0,
          scaling: [{ stat: 'damageDealt', ratio: 0.2 }]
        }
      }],
      chance: 1
    }]
  }
]

// 注册默认Buff模板
DEFAULT_BUFF_TEMPLATES.forEach(template => buffRegistry.register(template))
