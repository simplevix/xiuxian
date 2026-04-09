import type { Equipment, QualityId, EquipmentType } from '@/types/game'
import { SET_CONFIGS, SET_EQUIPMENT_TEMPLATES, REALMS } from '@/types/game'

export const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

// 套装装备生成概率（相对于普通装备）
const SET_EQUIPMENT_CHANCE = 0.08 // 8% 概率生成套装装备

export function generateEquipment(type: EquipmentType, quality?: QualityId, playerLevel?: number): Equipment {
  // 品质概率分布
  if (!quality) {
    const rand = Math.random()
    if (rand < 0.01) quality = 'legendary'
    else if (rand < 0.05) quality = 'epic'
    else if (rand < 0.20) quality = 'rare'
    else if (rand < 0.50) quality = 'good'
    else quality = 'common'
  }

  // 检查是否生成套装装备
  const isSetEquipment = type !== 'ring' && chance(SET_EQUIPMENT_CHANCE)
  
  if (isSetEquipment) {
    return generateSetEquipment(type, quality, playerLevel)
  }
  
  return generateNormalEquipment(type, quality)
}

// 生成普通装备
function generateNormalEquipment(type: EquipmentType, quality: QualityId): Equipment {
  const multipliers = { common: 1, good: 1.5, rare: 2, epic: 3, legendary: 5 }
  const m = multipliers[quality]

  // 装备基础属性（随品质缩放）
  const baseAttackMap: Record<string, number> = { weapon: 20, ring: 8, necklace: 10 }
  const baseDefenseMap: Record<string, number> = { armor: 15, helmet: 10, boots: 8, pants: 12 }
  const baseHpMap: Record<string, number> = { armor: 50, necklace: 30, ring: 20, pants: 35 }
  
  const baseAttack = baseAttackMap[type] || 5
  const baseDefense = baseDefenseMap[type] || 3
  const baseHp = baseHpMap[type] || 15

  // 随机上下浮动20%
  const rand = () => 0.8 + Math.random() * 0.4

  return {
    id: generateId(),
    name: generateEquipName(type, quality),
    type,
    quality,
    attackBonus: Math.floor(baseAttack * m * rand()),
    defenseBonus: Math.floor(baseDefense * m * rand()),
    hpBonus: Math.floor(baseHp * m * rand())
  }
}

// 生成套装装备
function generateSetEquipment(type: EquipmentType, quality: QualityId, playerLevel?: number): Equipment {
  // 根据玩家等级选择合适的套装
  const level = playerLevel || 1
  const realmIndex = Math.min(Math.floor((level - 1) / 10), REALMS.length - 1)
  
  // 获取适合当前境界的套装（可能当前境界或低1-2个境界的套装）
  const possibleSets: typeof SET_CONFIGS = []
  for (let i = Math.max(0, realmIndex - 1); i <= realmIndex; i++) {
    const setConfig = SET_CONFIGS[i]
    if (setConfig) possibleSets.push(setConfig)
  }
  
  const setConfig = possibleSets[Math.floor(Math.random() * possibleSets.length)]
  if (!setConfig) {
    // 如果没有合适的套装，回退到普通装备
    return generateNormalEquipment(type, quality)
  }
  
  // 获取该套装对应槽位的装备模板
  const templates = SET_EQUIPMENT_TEMPLATES[setConfig.id]
  if (!templates) {
    return generateNormalEquipment(type, quality)
  }
  
  // 找到匹配槽位的模板
  const slotTemplate = templates.find(t => t.type === type)
  if (!slotTemplate) {
    return generateNormalEquipment(type, quality)
  }
  
  // 套装装备属性基于套装配置的属性
  const multipliers = { common: 1, good: 1.5, rare: 2, epic: 3, legendary: 5 }
  const m = multipliers[quality]
  const levelBonus = 1 + (realmIndex * 0.2) // 境界越高，属性加成越高
  
  const rand = () => 0.85 + Math.random() * 0.3 // 套装装备波动更小

  return {
    id: generateId(),
    name: `${setConfig.prefix}${slotTemplate.name.replace(setConfig.prefix, '')}`,
    type,
    quality,
    setId: setConfig.id,
    setPieceIndex: slotTemplate.slotIndex,
    attackBonus: Math.floor(setConfig.baseAttack * m * levelBonus * rand()),
    defenseBonus: Math.floor(setConfig.baseDefense * m * levelBonus * rand()),
    hpBonus: Math.floor(setConfig.baseHp * m * levelBonus * rand())
  }
}

function generateEquipName(type: EquipmentType, quality: QualityId): string {
  const prefixes: Record<QualityId, string[]> = {
    common: ['铁', '木', '铜', '石', '皮'],
    good: ['精钢', '玄木', '白银', '玉石', '兽皮'],
    rare: ['灵', '玄', '紫', '碧', '青'],
    epic: ['天罡', '地煞', '日月', '星河', '云霄'],
    legendary: ['太初', '混沌', '鸿蒙', '九天', '乾坤']
  }

  const names: Record<string, string[]> = {
    weapon: ['剑', '刀', '戟', '杖', '斧'],
    armor: ['甲', '衣', '铠', '袍', '衫'],
    helmet: ['冠', '盔', '帽', '巾', '笠'],
    pants: ['裤', '裳', '裙', '袍', '带'],
    boots: ['靴', '履', '鞋', '屐', '袜'],
    necklace: ['链', '坠', '珠', '环', '佩'],
    ring: ['戒', '环', '镯', '铃', '符']
  }

  const pre = prefixes[quality][Math.floor(Math.random() * prefixes[quality].length)]
  const suf = (names[type] || names.ring)[Math.floor(Math.random() * (names[type] || names.ring).length)]
  return `${pre}${suf}`
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function chance(probability: number): boolean {
  return Math.random() < probability
}
