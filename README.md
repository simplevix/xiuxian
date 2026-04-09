# 仙途问路 🏮

> 一款基于 Vue 3 + TypeScript 的修仙放置游戏

![Vue](https://img.shields.io/badge/Vue-3.x-42b883?style=flat-square&logo=vuedotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?style=flat-square&logo=vite)

## 🎮 游戏简介

《仙途问路》是一款修仙题材的放置类网页游戏。玩家将从凡人开始，通过修炼、战斗、收集功法，一步步踏上修仙之路，最终得道成仙。

### 核心玩法

- 🗡️ **战斗系统** - 挑战各路妖魔鬼怪，获取经验和宝物
- 📜 **功法系统** - 收集和装备功法，获得强大属性加成
- 🏪 **商店系统** - 使用灵石购买装备和功法
- 🌍 **世界探索** - 解锁不同境界的地图区域
- 💾 **数据持久化** - 本地 SQLite 数据库存储游戏进度

## ✨ 特色功能

- 🎨 精美的修仙风格 UI 设计
- ⚡ 流畅的实时战斗动画
- 📱 响应式布局，支持移动端访问
- 🔄 自动存档，无需担心进度丢失

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | 渐进式 JavaScript 框架 |
| TypeScript | 类型安全的 JavaScript 超集 |
| Pinia | Vue 3 状态管理库 |
| Element Plus | UI 组件库 |
| Vite | 下一代前端构建工具 |
| SQLite (WASM) | 浏览器端数据库 |

## 🚀 快速开始

### 本地运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

### Docker 部署

```bash
# 构建并启动容器
docker-compose up -d

# 访问应用
# http://localhost:8080
```

## 📁 项目结构

```
xiuxian/
├── src/
│   ├── components/    # Vue 组件
│   ├── views/        # 页面视图
│   ├── stores/       # Pinia 状态管理
│   ├── types/        # TypeScript 类型定义
│   └── utils/        # 工具函数
├── public/           # 静态资源
├── docker-compose.yml
└── Dockerfile
```

## 🎯 游戏境界

| 境界 | 说明 |
|------|------|
| 炼气期 | 修仙入门，基础修炼 |
| 筑基期 | 稳固根基，小有所成 |
| 金丹期 | 内结金丹，实力大增 |
| 元婴期 | 元婴出窍，神通初现 |
| 化神期 | 化凡为神，飞升在即 |

## 📝 License

MIT License - 欢迎开源与二次创作

---

⭐ 如果这个项目对你有帮助，请给个 Star！
