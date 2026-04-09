# 仙途问路 - 修仙挂机游戏

一款基于 Vue3 + Element Plus + Pinia 的文字修仙RPG游戏。

## 特性

- 🧘 **挂机修炼**: 自动吸收灵气，突破境界
- ⚔️ **打怪升级**: 击败妖兽获取装备和灵石
- 🐉 **灵宠系统**: 收服灵兽，并肩作战
- 🎲 **随机掉落**: 史诗装备、仙器等你来拿
- 💾 **自动存档**: localStorage 持久化

## 快速开始

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
```

### Docker 部署

```bash
# 一键启动
docker-compose up -d

# 访问 http://localhost:3000
```

### NAS 部署

1. 修改 `docker-compose.yml` 中的 volume 路径:
```yaml
volumes:
  game-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /你的NAS路径/game-data
```

2. 在 NAS 上运行 `docker-compose up -d`

## 技术栈

- Vue 3 (Composition API)
- Element Plus
- Pinia
- TypeScript
- Vite
- Docker

## 游戏说明

### 境界
练气期 → 筑基期 → 金丹期 → 元婴期 → 化神期 → 渡劫期 → 飞升期

### 装备品质
普通 → 优秀 → 稀有 → 史诗 → 仙器

### 神器示例
- 紫晶破晓戟
- 寒霜凝露链
- 九天混元甲
- 乾坤戒

### 场景
- 🌲 灵气森林 (Lv.1-10)
- 🌑 幽冥深渊 (Lv.11-30)
- ⛰️ 极霄峰 (Lv.31-50)

## License

MIT