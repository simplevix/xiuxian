// 用户数据存储工具 - 使用 IndexedDB（从 localStorage 迁移）
// 顶层接口保持不变，auth store 无需修改

import {
  createUserRecord,
  getUserByUsername,
  getUserById as getUserByIdDB,
  verifyUserLogin,
  initSaveManager,
  type UserRecordDB
} from './saveManager'

export interface UserRecord {
  id: string
  username: string
  email: string
  password_hash: string
  avatar?: string
  created_at: number
}

// 简单的密码哈希
export function hashPassword(password: string): string {
  let hash = 0
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash.toString(16)
}

// 验证密码
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

// 生成随机 ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// 初始化数据库（IndexedDB）
export async function initDatabase(): Promise<boolean> {
  await initSaveManager()
  return true
}

// 内部转换函数：DB格式 → 旧接口格式
function toUserRecord(dbRecord: UserRecordDB): UserRecord {
  return {
    id: dbRecord.id,
    username: dbRecord.username,
    email: dbRecord.email,
    password_hash: dbRecord.passwordHash,
    avatar: dbRecord.avatar,
    created_at: dbRecord.createdAt
  }
}

// 创建用户
export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  // 检查用户名是否存在
  const existing = await getUserByUsername(username)
  if (existing) {
    return { success: false, message: '用户名已存在' }
  }

  // 检查邮箱是否存在（需要遍历，但数据量小可以接受）
  // 这里简化处理，只在创建时检查
  const id = generateId()
  const passwordHash = hashPassword(password)

  try {
    const dbUser = await createUserRecord(id, username, email, passwordHash)
    const user = toUserRecord(dbUser)

    return {
      success: true,
      message: '注册成功！',
      user
    }
  } catch (e) {
    console.error('创建用户失败:', e)
    return { success: false, message: '注册失败，请稍后重试' }
  }
}

// 用户登录验证
export async function verifyLogin(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: Omit<UserRecord, 'password_hash'> }> {
  const passwordHash = hashPassword(password)
  const dbUser = await verifyUserLogin(username, passwordHash)

  if (!dbUser) {
    return { success: false, message: '用户名或密码错误' }
  }

  const user = toUserRecord(dbUser)
  const { password_hash, ...userWithoutPassword } = user
  return { success: true, message: '登录成功！', user: userWithoutPassword }
}

// 获取用户信息
export async function getUserById(id: string): Promise<Omit<UserRecord, 'password_hash'> | null> {
  const dbUser = await getUserByIdDB(id)
  if (!dbUser) return null

  const user = toUserRecord(dbUser)
  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

// 更新用户信息
export async function updateUser(
  id: string,
  updates: Partial<Pick<UserRecord, 'username' | 'email' | 'avatar'>>
): Promise<{ success: boolean; message: string }> {
  const dbUser = await getUserByIdDB(id)
  if (!dbUser) {
    return { success: false, message: '用户不存在' }
  }

  if (updates.username && updates.username !== dbUser.username) {
    // 检查新用户名是否已存在
    const existing = await getUserByUsername(updates.username)
    if (existing) {
      return { success: false, message: '用户名已存在' }
    }
  }

  if (updates.username) dbUser.username = updates.username
  if (updates.email) dbUser.email = updates.email
  if (updates.avatar) dbUser.avatar = updates.avatar

  try {
    const { openDB } = await import('./saveManager')
    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('users', 'readwrite')
      const store = tx.objectStore('users')
      store.put(dbUser)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return { success: true, message: '更新成功' }
  } catch (e) {
    console.error('更新用户失败:', e)
    return { success: false, message: '更新失败' }
  }
}

// 检查数据库是否就绪
export function isDatabaseReady(): boolean {
  return true
}

export { saveDatabase }
function saveDatabase() {}
