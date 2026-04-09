// 用户数据存储工具 - 使用 localStorage

const USERS_KEY = 'xiantu_users'
const DB_KEY = 'xiantu_sqlite_db'

export interface UserRecord {
  id: string
  username: string
  email: string
  password_hash: string
  avatar?: string
  created_at: number
}

// 获取所有用户
function getUsers(): Record<string, UserRecord> {
  const stored = localStorage.getItem(USERS_KEY)
  return stored ? JSON.parse(stored) : {}
}

// 保存用户列表
function saveUsers(users: Record<string, UserRecord>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
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

// 初始化数据库（兼容接口）
export async function initDatabase(): Promise<boolean> {
  // 确保用户存储存在
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify({}))
  }
  return true
}

// 创建用户
export async function createUser(
  username: string,
  email: string,
  password: string
): Promise<{ success: boolean; message: string; user?: UserRecord }> {
  const users = getUsers()

  // 检查用户名是否存在
  if (users[username]) {
    return { success: false, message: '用户名已存在' }
  }

  // 检查邮箱是否存在
  const emailExists = Object.values(users).some(u => u.email === email)
  if (emailExists) {
    return { success: false, message: '该邮箱已被注册' }
  }

  // 创建新用户
  const id = generateId()
  const passwordHash = hashPassword(password)
  const createdAt = Date.now()

  const newUser: UserRecord = {
    id,
    username,
    email,
    password_hash: passwordHash,
    created_at: createdAt
  }

  users[username] = newUser
  saveUsers(users)

  return {
    success: true,
    message: '注册成功！',
    user: newUser
  }
}

// 用户登录验证
export async function verifyLogin(
  username: string,
  password: string
): Promise<{ success: boolean; message: string; user?: Omit<UserRecord, 'password_hash'> }> {
  const users = getUsers()
  const user = users[username]

  if (!user) {
    return { success: false, message: '用户名或密码错误' }
  }

  if (!verifyPassword(password, user.password_hash)) {
    return { success: false, message: '用户名或密码错误' }
  }

  const { password_hash, ...userWithoutPassword } = user
  return { success: true, message: '登录成功！', user: userWithoutPassword }
}

// 获取用户信息
export async function getUserById(id: string): Promise<Omit<UserRecord, 'password_hash'> | null> {
  const users = getUsers()
  const user = Object.values(users).find(u => u.id === id)

  if (!user) return null

  const { password_hash, ...userWithoutPassword } = user
  return userWithoutPassword
}

// 更新用户信息
export async function updateUser(
  id: string,
  updates: Partial<Pick<UserRecord, 'username' | 'email' | 'avatar'>>
): Promise<{ success: boolean; message: string }> {
  const users = getUsers()
  const userKey = Object.keys(users).find(k => users[k].id === id)

  if (!userKey) {
    return { success: false, message: '用户不存在' }
  }

  const user = users[userKey]
  if (updates.username && updates.username !== userKey) {
    // 检查新用户名是否已存在
    if (users[updates.username]) {
      return { success: false, message: '用户名已存在' }
    }
    // 删除旧 key，添加新 key
    delete users[userKey]
    userKey as string
  }

  Object.assign(user, updates)
  users[updates.username || userKey] = user
  saveUsers(users)

  return { success: true, message: '更新成功' }
}

// 检查数据库是否就绪
export function isDatabaseReady(): boolean {
  return true
}

export { saveDatabase }
function saveDatabase() {}
