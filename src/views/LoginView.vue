<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'

const emit = defineEmits<{
  close: []
  switchToRegister: []
}>()

const authStore = useAuthStore()
const loginForm = reactive({
  username: '',
  password: ''
})
const formRef = ref()

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3-20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur' }
  ]
}

async function handleLogin() {
  try {
    await formRef.value.validate()
    const result = await authStore.login(loginForm)
    if (result.success) {
      ElMessage.success(result.message)
      emit('close')
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 表单验证失败
  }
}

function handleClose() {
  emit('close')
}

function switchToRegister() {
  emit('switchToRegister')
}
</script>

<template>
  <div class="login-container">
    <div class="login-header">
      <h2>登录</h2>
      <button class="close-btn" @click="handleClose">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <el-form
      ref="formRef"
      :model="loginForm"
      :rules="rules"
      class="login-form"
      @submit.prevent="handleLogin"
    >
      <el-form-item prop="username">
        <el-input
          v-model="loginForm.username"
          placeholder="用户名"
          size="large"
          :prefix-icon="User"
          autocomplete="username"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="loginForm.password"
          type="password"
          placeholder="密码"
          size="large"
          :prefix-icon="Lock"
          show-password
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          class="login-btn"
          :loading="authStore.isLoading"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form-item>
    </el-form>

    <div class="login-footer">
      <span>还没有账号？</span>
      <a class="switch-link" @click="switchToRegister">立即注册</a>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  padding: 24px;
}

.login-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.login-header h2 {
  font-size: 1.5rem;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.login-form {
  margin-bottom: 16px;
}

.login-form :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.login-form :deep(.el-input__inner) {
  color: var(--text-primary);
}

.login-form :deep(.el-input__prefix) {
  color: var(--text-secondary);
}

.login-btn {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.login-footer {
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.switch-link {
  color: var(--accent-cyan);
  cursor: pointer;
  margin-left: 4px;
  transition: color 0.2s;
}

.switch-link:hover {
  color: var(--accent-gold);
}
</style>
