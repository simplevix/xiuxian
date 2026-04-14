<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)

async function handleRegister() {
  // 验证表单
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (form.username.length < 3 || form.username.length > 20) {
    ElMessage.warning('用户名长度应在 3-20 个字符之间')
    return
  }
  if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(form.username)) {
    ElMessage.warning('用户名只能包含字母、数字、下划线和中文')
    return
  }
  if (!form.email.trim()) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    ElMessage.warning('请输入有效的邮箱地址')
    return
  }
  if (!form.password) {
    ElMessage.warning('请输入密码')
    return
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码长度至少为 6 个字符')
    return
  }
  if (form.password !== form.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  isLoading.value = true
  try {
    const result = await authStore.register({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      confirmPassword: form.confirmPassword
    })

    if (result.success) {
      ElMessage.success(`注册成功，欢迎 ${authStore.currentUser?.username}！`)
      router.push('/')
    } else {
      ElMessage.error(result.message)
    }
  } finally {
    isLoading.value = false
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="card-header">
        <h2 class="title">注册账号</h2>
        <p class="subtitle">踏上修仙之路的第一步</p>
      </div>

      <el-form :model="form" class="register-form" @submit.prevent="handleRegister">
        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名（3-20字符）"
            size="large"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.email"
            type="email"
            placeholder="邮箱地址"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码（至少6字符）"
            size="large"
            :prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="确认密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="isLoading"
            @click="handleRegister"
          >
            注册
          </el-button>
        </el-form-item>
      </el-form>

      <div class="card-footer">
        <span class="footer-text">已有账号？</span>
        <el-button type="primary" link @click="goToLogin">
          立即登录
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
import { User, Lock, Message } from '@element-plus/icons-vue'
export default {
  components: { User, Lock, Message }
}
</script>

<style scoped>
.register-container {
  min-height: calc(100vh - 60px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.register-card {
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

.register-form {
  margin-bottom: 24px;
}

.register-form :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.register-form :deep(.el-input__inner) {
  color: var(--text-primary);
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.register-btn:hover {
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
