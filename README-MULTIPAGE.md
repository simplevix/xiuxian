# 仙途问路 - 多页面与后端存档系统改造

已完成从单页面到多页面架构，并引入SQLite后端存档系统的改造。

## 主要改动

### 1. 后端服务（SQLite + Express）
- **位置**: `src/server/index.ts`
- **功能**: 提供REST API管理玩家存档
- **数据库**: SQLite（`data/game.db`）
- **端口**: 3001
- **API端点**:
  - `GET /api/saves` - 获取存档列表
  - `GET /api/saves/:name` - 加载存档
  - `POST /api/saves/:name` - 保存存档
  - `DELETE /api/saves/:name` - 删除存档
  - 导入/导出功能

### 2. 前端路由架构
- **路由配置**: `src/router/index.ts`
- **页面结构**:
  - `/` - 首页（创建角色/继续游戏）
  - `/game` - 游戏主布局（包含顶部栏和侧边栏）
    - `/game/battle` - 修炼页面
    - `/game/secret-realm` - 秘境页面
    - `/game/inventory` - 背包页面
    - `/game/pet` - 灵宠页面
    - `/game/formation` - 阵法页面
    - `/game/shop` - 商店页面

### 3. 存档系统升级
- **文件**: `src/utils/saveManager.ts`
- **从IndexedDB迁移到HTTP API + SQLite**
- **兼容性**: 自动从localStorage迁移旧存档
- **新特性**: 支持多存档管理、网络备份导出

### 4. 构建工具更新
- **Vite配置**: 添加代理 `/api` → `localhost:3001`
- **npm脚本**:
  - `npm run server` - 启动后端
  - `npm run dev` - 启动前端
  - `npm start` - 同时启动前后端（需concurrently）

## 如何启动

### 方法一：分别启动（推荐）
```bash
# 启动后端（端口3001）
npm run server

# 在新终端启动前端（端口3000）
npm run dev
```

### 方法二：使用批处理脚本
```bash
# Windows
run-all.bat
```

## 文件结构变化

```
仙途问路/
├── src/
│   ├── server/          # 新增：后端服务
│   │   └── index.ts    # Express + SQLite API
│   ├── router/         # 新增：路由配置
│   │   └── index.ts
│   ├── views/          # 页面视图（拆分）
│   │   ├── BattleView.vue        # 修炼
│   │   ├── SecretRealmView.vue   # 秘境
│   │   ├── InventoryView.vue     # 背包
│   │   ├── FormationView.vue     # 阵法
│   │   ├── HomeView.vue          # 首页
│   │   ├── GameView.vue          # 游戏主布局
│   │   └── PetView.vue/ShopView.vue（原有）
│   └── utils/
│       └── saveManager.ts       # 改为HTTP客户端
├── data/               # 新增：SQLite数据文件目录
├── vite.config.ts      # 添加代理配置
└── package.json        # 添加新依赖和脚本
```

## 技术要点

1. **前后端分离**: 前端Vue 3 + Vite，后端Express + SQLite
2. **路由嵌套**: `GameView`作为布局组件，嵌套显示各功能页面
3. **数据持久化**: SQLite提供稳定可靠的存档存储
4. **开发便捷**: Vite代理解决开发环境跨域问题
5. **渐进升级**: 保持原有游戏功能不变，只改架构

## 后续开发建议

1. **页面完善**: 填充各功能页面实际内容
2. **用户认证**: 如需多用户，可增加登录系统
3. **导入/导出**: 完善网络存档备份功能
4. **离线支持**: 可考虑Service Worker缓存

## 数据迁移

- 首次启动时自动将`localStorage`中的`xiantu_player`存档迁移到SQLite
- 迁移成功后删除localStorage旧数据
- 新存档直接保存到后端数据库