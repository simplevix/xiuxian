<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { useWorldStore } from '@/stores/world'
import { ElProgress } from 'element-plus'

const playerStore = usePlayerStore()
const battleStore = useBattleStore()
const worldStore = useWorldStore()

const monster = computed(() => battleStore.currentMonster)
const isInBattle = computed(() => battleStore.isInBattle)
const logContainer = ref<HTMLElement | null>(null)

// 日志自动滚到底部
watch(() => battleStore.battleLog.length, async () => {
  await nextTick()
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
})

// 日志颜色映射
const logColors: Record<string, string> = {
  player: '#60a5fa',
  monster: '#f87171',
  critical: '#fbbf24',
  drop: '#34d399',
  victory: '#ffd700',
  defeat: '#f87171',
  pet: '#a78bfa',
  system: '#94a3b8',
  info: '#cbd5e1'
}

function getLogColor(type: string) {
  return logColors[type] || logColors.info
}

// 场景是否已解锁（按玩家等级）
function isSceneUnlocked(scene: any) {
  const level = playerStore.totalLevel
  return level >= scene.minLevel
}

function startBattle() {
  if (battleStore.currentScene) {
    battleStore.startBattle()
  }
}

function flee() {
  battleStore.flee()
}
</script>

<template>
  <div class="battle-panel game-card">
    <!-- 伤害浮字层 -->
    <div class="float-layer" v-if="battleStore.lastDamageFloat || battleStore.lastMonsterDamageFloat">
      <div 
        v-if="battleStore.lastDamageFloat"
        :key="battleStore.lastDamageFloat.key"
        class="damage-float player-damage"
        :class="{ critical: battleStore.lastDamageFloat.critical }"
        :style="{ left: battleStore.lastDamageFloat.x + '%', top: '30%' }"
      >
        {{ battleStore.lastDamageFloat.critical ? '💥' : '' }}-{{ battleStore.lastDamageFloat.value }}
      </div>
      <div 
        v-if="battleStore.lastMonsterDamageFloat"
        :key="'m_' + battleStore.lastMonsterDamageFloat.key"
        class="damage-float monster-damage"
        :style="{ right: battleStore.lastMonsterDamageFloat.x + '%', top: '55%' }"
      >
        -{{ battleStore.lastMonsterDamageFloat.value }}
      </div>
    </div>

    <!-- 挂机统计条 -->
    <div class="session-stats" v-if="battleStore.autoMode || battleStore.sessionKills > 0">
      <div class="stat-chip kills">
        <span class="chip-icon">💀</span>
        <span class="chip-label">击杀</span>
        <span class="chip-val font-mono">{{ battleStore.sessionKills }}</span>
      </div>
      <div class="stat-chip stones">
        <span class="chip-icon">💎</span>
        <span class="chip-label">灵石</span>
        <span class="chip-val font-mono">+{{ battleStore.sessionStones }}</span>
      </div>
      <div class="stat-chip exp">
        <span class="chip-icon">⬆️</span>
        <span class="chip-label">经验</span>
        <span class="chip-val font-mono">+{{ battleStore.sessionExp }}</span>
      </div>
      <div class="auto-badge" :class="{ active: battleStore.autoMode }">
        {{ battleStore.autoMode ? '⚙️ 挂机中' : '⏸ 已暂停' }}
      </div>
    </div>

    <!-- 战斗区域 -->
    <div class="battle-area">
      <!-- 怪物 -->
      <div class="monster-section" v-if="monster">
        <div class="monster-avatar" :class="{ 'boss-bounce': monster.boss }">
          {{ monster.boss ? '👹' : '👾' }}
        </div>
        <h3 class="monster-name" :class="{ boss: monster.boss }">
          {{ monster.name }}
          <span v-if="monster.boss" class="boss-tag">BOSS</span>
        </h3>
        <div class="monster-level">Lv.{{ monster.level }}</div>
        
        <div class="hp-section">
          <div class="hp-label">
            <span>HP</span>
            <span class="font-mono">{{ monster.hp }} / {{ monster.maxHp }}</span>
          </div>
          <el-progress
            :percentage="Math.round((monster.hp / monster.maxHp) * 100)"
            :stroke-width="14"
            :color="monster.boss ? '#ff4757' : '#a855f7'"
            :show-text="false"
          />
        </div>

        <div class="monster-stats">
          <span class="stat-badge atk">⚔️ {{ monster.attack }}</span>
          <span class="stat-badge def">🛡️ {{ monster.defense }}</span>
        </div>
      </div>

      <!-- VS -->
      <div class="vs-section" v-if="isInBattle">
        <div class="vs-text">VS</div>
        <div class="vs-lightning">⚡</div>
      </div>

      <!-- 玩家（战斗中） -->
      <div class="player-section" v-if="isInBattle && playerStore.player">
        <div class="player-avatar-small">🧙‍♂️</div>
        <div class="player-name-small">{{ playerStore.player.name }}</div>
        <div class="hp-bar-wrap">
          <el-progress
            :percentage="Math.round((playerStore.player.hp / playerStore.player.maxHp) * 100)"
            :stroke-width="10"
            :color="playerStore.player.hp < playerStore.player.maxHp * 0.3 ? '#ff4757' : '#2ed573'"
            :show-text="false"
          />
        </div>
        <div class="hp-mini font-mono">
          {{ playerStore.player.hp }} / {{ playerStore.player.maxHp }}
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-battle" v-if="!isInBattle && !battleStore.currentScene">
        <div class="empty-icon">⚔️</div>
        <p>选择下方场景开始战斗</p>
      </div>

      <!-- 已选场景等待 -->
      <div class="ready-battle" v-if="!isInBattle && battleStore.currentScene">
        <div class="ready-icon">🗡️</div>
        <p class="ready-scene">{{ battleStore.currentScene.name }}</p>
        <p class="ready-hint">点击「开始战斗」或开启挂机模式</p>
      </div>
    </div>

    <!-- 场景选择 -->
    <div class="scene-section">
      <h4 class="section-title">🗺️ 选择战场</h4>
      <div class="scene-list">
        <div
          v-for="scene in worldStore.scenes"
          :key="scene.id"
          :class="['scene-item', {
            active: battleStore.currentScene?.id === scene.id,
            locked: !isSceneUnlocked(scene)
          }]"
          @click="isSceneUnlocked(scene) && !isInBattle && battleStore.selectScene(scene.id)"
        >
          <span class="scene-icon">
            {{ scene.id === 'spirit_forest' ? '🌲' : scene.id === 'abyss' ? '🌑' : '⛰️' }}
          </span>
          <div class="scene-info">
            <span class="scene-name">{{ scene.name }}</span>
            <span class="scene-level">Lv.{{ scene.minLevel }}-{{ scene.maxLevel }}</span>
          </div>
          <span v-if="!isSceneUnlocked(scene)" class="lock-icon">🔒</span>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="battle-actions">
      <template v-if="!isInBattle">
        <el-button
          type="primary"
          size="large"
          :disabled="!battleStore.currentScene"
          class="battle-btn"
          @click="startBattle"
        >
          <el-icon><Pointer /></el-icon>
          {{ battleStore.currentScene ? '单场战斗' : '先选择场景' }}
        </el-button>
        <el-button
          :type="battleStore.autoMode ? 'warning' : 'success'"
          size="large"
          :disabled="!battleStore.currentScene"
          class="auto-btn"
          @click="battleStore.toggleAutoMode()"
        >
          {{ battleStore.autoMode ? '⏹ 停止挂机' : '⚙️ 开始挂机' }}
        </el-button>
      </template>
      <el-button
        v-else
        type="danger"
        size="large"
        class="flee-btn"
        @click="flee"
      >
        <el-icon><TopLeft /></el-icon>
        撤退
      </el-button>
    </div>

    <!-- 战斗日志 -->
    <div class="battle-log">
      <div class="log-header">
        <span>📜 战斗日志</span>
        <el-button text size="small" @click="battleStore.clearLog">清空</el-button>
      </div>
      <div class="log-content" ref="logContainer">
        <div 
          v-for="(log, index) in battleStore.battleLog" 
          :key="index"
          class="log-line"
          :style="{ color: getLogColor(log.type) }"
        >
          {{ log.text }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.battle-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0;
  position: relative;
}

/* 浮字层 */
.float-layer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}

/* 挂机统计 */
.session-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(102, 126, 234, 0.08);
  border-bottom: 1px solid var(--border-color);
  border-radius: 12px 12px 0 0;
  flex-wrap: wrap;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.82rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.stat-chip.kills { border-color: rgba(248, 113, 113, 0.4); }
.stat-chip.stones { border-color: rgba(251, 191, 36, 0.4); }
.stat-chip.exp { border-color: rgba(52, 211, 153, 0.4); }

.chip-label { color: var(--text-secondary); }
.chip-val { font-weight: bold; }

.auto-badge {
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.auto-badge.active {
  background: rgba(52, 211, 153, 0.15);
  border-color: #34d399;
  color: #34d399;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 战斗区域 */
.battle-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40px;
  padding: 20px;
  min-height: 230px;
}

.monster-section {
  text-align: center;
  min-width: 160px;
}

.monster-avatar {
  font-size: 4rem;
  margin-bottom: 8px;
  display: inline-block;
}

.boss-bounce {
  animation: boss-pulse 1s ease-in-out infinite;
}

@keyframes boss-pulse {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 8px rgba(255, 71, 87, 0.6)); }
  50% { transform: scale(1.1); filter: drop-shadow(0 0 16px rgba(255, 71, 87, 0.9)); }
}

.monster-name {
  font-size: 1.2rem;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.monster-name.boss {
  color: var(--accent-red);
  text-shadow: 0 0 10px rgba(255, 71, 87, 0.5);
}

.boss-tag {
  font-size: 0.7rem;
  padding: 2px 6px;
  background: var(--accent-red);
  color: white;
  border-radius: 4px;
  font-weight: bold;
  letter-spacing: 1px;
}

.monster-level {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.hp-section {
  width: 180px;
  margin: 0 auto;
}

.hp-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 0.82rem;
  color: var(--text-secondary);
}

.monster-stats {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.stat-badge {
  font-size: 0.82rem;
  padding: 3px 8px;
  border-radius: 12px;
  background: var(--bg-secondary);
}

.stat-badge.atk { color: #f87171; }
.stat-badge.def { color: #60a5fa; }

/* VS */
.vs-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.vs-text {
  font-size: 1.8rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ff4757, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.vs-lightning {
  font-size: 1.4rem;
  animation: flash 0.8s ease-in-out infinite;
}

@keyframes flash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.2; }
}

/* 玩家战斗信息 */
.player-section {
  text-align: center;
  width: 130px;
}

.player-avatar-small {
  font-size: 2.5rem;
  margin-bottom: 4px;
  display: inline-block;
}

.player-name-small {
  font-size: 0.9rem;
  margin-bottom: 8px;
  color: var(--accent-cyan);
}

.hp-bar-wrap { margin-bottom: 4px; }

.hp-mini {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

/* 空状态 */
.empty-battle, .ready-battle {
  text-align: center;
  color: var(--text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 12px;
  opacity: 0.4;
}

.ready-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
}

.ready-scene {
  font-size: 1.1rem;
  color: var(--accent-cyan);
  margin-bottom: 4px;
}

.ready-hint {
  font-size: 0.85rem;
  opacity: 0.6;
}

/* 场景选择 */
.scene-section {
  padding: 14px 0 8px;
  border-top: 1px solid var(--border-color);
}

.section-title {
  font-size: 0.88rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.scene-list {
  display: flex;
  gap: 10px;
}

.scene-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.scene-item:hover:not(.locked) {
  border-color: var(--accent-cyan);
  background: rgba(0, 212, 255, 0.06);
}

.scene-item.active {
  border-color: var(--accent-cyan);
  background: rgba(0, 212, 255, 0.12);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
}

.scene-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.scene-icon { font-size: 1.4rem; }

.scene-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.scene-name { font-size: 0.92rem; }

.scene-level {
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.lock-icon {
  font-size: 1rem;
  opacity: 0.7;
}

/* 操作按钮 */
.battle-actions {
  padding: 12px 0 10px;
  display: flex;
  gap: 10px;
}

.battle-btn, .auto-btn, .flee-btn {
  flex: 1;
  height: 46px;
  font-size: 1rem;
}

.battle-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

/* 战斗日志 */
.battle-log {
  min-height: 160px;
  max-height: 210px;
  background: var(--bg-secondary);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 0.82rem;
  color: var(--text-secondary);
  background: var(--bg-card);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 6px 12px;
}

.log-line {
  font-size: 0.82rem;
  padding: 2.5px 0;
  line-height: 1.5;
  border-bottom: 1px solid rgba(255,255,255,0.02);
  transition: color 0.2s;
}

.log-line:last-child {
  font-weight: 600;
}

/* 伤害浮字动画 */
.damage-float {
  position: absolute;
  font-size: 1.4rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  pointer-events: none;
  animation: float-up 1.2s ease-out forwards;
  z-index: 100;
  text-shadow: 0 0 8px currentColor, 0 2px 4px rgba(0,0,0,0.8);
}

.damage-float.critical {
  font-size: 1.8rem;
  color: #fbbf24;
  animation: float-up-crit 1.5s ease-out forwards;
}

.damage-float.player-damage {
  top: 30%;
  left: 20%;
  color: #60a5fa;
}

.damage-float.monster-damage {
  top: 55%;
  right: 15%;
  color: #f87171;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  30% {
    opacity: 1;
    transform: translateY(-20px) scale(1.2);
  }
  100% {
    opacity: 0;
    transform: translateY(-60px) scale(0.8);
  }
}

@keyframes float-up-crit {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1.3) rotate(-5deg);
  }
  20% {
    transform: translateY(-15px) scale(1.5) rotate(5deg);
  }
  40% {
    transform: translateY(-30px) scale(1.4) rotate(-3deg);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.7) rotate(0deg);
  }
}

@media (max-width: 600px) {
  .scene-list { flex-direction: column; }
  .battle-actions { flex-direction: column; }
  .damage-float { font-size: 1.1rem; }
  .damage-float.critical { font-size: 1.4rem; }
}
</style>
