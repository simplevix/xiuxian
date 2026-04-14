<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePlayerStore } from '@/stores/player'
import { ElMessage, ElMessageBox } from 'element-plus'
import { REALMS, QUALITIES, TECHNIQUE_QUALITIES } from '@/types/game'
import type { QualityId, EquipmentQuality, TechniqueQualityId } from '@/types/game'
import { generateEquipment, generateId, chance } from '@/utils/random'

const router = useRouter()
const authStore = useAuthStore()
const playerStore = usePlayerStore()

// 检查GM权限
onMounted(() => {
  if (!authStore.isGM) {
    ElMessage.error('无权访问GM页面')
    router.push('/')
  }
})

// GM功能分类
const activeCategory = ref('player')
const categories = [
  { id: 'player', label: '玩家管理', icon: 'User' },
  { id: 'items', label: '物品管理', icon: 'Box' },
  { id: 'system', label: '系统操作', icon: 'Setting' }
]

// ========== 玩家管理 ==========
const playerForm = ref({
  spiritStones: 0,
  exp: 0,
  realmIndex: 0,
  realmLevel: 0,
  hp: 0,
  maxHp: 0,
  attack: 0,
  defense: 0,
  critRate: 0,
  critDamage: 0,
  dodgeRate: 0
})

function loadPlayerData() {
  if (!playerStore.player) {
    ElMessage.warning('没有玩家数据，请先创建角色')
    return
  }
  const p = playerStore.player
  playerForm.value = {
    spiritStones: p.spiritStones,
    exp: p.realmLevelExp,
    realmIndex: p.realmIndex,
    realmLevel: p.realmLevel,
    hp: p.hp,
    maxHp: p.maxHp,
    attack: p.attack,
    defense: p.defense,
    critRate: Math.round(p.critRate * 100),
    critDamage: p.critDamage,
    dodgeRate: Math.round(p.dodgeRate * 100)
  }
  ElMessage.success('已加载当前玩家数据')
}

function savePlayerData() {
  if (!playerStore.player) {
    ElMessage.warning('没有玩家数据')
    return
  }
  const p = playerStore.player
  p.spiritStones = playerForm.value.spiritStones
  p.realmLevelExp = playerForm.value.exp
  p.realmIndex = playerForm.value.realmIndex
  p.realmLevel = playerForm.value.realmLevel
  p.hp = playerForm.value.hp
  p.maxHp = playerForm.value.maxHp
  p.attack = playerForm.value.attack
  p.defense = playerForm.value.defense
  p.critRate = playerForm.value.critRate / 100
  p.critDamage = playerForm.value.critDamage
  p.dodgeRate = playerForm.value.dodgeRate / 100
  
  playerStore.recalcStats()
  playerStore.saveGame()
  ElMessage.success('玩家数据已保存')
}

// ========== 物品管理 ==========
const itemForm = ref({
  type: 'equipment' as 'equipment' | 'pet' | 'artifact' | 'technique',
  quality: 'epic' as QualityId,
  techniqueQuality: 'epic' as TechniqueQualityId,
  count: 1
})

const equipmentTypes: EquipmentType[] = ['weapon', 'armor', 'helmet', 'pants', 'boots', 'necklace', 'ring']

function generateItems() {
  if (!playerStore.player) {
    ElMessage.warning('没有玩家数据')
    return
  }
  
  const count = itemForm.value.count
  let successCount = 0
  
  switch (itemForm.value.type) {
    case 'equipment':
      for (let i = 0; i < count; i++) {
        const type = equipmentTypes[Math.floor(Math.random() * equipmentTypes.length)]
        const equip = generateEquipment(type, itemForm.value.quality, playerStore.totalLevel)
        playerStore.player.inventory.push(equip)
      }
      ElMessage.success(`成功生成 ${count} 件${QUALITIES[itemForm.value.quality].name}装备`)
      break
      
    case 'pet':
      // 生成灵宠
      import('@/types/game').then(({ PET_TEMPLATES }) => {
        const templates = Object.values(PET_TEMPLATES)
        for (let i = 0; i < count; i++) {
          const template = templates[Math.floor(Math.random() * templates.length)]
          const qualityMultipliers = { common: 1, good: 1.5, rare: 2, epic: 3, legendary: 5 }
          const m = qualityMultipliers[itemForm.value.quality]
          playerStore.addPet({
            ...template,
            attack: Math.floor(template.attack * m),
            defense: Math.floor(template.defense * m)
          })
        }
        ElMessage.success(`成功生成 ${count} 只${QUALITIES[itemForm.value.quality].name}灵宠`)
      })
      break
      
    case 'artifact':
      // 生成法宝
      import('@/types/game').then(({ ARTIFACT_TEMPLATES }) => {
        const templates = Object.values(ARTIFACT_TEMPLATES)
        const qualityMap: Record<QualityId, string[]> = {
          common: ['common'],
          good: ['good', 'common'],
          rare: ['rare', 'good'],
          epic: ['epic', 'rare'],
          legendary: ['legendary', 'epic']
        }
        const allowedQualities = qualityMap[itemForm.value.quality]
        
        for (let i = 0; i < count; i++) {
          const candidates = templates.filter(t => allowedQualities.includes(t.quality))
          if (candidates.length > 0) {
            const template = candidates[Math.floor(Math.random() * candidates.length)]
            playerStore.addArtifact({ ...template, id: '' })
            successCount++
          }
        }
        ElMessage.success(`成功生成 ${successCount} 件法宝`)
      })
      break
      
    case 'technique':
      // 生成功法
      import('@/types/game').then(({ TECHNIQUE_TEMPLATES }) => {
        const qualityMap: Record<TechniqueQualityId, string[]> = {
          common: ['common'],
          fine: ['fine', 'common'],
          rare: ['rare', 'fine'],
          epic: ['epic', 'rare'],
          excellent: ['excellent', 'epic'],
          superior: ['superior', 'excellent'],
          immortal: ['immortal', 'superior'],
          divine: ['divine', 'immortal']
        }
        const allowedQualities = qualityMap[itemForm.value.techniqueQuality]
        const templates = Object.values(TECHNIQUE_TEMPLATES).filter(t => allowedQualities.includes(t.quality))
        
        for (let i = 0; i < count; i++) {
          if (templates.length > 0) {
            const template = templates[Math.floor(Math.random() * templates.length)]
            if (playerStore.addTechnique({ ...template, id: '' })) {
              successCount++
            }
          }
        }
        ElMessage.success(`成功生成 ${successCount} 个功法`)
      })
      break
  }
  
  playerStore.saveGame()
}

// ========== 系统操作 ==========
async function clearInventory() {
  try {
    await ElMessageBox.confirm('确定要清空玩家背包吗？', '警告', { type: 'warning' })
    if (playerStore.player) {
      playerStore.player.inventory = []
      playerStore.saveGame()
      ElMessage.success('背包已清空')
    }
  } catch {
    // 取消
  }
}

function fullHeal() {
  playerStore.fullHeal()
  playerStore.saveGame()
  ElMessage.success('生命值已回满')
}

function resetCooldowns() {
  if (playerStore.player) {
    playerStore.player.artifacts.forEach(a => {
      a.skill.currentCooldown = 0
    })
    playerStore.saveGame()
    ElMessage.success('技能冷却已重置')
  }
}

function unlockAllFormations() {
  import('@/types/game').then(({ FORMATION_CONFIGS }) => {
    if (playerStore.player) {
      FORMATION_CONFIGS.forEach(f => {
        if (!playerStore.player!.unlockedFormations.includes(f.id)) {
          playerStore.player!.unlockedFormations.push(f.id)
        }
      })
      playerStore.saveGame()
      ElMessage.success('已解锁所有阵法')
    }
  })
}

function maxAllFormations() {
  import('@/types/game').then(({ FORMATION_CONFIGS }) => {
    if (playerStore.player?.formation) {
      const config = FORMATION_CONFIGS.find(f => f.id === playerStore.player!.formation!.formationId)
      if (config) {
        playerStore.player.formation.nodes.forEach(node => {
          const nodeConfig = config.nodes.find(n => n.type === node.type)
          if (nodeConfig) {
            node.activated = true
            node.level = nodeConfig.maxLevel
          }
        })
        playerStore.saveGame()
        ElMessage.success('所有阵法节点已升至满级')
      }
    }
  })
}

function addMaxSpiritStones() {
  if (playerStore.player) {
    playerStore.player.spiritStones += 999999999
    playerStore.saveGame()
    ElMessage.success('已添加 999,999,999 灵石')
  }
}

// 返回首页
function goHome() {
  router.push('/')
}

// 登出
function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="gm-container">
    <!-- GM头部 -->
    <header class="gm-header">
      <div class="header-left">
        <h1 class="gm-title">🎮 GM管理后台</h1>
        <span class="gm-badge">管理员模式</span>
      </div>
      <div class="header-right">
        <el-button @click="goHome" type="primary" plain>
          <el-icon><HomeFilled /></el-icon> 返回首页
        </el-button>
        <el-button @click="logout" type="danger" plain>
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-button>
      </div>
    </header>

    <!-- GM主体 -->
    <main class="gm-main">
      <!-- 左侧分类导航 -->
      <aside class="gm-sidebar">
        <nav class="category-nav">
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['category-btn', { active: activeCategory === cat.id }]"
            @click="activeCategory = cat.id"
          >
            <el-icon><component :is="cat.icon" /></el-icon>
            {{ cat.label }}
          </button>
        </nav>
      </aside>

      <!-- 右侧内容区 -->
      <section class="gm-content">
        <!-- 玩家管理 -->
        <div v-if="activeCategory === 'player'" class="panel">
          <h2 class="panel-title">玩家属性管理</h2>
          <div class="panel-actions">
            <el-button type="primary" @click="loadPlayerData">
              <el-icon><Refresh /></el-icon> 加载当前数据
            </el-button>
            <el-button type="success" @click="savePlayerData">
              <el-icon><Check /></el-icon> 保存修改
            </el-button>
          </div>
          
          <div class="form-grid" v-if="playerStore.player">
            <div class="form-group">
              <label>灵石</label>
              <el-input-number v-model="playerForm.spiritStones" :min="0" :max="999999999" />
            </div>
            <div class="form-group">
              <label>境界经验</label>
              <el-input-number v-model="playerForm.exp" :min="0" :max="999999" />
            </div>
            <div class="form-group">
              <label>境界</label>
              <el-select v-model="playerForm.realmIndex" style="width: 100%">
                <el-option
                  v-for="(realm, index) in REALMS"
                  :key="realm.id"
                  :label="realm.name"
                  :value="index"
                />
              </el-select>
            </div>
            <div class="form-group">
              <label>境界层数</label>
              <el-input-number v-model="playerForm.realmLevel" :min="0" :max="10" />
            </div>
            <div class="form-group">
              <label>当前生命</label>
              <el-input-number v-model="playerForm.hp" :min="1" :max="999999" />
            </div>
            <div class="form-group">
              <label>最大生命</label>
              <el-input-number v-model="playerForm.maxHp" :min="1" :max="999999" />
            </div>
            <div class="form-group">
              <label>攻击力</label>
              <el-input-number v-model="playerForm.attack" :min="1" :max="999999" />
            </div>
            <div class="form-group">
              <label>防御力</label>
              <el-input-number v-model="playerForm.defense" :min="1" :max="999999" />
            </div>
            <div class="form-group">
              <label>暴击率 (%)</label>
              <el-input-number v-model="playerForm.critRate" :min="0" :max="100" />
            </div>
            <div class="form-group">
              <label>暴击伤害</label>
              <el-input-number v-model="playerForm.critDamage" :min="1" :max="10" :step="0.1" />
            </div>
            <div class="form-group">
              <label>闪避率 (%)</label>
              <el-input-number v-model="playerForm.dodgeRate" :min="0" :max="100" />
            </div>
          </div>
          
          <el-alert v-else title="没有玩家数据，请先创建角色" type="warning" :closable="false" />
        </div>

        <!-- 物品管理 -->
        <div v-if="activeCategory === 'items'" class="panel">
          <h2 class="panel-title">物品生成</h2>
          
          <div class="form-section">
            <div class="form-row">
              <div class="form-group">
                <label>物品类型</label>
                <el-select v-model="itemForm.type" style="width: 100%">
                  <el-option label="装备" value="equipment" />
                  <el-option label="灵宠" value="pet" />
                  <el-option label="法宝" value="artifact" />
                  <el-option label="功法" value="technique" />
                </el-select>
              </div>
              
              <div class="form-group" v-if="itemForm.type === 'technique'">
                <label>功法品质</label>
                <el-select v-model="itemForm.techniqueQuality" style="width: 100%">
                  <el-option label="凡品" value="common" />
                  <el-option label="灵品" value="fine" />
                  <el-option label="玄品" value="rare" />
                  <el-option label="真品" value="epic" />
                  <el-option label="地品" value="excellent" />
                  <el-option label="天品" value="superior" />
                  <el-option label="仙品" value="immortal" />
                  <el-option label="神品" value="divine" />
                </el-select>
              </div>
              
              <div class="form-group" v-else>
                <label>品质</label>
                <el-select v-model="itemForm.quality" style="width: 100%">
                  <el-option label="普通" value="common" />
                  <el-option label="优秀" value="good" />
                  <el-option label="稀有" value="rare" />
                  <el-option label="史诗" value="epic" />
                  <el-option label="仙器" value="legendary" />
                </el-select>
              </div>
              
              <div class="form-group">
                <label>数量</label>
                <el-input-number v-model="itemForm.count" :min="1" :max="100" />
              </div>
            </div>
            
            <el-button type="primary" size="large" @click="generateItems" class="generate-btn">
              <el-icon><Plus /></el-icon> 生成物品
            </el-button>
          </div>
        </div>

        <!-- 系统操作 -->
        <div v-if="activeCategory === 'system'" class="panel">
          <h2 class="panel-title">系统操作</h2>
          
          <div class="action-grid">
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#67c23a"><FirstAidKit /></el-icon>
                <h3>满血复活</h3>
                <p>恢复玩家全部生命值</p>
                <el-button type="success" @click="fullHeal">执行</el-button>
              </div>
            </el-card>
            
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#409eff"><Refresh /></el-icon>
                <h3>重置冷却</h3>
                <p>重置所有技能冷却时间</p>
                <el-button type="primary" @click="resetCooldowns">执行</el-button>
              </div>
            </el-card>
            
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#e6a23c"><Grid /></el-icon>
                <h3>解锁阵法</h3>
                <p>解锁所有可用阵法</p>
                <el-button type="warning" @click="unlockAllFormations">执行</el-button>
              </div>
            </el-card>
            
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#909399"><Top /></el-icon>
                <h3>满级阵法</h3>
                <p>将所有阵法节点升至满级</p>
                <el-button @click="maxAllFormations">执行</el-button>
              </div>
            </el-card>
            
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#f56c6c"><Money /></el-icon>
                <h3>无限灵石</h3>
                <p>添加 999,999,999 灵石</p>
                <el-button type="danger" @click="addMaxSpiritStones">执行</el-button>
              </div>
            </el-card>
            
            <el-card class="action-card" shadow="hover">
              <div class="action-content">
                <el-icon class="action-icon" :size="32" color="#f56c6c"><Delete /></el-icon>
                <h3>清空背包</h3>
                <p>删除背包中所有物品</p>
                <el-button type="danger" plain @click="clearInventory">执行</el-button>
              </div>
            </el-card>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.gm-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
}

.gm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.gm-title {
  font-size: 1.5rem;
  margin: 0;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.gm-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
}

.header-right {
  display: flex;
  gap: 12px;
}

.gm-main {
  display: flex;
  min-height: calc(100vh - 73px);
}

.gm-sidebar {
  width: 200px;
  padding: 20px 12px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.category-nav {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.95rem;
}

.category-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #fff;
}

.category-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
}

.gm-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.panel {
  max-width: 900px;
}

.panel-title {
  font-size: 1.3rem;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.form-section {
  background: rgba(255, 255, 255, 0.03);
  padding: 24px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.generate-btn {
  width: 100%;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.action-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.action-card :deep(.el-card__body) {
  padding: 20px;
}

.action-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 10px;
}

.action-content h3 {
  margin: 0;
  font-size: 1rem;
}

.action-content p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
}

.action-icon {
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .gm-sidebar {
    width: 60px;
    padding: 12px 8px;
  }
  
  .category-btn {
    justify-content: center;
    padding: 12px;
  }
  
  .category-btn span {
    display: none;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
