<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { REALMS } from '@/types/game'

const playerStore = usePlayerStore()

const realm = computed(() => playerStore.player ? REALMS[playerStore.player.realmIndex] : null)

// 阵法加成
const formationBonus = computed(() => playerStore.formationBonus)

// 有效灵气容量（基础 + 阵法加成）
const effectiveSpiritCap = computed(() => {
  if (!realm.value) return 0
  return realm.value.spiritCap + formationBonus.value.capacityBonus
})

// 灵气进度
const progress = computed(() => {
  if (!playerStore.player || effectiveSpiritCap.value === 0) return 0
  return (playerStore.player.spiritEnergy / effectiveSpiritCap.value) * 100
})

// 基础灵气速率
const baseSpiritRate = computed(() => realm.value?.spiritPerSec || 0)

// 总灵气速率（含加成）
const totalSpiritRate = computed(() => {
  const setBonus = playerStore.setBonuses.spiritPerSecBonus
  const techBonus = playerStore.techniqueBonuses.spiritPerSec
  const formationBonus = playerStore.formationBonus.spiritBonus
  return baseSpiritRate.value + setBonus + techBonus + formationBonus
})

// 灵气效率百分比
const efficiencyPercent = computed(() => playerStore.formationBonus.efficiencyPercent)

// 法宝技能蓄力状态
const spiritSkillThreshold = computed(() => playerStore.SPIRIT_SKILL_THRESHOLD || 100)
const currentSpirit = computed(() => playerStore.player?.spiritEnergy || 0)
const skillReady = computed(() => currentSpirit.value >= spiritSkillThreshold.value)
const skillProgress = computed(() => Math.min(100, (currentSpirit.value / spiritSkillThreshold.value) * 100))

// 法宝信息
const equippedArtifact = computed(() => {
  if (!playerStore.player?.equippedArtifactId) return null
  return playerStore.player.artifacts.find(a => a.id === playerStore.player!.equippedArtifactId)
})
</script>

<template>
  <div class="spirit-bar-container">
    <!-- 法宝技能蓄力行（当装备法宝时显示） -->
    <div class="skill-charge-row" v-if="equippedArtifact">
      <span class="skill-icon">🔮</span>
      <span class="skill-name">{{ equippedArtifact.skill.name }}</span>
      <div class="skill-track">
        <div 
          class="skill-fill" 
          :class="{ ready: skillReady }"
          :style="{ width: skillProgress + '%' }"
        />
      </div>
      <span class="skill-status font-mono">
        {{ Math.floor(currentSpirit) }} / {{ spiritSkillThreshold }}
        <span v-if="skillReady" class="ready-hint">可释放!</span>
      </span>
    </div>
    
    <!-- 灵气条 -->
    <div class="spirit-label">
      <span class="spirit-icon">💫</span>
      <span class="spirit-text">灵气</span>
      <span class="spirit-value font-mono"> 
        {{ Math.floor(playerStore.player?.spiritEnergy || 0) }} / {{ effectiveSpiritCap === Infinity ? '∞' : effectiveSpiritCap }}
      </span>
      <span class="spirit-rate" v-if="totalSpiritRate > 0">
        +{{ totalSpiritRate.toFixed(1) }}/s
        <span v-if="efficiencyPercent > 0" class="efficiency-bonus">×{{ (1 + efficiencyPercent / 100).toFixed(2) }}</span>
      </span>
    </div>
    <div class="spirit-track">
      <div 
        class="spirit-fill" 
        :style="{ width: progress + '%' }"
      />
      <!-- 阵法容量加成标记 -->
      <div 
        v-if="formationBonus.capacityBonus > 0"
        class="capacity-marker"
        :style="{ left: (realm?.spiritCap / effectiveSpiritCap * 100) + '%' }"
        :title="'阵法容量+' + formationBonus.capacityBonus"
      />
    </div>
  </div>
</template>

<style scoped>
.spirit-bar-container {
  width: 100%;
}

.spirit-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  font-size: 0.88rem;
}

.spirit-icon {
  font-size: 1rem;
}

.spirit-text {
  color: var(--text-secondary);
}

.spirit-value {
  color: var(--accent-cyan);
  margin-left: auto;
}

.spirit-rate {
  font-size: 0.78rem;
  color: var(--accent-green);
  background: rgba(46, 213, 115, 0.1);
  padding: 2px 7px;
  border-radius: 10px;
  border: 1px solid rgba(46, 213, 115, 0.3);
  display: flex;
  align-items: center;
  gap: 4px;
}

.efficiency-bonus {
  font-size: 0.7rem;
  color: var(--accent-gold);
  opacity: 0.8;
}

.spirit-track {
  height: 8px;
  background: var(--bg-card);
  border-radius: 4px;
  overflow: visible;
  border: 1px solid var(--border-color);
  position: relative;
}

.spirit-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-cyan), #667eea, var(--accent-purple));
  background-size: 200% 200%;
  animation: spirit-flow 3s ease infinite;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.capacity-marker {
  position: absolute;
  top: -2px;
  bottom: -2px;
  width: 2px;
  background: var(--accent-gold);
  opacity: 0.6;
  border-radius: 1px;
}

@keyframes spirit-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* 法宝技能蓄力 */
.skill-charge-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.85rem;
}

.skill-icon {
  font-size: 1rem;
}

.skill-name {
  color: var(--accent-purple);
  min-width: 60px;
}

.skill-track {
  flex: 1;
  height: 10px;
  background: var(--bg-card);
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.skill-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent-purple), #ec4899);
  border-radius: 5px;
  transition: width 0.3s ease;
}

.skill-fill.ready {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
  animation: skill-ready-pulse 0.5s ease infinite;
}

@keyframes skill-ready-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.skill-status {
  font-size: 0.78rem;
  color: var(--text-secondary);
  min-width: 90px;
  text-align: right;
}

.ready-hint {
  color: #fbbf24;
  font-weight: bold;
  animation: pulse 1s infinite;
  margin-left: 4px;
}
</style>
