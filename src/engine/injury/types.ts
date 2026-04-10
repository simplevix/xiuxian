/**
 * 伤势系统类型定义
 * 战斗后的持久负面效果
 */

/**
 * 伤势类型
 */
export type InjuryType =
  | 'minor'      // 轻伤
  | 'moderate'   // 中等伤势
  | 'severe'     // 重伤
  | 'critical'   // 致命伤
  | 'internal'   // 内伤
  | 'poison'     // 中毒
  | 'burn'       // 烧伤
  | 'frostbite'  // 冻伤
  | 'fracture'   // 骨折
  | 'bleeding'   // 流血

/**
 * 伤势严重程度
 */
export type InjurySeverity = 'minor' | 'moderate' | 'severe' | 'critical'

/**
 * 伤势定义
 */
export interface InjuryDefinition {
  id: string
  name: string
  type: InjuryType
  severity: InjurySeverity
  description: string
  
  // 持续时间（秒）
  duration: number
  
  // 属性减益
  statPenalties: {
    stat: string
    value: number
    operation: 'Add' | 'Multiply' | 'AddPercent'
  }[]
  
  // 持续效果
  tickEffects?: {
    interval: number  // 触发间隔（秒）
    effect: 'damage' | 'heal_reduction' | 'stat_drain'
    value: number
  }
  
  // 特殊效果
  specialEffects?: {
    type: 'cannot_heal' | 'cannot_cultivate' | 'cannot_battle' | 'random_faint'
    chance?: number
  }[]
  
  // 治疗需求
  treatment?: {
    itemId?: string
    itemCount?: number
    cultivationTime?: number  // 需要修炼恢复的时间
    restTime?: number         // 需要休息的时间
  }
  
  // 恶化机制
  deterioration?: {
    chance: number           // 恶化概率
    interval: number         // 检查间隔（秒）
    nextStageId?: string     // 恶化后的伤势ID
  }
}

/**
 * 伤势实例
 */
export interface InjuryInstance {
  id: string
  definitionId: string
  name: string
  type: InjuryType
  severity: InjurySeverity
  description: string
  
  // 时间信息
  appliedAt: number         // 施加时间
  duration: number          // 总持续时间
  remainingDuration: number // 剩余时间
  
  // 状态
  isTreated: boolean        // 是否已治疗
  isHealing: boolean        // 是否正在恢复
  treatmentProgress: number // 治疗进度 (0-1)
  
  // 来源
  source: 'combat' | 'cultivation' | 'event' | 'poison'
  sourceName?: string       // 造成伤害的敌人/事件名称
  
  // 运行时数据
  lastTickTime: number
  tickCount: number
}

/**
 * 伤势注册表
 */
export class InjuryRegistry {
  private injuries: Map<string, InjuryDefinition> = new Map()
  private byType: Map<InjuryType, InjuryDefinition[]> = new Map()
  private bySeverity: Map<InjurySeverity, InjuryDefinition[]> = new Map()

  register(injury: InjuryDefinition): void {
    this.injuries.set(injury.id, injury)
    
    // 按类型索引
    if (!this.byType.has(injury.type)) {
      this.byType.set(injury.type, [])
    }
    this.byType.get(injury.type)!.push(injury)
    
    // 按严重程度索引
    if (!this.bySeverity.has(injury.severity)) {
      this.bySeverity.set(injury.severity, [])
    }
    this.bySeverity.get(injury.severity)!.push(injury)
  }

  get(id: string): InjuryDefinition | undefined {
    return this.injuries.get(id)
  }

  getByType(type: InjuryType): InjuryDefinition[] {
    return this.byType.get(type) || []
  }

  getBySeverity(severity: InjurySeverity): InjuryDefinition[] {
    return this.bySeverity.get(severity) || []
  }

  getRandomBySeverity(severity: InjurySeverity): InjuryDefinition | null {
    const injuries = this.getBySeverity(severity)
    if (injuries.length === 0) return null
    return injuries[Math.floor(Math.random() * injuries.length)]
  }
}

// 全局伤势注册表
export const injuryRegistry = new InjuryRegistry()

/**
 * 预定义伤势
 */
export const DEFAULT_INJURIES: InjuryDefinition[] = [
  // 轻伤
  {
    id: 'minor_scratch',
    name: '轻微擦伤',
    type: 'minor',
    severity: 'minor',
    description: '轻微的皮肉伤，不影响行动',
    duration: 60,
    statPenalties: [
      { stat: 'attack', value: -0.02, operation: 'AddPercent' }
    ],
    treatment: {
      restTime: 60
    }
  },
  {
    id: 'minor_bruise',
    name: '轻微淤青',
    type: 'minor',
    severity: 'minor',
    description: '身体有淤青，略有不适',
    duration: 120,
    statPenalties: [
      { stat: 'defense', value: -0.02, operation: 'AddPercent' }
    ],
    treatment: {
      restTime: 120
    }
  },

  // 中等伤势
  {
    id: 'moderate_cut',
    name: '刀伤',
    type: 'moderate',
    severity: 'moderate',
    description: '较深的伤口，需要处理',
    duration: 300,
    statPenalties: [
      { stat: 'attack', value: -0.05, operation: 'AddPercent' },
      { stat: 'maxHp', value: -0.03, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 60,
      effect: 'damage',
      value: 5
    },
    treatment: {
      itemId: 'healing_herb',
      itemCount: 1,
      restTime: 300
    }
  },
  {
    id: 'moderate_sprain',
    name: '扭伤',
    type: 'moderate',
    severity: 'moderate',
    description: '关节扭伤，行动受限',
    duration: 600,
    statPenalties: [
      { stat: 'dodgeRate', value: -0.03, operation: 'Add' },
      { stat: 'attackSpeed', value: -0.1, operation: 'AddPercent' }
    ],
    treatment: {
      itemId: 'medicine_oil',
      itemCount: 1,
      restTime: 600
    }
  },

  // 重伤
  {
    id: 'severe_fracture',
    name: '骨折',
    type: 'fracture',
    severity: 'severe',
    description: '骨头断裂，严重影响战斗',
    duration: 1800,
    statPenalties: [
      { stat: 'attack', value: -0.15, operation: 'AddPercent' },
      { stat: 'defense', value: -0.1, operation: 'AddPercent' },
      { stat: 'dodgeRate', value: -0.05, operation: 'Add' }
    ],
    specialEffects: [
      { type: 'cannot_cultivate' }
    ],
    treatment: {
      itemId: 'bone_mending_pill',
      itemCount: 2,
      restTime: 1800
    },
    deterioration: {
      chance: 0.1,
      interval: 600,
      nextStageId: 'critical_infection'
    }
  },
  {
    id: 'severe_internal',
    name: '严重内伤',
    type: 'internal',
    severity: 'severe',
    description: '内脏受损，需要静养',
    duration: 3600,
    statPenalties: [
      { stat: 'maxHp', value: -0.15, operation: 'AddPercent' },
      { stat: 'attack', value: -0.1, operation: 'AddPercent' },
      { stat: 'defense', value: -0.1, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 300,
      effect: 'heal_reduction',
      value: 0.5
    },
    specialEffects: [
      { type: 'cannot_cultivate' },
      { type: 'cannot_heal', chance: 0.3 }
    ],
    treatment: {
      itemId: 'internal_healing_pill',
      itemCount: 3,
      cultivationTime: 1800
    }
  },
  {
    id: 'severe_poison',
    name: '剧毒侵蚀',
    type: 'poison',
    severity: 'severe',
    description: '身中剧毒，生命不断流失',
    duration: 1200,
    statPenalties: [
      { stat: 'attack', value: -0.2, operation: 'AddPercent' },
      { stat: 'defense', value: -0.15, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 60,
      effect: 'damage',
      value: 10
    },
    specialEffects: [
      { type: 'cannot_cultivate' }
    ],
    treatment: {
      itemId: 'detoxification_pill',
      itemCount: 2,
      restTime: 600
    },
    deterioration: {
      chance: 0.2,
      interval: 300,
      nextStageId: 'critical_poison'
    }
  },

  // 致命伤
  {
    id: 'critical_wound',
    name: '致命伤',
    type: 'critical',
    severity: 'critical',
    description: '生命垂危，随时可能死亡',
    duration: 600,
    statPenalties: [
      { stat: 'maxHp', value: -0.5, operation: 'AddPercent' },
      { stat: 'attack', value: -0.5, operation: 'AddPercent' },
      { stat: 'defense', value: -0.5, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 60,
      effect: 'damage',
      value: 20
    },
    specialEffects: [
      { type: 'cannot_battle' },
      { type: 'cannot_cultivate' },
      { type: 'cannot_heal' },
      { type: 'random_faint', chance: 0.3 }
    ],
    treatment: {
      itemId: 'life_saving_pill',
      itemCount: 5,
      cultivationTime: 3600,
      restTime: 7200
    }
  },
  {
    id: 'critical_infection',
    name: '伤口感染',
    type: 'critical',
    severity: 'critical',
    description: '伤口严重感染，高烧不退',
    duration: 1800,
    statPenalties: [
      { stat: 'maxHp', value: -0.3, operation: 'AddPercent' },
      { stat: 'attack', value: -0.3, operation: 'AddPercent' },
      { stat: 'defense', value: -0.2, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 120,
      effect: 'stat_drain',
      value: 1
    },
    specialEffects: [
      { type: 'cannot_cultivate' },
      { type: 'cannot_heal', chance: 0.5 }
    ],
    treatment: {
      itemId: 'antibiotic_pill',
      itemCount: 3,
      restTime: 3600
    }
  },
  {
    id: 'critical_poison',
    name: '剧毒攻心',
    type: 'critical',
    severity: 'critical',
    description: '剧毒已攻心，命悬一线',
    duration: 900,
    statPenalties: [
      { stat: 'maxHp', value: -0.4, operation: 'AddPercent' },
      { stat: 'attack', value: -0.4, operation: 'AddPercent' },
      { stat: 'defense', value: -0.3, operation: 'AddPercent' }
    ],
    tickEffects: {
      interval: 30,
      effect: 'damage',
      value: 30
    },
    specialEffects: [
      { type: 'cannot_battle' },
      { type: 'cannot_cultivate' },
      { type: 'random_faint', chance: 0.5 }
    ],
    treatment: {
      itemId: 'supreme_detoxification_pill',
      itemCount: 1,
      cultivationTime: 1800
    }
  },

  // 修炼相关伤势
  {
    id: 'cultivation_backlash_minor',
    name: '轻微走火入魔',
    type: 'internal',
    severity: 'minor',
    description: '修炼时气息紊乱，略有不适',
    duration: 600,
    statPenalties: [
      { stat: 'cultivationSpeed', value: -0.1, operation: 'AddPercent' }
    ],
    specialEffects: [
      { type: 'cannot_cultivate', chance: 0.1 }
    ],
    treatment: {
      cultivationTime: 600
    }
  },
  {
    id: 'cultivation_backlash_severe',
    name: '走火入魔',
    type: 'internal',
    severity: 'severe',
    description: '修炼出错，经脉受损',
    duration: 3600,
    statPenalties: [
      { stat: 'maxHp', value: -0.2, operation: 'AddPercent' },
      { stat: 'attack', value: -0.1, operation: 'AddPercent' },
      { stat: 'cultivationSpeed', value: -0.5, operation: 'AddPercent' }
    ],
    specialEffects: [
      { type: 'cannot_cultivate' }
    ],
    treatment: {
      itemId: 'meridian_healing_pill',
      itemCount: 2,
      cultivationTime: 3600
    }
  }
]

// 注册默认伤势
DEFAULT_INJURIES.forEach(injury => injuryRegistry.register(injury))

/**
 * 根据战斗结果生成伤势
 */
export function generateInjuryFromCombat(
  playerHpPercent: number,
  enemyName: string,
  enemyHasPoison: boolean = false,
  enemyHasBurn: boolean = false
): InjuryDefinition | null {
  // 根据剩余血量决定伤势严重程度
  let severity: InjurySeverity
  
  if (playerHpPercent <= 0.05) {
    severity = 'critical'
  } else if (playerHpPercent <= 0.2) {
    severity = 'severe'
  } else if (playerHpPercent <= 0.5) {
    severity = 'moderate'
  } else if (playerHpPercent <= 0.8) {
    severity = 'minor'
  } else {
    return null // 血量健康，无伤势
  }

  // 特殊伤势检查
  if (enemyHasPoison && Math.random() < 0.3) {
    return injuryRegistry.get('severe_poison') || injuryRegistry.getRandomBySeverity(severity)
  }
  
  if (enemyHasBurn && Math.random() < 0.3) {
    return injuryRegistry.get('moderate_burn') || injuryRegistry.getRandomBySeverity(severity)
  }

  return injuryRegistry.getRandomBySeverity(severity)
}

/**
 * 根据突破失败生成伤势
 */
export function generateInjuryFromBreakthrough(failureSeverity: number): InjuryDefinition | null {
  if (failureSeverity >= 0.8) {
    return injuryRegistry.get('cultivation_backlash_severe')
  } else if (failureSeverity >= 0.5) {
    return injuryRegistry.get('severe_internal')
  } else if (failureSeverity >= 0.3) {
    return injuryRegistry.get('cultivation_backlash_minor')
  }
  return null
}
