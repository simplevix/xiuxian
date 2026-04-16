/**
 * 掉落物品CSV数据加载器
 *
 * CSV文件位于 /data/drops/
 * - pet_drops.csv      : 宠物掉落配置
 * - artifact_drops.csv : 法宝掉落配置
 * - technique_drops.csv: 功法掉落配置
 *
 * 使用 Vite 的 ?raw 导入机制在构建时内联CSV文本，无需运行时 IO。
 */

// Vite raw 导入
import petDropsRaw from '../../data/drops/pet_drops.csv?raw'
import artifactDropsRaw from '../../data/drops/artifact_drops.csv?raw'
import techniqueDropsRaw from '../../data/drops/technique_drops.csv?raw'

import type { Pet, Artifact, Technique, TechniqueEffect } from '@/types/game'

// ==================== CSV 解析工具 ====================

/** 将 CSV 文本解析为对象数组（支持中文，忽略空行和注释） */
function parseCsv(raw: string): Record<string, string>[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#'))
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim())
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

// ==================== 宠物掉落加载 ====================

export interface PetDropConfig {
  id: string
  name: string
  level: number
  attack: number
  defense: number
  ability: string
  dropChance: number
  dropSource: string
  sourceLevel: number
  sourceScene: string
}

/** 从 CSV 加载宠物掉落配置 */
export function loadPetDrops(): PetDropConfig[] {
  const rows = parseCsv(petDropsRaw)
  return rows.map(row => ({
    id: row['id'],
    name: row['name'],
    level: Number(row['level']),
    attack: Number(row['attack']),
    defense: Number(row['defense']),
    ability: row['ability'],
    dropChance: Number(row['dropChance']),
    dropSource: row['dropSource'],
    sourceLevel: Number(row['sourceLevel']),
    sourceScene: row['sourceScene'],
  }))
}

/** 根据ID获取宠物模板 */
export function getPetTemplateById(id: string): Omit<Pet, 'id' | 'spirit' | 'maxSpirit' | 'exp' | 'maxExp' | 'loyalty' | 'grade'> | null {
  const drops = loadPetDrops()
  const config = drops.find(d => d.id === id)
  if (!config) return null
  return {
    name: config.name,
    level: config.level,
    attack: config.attack,
    defense: config.defense,
    ability: config.ability,
  }
}

/** 根据场景获取可掉落的宠物 */
export function getPetDropsByScene(scene: string): PetDropConfig[] {
  const drops = loadPetDrops()
  return drops.filter(d => d.sourceScene === scene)
}

// ==================== 法宝掉落加载 ====================

export interface ArtifactDropConfig {
  id: string
  name: string
  quality: string
  level: number
  attackBonus: number
  defenseBonus: number
  hpBonus: number
  skillName: string
  skillDescription: string
  skillType: string
  skillValue: number
  skillCooldown: number
  dropChance: number
  dropSource: string
  sourceLevel: number
  sourceScene: string
}

/** 从 CSV 加载法宝掉落配置 */
export function loadArtifactDrops(): ArtifactDropConfig[] {
  const rows = parseCsv(artifactDropsRaw)
  return rows.map(row => ({
    id: row['id'],
    name: row['name'],
    quality: row['quality'],
    level: Number(row['level']),
    attackBonus: Number(row['attackBonus']),
    defenseBonus: Number(row['defenseBonus']),
    hpBonus: Number(row['hpBonus']),
    skillName: row['skillName'],
    skillDescription: row['skillDescription'],
    skillType: row['skillType'],
    skillValue: Number(row['skillValue']),
    skillCooldown: Number(row['skillCooldown']),
    dropChance: Number(row['dropChance']),
    dropSource: row['dropSource'],
    sourceLevel: Number(row['sourceLevel']),
    sourceScene: row['sourceScene'],
  }))
}

/** 根据ID获取法宝模板 */
export function getArtifactTemplateById(id: string): Omit<Artifact, 'id'> | null {
  const drops = loadArtifactDrops()
  const config = drops.find(d => d.id === id)
  if (!config) return null
  return {
    name: config.name,
    quality: config.quality as Artifact['quality'],
    level: config.level,
    attackBonus: config.attackBonus,
    defenseBonus: config.defenseBonus,
    hpBonus: config.hpBonus,
    skill: {
      id: `skill_${config.id}`,
      name: config.skillName,
      description: config.skillDescription,
      type: config.skillType as Artifact['skill']['type'],
      value: config.skillValue,
      cooldown: config.skillCooldown,
    },
    skillLevel: 1,
  }
}

/** 根据场景获取可掉落的法宝 */
export function getArtifactDropsByScene(scene: string): ArtifactDropConfig[] {
  const drops = loadArtifactDrops()
  return drops.filter(d => d.sourceScene === scene)
}

// ==================== 功法掉落加载 ====================

export interface TechniqueDropConfig {
  id: string
  name: string
  quality: string
  level: number
  category: string
  realmRequirement: number
  description: string
  effects: string
  dropChance: number
  dropSource: string
  sourceLevel: string
  sourceScene: string
}

/** 从 CSV 加载功法掉落配置 */
export function loadTechniqueDrops(): TechniqueDropConfig[] {
  const rows = parseCsv(techniqueDropsRaw)
  return rows.map(row => ({
    id: row['id'],
    name: row['name'],
    quality: row['quality'],
    level: Number(row['level']),
    category: row['category'],
    realmRequirement: Number(row['realmRequirement']),
    description: row['description'],
    effects: row['effects'],
    dropChance: Number(row['dropChance']),
    dropSource: row['dropSource'],
    sourceLevel: row['sourceLevel'],
    sourceScene: row['sourceScene'],
  }))
}

/** 解析功法效果字符串 */
function parseTechniqueEffects(effectsStr: string): TechniqueEffect[] {
  const effects: TechniqueEffect[] = []
  const pairs = effectsStr.split(';')
  for (const pair of pairs) {
    const [type, valueStr] = pair.split(':')
    if (type && valueStr) {
      const value = parseFloat(valueStr)
      let description = ''
      switch (type) {
        case 'attackBonus': description = `攻击力+${value}`; break
        case 'defenseBonus': description = `防御力+${value}`; break
        case 'hpBonus': description = `生命上限+${value}`; break
        case 'critRate': description = `暴击率+${value}%`; break
        case 'critDamage': description = `暴击伤害+${value}%`; break
        case 'dodgeRate': description = `闪避率+${value}%`; break
        case 'lifesteal': description = `吸血+${value}%`; break
        case 'spiritPerSec': description = `灵气+${value}/s`; break
        case 'damageReduction': description = `伤害减免+${value}%`; break
        case 'reflectDamage': description = `反弹伤害+${value}%`; break
        case 'regenPerSec': description = `每秒回复+${value}`; break
        default: description = `${type}+${value}`
      }
      effects.push({ type: type as TechniqueEffect['type'], value, description })
    }
  }
  return effects
}

/** 根据ID获取功法模板 */
export function getTechniqueTemplateById(id: string): Omit<Technique, 'id'> | null {
  const drops = loadTechniqueDrops()
  const config = drops.find(d => d.id === id)
  if (!config) return null
  return {
    name: config.name,
    quality: config.quality as Technique['quality'],
    level: config.level,
    category: config.category as Technique['category'],
    realmRequirement: config.realmRequirement,
    description: config.description,
    effects: parseTechniqueEffects(config.effects),
  }
}

/** 根据场景获取可掉落的功法 */
export function getTechniqueDropsByScene(scene: string): TechniqueDropConfig[] {
  const drops = loadTechniqueDrops()
  return drops.filter(d => d.sourceScene === scene)
}

/** 根据境界获取可掉落的功法 */
export function getTechniqueDropsByRealm(realmIndex: number): TechniqueDropConfig[] {
  const drops = loadTechniqueDrops()
  return drops.filter(d => d.realmRequirement <= realmIndex)
}

// ==================== 单例缓存（避免重复解析） ====================

let _petDrops: PetDropConfig[] | null = null
let _artifactDrops: ArtifactDropConfig[] | null = null
let _techniqueDrops: TechniqueDropConfig[] | null = null

export function getPetDrops(): PetDropConfig[] {
  if (!_petDrops) _petDrops = loadPetDrops()
  return _petDrops
}

export function getArtifactDrops(): ArtifactDropConfig[] {
  if (!_artifactDrops) _artifactDrops = loadArtifactDrops()
  return _artifactDrops
}

export function getTechniqueDrops(): TechniqueDropConfig[] {
  if (!_techniqueDrops) _techniqueDrops = loadTechniqueDrops()
  return _techniqueDrops
}

// ==================== 导出所有掉落数据 ====================

export interface AllDropData {
  pets: PetDropConfig[]
  artifacts: ArtifactDropConfig[]
  techniques: TechniqueDropConfig[]
}

export function getAllDrops(): AllDropData {
  return {
    pets: getPetDrops(),
    artifacts: getArtifactDrops(),
    techniques: getTechniqueDrops(),
  }
}
