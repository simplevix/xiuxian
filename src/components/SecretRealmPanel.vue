<template>
  <div class="secret-realm-panel">
    <!-- 顶部导航 -->
    <div class="realm-header">
      <div class="header-title">
        <span class="icon">🏔️</span>
        <span>秘境探索</span>
      </div>
      <div class="header-stats" v-if="playerStore.player">
        <div class="stat-item">
          <span class="label">钥匙</span>
          <span class="value">{{ playerStore.player.secretRealm?.realmChestKeys ?? 0 }} 🔑</span>
        </div>
      </div>
    </div>

    <!-- 秘境内状态 -->
    <div v-if="realmStore.isInRealm" class="realm-active">
      <!-- 当前楼层信息 -->
      <div class="current-floor" :style="{ borderColor: realmStore.currentRealm?.color }">
        <div class="floor-header">
          <span class="realm-name">{{ realmStore.currentRealm?.icon }} {{ realmStore.currentRealm?.name }}</span>
          <span class="floor-num">第 {{ realmStore.currentFloorNumber }} / {{ realmStore.currentRealm?.totalFloors }} 层</span>
        </div>
        <div class="floor-name">{{ realmStore.currentFloor?.name }}</div>
        <div class="floor-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: floorProgress + '%' }"></div>
          </div>
          <span class="monsters-left">剩余 {{ realmStore.remainingMonsters }} 只怪物</span>
        </div>
      </div>

      <!-- 战斗状态 -->
      <div v-if="realmStore.realmBattle.monster" class="battle-area">
        <div class="battle-info">
          <div class="player-status">
            <div class="hp-bar">
              <span>HP</span>
              <div class="bar">
                <div class="fill hp" :style="{ width: playerHpPercent + '%' }"></div>
              </div>
              <span>{{ realmStore.realmBattle.playerHp }} / {{ playerStore.player?.maxHp }}</span>
            </div>
          </div>
          <div class="vs-text">VS</div>
          <div class="monster-status">
            <div class="monster-name" :class="{ boss: realmStore.realmBattle.monster?.boss }">
              {{ realmStore.realmBattle.monster?.boss ? '👹' : '👾' }} {{ realmStore.realmBattle.monster?.name }}
            </div>
            <div class="hp-bar">
              <span>HP</span>
              <div class="bar">
                <div class="fill monster" :style="{ width: monsterHpPercent + '%' }"></div>
              </div>
              <span>{{ realmStore.realmBattle.monsterHp }} / {{ realmStore.realmBattle.monster?.maxHp }}</span>
            </div>
          </div>
        </div>
        <div class="turn-indicator">
          <span :class="{ active: realmStore.realmBattle.isPlayerTurn }">你的回合</span>
          <span :class="{ active: !realmStore.realmBattle.isPlayerTurn }">敌人回合</span>
        </div>
      </div>

      <!-- 秘境日志 -->
      <div class="realm-log">
        <div class="log-title">📜 秘境日志</div>
        <div class="log-entries">
          <div
            v-for="(log, index) in realmStore.realmLog"
            :key="index"
            class="log-entry"
            :class="'log-' + log.type"
          >
            {{ log.text }}
          </div>
        </div>
      </div>

      <!-- 退出按钮 -->
      <div class="exit-area">
        <button class="exit-btn" @click="handleExit">
          退出秘境
        </button>
      </div>
    </div>

    <!-- 秘境列表 -->
    <div v-else class="realm-list">
      <div class="list-title">可探索秘境</div>
      <div class="realm-cards">
        <div
          v-for="realm in realmStore.availableRealms"
          :key="realm.id"
          class="realm-card"
          :style="{ '--realm-color': realm.color }"
          :class="{ locked: !canEnter(realm), onCooldown: isOnCooldown(realm.id) }"
          @click="handleEnter(realm)"
        >
          <div class="card-header">
            <span class="card-icon">{{ realm.icon }}</span>
            <span class="card-type">{{ SECRET_REALM_TYPE_CONFIG[realm.type].name }}</span>
          </div>
          <div class="card-name">{{ realm.name }}</div>
          <div class="card-desc">{{ realm.description }}</div>
          <div class="card-info">
            <div class="info-item">
              <span>📍</span>
              <span>等级 {{ realm.minLevel }}+</span>
            </div>
            <div class="info-item">
              <span>💎</span>
              <span>{{ realm.entryCost }} 灵石</span>
            </div>
            <div class="info-item">
              <span>🏔️</span>
              <span>{{ realm.totalFloors }} 层</span>
            </div>
          </div>
          <div class="card-bonus">
            <span>掉落加成: {{ realm.dropQualityBonus }}x</span>
          </div>

          <!-- 状态标签 -->
          <div class="card-status" v-if="isOnCooldown(realm.id)">
            <span class="cooldown">⏳ {{ formatCooldown(realm.id) }}</span>
          </div>
          <div class="card-status" v-else-if="!canEnter(realm)">
            <span class="locked">🔒 等级不足</span>
          </div>
          <div class="card-status" v-else-if="realmStore.isRealmCompleted(realm.id)">
            <span class="completed">✅ 已通关</span>
          </div>

          <!-- 历史最好成绩 -->
          <div class="card-best" v-if="realmStore.getRealmBestScore(realm.id)">
            <span>🏆 最佳: {{ realmStore.getRealmBestScore(realm.id)?.floorsCleared }}层 / {{ realmStore.getRealmBestScore(realm.id)?.totalReward }}奖励</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useSecretRealmStore } from '@/stores/secretRealm'
import { usePlayerStore } from '@/stores/player'
import { SECRET_REALM_TYPE_CONFIG, SECRET_REALMS } from '@/types/game'
import type { SecretRealmConfig } from '@/types/game'
import { ElMessage } from 'element-plus'

const realmStore = useSecretRealmStore()
const playerStore = usePlayerStore()

const playerHpPercent = computed(() => {
  const maxHp = playerStore.player?.maxHp || 1
  const hp = realmStore.realmBattle.playerHp
  return Math.max(0, Math.min(100, (hp / maxHp) * 100))
})

const monsterHpPercent = computed(() => {
  const monster = realmStore.realmBattle.monster
  if (!monster) return 0
  return Math.max(0, Math.min(100, (realmStore.realmBattle.monsterHp / monster.maxHp) * 100))
})

const floorProgress = computed(() => {
  if (!realmStore.currentRealm) return 0
  const total = realmStore.currentRealm.totalFloors
  const current = realmStore.currentFloorNumber - 1
  return (current / total) * 100
})

function canEnter(realm: SecretRealmConfig): boolean {
  if (!playerStore.player) return false
  return playerStore.player.level >= realm.minLevel
}

function isOnCooldown(realmId: string): boolean {
  const cooldown = realmStore.getRealmCooldown(realmId)
  return cooldown > 0
}

function formatCooldown(realmId: string): string {
  const seconds = Math.ceil(realmStore.getRealmCooldown(realmId) / 1000)
  if (seconds <= 0) return ''
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    return `${hours}h${mins % 60}m`
  }
  return `${mins}m${secs}s`
}

function handleEnter(realm: SecretRealmConfig) {
  if (!canEnter(realm)) {
    ElMessage.warning(`需要等级 ${realm.minLevel} 才能进入`)
    return
  }
  if (isOnCooldown(realm.id)) {
    ElMessage.warning('秘境冷却中，请稍后再试')
    return
  }
  const result = realmStore.enterRealm(realm.id)
  if (!result.success) {
    ElMessage.error(result.message)
  }
}

function handleExit() {
  realmStore.exitRealm(false)
}
</script>

<style scoped>
.secret-realm-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #e0e0e0;
}

/* 顶部导航 */
.realm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 20px;
  font-weight: bold;
  color: #ffd700;
}

.header-title .icon {
  font-size: 24px;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.stat-item .label {
  color: #888;
  font-size: 12px;
}

.stat-item .value {
  color: #ffd700;
  font-weight: bold;
}

/* 秘境列表 */
.realm-list {
  padding: 0 4px;
}

.list-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #aaa;
}

.realm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.realm-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--realm-color);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.realm-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.08);
}

.realm-card.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.realm-card.locked:hover {
  transform: none;
}

.realm-card.onCooldown {
  opacity: 0.7;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-icon {
  font-size: 28px;
}

.card-type {
  font-size: 12px;
  padding: 4px 8px;
  background: var(--realm-color);
  border-radius: 12px;
  color: #fff;
  font-weight: bold;
}

.card-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #fff;
}

.card-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  line-height: 1.4;
}

.card-info {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #bbb;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.card-bonus {
  font-size: 12px;
  color: #ffd700;
  font-weight: bold;
}

.card-status {
  position: absolute;
  top: 8px;
  right: 8px;
}

.card-status .cooldown {
  background: rgba(255, 152, 0, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.card-status .locked {
  background: rgba(0, 0, 0, 0.7);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
}

.card-status .completed {
  background: rgba(76, 175, 80, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: bold;
}

.card-best {
  margin-top: 8px;
  font-size: 11px;
  color: #888;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* 秘境内状态 */
.realm-active {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.current-floor {
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid;
  border-radius: 12px;
  padding: 16px;
}

.floor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.realm-name {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.floor-num {
  font-size: 14px;
  color: #ffd700;
}

.floor-name {
  font-size: 16px;
  color: #aaa;
  margin-bottom: 12px;
}

.floor-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.monsters-left {
  font-size: 14px;
  color: #ff9800;
  white-space: nowrap;
}

/* 战斗区域 */
.battle-area {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
}

.battle-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.player-status,
.monster-status {
  flex: 1;
}

.monster-status {
  text-align: right;
}

.vs-text {
  font-size: 20px;
  font-weight: bold;
  color: #e91e63;
  padding: 0 16px;
}

.monster-name {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #ff5722;
}

.monster-name.boss {
  color: #f44336;
  font-size: 16px;
  text-shadow: 0 0 10px rgba(244, 67, 54, 0.5);
}

.hp-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.hp-bar .bar {
  flex: 1;
  height: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  max-width: 150px;
}

.hp-bar .fill {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-bar .fill.hp {
  background: linear-gradient(90deg, #f44336, #e91e63);
}

.hp-bar .fill.monster {
  background: linear-gradient(90deg, #ff5722, #ff9800);
}

.turn-indicator {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 14px;
}

.turn-indicator span {
  padding: 4px 12px;
  border-radius: 12px;
  opacity: 0.4;
}

.turn-indicator span.active {
  opacity: 1;
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  font-weight: bold;
}

/* 秘境日志 */
.realm-log {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.log-title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 8px;
  color: #888;
}

.log-entries {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-entry {
  font-size: 13px;
  padding: 4px 8px;
  border-radius: 4px;
  line-height: 1.4;
}

.log-info {
  color: #aaa;
}

.log-battle {
  color: #ff9800;
}

.log-reward {
  color: #4caf50;
}

.log-boss {
  color: #f44336;
  font-weight: bold;
}

.log-complete {
  color: #ffd700;
  font-weight: bold;
}

.log-fail {
  color: #9e9e9e;
}

.log-system {
  color: #2196f3;
}

/* 退出按钮 */
.exit-area {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.exit-btn {
  padding: 10px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exit-btn:hover {
  background: rgba(244, 67, 54, 0.3);
  border-color: #f44336;
}
</style>
