<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { REALMS, QUALITIES } from '@/types/game'
import { ElProgress } from 'element-plus'

const emit = defineEmits<{
  'break-through': []
  'heal': []
}>()

const playerStore = usePlayerStore()
const player = computed(() => playerStore.player)
const realm = computed(() => player.value ? REALMS[player.value.realmIndex] : null)

// 突破动画状态
const breakthroughFlash = ref(false)
const prevRealmIndex = ref(0)

watch(() => player.value?.realmIndex, (newIdx, oldIdx) => {
  if (newIdx !== oldIdx && oldIdx !== undefined) {
    breakthroughFlash.value = true
    prevRealmIndex.value = oldIdx
    setTimeout(() => { breakthroughFlash.value = false }, 2000)
  }
})

const realmNames = computed(() => {
  if (!player.value) return ''
  const realmName = REALMS[player.value.realmIndex].name
  const level = player.value.realmLevel  // 当前层数（0-9表示第1-10层）
  return `${realmName} · 第${level + 1}层`
})

// 判断是否可以自动提升境界（灵气满 + 经验满）
const canAutoAdvance = computed(() => {
  if (!player.value || !realm.value) return false
  const spiritFull = player.value.spiritEnergy >= realm.value.spiritCap
  const expFull = player.value.realmLevelExp >= playerStore.getRealmLevelExpNeeded()
  const progressNotFull = player.value.realmLevel < realm.value.realmLevelCap
  return spiritFull && expFull && progressNotFull
})

// 判断是否可以突破大境界（境界进度满 + 经验满）
const canBreakThrough = computed(() => {
  if (!player.value || !realm.value) return false
  if (player.value.realmIndex >= REALMS.length - 1) return false  // 已达最高境界
  const progressFull = player.value.realmLevel >= realm.value.realmLevelCap
  const expFull = player.value.realmLevelExp >= playerStore.getRealmLevelExpNeeded()
  return progressFull && expFull
})

const realmGradient = computed(() => {
  if (!player.value) return ''
  const index = player.value.realmIndex
  const gradients = [
    'linear-gradient(135deg, #4ade80, #22c55e)',
    'linear-gradient(135deg, #60a5fa, #3b82f6)',
    'linear-gradient(135deg, #fbbf24, #f59e0b)',
    'linear-gradient(135deg, #f472b6, #ec4899)',
    'linear-gradient(135deg, #a78bfa, #8b5cf6)',
    'linear-gradient(135deg, #f87171, #ef4444)',
    'linear-gradient(135deg, #ffd700, #ff6b6b, #a855f7)'
  ]
  return gradients[Math.min(index, gradients.length - 1)]
})

const equippedItems = computed(() => {
  if (!player.value) return []
  return Object.entries(player.value.equipment)
    .filter(([, item]) => item)
    .map(([slot, item]) => ({ slot, ...item! }))
})

function getQualityColor(quality: string) {
  return QUALITIES[quality as keyof typeof QUALITIES]?.color || '#9e9e9e'
}

function formatEquipSlot(slot: string) {
  const names: Record<string, string> = {
    weapon: '武器', armor: '护甲', helmet: '头盔', boots: '靴子', necklace: '项链', ring: '戒指'
  }
  return names[slot] || slot
}

// 装备槽图标
const equipSlotIcons: Record<string, string> = {
  weapon: '⚔️', armor: '🛡️', helmet: '🪖', boots: '👢', necklace: '📿', ring: '💍'
}

// 当前层级经验进度
const realmLevelExpPercent = computed(() => {
  if (!player.value) return 0
  const expNeeded = playerStore.getRealmLevelExpNeeded()
  return Math.min(100, Math.round((player.value.realmLevelExp / expNeeded) * 100))
})

</script>

<template>
  <div class="player-panel game-card" v-if="player">
    <!-- 角色头部 -->
    <div class="player-header" :class="{ 'breakthrough-flash': breakthroughFlash }">
      <div class="player-avatar">🧙</div>
      <div class="player-info">
        <h3 class="player-name">{{ player.name }}</h3>
        <div class="player-realm" :style="{ background: realmGradient }">
          {{ realmNames }}
        </div>
        <!-- 突破特效文字 -->
        <div v-if="breakthroughFlash" class="breakthrough-text">
          ✨ 突破成功！{{ REALMS[player!.realmIndex].name }} ✨
        </div>
      </div>
    </div>

    <!-- 生命条 -->
    <div class="stat-row">
      <div class="stat-label">
        <span>❤️ 生命</span>
        <span class="font-mono">{{ player.hp }} / {{ player.maxHp }}</span>
      </div>
      <el-progress 
        :percentage="Math.round((player.hp / player.maxHp) * 100)" 
        :stroke-width="10"
        :color="player.hp < player.maxHp * 0.3 ? '#ff4757' : '#2ed573'"
        :show-text="false"
      />
    </div>

    <!-- 境界进度（层数） -->
    <div class="stat-row" v-if="realm">
      <div class="stat-label">
        <span>📊 境界进度</span>
        <span class="font-mono">
          {{ player.realmLevel + 1 }} / {{ realm.realmLevelCap }}层
          <span v-if="canAutoAdvance" class="auto-hint">(可提升!)</span>
        </span>
      </div>
      <el-progress 
        :percentage="Math.round((player.realmLevel + 1) / realm.realmLevelCap * 100)" 
        :stroke-width="10"
        :color="canAutoAdvance ? '#22c55e' : '#a855f7'"
        :show-text="false"
      />
    </div>

    <!-- 经验进度 -->
    <div class="stat-row">
      <div class="stat-label">
        <span>⬆️ 经验</span>
        <span class="font-mono">{{ player.realmLevelExp }} / {{ playerStore.getRealmLevelExpNeeded() }}</span>
      </div>
      <el-progress 
        :percentage="realmLevelExpPercent"
        :stroke-width="8"
        color="#22d3ee"
        :show-text="false"
        :striped="realmLevelExpPercent < 100"
        striped-flow
      />
    </div>

    <!-- 突破按钮 -->
    <div class="action-buttons">
      <el-button 
        type="primary" 
        class="breakthrough-btn"
        :disabled="!canBreakThrough"
        @click="emit('break-through')"
      >
        <el-icon><Lightning /></el-icon>
        {{ canBreakThrough ? '突破到' + REALMS[player!.realmIndex + 1]?.name : '境界突破' }}
      </el-button>
      <el-button 
        @click="emit('heal')"
        :disabled="player.hp >= player.maxHp"
      >
        <el-icon><FirstAidKit /></el-icon>
        恢复生命
      </el-button>
    </div>

    <!-- 属性 -->
    <div class="stats-grid">
      <div class="stat-item">
        <span class="stat-icon">⚔️</span>
        <span class="stat-value font-mono">{{ player.attack }}</span>
        <span class="stat-name">攻击</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">🛡️</span>
        <span class="stat-value font-mono">{{ player.defense }}</span>
        <span class="stat-name">防御</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">💎</span>
        <span class="stat-value font-mono">{{ player.spiritStones }}</span>
        <span class="stat-name">灵石</span>
      </div>
      <div class="stat-item">
        <span class="stat-icon">💀</span>
        <span class="stat-value font-mono">{{ player.totalKills }}</span>
        <span class="stat-name">击杀</span>
      </div>
    </div>

    <!-- 装备展示 -->
    <div class="equipment-section" v-if="equippedItems.length > 0">
      <h4 class="section-title">已装备</h4>
      <div class="equipment-list">
        <div 
          v-for="item in equippedItems" 
          :key="item.slot"
          class="equipment-item"
          :style="{ borderLeftColor: getQualityColor(item.quality) }"
        >
          <span class="equip-icon">{{ equipSlotIcons[item.slot] || '📦' }}</span>
          <span class="equip-slot">{{ formatEquipSlot(item.slot) }}</span>
          <span class="equip-name" :style="{ color: getQualityColor(item.quality) }">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 灵宠 -->
    <div class="pets-section" v-if="player.pets.length > 0">
      <h4 class="section-title">灵宠 ({{ player.pets.length }})</h4>
      <div class="pets-list">
        <div 
          v-for="pet in player.pets" 
          :key="pet.id"
          class="pet-item"
          :class="{ active: pet.id === player.currentPetId }"
        >
          <span class="pet-icon">🐉</span>
          <span class="pet-name">{{ pet.name }}</span>
          <span class="pet-level">Lv.{{ pet.level }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.player-panel {
  height: fit-content;
}

.player-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  position: relative;
}

.breakthrough-flash {
  animation: realm-breakthrough 2s ease-out;
}

@keyframes realm-breakthrough {
  0% { filter: brightness(1); }
  15% { filter: brightness(2.5) saturate(1.5); }
  30% { filter: brightness(1.5); }
  100% { filter: brightness(1); }
}

.breakthrough-text {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: white;
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: bold;
  white-space: nowrap;
  animation: breakthrough-pop 2s ease-out forwards;
  z-index: 10;
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
}

@keyframes breakthrough-pop {
  0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
  15% { opacity: 1; transform: translateX(-50%) scale(1.1); }
  30% { transform: translateX(-50%) scale(1); }
  80% { opacity: 1; }
  100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
}

.player-avatar {
  font-size: 3rem;
}

.player-info {
  flex: 1;
}

.player-name {
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.player-realm {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
}

.stat-row {
  margin-bottom: 12px;
}

.stat-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.auto-hint {
  color: #22c55e;
  font-weight: bold;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin: 16px 0;
}

.breakthrough-btn {
  flex: 1;
  background: linear-gradient(135deg, #a855f7, #ec4899) !important;
  border: none !important;
}

.breakthrough-btn:not(:disabled):hover {
  box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.stat-icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: bold;
  display: block;
}

.stat-name {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 16px 0 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.equipment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.equipment-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  padding: 6px 10px;
  background: var(--bg-secondary);
  border-radius: 6px;
  border-left: 3px solid;
}

.equip-icon {
  font-size: 1rem;
}

.equip-slot {
  color: var(--text-secondary);
  min-width: 32px;
}

.equip-name {
  font-weight: 500;
}

.pets-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pet-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 0.85rem;
}

.pet-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pet-icon {
  font-size: 1rem;
}
</style>
