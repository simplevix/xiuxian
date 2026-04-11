import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { usePlayerStore } from './player'
import type { Equipment, Pet, Artifact, Technique, EquipmentQuality } from '@/types/game'
import { QUALITIES, REALMS, TECHNIQUE_TEMPLATES } from '@/types/game'
import { generateId } from '@/utils/random'
import { generateEquipment, generatePet, generateArtifact, generateTechniqueByRealm } from '@/utils/generators'

// GM命令类型
export type GMCommandType = 
  | 'addSpiritStones'      // 添加灵石
  | 'addExp'               // 添加经验
  | 'setRealm'             // 设置境界
  | 'setRealmLevel'        // 设置境界层数
  | 'addItem'              // 添加装备
  | 'addPet'               // 添加灵宠
  | 'addArtifact'          // 添加法宝
  | 'addTechnique'         // 添加功法
  | 'setHp'                // 设置生命
  | 'setMaxHp'             // 设置最大生命
  | 'setAttack'            // 设置攻击
  | 'setDefense'           // 设置防御
  | 'setCritRate'          // 设置暴击率
  | 'setCritDamage'        // 设置暴击伤害
  | 'setDodgeRate'         // 设置闪避率
  | 'clearInventory'       // 清空背包
  | 'fullHeal'             // 满血
  | 'resetCooldowns'       // 重置冷却
  | 'unlockAllFormations'  // 解锁所有阵法
  | 'maxFormationNodes'    // 满级所有阵法节点

export interface GMCommand {
  type: GMCommandType
  label: string
  description: string
  icon: string
  params: GMParam[]
}

export interface GMParam {
  name: string
  label: string
  type: 'number' | 'select' | 'text' | 'quality' | 'realm'
  options?: { value: string | number; label: string }[]
  min?: number
  max?: number
  default?: number | string
}

export const useGMStore = defineStore('gm', () => {
  const playerStore = usePlayerStore()
  const isGMMode = ref(false)
  const commandHistory = ref<string[]>([])

  // GM命令定义
  const gmCommands: GMCommand[] = [
    {
      type: 'addSpiritStones',
      label: '添加灵石',
      description: '增加指定数量的灵石',
      icon: 'Money',
      params: [
        { name: 'amount', label: '数量', type: 'number', min: 1, max: 999999999, default: 10000 }
      ]
    },
    {
      type: 'addExp',
      label: '添加经验',
      description: '增加指定数量的境界经验',
      icon: 'Star',
      params: [
        { name: 'amount', label: '数量', type: 'number', min: 1, max: 999999, default: 1000 }
      ]
    },
    {
      type: 'setRealm',
      label: '设置境界',
      description: '直接设置玩家境界',
      icon: 'Trophy',
      params: [
        { 
          name: 'realmIndex', 
          label: '境界', 
          type: 'select',
          options: REALMS.map((r, i) => ({ value: i, label: r.name })),
          default: 0
        }
      ]
    },
    {
      type: 'setRealmLevel',
      label: '设置层数',
      description: '设置当前境界的层数',
      icon: 'ArrowUp',
      params: [
        { name: 'level', label: '层数', type: 'number', min: 0, max: 10, default: 0 }
      ]
    },
    {
      type: 'addItem',
      label: '添加装备',
      description: '生成指定品质的装备',
      icon: 'Box',
      params: [
        { 
          name: 'quality', 
          label: '品质', 
          type: 'select',
          options: [
            { value: 'common', label: '普通' },
            { value: 'good', label: '优秀' },
            { value: 'rare', label: '稀有' },
            { value: 'epic', label: '史诗' },
            { value: 'legendary', label: '仙器' }
          ],
          default: 'epic'
        },
        { name: 'count', label: '数量', type: 'number', min: 1, max: 100, default: 1 }
      ]
    },
    {
      type: 'addPet',
      label: '添加灵宠',
      description: '生成指定品质的灵宠',
      icon: 'Chicken',
      params: [
        { 
          name: 'quality', 
          label: '品质', 
          type: 'select',
          options: [
            { value: 'common', label: '普通' },
            { value: 'good', label: '优秀' },
            { value: 'rare', label: '稀有' },
            { value: 'epic', label: '史诗' },
            { value: 'legendary', label: '传说' }
          ],
          default: 'epic'
        },
        { name: 'count', label: '数量', type: 'number', min: 1, max: 10, default: 1 }
      ]
    },
    {
      type: 'addArtifact',
      label: '添加法宝',
      description: '生成指定品质的法宝',
      icon: 'MagicStick',
      params: [
        { 
          name: 'quality', 
          label: '品质', 
          type: 'select',
          options: [
            { value: 'common', label: '普通' },
            { value: 'good', label: '优秀' },
            { value: 'rare', label: '稀有' },
            { value: 'epic', label: '史诗' },
            { value: 'legendary', label: '传说' }
          ],
          default: 'epic'
        },
        { name: 'count', label: '数量', type: 'number', min: 1, max: 10, default: 1 }
      ]
    },
    {
      type: 'addTechnique',
      label: '添加功法',
      description: '生成指定品质的功法',
      icon: 'Document',
      params: [
        { 
          name: 'quality', 
          label: '品质', 
          type: 'select',
          options: [
            { value: 1, label: '凡品' },
            { value: 2, label: '灵品' },
            { value: 3, label: '玄品' },
            { value: 4, label: '真品' },
            { value: 5, label: '地品' },
            { value: 6, label: '天品' },
            { value: 7, label: '仙品' },
            { value: 8, label: '神品' }
          ],
          default: 5
        },
        { name: 'count', label: '数量', type: 'number', min: 1, max: 10, default: 1 }
      ]
    },
    {
      type: 'setHp',
      label: '设置生命',
      description: '设置当前生命值',
      icon: 'FirstAidKit',
      params: [
        { name: 'value', label: '生命值', type: 'number', min: 1, max: 999999, default: 1000 }
      ]
    },
    {
      type: 'setMaxHp',
      label: '设置最大生命',
      description: '设置最大生命值',
      icon: 'FirstAidKit',
      params: [
        { name: 'value', label: '最大生命', type: 'number', min: 1, max: 999999, default: 1000 }
      ]
    },
    {
      type: 'setAttack',
      label: '设置攻击',
      description: '设置攻击力',
      icon: 'Sword',
      params: [
        { name: 'value', label: '攻击力', type: 'number', min: 1, max: 999999, default: 100 }
      ]
    },
    {
      type: 'setDefense',
      label: '设置防御',
      description: '设置防御力',
      icon: 'Shield',
      params: [
        { name: 'value', label: '防御力', type: 'number', min: 1, max: 999999, default: 50 }
      ]
    },
    {
      type: 'setCritRate',
      label: '设置暴击率',
      description: '设置暴击率 (0-100%)',
      icon: 'Lightning',
      params: [
        { name: 'value', label: '暴击率(%)', type: 'number', min: 0, max: 100, default: 50 }
      ]
    },
    {
      type: 'setCritDamage',
      label: '设置暴击伤害',
      description: '设置暴击伤害倍率',
      icon: 'Lightning',
      params: [
        { name: 'value', label: '暴击伤害', type: 'number', min: 1, max: 10, default: 3 }
      ]
    },
    {
      type: 'setDodgeRate',
      label: '设置闪避率',
      description: '设置闪避率 (0-100%)',
      icon: 'Hide',
      params: [
        { name: 'value', label: '闪避率(%)', type: 'number', min: 0, max: 100, default: 30 }
      ]
    },
    {
      type: 'clearInventory',
      label: '清空背包',
      description: '清空背包中的所有物品',
      icon: 'Delete',
      params: []
    },
    {
      type: 'fullHeal',
      label: '满血复活',
      description: '恢复全部生命值',
      icon: 'FirstAidKit',
      params: []
    },
    {
      type: 'resetCooldowns',
      label: '重置冷却',
      description: '重置所有技能冷却',
      icon: 'Refresh',
      params: []
    },
    {
      type: 'unlockAllFormations',
      label: '解锁阵法',
      description: '解锁所有阵法',
      icon: 'Grid',
      params: []
    },
    {
      type: 'maxFormationNodes',
      label: '满级阵法',
      description: '将所有阵法节点升至满级',
      icon: 'Grid',
      params: []
    }
  ]

  // 执行GM命令
  function executeCommand(command: GMCommand, params: Record<string, any>): { success: boolean; message: string } {
    if (!playerStore.player) {
      return { success: false, message: '玩家数据不存在' }
    }

    const player = playerStore.player
    let message = ''

    try {
      switch (command.type) {
        case 'addSpiritStones':
          player.spiritStones += params.amount
          message = `成功添加 ${params.amount} 灵石`
          break

        case 'addExp':
          playerStore.addExp(params.amount)
          message = `成功添加 ${params.amount} 经验`
          break

        case 'setRealm':
          const oldRealm = player.realmIndex
          player.realmIndex = params.realmIndex
          // 解锁该境界及以下的所有阵法
          for (let i = oldRealm + 1; i <= params.realmIndex; i++) {
            playerStore.unlockFormation(i)
          }
          playerStore.recalcStats()
          message = `境界已设置为 ${REALMS[params.realmIndex].name}`
          break

        case 'setRealmLevel':
          player.realmLevel = Math.min(params.level, REALMS[player.realmIndex].realmLevelCap)
          playerStore.recalcStats()
          message = `境界层数已设置为 ${player.realmLevel}`
          break

        case 'addItem':
          for (let i = 0; i < params.count; i++) {
            const equipment = generateEquipment(player.realmIndex, params.quality as EquipmentQuality)
            player.inventory.push(equipment)
          }
          message = `成功添加 ${params.count} 件${QUALITIES[params.quality].label}装备`
          break

        case 'addPet':
          for (let i = 0; i < params.count; i++) {
            const pet = generatePet(player.realmIndex, params.quality as EquipmentQuality)
            playerStore.addPet(pet)
          }
          message = `成功添加 ${params.count} 只${QUALITIES[params.quality].label}灵宠`
          break

        case 'addArtifact':
          for (let i = 0; i < params.count; i++) {
            const artifact = generateArtifact(player.realmIndex, params.quality as EquipmentQuality)
            playerStore.addArtifact(artifact)
          }
          message = `成功添加 ${params.count} 件${QUALITIES[params.quality].label}法宝`
          break

        case 'addTechnique':
          let addedCount = 0
          for (let i = 0; i < params.count; i++) {
            const technique = generateTechniqueByRealm(player.realmIndex, params.quality)
            if (playerStore.addTechnique(technique)) {
              addedCount++
            }
          }
          message = `成功添加 ${addedCount}/${params.count} 个功法（重复的未添加）`
          break

        case 'setHp':
          player.hp = Math.min(params.value, player.maxHp)
          message = `生命值已设置为 ${player.hp}`
          break

        case 'setMaxHp':
          player.maxHp = params.value
          if (player.hp > player.maxHp) player.hp = player.maxHp
          message = `最大生命值已设置为 ${player.maxHp}`
          break

        case 'setAttack':
          player.attack = params.value
          message = `攻击力已设置为 ${player.attack}`
          break

        case 'setDefense':
          player.defense = params.value
          message = `防御力已设置为 ${player.defense}`
          break

        case 'setCritRate':
          player.critRate = params.value / 100
          message = `暴击率已设置为 ${params.value}%`
          break

        case 'setCritDamage':
          player.critDamage = params.value
          message = `暴击伤害已设置为 ${params.value}倍`
          break

        case 'setDodgeRate':
          player.dodgeRate = params.value / 100
          message = `闪避率已设置为 ${params.value}%`
          break

        case 'clearInventory':
          const itemCount = player.inventory.length
          player.inventory = []
          message = `已清空背包，共删除 ${itemCount} 件物品`
          break

        case 'fullHeal':
          playerStore.fullHeal()
          message = '生命值已回满'
          break

        case 'resetCooldowns':
          // 重置法宝冷却
          player.artifacts.forEach(a => {
            a.skill.currentCooldown = 0
          })
          message = '所有冷却已重置'
          break

        case 'unlockAllFormations':
          // 导入阵法配置
          import('@/types/game').then(({ FORMATION_CONFIGS }) => {
            FORMATION_CONFIGS.forEach(f => {
              if (!player.unlockedFormations.includes(f.id)) {
                player.unlockedFormations.push(f.id)
              }
            })
          })
          message = '已解锁所有阵法'
          break

        case 'maxFormationNodes':
          if (player.formation) {
            import('@/types/game').then(({ FORMATION_CONFIGS }) => {
              const config = FORMATION_CONFIGS.find(f => f.id === player.formation!.formationId)
              if (config) {
                player.formation!.nodes.forEach(node => {
                  const nodeConfig = config.nodes.find(n => n.type === node.type)
                  if (nodeConfig) {
                    node.activated = true
                    node.level = nodeConfig.maxLevel
                  }
                })
              }
            })
          }
          message = '所有阵法节点已升至满级'
          break

        default:
          return { success: false, message: '未知命令' }
      }

      // 记录命令历史
      const historyEntry = `[${new Date().toLocaleTimeString()}] ${command.label}: ${message}`
      commandHistory.value.unshift(historyEntry)
      if (commandHistory.value.length > 50) {
        commandHistory.value.pop()
      }

      // 保存游戏
      playerStore.saveGame()

      return { success: true, message }
    } catch (error) {
      return { success: false, message: `执行失败: ${error}` }
    }
  }

  // 切换GM模式
  function toggleGMMode() {
    isGMMode.value = !isGMMode.value
  }

  // 启用GM模式（需要密码验证）
  function enableGMMode(password: string): boolean {
    // GM密码：xiantu2024
    if (password === 'xiantu2024') {
      isGMMode.value = true
      return true
    }
    return false
  }

  // 禁用GM模式
  function disableGMMode() {
    isGMMode.value = false
  }

  // 清空命令历史
  function clearHistory() {
    commandHistory.value = []
  }

  return {
    isGMMode,
    commandHistory,
    gmCommands,
    executeCommand,
    toggleGMMode,
    enableGMMode,
    disableGMMode,
    clearHistory
  }
})
