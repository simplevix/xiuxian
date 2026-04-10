/**
 * IndexedDB 存档管理器
 * 将游戏存档和用户数据存储在 IndexedDB 中，避免 localStorage 因浏览器重启/清理而丢失
 * 支持账号+道号关联的多角色存档
 */

const DB_NAME = 'XianTuSaveDB'
const DB_VERSION = 1

// 数据库表名
const STORE_USERS = 'users'           // 用户账号表
const STORE_PLAYERS = 'players'       // 游戏角色存档表（按 userId + characterName 索引）

// 存档版本号（用于数据迁移）
const SAVE_VERSION = 1

export interface SaveMetadata {
  version: number
  savedAt: number
  appVersion?: string
}

export interface PlayerSaveRecord {
  userId: string          // 所属账号ID（未登录时为 'local'）
  characterName: string   // 角色道号
  playerData: string      // JSON序列化的 Player 对象
  metadata: SaveMetadata  // 存档元信息
}

export interface UserRecordDB {
  id: string
  username: string
  email: string
  passwordHash: string
  avatar?: string
  createdAt: number
  // 关联的角色列表
  characters: string[]    // 该账号下的道号列表
}

// ==================== 数据库操作 ====================

let dbInstance: IDBDatabase | null = null

export function openDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('IndexedDB 打开失败'))
    }

    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 用户表
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const userStore = db.createObjectStore(STORE_USERS, { keyPath: 'id' })
        userStore.createIndex('username', 'username', { unique: true })
        userStore.createIndex('email', 'email', { unique: false })
      }

      // 角色存档表（复合键：userId_characterName）
      if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
        const playerStore = db.createObjectStore(STORE_PLAYERS, { keyPath: ['userId', 'characterName'] })
        playerStore.createIndex('userId', 'userId', { unique: false })
        playerStore.createIndex('characterName', 'characterName', { unique: false })
      }
    }
  })
}

// 通用事务执行
async function withTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = operation(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ==================== 存档操作 ====================

/** 保存游戏角色存档 */
export async function savePlayerData(
  userId: string,
  characterName: string,
  playerData: object
): Promise<void> {
  const record: PlayerSaveRecord = {
    userId,
    characterName,
    playerData: JSON.stringify(playerData),
    metadata: {
      version: SAVE_VERSION,
      savedAt: Date.now()
    }
  }

  await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
    return store.put(record)
  })

  // 同时更新用户记录中的角色列表
  await updateUserCharacters(userId, characterName)
}

/** 加载游戏角色存档 */
export async function loadPlayerData(
  userId: string,
  characterName: string
): Promise<object | null> {
  const record = await withTransaction<PlayerSaveRecord | undefined>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.get([userId, characterName])
  )

  if (!record) return null

  return JSON.parse(record.playerData)
}

/** 获取用户所有角色存档的元信息列表 */
export async function listPlayerSaves(userId: string): Promise<Array<{
  characterName: string
  metadata: SaveMetadata
}>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PLAYERS, 'readonly')
    const store = transaction.objectStore(STORE_PLAYERS)
    const index = store.index('userId')
    const request = index.getAll(userId)

    request.onsuccess = () => {
      const records = request.result as PlayerSaveRecord[]
      resolve(records.map(r => ({
        characterName: r.characterName,
        metadata: r.metadata
      })))
    }
    request.onerror = () => reject(request.error)
  })
}

/** 删除角色存档 */
export async function deletePlayerData(
  userId: string,
  characterName: string
): Promise<void> {
  await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
    return store.delete([userId, characterName])
  })

  // 从用户角色列表中移除
  const user = await getUserById(userId)
  if (user) {
    user.characters = user.characters.filter(c => c !== characterName)
    await withTransaction(STORE_USERS, 'readwrite', (store) => {
      return store.put(user)
    })
  }
}

/** 导出角色存档为 JSON 字符串（用于备份） */
export async function exportPlayerData(
  userId: string,
  characterName: string
): Promise<string | null> {
  const record = await withTransaction<PlayerSaveRecord | undefined>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.get([userId, characterName])
  )
  return record ? record.playerData : null
}

/** 从 JSON 字符串导入角色存档（用于恢复） */
export async function importPlayerData(
  userId: string,
  characterName: string,
  playerDataJson: string
): Promise<void> {
  // 验证 JSON 是否合法
  try {
    JSON.parse(playerDataJson)
  } catch {
    throw new Error('存档数据格式无效')
  }

  const record: PlayerSaveRecord = {
    userId,
    characterName,
    playerData: playerDataJson,
    metadata: {
      version: SAVE_VERSION,
      savedAt: Date.now()
    }
  }

  await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
    return store.put(record)
  })
}

/** 导出所有存档数据（完整备份） */
export async function exportAllSaves(): Promise<string> {
  const db = await openDB()

  const users = await withTransaction<UserRecordDB[]>(
    STORE_USERS,
    'readonly',
    (store) => store.getAll()
  )

  const players = await withTransaction<PlayerSaveRecord[]>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.getAll()
  )

  const backup = {
    version: SAVE_VERSION,
    exportedAt: Date.now(),
    users,
    players
  }

  return JSON.stringify(backup, null, 2)
}

/** 从完整备份恢复所有存档 */
export async function importAllSaves(backupJson: string): Promise<void> {
  const backup = JSON.parse(backupJson)

  if (!backup.users || !backup.players) {
    throw new Error('备份文件格式无效')
  }

  const db = await openDB()

  // 导入用户数据
  for (const user of backup.users) {
    await withTransaction(STORE_USERS, 'readwrite', (store) => {
      return store.put(user)
    })
  }

  // 导入角色存档
  for (const player of backup.players) {
    await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
      return store.put(player)
    })
  }
}

// ==================== 用户操作 ====================

/** 创建用户 */
export async function createUserRecord(
  id: string,
  username: string,
  email: string,
  passwordHash: string
): Promise<UserRecordDB> {
  const user: UserRecordDB = {
    id,
    username,
    email,
    passwordHash,
    createdAt: Date.now(),
    characters: []
  }

  await withTransaction(STORE_USERS, 'readwrite', (store) => {
    return store.put(user)
  })

  return user
}

/** 根据用户名查找用户 */
export async function getUserByUsername(username: string): Promise<UserRecordDB | undefined> {
  return withTransaction<UserRecordDB | undefined>(
    STORE_USERS,
    'readonly',
    (store) => store.index('username').get(username)
  )
}

/** 根据ID查找用户 */
export async function getUserById(id: string): Promise<UserRecordDB | undefined> {
  return withTransaction<UserRecordDB | undefined>(
    STORE_USERS,
    'readonly',
    (store) => store.get(id)
  )
}

/** 验证用户登录 */
export async function verifyUserLogin(
  username: string,
  passwordHash: string
): Promise<UserRecordDB | null> {
  const user = await getUserByUsername(username)
  if (!user) return null
  if (user.passwordHash !== passwordHash) return null
  return user
}

/** 更新用户角色列表 */
async function updateUserCharacters(userId: string, characterName: string): Promise<void> {
  const user = await getUserById(userId)
  if (user) {
    if (!user.characters.includes(characterName)) {
      user.characters.push(characterName)
      await withTransaction(STORE_USERS, 'readwrite', (store) => {
        return store.put(user)
      })
    }
  }
}

// ==================== 迁移：localStorage → IndexedDB ====================

/**
 * 从 localStorage 迁移旧存档到 IndexedDB
 * 迁移成功后不会删除 localStorage 数据（安全起见）
 */
export async function migrateFromLocalStorage(): Promise<{
  userMigrated: boolean
  playerMigrated: boolean
}> {
  let userMigrated = false
  let playerMigrated = false

  // 检查是否已有 IndexedDB 数据，避免重复迁移
  const existingUsers = await withTransaction<number>(
    STORE_USERS,
    'readonly',
    (store) => store.count()
  )
  if (existingUsers > 0) {
    return { userMigrated: false, playerMigrated: false }
  }

  // 迁移用户数据
  const usersJson = localStorage.getItem('xiantu_users')
  if (usersJson) {
    try {
      const users = JSON.parse(usersJson) as Record<string, {
        id: string
        username: string
        email: string
        password_hash: string
        avatar?: string
        created_at: number
      }>

      for (const [key, userData] of Object.entries(users)) {
        const record: UserRecordDB = {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          passwordHash: userData.password_hash,
          avatar: userData.avatar,
          createdAt: userData.created_at,
          characters: []
        }

        // 检查是否已存在
        const existing = await getUserByUsername(userData.username)
        if (!existing) {
          await withTransaction(STORE_USERS, 'readwrite', (store) => {
            return store.put(record)
          })
        }
      }
      userMigrated = true
    } catch (e) {
      console.error('迁移用户数据失败:', e)
    }
  }

  // 迁移玩家存档
  const playerJson = localStorage.getItem('xiantu_player')
  if (playerJson) {
    try {
      const playerData = JSON.parse(playerJson) as any
      const userId = playerData.userId || 'local'
      const characterName = playerData.name || 'unknown'

      const existing = await loadPlayerData(userId, characterName)
      if (!existing) {
        await savePlayerData(userId, characterName, playerData)
        playerMigrated = true
      }
    } catch (e) {
      console.error('迁移玩家存档失败:', e)
    }
  }

  return { userMigrated, playerMigrated }
}

/** 初始化数据库 */
export async function initSaveManager(): Promise<void> {
  await openDB()

  // 自动迁移 localStorage 数据
  const result = await migrateFromLocalStorage()
  if (result.userMigrated || result.playerMigrated) {
    console.log(`存档迁移完成: 用户${result.userMigrated ? '✓' : '-'}, 角色${result.playerMigrated ? '✓' : '-'}`)
  }
}
