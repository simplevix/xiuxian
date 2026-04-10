import type { EquipmentAffix, EnhancementLevel, SetBonus } from './types'
import { affixRegistry, SET_BONUSES } from './types'

/**
 * 增强后的装备数据
 */
export interface EnhancedEquipment {
  id: string
  name: string
  slot: string
  quality: string
  level: number
  
  // 基础属性
  baseAttack?: number
  baseDefense?: number
  baseHp?: number
  
  // 词缀
  affixes: EquipmentAffix[]
  
  // 强化等级
  enhancementLevel: number
  enhancementName?: string
  
  // 套装
  setId?: string
  setName?: string
  
  // 计算后的总属性
  totalStats: Record<string, number>
  
  // 触发效果
  triggers: {
    trigger: string
    chance: number
    effects: any[]
  }[]
}

/**
 * 装备强化定义
 */
export const ENHANCEMENT_LEVELS: EnhancementLevel[] = [
  { level: 0, name: '普通', statMultiplier: 1.0, extraAffixSlots: 0, successRate: 1.0, requiredMaterials: [] },
  { level: 1, name: '+1', statMultiplier: 1.1, extraAffixSlots: 0, successRate: 1.0, requiredMaterials: [{ itemId: 'enhancement_stone', count: 1 }] },
  { level: 2, name: '+2', statMultiplier: 1.2, extraAffixSlots: 0, successRate: 0.95, requiredMaterials: [{ itemId: 'enhancement_stone', count: 2 }] },
  { level: 3, name: '+3', statMultiplier: 1.3, extraAffixSlots: 0, successRate: 0.9, requiredMaterials: [{ itemId: 'enhancement_stone', count: 3 }] },
  { level: 4, name: '+4', statMultiplier: 1.4, extraAffixSlots: 0, successRate: 0.85, requiredMaterials: [{ itemId: 'enhancement_stone', count: 4 }] },
  { level: 5, name: '+5', statMultiplier: 1.5, extraAffixSlots: 1, successRate: 0.8, requiredMaterials: [{ itemId: 'enhancement_stone', count: 5 }, { itemId: 'magic_crystal', count: 1 }] },
  { level: 6, name: '+6', statMultiplier: 1.65, extraAffixSlots: 1, successRate: 0.75, requiredMaterials: [{ itemId: 'enhancement_stone', count: 6 }, { itemId: 'magic_crystal', count: 2 }] },
  { level: 7, name: '+7', statMultiplier: 1.8, extraAffixSlots: 1, successRate: 0.7, requiredMaterials: [{ itemId: 'enhancement_stone', count: 7 }, { itemId: 'magic_crystal', count: 3 }] },
  { level: 8, name: '+8', statMultiplier: 2.0, extraAffixSlots: 1, successRate: 0.6, requiredMaterials: [{ itemId: 'enhancement_stone', count: 8 }, { itemId: 'magic_crystal', count: 5 }] },
  { level: 9, name: '+9', statMultiplier: 2.2, extraAffixSlots: 2, successRate: 0.5, requiredMaterials: [{ itemId: 'enhancement_stone', count: 10 }, { itemId: 'magic_crystal', count: 8 }, { itemId: 'legendary_essence', count: 1 }], failurePenalty: { levelDrop: true, destroyChance: 0.0 } },
  { level: 10, name: '+10', statMultiplier: 2.5, extraAffixSlots: 2, successRate: 0.4, requiredMaterials: [{ itemId: 'enhancement_stone', count: 15 }, { itemId: 'magic_crystal', count: 12 }, { itemId: 'legendary_essence', count: 2 }], failurePenalty: { levelDrop: true, destroyChance: 0.05 } },
  { level: 11, name: '★', statMultiplier: 2.8, extraAffixSlots: 2, successRate: 0.3, requiredMaterials: [{ itemId: 'enhancement_stone', count: 20 }, { itemId: 'magic_crystal', count: 15 }, { itemId: 'legendary_essence', count: 3 }], failurePenalty: { levelDrop: true, destroyChance: 0.1 } },
  { level: 12, name: '★★', statMultiplier: 3.2, extraAffixSlots: 3, successRate: 0.2, requiredMaterials: [{ itemId: 'enhancement_stone', count: 30 }, { itemId: 'magic_crystal', count: 20 }, { itemId: 'legendary_essence', count: 5 }], failurePenalty: { levelDrop: true, destroyChance: 0.15 } }
]

/**
 * 装备强化器
 */
export class EquipmentEnhancer {
  /**
   * 计算装备总属性
   */
  calculateTotalStats(equipment: EnhancedEquipment): Record<string, number> {
    const stats: Record<string, number> = {}
    
    // 基础属性乘以强化倍率
    const enhancement = ENHANCEMENT_LEVELS[equipment.enhancementLevel] || ENHANCEMENT_LEVELS[0]
    const multiplier = enhancement.statMultiplier
    
    if (equipment.baseAttack) {
      stats.attack = Math.floor(equipment.baseAttack * multiplier)
    }
    if (equipment.baseDefense) {
      stats.defense = Math.floor(equipment.baseDefense * multiplier)
    }
    if (equipment.baseHp) {
      stats.maxHp = Math.floor(equipment.baseHp * multiplier)
    }
    
    // 词缀属性
    for (const affix of equipment.affixes) {
      if (affix.stats) {
        for (const stat of affix.stats) {
          const currentValue = stats[stat.stat] || 0
          switch (stat.operation) {
            case 'Add':
              stats[stat.stat] = currentValue + stat.value
              break
            case 'Multiply':
              stats[stat.stat] = currentValue * stat.value
              break
            case 'AddPercent':
              // 百分比加成基于基础值
              const baseValue = stats[stat.stat] || 0
              stats[stat.stat] = baseValue * (1 + stat.value)
              break
          }
        }
      }
    }
    
    return stats
  }

  /**
   * 收集装备的触发效果
   */
  collectTriggers(equipment: EnhancedEquipment): { trigger: string; chance: number; effects: any[] }[] {
    const triggers: { trigger: string; chance: number; effects: any[] }[] = []
    
    for (const affix of equipment.affixes) {
      if (affix.triggers) {
        for (const trigger of affix.triggers) {
          triggers.push({
            trigger: trigger.trigger,
            chance: trigger.chance,
            effects: trigger.effects
          })
        }
      }
    }
    
    return triggers
  }

  /**
   * 尝试强化装备
   */
  attemptEnhancement(equipment: EnhancedEquipment): {
    success: boolean
    destroyed: boolean
    newLevel: number
    message: string
  } {
    const currentLevel = equipment.enhancementLevel
    const nextLevel = ENHANCEMENT_LEVELS[currentLevel + 1]
    
    if (!nextLevel) {
      return {
        success: false,
        destroyed: false,
        newLevel: currentLevel,
        message: '已达到最高强化等级'
      }
    }
    
    const roll = Math.random()
    const success = roll < nextLevel.successRate
    
    if (success) {
      equipment.enhancementLevel = nextLevel.level
      equipment.enhancementName = nextLevel.name
      
      // 重新计算属性
      equipment.totalStats = this.calculateTotalStats(equipment)
      
      return {
        success: true,
        destroyed: false,
        newLevel: nextLevel.level,
        message: `强化成功！装备提升至 ${nextLevel.name}`
      }
    } else {
      // 失败处理
      if (nextLevel.failurePenalty) {
        const destroyRoll = Math.random()
        if (destroyRoll < nextLevel.failurePenalty.destroyChance) {
          return {
            success: false,
            destroyed: true,
            newLevel: currentLevel,
            message: '强化失败！装备已损坏'
          }
        }
        
        if (nextLevel.failurePenalty.levelDrop) {
          const newLevel = Math.max(0, currentLevel - 1)
          equipment.enhancementLevel = newLevel
          equipment.enhancementName = ENHANCEMENT_LEVELS[newLevel].name
          
          return {
            success: false,
            destroyed: false,
            newLevel,
            message: `强化失败！装备等级下降至 ${ENHANCEMENT_LEVELS[newLevel].name}`
          }
        }
      }
      
      return {
        success: false,
        destroyed: false,
        newLevel: currentLevel,
        message: '强化失败！装备等级不变'
      }
    }
  }

  /**
   * 添加词缀到装备
   */
  addAffix(equipment: EnhancedEquipment, affixId: string): boolean {
    const affix = affixRegistry.get(affixId)
    if (!affix) return false
    
    // 检查是否已存在同类型词缀
    const existingSameType = equipment.affixes.find(a => a.type === affix.type && a.id === affix.id)
    if (existingSameType) return false
    
    equipment.affixes.push(affix)
    
    // 重新计算属性
    equipment.totalStats = this.calculateTotalStats(equipment)
    equipment.triggers = this.collectTriggers(equipment)
    
    return true
  }

  /**
   * 移除装备词缀
   */
  removeAffix(equipment: EnhancedEquipment, affixId: string): boolean {
    const index = equipment.affixes.findIndex(a => a.id === affixId)
    if (index < 0) return false
    
    equipment.affixes.splice(index, 1)
    
    // 重新计算属性
    equipment.totalStats = this.calculateTotalStats(equipment)
    equipment.triggers = this.collectTriggers(equipment)
    
    return true
  }

  /**
   * 为装备生成随机词缀
   */
  generateRandomAffixes(
    equipment: EnhancedEquipment,
    prefixCount: number = 1,
    suffixCount: number = 1
  ): void {
    equipment.affixes = []
    
    // 添加固有词缀
    const implicitAffix = affixRegistry.getRandomForSlot(
      equipment.slot,
      equipment.quality,
      equipment.level,
      'implicit'
    )
    if (implicitAffix) {
      equipment.affixes.push(implicitAffix)
    }
    
    // 添加前缀
    for (let i = 0; i < prefixCount; i++) {
      const prefix = affixRegistry.getRandomForSlot(
        equipment.slot,
        equipment.quality,
        equipment.level,
        'prefix'
      )
      if (prefix && !equipment.affixes.find(a => a.id === prefix.id)) {
        equipment.affixes.push(prefix)
      }
    }
    
    // 添加后缀
    for (let i = 0; i < suffixCount; i++) {
      const suffix = affixRegistry.getRandomForSlot(
        equipment.slot,
        equipment.quality,
        equipment.level,
        'suffix'
      )
      if (suffix && !equipment.affixes.find(a => a.id === suffix.id)) {
        equipment.affixes.push(suffix)
      }
    }
    
    // 计算总属性
    equipment.totalStats = this.calculateTotalStats(equipment)
    equipment.triggers = this.collectTriggers(equipment)
  }

  /**
   * 计算套装效果
   */
  calculateSetBonus(equippedItems: EnhancedEquipment[]): {
    activeBonuses: { setId: string; pieces: number; description: string }[]
    totalStats: Record<string, number>
  } {
    const setCounts: Record<string, number> = {}
    
    // 统计套装件数
    for (const item of equippedItems) {
      if (item.setId) {
        setCounts[item.setId] = (setCounts[item.setId] || 0) + 1
      }
    }
    
    const activeBonuses: { setId: string; pieces: number; description: string }[] = []
    const totalStats: Record<string, number> = {}
    
    // 计算激活的套装效果
    for (const [setId, count] of Object.entries(setCounts)) {
      const setBonus = SET_BONUSES.find(s => s.setId === setId)
      if (!setBonus) continue
      
      if (count >= 2 && setBonus.bonus2) {
        activeBonuses.push({
          setId,
          pieces: 2,
          description: setBonus.bonus2.description
        })
        
        if (setBonus.bonus2.stats) {
          for (const stat of setBonus.bonus2.stats) {
            totalStats[stat.stat] = (totalStats[stat.stat] || 0) + stat.value
          }
        }
      }
      
      if (count >= 4 && setBonus.bonus4) {
        activeBonuses.push({
          setId,
          pieces: 4,
          description: setBonus.bonus4.description
        })
        
        if (setBonus.bonus4.stats) {
          for (const stat of setBonus.bonus4.stats) {
            totalStats[stat.stat] = (totalStats[stat.stat] || 0) + stat.value
          }
        }
      }
      
      if (count >= 6 && setBonus.bonus6) {
        activeBonuses.push({
          setId,
          pieces: 6,
          description: setBonus.bonus6.description
        })
        
        if (setBonus.bonus6.stats) {
          for (const stat of setBonus.bonus6.stats) {
            totalStats[stat.stat] = (totalStats[stat.stat] || 0) + stat.value
          }
        }
      }
    }
    
    return { activeBonuses, totalStats }
  }

  /**
   * 获取强化所需材料
   */
  getEnhancementMaterials(level: number): { itemId: string; count: number }[] {
    const enhancement = ENHANCEMENT_LEVELS[level]
    if (!enhancement) return []
    return enhancement.requiredMaterials
  }

  /**
   * 获取强化成功率
   */
  getEnhancementSuccessRate(level: number): number {
    const enhancement = ENHANCEMENT_LEVELS[level]
    if (!enhancement) return 0
    return enhancement.successRate
  }
}

/**
 * 创建装备强化器
 */
export function createEquipmentEnhancer(): EquipmentEnhancer {
  return new EquipmentEnhancer()
}
