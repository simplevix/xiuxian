<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlayerStore } from '@/stores/player'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import TaobaoAdBanner from '@/components/TaobaoAdBanner.vue'

const playerStore = usePlayerStore()
const authStore = useAuthStore()
const router = useRouter()
const playerName = ref('')

// 是否有账号登录
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUsername = computed(() => authStore.currentUser?.username)

// 是否有角色
const hasCharacter = computed(() => playerStore.hasCharacter)

// 创建角色
function createPlayer() {
  if (!playerName.value.trim()) {
    ElMessage.warning('请输入你的道号')
    return
  }
  
  playerStore.createPlayer(playerName.value.trim())
  ElMessage.success('修仙之路开启！')
  router.push('/game')
}

// 继续游戏
async function continueGame() {
  const loaded = await playerStore.loadGame()
  if (loaded) {
    router.push('/game')
  }
}

// 跳转到登录
function goToLogin() {
  router.push('/login')
}

// 跳转到注册
function goToRegister() {
  router.push('/register')
}

// 登出
function logout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    authStore.logout()
    playerStore.deleteGame()
    ElMessage.success('已退出登录')
  }).catch(() => {})
}
</script>

<template>
  <div class="home-container">
    <div class="home-content">
      <!-- 标题区 -->
      <div class="title-section">
        <h1 class="game-title font-title">仙途问路</h1>
        <p class="subtitle">修仙挂机 · 问道长生</p>
      </div>

      <!-- 已登录且有角色 -->
      <template v-if="isLoggedIn && hasCharacter">
        <div class="continue-section game-card">
          <p class="welcome-text">欢迎回来，{{ currentUsername }}</p>
          <p class="character-info">角色：{{ playerStore.player?.name }}</p>
          <el-button size="large" class="continue-btn" @click="continueGame">
            <el-icon><RefreshRight /></el-icon>
            继续修仙
          </el-button>
          <el-button size="large" class="logout-btn" @click="logout">
            退出登录
          </el-button>
        </div>
      </template>

      <!-- 已登录但无角色 - 创建角色 -->
      <template v-else-if="isLoggedIn">
        <div class="create-section game-card">
          <p class="welcome-text">欢迎，{{ currentUsername }}</p>
          <h2 class="section-title">创建你的道号</h2>
          <el-input
            v-model="playerName"
            placeholder="请输入你的道号"
            size="large"
            class="name-input"
            @keyup.enter="createPlayer"
          />
          <el-button type="primary" size="large" class="create-btn" @click="createPlayer">
            <el-icon><Pointer /></el-icon>
            开始修仙
          </el-button>
          <el-button class="logout-link" @click="logout">
            切换账号
          </el-button>
        </div>
      </template>

      <!-- 未登录 -->
      <template v-else>
        <!-- 未登录有角色（游客模式） -->
        <template v-if="hasCharacter">
          <div class="guest-section game-card">
            <p class="welcome-text">欢迎回来，修仙者</p>
            <p class="guest-hint">当前为游客模式，建议登录以保存数据</p>
            <el-button size="large" class="continue-btn" @click="continueGame">
              <el-icon><RefreshRight /></el-icon>
              继续修仙
            </el-button>
            <div class="auth-buttons">
              <el-button @click="goToLogin">登录</el-button>
              <el-button type="primary" @click="goToRegister">注册</el-button>
            </div>
          </div>
        </template>

        <!-- 未登录无角色 -->
        <template v-else>
          <div class="auth-section game-card">
            <h2 class="section-title">踏入仙途</h2>
            <p class="auth-hint">登录后可同步游戏数据，不登录也可直接开始</p>
            <el-input
              v-model="playerName"
              placeholder="请输入你的道号"
              size="large"
              class="name-input"
              @keyup.enter="createPlayer"
            />
            <el-button type="primary" size="large" class="create-btn" @click="createPlayer">
              <el-icon><Pointer /></el-icon>
              游客开始
            </el-button>
            <div class="auth-divider">
              <span>或</span>
            </div>
            <div class="auth-buttons">
              <el-button size="large" @click="goToLogin">登录</el-button>
              <el-button size="large" type="primary" @click="goToRegister">注册</el-button>
            </div>
          </div>
        </template>
      </template>

      <!-- 特色介绍 -->
      <div class="features-section">
        <div class="feature-item">
          <div class="feature-icon">🧘</div>
          <h3>挂机修炼</h3>
          <p>自动吸收天地灵气，突破境界</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">⚔️</div>
          <h3>打怪升级</h3>
          <p>击败妖兽获取装备和灵石</p>
        </div>
        <div class="feature-item">
          <div class="feature-icon">🐉</div>
          <h3>灵宠相伴</h3>
          <p>收服灵兽，并肩作战</p>
        </div>
      </div>

      <!-- 淘宝联盟广告 -->
      <TaobaoAdBanner />
    </div>

    <!-- 装饰 -->
    <div class="decorations">
      <div class="floating-item item1">☁️</div>
      <div class="floating-item item2">⛰️</div>
      <div class="floating-item item3">🌙</div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.home-content {
  width: 100%;
  max-width: 500px;
  z-index: 1;
}

.title-section {
  text-align: center;
  margin-bottom: 40px;
}

.game-title {
  font-size: 4rem;
  background: linear-gradient(135deg, #ffd700 0%, #ff9800 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.3);
  margin-bottom: 10px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1.2rem;
  letter-spacing: 4px;
}

/* 继续游戏 */
.continue-section {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
}

.welcome-text {
  font-size: 1.3rem;
  color: var(--accent-gold);
  margin-bottom: 8px;
}

.character-info {
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.continue-btn {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  margin-bottom: 12px;
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.logout-btn {
  width: 100%;
}

/* 创建角色 */
.create-section {
  text-align: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  color: var(--accent-cyan);
}

.name-input {
  margin-bottom: 16px;
}

.name-input :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.name-input :deep(.el-input__inner) {
  color: var(--text-primary);
  text-align: center;
  font-size: 1.1rem;
}

.create-btn {
  width: 100%;
  height: 50px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  margin-bottom: 12px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.logout-link {
  color: var(--text-secondary);
}

/* 游客模式 */
.guest-section {
  text-align: center;
  margin-bottom: 24px;
  padding: 24px;
}

.guest-hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

/* 认证区域 */
.auth-section {
  text-align: center;
  margin-bottom: 24px;
}

.auth-hint {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.auth-divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: var(--text-secondary);
}

.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-color);
}

.auth-divider span {
  padding: 0 16px;
}

.auth-buttons {
  display: flex;
  gap: 12px;
}

.auth-buttons .el-button {
  flex: 1;
  height: 44px;
}

/* 特色介绍 */
.features-section {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.feature-item {
  flex: 1;
  text-align: center;
  padding: 16px 8px;
  background: var(--bg-card);
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.feature-item h3 {
  font-size: 1rem;
  margin-bottom: 4px;
}

.feature-item p {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.decorations {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.floating-item {
  position: absolute;
  font-size: 2rem;
  opacity: 0.3;
}

.item1 { top: 10%; left: 10%; animation: float 6s ease-in-out infinite; }
.item2 { top: 20%; right: 15%; animation: float 8s ease-in-out infinite 1s; }
.item3 { bottom: 15%; left: 20%; animation: float 7s ease-in-out infinite 2s; }

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

@media (max-width: 768px) {
  .game-title {
    font-size: 3rem;
  }
  
  .features-section {
    flex-direction: column;
  }
}
</style>
