/**
 * 用户数据存储 - HTTP API 客户端（对接后端 SQLite）
 */

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

export interface UserRecord {
  id: string
  username: string
  email: string
  passwordHash: string
  avatar?: string
  created_at: number
}

// ==================== HTTP API 客户端 ====================

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(errorData.error || `API 请求失败: ${response.statusText}`)
  }

  return response.json()
}

// ==================== 用户操作 ====================

/** 检查用户名是否已存在 */
export async function checkUsername(username: string): Promise<boolean> {
  const data = await apiClient<{ exists: boolean }>(`/users/check/${encodeURIComponent(username)}`)
  return data.exists
}

/** 创建用户 */
export async function createUserRecord(
  id: string,
  username: string,
  email: string,
  passwordHash: string
): Promise<UserRecord & { success: boolean; message: string }> {
  const data = await apiClient<{
    success: boolean
    message: string
    user: { id: string; username: string; email: string; createdAt: number }
  }>('/users/register', {
    method: 'POST',
    body: JSON.stringify({ id, username, email, passwordHash })
  })

  return {
    success: data.success,
    message: data.message,
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    passwordHash,
    created_at: data.user.createdAt
  }
}

/** 用户登录验证 */
export async function verifyUserLogin(
  username: string,
  passwordHash: string
): Promise<Omit<UserRecord, 'passwordHash'> | null> {
  try {
    const data = await apiClient<{
      success: boolean
      user: { id: string; username: string; email: string; avatar?: string; createdAt: number }
    }>('/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, passwordHash })
    })

    if (!data.success || !data.user) {
      return null
    }

    return {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      avatar: data.user.avatar,
      created_at: data.user.createdAt
    }
  } catch (error) {
    // 401 错误表示登录失败
    if (error instanceof Error && error.message.includes('401')) {
      return null
    }
    throw error
  }
}

/** 根据 ID 获取用户 */
export async function getUserById(id: string): Promise<Omit<UserRecord, 'passwordHash'> | null> {
  try {
    const data = await apiClient<{
      id: string
      username: string
      email: string
      avatar?: string
      createdAt: number
    }>(`/users/${id}`)
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      avatar: data.avatar,
      created_at: data.createdAt
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/** 根据用户名获取用户 */
export async function getUserByUsername(username: string): Promise<Omit<UserRecord, 'passwordHash'> | null> {
  // SQLite 后端不支持按用户名直接查询，需要先检查是否存在
  const exists = await checkUsername(username)
  if (!exists) return null

  // 由于后端没有提供此接口，暂时返回 null
  // 实际应用中可以在后端添加此接口
  return null
}

// ==================== GM管理 API ====================

export interface GMUserInfo {
  id: string
  username: string
  email: string
  avatar?: string
  createdAt: number
}

export interface GMSaveInfo {
  characterName: string
  userId: string | null
  realmIndex: number
  realmLevel: number
  level: number
  spiritStones: number
  version: number
  savedAt: number
}

/** GM获取所有用户列表 */
export async function getAllUsersForGM(): Promise<GMUserInfo[]> {
  return apiClient<GMUserInfo[]>('/gm/users')
}

/** GM获取所有存档列表 */
export async function getAllSavesForGM(): Promise<GMSaveInfo[]> {
  return apiClient<GMSaveInfo[]>('/gm/saves')
}

/** GM修改指定玩家存档 */
export async function updatePlayerSaveByGM(characterName: string, playerData: any): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/gm/saves/${encodeURIComponent(characterName)}`, {
    method: 'POST',
    body: JSON.stringify(playerData)
  })
}

// ==================== 初始化 ====================

/** 初始化数据库连接 */
export async function initDatabase(): Promise<void> {
  console.log('使用后端 SQLite 用户系统')
}

// 别名兼容
export const initSaveManager = initDatabase
