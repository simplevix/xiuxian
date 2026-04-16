import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createUserRecord, verifyUserLogin, getUserById, initDatabase } from '@/utils/database'

// GM账号配置
const GM_USERNAME = 'admin'
const GM_PASSWORD = 'Ab123456'

export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: number
  isGM?: boolean
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginForm {
  username: string
  password: string
}

const CURRENT_USER_KEY = 'xiantu_current_user'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isLoading = ref(false)
  const isDbReady = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => !!currentUser.value)
  const userInfo = computed(() => currentUser.value)
  const isGM = computed(() => currentUser.value?.isGM === true)

  // 初始化数据库
  async function initializeDb() {
    if (isDbReady.value) return
    try {
      await initDatabase()
      isDbReady.value = true
    } catch (e) {
      console.error('数据库初始化失败:', e)
      error.value = '数据库初始化失败'
    }
  }

  // 注册
  async function register(form: RegisterForm): Promise<{ success: boolean; message: string }> {
    isLoading.value = true
    error.value = null

    try {
      await initializeDb()

      // 验证表单
      if (!form.username.trim()) {
        return { success: false, message: '请输入用户名' }
      }
      if (form.username.length < 3 || form.username.length > 20) {
        return { success: false, message: '用户名长度应在 3-20 个字符之间' }
      }
      if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(form.username)) {
        return { success: false, message: '用户名只能包含字母、数字、下划线和中文' }
      }
      if (!form.email.trim()) {
        return { success: false, message: '请输入邮箱' }
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        return { success: false, message: '请输入有效的邮箱地址' }
      }
      if (!form.password) {
        return { success: false, message: '请输入密码' }
      }
      if (form.password.length < 6) {
        return { success: false, message: '密码长度至少为 6 个字符' }
      }
      if (form.password !== form.confirmPassword) {
        return { success: false, message: '两次输入的密码不一致' }
      }

      const result = await createUserRecord(form.username.trim(), form.email.trim(), form.password)

      if (result.success && result.user) {
        const user: User = {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar,
          createdAt: result.user.created_at
        }
        currentUser.value = user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
        return { success: true, message: result.message }
      }

      return { success: false, message: result.message }
    } catch (e) {
      error.value = '注册失败，请稍后重试'
      return { success: false, message: '注册失败，请稍后重试' }
    } finally {
      isLoading.value = false
    }
  }

  // 登录
  async function login(form: LoginForm): Promise<{ success: boolean; message: string; isGM?: boolean }> {
    isLoading.value = true
    error.value = null

    try {
      // 检查是否是GM账号登录
      if (form.username.trim() === GM_USERNAME && form.password === GM_PASSWORD) {
        const gmUser: User = {
          id: 'gm_admin',
          username: GM_USERNAME,
          email: 'admin@xiantu.com',
          avatar: undefined,
          createdAt: Date.now(),
          isGM: true
        }
        currentUser.value = gmUser
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(gmUser))
        return { success: true, message: 'GM登录成功', isGM: true }
      }

      await initializeDb()

      // 验证表单
      if (!form.username.trim()) {
        return { success: false, message: '请输入用户名' }
      }
      if (!form.password) {
        return { success: false, message: '请输入密码' }
      }

      const result = await verifyUserLogin(form.username.trim(), form.password)

      if (result.success && result.user) {
        const user: User = {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          avatar: result.user.avatar,
          createdAt: result.user.created_at,
          isGM: false
        }
        currentUser.value = user
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
        return { success: true, message: result.message, isGM: false }
      }

      return { success: false, message: result.message }
    } catch (e) {
      error.value = '登录失败，请稍后重试'
      return { success: false, message: '登录失败，请稍后重试' }
    } finally {
      isLoading.value = false
    }
  }

  // 登出
  function logout() {
    currentUser.value = null
    localStorage.removeItem(CURRENT_USER_KEY)
  }

  // 检查登录状态
  async function checkAuth() {
    const saved = localStorage.getItem(CURRENT_USER_KEY)
    if (saved) {
      try {
        const user = JSON.parse(saved) as User
        
        // GM账号直接恢复
        if (user.isGM && user.username === GM_USERNAME) {
          currentUser.value = user
          return
        }
        
        // 验证用户是否仍然存在于数据库中
        await initializeDb()
        const dbUser = await getUserById(user.id)
        if (dbUser) {
          currentUser.value = {
            id: dbUser.id,
            username: dbUser.username,
            email: dbUser.email,
            avatar: dbUser.avatar,
            createdAt: dbUser.created_at,
            isGM: false
          }
        } else {
          localStorage.removeItem(CURRENT_USER_KEY)
        }
      } catch {
        localStorage.removeItem(CURRENT_USER_KEY)
      }
    }
  }

  // 更新用户信息
  async function updateUserInfo(updates: Partial<User>) {
    if (!currentUser.value) return { success: false, message: '未登录' }
    currentUser.value = { ...currentUser.value, ...updates }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser.value))
    return { success: true, message: '更新成功' }
  }

  // 初始化
  checkAuth()

  return {
    currentUser,
    isLoading,
    isDbReady,
    error,
    isLoggedIn,
    isGM,
    userInfo,
    initializeDb,
    register,
    login,
    logout,
    checkAuth,
    updateUserInfo
  }
})
