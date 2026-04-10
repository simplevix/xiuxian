import type { Effect, EffectContext, EffectTrigger } from '../effect/types'
import { EffectEngine, createEffectEngine } from '../effect/EffectEngine'
import type { BuffInstance } from '../buff/types'
import { BuffManager, createBuffManager } from '../buff/BuffManager'

/**
 * 战斗单位接口
 */
export interface BattleUnit {
  id: string
  name: string
  isPlayer: boolean
  
  // 基础属性
  level: number
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attack: number
  defense: number
  
  // 战斗属性
  critRate: number
  critDamage: number
  dodgeRate: number
  hitRate: number
  attackSpeed: number
  
  // 特殊属性
  lifesteal: number
  damageReduction: number
  reflectDamage: number
  healBonus: number
  
  // Buff和护盾
  buffs: BuffInstance[]
  shields: { value: number; duration: number; source?: any }[]
  
  // 技能
  skills: BattleSkill[]
  
  // 战斗状态
  canAct: boolean
  canUseSkill: boolean
  isStealthed: boolean
  
  // 战斗数据
  damageDealt: number
  damageReceived: number
  healDone: number
  
  // 原始数据引用
  originalData: any
}

/**
 * 战斗技能
 */
export interface BattleSkill {
  id: string
  name: string
  description: string
  icon?: string
  cooldown: number
  currentCooldown: number
  mpCost: number
  hpCost: number
  effects: Effect[]
  targetType: 'enemy' | 'self' | 'ally' | 'all_enemies' | 'all_allies'
  canUse: (user: BattleUnit, target: BattleUnit) => boolean
}

/**
 * 战斗日志条目
 */
export interface BattleLogEntry {
  text: string
  type: 'info' | 'attack' | 'critical' | 'heal' | 'buff' | 'debuff' | 'dodge' | 'skill' | 'victory' | 'defeat' | 'system'
  timestamp: number
  turn: number
}

/**
 * 战斗配置
 */
export interface BattleConfig {
  maxTurns: number
  turnInterval: number
  enableAutoBattle: boolean
  aiDifficulty: 'easy' | 'normal' | 'hard'
}

/**
 * 战斗结果
 */
export interface BattleResult {
  victory: boolean
  turns: number
  duration: number
  playerDamage: number
  playerHealing: number
  expGained: number
  drops: any[]
}

/**
 * 战斗引擎
 */
export class BattleEngine {
  private player: BattleUnit | null = null
  private enemy: BattleUnit | null = null
  private turn: number = 0
  private isRunning: boolean = false
  private logs: BattleLogEntry[] = []
  private effectEngine: EffectEngine | null = null
  private playerBuffManager: BuffManager | null = null
  private enemyBuffManager: BuffManager | null = null
  private config: BattleConfig
  private startTime: number = 0
  private onLogCallback: ((log: BattleLogEntry) => void) | null = null
  private onTurnCallback: ((turn: number) => void) | null = null
  private onEndCallback: ((result: BattleResult) => void) | null = null

  constructor(config: Partial<BattleConfig> = {}) {
    this.config = {
      maxTurns: 100,
      turnInterval: 2500,
      enableAutoBattle: true,
      aiDifficulty: 'normal',
      ...config
    }
  }

  /**
   * 初始化战斗
   */
  initBattle(playerData: any, enemyData: any): void {
    this.player = this.createBattleUnit(playerData, true)
    this.enemy = this.createBattleUnit(enemyData, false)
    this.turn = 0
    this.isRunning = false
    this.logs = []
    this.startTime = Date.now()

    // 创建效果引擎
    const context: EffectContext = {
      source: this.player,
      target: this.enemy,
      battle: this,
      logCallback: (msg, type) => this.addLog(msg, type as any)
    }
    this.effectEngine = createEffectEngine(context)

    // 创建Buff管理器
    this.playerBuffManager = createBuffManager(this.player, this.effectEngine)
    this.enemyBuffManager = createBuffManager(this.enemy, this.effectEngine)

    this.addLog(`⚔️ 战斗开始！${this.player.name} VS ${this.enemy.name}`, 'system')
  }

  /**
   * 创建战斗单位
   */
  private createBattleUnit(data: any, isPlayer: boolean): BattleUnit {
    return {
      id: data.id || `${isPlayer ? 'player' : 'enemy'}_${Date.now()}`,
      name: data.name || (isPlayer ? '玩家' : '敌人'),
      isPlayer,
      level: data.level || 1,
      hp: data.hp || data.maxHp || 100,
      maxHp: data.maxHp || 100,
      mp: data.mp || data.maxMp || 100,
      maxMp: data.maxMp || 100,
      attack: data.attack || 10,
      defense: data.defense || 5,
      critRate: data.critRate || 0.15,
      critDamage: data.critDamage || 1.8,
      dodgeRate: data.dodgeRate || 0.08,
      hitRate: data.hitRate || 0.95,
      attackSpeed: data.attackSpeed || 1,
      lifesteal: data.lifesteal || 0,
      damageReduction: data.damageReduction || 0,
      reflectDamage: data.reflectDamage || 0,
      healBonus: data.healBonus || 0,
      buffs: [],
      shields: [],
      skills: data.skills || [],
      canAct: true,
      canUseSkill: true,
      isStealthed: false,
      damageDealt: 0,
      damageReceived: 0,
      healDone: 0,
      originalData: data
    }
  }

  /**
   * 执行一个回合
   */
  executeTurn(): boolean {
    if (!this.isRunning || !this.player || !this.enemy) return false

    this.turn++
    if (this.onTurnCallback) {
      this.onTurnCallback(this.turn)
    }

    this.addLog(`--- 第 ${this.turn} 回合 ---`, 'info')

    // 玩家回合
    this.executeUnitTurn(this.player, this.enemy, this.playerBuffManager!)

    // 检查战斗结束
    if (this.checkBattleEnd()) return false

    // 敌人回合
    this.executeUnitTurn(this.enemy, this.player, this.enemyBuffManager!)

    // 检查战斗结束
    if (this.checkBattleEnd()) return false

    // 检查最大回合数
    if (this.turn >= this.config.maxTurns) {
      this.endBattle(false)
      return false
    }

    return true
  }

  /**
   * 执行单位回合
   */
  private executeUnitTurn(unit: BattleUnit, target: BattleUnit, buffManager: BuffManager): void {
    // 回合开始
    buffManager.onTurnStart()

    // 减少技能冷却
    for (const skill of unit.skills) {
      if (skill.currentCooldown > 0) {
        skill.currentCooldown--
      }
    }

    // 检查是否可以行动
    if (!unit.canAct) {
      this.addLog(`😵 ${unit.name} 无法行动`, 'system')
      unit.canAct = true // 重置
      buffManager.onTurnEnd()
      return
    }

    // AI决策或使用技能
    const skill = this.selectSkill(unit, target)
    if (skill && unit.canUseSkill) {
      this.useSkill(unit, target, skill)
    } else {
      this.normalAttack(unit, target)
    }

    // 回合结束
    buffManager.onTurnEnd()
    buffManager.updateShields()
  }

  /**
   * 选择技能（AI）
   */
  private selectSkill(unit: BattleUnit, target: BattleUnit): BattleSkill | null {
    if (!unit.canUseSkill || unit.skills.length === 0) return null

    const availableSkills = unit.skills.filter(s => 
      s.currentCooldown <= 0 && 
      unit.mp >= s.mpCost &&
      unit.hp > s.hpCost &&
      (!s.canUse || s.canUse(unit, target))
    )

    if (availableSkills.length === 0) return null

    // 简单AI：优先使用高伤害技能，或根据血量选择治疗
    if (unit.hp / unit.maxHp < 0.3) {
      const healSkill = availableSkills.find(s => 
        s.effects.some(e => e.type === 'Heal')
      )
      if (healSkill) return healSkill
    }

    // 根据难度选择策略
    switch (this.config.aiDifficulty) {
      case 'hard':
        // 困难：优先使用最强技能
        return availableSkills.reduce((best, current) => {
          const bestPower = this.estimateSkillPower(best)
          const currentPower = this.estimateSkillPower(current)
          return currentPower > bestPower ? current : best
        })
      case 'easy':
        // 简单：随机选择
        return availableSkills[Math.floor(Math.random() * availableSkills.length)]
      default:
        // 普通：70%概率使用技能
        if (Math.random() < 0.7) {
          return availableSkills[Math.floor(Math.random() * availableSkills.length)]
        }
        return null
    }
  }

  /**
   * 估算技能威力
   */
  private estimateSkillPower(skill: BattleSkill): number {
    let power = 0
    for (const effect of skill.effects) {
      switch (effect.type) {
        case 'Damage':
          power += (effect.data as any).value || 0
          break
        case 'Heal':
          power += (effect.data as any).value || 0
          break
        case 'AddBuff':
          power += 20 // Buff价值
          break
      }
    }
    return power
  }

  /**
   * 使用技能
   */
  private useSkill(user: BattleUnit, target: BattleUnit, skill: BattleSkill): void {
    // 消耗资源
    user.mp -= skill.mpCost
    user.hp -= skill.hpCost
    skill.currentCooldown = skill.cooldown

    this.addLog(`✨ ${user.name} 使用 【${skill.name}】！`, 'skill')

    // 执行技能效果
    if (this.effectEngine) {
      const context: EffectContext = {
        source: user,
        target: target,
        battle: this,
        logCallback: (msg, type) => this.addLog(msg, type as any)
      }

      // 更新效果引擎上下文
      this.effectEngine = createEffectEngine(context)
      this.effectEngine.executeEffects(skill.effects)
    }
  }

  /**
   * 普通攻击
   */
  private normalAttack(attacker: BattleUnit, defender: BattleUnit): void {
    if (!this.effectEngine) return

    // 计算伤害
    let damage = Math.max(1, attacker.attack - defender.defense)

    // 暴击判定
    const isCrit = Math.random() < attacker.critRate
    if (isCrit) {
      damage *= attacker.critDamage
    }

    // 执行伤害效果
    const damageEffect: Effect = {
      type: 'Damage',
      data: {
        value: damage,
        damageType: 'physical',
        isCritical: isCrit
      }
    }

    const context: EffectContext = {
      source: attacker,
      target: defender,
      battle: this,
      logCallback: (msg, type) => this.addLog(msg, type as any)
    }

    this.effectEngine = createEffectEngine(context)
    this.effectEngine.executeEffect(damageEffect)
  }

  /**
   * 检查战斗是否结束
   */
  private checkBattleEnd(): boolean {
    if (!this.player || !this.enemy) return true

    if (this.player.hp <= 0) {
      this.endBattle(false)
      return true
    }

    if (this.enemy.hp <= 0) {
      this.endBattle(true)
      return true
    }

    return false
  }

  /**
   * 结束战斗
   */
  private endBattle(victory: boolean): void {
    this.isRunning = false
    const duration = Date.now() - this.startTime

    const result: BattleResult = {
      victory,
      turns: this.turn,
      duration,
      playerDamage: this.player?.damageDealt || 0,
      playerHealing: this.player?.healDone || 0,
      expGained: victory ? (this.enemy?.originalData?.expReward || 0) : 0,
      drops: victory ? this.calculateDrops() : []
    }

    if (victory) {
      this.addLog(`🏆 战斗胜利！共 ${this.turn} 回合`, 'victory')
    } else {
      this.addLog(`💔 战斗失败...`, 'defeat')
    }

    if (this.onEndCallback) {
      this.onEndCallback(result)
    }
  }

  /**
   * 计算掉落
   */
  private calculateDrops(): any[] {
    if (!this.enemy) return []
    return this.enemy.originalData?.dropTable || []
  }

  /**
   * 添加日志
   */
  private addLog(text: string, type: BattleLogEntry['type'] = 'info'): void {
    const entry: BattleLogEntry = {
      text,
      type,
      timestamp: Date.now(),
      turn: this.turn
    }
    this.logs.push(entry)
    if (this.onLogCallback) {
      this.onLogCallback(entry)
    }
  }

  /**
   * 开始战斗
   */
  start(): void {
    this.isRunning = true
  }

  /**
   * 停止战斗
   */
  stop(): void {
    this.isRunning = false
  }

  /**
   * 获取当前状态
   */
  getState() {
    return {
      turn: this.turn,
      isRunning: this.isRunning,
      player: this.player,
      enemy: this.enemy,
      logs: this.logs
    }
  }

  /**
   * 获取战斗结果
   */
  getResult(): BattleResult | null {
    if (this.isRunning) return null
    
    return {
      victory: this.player!.hp > 0,
      turns: this.turn,
      duration: Date.now() - this.startTime,
      playerDamage: this.player?.damageDealt || 0,
      playerHealing: this.player?.healDone || 0,
      expGained: 0,
      drops: []
    }
  }

  /**
   * 设置回调
   */
  onLog(callback: (log: BattleLogEntry) => void): void {
    this.onLogCallback = callback
  }

  onTurn(callback: (turn: number) => void): void {
    this.onTurnCallback = callback
  }

  onEnd(callback: (result: BattleResult) => void): void {
    this.onEndCallback = callback
  }

  /**
   * 获取玩家
   */
  getPlayer(): BattleUnit | null {
    return this.player
  }

  /**
   * 获取敌人
   */
  getEnemy(): BattleUnit | null {
    return this.enemy
  }
}

/**
 * 创建战斗引擎
 */
export function createBattleEngine(config?: Partial<BattleConfig>): BattleEngine {
  return new BattleEngine(config)
}
