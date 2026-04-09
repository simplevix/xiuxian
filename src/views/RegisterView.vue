<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { User, Lock, Message } from '@element-plus/icons-vue'

const emit = defineEmits<{
  close: []
  switchToLogin: []
}>()

const authStore = useAuthStore()
const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const formRef = ref()

// 表单验证规则
const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度至少为 6 个字符'))
  } else {
    if (registerForm.confirmPassword !== '') {
      formRef.value.validateField('confirmPassword')
    }
    callback()
  }
}

const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3-20 个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, message: '只能包含字母、数字、下划线和中文', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, validator: validatePass, trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, validator: validatePass2, trigger: 'blur' }
  ]
}

async function handleRegister() {
  try {
    await formRef.value.validate()
    const result = await authStore.register(registerForm)
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

function switchToLogin() {
  emit('switchToLogin')
}
</script>

<template>
  <div class="register-container">
    <div class="register-header">
      <h2>注册</h2>
      <button class="close-btn" @click="handleClose">
        <el-icon><Close /></el-icon>
      </button>
    </div>

    <el-form
      ref="formRef"
      :model="registerForm"
      :rules="rules"
      class="register-form"
      @submit.prevent="handleRegister"
    >
      <el-form-item prop="username">
        <el-input
          v-model="registerForm.username"
          placeholder="用户名（3-20个字符）"
          size="large"
          :prefix-icon="User"
          autocomplete="username"
        />
      </el-form-item>

      <el-form-item prop="email">
        <el-input
          v-model="registerForm.email"
          placeholder="邮箱"
          size="large"
          :prefix-icon="Message"
          autocomplete="email"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="密码（至少6个字符）"
          size="large"
          :prefix-icon="Lock"
          show-password
          autocomplete="new-password"
        />
      </el-form-item>

      <el-form-item prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="确认密码"
          size="large"
          :prefix-icon="Lock"
          show-password
          autocomplete="new-password"
          @keyup.enter="handleRegister"
        />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          size="large"
          class="register-btn"
          :loading="authStore.isLoading"
          @click="handleRegister"
        >
          注册
        </el-button>
      </el-form-item>
    </el-form>

    <div class="register-footer">
      <span>已有账号？</span>
      <a class="switch-link" @click="switchToLogin">立即登录</a>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  padding: 24px;
}

.register-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.register-header h2 {
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

.register-form {
  margin-bottom: 16px;
}

.register-form :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: none;
}

.register-form :deep(.el-input__inner) {
  color: var(--text-primary);
}

.register-form :deep(.el-input__prefix) {
  color: var(--text-secondary);
}

.register-btn {
  width: 100%;
  height: 44px;
  font-size: 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.register-footer {
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
