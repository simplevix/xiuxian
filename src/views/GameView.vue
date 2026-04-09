<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useBattleStore } from '@/stores/battle'
import { useWorldStore } from '@/stores/world'
import { REALMS, QUALITIES } from '@/types/game'
import { ElMessage, ElMessageBox } from 'element-plus'
import PlayerPanel from '@/components/PlayerPanel.vue'
import BattlePanel from '@/components/BattlePanel.vue'
import WorldPanel from '@/components/WorldPanel.vue'
import InventoryPanel from '@/components/InventoryPanel.vue'
import SpiritBar from '@/components/SpiritBar.vue'
import ShopView from '@/views/ShopView.vue'
import PetView from '@/views/PetView.vue'
import FormationPanel from '@/components/FormationPanel.vue'

const playerStore = usePlayerStore()
const battleStore = useBattleStore()
const worldStore = useWorldStore()

const activeTab = ref('battle')
const autoSaveTimer = ref<number | null>(null)

onMounted(() => {
  // 自动存档
  autoSaveTimer.value = window.setInterval(() => {
    playerStore.saveGame()
  }, 30000)
})

onUnmounted(() => {
  if (autoSaveTimer.value) {
    clearInterval(autoSaveTimer.value)
  }
  playerStore.saveGame()
})

const tabs = [
  { name: 'battle', label: '修炼', icon: 'MagicStick' },
  { name: 'world', label: '探索', icon: 'Location' },
  { name: 'inventory', label: '背包', icon: 'Goods' },
  { name: 'pet', label: '灵宠', icon: 'Chicken' },
  { name: 'formation', label: '阵法', icon: 'Grid' },
  { name: 'shop', label: '商店', icon: 'Shop' }
]

function handleBreakThrough() {
  const result = playerStore.breakThrough()
  if (result.success) {
    ElMessage.success(result.message)
  } else {
    ElMessage.warning(result.message)
  }
}

function handleFullHeal() {
  playerStore.fullHeal()
  ElMessage.success('生命已回满')
}

function handleSave() {
  playerStore.saveGame()
  ElMessage.success('游戏已保存')
}

async function handleReset() {
  try {
    await ElMessageBox.confirm(
      '确定要重新开始吗？当前进度将全部丢失！',
      '警告',
      { confirmButtonText: '确定重置', cancelButtonText: '取消', type: 'warning' }
    )
    playerStore.deleteGame()
    window.location.reload()
  } catch {
    // 取消
  }
}
</script>

<template>
  <div class="game-container">
    <!-- 顶部栏 -->
    <header class="game-header">
      <div class="header-left">
        <h1 class="game-title font-title">仙途问路</h1>
      </div>
      <div class="header-center">
        <SpiritBar />
      </div>
      <div class="header-right">
        <el-button text @click="handleSave" title="保存游戏">
          <el-icon><FolderChecked /></el-icon>
        </el-button>
        <el-button text @click="handleReset" title="重新开始">
          <el-icon><RefreshRight /></el-icon>
        </el-button>
      </div>
    </header>

    <!-- 主体内容 -->
    <main class="game-main">
      <!-- 左侧玩家状态 -->
      <aside class="sidebar-left">
        <PlayerPanel 
          @break-through="handleBreakThrough"
          @heal="handleFullHeal"
        />
      </aside>

      <!-- 中间主区域 -->
      <section class="main-content">
        <!-- Tab导航 -->
        <nav class="tab-nav">
          <button
            v-for="tab in tabs"
            :key="tab.name"
            :class="['tab-btn', { active: activeTab === tab.name }]"
            @click="activeTab = tab.name"
          >
            <el-icon><component :is="tab.icon" /></el-icon>
            {{ tab.label }}
          </button>
        </nav>

        <!-- Tab内容 -->
        <div class="tab-content">
          <BattlePanel v-show="activeTab === 'battle'" />
          <WorldPanel v-show="activeTab === 'world'" />
          <InventoryPanel v-show="activeTab === 'inventory'" />
          <PetView v-show="activeTab === 'pet'" />
          <FormationPanel v-show="activeTab === 'formation'" />
          <ShopView v-show="activeTab === 'shop'" />
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.game-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left, .header-right {
  flex: 0 0 200px;
}

.header-right {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.game-title {
  font-size: 1.5rem;
  background: linear-gradient(135deg, #ffd700, #ff9800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-center {
  flex: 1;
  max-width: 500px;
}

.game-main {
  display: flex;
  flex: 1;
  padding: 16px;
  gap: 16px;
}

.sidebar-left {
  flex: 0 0 280px;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tab-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn:hover {
  border-color: var(--accent-cyan);
  color: var(--text-primary);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

.tab-content {
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .game-main {
    flex-direction: column;
  }
  
  .sidebar-left {
    flex: none;
    width: 100%;
  }
}
</style>
