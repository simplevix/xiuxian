import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Monster, Scene, Equipment } from '@/types/game'
import { SCENES, QUALITIES, PET_TEMPLATES, ARTIFACT_TEMPLATES, TECHNIQUE_TEMPLATES } from '@/types/game'
import { usePlayerStore } from './player'
import { generateEquipment, chance, randomInt } from '@/utils/random'
import type { Pet, Artifact, Technique } from '@/types/game'

// 战斗日志条目类型
export interface BattleLogEntry {
  text: string
  type: 'info' | 'player' | 'monster' | 'critical' | 'drop' | 'victory' | 'defeat' | 'pet' | 'system'
  timestamp: number
}

export const useBattleStore = defineStore('battle', () => {
  const playerStore = usePlayerStore()

  const currentScene = ref<Scene | null>(null)
  const currentMonster = ref<Monster | null>(null)
  const isInBattle = ref(false)
  const battleLog = ref<BattleLogEntry[]>([])
  const battleTimer = ref<number | null>(null)
  // 挂机模式：战胜后自动开启下一场
  const autoMode = ref(false)
  // 战斗统计（本次挂机）
  const sessionKills = ref(0)
  const sessionStones = ref(0)
  const sessionExp = ref(0)
  // 上次浮字（供 UI 展示用）
  const lastDamageFloat = ref<{ value: number; critical: boolean; x: number; key: number } | null>(null)
  const lastMonsterDamageFloat = ref<{ value: number; x: number; key: number } | null>(null)

  const canBattle = computed(() => currentScene.value !== null && !isInBattle.value)

  function addLog(text: string, type: BattleLogEntry['type'] = 'info') {
    battleLog.value.push({ text, type, timestamp: Date.now() })
    if (battleLog.value.length > 100) {
      battleLog.value = battleLog.value.slice(-80)
    }
  }

  function selectScene(sceneId: string) {
    const scene = SCENES.find(s => s.id === sceneId)
    if (scene) {
      currentScene.value = scene
      // 切换场景时重置本场统计
      sessionKills.value = 0
      sessionStones.value = 0
      sessionExp.value = 0
    }
  }

  function startBattle() {
    if (!currentScene.value || isInBattle.value) return
    const monsters = currentScene.value.monsters
    // Boss概率10%
    const isBoss = chance(0.1)
    const monsterList = isBoss ? monsters.filter(m => m.boss) : monsters.filter(m => !m.boss)
    if (monsterList.length === 0) return

    const template = monsterList[Math.floor(Math.random() * monsterList.length)]
    currentMonster.value = {
      ...template,
      id: template.id + '_' + Date.now(),
      hp: template.maxHp
    }
    isInBattle.value = true
    addLog(`⚔️ 遭遇 ${currentMonster.value.name}${currentMonster.value.boss ? '【BOSS】' : ''}！`, 'system')
    
    if (battleTimer.value) clearInterval(battleTimer.value)
    battleTimer.value = window.setInterval(battleRound, 2500)
  }

  function calcCritical(baseChance = 0.15): boolean {
    return chance(baseChance)
  }

  function battleRound() {
    if (!currentMonster.value || !playerStore.player) return
    const p = playerStore.player

    // 玩家攻击（含暴击）
    const isCrit = calcCritical()
    let playerDamage = Math.max(1, p.attack - currentMonster.value.defense)
    if (isCrit) playerDamage = Math.floor(playerDamage * 1.8)
    currentMonster.value.hp -= playerDamage
    
    // 伤害浮字
    lastDamageFloat.value = { value: playerDamage, critical: isCrit, x: 45 + Math.random() * 30, key: Date.now() }
    
    if (isCrit) {
      addLog(`💥 暴击！你对 ${currentMonster.value.name} 造成 ${playerDamage} 点伤害`, 'critical')
    } else {
      addLog(`⚔️ 你对 ${currentMonster.value.name} 造成 ${playerDamage} 点伤害`, 'player')
    }

    // 灵宠攻击
    if (p.currentPetId) {
      const pet = p.pets.find(pet => pet.id === p.currentPetId)
      if (pet && chance(0.7)) {
        const petDamage = Math.max(1, pet.attack - Math.floor(currentMonster.value.defense * 0.5))
        currentMonster.value.hp -= petDamage
        addLog(`🐉 灵宠 ${pet.name} 协助攻击 ${petDamage}`, 'pet')
      }
    }

    if (currentMonster.value.hp <= 0) {
      endBattle(true)
      return
    }

    // 怪物攻击（含闪避）
    const dodged = chance(0.08)
    if (dodged) {
      addLog(`✨ 你闪避了 ${currentMonster.value.name} 的攻击！`, 'player')
    } else {
      const monsterDamage = Math.max(1, currentMonster.value.attack - p.defense)
      p.hp -= monsterDamage
      lastMonsterDamageFloat.value = { value: monsterDamage, x: 30 + Math.random() * 20, key: Date.now() }
      addLog(`🔥 ${currentMonster.value.name} 对你造成 ${monsterDamage} 点伤害`, 'monster')
    }

    if (p.hp <= 0) {
      endBattle(false)
    }
  }

  function endBattle(victory: boolean) {
    if (battleTimer.value) {
      clearInterval(battleTimer.value)
      battleTimer.value = null
    }
    isInBattle.value = false

    if (!currentMonster.value || !playerStore.player) return

    if (victory) {
      addLog(`🏆 你击败了 ${currentMonster.value.name}！`, 'victory')
      const exp = currentMonster.value.expReward
      const stones = currentMonster.value.stoneReward
      playerStore.addExp(exp)
      playerStore.addSpiritStones(stones)
      playerStore.player.totalKills++
      sessionKills.value++
      sessionStones.value += stones
      sessionExp.value += exp
      addLog(`📦 获得 ${exp} 经验 · ${stones} 灵石`, 'drop')
      processDrops()
    } else {
      addLog('💔 你倒下了... 伤势恢复中', 'defeat')
      // 战败不扣灵石，只需等待恢复
      playerStore.fullHeal()
      // 战败时关闭挂机模式，避免死循环
      if (autoMode.value) {
        autoMode.value = false
        addLog('⚙️ 挂机模式已暂停（战败保护）', 'system')
      }
    }

    currentMonster.value = null

    // 挂机模式：短暂延迟后自动开下一场
    if (autoMode.value && victory && currentScene.value) {
      setTimeout(() => {
        if (autoMode.value && currentScene.value) startBattle()
      }, 1200)
    }
  }

  function processDrops() {
    if (!currentMonster.value) return
    const drops = currentMonster.value.dropTable
    const playerRealm = playerStore.player?.realmIndex || 0
    
    for (const drop of drops) {
      if (chance(drop.chance)) {
        if ((drop.dropType === 'pet' || drop.type === 'pet') && drop.itemId && drop.itemName) {
          const petTemplate = PET_TEMPLATES[drop.itemId]
          if (petTemplate) {
            const pet: Pet = {
              id: '',
              ...petTemplate,
              maxSpirit: 100,
              spirit: 100,
              exp: 0,
              maxExp: petTemplate.level * 100 + 50,
              loyalty: 50,
              grade: 1
            }
            // 避免重复收服
            const alreadyHave = playerStore.player?.pets.some(p => p.name === pet.name)
            if (!alreadyHave) {
              playerStore.addPet(pet)
              addLog(`🌟 【奇遇】收服了 ${drop.itemName}！`, 'drop')
            }
          }
        } else if ((drop.dropType === 'artifact' || drop.type === 'artifact') && drop.itemId) {
          // 法宝掉落
          const artifactTemplate = ARTIFACT_TEMPLATES[drop.itemId]
          if (artifactTemplate) {
            const alreadyHave = playerStore.player?.artifacts.some(a => a.name === artifactTemplate.name)
            if (!alreadyHave) {
              const artifact: Artifact = { ...artifactTemplate, id: '' }
              playerStore.addArtifact(artifact)
              addLog(`🔮 【奇遇】获得法宝 【${artifact.name}】！`, 'drop')
            }
          }
        } else if (drop.dropType === 'technique' && drop.itemId) {
          // 功法掉落
          const techniqueTemplate = TECHNIQUE_TEMPLATES[drop.itemId]
          if (techniqueTemplate) {
            if (playerRealm >= techniqueTemplate.realmRequirement) {
              const alreadyHave = playerStore.player?.techniques.some(t => t.name === techniqueTemplate.name)
              if (!alreadyHave) {
                const technique: Technique = { ...techniqueTemplate, id: '' }
                if (playerStore.addTechnique(technique)) {
                  addLog(`📜 【奇遇】领悟功法 【${technique.name}】！`, 'drop')
                }
              }
            }
          }
        } else if (drop.type && drop.quality) {
          const playerLevel = playerStore.totalLevel
          const equip = generateEquipment(drop.type, drop.quality, playerLevel)
          playerStore.player?.inventory.push(equip)
          const qualityName = QUALITIES[drop.quality].name
          const equipPrefix = equip.setId ? '【套装】' : ''
          addLog(`✨ 获得${equipPrefix}${qualityName}装备 【${equip.name}】！`, 'drop')
        }
      }
    }
    
    // 通用功法掉落（根据境界概率掉落）
    // 基础掉落概率2%，BOSS掉落概率8%
    const techniqueDropChance = currentMonster.value.boss ? 0.08 : 0.02
    if (chance(techniqueDropChance)) {
      // 根据境界选择可掉落的功法
      const eligibleTechniques = Object.entries(TECHNIQUE_TEMPLATES)
        .filter(([_, template]) => template.realmRequirement <= playerRealm)
        .map(([key, _]) => key)
      
      if (eligibleTechniques.length > 0) {
        const randomKey = eligibleTechniques[Math.floor(Math.random() * eligibleTechniques.length)]
        const template = TECHNIQUE_TEMPLATES[randomKey]
        const alreadyHave = playerStore.player?.techniques.some(t => t.name === template.name)
        if (!alreadyHave) {
          const technique: Technique = { ...template, id: '' }
          if (playerStore.addTechnique(technique)) {
            addLog(`📜 【奇遇】击败${currentMonster.value.name}后领悟 【${technique.name}】！`, 'drop')
          }
        }
      }
    }
  }

  function flee() {
    if (!isInBattle.value || !currentScene.value) return
    if (battleTimer.value) {
      clearInterval(battleTimer.value)
      battleTimer.value = null
    }
    isInBattle.value = false
    autoMode.value = false
    addLog('🏃 你撤退了...', 'system')
    currentMonster.value = null
  }

  function toggleAutoMode() {
    if (!currentScene.value) return
    autoMode.value = !autoMode.value
    if (autoMode.value && !isInBattle.value) {
      sessionKills.value = 0
      sessionStones.value = 0
      sessionExp.value = 0
      addLog('⚙️ 挂机模式开启，自动循环战斗中...', 'system')
      startBattle()
    } else if (!autoMode.value) {
      addLog('⚙️ 挂机模式已关闭', 'system')
    }
  }

  function clearLog() {
    battleLog.value = []
  }

  return {
    currentScene,
    currentMonster,
    isInBattle,
    battleLog,
    canBattle,
    autoMode,
    sessionKills,
    sessionStones,
    sessionExp,
    lastDamageFloat,
    lastMonsterDamageFloat,
    selectScene,
    startBattle,
    flee,
    toggleAutoMode,
    clearLog
  }
})
