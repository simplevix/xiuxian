<script setup lang="ts">
import { computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { ElMessage, ElMessageBox } from 'element-plus'

const playerStore = usePlayerStore()
const player = computed(() => playerStore.player)

const pets = computed(() => player.value?.pets || [])

function getGradeStars(grade: number) {
  return '⭐'.repeat(grade)
}

function getGradeColor(grade: number) {
  const colors = ['#9e9e9e', '#4caf50', '#2196f3', '#9c27b0', '#ff9800']
  return colors[grade - 1] || '#9e9e9e'
}

function getGradeName(grade: number) {
  const names = ['', '凡品', '良品', '上品', '精品', '神品']
  return names[grade] || '凡品'
}

function switchPet(petId: string) {
  if (!player.value) return
  player.value.currentPetId = player.value.currentPetId === petId ? undefined : petId
  playerStore.recalcStats()
  ElMessage.success('已切换出战灵宠')
}

// 计算法宝出售价格
function getArtifactSellPrice(artifact: any): number {
  const qualityMultipliers: Record<string, number> = {
    common: 100,
    good: 300,
    rare: 800,
    epic: 2000,
    legendary: 5000
  }
  const basePrice = qualityMultipliers[artifact.quality] || 100
  const levelBonus = artifact.level * 50
  return Math.floor(basePrice + levelBonus)
}

// 出售法宝
async function sellArtifact(artifactId: string, artifactName: string) {
  if (!player.value) return
  
  const artifact = player.value.artifacts.find(a => a.id === artifactId)
  if (!artifact) return
  
  const sellPrice = getArtifactSellPrice(artifact)
  
  try {
    await ElMessageBox.confirm(
      `确定出售法宝【${artifactName}】？\n将获得 💎${sellPrice} 灵石`,
      '出售法宝',
      {
        confirmButtonText: '出售',
        cancelButtonText: '取消',
        confirmButtonClass: 'el-button--danger',
        type: 'warning'
      }
    )
    
    const price = playerStore.sellArtifact(artifactId)
    ElMessage.success(`出售成功！获得 💎${price} 灵石`)
  } catch {
    // 用户取消
  }
}

function feedPet(petId: string) {
  const amounts = [
    { label: '喂养 (10💎)', value: 10 },
    { label: '精饲料 (50💎)', value: 50 },
    { label: '仙饲料 (200💎)', value: 200 }
  ]
  ElMessageBox({
    title: '喂养灵宠',
    message: '选择饲料品质',
    confirmButtonText: '喂养',
    cancelButtonText: '取消',
    showInput: false
  }).then(() => {
    // 默认喂养50
    if (player.value!.spiritStones >= 50) {
      playerStore.feedPet(petId, 50)
      ElMessage.success('喂养成功！亲密度和经验提升')
    } else {
      ElMessage.warning('灵石不足')
    }
  }).catch(() => {
    // 显示自定义选项
  })
}

function quickFeed(petId: string, amount: number) {
  if (!player.value) return
  if (player.value.spiritStones < amount) {
    ElMessage.warning('灵石不足')
    return
  }
  playerStore.feedPet(petId, amount)
  ElMessage.success(`消耗 ${amount} 灵石，喂养成功！`)
}

function awakenPet(petId: string) {
  const pet = pets.value.find(p => p.id === petId)
  if (!pet) return
  if (pet.grade >= 5) {
    ElMessage.info('灵宠已达最高品阶')
    return
  }
  const cost = pet.grade * 500
  ElMessageBox.confirm(
    `觉醒需要 ${cost} 灵石，觉醒后灵宠属性提升50%，是否继续？`,
    '灵宠觉醒',
    { confirmButtonText: '觉醒', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    if (player.value!.spiritStones < cost) {
      ElMessage.warning('灵石不足')
      return
    }
    player.value!.spiritStones -= cost
    if (playerStore.awakenPet(petId)) {
      ElMessage.success(`觉醒成功！灵宠升为【${getGradeName(pet.grade + 1)}】！`)
    }
  }).catch(() => {})
}

const awakenCost = (grade: number) => grade * 500
</script>

<template>
  <div class="pet-view" v-if="player">
    <!-- 法宝区域 -->
    <div class="artifact-section game-card">
      <h3 class="section-title">✨ 法宝</h3>
      <div class="artifact-display" v-if="player.artifacts.length > 0">
        <div class="artifact-list">
          <div 
            v-for="artifact in player.artifacts" 
            :key="artifact.id"
            class="artifact-item"
            :class="{ equipped: artifact.id === player.equippedArtifactId }"
          >
            <div class="artifact-main" @click="playerStore.equipArtifact(artifact.id)">
              <div class="artifact-icon">🔮</div>
              <div class="artifact-info">
                <div class="artifact-name" :style="{ color: artifact.quality === 'legendary' ? '#ff9800' : artifact.quality === 'epic' ? '#9c27b0' : artifact.quality === 'rare' ? '#2196f3' : artifact.quality === 'good' ? '#4caf50' : '#9e9e9e' }">
                  {{ artifact.name }}
                  <span class="artifact-quality">({{ artifact.quality === 'legendary' ? '仙器' : artifact.quality === 'epic' ? '史诗' : artifact.quality === 'rare' ? '稀有' : artifact.quality === 'good' ? '优秀' : '普通' }})</span>
                </div>
                <div class="artifact-stats">
                  ⚔️{{ artifact.attackBonus }} 🛡️{{ artifact.defenseBonus }} ❤️{{ artifact.hpBonus }}
                </div>
                <div class="artifact-skill">
                  <span class="skill-name">🎯 {{ artifact.skill.name }}</span>
                  <span class="skill-desc">{{ artifact.skill.description }}</span>
                  <span class="skill-cd">⏱️ {{ artifact.skill.cooldown }}秒</span>
                </div>
              </div>
              <div class="equipped-badge" v-if="artifact.id === player.equippedArtifactId">已装备</div>
            </div>
            <div class="artifact-actions">
              <button 
                class="sell-btn" 
                @click.stop="sellArtifact(artifact.id, artifact.name)"
                title="出售法宝"
              >
                💎{{ getArtifactSellPrice(artifact) }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="empty-artifact" v-else>
        <span class="empty-icon">🔮</span>
        <p>暂无法宝，击败BOSS有机会获得</p>
      </div>
    </div>

    <!-- 灵宠列表 -->
    <div class="pets-section game-card">
      <h3 class="section-title">🐉 灵宠 ({{ pets.length }})</h3>
      <div class="pets-grid" v-if="pets.length > 0">
        <div 
          v-for="pet in pets" 
          :key="pet.id"
          class="pet-card"
          :class="{ active: pet.id === player.currentPetId }"
        >
          <div class="pet-header">
            <div class="pet-avatar" :style="{ borderColor: getGradeColor(pet.grade) }">
              🐲
            </div>
            <div class="pet-title-info">
              <span class="pet-name">{{ pet.name }}</span>
              <span class="pet-grade" :style="{ color: getGradeColor(pet.grade) }">
                {{ getGradeStars(pet.grade) }} {{ getGradeName(pet.grade) }}
              </span>
            </div>
          </div>
          
          <div class="pet-level-bar">
            <div class="level-info">
              <span>Lv.{{ pet.level }}</span>
              <span>{{ pet.exp }}/{{ pet.maxExp }}</span>
            </div>
            <div class="exp-progress">
              <div class="exp-fill" :style="{ width: `${(pet.exp / pet.maxExp) * 100}%` }"></div>
            </div>
          </div>

          <div class="pet-loyalty">
            <span>💕 亲密度</span>
            <div class="loyalty-bar">
              <div class="loyalty-fill" :style="{ width: `${pet.loyalty}%` }"></div>
            </div>
            <span class="loyalty-val">{{ pet.loyalty }}%</span>
          </div>

          <div class="pet-stats">
            <div class="stat-item">
              <span class="stat-label">攻击</span>
              <span class="stat-val">⚔️ {{ pet.attack }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">防御</span>
              <span class="stat-val">🛡️ {{ pet.defense }}</span>
            </div>
          </div>

          <div class="pet-ability">
            <span>📜 {{ pet.ability }}</span>
          </div>

          <div class="pet-actions">
            <el-button 
              size="small" 
              :type="pet.id === player.currentPetId ? 'warning' : 'primary'"
              @click="switchPet(pet.id)"
            >
              {{ pet.id === player.currentPetId ? '⏸ 休息' : '⚔️ 出战' }}
            </el-button>
            <el-button 
              size="small" 
              type="success"
              @click="quickFeed(pet.id, 10)"
              :disabled="player.spiritStones < 10"
            >
              🍖 10💎
            </el-button>
            <el-button 
              size="small" 
              type="warning"
              @click="quickFeed(pet.id, 50)"
              :disabled="player.spiritStones < 50"
            >
              🍖 50💎
            </el-button>
          </div>

          <div class="pet-awaken" v-if="pet.grade < 5">
            <el-button 
              size="small" 
              type="danger"
              plain
              @click="awakenPet(pet.id)"
              :disabled="player.spiritStones < awakenCost(pet.grade)"
            >
              🌟 觉醒 ({{ awakenCost(pet.grade) }}💎)
            </el-button>
          </div>
          <div class="pet-max-grade" v-else>
            🌟 已达最高品阶
          </div>
        </div>
      </div>

      <div class="empty-pets" v-else>
        <span class="empty-icon">🐉</span>
        <p>暂无灵宠，击败BOSS有机会获得</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.section-title {
  font-size: 1rem;
  margin-bottom: 12px;
}

/* 法宝样式 */
.artifact-section {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 87, 34, 0.1) 100%);
}

.artifact-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.artifact-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.artifact-item:hover {
  border-color: #ff9800;
  transform: translateX(4px);
}

.artifact-item.equipped {
  border-color: #ff9800;
  background: rgba(255, 152, 0, 0.15);
}

.artifact-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.artifact-info {
  flex: 1;
}

.artifact-name {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.artifact-stats {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.artifact-skill {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.75rem;
}

.skill-name {
  color: #ff9800;
  font-weight: 500;
}

.skill-desc {
  color: var(--text-secondary);
}

.skill-cd {
  color: #4caf50;
}

.equipped-badge {
  position: absolute;
  top: -8px;
  right: 10px;
  background: linear-gradient(135deg, #ff9800, #ff5722);
  color: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
}

/* 法宝出售按钮 */
.artifact-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.artifact-actions {
  display: flex;
  align-items: center;
}

.sell-btn {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.sell-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(244, 67, 54, 0.4);
}

.artifact-quality {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-left: 4px;
}

.empty-artifact {
  text-align: center;
  padding: 30px;
  color: var(--text-secondary);
}

.empty-artifact .empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 10px;
  opacity: 0.5;
}

/* 灵宠样式 */
.pets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.pet-card {
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
}

.pet-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.pet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pet-avatar {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-card);
  border-radius: 50%;
  border: 3px solid;
}

.pet-title-info {
  display: flex;
  flex-direction: column;
}

.pet-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.pet-grade {
  font-size: 0.85rem;
  margin-top: 2px;
}

.pet-level-bar {
  margin-bottom: 10px;
}

.level-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.exp-progress {
  height: 6px;
  background: var(--bg-card);
  border-radius: 3px;
  overflow: hidden;
}

.exp-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.pet-loyalty {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  margin-bottom: 10px;
}

.loyalty-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-card);
  border-radius: 2px;
  overflow: hidden;
}

.loyalty-fill {
  height: 100%;
  background: linear-gradient(90deg, #e91e63, #f48fb1);
  transition: width 0.3s ease;
}

.loyalty-val {
  color: #e91e63;
  min-width: 35px;
}

.pet-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
}

.stat-label {
  color: var(--text-secondary);
  font-size: 0.8rem;
}

.stat-val {
  font-weight: 500;
}

.pet-ability {
  font-size: 0.8rem;
  color: var(--accent-cyan);
  background: var(--bg-card);
  padding: 6px 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.pet-actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pet-actions .el-button {
  flex: 1;
  min-width: 0;
}

.pet-awaken {
  margin-top: 10px;
  text-align: center;
}

.pet-awaken .el-button {
  width: 100%;
}

.pet-max-grade {
  margin-top: 10px;
  text-align: center;
  color: #ff9800;
  font-weight: 600;
  padding: 8px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 6px;
}

.empty-pets {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.empty-pets .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 12px;
  opacity: 0.5;
}

@media (max-width: 600px) {
  .pets-grid {
    grid-template-columns: 1fr;
  }
}
</style>
