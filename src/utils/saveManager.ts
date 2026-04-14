/**
 * 存档管理器 - HTTP API 客户端（对接后端 SQLite）
 */

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'

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
    throw new Error(`API 请求失败: ${response.statusText}`)
  }

  return response.json()
}

// ==================== 存档操作 ====================

/** 保存游戏角色存档 */
export async function savePlayerData(
  characterName: string,
  playerData: object
): Promise<void> {
  await apiClient(`/saves/${encodeURIComponent(characterName)}`, {
    method: 'POST',
    body: JSON.stringify(playerData)
  })
}

/** 加载游戏角色存档 */
export async function loadPlayerData(
  characterName: string
): Promise<object | null> {
  try {
    const data = await apiClient<object>(`/saves/${encodeURIComponent(characterName)}`)
    return data
  } catch (error) {
    // 404 表示存档不存在
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
}

/** 获取所有存档列表 */
export async function listPlayerSaves(): Promise<Array<{
  characterName: string
  metadata: SaveMetadata
}>> {
  const data = await apiClient<Array<{
    characterName: string
    metadata: SaveMetadata
  }>>('/saves')
  return data
}

/** 删除角色存档 */
export async function deletePlayerData(
  characterName: string
): Promise<void> {
  await apiClient(`/saves/${encodeURIComponent(characterName)}`, {
    method: 'DELETE'
  })
}

/** 导出角色存档为 JSON 字符串（用于备份） */
export async function exportPlayerData(
  characterName: string
): Promise<string | null> {
  try {
    const data = await apiClient<object>(`/saves/${encodeURIComponent(characterName)}/export`)
    return JSON.stringify(data, null, 2)
  } catch (error) {
    // 存档不存在
    if (error instanceof Error && error.message.includes('404')) {
      return null
    }
    throw error
  }
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

  const playerData = JSON.parse(playerDataJson)
  await apiClient(`/saves/${encodeURIComponent(characterName)}/import`, {
    method: 'POST',
    body: JSON.stringify(playerData)
  })
}

/** 导出所有存档数据（完整备份） */
export async function exportAllSaves(): Promise<string> {
  // 获取所有存档列表
  const saves = await listPlayerSaves()
  
  const players: PlayerSaveRecord[] = []
  
  // 逐一下载每个存档
  for (const save of saves) {
    const data = await loadPlayerData(save.characterName)
    if (data) {
      players.push({
        characterName: save.characterName,
        playerData: JSON.stringify(data),
        metadata: save.metadata
      })
    }
  }
  
  const backup = {
    version: 1,
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
    await importPlayerData(player.characterName, player.playerData)
  }
}

// ==================== 迁移：旧格式 → 新格式 ====================

/**
 * 从 localStorage 迁移到后端 SQLite（兼容性处理）
 */
export async function migrateFromOldFormat(): Promise<boolean> {
  // 尝试从 localStorage 迁移旧存档
  const playerJson = localStorage.getItem('xiantu_player')
  if (playerJson) {
    try {
      const playerData = JSON.parse(playerJson) as any
      const characterName = playerData.name || 'unknown'
      
      // 检查是否已存在于后端
      const existing = await loadPlayerData(characterName)
      if (!existing) {
        await savePlayerData(characterName, playerData)
        console.log('从 localStorage 迁移存档到后端 SQLite 成功')
        // 迁移成功后，可以删除 localStorage 的旧数据
        localStorage.removeItem('xiantu_player')
        return true
      }
    } catch (e) {
      console.error('迁移玩家存档失败:', e)
      // 如果迁移失败，保留 localStorage 数据
    }
  }
  
  return false
}

/** 初始化存档管理器 */
export async function initSaveManager(): Promise<void> {
  console.log('使用后端 SQLite 存档系统')
  
  // 自动迁移旧数据
  await migrateFromOldFormat().then(success => {
    if (success) {
      console.log('旧存档迁移完成')
    }
  }).catch(err => {
    console.warn('存档迁移过程中出现错误:', err)
  })
}
