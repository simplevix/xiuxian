/**
 * 仙途问路 - Engine 层入口
 * 
 * 提供游戏核心系统的统一导出
 * 基于"万界道友"项目的架构设计
 */

// ==================== Effect Engine ====================
export { EffectEngine, createEffectEngine } from './effect/EffectEngine'
export type {
  Effect,
  EffectType,
  EffectTrigger,
  EffectContext,
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
} from './effect/types'

// ==================== Buff System ====================
export { BuffManager, createBuffManager } from './buff/BuffManager'
export {
  BuffRegistry,
  buffRegistry,
  createBuffInstance,
  DEFAULT_BUFF_TEMPLATES
} from './buff/types'
export type {
  BuffTemplate,
  BuffInstance,
  BuffTag
} from './buff/types'

// ==================== Battle Engine ====================
export { BattleEngine, createBattleEngine } from './battle/BattleEngine'
export type {
  BattleUnit,
  BattleSkill,
  BattleLogEntry,
  BattleConfig,
  BattleResult
} from './battle/BattleEngine'

// ==================== Cultivation System ====================
export { CultivationEngine, createCultivationEngine } from './cultivation/CultivationEngine'
export {
  BOTTLENECK_TABLE,
  DEMON_TABLE,
  calculateInsightMax,
  calculateInsightRate,
  calculateBreakthroughChance,
  generateDemon,
  calculateDemonDefeatChance
} from './cultivation/types'
export type {
  InsightState,
  BottleneckInfo,
  DemonInfo,
  DemonEffect,
  BreakthroughResult,
  CultivationState
} from './cultivation/types'

// ==================== Equipment System ====================
export { EquipmentEnhancer, createEquipmentEnhancer } from './equipment/EquipmentEnhancer'
export {
  AffixRegistry,
  affixRegistry,
  DEFAULT_AFFIXES,
  SET_BONUSES,
  ENHANCEMENT_LEVELS
} from './equipment/types'
export type {
  EquipmentAffix,
  AffixType,
  EquipmentEffectTemplate,
  SetBonus,
  EnhancementLevel,
  EnhancedEquipment
} from './equipment/types'

// ==================== Skill System ====================
export { SkillManager, createSkillManager } from './skill/SkillManager'
export {
  SkillRegistry,
  skillRegistry,
  DEFAULT_SKILLS
} from './skill/types'
export type {
  SkillDefinition,
  SkillInstance,
  SkillType,
  SkillTargetType,
  SkillCost,
  SkillRequirement,
  SkillLevelData
} from './skill/types'

// ==================== Injury System ====================
export { InjuryManager, createInjuryManager } from './injury/InjuryManager'
export {
  InjuryRegistry,
  injuryRegistry,
  DEFAULT_INJURIES,
  generateInjuryFromCombat,
  generateInjuryFromBreakthrough
} from './injury/types'
export type {
  InjuryDefinition,
  InjuryInstance,
  InjuryType,
  InjurySeverity
} from './injury/types'

// ==================== 游戏系统整合 ====================

import type { Player } from '@/types/game'
import { createBattleEngine } from './battle/BattleEngine'
import { createCultivationEngine } from './cultivation/CultivationEngine'
import { createInjuryManager } from './injury/InjuryManager'
import { createSkillManager } from './skill/SkillManager'
import { createBuffManager } from './buff/BuffManager'
import { createEffectEngine } from './effect/EffectEngine'

/**
 * 玩家游戏系统管理器
 * 整合所有Engine系统到玩家对象
 */
export class PlayerGameSystem {
  private player: Player
  
  // 各子系统
  cultivationEngine = createCultivationEngine()
  injuryManager: ReturnType<typeof createInjuryManager>
  skillManager: ReturnType<typeof createSkillManager>
  buffManager: ReturnType<typeof createBuffManager>
  
  constructor(player: Player) {
    this.player = player
    
    // 初始化伤势管理器
    this.injuryManager = createInjuryManager(player)
    
    // 初始化技能管理器
    this.skillManager = createSkillManager(player)
    
    // 初始化Buff管理器
    this.buffManager = createBuffManager(player)
    
    // 初始化修炼引擎
    this.cultivationEngine.init(
      player.realmIndex,
      player.level,
      player.spiritRoot,
      player.techniques || []
    )
    
    // 绑定回调
    this.setupCallbacks()
  }
  
  private setupCallbacks(): void {
    // 修炼感悟回调
    this.cultivationEngine.onInsight((insight, max) => {
      // 可以在这里触发UI更新
      console.log(`Insight: ${insight}/${max}`)
    })
    
    // 瓶颈回调
    this.cultivationEngine.onBottleneck((bottleneck) => {
      if (bottleneck) {
        console.log(`遇到瓶颈: ${bottleneck.name}`)
      }
    })
    
    // 心魔回调
    this.cultivationEngine.onDemon((demon) => {
      if (demon) {
        console.log(`心魔出现: ${demon.name}`)
      }
    })
    
    // 突破回调
    this.cultivationEngine.onBreakthrough((result) => {
      console.log(result.message)
      
      // 突破失败可能产生伤势
      if (!result.success && result.penalties?.injuryType) {
        this.injuryManager.addInjuryFromBreakthrough(0.5)
      }
    })
    
    // 伤势回调
    this.injuryManager.onInjury((injury) => {
      console.log(`获得伤势: ${injury.name}`)
    })
  }
  
  /**
   * 更新玩家引用（加载存档后）
   */
  updatePlayer(player: Player): void {
    this.player = player
    this.injuryManager = createInjuryManager(player)
    this.skillManager = createSkillManager(player)
    this.buffManager = createBuffManager(player)
    this.setupCallbacks()
  }
  
  /**
   * 开始修炼
   */
  startCultivation(): boolean {
    // 检查伤势是否允许修炼
    const canCultivate = this.injuryManager.canCultivate()
    if (!canCultivate.canDo) {
      console.warn(canCultivate.reason)
      return false
    }
    
    this.cultivationEngine.startCultivation()
    return true
  }
  
  /**
   * 停止修炼
   */
  stopCultivation(): void {
    this.cultivationEngine.stopCultivation()
  }
  
  /**
   * 尝试突破
   */
  attemptBreakthrough(): import('./cultivation/types').BreakthroughResult {
    return this.cultivationEngine.attemptBreakthrough({
      wisdom: this.player.wisdom || 10,
      willpower: this.player.willpower || 10,
      spiritRoot: this.player.spiritRoot,
      realmIndex: this.player.realmIndex,
      level: this.player.level
    })
  }
  
  /**
   * 挑战心魔
   */
  challengeDemon(): { success: boolean; message: string; rewards?: any } {
    return this.cultivationEngine.challengeDemon({
      wisdom: this.player.wisdom || 10,
      willpower: this.player.willpower || 10,
      spiritRoot: this.player.spiritRoot
    })
  }
  
  /**
   * 回合结束处理
   */
  onTurnEnd(): void {
    // 减少技能冷却
    this.skillManager.onTurnEnd()
    
    // Buff回合结束
    this.buffManager.onTurnEnd()
  }
  
  /**
   * 获取伤势信息
   */
  getInjuryInfo() {
    return {
      injuries: this.injuryManager.getAllInjuries(),
      stats: this.injuryManager.getInjuryStats(),
      canBattle: this.injuryManager.canBattle(),
      canCultivate: this.injuryManager.canCultivate()
    }
  }
  
  /**
   * 获取修炼信息
   */
  getCultivationInfo() {
    return {
      state: this.cultivationEngine.getState(),
      insight: this.cultivationEngine.getInsight(),
      bottleneck: this.cultivationEngine.getBottleneck(),
      demon: this.cultivationEngine.getDemon()
    }
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.cultivationEngine.stopCultivation()
    this.injuryManager.stop()
  }
}

/**
 * 创建玩家游戏系统
 */
export function createPlayerGameSystem(player: Player): PlayerGameSystem {
  return new PlayerGameSystem(player)
}

// ==================== 版本信息 ====================
export const ENGINE_VERSION = '1.0.0'
export const ENGINE_NAME = '仙途问路 Engine'
