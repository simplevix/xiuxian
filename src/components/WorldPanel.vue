<script setup lang="ts">
import { useWorldStore } from '@/stores/world'
import { useBattleStore } from '@/stores/battle'
import { usePlayerStore } from '@/stores/player'
import { QUALITIES } from '@/types/game'

const worldStore = useWorldStore()
const battleStore = useBattleStore()
const playerStore = usePlayerStore()

function exploreScene(sceneId: string) {
  battleStore.selectScene(sceneId)
}

function isSceneUnlocked(scene: any) {
  return playerStore.totalLevel >= scene.minLevel
}

function getMonsterDropRate(monster: any) {
  if (monster.boss) return '必掉好物'
  const drop = monster.dropTable[0]
  if (drop) {
    const quality = QUALITIES[drop.quality as keyof typeof QUALITIES]
    return `${Math.round(drop.chance * 100)}% ${quality?.name || ''}`
  }
  return '无掉落'
}
</script>

<template>
  <div class="world-panel">
    <h2 class="panel-title">🗺️ 世界地图</h2>
    
    <div class="scenes-grid">
      <div 
        v-for="scene in worldStore.scenes" 
        :key="scene.id"
        class="scene-card game-card"
        :class="{ locked: !isSceneUnlocked(scene) }"
      >
        <div class="scene-header">
          <span class="scene-emoji">
            {{ scene.id === 'spirit_forest' ? '🌲' : scene.id === 'abyss' ? '🌑' : '⛰️' }}
          </span>
          <div class="scene-title">
            <h3>{{ scene.name }}</h3>
            <span class="scene-level-range">Lv.{{ scene.minLevel }} - {{ scene.maxLevel }}</span>
          </div>
        </div>
        
        <p class="scene-desc">{{ scene.description }}</p>
        
        <div class="monsters-section">
          <h4>怪物分布</h4>
          <div class="monsters-list">
            <div 
              v-for="monster in scene.monsters" 
              :key="monster.id"
              class="monster-chip"
              :class="{ boss: monster.boss }"
            >
              <span class="monster-name">
                {{ monster.boss ? '👹' : '👾' }} {{ monster.name }}
              </span>
              <span class="monster-drop">{{ getMonsterDropRate(monster) }}</span>
            </div>
          </div>
        </div>

        <div class="scene-actions">
          <el-button 
            type="primary"
            :disabled="battleStore.isInBattle || !isSceneUnlocked(scene)"
            @click="exploreScene(scene.id)"
          >
            <template v-if="!isSceneUnlocked(scene)">🔒 需 Lv.{{ scene.minLevel }}</template>
            <template v-else-if="battleStore.currentScene?.id === scene.id">✓ 已选中</template>
            <template v-else>前往探索</template>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 地图说明 -->
    <div class="world-tip game-card">
      <h4>💡 探险提示</h4>
      <ul>
        <li>击败BOSS有更高概率掉落稀有装备和灵宠</li>
        <li>BOSS出现概率为10%，遇到请谨慎挑战</li>
        <li>场景按等级解锁，当前总等级达到要求即可探索</li>
        <li>离线期间会自动积累50%的灵气收益</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.world-panel {
  height: 100%;
  overflow-y: auto;
}

.panel-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
}

.scenes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.scene-card {
  display: flex;
  flex-direction: column;
  transition: opacity 0.3s;
}

.scene-card.locked {
  opacity: 0.55;
  filter: grayscale(0.4);
}

.scene-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.scene-emoji {
  font-size: 2.5rem;
}

.scene-title h3 {
  font-size: 1.1rem;
  margin-bottom: 2px;
}

.scene-level-range {
  font-size: 0.85rem;
  color: var(--accent-cyan);
}

.scene-desc {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.monsters-section {
  margin-bottom: 16px;
}

.monsters-section h4 {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.monsters-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.monster-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg-secondary);
  border-radius: 20px;
  font-size: 0.85rem;
}

.monster-chip.boss {
  background: linear-gradient(135deg, rgba(255, 71, 87, 0.2), rgba(255, 71, 87, 0.1));
  border: 1px solid var(--accent-red);
}

.monster-drop {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.scene-actions {
  margin-top: auto;
}

.scene-actions .el-button {
  width: 100%;
}

.world-tip {
  background: rgba(0, 212, 255, 0.05);
  border-color: rgba(0, 212, 255, 0.2);
}

.world-tip h4 {
  margin-bottom: 12px;
  color: var(--accent-cyan);
}

.world-tip ul {
  padding-left: 20px;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.8;
}
</style>
