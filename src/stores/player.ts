import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Player, Equipment, Pet, Artifact, EquipmentSlots, SetConfig, Technique, TechniqueEffect, PlayerFormation, FormationConfig, FormationNode, AutoSellSetting, EquipmentQuality } from '@/types/game'
import { REALMS, SET_CONFIGS, FORMATION_CONFIGS } from '@/types/game'
import { generateId } from '@/utils/random'
import { savePlayerData as saveToDB, loadPlayerData as loadFromDB, deletePlayerData as deleteFromDB, initSaveManager } from '@/utils/saveManager'
import { useAuthStore } from './auth'

const STORAGE_KEY = 'xiantu_player' // 保留作为 localStorage 兼容的 fallback

export const usePlayerStore = defineStore('player', () => {
  const player = ref<Player | null>(null)
  const cultivationTimer = ref<number | null>(null)
  const battleTimer = ref<number | null>(null)

  const currentRealm = computed(() => player.value ? REALMS[player.value.realmIndex] : null)
  const totalLevel = computed(() => {
    if (!player.value) return 0
    return player.value.realmIndex * 10 + player.value.realmLevel + 1
  })

  // 检查玩家是否已绑定账号
  const hasAccount = computed(() => !!player.value?.userId)
  // 检查玩家是否有角色
  const hasCharacter = computed(() => !!player.value)

  // ==================== 阵法效果计算 ====================
  
  // 获取当前激活的阵法配置
  const activeFormationConfig = computed((): FormationConfig | null => {
    if (!player.value?.formation) return null
    return FORMATION_CONFIGS.find(f => f.id === player.value!.formation!.formationId) || null
  })
  
  // 计算阵法总加成
  const formationBonus = computed(() => {
    if (!player.value?.formation || !activeFormationConfig.value) {
      return { spiritBonus: 0, capacityBonus: 0, efficiencyPercent: 0 }
    }
    
    const formation = player.value.formation
    const config = activeFormationConfig.value
    
    let spiritBonus = 0
    let capacityBonus = 0
    let efficiencyPercent = 0
    
    for (const node of formation.nodes) {
      if (!node.activated) continue
      const nodeConfig = config.nodes.find(n => n.type === node.type)
      if (!nodeConfig) continue
      
      const effectValue = nodeConfig.baseEffect + nodeConfig.perLevelBonus * node.level
      
      switch (node.type) {
        case 'spirit':
          spiritBonus += effectValue
          break
        case 'capacity':
          capacityBonus += effectValue
          break
        case 'efficiency':
          efficiencyPercent += effectValue
          break
      }
    }
    
    return { spiritBonus, capacityBonus, efficiencyPercent }
  })
  
  // 获取节点升级所需灵石
  function getNodeUpgradeCost(formation: PlayerFormation, nodeType: string): number {
    const config = activeFormationConfig.value
    if (!config) return 0
    
    const node = formation.nodes.find(n => n.type === nodeType)
    const nodeConfig = config.nodes.find(n => n.type === nodeType)
    if (!node || !nodeConfig || node.level >= nodeConfig.maxLevel) return 0
    
    return nodeConfig.baseCost + nodeConfig.costIncrease * (node.level + 1)
  }
  
  // 激活/升级阵法节点
  function upgradeFormationNode(nodeType: string): { success: boolean; message: string } {
    if (!player.value?.formation) {
      return { success: false, message: '请先激活阵法' }
    }
    
    const formation = player.value.formation
    const config = activeFormationConfig.value
    if (!config) {
      return { success: false, message: '阵法配置不存在' }
    }
    
    const nodeIndex = formation.nodes.findIndex(n => n.type === nodeType)
    if (nodeIndex === -1) {
      return { success: false, message: '节点不存在' }
    }
    
    const node = formation.nodes[nodeIndex]
    const nodeConfig = config.nodes.find(n => n.type === nodeType)
    if (!nodeConfig) {
      return { success: false, message: '节点配置不存在' }
    }
    
    // 首次激活需要灵石
    if (!node.activated) {
      const activationCost = nodeConfig.baseCost
      if (player.value.spiritStones < activationCost) {
        return { success: false, message: `激活需要 ${activationCost} 灵石，当前只有 ${player.value.spiritStones} 灵石` }
      }
      player.value.spiritStones -= activationCost
      formation.nodes[nodeIndex].activated = true
      formation.nodes[nodeIndex].level = 1
      return { success: true, message: `成功激活「${nodeConfig.name}」！` }
    }
    
    // 升级
    if (node.level >= nodeConfig.maxLevel) {
      return { success: false, message: `${nodeConfig.name}已满级` }
    }
    
    const upgradeCost = getNodeUpgradeCost(formation, nodeType)
    if (player.value.spiritStones < upgradeCost) {
      return { success: false, message: `升级需要 ${upgradeCost} 灵石，当前只有 ${player.value.spiritStones} 灵石` }
    }
    
    player.value.spiritStones -= upgradeCost
    formation.nodes[nodeIndex].level++
    
    return { success: true, message: `${nodeConfig.name} 升级到 Lv.${formation.nodes[nodeIndex].level}！` }
  }
  
  // 激活阵法（解锁新境界阵法）
  function activateFormation(formationId: string): { success: boolean; message: string } {
    const config = FORMATION_CONFIGS.find(f => f.id === formationId)
    if (!config) {
      return { success: false, message: '阵法不存在' }
    }
    
    // 检查是否已解锁
    if (!player.value?.unlockedFormations.includes(formationId)) {
      return { success: false, message: '该阵法尚未解锁，需要突破到更高境界' }
    }
    
    // 检查灵石
    const activationCost = config.realmIndex * 500 + 1000 // 阵法激活基础费用
    if (player.value.spiritStones < activationCost) {
      return { success: false, message: `激活阵法需要 ${activationCost} 灵石，当前只有 ${player.value.spiritStones} 灵石` }
    }
    
    player.value.spiritStones -= activationCost
    
    // 创建阵法节点
    const nodes: FormationNode[] = config.nodes.map(n => ({
      type: n.type,
      level: 0,
      activated: false
    }))
    
    player.value.formation = {
      formationId,
      nodes,
      realmIndex: config.realmIndex
    }
    
    return { success: true, message: `成功激活「${config.name}」！` }
  }
  
  // 解锁阵法（突破境界时自动解锁）
  function unlockFormation(realmIndex: number) {
    if (!player.value) return
    const config = FORMATION_CONFIGS.find(f => f.realmIndex === realmIndex)
    if (config && !player.value.unlockedFormations.includes(config.id)) {
      player.value.unlockedFormations.push(config.id)
    }
  }

  // ==================== 套装效果计算 ====================
  
  // 获取玩家当前激活的套装及其部件数量
  const activeSetInfo = computed(() => {
    if (!player.value) return { setId: null, setConfig: null, piecesCount: 0, bonuses: [] }
    
    // 统计所有已装备的套装部件
    const equippedItems = Object.values(player.value.equipment || {}).filter(Boolean) as Equipment[]
    const setPieces: Record<string, number> = {}
    
    for (const item of equippedItems) {
      if (item.setId && item.setPieceIndex !== undefined) {
        setPieces[item.setId] = (setPieces[item.setId] || 0) | (1 << item.setPieceIndex)
      }
    }
    
    // 找出拥有最多部件的套装
    let maxPieces = 0
    let bestSetId: string | null = null
    let bestSetMask = 0
    
    for (const [setId, mask] of Object.entries(setPieces)) {
      // 计算有效位数（部件数量）
      let count = 0
      let m = mask
      while (m) { count++; m &= m - 1 }
      if (count > maxPieces) {
        maxPieces = count
        bestSetId = setId
        bestSetMask = mask
      }
    }
    
    if (!bestSetId) return { setId: null, setConfig: null, piecesCount: 0, bonuses: [] }
    
    const setConfig = SET_CONFIGS.find(s => s.id === bestSetId)
    if (!setConfig) return { setId: null, setConfig: null, piecesCount: 0, bonuses: [] }
    
    // 获取已激活的套装效果
    const bonuses = setConfig.bonuses
      .filter(b => b.pieces <= maxPieces)
      .sort((a, b) => b.pieces - a.pieces) // 从高到低排序
    
    return { 
      setId: bestSetId, 
      setConfig, 
      piecesCount: maxPieces,
      bonuses,
      equippedMask: bestSetMask
    }
  })
  
  // 计算套装属性加成（百分比）
  const setBonuses = computed(() => {
    const info = activeSetInfo.value
    if (!info.setConfig || info.bonuses.length === 0) {
      return { attackPercent: 0, defensePercent: 0, hpPercent: 0, critRate: 0, spiritPerSecBonus: 0, lifesteal: 0 }
    }
    
    // 累加所有已激活的套装效果
    let attackPercent = 0
    let defensePercent = 0
    let hpPercent = 0
    let critRate = 0
    let spiritPerSecBonus = 0
    let lifesteal = 0
    
    for (const bonus of info.bonuses) {
      attackPercent += bonus.attackPercent
      defensePercent += bonus.defensePercent
      hpPercent += bonus.hpPercent
      critRate += bonus.critRate
      spiritPerSecBonus += bonus.spiritPerSec
      lifesteal += bonus.lifesteal
    }
    
    return { attackPercent, defensePercent, hpPercent, critRate, spiritPerSecBonus, lifesteal }
  })

  // 境界进度（0-10，表示当前境界的层数进度）
  const realmProgress = computed(() => player.value?.realmLevel || 0)
  // 境界进度上限
  const realmProgressMax = computed(() => currentRealm.value?.realmLevelCap || 10)

  function createPlayer(name: string, userId?: string) {
    const authStore = useAuthStore()
    const boundUserId = userId || authStore.currentUser?.id

    // 初始化阵法（新角色默认解锁并激活第一个阵法）
    const firstFormation = FORMATION_CONFIGS[0]
    const initialFormation: PlayerFormation = {
      formationId: firstFormation.id,
      nodes: firstFormation.nodes.map(n => ({
        type: n.type,
        level: 0,
        activated: false
      })),
      realmIndex: 0
    }

    player.value = {
      id: generateId(),
      name,
      userId: boundUserId,
      realmIndex: 0,
      realmLevel: 0,  // 境界进度（层数）
      level: 1,       // 总等级
      hp: 100,
      maxHp: 100,
      mp: 100,
      maxMp: 100,
      sp: 0,
      maxSp: 100,
      attack: 10,
      defense: 5,
      spiritEnergy: 0,
      spiritStones: 50,
      spiritRoot: Math.floor(Math.random() * 5) + 5,  // 随机5-10灵根
      
      // 战斗属性
      critRate: 0.15,
      critDamage: 1.8,
      dodgeRate: 0.08,
      hitRate: 0.95,
      attackSpeed: 1,
      lifesteal: 0,
      damageReduction: 0,
      reflectDamage: 0,
      
      // 修炼属性
      wisdom: 10,
      willpower: 10,
      insight: 0,
      maxInsight: 100,
      
      equipment: {} as EquipmentSlots,
      inventory: [],
      artifacts: [],
      pets: [],
      realmLevelExp: 0,  // 境界经验
      totalKills: 0,
      lastOnline: Date.now(),
      createdAt: Date.now(),
      techniques: [],     // 功法列表
      equippedTechniqueIds: [],  // 已装备功法
      formation: initialFormation,  // 初始阵法
      unlockedFormations: [firstFormation.id],  // 已解锁的阵法
      
      // Engine系统数据
      buffs: [],
      shields: [],
      injuries: [],
      learnedSkills: []
    }
    
    // 初始化游戏系统
    initGameSystem()
    
    startCultivation()
    saveGame()
  }

  // 绑定到账号
  function bindToAccount(userId: string) {
    if (player.value) {
      player.value.userId = userId
      saveGame()
    }
  }
  
  // 初始化游戏系统（Engine层）
  function initGameSystem() {
    if (!player.value) return
    
    // 动态导入Engine模块
    import('@/engine').then(({ createPlayerGameSystem }) => {
      if (player.value) {
        player.value.gameSystem = createPlayerGameSystem(player.value)
      }
    }).catch(err => {
      console.warn('Engine系统初始化失败:', err)
    })
  }

  // 挂机修炼 - 每秒执行
  function startCultivation() {
    if (cultivationTimer.value) clearInterval(cultivationTimer.value)
    cultivationTimer.value = window.setInterval(() => {
      if (!player.value) return
      const realm = REALMS[player.value.realmIndex]
      
      // 计算灵气加成（套装 + 功法 + 阵法）
      const setSpiritBonus = setBonuses.value.spiritPerSecBonus
      const techSpiritBonus = techniqueBonuses.value.spiritPerSec
      const formationSpiritBonus = formationBonus.value.spiritBonus
      const totalSpiritBonus = setSpiritBonus + techSpiritBonus + formationSpiritBonus
      
      // 计算灵气容量加成（阵法）
      const formationCapacityBonus = formationBonus.value.capacityBonus
      const effectiveSpiritCap = realm.spiritCap + formationCapacityBonus
      
      // 灵气增加（基础 + 各种加成）
      if (player.value.spiritEnergy < effectiveSpiritCap) {
        // 计算效率加成
        const efficiency = 1 + formationBonus.value.efficiencyPercent / 100
        player.value.spiritEnergy = Math.min(
          player.value.spiritEnergy + (realm.spiritPerSec + totalSpiritBonus) * efficiency,
          effectiveSpiritCap
        )
      }
      
      // 检查是否满足提升境界的条件
      checkAndAdvanceRealmProgress()
    }, 1000)
  }

  // 停止修炼
  function stopCultivation() {
    if (cultivationTimer.value) {
      clearInterval(cultivationTimer.value)
      cultivationTimer.value = null
    }
  }

  // 检查并推进境界进度（灵气满 + 经验满 → 自动提升境界层数）
  function checkAndAdvanceRealmProgress() {
    if (!player.value) return
    const realm = REALMS[player.value.realmIndex]
    
    // 条件：灵气满 + 经验满 + 境界进度未满
    const spiritFull = player.value.spiritEnergy >= realm.spiritCap
    const expFull = player.value.realmLevelExp >= getRealmLevelExpNeeded()
    const progressNotFull = player.value.realmLevel < realm.realmLevelCap
    
    if (spiritFull && expFull && progressNotFull) {
      // 消耗灵气和经验，提升境界进度
      player.value.spiritEnergy = 0
      player.value.realmLevelExp = 0
      player.value.realmLevel++
      recalcStats()
    }
  }

  // 添加经验（打怪获得）
  function addExp(exp: number) {
    if (!player.value) return
    player.value.realmLevelExp += exp
    // 检查是否满足提升境界的条件
    checkAndAdvanceRealmProgress()
  }

  // 获取当前境界所需经验
  function getRealmLevelExpNeeded(): number {
    if (!player.value) return 100
    const realm = REALMS[player.value.realmIndex]
    // 经验需求 = 层数 * 100 + 50，层数越高需求越大
    return (player.value.realmLevel + 1) * 100 + 50
  }

  // 境界突破 - 手动点击（境界进度满 + 经验满 → 突破到下一大境界）
  function breakThrough(): { success: boolean; message: string } {
    if (!player.value) return { success: false, message: '无角色数据' }
    const realm = REALMS[player.value.realmIndex]
    
    // 条件：境界进度满 + 经验满 + 未达最高境界
    const progressFull = player.value.realmLevel >= realm.realmLevelCap
    const expFull = player.value.realmLevelExp >= getRealmLevelExpNeeded()
    
    if (!progressFull) {
      return { success: false, message: `境界进度未满，还需提升${realm.realmLevelCap - player.value.realmLevel}层` }
    }
    
    if (!expFull) {
      return { success: false, message: '经验不足，请继续刷怪' }
    }
    
    if (player.value.realmIndex >= REALMS.length - 1) {
      return { success: false, message: '已达到最高境界' }
    }
    
    // 突破成功
    player.value.realmIndex++
    player.value.realmLevel = 0  // 新境界从0层开始
    player.value.realmLevelExp = 0
    
    // 解锁新境界的阵法
    unlockFormation(player.value.realmIndex)
    
    recalcStats()
    
    return { success: true, message: `恭喜突破到${REALMS[player.value.realmIndex].name}！新阵法已解锁！` }
  }

  // 添加灵石
  function addSpiritStones(amount: number) {
    if (player.value) player.value.spiritStones += amount
  }

  // 受伤
  function takeDamage(damage: number) {
    if (!player.value) return
    player.value.hp = Math.max(0, player.value.hp - damage)
  }

  // 治疗
  function heal(amount: number) {
    if (!player.value) return
    player.value.hp = Math.min(player.value.maxHp, player.value.hp + amount)
  }

  // 满血
  function fullHeal() {
    if (player.value) player.value.hp = player.value.maxHp
  }

  // 装备物品
  function equipItem(item: Equipment) {
    if (!player.value) return
    const slot = item.type
    
    // 戒指特殊处理：自动装备到第一个空戒指槽
    if (slot === 'ring') {
      if (!player.value.equipment.ring1) {
        player.value.equipment.ring1 = item
      } else if (!player.value.equipment.ring2) {
        player.value.equipment.ring2 = item
      } else {
        // 两个戒指槽都满了，替换第一个
        player.value.inventory.push(player.value.equipment.ring1!)
        player.value.equipment.ring1 = item
      }
    } else {
      if (player.value.equipment[slot as keyof EquipmentSlots]) {
        player.value.inventory.push(player.value.equipment[slot as keyof EquipmentSlots]!)
      }
      player.value.equipment[slot as keyof EquipmentSlots] = item as any
    }
    recalcStats()
  }

  // 卸下装备
  function unequipItem(slot: keyof EquipmentSlots) {
    if (!player.value) return
    const item = player.value.equipment[slot]
    if (item) {
      player.value.inventory.push(item)
      delete player.value.equipment[slot]
      recalcStats()
    }
  }

  // ==================== 装备强化系统 ====================

  // 计算强化费用（灵石无限强化，等级越高费用越高）
  function getEnhancementCost(level: number): number {
    if (level < 0) return 0
    // 强化费用 = 100 * (level + 1) * (level + 1)
    // +0: 100, +1: 400, +2: 900, +3: 1600, +4: 2500, +5: 3600, +6: 4900...
    return Math.floor(100 * Math.pow(level + 1, 2))
  }

  // 计算强化后的属性加成
  function getEnhancementMultiplier(level: number): number {
    if (level <= 0) return 1.0
    // 每级+10%属性
    return 1.0 + level * 0.1
  }

  // 强化装备（背包或已装备）
  function enhanceEquipment(equipmentId: string, fromInventory: boolean = true): { success: boolean; message: string } {
    if (!player.value) return { success: false, message: '玩家数据不存在' }

    let equipment: Equipment | undefined
    let inventoryIndex = -1
    let slotKey: keyof EquipmentSlots | null = null

    if (fromInventory) {
      // 从背包强化
      inventoryIndex = player.value.inventory.findIndex(e => e.id === equipmentId)
      if (inventoryIndex > -1) {
        equipment = player.value.inventory[inventoryIndex]
      }
    } else {
      // 从已装备中强化
      for (const [key, item] of Object.entries(player.value.equipment)) {
        if (item && item.id === equipmentId) {
          equipment = item
          slotKey = key as keyof EquipmentSlots
          break
        }
      }
    }

    if (!equipment) return { success: false, message: '装备不存在' }

    const currentLevel = equipment.enhancementLevel || 0
    const cost = getEnhancementCost(currentLevel)

    if (player.value.spiritStones < cost) {
      return { success: false, message: `灵石不足！需要 ${cost} 灵石` }
    }

    // 扣除灵石
    player.value.spiritStones -= cost

    // 升级强化等级
    equipment.enhancementLevel = currentLevel + 1

    // 重新计算玩家属性
    recalcStats()

    return {
      success: true,
      message: `强化成功！装备等级提升至 +${equipment.enhancementLevel}，消耗 ${cost} 灵石`
    }
  }

  // ==================== 功法系统 ====================

  // 添加功法
  function addTechnique(technique: Technique) {
    if (!player.value) return
    if (!player.value.techniques) player.value.techniques = []
    // 检查是否已有同名功法
    const alreadyHave = player.value.techniques.some(t => t.name === technique.name)
    if (alreadyHave) return false
    technique.id = generateId()
    player.value.techniques.push(technique)
    return true
  }

  // 装备功法（最多装备3个）
  function equipTechnique(techniqueId: string) {
    if (!player.value) return false
    if (!player.value.techniques) player.value.techniques = []
    if (!player.value.equippedTechniqueIds) player.value.equippedTechniqueIds = []
    const technique = player.value.techniques.find(t => t.id === techniqueId)
    if (!technique) return false

    const equippedIds = player.value.equippedTechniqueIds
    const idx = equippedIds.indexOf(techniqueId)

    if (idx > -1) {
      // 卸下功法
      player.value.equippedTechniqueIds.splice(idx, 1)
    } else {
      // 装备功法（最多3个）
      if (equippedIds.length >= 3) {
        return false // 已达上限
      }
      player.value.equippedTechniqueIds.push(techniqueId)
    }
    recalcStats()
    return true
  }

  // 获取已装备的功法
  const equippedTechniques = computed(() => {
    if (!player.value) return []
    const techniques = player.value.techniques || []
    const equippedIds = player.value.equippedTechniqueIds || []
    return techniques.filter(t => equippedIds.includes(t.id))
  })

  // 计算功法属性加成
  const techniqueBonuses = computed(() => {
    const techniques = equippedTechniques.value
    let attackBonus = 0
    let defenseBonus = 0
    let hpBonus = 0
    let critRate = 0
    let critDamage = 0
    let dodgeRate = 0
    let lifesteal = 0
    let spiritPerSec = 0
    let damageReduction = 0
    let reflectDamage = 0
    let regenPerSec = 0

    for (const tech of techniques) {
      if (!tech.effects) continue
      for (const effect of tech.effects) {
        switch (effect.type) {
          case 'attackBonus': attackBonus += effect.value; break
          case 'defenseBonus': defenseBonus += effect.value; break
          case 'hpBonus': hpBonus += effect.value; break
          case 'critRate': critRate += effect.value; break
          case 'critDamage': critDamage += effect.value; break
          case 'dodgeRate': dodgeRate += effect.value; break
          case 'lifesteal': lifesteal += effect.value; break
          case 'spiritPerSec': spiritPerSec += effect.value; break
          case 'damageReduction': damageReduction += effect.value; break
          case 'reflectDamage': reflectDamage += effect.value; break
          case 'regenPerSec': regenPerSec += effect.value; break
        }
      }
    }

    return { attackBonus, defenseBonus, hpBonus, critRate, critDamage, dodgeRate, lifesteal, spiritPerSec, damageReduction, reflectDamage, regenPerSec }
  })

  // 添加灵宠
  function addPet(pet: Pet) {
    if (player.value) {
      pet.id = generateId()
      pet.spirit = pet.maxSpirit = 100
      pet.exp = 0
      pet.maxExp = pet.level * 100 + 50
      pet.loyalty = 50
      pet.grade = 1
      player.value.pets.push(pet)
      if (!player.value.currentPetId) {
        player.value.currentPetId = pet.id
      }
    }
  }

  // 喂养灵宠
  function feedPet(petId: string, amount: number) {
    if (!player.value) return
    const pet = player.value.pets.find(p => p.id === petId)
    if (pet && player.value.spiritStones >= amount) {
      player.value.spiritStones -= amount
      pet.loyalty = Math.min(100, pet.loyalty + Math.floor(amount / 10))
      pet.exp += amount * 2
      // 检查升级
      while (pet.exp >= pet.maxExp) {
        pet.exp -= pet.maxExp
        pet.level++
        pet.attack = Math.floor(pet.attack * 1.2)
        pet.defense = Math.floor(pet.defense * 1.2)
        pet.maxExp = pet.level * 100 + 50
      }
      recalcStats()
    }
  }

  // 灵宠觉醒
  function awakenPet(petId: string) {
    if (!player.value) return false
    const pet = player.value.pets.find(p => p.id === petId)
    if (pet && pet.grade < 5) {
      pet.grade++
      pet.attack = Math.floor(pet.attack * 1.5)
      pet.defense = Math.floor(pet.defense * 1.5)
      pet.maxSpirit += 50
      pet.spirit = pet.maxSpirit
      recalcStats()
      return true
    }
    return false
  }

  // 添加法宝
  function addArtifact(artifact: Artifact) {
    if (player.value) {
      artifact.id = generateId()
      player.value.artifacts.push(artifact)
    }
  }

  // 装备法宝
  function equipArtifact(artifactId: string) {
    if (!player.value) return
    player.value.equippedArtifactId = player.value.equippedArtifactId === artifactId ? undefined : artifactId
    recalcStats()
  }

  // 出售法宝
  function sellArtifact(artifactId: string): number {
    if (!player.value) return 0
    const artifactIndex = player.value.artifacts.findIndex(a => a.id === artifactId)
    if (artifactIndex === -1) return 0
    
    const artifact = player.value.artifacts[artifactIndex]
    
    // 计算出售价格（根据品质和等级）
    const qualityMultipliers: Record<string, number> = {
      common: 100,
      good: 300,
      rare: 800,
      epic: 2000,
      legendary: 5000
    }
    const basePrice = qualityMultipliers[artifact.quality] || 100
    const levelBonus = artifact.level * 50
    const sellPrice = Math.floor(basePrice + levelBonus)
    
    // 如果出售的是已装备的法宝，先卸下
    if (player.value.equippedArtifactId === artifactId) {
      player.value.equippedArtifactId = undefined
    }
    
    // 移除法宝并增加灵石
    player.value.artifacts.splice(artifactIndex, 1)
    player.value.spiritStones += sellPrice
    
    recalcStats()
    return sellPrice
  }

  // ==================== 自动出售系统 ====================
  
  // 品质优先级（数值越高品质越高）
  const QUALITY_ORDER: EquipmentQuality[] = ['common', 'good', 'rare', 'epic', 'legendary']
  
  // 获取品质等级数值
  function getQualityLevel(quality: string): number {
    return QUALITY_ORDER.indexOf(quality as EquipmentQuality)
  }
  
  // 计算装备出售价格
  function getEquipmentSellPrice(equipment: Equipment): number {
    const prices: Record<string, number> = {
      common: 10, good: 30, rare: 80, epic: 200, legendary: 500
    }
    let price = prices[equipment.quality] || 10
    // 套装装备价格翻倍
    if (equipment.setId) price = price * 2
    return price
  }
  
  // 更新自动出售设置
  function updateAutoSellSetting(setting: Partial<AutoSellSetting>) {
    if (!player.value) return
    if (!player.value.autoSellSetting) {
      player.value.autoSellSetting = {
        enabled: false,
        minQuality: 'common',
        sellSetEquipment: false
      }
    }
    Object.assign(player.value.autoSellSetting, setting)
    saveGame()
  }
  
  // 处理装备自动出售
  function processAutoSell(equipment: Equipment): { sold: boolean; price: number } {
    if (!player.value?.autoSellSetting || !player.value.autoSellSetting.enabled) {
      return { sold: false, price: 0 }
    }
    
    const setting = player.value.autoSellSetting
    const equipQualityLevel = getQualityLevel(equipment.quality)
    const minQualityLevel = getQualityLevel(setting.minQuality)
    
    // 检查是否需要自动出售
    // 装备品质低于设置阈值时才自动出售
    if (equipQualityLevel >= minQualityLevel) {
      return { sold: false, price: 0 }
    }
    
    // 检查套装装备设置
    if (equipment.setId && !setting.sellSetEquipment) {
      return { sold: false, price: 0 }
    }
    
    // 执行出售
    const price = getEquipmentSellPrice(equipment)
    player.value.spiritStones += price
    
    return { sold: true, price }
  }
  
  // 手动执行背包自动出售（根据当前设置）
  function sellInventoryByAutoSettings(): { count: number; price: number } {
    if (!player.value) return { count: 0, price: 0 }
    
    const setting = player.value.autoSellSetting
    if (!setting?.enabled) return { count: 0, price: 0 }
    
    let totalCount = 0
    let totalPrice = 0
    
    // 遍历背包，找到需要自动出售的装备
    const toSell: number[] = []
    player.value.inventory.forEach((item, index) => {
      const equipQualityLevel = getQualityLevel(item.quality)
      const minQualityLevel = getQualityLevel(setting.minQuality)
      
      // 检查是否低于设置阈值
      if (equipQualityLevel >= minQualityLevel) return
      
      // 检查套装设置
      if (item.setId && !setting.sellSetEquipment) return
      
      toSell.push(index)
      totalPrice += getEquipmentSellPrice(item)
      totalCount++
    })
    
    // 从后往前删除（避免索引变化）
    for (let i = toSell.length - 1; i >= 0; i--) {
      player.value.inventory.splice(toSell[i], 1)
    }
    
    if (totalCount > 0) {
      player.value.spiritStones += totalPrice
    }
    
    return { count: totalCount, price: totalPrice }
  }

  // 使用法宝技能
  function useArtifactSkill() {
    if (!player.value || !player.value.equippedArtifactId) return null
    const artifact = player.value.artifacts.find(a => a.id === player.value!.equippedArtifactId)
    if (artifact && artifact.skill.currentCooldown <= 0) {
      artifact.skill.currentCooldown = artifact.skill.cooldown
      return artifact.skill
    }
    return null
  }

  // 重新计算属性
  function recalcStats() {
    if (!player.value) return
    const realm = REALMS[player.value.realmIndex]
    // 基础属性 = 大境界加成 + 层数加成
    let baseHp = 100 + player.value.realmIndex * 50 + player.value.realmLevel * 10
    let baseAttack = 10 + player.value.realmIndex * 8 + player.value.realmLevel * 2
    let baseDefense = 5 + player.value.realmIndex * 5 + player.value.realmLevel * 1
    
    // 装备加成（包含强化加成）
    for (const item of Object.values(player.value.equipment)) {
      if (item) {
        const multiplier = getEnhancementMultiplier(item.enhancementLevel || 0)
        baseHp += Math.floor(item.hpBonus * multiplier)
        baseAttack += Math.floor(item.attackBonus * multiplier)
        baseDefense += Math.floor(item.defenseBonus * multiplier)
      }
    }
    
    // 法宝加成
    if (player.value.equippedArtifactId) {
      const artifact = player.value.artifacts.find(a => a.id === player.value!.equippedArtifactId)
      if (artifact) {
        baseHp += artifact.hpBonus
        baseAttack += artifact.attackBonus
        baseDefense += artifact.defenseBonus
      }
    }
    
    // 灵宠加成
    if (player.value.currentPetId) {
      const pet = player.value.pets.find(p => p.id === player.value!.currentPetId)
      if (pet) {
        baseAttack += pet.attack
        baseDefense += pet.defense
      }
    }
    
    // 功法加成（固定值）
    const techBonus = techniqueBonuses.value
    baseHp += techBonus.hpBonus
    baseAttack += techBonus.attackBonus
    baseDefense += techBonus.defenseBonus
    
    // 套装效果加成（百分比）
    const bonuses = setBonuses.value
    if (bonuses.hpPercent > 0) {
      baseHp = Math.floor(baseHp * (1 + bonuses.hpPercent / 100))
    }
    if (bonuses.attackPercent > 0) {
      baseAttack = Math.floor(baseAttack * (1 + bonuses.attackPercent / 100))
    }
    if (bonuses.defensePercent > 0) {
      baseDefense = Math.floor(baseDefense * (1 + bonuses.defensePercent / 100))
    }
    
    player.value.maxHp = baseHp
    player.value.attack = baseAttack
    player.value.defense = baseDefense
    if (player.value.hp > player.value.maxHp) {
      player.value.hp = player.value.maxHp
    }
  }

  // 保存游戏（后端 SQLite + localStorage 双写）
  async function saveGame() {
    if (player.value) {
      player.value.lastOnline = Date.now()
      const data = player.value
      const characterName = player.value.name

      // 写入后端 SQLite
      try {
        await saveToDB(characterName, data)
      } catch (e) {
        console.error('后端保存失败，回退到 localStorage:', e)
      }
      // localStorage 作为本地备份
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  }

  // 加载游戏（优先后端 SQLite，回退 localStorage）
  async function loadGame(): Promise<boolean> {
    // 1. 先尝试从后端 SQLite 加载
    try {
      if (player.value?.name) {
        const data = await loadFromDB(player.value.name)
        if (data) {
          player.value = data as Player
          applySaveCompatAndStart()
          return true
        }
      }
    } catch (e) {
      console.warn('后端加载失败，尝试 localStorage:', e)
    }

    // 2. 回退到 localStorage
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        player.value = JSON.parse(saved)

        // 将 localStorage 存档同步到后端（自动迁移）
        try {
          await saveToDB(player.value.name, player.value)
        } catch (e) {
          console.warn('localStorage → 后端同步失败:', e)
        }

        applySaveCompatAndStart()
        return true
      } catch (e) {
        console.error('localStorage 存档解析失败:', e)
      }
    }

    return false
  }

  // 存档兼容性处理 + 启动游戏
  function applySaveCompatAndStart() {
    if (!player.value) return
    
    // 兼容旧存档：如果没有阵法数据，初始化阵法
    if (!player.value!.formation) {
      const firstFormation = FORMATION_CONFIGS[0]
      player.value!.formation = {
        formationId: firstFormation.id,
        nodes: firstFormation.nodes.map(n => ({
          type: n.type,
          level: 0,
          activated: false
        })),
        realmIndex: 0
      }
    }
    
    // 兼容旧存档：如果没有已解锁阵法列表，初始化
    if (!player.value!.unlockedFormations) {
      player.value!.unlockedFormations = [FORMATION_CONFIGS[0].id]
      // 根据当前境界解锁对应阵法
      for (let i = 1; i <= player.value!.realmIndex; i++) {
        if (FORMATION_CONFIGS[i]) {
          player.value!.unlockedFormations.push(FORMATION_CONFIGS[i].id)
        }
      }
    }
    
    // 兼容旧存档：如果没有功法数据，初始化功法
    if (!player.value!.techniques) {
      player.value!.techniques = []
    }
    if (!player.value!.equippedTechniqueIds) {
      player.value!.equippedTechniqueIds = []
    }
    
    // 兼容旧存档：Engine系统字段
    if (!player.value!.level) {
      player.value!.level = player.value!.realmIndex * 10 + player.value!.realmLevel + 1
    }
    if (!player.value!.mp) {
      player.value!.mp = 100
      player.value!.maxMp = 100
    }
    if (!player.value!.sp) {
      player.value!.sp = 0
      player.value!.maxSp = 100
    }
    if (!player.value!.spiritRoot) {
      player.value!.spiritRoot = Math.floor(Math.random() * 5) + 5
    }
    
    // 战斗属性
    if (!player.value!.critRate) player.value!.critRate = 0.15
    if (!player.value!.critDamage) player.value!.critDamage = 1.8
    if (!player.value!.dodgeRate) player.value!.dodgeRate = 0.08
    if (!player.value!.hitRate) player.value!.hitRate = 0.95
    if (!player.value!.attackSpeed) player.value!.attackSpeed = 1
    if (!player.value!.lifesteal) player.value!.lifesteal = 0
    if (!player.value!.damageReduction) player.value!.damageReduction = 0
    if (!player.value!.reflectDamage) player.value!.reflectDamage = 0
    
    // 修炼属性
    if (!player.value!.wisdom) player.value!.wisdom = 10
    if (!player.value!.willpower) player.value!.willpower = 10
    if (!player.value!.insight) player.value!.insight = 0
    if (!player.value!.maxInsight) player.value!.maxInsight = 100
    
    // Engine系统数据
    if (!player.value!.buffs) player.value!.buffs = []
    if (!player.value!.shields) player.value!.shields = []
    if (!player.value!.injuries) player.value!.injuries = []
    if (!player.value!.learnedSkills) player.value!.learnedSkills = []
    
    // 初始化游戏系统
    initGameSystem()
    
    startCultivation()
    
    // 离线收益（50%，最多24小时）- 现在考虑阵法加成
    const offlineTime = Math.min(Date.now() - player.value!.lastOnline, 86400000)
    const offlineSeconds = offlineTime / 1000
    const realm = REALMS[player.value!.realmIndex]
    const offlineSpiritBase = realm.spiritPerSec * 0.5
    const offlineSpiritBonus = (setBonuses.value.spiritPerSecBonus + formationBonus.value.spiritBonus) * 0.5
    const offlineSpirit = Math.floor(offlineSeconds * (offlineSpiritBase + offlineSpiritBonus))
    if (offlineSpirit > 0) {
      const offlineCapacityBonus = formationBonus.value.capacityBonus
      player.value!.spiritEnergy = Math.min(
        player.value!.spiritEnergy + offlineSpirit,
        realm.spiritCap + offlineCapacityBonus
      )
    }
    recalcStats()
  }

  // 删除存档（同时删除后端 SQLite 和 localStorage）
  async function deleteGame() {
    stopCultivation()
    if (player.value) {
      try {
        await deleteFromDB(player.value.name)
      } catch (e) {
        console.warn('后端删除失败:', e)
      }
    }
    localStorage.removeItem(STORAGE_KEY)
    player.value = null
  }

  return {
    player,
    currentRealm,
    totalLevel,
    realmProgress,
    realmProgressMax,
    hasAccount,
    hasCharacter,
    activeSetInfo,
    setBonuses,
    techniqueBonuses,
    equippedTechniques,
    activeFormationConfig,
    formationBonus,
    createPlayer,
    bindToAccount,
    startCultivation,
    stopCultivation,
    checkAndAdvanceRealmProgress,
    breakThrough,
    addExp,
    addSpiritStones,
    takeDamage,
    heal,
    fullHeal,
    equipItem,
    unequipItem,
    enhanceEquipment,
    getEnhancementCost,
    getEnhancementMultiplier,
    addPet,
    feedPet,
    awakenPet,
    addArtifact,
    equipArtifact,
    sellArtifact,
    useArtifactSkill,
    addTechnique,
    equipTechnique,
    upgradeFormationNode,
    activateFormation,
    unlockFormation,
    getNodeUpgradeCost,
    recalcStats,
    saveGame,
    loadGame,
    deleteGame,
    getRealmLevelExpNeeded,
    // 自动出售
    updateAutoSellSetting,
    processAutoSell,
    sellInventoryByAutoSettings,
    getEquipmentSellPrice
  }
})
