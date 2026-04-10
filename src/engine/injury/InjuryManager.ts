import type { InjuryDefinition, InjuryInstance, InjurySeverity } from './types'
import { injuryRegistry, generateInjuryFromCombat, generateInjuryFromBreakthrough } from './types'

/**
 * 伤势管理器
 * 管理玩家的所有伤势
 */
export class InjuryManager {
  private owner: any
  private injuries: InjuryInstance[] = []
  private injuryInterval: number | null = null
  private onInjuryCallback: ((injury: InjuryInstance) => void) | null = null
  private onHealCallback: ((injuryId: string) => void) | null = null
  private onDeteriorateCallback: ((oldInjury: InjuryInstance, newInjury: InjuryInstance) => void) | null = null

  constructor(owner: any) {
    this.owner = owner
    // 确保owner有injuries数组
    if (!this.owner.injuries) {
      this.owner.injuries = this.injuries
    }
    
    // 启动伤势tick
    this.startInjuryTick()
  }

  /**
   * 添加伤势
   */
  addInjury(
    injuryId: string, 
    source: 'combat' | 'cultivation' | 'event' | 'poison' = 'combat',
    sourceName?: string
  ): InjuryInstance | null {
    const definition = injuryRegistry.get(injuryId)
    if (!definition) {
      console.warn(`Injury not found: ${injuryId}`)
      return null
    }

    // 检查是否已有同类型伤势，如果有则取更严重的
    const existingIndex = this.injuries.findIndex(i => i.definitionId === injuryId)
    if (existingIndex >= 0) {
      const existing = this.injuries[existingIndex]
      // 刷新持续时间
      existing.remainingDuration = definition.duration
      return existing
    }

    // 创建伤势实例
    const now = Date.now()
    const instance: InjuryInstance = {
      id: `${injuryId}_${now}`,
      definitionId: definition.id,
      name: definition.name,
      type: definition.type,
      severity: definition.severity,
      description: definition.description,
      appliedAt: now,
      duration: definition.duration,
      remainingDuration: definition.duration,
      isTreated: false,
      isHealing: false,
      treatmentProgress: 0,
      source,
      sourceName,
      lastTickTime: now,
      tickCount: 0
    }

    this.injuries.push(instance)
    this.owner.injuries = this.injuries

    // 应用属性减益
    this.applyStatPenalties(definition, true)

    if (this.onInjuryCallback) {
      this.onInjuryCallback(instance)
    }

    return instance
  }

  /**
   * 从战斗中添加伤势
   */
  addInjuryFromCombat(
    playerHpPercent: number,
    enemyName: string,
    enemyHasPoison: boolean = false,
    enemyHasBurn: boolean = false
  ): InjuryInstance | null {
    const definition = generateInjuryFromCombat(playerHpPercent, enemyName, enemyHasPoison, enemyHasBurn)
    if (!definition) return null

    return this.addInjury(definition.id, 'combat', enemyName)
  }

  /**
   * 从突破失败添加伤势
   */
  addInjuryFromBreakthrough(failureSeverity: number): InjuryInstance | null {
    const definition = generateInjuryFromBreakthrough(failureSeverity)
    if (!definition) return null

    return this.addInjury(definition.id, 'cultivation', '突破失败')
  }

  /**
   * 治疗伤势
   */
  treatInjury(injuryId: string, itemId?: string): { success: boolean; message: string } {
    const index = this.injuries.findIndex(i => i.id === injuryId)
    if (index < 0) {
      return { success: false, message: '伤势不存在' }
    }

    const instance = this.injuries[index]
    const definition = injuryRegistry.get(instance.definitionId)
    if (!definition) {
      return { success: false, message: '伤势定义不存在' }
    }

    // 检查是否需要特定物品
    if (definition.treatment?.itemId) {
      if (!itemId || itemId !== definition.treatment.itemId) {
        return { 
          success: false, 
          message: `需要 ${definition.treatment.itemId} x${definition.treatment.itemCount || 1}` 
        }
      }
    }

    // 标记为已治疗，开始恢复
    instance.isTreated = true
    instance.isHealing = true

    // 如果有物品，加速恢复
    if (itemId) {
      instance.treatmentProgress += 0.3
    }

    return { 
      success: true, 
      message: `开始治疗 ${instance.name}` 
    }
  }

  /**
   * 立即治愈伤势（特殊道具或事件）
   */
  healInjury(injuryId: string): boolean {
    const index = this.injuries.findIndex(i => i.id === injuryId)
    if (index < 0) return false

    const instance = this.injuries[index]
    const definition = injuryRegistry.get(instance.definitionId)
    
    if (definition) {
      // 移除属性减益
      this.applyStatPenalties(definition, false)
    }

    this.injuries.splice(index, 1)
    this.owner.injuries = this.injuries

    if (this.onHealCallback) {
      this.onHealCallback(injuryId)
    }

    return true
  }

  /**
   * 治愈所有伤势
   */
  healAllInjuries(): number {
    let healed = 0
    for (let i = this.injuries.length - 1; i >= 0; i--) {
      const instance = this.injuries[i]
      const definition = injuryRegistry.get(instance.definitionId)
      
      if (definition) {
        this.applyStatPenalties(definition, false)
      }
      
      if (this.onHealCallback) {
        this.onHealCallback(instance.id)
      }
      
      healed++
    }
    
    this.injuries.length = 0
    this.owner.injuries = []
    
    return healed
  }

  /**
   * 伤势tick处理
   */
  private startInjuryTick(): void {
    if (this.injuryInterval) return

    this.injuryInterval = window.setInterval(() => {
      this.processInjuries()
    }, 1000) // 每秒处理一次
  }

  /**
   * 处理伤势
   */
  private processInjuries(): void {
    const now = Date.now()

    for (let i = this.injuries.length - 1; i >= 0; i--) {
      const instance = this.injuries[i]
      const definition = injuryRegistry.get(instance.definitionId)
      if (!definition) continue

      // 减少剩余时间
      instance.remainingDuration--

      // 自然恢复进度
      if (instance.isHealing) {
        instance.treatmentProgress += 1 / (definition.treatment?.restTime || definition.duration)
        
        // 恢复完成
        if (instance.treatmentProgress >= 1) {
          this.healInjury(instance.id)
          continue
        }
      }

      // 检查tick效果
      if (definition.tickEffects) {
        const elapsed = (now - instance.lastTickTime) / 1000
        if (elapsed >= definition.tickEffects.interval) {
          this.processTickEffect(instance, definition)
          instance.lastTickTime = now
          instance.tickCount++
        }
      }

      // 检查恶化
      if (definition.deterioration && !instance.isTreated) {
        const elapsed = (now - instance.appliedAt) / 1000
        if (elapsed % definition.deterioration.interval < 1) {
          const roll = Math.random()
          if (roll < definition.deterioration.chance) {
            this.deteriorateInjury(instance, definition)
          }
        }
      }

      // 检查是否到期
      if (instance.remainingDuration <= 0) {
        // 如果没有特殊效果阻止，伤势自然愈合
        const hasBlockingEffect = definition.specialEffects?.some(
          e => e.type === 'cannot_heal'
        )
        
        if (!hasBlockingEffect || instance.isTreated) {
          this.healInjury(instance.id)
        }
      }
    }
  }

  /**
   * 处理tick效果
   */
  private processTickEffect(instance: InjuryInstance, definition: InjuryDefinition): void {
    if (!definition.tickEffects) return

    switch (definition.tickEffects.effect) {
      case 'damage':
        // 持续伤害
        if (this.owner.hp > definition.tickEffects.value) {
          this.owner.hp -= definition.tickEffects.value
        }
        break
      case 'heal_reduction':
        // 治疗减成已在属性中体现
        break
      case 'stat_drain':
        // 属性流失
        // 这里可以添加临时属性降低逻辑
        break
    }
  }

  /**
   * 伤势恶化
   */
  private deteriorateInjury(
    instance: InjuryInstance, 
    definition: InjuryDefinition
  ): void {
    if (!definition.deterioration?.nextStageId) return

    const nextDefinition = injuryRegistry.get(definition.deterioration.nextStageId)
    if (!nextDefinition) return

    // 移除旧伤势
    this.applyStatPenalties(definition, false)
    
    // 添加新伤势
    const newInstance = this.addInjury(nextDefinition.id, instance.source, instance.sourceName)
    
    if (newInstance && this.onDeteriorateCallback) {
      this.onDeteriorateCallback(instance, newInstance)
    }

    // 移除旧伤势实例
    const index = this.injuries.findIndex(i => i.id === instance.id)
    if (index >= 0) {
      this.injuries.splice(index, 1)
    }
  }

  /**
   * 应用/移除属性减益
   */
  private applyStatPenalties(definition: InjuryDefinition, isApplying: boolean): void {
    for (const penalty of definition.statPenalties) {
      const currentValue = this.owner[penalty.stat] || 0
      
      switch (penalty.operation) {
        case 'Add':
        case 'AddPercent':
          this.owner[penalty.stat] = currentValue + (penalty.value * (isApplying ? 1 : -1))
          break
        case 'Multiply':
          if (isApplying) {
            this.owner[penalty.stat] = currentValue * penalty.value
          } else {
            this.owner[penalty.stat] = currentValue / penalty.value
          }
          break
      }
    }
  }

  /**
   * 检查是否有特定类型的伤势
   */
  hasInjuryType(type: string): boolean {
    return this.injuries.some(i => i.type === type)
  }

  /**
   * 检查是否有特定严重程度的伤势
   */
  hasInjurySeverity(severity: InjurySeverity): boolean {
    return this.injuries.some(i => i.severity === severity)
  }

  /**
   * 获取最严重伤势
   */
  getMostSevereInjury(): InjuryInstance | null {
    if (this.injuries.length === 0) return null
    
    const severityOrder: InjurySeverity[] = ['critical', 'severe', 'moderate', 'minor']
    
    for (const severity of severityOrder) {
      const injury = this.injuries.find(i => i.severity === severity)
      if (injury) return injury
    }
    
    return this.injuries[0]
  }

  /**
   * 检查是否可以修炼
   */
  canCultivate(): { canDo: boolean; reason?: string } {
    for (const instance of this.injuries) {
      const definition = injuryRegistry.get(instance.definitionId)
      if (!definition) continue

      const blockingEffect = definition.specialEffects?.find(
        e => e.type === 'cannot_cultivate'
      )
      
      if (blockingEffect) {
        return { 
          canDo: false, 
          reason: `因 ${instance.name} 无法修炼` 
        }
      }
    }

    return { canDo: true }
  }

  /**
   * 检查是否可以战斗
   */
  canBattle(): { canDo: boolean; reason?: string } {
    for (const instance of this.injuries) {
      const definition = injuryRegistry.get(instance.definitionId)
      if (!definition) continue

      const blockingEffect = definition.specialEffects?.find(
        e => e.type === 'cannot_battle'
      )
      
      if (blockingEffect) {
        return { 
          canDo: false, 
          reason: `因 ${instance.name} 无法战斗` 
        }
      }
    }

    return { canDo: true }
  }

  /**
   * 获取所有伤势
   */
  getAllInjuries(): InjuryInstance[] {
    return [...this.injuries]
  }

  /**
   * 获取伤势统计
   */
  getInjuryStats(): {
    total: number
    minor: number
    moderate: number
    severe: number
    critical: number
    untreated: number
  } {
    return {
      total: this.injuries.length,
      minor: this.injuries.filter(i => i.severity === 'minor').length,
      moderate: this.injuries.filter(i => i.severity === 'moderate').length,
      severe: this.injuries.filter(i => i.severity === 'severe').length,
      critical: this.injuries.filter(i => i.severity === 'critical').length,
      untreated: this.injuries.filter(i => !i.isTreated).length
    }
  }

  /**
   * 设置回调
   */
  onInjury(callback: (injury: InjuryInstance) => void): void {
    this.onInjuryCallback = callback
  }

  onHeal(callback: (injuryId: string) => void): void {
    this.onHealCallback = callback
  }

  onDeteriorate(callback: (oldInjury: InjuryInstance, newInjury: InjuryInstance) => void): void {
    this.onDeteriorateCallback = callback
  }

  /**
   * 停止伤势tick
   */
  stop(): void {
    if (this.injuryInterval) {
      clearInterval(this.injuryInterval)
      this.injuryInterval = null
    }
  }

  /**
   * 重置
   */
  reset(): void {
    this.stop()
    this.healAllInjuries()
  }
}

/**
 * 创建伤势管理器
 */
export function createInjuryManager(owner: any): InjuryManager {
  return new InjuryManager(owner)
}
