<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { QUALITIES, SET_CONFIGS, TECHNIQUE_QUALITIES } from '@/types/game'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Equipment, EquipmentType, EquipmentSlots, Technique, EquipmentQuality } from '@/types/game'

// 自动出售设置
const autoSellEnabled = ref(false)
const autoSellMinQuality = ref<EquipmentQuality>('common')
const autoSellSellSetEquipment = ref(false)

// 初始化自动出售设置
function initAutoSellSettings() {
  if (player.value?.autoSellSetting) {
    autoSellEnabled.value = player.value.autoSellSetting.enabled
    autoSellMinQuality.value = player.value.autoSellSetting.minQuality
    autoSellSellSetEquipment.value = player.value.autoSellSetting.sellSetEquipment
  }
}

// 监听 player 变化，初始化设置
const autoSellInitialized = ref(false)
watch(() => player.value, () => {
  if (player.value && !autoSellInitialized.value) {
    initAutoSellSettings()
    autoSellInitialized.value = true
  }
}, { immediate: true })

// 更新自动出售设置
function updateAutoSell() {
  playerStore.updateAutoSellSetting({
    enabled: autoSellEnabled.value,
    minQuality: autoSellMinQuality.value,
    sellSetEquipment: autoSellSellSetEquipment.value
  })
  if (autoSellEnabled.value) {
    ElMessage.success('自动出售已开启')
  } else {
    ElMessage.info('自动出售已关闭')
  }
}

// 手动执行一键自动出售
function executeAutoSell() {
  const result = playerStore.sellInventoryByAutoSettings()
  if (result.count > 0) {
    ElMessage.success(`已自动出售 ${result.count} 件装备，获得 ${result.price} 灵石`)
  } else {
    ElMessage.info('没有符合自动出售条件的装备')
  }
}

// 品质选项
const qualityOptions: EquipmentQuality[] = ['common', 'good', 'rare', 'epic', 'legendary']

function getQualityLabel(quality: EquipmentQuality): string {
  return QUALITIES[quality]?.name || '普通'
}

const playerStore = usePlayerStore()
const player = computed(() => playerStore.player)

const inventory = computed(() => player.value?.inventory || [])
const equipped = computed(() => player.value?.equipment || {
  weapon: undefined,
  armor: undefined,
  helmet: undefined,
  pants: undefined,
  boots: undefined,
  necklace: undefined,
  ring1: undefined,
  ring2: undefined
} as EquipmentSlots)

// 功法相关
const learnedTechniques = computed(() => player.value?.techniques || [])
const equippedTechniques = computed(() => playerStore.equippedTechniques)
const techniqueBonuses = computed(() => playerStore.techniqueBonuses)

function getTechniqueQualityColor(quality: string) {
  return TECHNIQUE_QUALITIES[quality as keyof typeof TECHNIQUE_QUALITIES]?.color || '#9e9e9e'
}

function getTechniqueQualityName(quality: string) {
  return TECHNIQUE_QUALITIES[quality as keyof typeof TECHNIQUE_QUALITIES]?.name || '普通'
}

function toggleTechnique(technique: Technique) {
  playerStore.equipTechnique(technique.id)
  const isEquipped = player.value?.equippedTechniqueIds.includes(technique.id)
  ElMessage.success(isEquipped ? `已装备功法【${technique.name}】` : `已卸下功法【${technique.name}】`)
}

function getEffectIcon(type: string) {
  const icons: Record<string, string> = {
    attackBonus: '⚔️', defenseBonus: '🛡️', hpBonus: '❤️', critRate: '💥',
    critDamage: '💫', dodgeRate: '💨', lifesteal: '🩸', spiritPerSec: '💎',
    damageReduction: '🔰', reflectDamage: '🔄', regenPerSec: '💚'
  }
  return icons[type] || '✨'
}

function getEffectName(type: string) {
  const names: Record<string, string> = {
    attackBonus: '攻击', defenseBonus: '防御', hpBonus: '生命', critRate: '暴击率',
    critDamage: '暴击伤害', dodgeRate: '闪避率', lifesteal: '吸血', spiritPerSec: '灵气/秒',
    damageReduction: '减伤', reflectDamage: '反弹伤害', regenPerSec: '生命回复'
  }
  return names[type] || type
}

// 固定值 vs 百分比
const FIXED_VALUE_TYPES = new Set(['attackBonus', 'defenseBonus', 'hpBonus', 'spiritPerSec', 'regenPerSec'])
function formatEffectValue(type: string, value: number): string {
  if (FIXED_VALUE_TYPES.has(type)) return `+${value}`
  return `+${value}%`
}

// 套装信息
const activeSetInfo = computed(() => playerStore.activeSetInfo)
const setBonuses = computed(() => playerStore.setBonuses)

// 获取套装名称
function getSetName(setId?: string) {
  if (!setId) return ''
  const config = SET_CONFIGS.find(s => s.id === setId)
  return config?.name || ''
}

// 获取套装颜色
function getSetColor(setId?: string) {
  if (!setId) return '#9e9e9e'
  const config = SET_CONFIGS.find(s => s.id === setId)
  return config?.color || '#9e9e9e'
}

// 判断装备是否为套装装备
function isSetEquipment(item: Equipment) {
  return !!item.setId
}

// 获取已激活的套装部件图标
const equippedSetPieces = computed(() => {
  if (!activeSetInfo.value.setId) return []
  const mask = activeSetInfo.value.equippedMask || 0
  const pieces: number[] = []
  for (let i = 0; i < 6; i++) {
    if (mask & (1 << i)) pieces.push(i)
  }
  return pieces
})

function getQualityColor(quality: string) {
  return QUALITIES[quality as keyof typeof QUALITIES]?.color || '#9e9e9e'
}

function getQualityName(quality: string) {
  return QUALITIES[quality as keyof typeof QUALITIES]?.name || '普通'
}

function getEquipTypeName(type: string) {
  const names: Record<string, string> = {
    weapon: '武器', armor: '胸甲', helmet: '头盔', pants: '裤子', boots: '靴子', necklace: '项链', ring: '戒指'
  }
  return names[type] || type
}

// 人形装备槽配置
const equipSlots: { key: EquipmentType; icon: string; label: string }[] = [
  { key: 'helmet', icon: '🪖', label: '头盔' },
  { key: 'necklace', icon: '📿', label: '项链' },
  { key: 'weapon', icon: '⚔️', label: '武器' },
  { key: 'armor', icon: '🛡️', label: '胸甲' },
  { key: 'pants', icon: '👖', label: '裤子' },
  { key: 'boots', icon: '👢', label: '靴子' },
  { key: 'ring', icon: '💍', label: '戒指' }
]

function equipItem(item: Equipment) {
  playerStore.equipItem(item)
  const idx = player.value!.inventory.findIndex(i => i.id === item.id)
  if (idx > -1) {
    player.value!.inventory.splice(idx, 1)
  }
  ElMessage.success(`已装备 ${item.name}`)
}

function unequipItem(slot: string) {
  playerStore.unequipItem(slot as any)
  ElMessage.info('已卸下装备')
}

function sellItem(item: Equipment) {
  const prices: Record<string, number> = { common: 10, good: 30, rare: 80, epic: 200, legendary: 800 }
  const price = prices[item.quality] || 10
  // 套装装备价格更高
  const finalPrice = item.setId ? price * 2 : price

  ElMessageBox.confirm(
    `确定出售 ${item.name}${item.setId ? '【套装】' : ''} 获得 ${finalPrice} 灵石？`,
    '出售确认',
    { confirmButtonText: '出售', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    playerStore.addSpiritStones(finalPrice)
    const idx = player.value!.inventory.findIndex(i => i.id === item.id)
    if (idx > -1) {
      player.value!.inventory.splice(idx, 1)
    }
    ElMessage.success(`获得 ${finalPrice} 灵石`)
  }).catch(() => {})
}

// 背包物品分类筛选
const filterType = ref<string>('all')
const equipTypes: EquipmentType[] = ['weapon', 'armor', 'helmet', 'pants', 'boots', 'necklace', 'ring']

const filteredInventory = computed(() => {
  if (filterType.value === 'all') return inventory.value
  return inventory.value.filter(item => item.type === filterType.value)
})

const typeIcons: Record<string, string> = {
  weapon: '⚔️', armor: '🛡️', helmet: '🪖', pants: '👖', boots: '👢', necklace: '📿', ring: '💍'
}

// 灵宠切换
function selectPet(petId: string) {
  if (!player.value) return
  if (player.value.currentPetId === petId) {
    player.value.currentPetId = undefined
    ElMessage.info('灵宠已休息')
  } else {
    player.value.currentPetId = petId
    const pet = player.value.pets.find(p => p.id === petId)
    ElMessage.success(`灵宠 ${pet?.name || ''} 上阵！`)
  }
  playerStore.recalcStats()
}

function getPetGradeStars(grade: number) {
  return '⭐'.repeat(grade)
}

// ==================== 一键出售功能（优化版） ====================
const sellQuality = ref<string>('')

// 出售分类选项 - 拆分仙器和套装
const sellCategories = [
  { key: 'all', name: '全部', color: '#ffffff', icon: '📦' },
  { key: 'common', name: '普通', color: '#9e9e9e', price: 10 },
  { key: 'good', name: '优秀', color: '#4caf50', price: 30 },
  { key: 'rare', name: '稀有', color: '#2196f3', price: 80 },
  { key: 'epic', name: '史诗', color: '#9c27b0', price: 200 },
  { key: 'legendary', name: '仙器', color: '#ff9800', price: 500, filter: (item: Equipment) => item.quality === 'legendary' && !item.setId },
  { key: 'legendary_set', name: '套装', color: '#ffd700', price: 1000, filter: (item: Equipment) => item.quality === 'legendary' && !!item.setId }
]

// 计算选中分类的物品
const sellCategoryItems = computed(() => {
  if (!sellQuality.value) return []
  if (sellQuality.value === 'all') return inventory.value
  const category = sellCategories.find(c => c.key === sellQuality.value)
  if (!category) return []
  if ('filter' in category && category.filter) {
    return inventory.value.filter(category.filter as (item: Equipment) => boolean)
  }
  return inventory.value.filter(item => item.quality === sellQuality.value)
})

// 计算选中物品的总价值
const sellTotalPrice = computed(() => {
  let total = 0
  sellCategoryItems.value.forEach(item => {
    let price = 10
    if (item.quality === 'common') price = 10
    else if (item.quality === 'good') price = 30
    else if (item.quality === 'rare') price = 80
    else if (item.quality === 'epic') price = 200
    else if (item.quality === 'legendary') price = item.setId ? 1000 : 500
    total += price
  })
  return total
})

function sellByCategory() {
  if (!sellQuality.value || sellCategoryItems.value.length === 0) {
    ElMessage.warning('请先选择要出售的分类')
    return
  }

  const category = sellCategories.find(c => c.key === sellQuality.value)
  const categoryName = category ? ('name' in category ? category.name : '全部') : ''
  const count = sellCategoryItems.value.length
  const totalPrice = sellTotalPrice.value

  ElMessageBox.confirm(
    `确定出售 ${count} 件${categoryName}装备，获得 ${totalPrice} 灵石？`,
    '一键出售确认',
    { confirmButtonText: '确认出售', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    // 移除所有选中分类的物品
    const toSell = [...sellCategoryItems.value]
    toSell.forEach(item => {
      const idx = player.value!.inventory.findIndex(i => i.id === item.id)
      if (idx > -1) {
        player.value!.inventory.splice(idx, 1)
      }
    })
    playerStore.addSpiritStones(totalPrice)
    ElMessage.success(`已出售 ${count} 件装备，获得 ${totalPrice} 灵石`)
    sellQuality.value = ''
  }).catch(() => {})
}

// 一键出售全部（排除仙器和套装）
function sellAllExceptLegendary() {
  const toSell = inventory.value.filter(item =>
    item.quality !== 'legendary'
  )

  if (toSell.length === 0) {
    ElMessage.info('没有可出售的装备')
    return
  }

  let totalPrice = 0
  toSell.forEach(item => {
    let price = 10
    if (item.quality === 'common') price = 10
    else if (item.quality === 'good') price = 30
    else if (item.quality === 'rare') price = 80
    else if (item.quality === 'epic') price = 200
    totalPrice += price
  })

  ElMessageBox.confirm(
    `确定出售 ${toSell.length} 件装备（排除仙器和套装），获得 ${totalPrice} 灵石？`,
    '一键出售确认',
    { confirmButtonText: '确认出售', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    toSell.forEach(item => {
      const idx = player.value!.inventory.findIndex(i => i.id === item.id)
      if (idx > -1) {
        player.value!.inventory.splice(idx, 1)
      }
    })
    playerStore.addSpiritStones(totalPrice)
    ElMessage.success(`已出售 ${toSell.length} 件装备，获得 ${totalPrice} 灵石`)
  }).catch(() => {})
}

function selectCategoryForSell(key: string) {
  sellQuality.value = sellQuality.value === key ? '' : key
}

// ==================== 装备强化功能 ====================
const enhancingItem = ref<Equipment | null>(null)
const showEnhanceDialog = computed({
  get: () => enhancingItem.value !== null,
  set: (val: boolean) => { if (!val) closeEnhanceDialog() }
})

function getEnhancementCost(level: number): number {
  return playerStore.getEnhancementCost(level)
}

function getEnhancementMultiplier(level: number): number {
  return playerStore.getEnhancementMultiplier(level)
}

function getEnhancedBonus(item: Equipment): { attack: number; defense: number; hp: number } {
  const level = item.enhancementLevel || 0
  const multiplier = getEnhancementMultiplier(level)
  return {
    attack: Math.floor(item.attackBonus * multiplier),
    defense: Math.floor(item.defenseBonus * multiplier),
    hp: Math.floor(item.hpBonus * multiplier)
  }
}

function openEnhanceDialog(item: Equipment) {
  enhancingItem.value = item
}

function closeEnhanceDialog() {
  enhancingItem.value = null
}

function enhanceItem() {
  if (!enhancingItem.value) return

  const item = enhancingItem.value
  const currentLevel = item.enhancementLevel || 0
  const cost = getEnhancementCost(currentLevel)

  if (player.value!.spiritStones < cost) {
    ElMessage.warning(`灵石不足！需要 ${cost} 灵石，当前拥有 ${player.value!.spiritStones} 灵石`)
    return
  }

  // 检查装备是否在背包中
  const inventoryIndex = player.value!.inventory.findIndex(i => i.id === item.id)
  const fromInventory = inventoryIndex > -1

  const result = playerStore.enhanceEquipment(item.id, fromInventory)

  if (result.success) {
    ElMessage.success(result.message)
    closeEnhanceDialog()
  } else {
    ElMessage.error(result.message)
  }
}

function enhanceEquippedItem(slotKey: string) {
  // 从已装备中获取
  const equipment = player.value!.equipment as Record<string, Equipment | null>
  const item = equipment[slotKey]
  if (!item) return

  const currentLevel = item.enhancementLevel || 0
  const cost = getEnhancementCost(currentLevel)

  if (player.value!.spiritStones < cost) {
    ElMessage.warning(`灵石不足！需要 ${cost} 灵石，当前拥有 ${player.value!.spiritStones} 灵石`)
    return
  }

  const result = playerStore.enhanceEquipment(item.id, false)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// ==================== 装备详情对话框 ====================
const selectedEquip = ref<Equipment | null>(null)
const selectedEquipSlot = ref<string>('')
const showEquipDetailDialog = ref(false)

function openEquipDetail(item: Equipment, slot: string) {
  selectedEquip.value = item
  selectedEquipSlot.value = slot
  showEquipDetailDialog.value = true
}

function closeEquipDetail() {
  selectedEquip.value = null
  selectedEquipSlot.value = ''
  showEquipDetailDialog.value = false
}

function handleEquipAction(action: 'detail' | 'enhance' | 'unequip') {
  if (!selectedEquip.value) return

  const item = selectedEquip.value
  closeEquipDetail()

  if (action === 'detail') {
    openEnhanceDialog(item)
  } else if (action === 'enhance') {
    openEnhanceDialog(item)
  } else if (action === 'unequip') {
    unequipItem(selectedEquipSlot.value)
  }
}

// 点击空槽位的处理
function handleEmptySlotClick(slot: string) {
  // 空槽位可以提示穿上装备
  ElMessage.info('从背包中选择装备进行穿戴')
}
</script>

<template>
  <div class="inventory-panel" v-if="player">
    <!-- 人形装备栏 -->
    <div class="equipped-section game-card">
      <h3 class="section-title">🛡️ 人形装备</h3>
      <div class="human-figure">
        <!-- 头部区域 -->
        <div class="figure-row head-row">
          <div class="equip-slot helmet-slot" @click="equipped.helmet ? openEquipDetail(equipped.helmet, 'helmet') : handleEmptySlotClick('helmet')">
            <template v-if="equipped.helmet">
              <div class="slot-content equipped" :style="{ borderColor: getQualityColor(equipped.helmet.quality) }">
                <span class="slot-icon">🪖</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.helmet.quality) }">{{ equipped.helmet.name }}</span>
                <span class="item-bonus">+{{ equipped.helmet.attackBonus }}/{{ equipped.helmet.defenseBonus }}</span>
                <span v-if="(equipped.helmet.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.helmet.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">🪖</span>
                <span class="slot-label">头盔</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 项链 + 武器 -->
        <div class="figure-row middle-row">
          <div class="equip-slot necklace-slot" @click="equipped.necklace ? openEquipDetail(equipped.necklace, 'necklace') : handleEmptySlotClick('necklace')">
            <template v-if="equipped.necklace">
              <div class="slot-content equipped" :style="{ borderColor: getQualityColor(equipped.necklace.quality) }">
                <span class="slot-icon">📿</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.necklace.quality) }">{{ equipped.necklace.name }}</span>
                <span class="item-bonus">+{{ equipped.necklace.hpBonus }}❤️</span>
                <span v-if="(equipped.necklace.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.necklace.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">📿</span>
                <span class="slot-label">项链</span>
              </div>
            </template>
          </div>

          <div class="figure-center">
            <div class="human-avatar">🧙</div>
            <div class="player-stats-mini">
              <span>⚔️ {{ player.attack }}</span>
              <span>🛡️ {{ player.defense }}</span>
              <span>❤️ {{ player.maxHp }}</span>
            </div>
          </div>

          <div class="equip-slot weapon-slot" @click="equipped.weapon ? openEquipDetail(equipped.weapon, 'weapon') : handleEmptySlotClick('weapon')">
            <template v-if="equipped.weapon">
              <div class="slot-content equipped weapon" :style="{ borderColor: getQualityColor(equipped.weapon.quality) }">
                <span class="slot-icon">⚔️</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.weapon.quality) }">{{ equipped.weapon.name }}</span>
                <span class="item-bonus">+{{ equipped.weapon.attackBonus }}⚔️</span>
                <span v-if="(equipped.weapon.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.weapon.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">⚔️</span>
                <span class="slot-label">武器</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 胸甲 -->
        <div class="figure-row chest-row">
          <div class="equip-slot armor-slot" @click="equipped.armor ? openEquipDetail(equipped.armor, 'armor') : handleEmptySlotClick('armor')">
            <template v-if="equipped.armor">
              <div class="slot-content equipped" :style="{ borderColor: getQualityColor(equipped.armor.quality) }">
                <span class="slot-icon">🛡️</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.armor.quality) }">{{ equipped.armor.name }}</span>
                <span class="item-bonus">+{{ equipped.armor.defenseBonus }}/{{ equipped.armor.hpBonus }}❤️</span>
                <span v-if="(equipped.armor.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.armor.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">🛡️</span>
                <span class="slot-label">胸甲</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 裤子 -->
        <div class="figure-row pants-row">
          <div class="equip-slot pants-slot" @click="equipped.pants ? openEquipDetail(equipped.pants, 'pants') : handleEmptySlotClick('pants')">
            <template v-if="equipped.pants">
              <div class="slot-content equipped" :style="{ borderColor: getQualityColor(equipped.pants.quality) }">
                <span class="slot-icon">👖</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.pants.quality) }">{{ equipped.pants.name }}</span>
                <span class="item-bonus">+{{ equipped.pants.defenseBonus }}🛡️</span>
                <span v-if="(equipped.pants.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.pants.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">👖</span>
                <span class="slot-label">裤子</span>
              </div>
            </template>
          </div>
        </div>

        <!-- 靴子 + 戒指 -->
        <div class="figure-row bottom-row">
          <div class="equip-slot boots-slot" @click="equipped.boots ? openEquipDetail(equipped.boots, 'boots') : handleEmptySlotClick('boots')">
            <template v-if="equipped.boots">
              <div class="slot-content equipped" :style="{ borderColor: getQualityColor(equipped.boots.quality) }">
                <span class="slot-icon">👢</span>
                <span class="item-name" :style="{ color: getQualityColor(equipped.boots.quality) }">{{ equipped.boots.name }}</span>
                <span class="item-bonus">+{{ equipped.boots.defenseBonus }}</span>
                <span v-if="(equipped.boots.enhancementLevel || 0) > 0" class="slot-enhance-badge">+{{ equipped.boots.enhancementLevel }}</span>
              </div>
            </template>
            <template v-else>
              <div class="slot-content empty">
                <span class="slot-icon">👢</span>
                <span class="slot-label">靴子</span>
              </div>
            </template>
          </div>

          <div class="ring-slots">
            <div class="equip-slot ring1-slot" @click="equipped.ring1 ? openEquipDetail(equipped.ring1, 'ring1') : handleEmptySlotClick('ring1')">
              <template v-if="equipped.ring1">
                <div class="slot-content equipped small" :style="{ borderColor: getQualityColor(equipped.ring1.quality) }">
                  <span class="slot-icon">💍</span>
                  <span class="item-name small" :style="{ color: getQualityColor(equipped.ring1.quality) }">{{ equipped.ring1.name }}</span>
                  <span v-if="(equipped.ring1.enhancementLevel || 0) > 0" class="slot-enhance-badge small">+{{ equipped.ring1.enhancementLevel }}</span>
                </div>
              </template>
              <template v-else>
                <div class="slot-content empty small">
                  <span class="slot-icon">💍</span>
                  <span class="slot-label">戒指</span>
                </div>
              </template>
            </div>
            <div class="equip-slot ring2-slot" @click="equipped.ring2 ? openEquipDetail(equipped.ring2, 'ring2') : handleEmptySlotClick('ring2')">
              <template v-if="equipped.ring2">
                <div class="slot-content equipped small" :style="{ borderColor: getQualityColor(equipped.ring2.quality) }">
                  <span class="slot-icon">💍</span>
                  <span class="item-name small" :style="{ color: getQualityColor(equipped.ring2.quality) }">{{ equipped.ring2.name }}</span>
                  <span v-if="(equipped.ring2.enhancementLevel || 0) > 0" class="slot-enhance-badge small">+{{ equipped.ring2.enhancementLevel }}</span>
                </div>
              </template>
              <template v-else>
                <div class="slot-content empty small">
                  <span class="slot-icon">💍</span>
                  <span class="slot-label">戒指</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 套装信息显示 -->
      <div class="set-info" v-if="activeSetInfo.setConfig">
        <div class="set-header" :style="{ borderColor: activeSetInfo.setConfig.color }">
          <span class="set-icon">✨</span>
          <span class="set-name" :style="{ color: activeSetInfo.setConfig.color }">
            {{ activeSetInfo.setConfig.name }}
          </span>
          <span class="set-count">{{ activeSetInfo.piecesCount }}/6 件</span>
        </div>
        
        <!-- 套装部件进度 -->
        <div class="set-pieces">
          <div 
            v-for="(piece, index) in activeSetInfo.setConfig.prefix" 
            :key="index"
            class="piece-dot"
            :class="{ active: equippedSetPieces.includes(index) }"
            :style="{ 
              background: equippedSetPieces.includes(index) ? activeSetInfo.setConfig.color : 'transparent',
              borderColor: activeSetInfo.setConfig.color 
            }"
          >
            {{ ['武', '头', '甲', '裤', '靴', '坠'][index] }}
          </div>
        </div>
        
        <!-- 套装效果 -->
        <div class="set-bonuses">
          <div 
            v-for="bonus in activeSetInfo.setConfig.bonuses" 
            :key="bonus.pieces"
            class="bonus-item"
            :class="{ active: activeSetInfo.piecesCount >= bonus.pieces }"
          >
            <span class="bonus-pieces">{{ bonus.pieces }}件</span>
            <span class="bonus-name">{{ bonus.name }}</span>
            <span class="bonus-desc">{{ bonus.description }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 背包 -->
    <div class="inventory-section game-card">
      <div class="inventory-header">
        <h3 class="section-title">📦 背包 ({{ filteredInventory.length }})</h3>
        <span class="stone-count">💎 {{ player.spiritStones }} 灵石</span>
      </div>

      <!-- 自动出售设置 -->
      <div class="auto-sell-section">
        <div class="auto-sell-header">
          <span class="auto-sell-title">🤖 自动出售</span>
          <el-switch
            v-model="autoSellEnabled"
            size="small"
            @change="updateAutoSell"
            active-text="开启"
            inactive-text="关闭"
          />
        </div>
        <div class="auto-sell-settings" v-if="autoSellEnabled">
          <div class="setting-row">
            <span class="setting-label">自动出售</span>
            <el-select 
              v-model="autoSellMinQuality" 
              size="small" 
              class="quality-select"
              @change="updateAutoSell"
            >
              <el-option
                v-for="q in qualityOptions"
                :key="q"
                :label="getQualityLabel(q)"
                :value="q"
              >
                <span :style="{ color: QUALITIES[q].color }">{{ getQualityLabel(q) }}</span>
              </el-option>
            </el-select>
            <span class="setting-desc">以下的装备</span>
          </div>
          <div class="setting-row">
            <span class="setting-label">套装装备</span>
            <el-switch
              v-model="autoSellSellSetEquipment"
              size="small"
              @change="updateAutoSell"
              active-text="自动出售"
              inactive-text="保留"
            />
          </div>
          <el-button type="warning" size="small" plain @click="executeAutoSell" class="execute-btn">
            一键出售背包中符合条件的装备
          </el-button>
        </div>
      </div>

      <!-- 一键出售区域 -->
      <div class="quick-sell-section">
        <div class="quick-sell-header">
          <span class="quick-sell-title">💰 一键出售</span>
          <el-button type="info" size="small" plain @click="sellAllExceptLegendary" v-if="inventory.filter(i => i.quality !== 'legendary').length > 0">
            出售全部非仙器
          </el-button>
        </div>

        <div class="category-sell-buttons">
          <button
            v-for="cat in sellCategories"
            :key="cat.key"
            class="category-sell-btn"
            :class="{ active: sellQuality === cat.key }"
            :style="{
              '--cat-color': cat.color,
              borderColor: sellQuality === cat.key ? cat.color : 'transparent'
            }"
            @click="selectCategoryForSell(cat.key)"
          >
            <span class="cat-icon">{{ 'icon' in cat ? cat.icon : '' }}</span>
            <span class="cat-name">{{ cat.name }}</span>
            <span class="cat-count">
              {{ cat.key === 'all'
                ? inventory.length
                : sellCategories.find(c => c.key === cat.key)?.key === 'legendary_set'
                  ? inventory.filter((i: Equipment) => i.quality === 'legendary' && !!i.setId).length
                  : inventory.filter((i: Equipment) => cat.key === 'legendary' ? (i.quality === 'legendary' && !i.setId) : i.quality === cat.key).length
              }}
            </span>
          </button>
        </div>

        <div class="sell-action" v-if="sellQuality && sellCategoryItems.length > 0">
          <span class="sell-preview">
            将出售 <strong :style="{ color: sellCategories.find(c => c.key === sellQuality)?.color || '#fff' }">{{ sellCategoryItems.length }}</strong> 件装备
            获得 <strong style="color: var(--accent-gold)">{{ sellTotalPrice }}</strong> 灵石
          </span>
          <el-button type="danger" size="small" @click="sellByCategory">
            确认出售
          </el-button>
        </div>
        <div class="sell-hint" v-else-if="sellQuality && sellCategoryItems.length === 0">
          <span class="no-items">该分类没有可出售的装备</span>
        </div>
      </div>

      <!-- 分类筛选 -->
      <div class="filter-tabs">
        <button 
          class="filter-tab" 
          :class="{ active: filterType === 'all' }"
          @click="filterType = 'all'"
        >全部</button>
        <button 
          v-for="type in equipTypes" 
          :key="type"
          class="filter-tab" 
          :class="{ active: filterType === type }"
          @click="filterType = type"
        >
          {{ typeIcons[type] }} {{ getEquipTypeName(type) }}
        </button>
      </div>

      <div class="inventory-grid" v-if="filteredInventory.length > 0">
        <div
          v-for="item in filteredInventory"
          :key="item.id"
          class="inventory-item game-card"
          :class="{ 'set-item': isSetEquipment(item), 'enhanced': (item.enhancementLevel || 0) > 0 }"
          :style="{
            borderLeftColor: isSetEquipment(item) ? getSetColor(item.setId) : getQualityColor(item.quality)
          }"
        >
          <div class="item-header">
            <span class="item-type-icon">{{ typeIcons[item.type] || '📦' }}</span>
            <span class="item-type">{{ getEquipTypeName(item.type) }}</span>
            <span class="item-quality" :style="{ color: getQualityColor(item.quality) }">
              {{ getQualityName(item.quality) }}
            </span>
            <span v-if="isSetEquipment(item)" class="set-tag" :style="{ color: getSetColor(item.setId) }">
              套装
            </span>
            <span v-if="(item.enhancementLevel || 0) > 0" class="enhance-tag">
              +{{ item.enhancementLevel }}
            </span>
          </div>
          <div class="item-name" :style="{ color: getQualityColor(item.quality) }">
            {{ item.name }}
          </div>
          <div class="item-stats">
            <span v-if="(item.enhancementLevel || 0) > 0" class="stat-enhanced">
              ⚔️ +{{ getEnhancedBonus(item).attack }}
            </span>
            <span v-else-if="item.attackBonus > 0">⚔️ +{{ item.attackBonus }}</span>
            <span v-if="(item.enhancementLevel || 0) > 0" class="stat-enhanced">
              🛡️ +{{ getEnhancedBonus(item).defense }}
            </span>
            <span v-else-if="item.defenseBonus > 0">🛡️ +{{ item.defenseBonus }}</span>
            <span v-if="(item.enhancementLevel || 0) > 0" class="stat-enhanced">
              ❤️ +{{ getEnhancedBonus(item).hp }}
            </span>
            <span v-else-if="item.hpBonus > 0">❤️ +{{ item.hpBonus }}</span>
          </div>
          <div class="item-set-name" v-if="isSetEquipment(item)">
            {{ getSetName(item.setId) }}
          </div>
          <div class="item-actions">
            <el-button size="small" type="primary" @click="equipItem(item)">
              装备
            </el-button>
            <el-button size="small" type="warning" @click="openEnhanceDialog(item)">
              强化
            </el-button>
            <el-button size="small" @click="sellItem(item)">
              出售
            </el-button>
          </div>
        </div>
      </div>

      <div class="empty-inventory" v-else>
        <span class="empty-icon">📦</span>
        <p>背包空空如也，快去刷怪吧！</p>
      </div>
    </div>

    <!-- 功法装备区域 -->
    <div class="techniques-section game-card" v-if="learnedTechniques.length > 0">
      <div class="techniques-header">
        <h3 class="section-title">📜 功法（已装备 {{ equippedTechniques.length }}/3）</h3>
        <div class="technique-bonus-summary" v-if="Object.keys(techniqueBonuses).length > 0">
          <span class="bonus-label">功法加成：</span>
          <span v-if="techniqueBonuses.attackBonus" class="bonus-chip">⚔️攻击+{{ techniqueBonuses.attackBonus }}</span>
          <span v-if="techniqueBonuses.defenseBonus" class="bonus-chip">🛡️防御+{{ techniqueBonuses.defenseBonus }}</span>
          <span v-if="techniqueBonuses.hpBonus" class="bonus-chip">❤️生命+{{ techniqueBonuses.hpBonus }}</span>
          <span v-if="techniqueBonuses.critRate" class="bonus-chip">💥暴击+{{ techniqueBonuses.critRate }}%</span>
          <span v-if="techniqueBonuses.critDamage" class="bonus-chip">💫暴伤+{{ techniqueBonuses.critDamage }}%</span>
          <span v-if="techniqueBonuses.dodgeRate" class="bonus-chip">💨闪避+{{ techniqueBonuses.dodgeRate }}%</span>
          <span v-if="techniqueBonuses.lifesteal" class="bonus-chip">🩸吸血+{{ techniqueBonuses.lifesteal }}%</span>
          <span v-if="techniqueBonuses.damageReduction" class="bonus-chip">🔰减伤+{{ techniqueBonuses.damageReduction }}%</span>
          <span v-if="techniqueBonuses.reflectDamage" class="bonus-chip">🔄反弹+{{ techniqueBonuses.reflectDamage }}%</span>
          <span v-if="techniqueBonuses.regenPerSec" class="bonus-chip">💚回复+{{ techniqueBonuses.regenPerSec }}/s</span>
          <span v-if="techniqueBonuses.spiritPerSec" class="bonus-chip">💎灵气+{{ techniqueBonuses.spiritPerSec }}/s</span>
        </div>
      </div>
      
      <!-- 已装备的功法 -->
      <div class="equipped-techniques" v-if="equippedTechniques.length > 0">
        <div 
          v-for="technique in equippedTechniques" 
          :key="technique.id"
          class="equipped-technique-card"
          :style="{ borderColor: getTechniqueQualityColor(technique.quality) }"
          @click="toggleTechnique(technique)"
        >
          <div class="technique-emoji">📜</div>
          <div class="technique-info">
            <div class="technique-name" :style="{ color: getTechniqueQualityColor(technique.quality) }">
              {{ technique.name }}
            </div>
            <div class="technique-quality-tag">
              {{ getTechniqueQualityName(technique.quality) }}
            </div>
          </div>
          <div class="technique-effects-mini">
            <span 
              v-for="(effect, idx) in technique.effects.slice(0, 2)"
              :key="idx"
              class="effect-badge"
            >
              {{ getEffectIcon(effect.type) }}{{ formatEffectValue(effect.type, effect.value) }}
            </span>
          </div>
          <div class="equipped-indicator">已装备 ✓</div>
        </div>
      </div>

      <!-- 未装备的功法槽提示 -->
      <div class="empty-technique-slots" v-if="equippedTechniques.length < 3">
        <span class="slot-hint">还能装备 {{ 3 - equippedTechniques.length }} 个功法</span>
      </div>
      
      <!-- 已领悟但未装备的功法 -->
      <div class="unequipped-techniques" v-if="learnedTechniques.filter(t => !player?.equippedTechniqueIds.includes(t.id)).length > 0">
        <div class="unequipped-title">已领悟（点击装备）</div>
        <div class="unequipped-grid">
          <div 
            v-for="technique in learnedTechniques.filter(t => !player?.equippedTechniqueIds.includes(t.id))" 
            :key="technique.id"
            class="technique-card-mini"
            :style="{ borderColor: getTechniqueQualityColor(technique.quality) + '44' }"
            @click="toggleTechnique(technique)"
          >
            <div class="technique-emoji-small">📜</div>
            <div class="technique-name-small" :style="{ color: getTechniqueQualityColor(technique.quality) }">
              {{ technique.name }}
            </div>
            <div class="technique-effect-preview">
              <span 
              v-for="(effect, idx) in technique.effects.slice(0, 1)"
              :key="idx"
              class="effect-preview-badge"
            >
              {{ getEffectIcon(effect.type) }}{{ formatEffectValue(effect.type, effect.value) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 灵宠选择 -->
    <div class="pets-section game-card" v-if="player.pets.length > 0">
      <div class="pets-header">
        <h3 class="section-title">🐉 灵宠上阵</h3>
        <span class="pets-hint">点击切换灵宠</span>
      </div>
      <div class="pets-grid">
        <div 
          v-for="pet in player.pets" 
          :key="pet.id"
          class="pet-card"
          :class="{ active: pet.id === player.currentPetId }"
          @click="selectPet(pet.id)"
        >
          <div class="pet-avatar">🐲</div>
          <div class="pet-info">
            <div class="pet-name">{{ pet.name }}</div>
            <div class="pet-grade">{{ getPetGradeStars(pet.grade) }}</div>
          </div>
          <div class="pet-stats">
            <span>⚔️ {{ pet.attack }}</span>
            <span>🛡️ {{ pet.defense }}</span>
          </div>
          <div class="pet-level">Lv.{{ pet.level }}</div>
          <div class="pet-status" :class="{ deployed: pet.id === player.currentPetId }">
            {{ pet.id === player.currentPetId ? '⬆️ 出战' : '⬇️ 休息' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 装备详情对话框 -->
    <el-dialog
      v-model="showEquipDetailDialog"
      :title="selectedEquip ? `📦 ${selectedEquip.name}` : '装备详情'"
      width="420px"
      @close="closeEquipDetail"
    >
      <div v-if="selectedEquip" class="equip-detail-content">
        <div class="detail-header">
          <div class="detail-quality-badge" :style="{ backgroundColor: getQualityColor(selectedEquip.quality) }">
            {{ getQualityName(selectedEquip.quality) }}
          </div>
          <div class="detail-type">{{ getEquipTypeName(selectedEquip.type) }}</div>
          <span v-if="isSetEquipment(selectedEquip)" class="detail-set-tag" :style="{ color: getSetColor(selectedEquip.setId) }">
            【{{ getSetName(selectedEquip.setId) }}】
          </span>
          <span v-if="(selectedEquip.enhancementLevel || 0) > 0" class="detail-enhance-tag">
            +{{ selectedEquip.enhancementLevel }}
          </span>
        </div>

        <div class="detail-stats-section">
          <div class="detail-stats-title">📊 属性</div>
          <div class="detail-stats-grid">
            <div class="detail-stat-item">
              <span class="stat-icon">⚔️</span>
              <span class="stat-label">攻击</span>
              <span class="stat-value" :class="{ enhanced: (selectedEquip.enhancementLevel || 0) > 0 }">
                +{{ (selectedEquip.enhancementLevel || 0) > 0 ? getEnhancedBonus(selectedEquip).attack : selectedEquip.attackBonus }}
                <span v-if="(selectedEquip.enhancementLevel || 0) > 0" class="stat-original">
                  ({{ selectedEquip.attackBonus }})
                </span>
              </span>
            </div>
            <div class="detail-stat-item">
              <span class="stat-icon">🛡️</span>
              <span class="stat-label">防御</span>
              <span class="stat-value" :class="{ enhanced: (selectedEquip.enhancementLevel || 0) > 0 }">
                +{{ (selectedEquip.enhancementLevel || 0) > 0 ? getEnhancedBonus(selectedEquip).defense : selectedEquip.defenseBonus }}
                <span v-if="(selectedEquip.enhancementLevel || 0) > 0" class="stat-original">
                  ({{ selectedEquip.defenseBonus }})
                </span>
              </span>
            </div>
            <div class="detail-stat-item">
              <span class="stat-icon">❤️</span>
              <span class="stat-label">生命</span>
              <span class="stat-value" :class="{ enhanced: (selectedEquip.enhancementLevel || 0) > 0 }">
                +{{ (selectedEquip.enhancementLevel || 0) > 0 ? getEnhancedBonus(selectedEquip).hp : selectedEquip.hpBonus }}
                <span v-if="(selectedEquip.enhancementLevel || 0) > 0" class="stat-original">
                  ({{ selectedEquip.hpBonus }})
                </span>
              </span>
            </div>
          </div>
        </div>

        <div class="detail-enhance-info" v-if="(selectedEquip.enhancementLevel || 0) > 0">
          <div class="enhance-info-title">🔨 强化信息</div>
          <div class="enhance-level-display">
            强化等级: <span class="level-highlight">+{{ selectedEquip.enhancementLevel }}</span>
          </div>
          <div class="enhance-multiplier">
            属性倍率: <span class="multiplier-value">{{ (getEnhancementMultiplier(selectedEquip.enhancementLevel!) * 100).toFixed(0) }}%</span>
          </div>
        </div>

        <div class="detail-sell-price">
          💰 出售价格: <strong>{{ selectedEquip.setId ? (playerStore.getEquipmentSellPrice ? playerStore.getEquipmentSellPrice(selectedEquip) : 1000) : (playerStore.getEquipmentSellPrice ? playerStore.getEquipmentSellPrice(selectedEquip) : 500) }}</strong> 灵石
        </div>
      </div>

      <template #footer>
        <div class="detail-dialog-footer">
          <el-button @click="closeEquipDetail">关闭</el-button>
          <el-button type="danger" plain @click="handleEquipAction('unequip')" v-if="selectedEquipSlot !== ''">
            卸下
          </el-button>
          <el-button type="warning" @click="handleEquipAction('enhance')">
            🔨 强化
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 强化对话框 -->
    <el-dialog
      v-model="showEnhanceDialog"
      :title="enhancingItem ? `🔨 强化装备 - ${enhancingItem.name}` : '强化装备'"
      width="400px"
      @close="closeEnhanceDialog"
    >
      <div v-if="enhancingItem" class="enhance-dialog-content">
        <div class="enhance-item-info">
          <div class="enhance-item-name" :style="{ color: getQualityColor(enhancingItem.quality) }">
            {{ enhancingItem.name }}
            <span v-if="isSetEquipment(enhancingItem)" class="set-badge">【套装】</span>
          </div>
          <div class="enhance-item-type">{{ getEquipTypeName(enhancingItem.type) }}</div>
        </div>

        <div class="enhance-level-section">
          <div class="current-level">
            当前等级: <span class="level-badge">+{{ enhancingItem.enhancementLevel || 0 }}</span>
          </div>
          <div class="next-level">
            强化后: <span class="level-badge next">+{{ (enhancingItem.enhancementLevel || 0) + 1 }}</span>
          </div>
        </div>

        <div class="enhance-stats-preview">
          <div class="stats-title">属性预览</div>
          <div class="stats-row">
            <span class="stat-label">⚔️ 攻击</span>
            <span class="stat-current">+{{ enhancingItem.attackBonus }}</span>
            <span class="stat-arrow">→</span>
            <span class="stat-next">+{{ getEnhancedBonus(enhancingItem).attack }}</span>
          </div>
          <div class="stats-row">
            <span class="stat-label">🛡️ 防御</span>
            <span class="stat-current">+{{ enhancingItem.defenseBonus }}</span>
            <span class="stat-arrow">→</span>
            <span class="stat-next">+{{ getEnhancedBonus(enhancingItem).defense }}</span>
          </div>
          <div class="stats-row">
            <span class="stat-label">❤️ 生命</span>
            <span class="stat-current">+{{ enhancingItem.hpBonus }}</span>
            <span class="stat-arrow">→</span>
            <span class="stat-next">+{{ getEnhancedBonus(enhancingItem).hp }}</span>
          </div>
        </div>

        <div class="enhance-cost-section">
          <div class="cost-label">强化费用</div>
          <div class="cost-value">
            <span class="cost-icon">💎</span>
            <span class="cost-amount">{{ getEnhancementCost(enhancingItem.enhancementLevel || 0) }}</span>
            <span class="cost-unit">灵石</span>
          </div>
          <div class="player-stones">
            拥有: {{ player.spiritStones }} 灵石
          </div>
        </div>

        <div class="enhance-bonus-info">
          <span class="bonus-icon">📈</span>
          每级强化增加基础属性 <strong>10%</strong>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeEnhanceDialog">取消</el-button>
          <el-button
            type="warning"
            @click="enhanceItem"
            :disabled="player.spiritStones < getEnhancementCost((enhancingItem?.enhancementLevel || 0))"
          >
            强化
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.inventory-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-right: 4px;
}

.section-title {
  font-size: 1rem;
  margin-bottom: 12px;
}

/* 人形装备栏 */
.equipped-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

/* 套装信息样式 */
.set-info {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-radius: 12px;
  border: 1px solid rgba(168, 85, 247, 0.3);
}

.set-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(168, 85, 247, 0.3);
  margin-bottom: 10px;
}

.set-icon {
  font-size: 1.2rem;
}

.set-name {
  font-weight: 600;
  font-size: 1rem;
}

.set-count {
  margin-left: auto;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.set-pieces {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.piece-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all 0.3s ease;
}

.piece-dot.active {
  color: white;
  box-shadow: 0 0 12px currentColor;
}

.set-bonuses {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bonus-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 0.8rem;
  opacity: 0.5;
  transition: all 0.3s ease;
}

.bonus-item.active {
  opacity: 1;
  background: rgba(168, 85, 247, 0.2);
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.3);
}

.bonus-pieces {
  font-weight: 600;
  color: var(--accent-cyan);
  min-width: 32px;
}

.bonus-name {
  font-weight: 500;
  color: var(--text-primary);
}

.bonus-desc {
  margin-left: auto;
  color: var(--text-secondary);
  font-size: 0.75rem;
}

/* 装备槽强化标签 */
.slot-enhance-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 5px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.slot-enhance-badge.small {
  font-size: 0.6rem;
  padding: 1px 4px;
}

/* 装备详情对话框样式 */
.equip-detail-content {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--border-color);
  margin-bottom: 16px;
}

.detail-quality-badge {
  padding: 4px 12px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.detail-type {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.detail-set-tag {
  font-weight: 600;
  font-size: 0.85rem;
}

.detail-enhance-tag {
  font-size: 0.85rem;
  font-weight: 700;
  color: #f59e0b;
}

.detail-stats-section {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.detail-stats-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.detail-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  background: var(--bg-card);
  border-radius: 10px;
}

.detail-stat-item .stat-icon {
  font-size: 1.2rem;
}

.detail-stat-item .stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.detail-stat-item .stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-cyan);
}

.detail-stat-item .stat-value.enhanced {
  color: #f59e0b;
}

.detail-stat-item .stat-original {
  font-size: 0.7rem;
  color: var(--text-secondary);
  font-weight: normal;
}

.detail-enhance-info {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.enhance-info-title {
  font-size: 0.85rem;
  color: #f59e0b;
  margin-bottom: 8px;
}

.enhance-level-display {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.level-highlight {
  font-weight: 700;
  color: #f59e0b;
}

.enhance-multiplier {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.multiplier-value {
  font-weight: 600;
  color: #f59e0b;
}

.detail-sell-price {
  text-align: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.detail-sell-price strong {
  color: var(--accent-gold);
}

.detail-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.detail-dialog-footer .el-button {
  min-width: 80px;
}

.human-figure {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
}

.figure-row {
  display: flex;
  justify-content: center;
  gap: 16px;
  width: 100%;
}

.equip-slot {
  cursor: pointer;
}

.slot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  border-radius: 10px;
  transition: all 0.3s ease;
  min-width: 90px;
}

.slot-content.empty {
  background: var(--bg-card);
  border: 2px dashed var(--border-color);
  color: var(--text-secondary);
}

.slot-content.equipped {
  background: var(--bg-secondary);
  border: 2px solid;
  position: relative;
}

.slot-content.equipped:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.slot-content.small {
  min-width: 70px;
  padding: 8px;
}

.slot-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.slot-label {
  font-size: 0.75rem;
}

.item-name {
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

.item-name.small {
  font-size: 0.7rem;
}

.item-bonus {
  font-size: 0.65rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.figure-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.human-avatar {
  font-size: 3rem;
}

.player-stats-mini {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--accent-cyan);
}

.head-row .equip-slot {
  flex: 0 0 auto;
}

.middle-row {
  justify-content: center;
}

.ring-slots {
  display: flex;
  gap: 8px;
}

/* 背包样式 */
.inventory-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stone-count {
  color: var(--accent-gold);
  font-weight: 500;
}

.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

/* 自动出售设置样式 */
.auto-sell-section {
  background: linear-gradient(135deg, rgba(156, 163, 175, 0.1) 0%, rgba(107, 114, 128, 0.1) 100%);
  border: 1px solid rgba(156, 163, 175, 0.25);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.auto-sell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.auto-sell-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.auto-sell-settings {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed rgba(156, 163, 175, 0.3);
}

.setting-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.setting-label {
  font-size: 0.82rem;
  color: var(--text-secondary);
  min-width: 60px;
}

.setting-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.quality-select {
  width: 100px;
}

.execute-btn {
  margin-top: 4px;
  width: 100%;
}

/* 一键出售样式 */
.quick-sell-section {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.08) 0%, rgba(255, 87, 34, 0.08) 100%);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 12px;
}

.quick-sell-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.quick-sell-header .quick-sell-title {
  margin-bottom: 0;
}

.category-sell-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.category-sell-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--bg-card);
  border: 2px solid transparent;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.category-sell-btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.category-sell-btn.active {
  background: rgba(255, 152, 0, 0.15);
  color: var(--text-primary);
}

.cat-icon {
  font-size: 0.9rem;
}

.cat-name {
  font-weight: 500;
}

.cat-count {
  font-size: 0.7rem;
  opacity: 0.8;
  background: var(--bg-secondary);
  padding: 1px 5px;
  border-radius: 8px;
}

.quick-sell-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--accent-gold);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quality-sell-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.quality-sell-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-card);
  border: 2px solid transparent;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.quality-sell-btn:hover {
  background: var(--bg-secondary);
  transform: translateY(-1px);
}

.quality-sell-btn.active {
  background: rgba(255, 152, 0, 0.15);
  color: var(--text-primary);
}

.quality-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.quality-label {
  font-weight: 500;
}

.quality-count {
  font-size: 0.72rem;
  opacity: 0.8;
}

.sell-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 152, 0, 0.2);
}

.sell-preview {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.sell-preview strong {
  font-weight: 600;
}

.sell-hint {
  padding-top: 10px;
  border-top: 1px dashed rgba(255, 152, 0, 0.2);
  text-align: center;
}

.no-items {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.filter-tab {
  padding: 6px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  color: var(--text-secondary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-tab:hover {
  border-color: var(--accent-cyan);
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--accent-cyan);
  border-color: var(--accent-cyan);
  color: white;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.inventory-item {
  padding: 10px;
  border-left: 3px solid;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
}

.inventory-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.item-header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.item-type-icon {
  font-size: 1rem;
}

.item-type {
  color: var(--text-secondary);
  flex: 1;
}

.item-quality {
  font-weight: 500;
}

.set-tag {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  background: rgba(168, 85, 247, 0.2);
  border-radius: 8px;
}

.enhance-tag {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 2px 6px;
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-radius: 8px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.inventory-item.enhanced {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%);
}

.stat-enhanced {
  color: #f59e0b !important;
  font-weight: 600;
}

.item-set-name {
  font-size: 0.68rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-style: italic;
}

.inventory-item.set-item {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
}

.inventory-item.set-item:hover {
  box-shadow: 0 4px 16px rgba(168, 85, 247, 0.2);
}

.item-name {
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 4px;
  line-height: 1.2;
}

.item-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.item-actions {
  display: flex;
  gap: 4px;
  margin-top: auto;
  padding-top: 8px;
}

.item-actions .el-button {
  flex: 1;
  font-size: 0.7rem;
  padding: 4px 8px;
  min-height: 26px;
}

.empty-inventory {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

@media (max-width: 500px) {
  .human-figure {
    padding: 8px;
  }

  .slot-content {
    min-width: 70px;
    padding: 8px;
  }

  .slot-icon {
    font-size: 1.2rem;
  }

  .item-name {
    font-size: 0.75rem;
  }

  .inventory-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 功法装备区域 */
.techniques-section {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
}

.techniques-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}

.technique-bonus-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.78rem;
}

.bonus-label {
  color: var(--text-secondary);
}

.bonus-chip {
  padding: 2px 8px;
  background: var(--bg-card);
  border-radius: 10px;
  color: var(--accent-cyan);
  font-weight: 500;
}

.equipped-techniques {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.equipped-technique-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: var(--bg-card);
  border: 2px solid;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 8px;
}

.equipped-technique-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
}

.technique-emoji {
  font-size: 2.5rem;
}

.technique-info {
  text-align: center;
}

.technique-name {
  font-size: 1rem;
  font-weight: bold;
}

.technique-quality-tag {
  font-size: 0.72rem;
  color: var(--text-secondary);
  padding: 2px 8px;
  background: var(--bg-secondary);
  border-radius: 10px;
  margin-top: 4px;
}

.technique-effects-mini {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.effect-badge {
  padding: 3px 8px;
  background: rgba(102, 126, 234, 0.2);
  border-radius: 8px;
  font-size: 0.75rem;
  color: var(--accent-cyan);
}

.equipped-indicator {
  font-size: 0.72rem;
  color: #4caf50;
  font-weight: 500;
}

.empty-technique-slots {
  text-align: center;
  padding: 10px;
  background: var(--bg-card);
  border-radius: 8px;
  margin-bottom: 12px;
}

.slot-hint {
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.unequipped-title {
  font-size: 0.82rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-left: 4px;
}

.unequipped-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.technique-card-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--bg-card);
  border: 1px solid;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  gap: 4px;
}

.technique-card-mini:hover {
  transform: translateY(-2px);
  background: var(--bg-secondary);
}

.technique-emoji-small {
  font-size: 1.5rem;
}

.technique-name-small {
  font-size: 0.8rem;
  font-weight: 500;
  text-align: center;
}

.technique-effect-preview {
  display: flex;
  gap: 4px;
}

.effect-preview-badge {
  font-size: 0.68rem;
  padding: 2px 6px;
  background: rgba(102, 126, 234, 0.15);
  border-radius: 6px;
  color: var(--accent-cyan);
}

/* 灵宠选择 */
.pets-section {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
}

.pets-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pets-hint {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.pet-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 6px;
}

.pet-card:hover {
  border-color: var(--accent-cyan);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.15);
}

.pet-card.active {
  border-color: #a855f7;
  background: rgba(168, 85, 247, 0.15);
  box-shadow: 0 0 16px rgba(168, 85, 247, 0.3);
}

.pet-avatar {
  font-size: 2rem;
}

.pet-info {
  text-align: center;
}

.pet-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.pet-grade {
  font-size: 0.75rem;
  color: #fbbf24;
  letter-spacing: 2px;
}

.pet-stats {
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.pet-level {
  font-size: 0.78rem;
  color: var(--accent-cyan);
  font-weight: 500;
}

.pet-status {
  font-size: 0.72rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.pet-status.deployed {
  background: rgba(168, 85, 247, 0.2);
  color: #a855f7;
}

/* 强化对话框样式 */
.enhance-dialog-content {
  padding: 8px 0;
}

.enhance-item-info {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--border-color);
}

.enhance-item-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.set-badge {
  font-size: 0.8rem;
  color: #a855f7;
}

.enhance-item-type {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.enhance-level-section {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 20px;
}

.current-level, .next-level {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.level-badge {
  display: inline-block;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-radius: 12px;
  font-weight: 600;
  color: var(--accent-cyan);
}

.level-badge.next {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.enhance-stats-preview {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}

.stats-title {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
  text-align: center;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.stat-label {
  width: 60px;
  color: var(--text-secondary);
}

.stat-current {
  color: var(--text-secondary);
}

.stat-arrow {
  color: var(--accent-cyan);
  margin: 0 4px;
}

.stat-next {
  color: #f59e0b;
  font-weight: 600;
}

.enhance-cost-section {
  text-align: center;
  padding: 14px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 87, 34, 0.1) 100%);
  border-radius: 10px;
  margin-bottom: 12px;
}

.cost-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.cost-value {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cost-icon {
  font-size: 1.2rem;
}

.cost-amount {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--accent-gold);
}

.cost-unit {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.player-stones {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 6px;
}

.enhance-bonus-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.bonus-icon {
  font-size: 1rem;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
