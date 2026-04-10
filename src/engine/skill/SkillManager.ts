import type { SkillDefinition, SkillInstance, SkillLevelData, SkillCost } from './types'
import { skillRegistry } from './types'
import type { EffectEngine } from '../effect/EffectEngine'
import type { EffectContext } from '../effect/types'
import { createEffectEngine } from '../effect/EffectEngine'

/**
 * 技能管理器
 * 管理单位的技能学习、升级、冷却等
 */
export class SkillManager {
  private owner: any
  private skills: Map<string, SkillInstance> = new Map()
  private passiveEffectsApplied: boolean = false
  private effectEngine: EffectEngine | null = null

  constructor(owner: any) {
    this.owner = owner
  }

  /**
   * 设置效果引擎
   */
  setEffectEngine(engine: EffectEngine): void {
    this.effectEngine = engine
  }

  /**
   * 学习技能
   */
  learnSkill(skillId: string, level: number = 1): boolean {
    const definition = skillRegistry.get(skillId)
    if (!definition) {
      console.warn(`Skill not found: ${skillId}`)
      return false
    }

    // 检查是否已学习
    if (this.skills.has(skillId)) {
      console.warn(`Already learned skill: ${skillId}`)
      return false
    }

    // 检查学习要求
    if (!this.checkRequirements(definition.levels[level - 1])) {
      return false
    }

    // 创建技能实例
    const instance: SkillInstance = {
      definitionId: skillId,
      level: level,
      currentCooldown: 0,
      currentCharges: 1,
      maxCharges: 1
    }

    this.skills.set(skillId, instance)

    // 如果是被动技能，立即应用效果
    if (definition.type === 'passive' && !this.passiveEffectsApplied) {
      this.applyPassiveSkills()
    }

    return true
  }

  /**
   * 升级技能
   */
  upgradeSkill(skillId: string): boolean {
    const instance = this.skills.get(skillId)
    if (!instance) return false

    const definition = skillRegistry.get(skillId)
    if (!definition) return false

    // 检查是否已达到最高等级
    if (instance.level >= definition.maxLevel) return false

    const nextLevel = instance.level + 1
    const levelData = definition.levels[nextLevel - 1]

    // 检查升级要求
    if (!this.checkRequirements(levelData)) return false

    // 升级
    instance.level = nextLevel

    // 如果是被动技能，重新应用效果
    if (definition.type === 'passive') {
      this.reapplyPassiveSkills()
    }

    return true
  }

  /**
   * 检查技能要求
   */
  private checkRequirements(levelData: SkillLevelData): boolean {
    if (!levelData.requirements) return true

    for (const req of levelData.requirements) {
      if (req.level && this.owner.level < req.level) return false
      if (req.realm && this.owner.realmIndex < req.realm) return false
      if (req.skillId && !this.skills.has(req.skillId)) return false
      if (req.stat && (this.owner[req.stat.name] || 0) < req.stat.value) return false
    }

    return true
  }

  /**
   * 检查是否可以使用技能
   */
  canUseSkill(skillId: string): { canUse: boolean; reason?: string } {
    const instance = this.skills.get(skillId)
    if (!instance) {
      return { canUse: false, reason: '未学习该技能' }
    }

    const definition = skillRegistry.get(skillId)
    if (!definition) {
      return { canUse: false, reason: '技能不存在' }
    }

    const levelData = definition.levels[instance.level - 1]

    // 检查冷却
    if (instance.currentCooldown > 0) {
      return { canUse: false, reason: `冷却中 (${instance.currentCooldown}回合)` }
    }

    // 检查消耗
    if (levelData.cost.mp && this.owner.mp < levelData.cost.mp) {
      return { canUse: false, reason: '法力不足' }
    }
    if (levelData.cost.hp && this.owner.hp <= levelData.cost.hp) {
      return { canUse: false, reason: '生命值不足' }
    }
    if (levelData.cost.sp && (this.owner.sp || 0) < levelData.cost.sp) {
      return { canUse: false, reason: '怒气不足' }
    }

    return { canUse: true }
  }

  /**
   * 使用技能
   */
  useSkill(skillId: string, target: any, context?: Partial<EffectContext>): boolean {
    const check = this.canUseSkill(skillId)
    if (!check.canUse) {
      console.warn(`Cannot use skill: ${check.reason}`)
      return false
    }

    const instance = this.skills.get(skillId)!
    const definition = skillRegistry.get(skillId)!
    const levelData = definition.levels[instance.level - 1]

    // 消耗资源
    if (levelData.cost.mp) this.owner.mp -= levelData.cost.mp
    if (levelData.cost.hp) this.owner.hp -= levelData.cost.hp
    if (levelData.cost.sp) this.owner.sp = (this.owner.sp || 0) - levelData.cost.sp

    // 设置冷却
    if (levelData.cost.cooldown) {
      instance.currentCooldown = levelData.cost.cooldown
    }

    // 记录使用时间
    instance.lastCastTime = Date.now()

    // 执行技能效果
    if (this.effectEngine && levelData.effects.length > 0) {
      const effectContext: EffectContext = {
        source: this.owner,
        target: target,
        battle: context?.battle || null,
        logCallback: context?.logCallback
      }

      const engine = createEffectEngine(effectContext)
      engine.executeEffects(levelData.effects)
    }

    return true
  }

  /**
   * 回合结束处理（减少冷却）
   */
  onTurnEnd(): void {
    for (const instance of this.skills.values()) {
      if (instance.currentCooldown > 0) {
        instance.currentCooldown--
      }
    }
  }

  /**
   * 应用被动技能效果
   */
  applyPassiveSkills(): void {
    if (this.passiveEffectsApplied) return

    for (const [skillId, instance] of this.skills) {
      const definition = skillRegistry.get(skillId)
      if (!definition || definition.type !== 'passive') continue

      const levelData = definition.levels[instance.level - 1]

      // 应用被动效果
      for (const effect of levelData.effects) {
        if (effect.type === 'ModifyStat') {
          const data = effect.data as any
          const currentValue = this.owner[data.stat] || 0

          switch (data.operation) {
            case 'Add':
              this.owner[data.stat] = currentValue + data.value
              break
            case 'Multiply':
              this.owner[data.stat] = currentValue * data.value
              break
            case 'AddPercent':
              this.owner[data.stat] = currentValue + data.value
              break
            case 'Set':
              this.owner[data.stat] = data.value
              break
          }
        }
      }
    }

    this.passiveEffectsApplied = true
  }

  /**
   * 重新应用被动技能（升级后）
   */
  reapplyPassiveSkills(): void {
    // 这里应该有一个机制来移除旧的被动效果
    // 简化处理：暂时不支持降级，所以直接重新应用
    this.applyPassiveSkills()
  }

  /**
   * 获取技能实例
   */
  getSkill(skillId: string): SkillInstance | undefined {
    return this.skills.get(skillId)
  }

  /**
   * 获取技能定义
   */
  getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return skillRegistry.get(skillId)
  }

  /**
   * 获取所有已学习的技能
   */
  getAllSkills(): { instance: SkillInstance; definition: SkillDefinition }[] {
    const result: { instance: SkillInstance; definition: SkillDefinition }[] = []

    for (const [skillId, instance] of this.skills) {
      const definition = skillRegistry.get(skillId)
      if (definition) {
        result.push({ instance, definition })
      }
    }

    return result
  }

  /**
   * 获取主动技能
   */
  getActiveSkills(): { instance: SkillInstance; definition: SkillDefinition }[] {
    return this.getAllSkills().filter(s => s.definition.type === 'active')
  }

  /**
   * 获取被动技能
   */
  getPassiveSkills(): { instance: SkillInstance; definition: SkillDefinition }[] {
    return this.getAllSkills().filter(s => s.definition.type === 'passive')
  }

  /**
   * 获取可用技能
   */
  getAvailableSkills(): { instance: SkillInstance; definition: SkillDefinition }[] {
    return this.getAllSkills().filter(s => {
      const check = this.canUseSkill(s.definition.id)
      return check.canUse
    })
  }

  /**
   * 遗忘技能
   */
  forgetSkill(skillId: string): boolean {
    const instance = this.skills.get(skillId)
    if (!instance) return false

    const definition = skillRegistry.get(skillId)
    if (definition?.type === 'passive') {
      // 如果是被动技能，需要移除效果
      // 这里简化处理，实际应该记录并移除具体加成
      this.passiveEffectsApplied = false
    }

    this.skills.delete(skillId)
    return true
  }

  /**
   * 重置所有技能
   */
  resetSkills(): void {
    this.skills.clear()
    this.passiveEffectsApplied = false
  }

  /**
   * 获取技能冷却信息
   */
  getCooldownInfo(skillId: string): { current: number; max: number } | null {
    const instance = this.skills.get(skillId)
    if (!instance) return null

    const definition = skillRegistry.get(skillId)
    if (!definition) return null

    const maxCooldown = definition.levels[instance.level - 1].cost.cooldown || 0

    return {
      current: instance.currentCooldown,
      max: maxCooldown
    }
  }

  /**
   * 减少技能冷却（特殊效果）
   */
  reduceCooldown(skillId: string, amount: number): boolean {
    const instance = this.skills.get(skillId)
    if (!instance) return false

    instance.currentCooldown = Math.max(0, instance.currentCooldown - amount)
    return true
  }

  /**
   * 重置技能冷却（特殊效果）
   */
  resetCooldown(skillId: string): boolean {
    const instance = this.skills.get(skillId)
    if (!instance) return false

    instance.currentCooldown = 0
    return true
  }

  /**
   * 重置所有冷却
   */
  resetAllCooldowns(): void {
    for (const instance of this.skills.values()) {
      instance.currentCooldown = 0
    }
  }
}

/**
 * 创建技能管理器
 */
export function createSkillManager(owner: any): SkillManager {
  return new SkillManager(owner)
}
