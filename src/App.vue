<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { usePlayerStore } from '@/stores/player'
import HomeView from '@/views/HomeView.vue'
import GameView from '@/views/GameView.vue'

type ViewMode = 'home' | 'game'

const playerStore = usePlayerStore()
const viewMode = ref<ViewMode>('home')

onMounted(async () => {
  // 初始化存档管理器
  const { initSaveManager } = await import('@/utils/saveManager')
  await initSaveManager()

  // 检查是否有存档，自动进入游戏
  const loaded = await playerStore.loadGame()
  if (loaded) {
    viewMode.value = 'game'
  }
})

function onGameStart() {
  viewMode.value = 'game'
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <h1 class="game-title-small">仙途问路</h1>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 首页 -->
      <HomeView
        v-if="viewMode === 'home'"
        @start="onGameStart"
      />

      <!-- 游戏界面 -->
      <GameView v-else-if="viewMode === 'game'" />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
}

.nav-left {
  display: flex;
  align-items: center;
}

.game-title-small {
  font-size: 1.3rem;
  background: linear-gradient(135deg, #ffd700 0%, #ff9800 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding-top: 60px;
}
</style>
