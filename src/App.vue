<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import HomeView from '@/views/HomeView.vue'
import GameView from '@/views/GameView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'

type ViewMode = 'home' | 'login' | 'register' | 'game'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const viewMode = ref<ViewMode>('home')
const showAuthModal = ref(false)

// 监听用户登录状态
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.currentUser)

// 检查是否应该自动进入游戏
function checkAutoEnterGame() {
  if (!isLoggedIn.value) return false
  
  // 加载本地存档
  if (playerStore.loadGame()) {
    // 检查存档是否绑定到当前账号
    if (playerStore.player?.userId === authStore.currentUser?.id) {
      return true
    }
  }
  return false
}

onMounted(() => {
  // 检查是否应该自动进入游戏
  if (checkAutoEnterGame()) {
    viewMode.value = 'game'
  }
})

// 监听登录状态变化
watch(isLoggedIn, (loggedIn) => {
  if (loggedIn && checkAutoEnterGame()) {
    viewMode.value = 'game'
  }
})

function onGameStart() {
  viewMode.value = 'game'
}

function openLogin() {
  showAuthModal.value = true
  viewMode.value = 'login'
}

function openRegister() {
  showAuthModal.value = true
  viewMode.value = 'register'
}

function closeAuth() {
  showAuthModal.value = false
  // 关闭模态框后检查是否应该进入游戏
  if (checkAutoEnterGame()) {
    viewMode.value = 'game'
  } else {
    viewMode.value = 'home'
  }
}

function switchToLogin() {
  viewMode.value = 'login'
}

function switchToRegister() {
  viewMode.value = 'register'
}

function handleLogout() {
  authStore.logout()
  viewMode.value = 'home'
}
</script>

<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <h1 class="game-title-small">仙途问路</h1>
      </div>
      <div class="nav-right">
        <template v-if="isLoggedIn">
          <span class="user-info">
            <el-icon><User /></el-icon>
            {{ currentUser?.username }}
          </span>
          <el-button text @click="handleLogout">登出</el-button>
        </template>
        <template v-else>
          <el-button text @click="openLogin">登录</el-button>
          <el-button type="primary" @click="openRegister">注册</el-button>
        </template>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <!-- 首页 -->
      <HomeView
        v-if="viewMode === 'home'"
        @login="openLogin"
        @register="openRegister"
        @start="onGameStart"
      />

      <!-- 游戏界面 -->
      <GameView v-else-if="viewMode === 'game'" />
    </main>

    <!-- 登录/注册模态框 -->
    <Teleport to="body">
      <div v-if="showAuthModal" class="auth-modal-overlay" @click.self="closeAuth">
        <div class="auth-modal">
          <div class="modal-background">
            <div class="bg-gradient"></div>
          </div>
          <div class="modal-content">
            <Transition name="fade" mode="out-in">
              <LoginView
                v-if="viewMode === 'login'"
                key="login"
                @close="closeAuth"
                @switch-to-register="switchToRegister"
              />
              <RegisterView
                v-else-if="viewMode === 'register'"
                key="register"
                @close="closeAuth"
                @switch-to-login="switchToLogin"
              />
            </Transition>
          </div>
        </div>
      </div>
    </Teleport>
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

.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary);
  font-size: 0.95rem;
}

/* 主内容区域 */
.main-content {
  flex: 1;
  padding-top: 60px;
}

/* 模态框样式 */
.auth-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.auth-modal {
  position: relative;
  width: 420px;
  max-width: 90vw;
  min-height: 400px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
}

.modal-background {
  position: absolute;
  inset: 0;
  background: var(--bg-card);
}

.bg-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.modal-content {
  position: relative;
  z-index: 1;
  min-height: 400px;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
