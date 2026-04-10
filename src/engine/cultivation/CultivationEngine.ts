import type {
  CultivationState,
  InsightState,
  BottleneckInfo,
  DemonInfo,
  BreakthroughResult,
  DemonEffect
} from './types'
import {
  BOTTLENECK_TABLE,
  DEMON_TABLE,
  calculateInsightMax,
  calculateInsightRate,
  calculateBreakthroughChance,
  generateDemon,
  calculateDemonDefeatChance
} from './types'

/**
 * 修炼引擎
 * 管理感悟值积累、瓶颈突破、心魔战斗
 */
export class CultivationEngine {
  private state: CultivationState
  private cultivationInterval: number | null = null
  private onInsightCallback: ((insight: number, max: number) => void) | null = null
  private onBottleneckCallback: ((bottleneck: BottleneckInfo | null) => void) | null = null
  private onDemonCallback: ((demon: DemonInfo | null) => void) | null = null
  private onBreakthroughCallback: ((result: BreakthroughResult) => void) | null = null

  constructor() {
    this.state = {
      isCultivating: false,
      startTime: 0,
      totalCultivationTime: 0,
      insight: {
        current: 0,
        max: 100,
        rate: 0.5,
        multiplier: 1
      },
      bottleneck: null,
      activeDemon: null,
      demonDefeated: false,
      breakthroughHistory: []
    }
  }

  /**
   * 初始化修炼状态
   */
  init(realmIndex: number, level: number, spiritRoot: number, techniques: any[]): void {
    this.state.insight.max = calculateInsightMax(realmIndex, level)
    this.state.insight.rate = calculateInsightRate(realmIndex, level, spiritRoot, techniques)
    
    // 检查是否遇到瓶颈
    this.checkBottleneck(realmIndex, level)
  }

  /**
   * 开始修炼
   */
  startCultivation(): void {
    if (this.state.isCultivating) return
    
    this.state.isCultivating = true
    this.state.startTime = Date.now()
    
    // 每秒增加感悟值
    this.cultivationInterval = window.setInterval(() => {
      this.tickCultivation()
    }, 1000)
  }

  /**
   * 停止修炼
   */
  stopCultivation(): void {
    if (!this.state.isCultivating) return
    
    if (this.cultivationInterval) {
      clearInterval(this.cultivationInterval)
      this.cultivationInterval = null
    }
    
    const duration = (Date.now() - this.state.startTime) / 1000
    this.state.totalCultivationTime += duration
    this.state.isCultivating = false
  }

  /**
   * 修炼tick
   */
  private tickCultivation(): void {
    if (this.state.bottleneck && !this.state.demonDefeated) {
      // 遇到瓶颈且未战胜心魔，无法获得感悟
      return
    }

    const gain = this.state.insight.rate * this.state.insight.multiplier
    this.addInsight(gain)
  }

  /**
   * 增加感悟值
   */
  addInsight(amount: number): void {
    const oldInsight = this.state.insight.current
    this.state.insight.current = Math.min(
      this.state.insight.max,
      this.state.insight.current + amount
    )
    
    if (this.state.insight.current !== oldInsight && this.onInsightCallback) {
      this.onInsightCallback(this.state.insight.current, this.state.insight.max)
    }
  }

  /**
   * 消耗感悟值
   */
  consumeInsight(amount: number): boolean {
    if (this.state.insight.current < amount) return false
    
    this.state.insight.current -= amount
    if (this.onInsightCallback) {
      this.onInsightCallback(this.state.insight.current, this.state.insight.max)
    }
    return true
  }

  /**
   * 检查瓶颈
   */
  private checkBottleneck(realmIndex: number, level: number): void {
    // 每10级一个小瓶颈，每30级一个大瓶颈
    const isBottleneckLevel = level % 10 === 0 && level > 0
    
    if (isBottleneckLevel) {
      const bottleneckLevel = Math.min(9, Math.floor(level / 10))
      const bottleneck = BOTTLENECK_TABLE[bottleneckLevel]
      
      if (bottleneck) {
        this.state.bottleneck = bottleneck
        
        // 5级以上瓶颈生成心魔
        if (bottleneckLevel >= 5) {
          this.state.activeDemon = generateDemon(realmIndex)
          this.state.demonDefeated = false
          
          if (this.onDemonCallback) {
            this.onDemonCallback(this.state.activeDemon)
          }
        }
        
        if (this.onBottleneckCallback) {
          this.onBottleneckCallback(bottleneck)
        }
      }
    }
  }

  /**
   * 尝试突破瓶颈
   */
  attemptBreakthrough(
    playerStats: { wisdom: number; willpower: number; spiritRoot: number; realmIndex: number; level: number }
  ): BreakthroughResult {
    if (!this.state.bottleneck) {
      return {
        success: false,
        insightConsumed: 0,
        message: '当前没有瓶颈需要突破'
      }
    }

    const bottleneck = this.state.bottleneck
    
    // 检查感悟值是否足够
    if (this.state.insight.current < bottleneck.requiredInsight) {
      return {
        success: false,
        insightConsumed: 0,
        message: `感悟值不足，需要 ${bottleneck.requiredInsight} 点感悟`
      }
    }

    // 检查是否战胜心魔
    if (this.state.activeDemon && !this.state.demonDefeated) {
      return {
        success: false,
        insightConsumed: 0,
        message: '必须先战胜心魔才能突破'
      }
    }

    // 计算突破成功率
    const successChance = calculateBreakthroughChance(
      bottleneck,
      this.state.insight.current,
      playerStats.spiritRoot,
      this.state.demonDefeated
    )

    // 执行突破
    const roll = Math.random()
    const success = roll < successChance

    // 消耗感悟值
    this.consumeInsight(bottleneck.requiredInsight)

    // 记录历史
    this.state.breakthroughHistory.push({
      realm: `境界${playerStats.realmIndex + 1} - ${bottleneck.name}`,
      success,
      timestamp: Date.now()
    })

    if (success) {
      // 突破成功
      this.state.bottleneck = null
      this.state.activeDemon = null
      this.state.demonDefeated = false

      const result: BreakthroughResult = {
        success: true,
        insightConsumed: bottleneck.requiredInsight,
        message: `🎉 突破成功！成功突破【${bottleneck.name}】`,
        rewards: this.generateBreakthroughRewards(playerStats)
      }

      if (this.onBreakthroughCallback) {
        this.onBreakthroughCallback(result)
      }

      return result
    } else {
      // 突破失败
      const penalty = bottleneck.failurePenalty
      const getInjured = Math.random() < penalty.injuryChance

      const result: BreakthroughResult = {
        success: false,
        insightConsumed: bottleneck.requiredInsight,
        message: `💔 突破失败！未能突破【${bottleneck.name}】`,
        penalties: {
          insightLoss: penalty.insightLoss
        }
      }

      // 额外感悟损失
      if (penalty.insightLoss > 0) {
        this.consumeInsight(penalty.insightLoss)
        result.penalties!.insightLoss += penalty.insightLoss
      }

      // 受伤
      if (getInjured) {
        result.penalties!.injuryType = 'cultivation_backlash'
        result.penalties!.injuryDuration = penalty.injuryDuration
        result.message += '，并且受到了内伤！'
      }

      if (this.onBreakthroughCallback) {
        this.onBreakthroughCallback(result)
      }

      return result
    }
  }

  /**
   * 挑战心魔
   */
  challengeDemon(playerStats: { wisdom: number; willpower: number; spiritRoot: number }): {
    success: boolean
    message: string
    rewards?: any
  } {
    if (!this.state.activeDemon) {
      return {
        success: false,
        message: '当前没有心魔'
      }
    }

    if (this.state.demonDefeated) {
      return {
        success: false,
        message: '心魔已被战胜'
      }
    }

    const demon = this.state.activeDemon
    const defeatChance = calculateDemonDefeatChance(demon, playerStats)
    const roll = Math.random()
    const success = roll < defeatChance

    if (success) {
      this.state.demonDefeated = true
      
      // 心魔战胜奖励
      const rewards = {
        insightBonus: Math.floor(demon.power * 100),
        willpowerBonus: 1,
        specialReward: demon.power > 0.7 ? 'demon_essence' : undefined
      }

      return {
        success: true,
        message: `🌟 战胜心魔【${demon.name}】！道心更加坚定`,
        rewards
      }
    } else {
      // 心魔战胜失败惩罚
      const insightLoss = Math.floor(demon.power * 50)
      this.consumeInsight(insightLoss)

      return {
        success: false,
        message: `😈 被心魔【${demon.name}】侵蚀，损失 ${insightLoss} 点感悟`
      }
    }
  }

  /**
   * 生成突破奖励
   */
  private generateBreakthroughRewards(playerStats: { realmIndex: number; level: number }): {
    statBonus?: { stat: string; value: number }
    newSkill?: string
    specialReward?: string
  } {
    const rewards: any = {}

    // 属性加成
    const stats = ['attack', 'defense', 'maxHp', 'critRate']
    const randomStat = stats[Math.floor(Math.random() * stats.length)]
    rewards.statBonus = {
      stat: randomStat,
      value: Math.floor(Math.random() * 10) + 5
    }

    // 大瓶颈可能获得新技能
    if (playerStats.level % 30 === 0) {
      rewards.newSkill = 'breakthrough_skill_' + playerStats.level
    }

    // 特殊奖励
    if (Math.random() < 0.1) {
      rewards.specialReward = 'enlightenment_fragment'
    }

    return rewards
  }

  /**
   * 获取当前状态
   */
  getState(): CultivationState {
    return { ...this.state }
  }

  /**
   * 获取感悟值信息
   */
  getInsight(): InsightState {
    return { ...this.state.insight }
  }

  /**
   * 获取瓶颈信息
   */
  getBottleneck(): BottleneckInfo | null {
    return this.state.bottleneck
  }

  /**
   * 获取心魔信息
   */
  getDemon(): DemonInfo | null {
    return this.state.activeDemon
  }

  /**
   * 是否正在修炼
   */
  isCultivating(): boolean {
    return this.state.isCultivating
  }

  /**
   * 是否遇到瓶颈
   */
  hasBottleneck(): boolean {
    return this.state.bottleneck !== null
  }

  /**
   * 是否战胜心魔
   */
  isDemonDefeated(): boolean {
    return this.state.demonDefeated
  }

  /**
   * 设置回调
   */
  onInsight(callback: (insight: number, max: number) => void): void {
    this.onInsightCallback = callback
  }

  onBottleneck(callback: (bottleneck: BottleneckInfo | null) => void): void {
    this.onBottleneckCallback = callback
  }

  onDemon(callback: (demon: DemonInfo | null) => void): void {
    this.onDemonCallback = callback
  }

  onBreakthrough(callback: (result: BreakthroughResult) => void): void {
    this.onBreakthroughCallback = callback
  }

  /**
   * 应用心魔效果
   */
  applyDemonEffects(): DemonEffect[] {
    if (!this.state.activeDemon || this.state.demonDefeated) {
      return []
    }
    return this.state.activeDemon.effects
  }

  /**
   * 清除心魔（特殊道具或事件）
   */
  clearDemon(): void {
    this.state.activeDemon = null
    this.state.demonDefeated = false
    if (this.onDemonCallback) {
      this.onDemonCallback(null)
    }
  }

  /**
   * 增加感悟倍率（道具效果）
   */
  addInsightMultiplier(multiplier: number, duration: number): void {
    this.state.insight.multiplier += multiplier
    
    setTimeout(() => {
      this.state.insight.multiplier -= multiplier
    }, duration * 1000)
  }

  /**
   * 直接增加感悟值（特殊事件）
   */
  addInsightDirect(amount: number): void {
    this.addInsight(amount)
  }

  /**
   * 重置修炼状态
   */
  reset(): void {
    this.stopCultivation()
    this.state = {
      isCultivating: false,
      startTime: 0,
      totalCultivationTime: 0,
      insight: {
        current: 0,
        max: 100,
        rate: 0.5,
        multiplier: 1
      },
      bottleneck: null,
      activeDemon: null,
      demonDefeated: false,
      breakthroughHistory: []
    }
  }
}

/**
 * 创建修炼引擎
 */
export function createCultivationEngine(): CultivationEngine {
  return new CultivationEngine()
}
