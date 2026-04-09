<script setup lang="ts">
import { computed, ref } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { FORMATION_CONFIGS } from '@/types/game'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormationNodeType } from '@/types/game'

const playerStore = usePlayerStore()
const player = computed(() => playerStore.player)

// 当前阵法配置
const formationConfig = computed(() => playerStore.activeFormationConfig)
const formationBonus = computed(() => playerStore.formationBonus)

// 节点升级结果提示
const upgradeResult = ref<{ success: boolean; message: string } | null>(null)

// 获取节点状态
function getNodeStatus(type: FormationNodeType) {
  if (!player.value?.formation) return { activated: false, level: 0, maxLevel: 10 }
  const node = player.value.formation.nodes.find(n => n.type === type)
  const config = formationConfig.value?.nodes.find(n => n.type === type)
  return {
    activated: node?.activated || false,
    level: node?.level || 0,
    maxLevel: config?.maxLevel || 10
  }
}

// 获取节点配置
function getNodeConfig(type: FormationNodeType) {
  return formationConfig.value?.nodes.find(n => n.type === type)
}

// 获取升级消耗
function getUpgradeCost(type: FormationNodeType) {
  if (!player.value?.formation) return 0
  return playerStore.getNodeUpgradeCost(player.value.formation, type)
}

// 获取节点当前效果
function getNodeEffect(type: FormationNodeType) {
  const nodeConfig = getNodeConfig(type)
  const nodeStatus = getNodeStatus(type)
  if (!nodeConfig || !nodeStatus.activated) return 0
  return nodeConfig.baseEffect + nodeConfig.perLevelBonus * nodeStatus.level
}

// 升级节点
async function upgradeNode(type: FormationNodeType) {
  const nodeConfig = getNodeConfig(type)
  if (!nodeConfig) return
  
  const nodeStatus = getNodeStatus(type)
  const cost = getUpgradeCost(type)
  
  if (!nodeStatus.activated) {
    // 首次激活
    await ElMessageBox.confirm(
      `激活「${nodeConfig.name}」需要消耗 ${nodeConfig.baseCost} 灵石，是否继续？`,
      '激活阵法节点',
      { confirmButtonText: '激活', cancelButtonText: '取消', type: 'info' }
    )
  } else if (nodeStatus.level >= nodeConfig.maxLevel) {
    ElMessage.warning(`${nodeConfig.name}已达满级！`)
    return
  } else {
    // 升级
    await ElMessageBox.confirm(
      `将「${nodeConfig.name}」升级到 Lv.${nodeStatus.level + 1} 需要消耗 ${cost} 灵石，是否继续？`,
      '升级阵法节点',
      { confirmButtonText: '升级', cancelButtonText: '取消', type: 'info' }
    )
  }
  
  const result = playerStore.upgradeFormationNode(type)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 已解锁的阵法列表
const unlockedFormations = computed(() => {
  if (!player.value) return []
  return FORMATION_CONFIGS.filter(f => player.value!.unlockedFormations.includes(f.id))
})

// 切换阵法
async function switchFormation(formationId: string) {
  if (player.value?.formation?.formationId === formationId) {
    ElMessage.info('当前已激活该阵法')
    return
  }
  
  const config = FORMATION_CONFIGS.find(f => f.id === formationId)
  if (!config) return
  
  const activationCost = config.realmIndex * 500 + 1000
  
  await ElMessageBox.confirm(
    `切换到「${config.name}」需要消耗 ${activationCost} 灵石，当前拥有 ${player.value?.spiritStones} 灵石，是否继续？`,
    '切换阵法',
    { confirmButtonText: '切换', cancelButtonText: '取消', type: 'info' }
  )
  
  const result = playerStore.activateFormation(formationId)
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.error(result.message)
  }
}

// 获取节点类型描述
function getNodeTypeName(type: FormationNodeType) {
  const names: Record<FormationNodeType, string> = {
    spirit: '灵气回复',
    capacity: '灵气容量',
    efficiency: '灵气效率'
  }
  return names[type] || type
}

// 获取节点类型图标
function getNodeTypeIcon(type: FormationNodeType) {
  const nodeConfig = getNodeConfig(type)
  return nodeConfig?.icon || '💎'
}
</script>

<template>
  <div class="formation-panel game-card">
    <h3 class="panel-title">
      <span class="title-icon">{{ formationConfig?.icon || '🔮' }}</span>
      <span>阵法修炼</span>
    </h3>
    
    <!-- 当前阵法信息 -->
    <div class="current-formation" v-if="formationConfig" :style="{ borderColor: formationConfig.color }">
      <div class="formation-header">
        <span class="formation-name" :style="{ color: formationConfig.color }">
          {{ formationConfig.icon }} {{ formationConfig.name }}
        </span>
        <span class="formation-bonus">
          灵气效率 +{{ formationBonus.efficiencyPercent }}%
        </span>
      </div>
      <p class="formation-desc">{{ formationConfig.description }}</p>
      
      <!-- 当前加成 -->
      <div class="current-bonus">
        <div class="bonus-item">
          <span class="bonus-icon">💧</span>
          <span class="bonus-label">灵气回复</span>
          <span class="bonus-value">+{{ formationBonus.spiritBonus.toFixed(1) }}/s</span>
        </div>
        <div class="bonus-item">
          <span class="bonus-icon">🕳️</span>
          <span class="bonus-label">灵气容量</span>
          <span class="bonus-value">+{{ formationBonus.capacityBonus }}</span>
        </div>
      </div>
    </div>
    
    <!-- 阵法节点 -->
    <div class="formation-nodes" v-if="formationConfig">
      <h4 class="nodes-title">阵法节点</h4>
      
      <div class="nodes-list">
        <div 
          v-for="nodeConfig in formationConfig.nodes" 
          :key="nodeConfig.type"
          class="node-item"
          :class="{ activated: getNodeStatus(nodeConfig.type).activated }"
        >
          <div class="node-header">
            <span class="node-icon">{{ nodeConfig.icon }}</span>
            <div class="node-info">
              <span class="node-name">{{ nodeConfig.name }}</span>
              <span class="node-type">{{ getNodeTypeName(nodeConfig.type) }}</span>
            </div>
            <span class="node-level" v-if="getNodeStatus(nodeConfig.type).activated">
              Lv.{{ getNodeStatus(nodeConfig.type).level }}
            </span>
            <span class="node-level inactive" v-else>未激活</span>
          </div>
          
          <div class="node-effect">
            <span v-if="getNodeStatus(nodeConfig.type).activated">
              当前效果：+{{ getNodeEffect(nodeConfig.type).toFixed(1) }}
              <span class="effect-next" v-if="getNodeStatus(nodeConfig.type).level < nodeConfig.maxLevel">
                → +{{ (nodeConfig.baseEffect + nodeConfig.perLevelBonus * (getNodeStatus(nodeConfig.type).level + 1)).toFixed(1) }}
              </span>
            </span>
            <span v-else>激活效果：+{{ nodeConfig.baseEffect.toFixed(1) }}</span>
          </div>
          
          <!-- 进度条 -->
          <div class="node-progress" v-if="getNodeStatus(nodeConfig.type).activated">
            <el-progress 
              :percentage="Math.round(getNodeStatus(nodeConfig.type).level / nodeConfig.maxLevel * 100)"
              :stroke-width="6"
              :color="formationConfig.color"
              :show-text="false"
            />
            <span class="progress-text">
              {{ getNodeStatus(nodeConfig.type).level }} / {{ nodeConfig.maxLevel }}
            </span>
          </div>
          
          <!-- 升级按钮 -->
          <div class="node-action">
            <el-button 
              size="small"
              :type="getNodeStatus(nodeConfig.type).activated ? 'warning' : 'primary'"
              :disabled="getNodeStatus(nodeConfig.type).level >= nodeConfig.maxLevel"
              @click="upgradeNode(nodeConfig.type)"
            >
              <span v-if="!getNodeStatus(nodeConfig.type).activated">
                激活 {{ nodeConfig.baseCost }}💎
              </span>
              <span v-else-if="getNodeStatus(nodeConfig.type).level >= nodeConfig.maxLevel">
                已满级
              </span>
              <span v-else>
                升级 {{ getUpgradeCost(nodeConfig.type) }}💎
              </span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 切换阵法 -->
    <div class="switch-formation" v-if="unlockedFormations.length > 1">
      <h4 class="nodes-title">已解锁阵法</h4>
      <div class="formations-grid">
        <div 
          v-for="f in unlockedFormations" 
          :key="f.id"
          class="formation-chip"
          :class="{ active: f.id === player?.formation?.formationId }"
          :style="{ borderColor: f.color }"
          @click="switchFormation(f.id)"
        >
          <span class="chip-icon">{{ f.icon }}</span>
          <span class="chip-name" :style="{ color: f.color }">{{ f.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 未解锁提示 -->
    <div class="locked-tip" v-if="player && player.realmIndex < FORMATION_CONFIGS.length - 1">
      <span class="tip-icon">🔒</span>
      突破到 {{ FORMATION_CONFIGS[player.realmIndex + 1]?.name }} 可解锁新阵法
    </div>
  </div>
</template>

<style scoped>
.formation-panel {
  height: fit-content;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.title-icon {
  font-size: 1.4rem;
}

.current-formation {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid;
}

.formation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.formation-name {
  font-size: 1.1rem;
  font-weight: 600;
}

.formation-bonus {
  font-size: 0.8rem;
  color: var(--accent-cyan);
  background: rgba(34, 211, 238, 0.15);
  padding: 4px 8px;
  border-radius: 10px;
}

.formation-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.current-bonus {
  display: flex;
  gap: 16px;
}

.bonus-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.bonus-icon {
  font-size: 1rem;
}

.bonus-label {
  color: var(--text-secondary);
}

.bonus-value {
  font-weight: 600;
  color: var(--accent-cyan);
}

.nodes-title {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.nodes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.node-item {
  background: var(--bg-secondary);
  border-radius: 10px;
  padding: 12px;
  transition: all 0.3s ease;
}

.node-item.activated {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%);
}

.node-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.node-icon {
  font-size: 1.5rem;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.node-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.node-type {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.node-level {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--accent-gold);
  background: rgba(255, 215, 0, 0.15);
  padding: 3px 8px;
  border-radius: 8px;
}

.node-level.inactive {
  color: var(--text-secondary);
  background: rgba(158, 158, 158, 0.15);
}

.node-effect {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.effect-next {
  color: var(--accent-cyan);
}

.node-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.node-action {
  display: flex;
  justify-content: flex-end;
}

.switch-formation {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
}

.formations-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.formation-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-radius: 20px;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.3s ease;
}

.formation-chip:hover {
  transform: scale(1.05);
}

.formation-chip.active {
  background: rgba(168, 85, 247, 0.2);
  box-shadow: 0 0 12px rgba(168, 85, 247, 0.3);
}

.chip-icon {
  font-size: 1rem;
}

.chip-name {
  font-size: 0.85rem;
  font-weight: 500;
}

.locked-tip {
  margin-top: 16px;
  padding: 12px;
  background: rgba(158, 158, 158, 0.1);
  border-radius: 8px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-align: center;
}

.tip-icon {
  margin-right: 6px;
}
</style>
