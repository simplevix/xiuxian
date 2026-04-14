<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  password: ''
})

const isLoading = ref(false)

async function handleLogin() {
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.password) {
    ElMessage.warning('请输入密码')
    return
  }

  isLoading.value = true
  try {
    const result = await authStore.login({
      username: form.username,
      password: form.password
    })

    if (result.success) {
      // GM账号跳转到GM页面
      if (result.isGM) {
        ElMessage.success('GM登录成功')
        router.push('/gm')
      } else {
        ElMessage.success(`欢迎回来，${authStore.currentUser?.username}！`)
        router.push('/')
      }
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    isLoading.value = false
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="card-header">
        <h2 class="title">登录账号</h2>
        <p class="subtitle">踏入仙途，问道长生</p>
      </div>

      <el-form :model="form" class="login-form" @submit.prevent="handleLogin">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-btn"
            :loading="isLoading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="card-footer">
        <span class="footer-text">还没有账号？</span>
        <el-button type="primary" link @click="goToRegister">
          立即注册
        </el-button>
      </div>
    </div>

    <div class="decorations">
      <div class="floating-item item1">☁️</div>
      <div class="floating-item item2">⛰️</div>
      <div class="floating-item item3">🌙</div>
    </div>
  </div>
</template>

<script lang="ts">
import { User, Lock } from '@element-plus/icons-vue'
export default {
  components: { User, Lock }
}
</script>

<style scoped>
.login-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px 32px;
  z-index: 1;
}

.card-header {
  text-align: center;
  margin-bottom: 32px;
}

.title {
  font-size: 1.8rem;
  color: var(--accent-gold);
  margin-bottom: 8px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.login-form {
  margin-bottom: 24px;
}

.login-form :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.login-form :deep(.el-input__inner) {
  color: var(--text-primary);
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.card-footer {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.footer-text {
  color: var(--text-secondary);
  margin-right: 8px;
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
</style>
