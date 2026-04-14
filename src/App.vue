<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const router = useRouter()

// 是否已登录
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUsername = computed(() => authStore.currentUser?.username)

// 初始化
onMounted(async () => {
  // 初始化存档管理器
  const { initSaveManager } = await import('@/utils/saveManager')
  await initSaveManager()

  // 检查是否有存档，自动进入游戏
  const loaded = await playerStore.loadGame()
  if (loaded) {
    // 有存档，跳转到游戏页面
    router.replace('/game')
  }
})

// 登出
function logout() {
  authStore.logout()
  playerStore.deleteGame()
  router.push('/')
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <router-link to="/" class="game-title-small">仙途问路</router-link>
      </div>
      <div class="nav-right">
        <template v-if="isLoggedIn">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ currentUsername }}
          </span>
          <el-button link @click="logout">
            <el-icon><SwitchButton /></el-icon>
            退出
          </el-button>
        </template>
        <template v-else>
          <router-link to="/login">
            <el-button link>登录</el-button>
          </router-link>
          <router-link to="/register">
            <el-button type="primary" size="small">注册</el-button>
          </router-link>
        </template>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <router-view />
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.game-title-small {
  font-size: 1.3rem;
  font-weight: bold;
  background: linear-gradient(135deg, #ffd700 0%, #ff9800 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-decoration: none;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding-top: 60px;
}

a {
  text-decoration: none;
}
</style>
