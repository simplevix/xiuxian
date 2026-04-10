/**
 * 修炼系统类型定义
 * 包含感悟值、瓶颈期、心魔机制
 */

/**
 * 感悟状态
 */
export interface InsightState {
  current: number        // 当前感悟值
  max: number           // 感悟上限
  rate: number          // 每秒感悟获取速率
  multiplier: number    // 感悟倍率
}

/**
 * 瓶颈信息
 */
export interface BottleneckInfo {
  level: number         // 瓶颈等级 (1-9)
  name: string          // 瓶颈名称
  description: string   // 瓶颈描述
  breakthroughChance: number  // 突破成功率 (0-1)
  requiredInsight: number     // 所需感悟值
  failurePenalty: {          // 失败惩罚
    insightLoss: number       // 感悟损失
    injuryChance: number      // 受伤概率
    injuryDuration: number    // 受伤持续时间(秒)
  }
}

/**
 * 心魔信息
 */
export interface DemonInfo {
  name: string
  description: string
  power: number         // 心魔强度 (0-1)
  effects: DemonEffect[]
}

/**
 * 心魔效果
 */
export interface DemonEffect {
  type: 'stat_reduction' | 'cultivation_slow' | 'random_event' | 'combat_debuff'
  value: number
  description: string
}

/**
 * 突破结果
 */
export interface BreakthroughResult {
  success: boolean
  insightConsumed: number
  message: string
  rewards?: {
    statBonus?: { stat: string; value: number }
    newSkill?: string
    specialReward?: string
  }
  penalties?: {
    insightLoss?: number
    injuryType?: string
    injuryDuration?: number
  }
}

/**
 * 修炼状态
 */
export interface CultivationState {
  isCultivating: boolean
  startTime: number
  totalCultivationTime: number
  insight: InsightState
  bottleneck: BottleneckInfo | null
  activeDemon: DemonInfo | null
  demonDefeated: boolean
  breakthroughHistory: {
    realm: string
    success: boolean
    timestamp: number
  }[]
}

/**
 * 瓶颈定义表
 */
export const BOTTLENECK_TABLE: Record<number, BottleneckInfo> = {
  1: {
    level: 1,
    name: '初入瓶颈',
    description: '修行初遇阻碍，需静心感悟',
    breakthroughChance: 0.95,
    requiredInsight: 100,
    failurePenalty: {
      insightLoss: 20,
      injuryChance: 0.1,
      injuryDuration: 60
    }
  },
  2: {
    level: 2,
    name: '小瓶颈',
    description: '灵气运转不畅，需突破自我',
    breakthroughChance: 0.85,
    requiredInsight: 300,
    failurePenalty: {
      insightLoss: 50,
      injuryChance: 0.2,
      injuryDuration: 120
    }
  },
  3: {
    level: 3,
    name: '中瓶颈',
    description: '境界桎梏显现，需厚积薄发',
    breakthroughChance: 0.75,
    requiredInsight: 800,
    failurePenalty: {
      insightLoss: 100,
      injuryChance: 0.3,
      injuryDuration: 180
    }
  },
  4: {
    level: 4,
    name: '大瓶颈',
    description: '天地法则阻碍，需逆天而行',
    breakthroughChance: 0.65,
    requiredInsight: 2000,
    failurePenalty: {
      insightLoss: 200,
      injuryChance: 0.4,
      injuryDuration: 300
    }
  },
  5: {
    level: 5,
    name: '心魔瓶颈',
    description: '心魔滋生，需战胜内心',
    breakthroughChance: 0.55,
    requiredInsight: 5000,
    failurePenalty: {
      insightLoss: 400,
      injuryChance: 0.5,
      injuryDuration: 600
    }
  },
  6: {
    level: 6,
    name: '天劫瓶颈',
    description: '天劫将至，九死一生',
    breakthroughChance: 0.45,
    requiredInsight: 12000,
    failurePenalty: {
      insightLoss: 800,
      injuryChance: 0.6,
      injuryDuration: 900
    }
  },
  7: {
    level: 7,
    name: '道心瓶颈',
    description: '道心动摇，需明心见性',
    breakthroughChance: 0.35,
    requiredInsight: 30000,
    failurePenalty: {
      insightLoss: 1500,
      injuryChance: 0.7,
      injuryDuration: 1200
    }
  },
  8: {
    level: 8,
    name: '因果瓶颈',
    description: '因果缠身，需斩断尘缘',
    breakthroughChance: 0.25,
    requiredInsight: 80000,
    failurePenalty: {
      insightLoss: 3000,
      injuryChance: 0.8,
      injuryDuration: 1800
    }
  },
  9: {
    level: 9,
    name: '飞升瓶颈',
    description: '最后一关，羽化飞升',
    breakthroughChance: 0.15,
    requiredInsight: 200000,
    failurePenalty: {
      insightLoss: 10000,
      injuryChance: 0.9,
      injuryDuration: 3600
    }
  }
}

/**
 * 心魔定义表
 */
export const DEMON_TABLE: DemonInfo[] = [
  {
    name: '贪魔',
    description: '贪恋世间繁华，难以静心修行',
    power: 0.3,
    effects: [
      { type: 'cultivation_slow', value: 0.5, description: '修炼速度降低50%' },
      { type: 'stat_reduction', value: 0.1, description: '全属性降低10%' }
    ]
  },
  {
    name: '嗔魔',
    description: '怒火中烧，易走火入魔',
    power: 0.4,
    effects: [
      { type: 'random_event', value: 0.3, description: '30%概率修炼出错' },
      { type: 'combat_debuff', value: 0.15, description: '战斗伤害降低15%' }
    ]
  },
  {
    name: '痴魔',
    description: '执念太深，困于过往',
    power: 0.5,
    effects: [
      { type: 'stat_reduction', value: 0.2, description: '悟性降低20%' },
      { type: 'cultivation_slow', value: 0.3, description: '感悟获取降低30%' }
    ]
  },
  {
    name: '慢魔',
    description: '傲慢自满，目中无人',
    power: 0.35,
    effects: [
      { type: 'stat_reduction', value: 0.15, description: '防御降低15%' },
      { type: 'combat_debuff', value: 0.1, description: '闪避率降低10%' }
    ]
  },
  {
    name: '疑魔',
    description: '疑神疑鬼，道心不坚',
    power: 0.45,
    effects: [
      { type: 'cultivation_slow', value: 0.4, description: '突破成功率降低40%' },
      { type: 'random_event', value: 0.2, description: '20%概率修炼中断' }
    ]
  },
  {
    name: '邪见魔',
    description: '误入歧途，修炼邪法',
    power: 0.6,
    effects: [
      { type: 'stat_reduction', value: 0.25, description: '生命上限降低25%' },
      { type: 'combat_debuff', value: 0.2, description: '受到的伤害增加20%' }
    ]
  },
  {
    name: '执念魔',
    description: '执念成魔，难以自拔',
    power: 0.7,
    effects: [
      { type: 'cultivation_slow', value: 0.6, description: '修炼速度降低60%' },
      { type: 'stat_reduction', value: 0.2, description: '攻击降低20%' },
      { type: 'random_event', value: 0.4, description: '40%概率走火入魔' }
    ]
  },
  {
    name: '天魔',
    description: '域外天魔，侵蚀道心',
    power: 0.9,
    effects: [
      { type: 'stat_reduction', value: 0.3, description: '全属性降低30%' },
      { type: 'cultivation_slow', value: 0.5, description: '无法获得感悟' },
      { type: 'combat_debuff', value: 0.25, description: '战斗中25%概率混乱' }
    ]
  }
]

/**
 * 计算感悟上限
 */
export function calculateInsightMax(realmIndex: number, level: number): number {
  const baseMax = 100
  const realmMultiplier = Math.pow(1.5, realmIndex)
  const levelBonus = level * 10
  return Math.floor(baseMax * realmMultiplier + levelBonus)
}

/**
 * 计算感悟获取速率
 */
export function calculateInsightRate(
  realmIndex: number, 
  level: number, 
  spiritRoot: number,
  techniques: any[]
): number {
  const baseRate = 0.5
  const realmBonus = realmIndex * 0.2
  const levelBonus = level * 0.05
  const rootBonus = spiritRoot * 0.1
  
  // 功法加成
  let techniqueBonus = 0
  for (const tech of techniques) {
    if (tech.effects) {
      for (const effect of tech.effects) {
        if (effect.type === 'insightRate') {
          techniqueBonus += effect.value
        }
      }
    }
  }
  
  return baseRate + realmBonus + levelBonus + rootBonus + techniqueBonus
}

/**
 * 计算突破成功率
 */
export function calculateBreakthroughChance(
  bottleneck: BottleneckInfo,
  insight: number,
  spiritRoot: number,
  hasDefeatedDemon: boolean
): number {
  let chance = bottleneck.breakthroughChance
  
  // 感悟值加成
  const insightBonus = Math.min(0.2, (insight - bottleneck.requiredInsight) / bottleneck.requiredInsight * 0.1)
  chance += insightBonus
  
  // 灵根加成
  chance += spiritRoot * 0.01
  
  // 战胜心魔加成
  if (hasDefeatedDemon) {
    chance += 0.15
  }
  
  return Math.min(0.95, chance)
}

/**
 * 生成心魔
 */
export function generateDemon(realmIndex: number): DemonInfo {
  // 根据境界选择合适强度的心魔
  const availableDemons = DEMON_TABLE.filter(d => {
    const minPower = realmIndex * 0.1
    const maxPower = (realmIndex + 1) * 0.15
    return d.power >= minPower && d.power <= maxPower
  })
  
  if (availableDemons.length === 0) {
    return DEMON_TABLE[0]
  }
  
  return availableDemons[Math.floor(Math.random() * availableDemons.length)]
}

/**
 * 计算心魔战胜概率
 */
export function calculateDemonDefeatChance(
  demon: DemonInfo,
  playerStats: { wisdom: number; willpower: number; spiritRoot: number }
): number {
  const baseChance = 0.5
  const wisdomBonus = playerStats.wisdom * 0.01
  const willpowerBonus = playerStats.willpower * 0.015
  const rootBonus = playerStats.spiritRoot * 0.01
  const demonPenalty = demon.power * 0.3
  
  return Math.max(0.1, Math.min(0.9, baseChance + wisdomBonus + willpowerBonus + rootBonus - demonPenalty))
}
