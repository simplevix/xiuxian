/**
 * 装备CSV数据加载器
 *
 * CSV文件位于 /data/equipment/
 * - set_configs.csv   : 套装主配置（10套装）
 * - set_bonuses.csv   : 套装效果（每套装3档）
 * - set_items.csv     : 套装装备模板（每套装6件）
 * - special_items.csv : 仙器/神话/太古品质特殊装备
 * - equipment_pools.csv: 装备掉落池（按品质+类型定义装备名）
 *
 * 使用 Vite 的 ?raw 导入机制在构建时内联CSV文本，无需运行时 IO。
 */

// Vite raw 导入
import setConfigsRaw from '../../data/equipment/set_configs.csv?raw'
import setBonusesRaw from '../../data/equipment/set_bonuses.csv?raw'
import setItemsRaw from '../../data/equipment/set_items.csv?raw'
import specialItemsRaw from '../../data/equipment/special_items.csv?raw'
import equipmentPoolsRaw from '../../data/equipment/equipment_pools.csv?raw'

import type { SetConfig, SetBonus, EquipmentType, QualityId } from '@/types/game'
import type { Equipment } from '@/types/game'

// ==================== CSV 解析工具 ====================

/** 将 CSV 文本解析为对象数组（支持中文，忽略空行） */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

// ==================== 套装配置加载 ====================

/** 从 CSV 加载 SET_CONFIGS */
export function loadSetConfigs(): SetConfig[] {
  const bonusRows = parseCsv(setBonusesRaw)
  const configRows = parseCsv(setConfigsRaw)

  // 先按 setId 分组 bonuses
  const bonusMap: Record<string, SetBonus[]> = {}
  for (const row of bonusRows) {
    const setId = row['setId']
    if (!bonusMap[setId]) bonusMap[setId] = []
    bonusMap[setId].push({
      pieces: Number(row['pieces']),
      name: row['name'],
      description: row['description'],
      attackPercent: Number(row['attackPercent']),
      defensePercent: Number(row['defensePercent']),
      hpPercent: Number(row['hpPercent']),
      critRate: Number(row['critRate']),
      spiritPerSec: Number(row['spiritPerSec']),
      lifesteal: Number(row['lifesteal']),
    })
  }

  return configRows.map(row => ({
    id: row['id'],
    name: row['name'],
    prefix: row['prefix'],
    color: row['color'],
    description: row['description'],
    realmIndex: Number(row['realmIndex']),
    minLevel: Number(row['minLevel']),
    baseAttack: Number(row['baseAttack']),
    baseDefense: Number(row['baseDefense']),
    baseHp: Number(row['baseHp']),
    bonuses: bonusMap[row['id']] || [],
  }))
}

// ==================== 套装装备模板加载 ====================

/** 从 CSV 加载 SET_EQUIPMENT_TEMPLATES */
export function loadSetEquipmentTemplates(): Record<string, { name: string; type: EquipmentType; slotIndex: number }[]> {
  const rows = parseCsv(setItemsRaw)
  const result: Record<string, { name: string; type: EquipmentType; slotIndex: number }[]> = {}
  for (const row of rows) {
    const setId = row['setId']
    if (!result[setId]) result[setId] = []
    result[setId].push({
      name: row['name'],
      type: row['type'] as EquipmentType,
      slotIndex: Number(row['slotIndex']),
    })
  }
  return result
}

// ==================== 特殊装备加载 ====================

/** 从 CSV 加载仙器/神话/太古品质装备，返回三个列表 */
export function loadSpecialItems(): {
  legendaryItems: Omit<Equipment, 'id'>[]
  divineItems: Omit<Equipment, 'id'>[]
  primordialItems: Omit<Equipment, 'id'>[]
} {
  const rows = parseCsv(specialItemsRaw)
  const legendaryItems: Omit<Equipment, 'id'>[] = []
  const divineItems: Omit<Equipment, 'id'>[] = []
  const primordialItems: Omit<Equipment, 'id'>[] = []

  for (const row of rows) {
    const item: Omit<Equipment, 'id'> = {
      name: row['name'],
      type: row['type'] as EquipmentType,
      quality: row['quality'] as Equipment['quality'],
      attackBonus: Number(row['attackBonus']),
      defenseBonus: Number(row['defenseBonus']),
      hpBonus: Number(row['hpBonus']),
    }
    if (row['quality'] === 'legendary') legendaryItems.push(item)
    else if (row['quality'] === 'divine') divineItems.push(item)
    else if (row['quality'] === 'primordial') primordialItems.push(item)
  }

  return { legendaryItems, divineItems, primordialItems }
}

// ==================== 单例缓存（避免重复解析） ====================

let _setConfigs: SetConfig[] | null = null
let _setEquipmentTemplates: Record<string, { name: string; type: EquipmentType; slotIndex: number }[]> | null = null
let _specialItems: ReturnType<typeof loadSpecialItems> | null = null

export function getSetConfigs(): SetConfig[] {
  if (!_setConfigs) _setConfigs = loadSetConfigs()
  return _setConfigs
}

export function getSetEquipmentTemplates(): Record<string, { name: string; type: EquipmentType; slotIndex: number }[]> {
  if (!_setEquipmentTemplates) _setEquipmentTemplates = loadSetEquipmentTemplates()
  return _setEquipmentTemplates
}

export function getSpecialItems(): ReturnType<typeof loadSpecialItems> {
  if (!_specialItems) _specialItems = loadSpecialItems()
  return _specialItems
}

// ==================== 装备掉落池加载 ====================

/** 装备掉落池项 */
export interface EquipmentPoolEntry {
  quality: QualityId
  type: EquipmentType
  names: string[]
}

/** 加载装备掉落池 */
export function loadEquipmentPools(): Record<string, Record<string, string[]>> {
  const rows = parseCsv(equipmentPoolsRaw)
  const pools: Record<string, Record<string, string[]>> = {}

  for (const row of rows) {
    const quality = row['quality'] as QualityId
    const type = row['type'] as EquipmentType
    if (!quality || !type) continue

    if (!pools[quality]) pools[quality] = {}
    // 动态收集所有非 quality/type 的列作为装备名
    const names = Object.entries(row)
      .filter(([key]) => key !== 'quality' && key !== 'type')
      .map(([, value]) => value.trim())
      .filter(v => v.length > 0)
    pools[quality][type] = names
  }

  return pools
}

let _equipmentPools: Record<string, Record<string, string[]>> | null = null

export function getEquipmentPools(): Record<string, Record<string, string[]>> {
  if (!_equipmentPools) _equipmentPools = loadEquipmentPools()
  return _equipmentPools
}

/** 从掉落池随机获取装备名 */
export function getRandomEquipNameFromPool(quality: QualityId, type: EquipmentType): string {
  const pools = getEquipmentPools()
  const qualityPools = pools[quality]
  if (!qualityPools) {
    // 降级到随机前缀
    return generateFallbackName(type, quality)
  }
  const names = qualityPools[type]
  if (!names || names.length === 0) {
    return generateFallbackName(type, quality)
  }
  return names[Math.floor(Math.random() * names.length)]
}

/** 备用装备名生成（当CSV池为空时） */
function generateFallbackName(type: EquipmentType, quality: QualityId): string {
  const prefixes: Record<string, string[]> = {
    common: ['铁', '木', '铜', '石', '皮'],
    good: ['精钢', '玄木', '白银', '玉石', '兽皮'],
    rare: ['灵', '玄', '紫', '碧', '青'],
    epic: ['天罡', '地煞', '日月', '星河', '云霄'],
    legendary: ['太初', '混沌', '鸿蒙', '九天', '乾坤'],
    divine: ['天道', '神罚', '轮回', '命运', '虚空'],
    primordial: ['元始', '永恒', '创世', '万古', '太虚']
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

  const preList = prefixes[quality] || prefixes.common
  const nameList = names[type] || names.ring
  const pre = preList[Math.floor(Math.random() * preList.length)]
  const suf = nameList[Math.floor(Math.random() * nameList.length)]
  return `${pre}${suf}`
}
