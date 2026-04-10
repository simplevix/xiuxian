import type { BuffInstance, BuffTemplate, BuffTag } from './types'
import { buffRegistry, createBuffInstance } from './types'
import type { EffectEngine } from '../effect/EffectEngine'
import type { EffectContext } from '../effect/types'

/**
 * Buff管理器 - 管理单位身上的所有Buff
 */
export class BuffManager {
  private owner: any
  private buffs: BuffInstance[] = []
  private effectEngine: EffectEngine | null = null

  constructor(owner: any, effectEngine?: EffectEngine) {
    this.owner = owner
    this.effectEngine = effectEngine || null
    
    // 确保owner有buffs数组
    if (!this.owner.buffs) {
      this.owner.buffs = this.buffs
    }
  }

  /**
   * 设置效果引擎
   */
  setEffectEngine(engine: EffectEngine): void {
    this.effectEngine = engine
  }

  /**
   * 添加Buff
   */
  addBuff(
    templateId: string, 
    source?: any, 
    duration?: number,
    stacks: number = 1
  ): BuffInstance | null {
    const template = buffRegistry.get(templateId)
    if (!template) {
      console.warn(`Buff template not found: ${templateId}`)
      return null
    }

    // 检查免疫
    if (this.isImmuneTo(template.tags)) {
      return null
    }

    // 检查唯一性
    if (template.isUnique) {
      const existing = this.getBuffByTemplateId(templateId)
      if (existing) {
        // 刷新持续时间
        existing.duration = duration || template.duration
        this.executeBuffEffects(existing, 'onApply')
        return existing
      }
    }

    // 创建新实例
    const instance = createBuffInstance(templateId, source, this.owner, stacks)
    if (!instance) return null

    // 自定义持续时间
    if (duration !== undefined) {
      instance.duration = duration
      instance.maxDuration = duration
    }

    // 检查是否可以叠加
    const existingIndex = this.buffs.findIndex(b => b.templateId === templateId)
    if (existingIndex >= 0 && template.canBeStacked) {
      const existing = this.buffs[existingIndex]
      if (existing.stacks < template.maxStacks) {
        existing.stacks = Math.min(existing.stacks + stacks, template.maxStacks)
        existing.duration = Math.max(existing.duration, instance.duration)
        this.executeBuffEffects(existing, 'onApply')
        return existing
      }
    }

    // 添加新Buff
    this.buffs.push(instance)
    this.owner.buffs = this.buffs

    // 执行获得时效果
    this.executeBuffEffects(instance, 'onApply')

    // 应用属性修正
    this.applyStatModifiers(instance, true)

    return instance
  }

  /**
   * 移除Buff
   */
  removeBuff(buffId: string): boolean {
    const index = this.buffs.findIndex(b => b.id === buffId)
    if (index < 0) return false

    const buff = this.buffs[index]

    // 执行移除时效果
    this.executeBuffEffects(buff, 'onRemove')

    // 移除属性修正
    this.applyStatModifiers(buff, false)

    this.buffs.splice(index, 1)
    this.owner.buffs = this.buffs

    return true
  }

  /**
   * 根据模板ID移除Buff
   */
  removeBuffByTemplateId(templateId: string): boolean {
    const index = this.buffs.findIndex(b => b.templateId === templateId)
    if (index < 0) return false
    return this.removeBuff(this.buffs[index].id)
  }

  /**
   * 根据标签移除Buff
   */
  removeBuffsByTag(tag: BuffTag, count: number = Infinity): number {
    const toRemove = this.buffs
      .filter(b => b.tags.includes(tag))
      .slice(0, count)
    
    let removed = 0
    for (const buff of toRemove) {
      if (this.removeBuff(buff.id)) {
        removed++
      }
    }
    return removed
  }

  /**
   * 驱散Buff（只能驱散可驱散的）
   */
  dispelBuffs(count: number = 1, buffType?: BuffTag): number {
    const templateIds = this.buffs
      .filter(b => {
        const template = buffRegistry.get(b.templateId)
        if (!template || !template.canBeDispelled) return false
        if (buffType && !b.tags.includes(buffType)) return false
        return true
      })
      .map(b => b.id)
      .slice(0, count)

    let dispelled = 0
    for (const id of templateIds) {
      if (this.removeBuff(id)) {
        dispelled++
      }
    }
    return dispelled
  }

  /**
   * 获取Buff
   */
  getBuff(buffId: string): BuffInstance | undefined {
    return this.buffs.find(b => b.id === buffId)
  }

  /**
   * 根据模板ID获取Buff
   */
  getBuffByTemplateId(templateId: string): BuffInstance | undefined {
    return this.buffs.find(b => b.templateId === templateId)
  }

  /**
   * 根据标签获取Buff
   */
  getBuffsByTag(tag: BuffTag): BuffInstance[] {
    return this.buffs.filter(b => b.tags.includes(tag))
  }

  /**
   * 检查是否有特定Buff
   */
  hasBuff(templateId: string): boolean {
    return this.buffs.some(b => b.templateId === templateId)
  }

  /**
   * 检查是否有特定标签的Buff
   */
  hasBuffTag(tag: BuffTag): boolean {
    return this.buffs.some(b => b.tags.includes(tag))
  }

  /**
   * 检查是否免疫特定类型
   */
  isImmuneTo(tags: BuffTag[]): boolean {
    // 检查是否有免疫Buff
    if (this.hasBuffTag('INVINCIBLE')) {
      return tags.includes('DEBUFF') || tags.includes('CONTROL') || tags.includes('DOT')
    }
    return false
  }

  /**
   * 回合开始处理
   */
  onTurnStart(): void {
    // 执行回合开始时的触发器
    this.triggerBuffEffects('ON_TURN_START')
  }

  /**
   * 回合结束处理
   */
  onTurnEnd(): void {
    // 执行回合结束时的触发器
    this.triggerBuffEffects('ON_TURN_END')

    // 减少持续时间并执行tick效果
    this.tickBuffs()
  }

  /**
   * Buff tick处理（DOT/HOT）
   */
  private tickBuffs(): void {
    for (let i = this.buffs.length - 1; i >= 0; i--) {
      const buff = this.buffs[i]
      const template = buffRegistry.get(buff.templateId)
      
      if (!template) continue

      // 执行tick效果
      if (template.onTick && template.onTick.length > 0) {
        this.executeBuffEffects(buff, 'onTick')
      }

      // 减少持续时间
      buff.duration--

      // 检查是否到期
      if (buff.duration <= 0) {
        this.executeBuffEffects(buff, 'onExpire')
        this.applyStatModifiers(buff, false)
        this.buffs.splice(i, 1)
      }
    }

    this.owner.buffs = this.buffs
  }

  /**
   * 更新护盾持续时间
   */
  updateShields(): void {
    if (!this.owner.shields) return

    for (let i = this.owner.shields.length - 1; i >= 0; i--) {
      const shield = this.owner.shields[i]
      shield.duration--
      if (shield.duration <= 0) {
        this.owner.shields.splice(i, 1)
      }
    }
  }

  /**
   * 触发Buff效果
   */
  private triggerBuffEffects(trigger: string): void {
    for (const buff of this.buffs) {
      const template = buffRegistry.get(buff.templateId)
      if (!template || !template.triggers) continue

      const triggerConfig = template.triggers.find(t => t.trigger === trigger)
      if (triggerConfig) {
        // 检查触发概率
        if (triggerConfig.chance !== undefined && Math.random() > triggerConfig.chance) {
          continue
        }

        // 执行效果
        if (this.effectEngine) {
          const context: EffectContext = {
            source: buff.source,
            target: this.owner,
            battle: null,
            logCallback: this.owner.logCallback
          }
          this.effectEngine.executeEffects(triggerConfig.effects, context)
        }
      }
    }
  }

  /**
   * 执行Buff的特定时机效果
   */
  private executeBuffEffects(buff: BuffInstance, timing: 'onApply' | 'onRemove' | 'onTick' | 'onExpire'): void {
    const template = buffRegistry.get(buff.templateId)
    if (!template || !this.effectEngine) return

    const effects = template[timing]
    if (!effects || effects.length === 0) return

    const context: EffectContext = {
      source: buff.source,
      target: this.owner,
      battle: null,
      logCallback: this.owner.logCallback
    }

    this.effectEngine.executeEffects(effects, context)
  }

  /**
   * 应用/移除属性修正
   */
  private applyStatModifiers(buff: BuffInstance, isApplying: boolean): void {
    const template = buffRegistry.get(buff.templateId)
    if (!template || !template.statModifiers) return

    for (const mod of template.statModifiers) {
      const currentValue = this.owner[mod.stat] || 0
      let delta = 0

      switch (mod.operation) {
        case 'Add':
          delta = mod.value * buff.stacks * (isApplying ? 1 : -1)
          this.owner[mod.stat] = currentValue + delta
          break
        case 'Multiply':
          if (isApplying) {
            this.owner[mod.stat] = currentValue * Math.pow(mod.value, buff.stacks)
          } else {
            this.owner[mod.stat] = currentValue / Math.pow(mod.value, buff.stacks)
          }
          break
        case 'AddPercent':
          delta = mod.value * buff.stacks * (isApplying ? 1 : -1)
          this.owner[mod.stat] = currentValue + delta
          break
        case 'Set':
          if (isApplying) {
            buff.data[`original_${mod.stat}`] = currentValue
            this.owner[mod.stat] = mod.value
          } else {
            this.owner[mod.stat] = buff.data[`original_${mod.stat}`] || currentValue
          }
          break
      }
    }
  }

  /**
   * 获取所有Buff
   */
  getAllBuffs(): BuffInstance[] {
    return [...this.buffs]
  }

  /**
   * 清除所有Buff
   */
  clearAllBuffs(): void {
    for (const buff of this.buffs) {
      this.applyStatModifiers(buff, false)
    }
    this.buffs.length = 0
    this.owner.buffs = []
  }

  /**
   * 获取Buff统计信息
   */
  getBuffStats(): {
    total: number
    buffs: number
    debuffs: number
    dots: number
    hots: number
    controls: number
  } {
    return {
      total: this.buffs.length,
      buffs: this.getBuffsByTag('BUFF').length,
      debuffs: this.getBuffsByTag('DEBUFF').length,
      dots: this.getBuffsByTag('DOT').length,
      hots: this.getBuffsByTag('HOT').length,
      controls: this.getBuffsByTag('CONTROL').length
    }
  }
}

/**
 * 创建Buff管理器
 */
export function createBuffManager(owner: any, effectEngine?: EffectEngine): BuffManager {
  return new BuffManager(owner, effectEngine)
}
