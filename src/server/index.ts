import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { SaveMetadata } from '@/utils/saveManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SQLite 数据库
const DB_PATH = path.join(__dirname, '../../data/game.db');
const db = new Database(DB_PATH);

// 初始化数据库表
function initDatabase() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS players (
      character_name TEXT PRIMARY KEY,
      player_data TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      saved_at INTEGER DEFAULT (unixepoch())
    )
  `).run();

  // 用户表
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      avatar TEXT,
      created_at INTEGER DEFAULT (unixepoch())
    )
  `).run();

  console.log('Database initialized at:', DB_PATH);
}

// API路由
// 获取所有存档列表
app.get('/api/saves', (req, res) => {
  try {
    const stmt = db.prepare('SELECT character_name, version, saved_at FROM players ORDER BY saved_at DESC');
    const rows = stmt.all();
    res.json(rows.map(row => ({
      characterName: row.character_name,
      metadata: {
        version: row.version,
        savedAt: row.saved_at
      }
    })));
  } catch (error) {
    console.error('获取存档列表失败:', error);
    res.status(500).json({ error: '获取存档列表失败' });
  }
});

// 加载存档
app.get('/api/saves/:characterName', (req, res) => {
  try {
    const { characterName } = req.params;
    const stmt = db.prepare('SELECT player_data FROM players WHERE character_name = ?');
    const row = stmt.get(characterName);
    
    if (!row) {
      res.status(404).json({ error: '存档不存在' });
      return;
    }
    
    const playerData = JSON.parse(row.player_data as string);
    res.json(playerData);
  } catch (error) {
    console.error('加载存档失败:', error);
    res.status(500).json({ error: '加载存档失败' });
  }
});

// 保存存档
app.post('/api/saves/:characterName', (req, res) => {
  try {
    const { characterName } = req.params;
    const playerData = req.body;
    
    // 验证数据格式
    if (!playerData || typeof playerData !== 'object') {
      res.status(400).json({ error: '存档数据格式无效' });
      return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO players (character_name, player_data, version, saved_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(characterName, JSON.stringify(playerData), 1, now);
    
    res.json({ success: true, message: '存档保存成功' });
  } catch (error) {
    console.error('保存存档失败:', error);
    res.status(500).json({ error: '保存存档失败' });
  }
});

// 删除存档
app.delete('/api/saves/:characterName', (req, res) => {
  try {
    const { characterName } = req.params;
    const stmt = db.prepare('DELETE FROM players WHERE character_name = ?');
    const result = stmt.run(characterName);
    
    if (result.changes === 0) {
      res.status(404).json({ error: '存档不存在' });
      return;
    }
    
    res.json({ success: true, message: '存档删除成功' });
  } catch (error) {
    console.error('删除存档失败:', error);
    res.status(500).json({ error: '删除存档失败' });
  }
});

// 导出存档（单存档）
app.get('/api/saves/:characterName/export', (req, res) => {
  try {
    const { characterName } = req.params;
    const stmt = db.prepare('SELECT player_data FROM players WHERE character_name = ?');
    const row = stmt.get(characterName);
    
    if (!row) {
      res.status(404).json({ error: '存档不存在' });
      return;
    }
    
    res.json(JSON.parse(row.player_data as string));
  } catch (error) {
    console.error('导出存档失败:', error);
    res.status(500).json({ error: '导出存档失败' });
  }
});

// 导入存档
app.post('/api/saves/:characterName/import', (req, res) => {
  try {
    const { characterName } = req.params;
    const playerData = req.body;
    
    // 验证 JSON 数据
    if (!playerData || typeof playerData !== 'object') {
      res.status(400).json({ error: '存档数据格式无效' });
      return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO players (character_name, player_data, version, saved_at)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(characterName, JSON.stringify(playerData), 1, now);
    
    res.json({ success: true, message: '存档导入成功' });
  } catch (error) {
    console.error('导入存档失败:', error);
    res.status(500).json({ error: '导入存档失败' });
  }
});

// ==================== 用户 API ====================

// 检查用户名是否存在
app.get('/api/users/check/:username', (req, res) => {
  try {
    const { username } = req.params;
    const stmt = db.prepare('SELECT id FROM users WHERE username = ?');
    const row = stmt.get(username);
    res.json({ exists: !!row });
  } catch (error) {
    console.error('检查用户名失败:', error);
    res.status(500).json({ error: '检查用户名失败' });
  }
});

// 用户注册
app.post('/api/users/register', (req, res) => {
  try {
    const { id, username, email, passwordHash } = req.body;
    
    if (!id || !username || !email || !passwordHash) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    // 检查用户名是否已存在
    const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?');
    if (checkStmt.get(username)) {
      res.status(409).json({ error: '用户名已存在' });
      return;
    }
    
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, username, email, passwordHash, now);
    
    res.json({ success: true, message: '注册成功', user: { id, username, email, createdAt: now } });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败' });
  }
});

// 用户登录
app.post('/api/users/login', (req, res) => {
  try {
    const { username, passwordHash } = req.body;
    
    if (!username || !passwordHash) {
      res.status(400).json({ error: '缺少必要参数' });
      return;
    }
    
    const stmt = db.prepare('SELECT id, username, email, password_hash, avatar, created_at FROM users WHERE username = ? AND password_hash = ?');
    const row = stmt.get(username, passwordHash) as any;
    
    if (!row) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }
    
    res.json({
      success: true,
      message: '登录成功',
      user: {
        id: row.id,
        username: row.username,
        email: row.email,
        avatar: row.avatar,
        createdAt: row.created_at
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取用户信息
app.get('/api/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT id, username, email, avatar, created_at FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }
    
    res.json({
      id: row.id,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      createdAt: row.created_at
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 启动服务器
function startServer() {
  // 确保数据目录存在
  const dataDir = path.join(__dirname, '../../data');
  try {
    const fs = require('fs');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch (err) {
    console.warn('创建数据目录失败，但继续运行');
  }
  
  initDatabase();
  
  app.listen(PORT, () => {
    console.log(`后端服务器运行在 http://localhost:${PORT}`);
    console.log(`游戏数据保存在: ${DB_PATH}`);
  });
}

// 开发环境下自动启动
if (import.meta.url === new URL(import.meta.url).href) {
  startServer();
}

export { app, startServer };