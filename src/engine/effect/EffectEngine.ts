import type {
  Effect,
  EffectContext,
  EffectTrigger,
  EffectType,
  DamageData,
  HealData,
  BuffData,
  ModifierData,
  ShieldData,
  TriggerData,
  ExecuteData,
  DispelData,
  SummonData,
  TransformData,
  DamageModifier,
  DamagePipeline
} from './types'

/**
 * 效果引擎 - 处理所有战斗效果的执行和计算
 */
export class EffectEngine {
  private context: EffectContext
  private damageModifiers: DamageModifier[] = []

  constructor(context: EffectContext) {
    this.context = context
  }

  /**
   * 执行单个效果
   */
  executeEffect(effect: Effect, triggerData?: TriggerData): boolean {
    const ctx = { ...this.context, triggerData }

    switch (effect.type) {
      case 'Damage':
        return this.executeDamage(effect.data as DamageData, ctx)
      case 'Heal':
        return this.executeHeal(effect.data as HealData, ctx)
      case 'AddBuff':
        return this.executeAddBuff(effect.data as BuffData, ctx)
      case 'RemoveBuff':
        return this.executeRemoveBuff(effect.data as BuffData, ctx)
      case 'ModifyStat':
        return this.executeModifyStat(effect.data as ModifierData, ctx)
      case 'Shield':
        return this.executeShield(effect.data as ShieldData, ctx)
      case 'Trigger':
        return this.executeTrigger(effect.data as TriggerData, ctx)
      case 'Execute':
        return this.executeExecute(effect.data as ExecuteData, ctx)
      case 'Dispel':
        return this.executeDispel(effect.data as DispelData, ctx)
      case 'Summon':
        return this.executeSummon(effect.data as SummonData, ctx)
      case 'Transform':
        return this.executeTransform(effect.data as TransformData, ctx)
      default:
        console.warn(`Unknown effect type: ${effect.type}`)
        return false
    }
  }

  /**
   * 执行多个效果
   */
  executeEffects(effects: Effect[], triggerData?: TriggerData): boolean[] {
    return effects.map(effect => this.executeEffect(effect, triggerData))
  }

  /**
   * 执行伤害效果
   */
  private executeDamage(data: DamageData, ctx: EffectContext): boolean {
    const { source, target } = ctx
    if (!source || !target) return false

    // 计算基础伤害
    let damage = data.value

    // 应用攻击者属性加成
    if (data.scaling) {
      for (const scale of data.scaling) {
        const statValue = (source as any)[scale.stat] || 0
        damage += statValue * scale.ratio
      }
    }

    // 创建伤害管道
    const pipeline: DamagePipeline = {
      baseDamage: damage,
      fixedDamage: damage,
      percentDamage: damage,
      finalDamage: damage,
      isCritical: false,
      isDodged: false,
      damageType: data.damageType || 'physical',
      source,
      target
    }

    // 执行伤害管道计算
    this.processDamagePipeline(pipeline)

    // 检查闪避
    if (pipeline.isDodged) {
      this.logBattle(`${target.name} 闪避了攻击！`, 'dodge')
      return false
    }

    // 应用伤害
    const actualDamage = Math.max(1, Math.floor(pipeline.finalDamage))
    
    // 先消耗护盾
    const shieldAbsorb = this.applyDamageToShield(target, actualDamage)
    const remainingDamage = actualDamage - shieldAbsorb

    if (remainingDamage > 0) {
      target.hp = Math.max(0, target.hp - remainingDamage)
    }

    // 记录战斗日志
    const critText = pipeline.isCritical ? '💥 暴击！' : ''
    const damageText = shieldAbsorb > 0 
      ? `${actualDamage}(护盾吸收${shieldAbsorb})` 
      : `${actualDamage}`
    
    this.logBattle(`${critText}${source.name} 对 ${target.name} 造成 ${damageText} 点伤害`, 
      pipeline.isCritical ? 'critical' : 'attack')

    // 触发受击事件
    this.triggerEffects('ON_HIT', { source, target, damage: actualDamage })
    this.triggerEffects('ON_BEING_HIT', { source, target, damage: actualDamage })

    return true
  }

  /**
   * 执行治疗效果
   */
  private executeHeal(data: HealData, ctx: EffectContext): boolean {
    const { source, target } = ctx
    if (!source || !target) return false

    let heal = data.value

    // 应用治疗者属性加成
    if (data.scaling) {
      for (const scale of data.scaling) {
        const statValue = (source as any)[scale.stat] || 0
        heal += statValue * scale.ratio
      }
    }

    // 应用治疗加成/减成
    const healBonus = (source as any).healBonus || 0
    const healReceived = (target as any).healReceived || 0
    heal = heal * (1 + healBonus) * (1 + healReceived)

    const actualHeal = Math.floor(heal)
    const oldHp = target.hp
    target.hp = Math.min(target.maxHp, target.hp + actualHeal)
    const healedAmount = target.hp - oldHp

    this.logBattle(`💚 ${target.name} 恢复了 ${healedAmount} 点生命`, 'heal')

    return true
  }

  /**
   * 执行添加Buff效果
   */
  private executeAddBuff(data: BuffData, ctx: EffectContext): boolean {
    const { target } = ctx
    if (!target || !target.buffs) return false

    // 检查是否已存在同名Buff
    const existingIndex = target.buffs.findIndex(b => b.id === data.buffId)
    
    const newBuff = {
      id: data.buffId,
      name: data.name || data.buffId,
      duration: data.duration || 3,
      stacks: data.stacks || 1,
      maxStacks: data.maxStacks || 1,
      tags: data.tags || [],
      effects: data.effects || []
    }

    if (existingIndex >= 0) {
      // 叠加逻辑
      const existing = target.buffs[existingIndex]
      if (existing.stacks < (newBuff.maxStacks || 1)) {
        existing.stacks = Math.min(existing.stacks + newBuff.stacks, newBuff.maxStacks || 1)
        existing.duration = Math.max(existing.duration, newBuff.duration)
        this.logBattle(`${target.name} 的 ${newBuff.name} 叠加至 ${existing.stacks} 层`, 'buff')
      } else {
        existing.duration = newBuff.duration // 刷新持续时间
        this.logBattle(`${target.name} 的 ${newBuff.name} 持续时间刷新`, 'buff')
      }
    } else {
      target.buffs.push(newBuff)
      this.logBattle(`${target.name} 获得 ${newBuff.name}`, 'buff')
    }

    return true
  }

  /**
   * 执行移除Buff效果
   */
  private executeRemoveBuff(data: BuffData, ctx: EffectContext): boolean {
    const { target } = ctx
    if (!target || !target.buffs) return false

    const index = target.buffs.findIndex(b => b.id === data.buffId)
    if (index >= 0) {
      const buff = target.buffs[index]
      target.buffs.splice(index, 1)
      this.logBattle(`${target.name} 的 ${buff.name} 被移除`, 'buff')
      return true
    }

    return false
  }

  /**
   * 执行属性修改效果
   */
  private executeModifyStat(data: ModifierData, ctx: EffectContext): boolean {
    const { target } = ctx
    if (!target) return false

    const statValue = (target as any)[data.stat] || 0
    let newValue = statValue

    switch (data.operation) {
      case 'Add':
        newValue += data.value
        break
      case 'Multiply':
        newValue *= data.value
        break
      case 'Set':
        newValue = data.value
        break
      case 'AddPercent':
        newValue *= (1 + data.value)
        break
    }

    ;(target as any)[data.stat] = newValue
    return true
  }

  /**
   * 执行护盾效果
   */
  private executeShield(data: ShieldData, ctx: EffectContext): boolean {
    const { target } = ctx
    if (!target) return false

    if (!target.shields) {
      target.shields = []
    }

    let shieldValue = data.value
    if (data.scaling) {
      for (const scale of data.scaling) {
        const statValue = (ctx.source as any)?.[scale.stat] || 0
        shieldValue += statValue * scale.ratio
      }
    }

    target.shields.push({
      value: Math.floor(shieldValue),
      duration: data.duration || 3,
      source: ctx.source
    })

    this.logBattle(`🛡️ ${target.name} 获得 ${Math.floor(shieldValue)} 点护盾`, 'buff')
    return true
  }

  /**
   * 执行触发器效果
   */
  private executeTrigger(data: TriggerData, ctx: EffectContext): boolean {
    // 触发器效果在特定时机自动执行，这里只是注册
    return true
  }

  /**
   * 执行斩杀效果
   */
  private executeExecute(data: ExecuteData, ctx: EffectContext): boolean {
    const { source, target } = ctx
    if (!source || !target) return false

    const hpPercent = target.hp / target.maxHp
    if (hpPercent <= data.threshold) {
      target.hp = 0
      this.logBattle(`⚔️ ${source.name} 斩杀了 ${target.name}！`, 'critical')
      return true
    }

    return false
  }

  /**
   * 执行驱散效果
   */
  private executeDispel(data: DispelData, ctx: EffectContext): boolean {
    const { target } = ctx
    if (!target || !target.buffs) return false

    let dispelCount = 0
    const buffsToRemove = target.buffs.filter(buff => {
      if (data.buffType === 'all') return true
      return buff.tags?.includes(data.buffType)
    })

    const toRemove = buffsToRemove.slice(0, data.count)
    for (const buff of toRemove) {
      const index = target.buffs.indexOf(buff)
      if (index >= 0) {
        target.buffs.splice(index, 1)
        dispelCount++
      }
    }

    if (dispelCount > 0) {
      this.logBattle(`✨ ${target.name} 被驱散了 ${dispelCount} 个效果`, 'buff')
    }

    return dispelCount > 0
  }

  /**
   * 执行召唤效果
   */
  private executeSummon(data: SummonData, ctx: EffectContext): boolean {
    this.logBattle(`👻 ${ctx.source?.name} 召唤了 ${data.summonId}`, 'system')
    return true
  }

  /**
   * 执行变形效果
   */
  private executeTransform(data: TransformData, ctx: EffectContext): boolean {
    this.logBattle(`🔄 ${ctx.target?.name} 变形为 ${data.transformId}`, 'system')
    return true
  }

  /**
   * 处理伤害管道计算
   */
  private processDamagePipeline(pipeline: DamagePipeline): void {
    // 阶段1: 基础伤害计算
    this.damageModifiers
      .filter(m => m.stage === 'BASE')
      .forEach(m => {
        pipeline.baseDamage = m.modify(pipeline.baseDamage, pipeline)
      })

    pipeline.fixedDamage = pipeline.baseDamage

    // 阶段2: 固定值修正
    this.damageModifiers
      .filter(m => m.stage === 'FIXED')
      .forEach(m => {
        pipeline.fixedDamage = m.modify(pipeline.fixedDamage, pipeline)
      })

    pipeline.percentDamage = pipeline.fixedDamage

    // 阶段3: 百分比修正
    this.damageModifiers
      .filter(m => m.stage === 'PERCENT')
      .forEach(m => {
        pipeline.percentDamage = m.modify(pipeline.percentDamage, pipeline)
      })

    pipeline.finalDamage = pipeline.percentDamage

    // 阶段4: 最终修正
    this.damageModifiers
      .filter(m => m.stage === 'FINAL')
      .forEach(m => {
        pipeline.finalDamage = m.modify(pipeline.finalDamage, pipeline)
      })

    // 暴击判定
    const critChance = (pipeline.source as any)?.critRate || 0.15
    pipeline.isCritical = Math.random() < critChance
    if (pipeline.isCritical) {
      const critDamage = (pipeline.source as any)?.critDamage || 1.8
      pipeline.finalDamage *= critDamage
    }

    // 闪避判定
    const dodgeChance = (pipeline.target as any)?.dodgeRate || 0.08
    pipeline.isDodged = Math.random() < dodgeChance
  }

  /**
   * 应用伤害到护盾
   */
  private applyDamageToShield(target: any, damage: number): number {
    if (!target.shields || target.shields.length === 0) return 0

    let remainingDamage = damage
    let totalAbsorbed = 0

    // 按持续时间排序，先消耗即将到期的护盾
    target.shields.sort((a: any, b: any) => a.duration - b.duration)

    for (let i = target.shields.length - 1; i >= 0; i--) {
      const shield = target.shields[i]
      if (shield.value >= remainingDamage) {
        shield.value -= remainingDamage
        totalAbsorbed += remainingDamage
        remainingDamage = 0
        if (shield.value <= 0) {
          target.shields.splice(i, 1)
        }
        break
      } else {
        remainingDamage -= shield.value
        totalAbsorbed += shield.value
        target.shields.splice(i, 1)
      }
    }

    return totalAbsorbed
  }

  /**
   * 注册伤害修正器
   */
  registerDamageModifier(modifier: DamageModifier): void {
    this.damageModifiers.push(modifier)
  }

  /**
   * 触发特定时机的效果
   */
  triggerEffects(trigger: EffectTrigger, data: Partial<EffectContext>): void {
    // 这里会检查所有单位身上的Buff和技能，触发对应时机的效果
    // 具体实现会在Buff系统中
  }

  /**
   * 记录战斗日志
   */
  private logBattle(message: string, type: string = 'info'): void {
    if (this.context.logCallback) {
      this.context.logCallback(message, type)
    }
  }
}

/**
 * 创建效果引擎实例
 */
export function createEffectEngine(context: EffectContext): EffectEngine {
  return new EffectEngine(context)
}
