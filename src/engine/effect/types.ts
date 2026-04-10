// ============================================================
// 效果系统类型定义
// 参考万界道友项目的EffectEngine架构
// ============================================================

// 触发时机
export enum EffectTrigger {
  // 属性计算
  ON_STAT_CALC = 'ON_STAT_CALC',

  // 战斗流程
  ON_TURN_START = 'ON_TURN_START',
  ON_TURN_END = 'ON_TURN_END',
  ON_BATTLE_START = 'ON_BATTLE_START',
  ON_BATTLE_END = 'ON_BATTLE_END',

  // 命中相关
  ON_CALC_HIT_RATE = 'ON_CALC_HIT_RATE',
  ON_DODGE = 'ON_DODGE',
  ON_CRITICAL_HIT = 'ON_CRITICAL_HIT',
  ON_BEING_HIT = 'ON_BEING_HIT',

  // 伤害相关
  ON_BEFORE_DAMAGE = 'ON_BEFORE_DAMAGE',
  ON_AFTER_DAMAGE = 'ON_AFTER_DAMAGE',
  ON_SKILL_HIT = 'ON_SKILL_HIT',
  ON_KILL = 'ON_KILL',

  // 系统事件
  ON_HEAL = 'ON_HEAL',
  ON_BREAKTHROUGH = 'ON_BREAKTHROUGH',
}

// 属性修正阶段
export enum StatModifierType {
  BASE = 0,    // 基础值
  FIXED = 1,   // 固定值加成
  PERCENT = 2, // 百分比加成
  FINAL = 3,   // 最终修正
}

// 效果类型
export enum EffectType {
  // 基础效果
  StatModifier = 'StatModifier',
  Damage = 'Damage',
  Heal = 'Heal',
  AddBuff = 'AddBuff',
  RemoveBuff = 'RemoveBuff',
  DotDamage = 'DotDamage',
  Shield = 'Shield',
  LifeSteal = 'LifeSteal',
  ReflectDamage = 'ReflectDamage',
  Critical = 'Critical',
  DamageReduction = 'DamageReduction',
  NoOp = 'NoOp',

  // 伤害增幅
  ElementDamageBonus = 'ElementDamageBonus',
  BonusDamage = 'BonusDamage',
  TrueDamage = 'TrueDamage',
  ExecuteDamage = 'ExecuteDamage',

  // 生存类
  HealAmplify = 'HealAmplify',

  // 控制类
  Dispel = 'Dispel',
}

// 效果上下文
export interface EffectContext {
  source: Entity
  target?: Entity
  trigger: EffectTrigger
  value?: number
  baseValue?: number
  metadata?: Record<string, unknown>
  logs?: string[]
}

// 实体接口
export interface Entity {
  id: string
  name: string
  getAttribute(key: string): number
  setAttribute(key: string, value: number): void
  collectAllEffects(): IEffect[]
}

// 战斗实体接口
export interface BattleEntity extends Entity {
  applyDamage(damage: number): number
  applyHealing(heal: number): number
  hasBuff(buffId: string): boolean
  addBuff(buff: BuffConfig, caster: Entity, turn: number): void
  removeBuff(buffId: string): number
  isAlive(): boolean
  getCurrentHp(): number
  getMaxHp(): number
}

// 效果接口
export interface IEffect {
  id: string
  trigger: EffectTrigger
  priority: number
  shouldTrigger(ctx: EffectContext): boolean
  apply(ctx: EffectContext): void
}

// Buff配置
export interface BuffConfig {
  id: string
  name: string
  description: string
  duration: number
  maxStacks?: number
  tags?: BuffTag[]
  effects?: EffectConfig[]
  onApply?: (ctx: EffectContext) => void
  onRemove?: (ctx: EffectContext) => void
  onTick?: (ctx: EffectContext) => void
}

// Buff标签
export enum BuffTag {
  BUFF = 'buff',
  DEBUFF = 'debuff',
  DOT = 'dot',
  HOT = 'hot',
  CONTROL = 'control',
  SHIELD = 'shield',
}

// 效果配置
export interface EffectConfig {
  type: EffectType
  trigger?: EffectTrigger
  params?: EffectParams
}

// 效果参数联合类型
export type EffectParams =
  | StatModifierParams
  | DamageParams
  | HealParams
  | AddBuffParams
  | DotDamageParams
  | ShieldParams
  | LifeStealParams
  | CriticalParams
  | DamageReductionParams

// 属性修正参数
export interface StatModifierParams {
  stat: string
  modType: StatModifierType
  value: number
}

// 伤害参数
export interface DamageParams {
  multiplier: number
  flatDamage?: number
  canCrit?: boolean
  critRateBonus?: number
  critDamageBonus?: number
  ignoreDefense?: boolean
}

// 治疗参数
export interface HealParams {
  multiplier: number
  flatHeal?: number
  targetSelf?: boolean
}

// 添加Buff参数
export interface AddBuffParams {
  buffId: string
  chance?: number
  durationOverride?: number
  initialStacks?: number
  targetSelf?: boolean
}

// DOT伤害参数
export interface DotDamageParams {
  baseDamage: number
  usesCasterStats?: boolean
}

// 护盾参数
export interface ShieldParams {
  amount: number
  duration?: number
}

// 吸血参数
export interface LifeStealParams {
  stealPercent: number
}

// 暴击参数
export interface CriticalParams {
  critRateBonus?: number
  critDamageBonus?: number
}

// 减伤参数
export interface DamageReductionParams {
  flatReduction?: number
  percentReduction?: number
  maxReduction?: number
}

// 类型守卫
export function isBattleEntity(entity: Entity): entity is BattleEntity {
  return (
    'applyDamage' in entity &&
    typeof entity.applyDamage === 'function' &&
    'applyHealing' in entity &&
    typeof entity.applyHealing === 'function'
  )
}
