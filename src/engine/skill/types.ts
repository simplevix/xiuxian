import type { Effect, EffectTrigger } from '../effect/types'

/**
 * 技能类型
 */
export type SkillType = 
  | 'active'   // 主动技能
  | 'passive'  // 被动技能
  | 'trigger'  // 触发技能
  | 'ultimate' // 终极技能
  | 'channel'  // 引导技能

/**
 * 技能目标类型
 */
export type SkillTargetType =
  | 'self'           // 自身
  | 'single_enemy'   // 单个敌人
  | 'single_ally'    // 单个友方
  | 'all_enemies'    // 所有敌人
  | 'all_allies'     // 所有友方
  | 'area'           // 范围
  | 'random_enemy'   // 随机敌人
  | 'random_ally'    // 随机友方

/**
 * 技能消耗
 */
export interface SkillCost {
  mp?: number
  hp?: number
  sp?: number  // 怒气/能量
  item?: { itemId: string; count: number }
  cooldown?: number
}

/**
 * 技能学习要求
 */
export interface SkillRequirement {
  level?: number
  realm?: number
  skillId?: string  // 前置技能
  stat?: { name: string; value: number }
  item?: { itemId: string; consumed: boolean }
}

/**
 * 技能等级数据
 */
export interface SkillLevelData {
  level: number
  description: string
  effects: Effect[]
  cost: SkillCost
  requirements?: SkillRequirement[]
}

/**
 * 技能定义
 */
export interface SkillDefinition {
  id: string
  name: string
  description: string
  icon?: string
  
  type: SkillType
  targetType: SkillTargetType
  
  // 技能等级
  maxLevel: number
  levels: SkillLevelData[]
  
  // 特殊属性
  castTime?: number      // 施法时间(秒)
  channelTime?: number   // 引导时间(秒)
  range?: number         // 施法距离
  canCrit: boolean       // 是否可以暴击
  isUninterruptible: boolean // 是否不可打断
  
  // 标签
  tags: string[]
  
  // 连击技能
  comboSkill?: {
    skillId: string
    window: number  // 连击窗口时间(秒)
  }
}

/**
 * 技能实例
 */
export interface SkillInstance {
  definitionId: string
  level: number
  currentCooldown: number
  currentCharges: number
  maxCharges: number
  
  // 运行时数据
  lastCastTime?: number
  comboCount?: number
}

/**
 * 技能注册表
 */
export class SkillRegistry {
  private skills: Map<string, SkillDefinition> = new Map()
  private byType: Map<SkillType, SkillDefinition[]> = new Map()
  private byTag: Map<string, SkillDefinition[]> = new Map()

  register(skill: SkillDefinition): void {
    this.skills.set(skill.id, skill)
    
    // 按类型索引
    if (!this.byType.has(skill.type)) {
      this.byType.set(skill.type, [])
    }
    this.byType.get(skill.type)!.push(skill)
    
    // 按标签索引
    for (const tag of skill.tags) {
      if (!this.byTag.has(tag)) {
        this.byTag.set(tag, [])
      }
      this.byTag.get(tag)!.push(skill)
    }
  }

  get(id: string): SkillDefinition | undefined {
    return this.skills.get(id)
  }

  getByType(type: SkillType): SkillDefinition[] {
    return this.byType.get(type) || []
  }

  getByTag(tag: string): SkillDefinition[] {
    return this.byTag.get(tag) || []
  }

  getAll(): SkillDefinition[] {
    return Array.from(this.skills.values())
  }
}

// 全局技能注册表
export const skillRegistry = new SkillRegistry()

/**
 * 预定义技能
 */
export const DEFAULT_SKILLS: SkillDefinition[] = [
  // 基础攻击技能
  {
    id: 'basic_attack',
    name: '普通攻击',
    description: '进行一次普通攻击',
    type: 'active',
    targetType: 'single_enemy',
    maxLevel: 1,
    levels: [{
      level: 1,
      description: '造成100%攻击力的物理伤害',
      effects: [{
        type: 'Damage',
        data: {
          value: 0,
          damageType: 'physical',
          scaling: [{ stat: 'attack', ratio: 1.0 }]
        }
      }],
      cost: { cooldown: 0 }
    }],
    canCrit: true,
    isUninterruptible: false,
    tags: ['basic', 'physical']
  },

  // 剑系技能
  {
    id: 'sword_slash',
    name: '剑气斩',
    description: '释放剑气攻击敌人',
    type: 'active',
    targetType: 'single_enemy',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '造成120%攻击力的物理伤害',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'physical',
            scaling: [{ stat: 'attack', ratio: 1.2 }]
          }
        }],
        cost: { mp: 10, cooldown: 3 }
      },
      {
        level: 2,
        description: '造成140%攻击力的物理伤害',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'physical',
            scaling: [{ stat: 'attack', ratio: 1.4 }]
          }
        }],
        cost: { mp: 12, cooldown: 3 }
      },
      {
        level: 3,
        description: '造成160%攻击力的物理伤害，20%几率流血',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'physical',
              scaling: [{ stat: 'attack', ratio: 1.6 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'bleed',
              duration: 3,
              stacks: 1
            },
            chance: 0.2
          }
        ],
        cost: { mp: 15, cooldown: 3 }
      },
      {
        level: 4,
        description: '造成180%攻击力的物理伤害，30%几率流血',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'physical',
              scaling: [{ stat: 'attack', ratio: 1.8 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'bleed',
              duration: 4,
              stacks: 1
            },
            chance: 0.3
          }
        ],
        cost: { mp: 18, cooldown: 3 }
      },
      {
        level: 5,
        description: '造成200%攻击力的物理伤害，40%几率流血',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'physical',
              scaling: [{ stat: 'attack', ratio: 2.0 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'bleed',
              duration: 5,
              stacks: 1
            },
            chance: 0.4
          }
        ],
        cost: { mp: 20, cooldown: 3 }
      }
    ],
    canCrit: true,
    isUninterruptible: false,
    tags: ['sword', 'physical', 'bleed']
  },

  {
    id: 'whirlwind',
    name: '旋风斩',
    description: '旋转攻击周围所有敌人',
    type: 'active',
    targetType: 'all_enemies',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '对所有敌人造成80%攻击力的物理伤害',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'physical',
            scaling: [{ stat: 'attack', ratio: 0.8 }]
          }
        }],
        cost: { mp: 20, cooldown: 5 }
      },
      {
        level: 3,
        description: '对所有敌人造成100%攻击力的物理伤害',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'physical',
            scaling: [{ stat: 'attack', ratio: 1.0 }]
          }
        }],
        cost: { mp: 25, cooldown: 5 }
      },
      {
        level: 5,
        description: '对所有敌人造成120%攻击力的物理伤害，25%几率眩晕',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'physical',
              scaling: [{ stat: 'attack', ratio: 1.2 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'stun',
              duration: 1,
              stacks: 1
            },
            chance: 0.25
          }
        ],
        cost: { mp: 30, cooldown: 5 }
      }
    ],
    canCrit: true,
    isUninterruptible: false,
    tags: ['sword', 'physical', 'aoe', 'control']
  },

  // 法术技能
  {
    id: 'fireball',
    name: '火球术',
    description: '发射火球攻击敌人',
    type: 'active',
    targetType: 'single_enemy',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '造成100%攻击力的火焰伤害，附加燃烧',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'fire',
              scaling: [{ stat: 'attack', ratio: 1.0 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'burn',
              duration: 3,
              stacks: 1
            }
          }
        ],
        cost: { mp: 15, cooldown: 4 }
      },
      {
        level: 3,
        description: '造成130%攻击力的火焰伤害，附加燃烧',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'fire',
              scaling: [{ stat: 'attack', ratio: 1.3 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'burn',
              duration: 4,
              stacks: 1
            }
          }
        ],
        cost: { mp: 20, cooldown: 4 }
      },
      {
        level: 5,
        description: '造成160%攻击力的火焰伤害，附加燃烧，30%几率爆炸造成溅射',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'fire',
              scaling: [{ stat: 'attack', ratio: 1.6 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'burn',
              duration: 5,
              stacks: 2
            }
          }
        ],
        cost: { mp: 25, cooldown: 4 }
      }
    ],
    canCrit: true,
    isUninterruptible: false,
    tags: ['magic', 'fire', 'dot']
  },

  {
    id: 'ice_shard',
    name: '冰锥术',
    description: '发射冰锥冻结敌人',
    type: 'active',
    targetType: 'single_enemy',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '造成90%攻击力的冰霜伤害，20%几率冰冻',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'ice',
              scaling: [{ stat: 'attack', ratio: 0.9 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'frozen',
              duration: 1,
              stacks: 1
            },
            chance: 0.2
          }
        ],
        cost: { mp: 18, cooldown: 4 }
      },
      {
        level: 5,
        description: '造成130%攻击力的冰霜伤害，40%几率冰冻',
        effects: [
          {
            type: 'Damage',
            data: {
              value: 0,
              damageType: 'ice',
              scaling: [{ stat: 'attack', ratio: 1.3 }]
            }
          },
          {
            type: 'AddBuff',
            data: {
              buffId: 'frozen',
              duration: 2,
              stacks: 1
            },
            chance: 0.4
          }
        ],
        cost: { mp: 28, cooldown: 4 }
      }
    ],
    canCrit: true,
    isUninterruptible: false,
    tags: ['magic', 'ice', 'control']
  },

  // 治疗技能
  {
    id: 'heal',
    name: '治疗术',
    description: '恢复生命值',
    type: 'active',
    targetType: 'self',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '恢复50+30%攻击力的生命值',
        effects: [{
          type: 'Heal',
          data: {
            value: 50,
            scaling: [{ stat: 'attack', ratio: 0.3 }]
          }
        }],
        cost: { mp: 15, cooldown: 6 }
      },
      {
        level: 3,
        description: '恢复100+40%攻击力的生命值',
        effects: [{
          type: 'Heal',
          data: {
            value: 100,
            scaling: [{ stat: 'attack', ratio: 0.4 }]
          }
        }],
        cost: { mp: 20, cooldown: 6 }
      },
      {
        level: 5,
        description: '恢复150+50%攻击力的生命值，并移除一个减益效果',
        effects: [
          {
            type: 'Heal',
            data: {
              value: 150,
              scaling: [{ stat: 'attack', ratio: 0.5 }]
            }
          },
          {
            type: 'Dispel',
            data: {
              buffType: 'DEBUFF',
              count: 1
            }
          }
        ],
        cost: { mp: 25, cooldown: 6 }
      }
    ],
    canCrit: false,
    isUninterruptible: false,
    tags: ['heal', 'holy']
  },

  // 增益技能
  {
    id: 'power_buff',
    name: '强力术',
    description: '提升攻击力',
    type: 'active',
    targetType: 'self',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '攻击力提升20%，持续3回合',
        effects: [{
          type: 'AddBuff',
          data: {
            buffId: 'attack_up',
            duration: 3,
            stacks: 1
          }
        }],
        cost: { mp: 20, cooldown: 8 }
      },
      {
        level: 3,
        description: '攻击力提升30%，持续5回合',
        effects: [{
          type: 'AddBuff',
          data: {
            buffId: 'attack_up',
            duration: 5,
            stacks: 2
          }
        }],
        cost: { mp: 30, cooldown: 8 }
      }
    ],
    canCrit: false,
    isUninterruptible: false,
    tags: ['buff']
  },

  // 终极技能
  {
    id: 'ultimate_slash',
    name: '终极剑斩',
    description: '汇聚全身力量的终极一击',
    type: 'ultimate',
    targetType: 'single_enemy',
    maxLevel: 3,
    levels: [
      {
        level: 1,
        description: '造成300%攻击力的物理伤害，无视50%防御',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'true',
            scaling: [{ stat: 'attack', ratio: 3.0 }]
          }
        }],
        cost: { sp: 100, cooldown: 10 }
      },
      {
        level: 3,
        description: '造成400%攻击力的物理伤害，无视70%防御',
        effects: [{
          type: 'Damage',
          data: {
            value: 0,
            damageType: 'true',
            scaling: [{ stat: 'attack', ratio: 4.0 }]
          }
        }],
        cost: { sp: 100, cooldown: 10 }
      }
    ],
    canCrit: true,
    isUninterruptible: true,
    tags: ['ultimate', 'sword', 'physical']
  },

  // 被动技能
  {
    id: 'passive_crit',
    name: '致命一击',
    description: '提升暴击率',
    type: 'passive',
    targetType: 'self',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '暴击率+5%',
        effects: [{
          type: 'ModifyStat',
          data: {
            stat: 'critRate',
            value: 0.05,
            operation: 'Add'
          }
        }],
        cost: {}
      },
      {
        level: 3,
        description: '暴击率+10%',
        effects: [{
          type: 'ModifyStat',
          data: {
            stat: 'critRate',
            value: 0.10,
            operation: 'Add'
          }
        }],
        cost: {}
      },
      {
        level: 5,
        description: '暴击率+15%，暴击伤害+20%',
        effects: [
          {
            type: 'ModifyStat',
            data: {
              stat: 'critRate',
              value: 0.15,
              operation: 'Add'
            }
          },
          {
            type: 'ModifyStat',
            data: {
              stat: 'critDamage',
              value: 0.20,
              operation: 'Add'
            }
          }
        ],
        cost: {}
      }
    ],
    canCrit: false,
    isUninterruptible: false,
    tags: ['passive', 'crit']
  },

  {
    id: 'passive_lifesteal',
    name: '生命汲取',
    description: '攻击时恢复生命',
    type: 'passive',
    targetType: 'self',
    maxLevel: 5,
    levels: [
      {
        level: 1,
        description: '造成伤害的5%转化为生命恢复',
        effects: [{
          type: 'ModifyStat',
          data: {
            stat: 'lifesteal',
            value: 0.05,
            operation: 'Add'
          }
        }],
        cost: {}
      },
      {
        level: 5,
        description: '造成伤害的15%转化为生命恢复',
        effects: [{
          type: 'ModifyStat',
          data: {
            stat: 'lifesteal',
            value: 0.15,
            operation: 'Add'
          }
        }],
        cost: {}
      }
    ],
    canCrit: false,
    isUninterruptible: false,
    tags: ['passive', 'lifesteal']
  }
]

// 注册默认技能
DEFAULT_SKILLS.forEach(skill => skillRegistry.register(skill))
