/**
 * IndexedDB 存档管理器
 * 简化版：单用户本地存档，不支持多账号
 */

const DB_NAME = 'XianTuSaveDB'
const DB_VERSION = 2  // 版本升级

// 数据库表名（简化：只保留玩家存档）
const STORE_PLAYERS = 'players'       // 游戏角色存档表

// 存档版本号（用于数据迁移）
const SAVE_VERSION = 1

export interface SaveMetadata {
  version: number
  savedAt: number
  appVersion?: string
}

export interface PlayerSaveRecord {
  characterName: string   // 角色道号（唯一标识）
  playerData: string      // JSON序列化的 Player 对象
  metadata: SaveMetadata  // 存档元信息
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

      // 角色存档表（简化：直接用 characterName 作为主键）
      if (!db.objectStoreNames.contains(STORE_PLAYERS)) {
        const playerStore = db.createObjectStore(STORE_PLAYERS, { keyPath: 'characterName' })
        playerStore.createIndex('savedAt', 'metadata.savedAt', { unique: false })
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
  characterName: string,
  playerData: object
): Promise<void> {
  const record: PlayerSaveRecord = {
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
}

/** 加载游戏角色存档 */
export async function loadPlayerData(
  characterName: string
): Promise<object | null> {
  const record = await withTransaction<PlayerSaveRecord | undefined>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.get(characterName)
  )

  if (!record) return null

  return JSON.parse(record.playerData)
}

/** 获取所有存档列表 */
export async function listPlayerSaves(): Promise<Array<{
  characterName: string
  metadata: SaveMetadata
}>> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_PLAYERS, 'readonly')
    const store = transaction.objectStore(STORE_PLAYERS)
    const request = store.getAll()

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
  characterName: string
): Promise<void> {
  await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
    return store.delete(characterName)
  })
}

/** 导出角色存档为 JSON 字符串（用于备份） */
export async function exportPlayerData(
  characterName: string
): Promise<string | null> {
  const record = await withTransaction<PlayerSaveRecord | undefined>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.get(characterName)
  )
  return record ? record.playerData : null
}

/** 从 JSON 字符串导入角色存档（用于恢复） */
export async function importPlayerData(
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

  const players = await withTransaction<PlayerSaveRecord[]>(
    STORE_PLAYERS,
    'readonly',
    (store) => store.getAll()
  )

  const backup = {
    version: SAVE_VERSION,
    exportedAt: Date.now(),
    players
  }

  return JSON.stringify(backup, null, 2)
}

/** 从完整备份恢复所有存档 */
export async function importAllSaves(backupJson: string): Promise<void> {
  const backup = JSON.parse(backupJson)

  if (!backup.players) {
    throw new Error('备份文件格式无效')
  }

  // 导入角色存档
  for (const player of backup.players) {
    await withTransaction(STORE_PLAYERS, 'readwrite', (store) => {
      return store.put(player)
    })
  }
}

// ==================== 迁移：旧格式 → 新格式 ====================

/**
 * 从旧版 IndexedDB 格式迁移（userId + characterName 复合键）
 */
export async function migrateFromOldFormat(): Promise<boolean> {
  const db = await openDB()

  // 检查是否需要迁移（检查是否存在旧版 users 表）
  // 注意：新版本只保留 players 表，所以这个函数保留但简化处理

  // 尝试从 localStorage 迁移旧存档
  const playerJson = localStorage.getItem('xiantu_player')
  if (playerJson) {
    try {
      const playerData = JSON.parse(playerJson) as any
      const characterName = playerData.name || 'unknown'

      const existing = await loadPlayerData(characterName)
      if (!existing) {
        await savePlayerData(characterName, playerData)
        console.log('从 localStorage 迁移存档成功')
        return true
      }
    } catch (e) {
      console.error('迁移玩家存档失败:', e)
    }
  }

  return false
}

/** 初始化数据库 */
export async function initSaveManager(): Promise<void> {
  await openDB()

  // 自动迁移旧数据
  await migrateFromOldFormat()
}
