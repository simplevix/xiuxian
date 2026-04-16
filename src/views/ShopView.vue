<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePlayerStore } from '@/stores/player'
import { QUALITIES, ARTIFACT_TEMPLATES, TECHNIQUE_TEMPLATES, TECHNIQUE_QUALITIES, REALMS } from '@/types/game'
import { generateEquipment, generateId } from '@/utils/random'
import { getSpecialItems } from '@/utils/equipmentLoader'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Equipment, Artifact, Technique } from '@/types/game'

const playerStore = usePlayerStore()
const player = computed(() => playerStore.player)

// 抽奖
const drawResult = ref<Equipment | null>(null)
const drawAnimation = ref(false)

function getDrawCost(tier: number) {
  const costs = [0, 50, 200, 500, 1500, 5000]
  return costs[Math.min(tier, costs.length - 1)]
}

function getDrawChance(tier: number) {
  const chances = [0, 0.5, 0.25, 0.15, 0.08, 0.02]
  return chances[Math.min(tier, chances.length - 1)]
}

/**
 * 从 CSV special_items 中随机抽取指定品质的装备
 * 支持 legendary / divine / primordial 三档
 */
function drawSpecialItem(quality: 'legendary' | 'divine' | 'primordial'): Equipment {
  const { legendaryItems, divineItems, primordialItems } = getSpecialItems()
  const pool = quality === 'primordial' ? primordialItems
              : quality === 'divine'    ? divineItems
              : legendaryItems
  if (pool.length === 0) {
    // 兜底：回落到随机生成
    return generateEquipment('weapon', quality)
  }
  const template = pool[Math.floor(Math.random() * pool.length)]
  return { ...template, id: generateId() }
}

function doDraw(tier: number) {
  if (!player.value) return
  const cost = getDrawCost(tier)
  if (player.value.spiritStones < cost) {
    ElMessage.warning(`灵石不足！需要 ${cost} 灵石`)
    return
  }

  player.value.spiritStones -= cost
  const roll = Math.random()

  // 逐级判断产出品质 - 根据抽奖档次限制最低品质
  // qualityOrder 包含仙器以下的常规品质
  type NormalQuality = 'common' | 'good' | 'rare' | 'epic'
  type DrawQuality = NormalQuality | 'legendary' | 'divine'

  // 各档次最低品质：1-青铜 2-白银 3-黄金 4-钻石 5-仙缘
  const minQuality: Record<number, DrawQuality> = {
    1: 'common',
    2: 'good',
    3: 'rare',
    4: 'epic',
    5: 'legendary'
  }

  const minQ = minQuality[tier] || 'common'

  // 仙缘档（tier=5）：5%概率神话，95%仙器
  // 钻石及以下：按原概率梯度，最高出legendary
  let quality: DrawQuality
  if (tier === 5) {
    quality = roll < 0.05 ? 'divine' : 'legendary'
  } else {
    if (roll < getDrawChance(tier + 1)) quality = 'legendary'
    else if (roll < getDrawChance(tier)) quality = 'epic'
    else if (roll < getDrawChance(tier - 1)) quality = 'rare'
    else if (roll < getDrawChance(tier - 2)) quality = 'good'
    else quality = 'common'

    // 确保不低于该档次的最低品质
    const qualityOrder: DrawQuality[] = ['common', 'good', 'rare', 'epic', 'legendary']
    const rolledIndex = qualityOrder.indexOf(quality)
    const minIndex = qualityOrder.indexOf(minQ)
    if (rolledIndex < minIndex) {
      quality = minQ
    }
  }

  // 生成装备：仙器及以上直接从 CSV 特殊装备池抽取，其余品质随机生成（含套装概率）
  let equip: Equipment
  if (quality === 'legendary' || quality === 'divine' || quality === 'primordial') {
    equip = drawSpecialItem(quality as 'legendary' | 'divine' | 'primordial')
  } else {
    const types: Array<'weapon' | 'armor' | 'helmet' | 'pants' | 'boots' | 'necklace' | 'ring'> = ['weapon', 'armor', 'helmet', 'pants', 'boots', 'necklace', 'ring']
    equip = generateEquipment(types[Math.floor(Math.random() * types.length)], quality as NormalQuality)
  }

  drawResult.value = equip
  drawAnimation.value = true
  player.value.inventory.push(equip)

  setTimeout(() => { drawAnimation.value = false }, 3000)

  const qualityDisplayName: Record<string, string> = {
    common: '普通', good: '优秀', rare: '稀有', epic: '史诗',
    legendary: '仙器', divine: '神话'
  }
  const qName = qualityDisplayName[quality] ?? quality
  const tierName = ['单抽', '青铜抽奖', '白银抽奖', '黄金抽奖', '钻石抽奖', '仙缘抽奖'][tier]
  const emoji = quality === 'divine' ? '🌈' : quality === 'legendary' ? '🎉' : quality === 'epic' ? '✨' : quality === 'rare' ? '🌟' : '📦'
  ElMessage({
    type: quality === 'legendary' || quality === 'divine' ? 'success' : 'info',
    message: `${emoji} ${tierName}获得 ${qName}装备 【${equip.name}】！`
  })
}

// 法宝商店
const artifactShop = computed(() => {
  if (!player.value) return []
  const realmIndex = player.value.realmIndex
  const artifactList: Array<{ template: Omit<Artifact, 'id'>; price: number }> = []
  
  // 法宝价格配置（按品质和等级）
  const prices: Record<string, number> = {
    // 普通品质 1000-2000
    spirit_sword: 1200, peace_bottle: 1000, wooden_shield: 1100, fire_bead: 1400,
    water_charm: 1200, wind_bell: 1300, earth_talisman: 1150, ice_crystal: 1500,
    lightning_pendant: 1600, healing_pendant: 1300, iron_fan: 1400, jade_rings: 1250,
    thunder_stone: 1700, moon_mirror: 1350, bamboo_staff: 1200, cloud_robe: 1450,
    fire_fan: 1750, herb_pouch: 1500, metal_ball: 1300, spring_brush: 1250,
    // 优秀品质 2000-5000
    silver_sword: 2500, azure_cloud_sword: 2800, phoenix_flame_fan: 3000, moonlight_robe: 2700,
    golden_bell: 3200, jade_spirit_bottle: 2900, crimson_blade: 3100, frost_pendant: 3000,
    wind_ruler: 2800, earth_gem: 3300, herb_sprout_bottle: 3000, thunder_eye: 3500,
    spirit_banner: 3100, nine_clover: 3500, black_iron_hammer: 3600, cloud_step_shoes: 3000,
    dragon_scale_armor: 4000, blood_flower: 3200, five_thunder_whip: 3800,
    spirit_binding_net: 3300, pure_essence_bottle: 3600,
    // 稀有品质 5000-12000
    crystal_sword: 6000, azure_dragon_sword: 7500, sun_moon_bottle: 6500, seven_star_dart: 7000,
    nine_dragon_ring: 8000, golden_tower: 8500, red_cloud_robe: 7500, thousand_mile_eye: 8000,
    life_death_flag: 9000, green_mushroom: 7000, sky_hammer: 10000, five_element_ball: 8500,
    ghost_head_vase: 7800, celestial_sword: 11000, moon_reflecting_pool: 8000,
    fire_phoenix_flag: 9500, holy_water_vial: 7500, thunder_cloud_flag: 10500,
    mountain_moving_stamp: 10000, world_tree_leaf: 8500, demon_slayer_sword: 11500,
    ice_dragon_orb: 9000, chaos_bell: 10000, soul_devouring_flag: 9500, immortal_calling_paper: 8000,
    // 史诗品质 15000-30000
    eight_immortals_flask: 18000, tianluo_disk: 20000, dragon_tiger_gauntlet: 22000,
    heaven_earth_furnace: 24000, world_destroying_blade: 26000, celestial_dragon_pearl: 23000,
    phoenix_Nirvana_fan: 25000, immortal_shield: 20000, chaotic_heaven_flag: 24000,
    elixir_furnace: 22000, world_ring: 26000, seven_kills_sword: 28000,
    thousand_soul_flag: 25000, yuan_chen_flag: 23000, celestial_master_seal: 30000,
    nine_heavens_furnace: 28000, world_extinguishing_palm: 32000, celestial_dragon_orb: 27000,
    // 仙器品质 50000-200000
    god_slaying_spear: 60000, world_destroying_furnace: 80000, immortal_peach_branch: 70000,
    celestial_fold: 90000, ten_thousand_buddha_cup: 85000, nine_yang_sword: 120000,
    world_origin_staff: 100000, three_pure_ones_flag: 150000, world_core_ring: 130000,
    creation_flag: 180000, celestial_eye: 160000, primordial_cauldron: 200000
  }
  
  for (const [key, template] of Object.entries(ARTIFACT_TEMPLATES)) {
    // 按品质设置境界需求
    const minRealm = template.quality === 'legendary' ? 7 : 
                     template.quality === 'epic' ? 4 : 
                     template.quality === 'rare' ? 2 : 
                     template.quality === 'good' ? 1 : 0
    if (realmIndex >= minRealm) {
      const basePrice = prices[key] || (template.quality === 'legendary' ? 50000 : 
                                        template.quality === 'epic' ? 15000 : 
                                        template.quality === 'rare' ? 5000 : 
                                        template.quality === 'good' ? 2000 : 1000)
      artifactList.push({ template, price: basePrice })
    }
  }
  
  return artifactList
})

function buyArtifact(shopArtifact: { template: Omit<Artifact, 'id'>; price: number }) {
  if (!player.value) return
  if (player.value.spiritStones < shopArtifact.price) {
    ElMessage.warning('灵石不足')
    return
  }
  
  const alreadyHave = player.value.artifacts.some(a => a.name === shopArtifact.template.name)
  if (alreadyHave) {
    ElMessage.info('你已有此法宝')
    return
  }

  ElMessageBox.confirm(
    `确定花费 💎${shopArtifact.price} 购买法宝【${shopArtifact.template.name}】？`,
    '购买确认',
    { confirmButtonText: '购买', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    player.value!.spiritStones -= shopArtifact.price
    const artifact: Artifact = { ...shopArtifact.template, id: '' }
    playerStore.addArtifact(artifact)
    ElMessage.success(`获得法宝 【${artifact.name}】！已收入法宝栏`)
  }).catch(() => {})
}

// 功法商店 - 8级品质体系（参考《万界道友》设计）
const techniqueShop = computed(() => {
  if (!player.value) return []
  const realmIndex = player.value.realmIndex
  const techniqueList: Array<{ template: Omit<Technique, 'id'>; price: number; key: string }> = []

  // 按品质定价（凡品→神品，8级）
  const qualityBasePrice: Record<string, number> = {
    common:    600,    // 凡品：炼气期
    fine:      2000,   // 灵品：炼气-筑基
    rare:      6000,   // 玄品：筑基-金丹
    epic:      18000,  // 真品：金丹-元婴
    excellent: 40000,  // 地品：元婴-化神
    superior:  80000,  // 天品：炼虚-合体
    immortal:  150000, // 仙品：大乘
    divine:    300000, // 神品：渡劫
  }

  for (const [key, template] of Object.entries(TECHNIQUE_TEMPLATES)) {
    // 只显示境界要求 ≤ 当前境界的功法（含超前1个境界预览，价格翻倍）
    if (realmIndex >= template.realmRequirement) {
      const basePrice = qualityBasePrice[template.quality] ?? 800
      techniqueList.push({ template, price: basePrice, key })
    }
  }

  // 按品质从高到低排序，同品质按境界需求升序
  const qualityOrder = ['divine', 'immortal', 'superior', 'excellent', 'epic', 'rare', 'fine', 'common']
  return techniqueList.sort((a, b) => {
    const qa = qualityOrder.indexOf(a.template.quality)
    const qb = qualityOrder.indexOf(b.template.quality)
    if (qa !== qb) return qa - qb
    return a.template.realmRequirement - b.template.realmRequirement
  })
})

// 功法辅助函数
function getTechniqueColor(quality: string): string {
  return TECHNIQUE_QUALITIES[quality as keyof typeof TECHNIQUE_QUALITIES]?.color ?? '#9e9e9e'
}

function getTechniqueQualityName(quality: string): string {
  return TECHNIQUE_QUALITIES[quality as keyof typeof TECHNIQUE_QUALITIES]?.name ?? '凡品'
}

const EFFECT_ICONS: Record<string, string> = {
  attackBonus: '⚔️', defenseBonus: '🛡️', hpBonus: '❤️',
  critRate: '💥', critDamage: '💫', dodgeRate: '💨',
  lifesteal: '🩸', spiritPerSec: '💎', damageReduction: '🔰',
  reflectDamage: '🔄', regenPerSec: '💚'
}

const EFFECT_NAMES: Record<string, string> = {
  attackBonus: '攻击', defenseBonus: '防御', hpBonus: '生命',
  critRate: '暴击率', critDamage: '暴击伤害', dodgeRate: '闪避率',
  lifesteal: '吸血', spiritPerSec: '灵气/秒', damageReduction: '减伤',
  reflectDamage: '反弹', regenPerSec: '每秒回复'
}

// spiritPerSec / regenPerSec 是固定值，其他是百分比
const FIXED_VALUE_EFFECTS = new Set(['spiritPerSec', 'regenPerSec', 'attackBonus', 'defenseBonus', 'hpBonus'])

function getEffectDisplay(type: string, value: number): string {
  const sign = value >= 0 ? '+' : ''
  if (FIXED_VALUE_EFFECTS.has(type)) return `${sign}${value}`
  return `${sign}${value}%`
}

function buyTechnique(shopTechnique: { template: Omit<Technique, 'id'>; price: number }) {
  if (!player.value) return
  if (player.value.spiritStones < shopTechnique.price) {
    ElMessage.warning('灵石不足')
    return
  }
  
  const alreadyHave = player.value.techniques.some(t => t.name === shopTechnique.template.name)
  if (alreadyHave) {
    ElMessage.info('你已领悟此功法')
    return
  }

  ElMessageBox.confirm(
    `确定花费 💎${shopTechnique.price} 购买功法【${shopTechnique.template.name}】？`,
    '购买确认',
    { confirmButtonText: '购买', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    player.value!.spiritStones -= shopTechnique.price
    const technique: Technique = { ...shopTechnique.template, id: '' }
    if (playerStore.addTechnique(technique)) {
      ElMessage.success(`领悟功法 【${technique.name}】！`)
    }
  }).catch(() => {})
}

// 直购商店
const shopItems = computed(() => {
  if (!player.value) return []
  const tier = Math.min(Math.floor(player.value.realmIndex / 2), 5)
  const items: Array<{ equip: Omit<Equipment, 'id'>; price: number }> = []

  // 每次刷新随机生成几个（基于分钟级种子，同一分钟内结果固定）
  const seed = Math.floor(Date.now() / 60000)
  const rng = (n: number) => ((seed * 9301 + 49297) % 233280) / 233280 * n

  // 从 CSV legendary 池里取前 (2+tier) 个仙器加入直购池
  const { legendaryItems } = getSpecialItems()
  const legendaryPool = legendaryItems.slice(0, 2 + tier)

  const pool: Omit<Equipment, 'id'>[] = [
    ...legendaryPool,
    { name: '玄铁剑', type: 'weapon' as const, quality: 'rare' as const, attackBonus: 120 + tier * 40, defenseBonus: 20 + tier * 10, hpBonus: 300 + tier * 100 },
    { name: '天蚕衣', type: 'armor' as const, quality: 'rare' as const, attackBonus: 20 + tier * 10, defenseBonus: 100 + tier * 30, hpBonus: 500 + tier * 150 },
    { name: '疾风靴', type: 'boots' as const, quality: 'good' as const, attackBonus: 30 + tier * 15, defenseBonus: 40 + tier * 20, hpBonus: 200 + tier * 80 },
    { name: '灵玉项链', type: 'necklace' as const, quality: 'rare' as const, attackBonus: 50 + tier * 20, defenseBonus: 30 + tier * 15, hpBonus: 400 + tier * 120 },
    { name: '聚灵戒', type: 'ring' as const, quality: 'good' as const, attackBonus: 40 + tier * 20, defenseBonus: 30 + tier * 15, hpBonus: 300 + tier * 100 },
    { name: '云锦裤', type: 'pants' as const, quality: 'good' as const, attackBonus: 15 + tier * 10, defenseBonus: 50 + tier * 25, hpBonus: 250 + tier * 100 },
    { name: '玄铁盔', type: 'helmet' as const, quality: 'rare' as const, attackBonus: 30 + tier * 15, defenseBonus: 40 + tier * 20, hpBonus: 200 + tier * 80 },
  ]

  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(rng(pool.length - i))
    const item = pool.splice(idx, 1)[0]
    const q = item.quality
    const prices: Record<string, number> = { common: 80, good: 200, rare: 500, epic: 1500, legendary: 5000 }
    items.push({ equip: item, price: Math.floor((prices[q] ?? 200) * (1 + tier * 0.3)) })
  }
  return items
})

function buyItem(shopItem: { equip: Omit<Equipment, 'id'>; price: number }) {
  if (!player.value) return
  if (player.value.spiritStones < shopItem.price) {
    ElMessage.warning('灵石不足')
    return
  }

  ElMessageBox.confirm(
    `确定花费 💎${shopItem.price} 购买【${shopItem.equip.name}】？`,
    '购买确认',
    { confirmButtonText: '购买', cancelButtonText: '取消', type: 'info' }
  ).then(() => {
    player.value!.spiritStones -= shopItem.price
    const equip: Equipment = { ...shopItem.equip, id: Date.now().toString() }
    player.value!.inventory.push(equip)
    ElMessage.success(`获得 【${equip.name}】！已放入背包`)
  }).catch(() => {})
}

function getQualityColor(q: string) {
  return QUALITIES[q as keyof typeof QUALITIES]?.color || '#9e9e9e'
}

function getQualityName(q: string) {
  return QUALITIES[q as keyof typeof QUALITIES]?.name || '普通'
}

function getEquipTypeName(type: string) {
  const names: Record<string, string> = {
    weapon: '武器', armor: '胸甲', helmet: '头盔', pants: '裤子', boots: '靴子', necklace: '项链', ring: '戒指'
  }
  return names[type] || type
}

const activeShopTab = ref('gacha')
</script>

<template>
  <div class="shop-view" v-if="player">
    <div class="shop-header">
      <h2 class="shop-title">🏪 仙市商店</h2>
      <div class="wallet">
        💎 {{ player.spiritStones }} 灵石
      </div>
    </div>

    <!-- Tab -->
    <div class="shop-tabs">
      <button 
        :class="['tab-btn', { active: activeShopTab === 'gacha' }]"
        @click="activeShopTab = 'gacha'"
      >🎰 抽奖</button>
      <button 
        :class="['tab-btn', { active: activeShopTab === 'artifact' }]"
        @click="activeShopTab = 'artifact'"
      >🔮 法宝</button>
      <button 
        :class="['tab-btn', { active: activeShopTab === 'technique' }]"
        @click="activeShopTab = 'technique'"
      >📜 功法</button>
      <button 
        :class="['tab-btn', { active: activeShopTab === 'direct' }]"
        @click="activeShopTab = 'direct'"
      >🛒 直购</button>
    </div>

    <!-- 抽奖 -->
    <div v-if="activeShopTab === 'gacha'" class="gacha-section">
      <!-- 抽奖结果展示 -->
      <div v-if="drawResult" class="draw-reveal" :class="{ animate: drawAnimation }">
        <div class="reveal-label">本轮获得</div>
        <div class="reveal-name" :style="{ color: getQualityColor(drawResult.quality) }">
          {{ drawResult.name }}
        </div>
        <div class="reveal-quality">{{ getQualityName(drawResult.quality) }}</div>
        <div class="reveal-stats">
          ⚔️{{ drawResult.attackBonus }} 🛡️{{ drawResult.defenseBonus }} ❤️{{ drawResult.hpBonus }}
        </div>
      </div>

      <!-- 奖池 -->
      <div class="gacha-pool">
        <div class="pool-item legendary">
          <span class="pool-label">仙缘抽奖</span>
          <span class="pool-cost">💎 5000</span>
          <span class="pool-note">仙器+ · 5%神话</span>
        </div>
        <div class="pool-item epic">
          <span class="pool-label">钻石抽奖</span>
          <span class="pool-cost">💎 1500</span>
          <span class="pool-note">稀有+</span>
        </div>
        <div class="pool-item rare">
          <span class="pool-label">黄金抽奖</span>
          <span class="pool-cost">💎 500</span>
          <span class="pool-note">优秀+</span>
        </div>
        <div class="pool-item good">
          <span class="pool-label">白银抽奖</span>
          <span class="pool-cost">💎 200</span>
          <span class="pool-note">普通+</span>
        </div>
        <div class="pool-item common">
          <span class="pool-label">青铜抽奖</span>
          <span class="pool-cost">💎 50</span>
          <span class="pool-note">试试手气</span>
        </div>
      </div>

      <!-- 抽奖按钮 -->
      <div class="gacha-buttons">
        <el-button 
          v-for="tier in [1,2,3,4,5]" 
          :key="tier"
          class="gacha-btn"
          :style="{
            background: tier === 5 ? 'linear-gradient(135deg, #ff9800, #ffd700)' :
                        tier === 4 ? 'linear-gradient(135deg, #9c27b0, #e040fb)' :
                        tier === 3 ? 'linear-gradient(135deg, #ff9800, #ffc107)' :
                        tier === 2 ? 'linear-gradient(135deg, #9e9e9e, #e0e0e0)' :
                        'linear-gradient(135deg, #795548, #a1887f)'
          }"
          :disabled="player.spiritStones < getDrawCost(tier)"
          @click="doDraw(tier)"
        >
          <span class="btn-cost">💎{{ getDrawCost(tier) }}</span>
          <span class="btn-label">{{ ['', '青铜', '白银', '黄金', '钻石', '仙缘'][tier] }}</span>
        </el-button>
      </div>

      <p class="shop-tip">💡 境界越高，可抽到更好的装备</p>
    </div>

    <!-- 法宝商店 -->
    <div v-if="activeShopTab === 'artifact'" class="artifact-shop-section">
      <div class="artifact-grid" v-if="artifactShop.length > 0">
        <div 
          v-for="(artifact, idx) in artifactShop" 
          :key="idx"
          class="artifact-card game-card"
          :style="{ borderColor: artifact.template.quality === 'legendary' ? '#ff9800' : artifact.template.quality === 'epic' ? '#9c27b0' : '#2196f3' + '44' }"
        >
          <div class="artifact-icon-large">🔮</div>
          <div class="artifact-name" :style="{ color: artifact.template.quality === 'legendary' ? '#ff9800' : artifact.template.quality === 'epic' ? '#9c27b0' : '#2196f3' }">
            {{ artifact.template.name }}
          </div>
          <div class="artifact-quality">{{ getQualityName(artifact.template.quality) }}</div>
          <div class="artifact-stats">
            ⚔️{{ artifact.template.attackBonus }} 🛡️{{ artifact.template.defenseBonus }} ❤️{{ artifact.template.hpBonus }}
          </div>
          <div class="artifact-skill">
            <span class="skill-label">🎯 {{ artifact.template.skill.name }}</span>
            <span class="skill-desc">{{ artifact.template.skill.description }}</span>
          </div>
          <el-button 
            type="warning" 
            size="small" 
            class="buy-btn"
            :disabled="player.spiritStones < artifact.price || player.artifacts.some(a => a.name === artifact.template.name)"
            @click="buyArtifact(artifact)"
          >
            💎 {{ artifact.price }}
          </el-button>
        </div>
      </div>
      <div class="empty-artifact" v-else>
        <span class="empty-icon">🔮</span>
        <p>境界达到筑基期后可购买法宝</p>
      </div>
    </div>

    <!-- 功法商店 -->
    <div v-if="activeShopTab === 'technique'" class="technique-shop-section">
      <div class="technique-grid" v-if="techniqueShop.length > 0">
        <div 
          v-for="(technique, idx) in techniqueShop" 
          :key="idx"
          class="technique-card game-card"
          :style="{ 
            borderColor: getTechniqueColor(technique.template.quality),
            background: ['divine','immortal','superior'].includes(technique.template.quality)
              ? `linear-gradient(135deg, ${getTechniqueColor(technique.template.quality)}22 0%, ${getTechniqueColor(technique.template.quality)}11 100%)`
              : 'var(--bg-secondary)'
          }"
        >
          <!-- 品类标签 -->
          <div class="technique-category-tag" v-if="technique.template.category">
            {{ { body:'💪炼体', spirit:'✨炼气', combat:'⚔️斗战', element:'🌟五行', ultimate:'🔮大道' }[technique.template.category] ?? '' }}
          </div>
          <div class="technique-icon">📜</div>
          <div class="technique-name" :style="{ color: getTechniqueColor(technique.template.quality) }">
            {{ technique.template.name }}
          </div>
          <div class="technique-quality" :style="{ color: getTechniqueColor(technique.template.quality) }">
            {{ getTechniqueQualityName(technique.template.quality) }}
          </div>
          <div class="technique-effects">
            <div 
              v-for="(effect, eIdx) in technique.template.effects" 
              :key="eIdx"
              class="effect-item"
            >
              <span class="effect-type">{{ EFFECT_ICONS[effect.type] ?? '✨' }}</span>
              <span class="effect-value" :style="{ color: effect.value >= 0 ? '#4caf50' : '#f44336' }">
                {{ getEffectDisplay(effect.type, effect.value) }}
              </span>
              <span class="effect-label">{{ EFFECT_NAMES[effect.type] ?? effect.type }}</span>
            </div>
          </div>
          <div class="technique-desc">
            {{ technique.template.description }}
          </div>
          <el-button 
            type="warning" 
            size="small" 
            class="buy-btn technique-buy-btn"
            :disabled="player.spiritStones < technique.price || (player.techniques || []).some(t => t.name === technique.template.name)"
            @click="buyTechnique(technique)"
          >
            {{ (player.techniques || []).some(t => t.name === technique.template.name) ? '已领悟' : `💎 ${technique.price.toLocaleString()}` }}
          </el-button>
        </div>
      </div>
      <div class="empty-technique" v-else>
        <span class="empty-icon">📜</span>
        <p>当前境界暂无适合购买的功法</p>
        <p class="empty-hint">境界提升后可解锁更多功法</p>
      </div>
    </div>

    <!-- 直购 -->
    <div v-if="activeShopTab === 'direct'" class="direct-section">
      <div class="shop-grid">
        <div 
          v-for="(item, idx) in shopItems" 
          :key="idx"
          class="shop-card game-card"
          :style="{ borderColor: getQualityColor(item.equip.quality) + '44' }"
        >
          <div class="card-header">
            <span class="card-type">{{ item.equip.type === 'weapon' ? '⚔️' : item.equip.type === 'armor' ? '🛡️' : item.equip.type === 'boots' ? '👢' : item.equip.type === 'helmet' ? '🪖' : item.equip.type === 'necklace' ? '📿' : item.equip.type === 'pants' ? '👖' : item.equip.type === 'ring' ? '💍' : '📦' }}</span>
            <span class="card-quality" :style="{ color: getQualityColor(item.equip.quality) }">
              {{ getQualityName(item.equip.quality) }}
            </span>
          </div>
          <div class="card-name" :style="{ color: getQualityColor(item.equip.quality) }">
            {{ item.equip.name }}
          </div>
          <div class="card-stats">
            ⚔️{{ item.equip.attackBonus }} 🛡️{{ item.equip.defenseBonus }} ❤️{{ item.equip.hpBonus }}
          </div>
          <el-button 
            type="primary" 
            size="small" 
            class="buy-btn"
            :disabled="player.spiritStones < item.price"
            @click="buyItem(item)"
          >
            💎 {{ item.price }}
          </el-button>
        </div>
      </div>
      <p class="shop-tip">⏱️ 商品每分钟自动刷新</p>
    </div>
  </div>
</template>

<style scoped>
.shop-view {
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.shop-title {
  font-size: 1.3rem;
}

.wallet {
  font-size: 1.1rem;
  color: var(--accent-gold);
  font-weight: bold;
}

.shop-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.95rem;
  transition: all 0.25s;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: transparent;
  color: white;
}

/* 抽奖 */
.draw-reveal {
  text-align: center;
  padding: 20px;
  background: var(--bg-secondary);
  border-radius: 12px;
  border: 1px solid var(--border-color);
  opacity: 0;
  transition: opacity 0.3s;
}

.draw-reveal.animate {
  opacity: 1;
  animation: reveal-float 3s ease-out forwards;
}

@keyframes reveal-float {
  0% { transform: scale(0.8); opacity: 0; }
  20% { transform: scale(1.1); opacity: 1; }
  80% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.3; }
}

.reveal-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.reveal-name {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.reveal-quality {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.reveal-stats {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.gacha-pool {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.pool-item {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--bg-secondary);
  border-left: 4px solid;
  gap: 10px;
}

.pool-item.legendary { border-color: #ff9800; background: rgba(255, 152, 0, 0.08); }
.pool-item.epic { border-color: #9c27b0; background: rgba(156, 39, 176, 0.08); }
.pool-item.rare { border-color: #2196f3; background: rgba(33, 150, 243, 0.08); }
.pool-item.good { border-color: #4caf50; background: rgba(76, 175, 80, 0.08); }
.pool-item.common { border-color: #9e9e9e; }

.pool-label {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
}

.pool-cost {
  font-size: 0.9rem;
  color: var(--accent-gold);
}

.pool-note {
  font-size: 0.78rem;
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
}

.gacha-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gacha-btn {
  flex: 1;
  min-width: 80px;
  height: 52px;
  border: none;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-weight: bold;
}

.gacha-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}

.gacha-btn:disabled {
  opacity: 0.4;
}

.btn-cost { font-size: 0.85rem; }
.btn-label { font-size: 0.8rem; opacity: 0.9; }

/* 直购 */
.shop-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.shop-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 14px;
  background: var(--bg-secondary);
  transition: transform 0.2s;
}

.shop-card:hover {
  transform: translateY(-3px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  font-size: 1.2rem;
}

.card-quality {
  font-size: 0.8rem;
  font-weight: 500;
}

.card-name {
  font-size: 0.95rem;
  font-weight: bold;
}

.card-stats {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.buy-btn {
  width: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  font-weight: bold;
}

.buy-btn:disabled {
  opacity: 0.4;
}

/* 法宝商店 */
.artifact-shop-section {
  padding: 8px 0;
}

.artifact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.artifact-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 20px 16px;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 87, 34, 0.1) 100%);
  border: 2px solid;
  transition: all 0.3s ease;
}

.artifact-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(255, 152, 0, 0.2);
}

.artifact-icon-large {
  font-size: 3rem;
}

.artifact-name {
  font-size: 1.1rem;
  font-weight: bold;
}

.artifact-quality {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.artifact-stats {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.artifact-skill {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  background: var(--bg-card);
  border-radius: 8px;
  width: 100%;
}

.skill-label {
  color: #ff9800;
  font-weight: 600;
  font-size: 0.9rem;
}

.skill-desc {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.artifact-card .buy-btn {
  background: linear-gradient(135deg, #ff9800, #ff5722);
  border: none;
}

.empty-artifact {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-artifact .empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

/* 功法商店 */
.technique-shop-section {
  padding: 8px 0;
}

.technique-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.technique-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding: 20px 16px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.technique-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.technique-icon {
  font-size: 2.8rem;
}

.technique-name {
  font-size: 1.1rem;
  font-weight: bold;
}

.technique-quality {
  font-size: 0.8rem;
  color: var(--text-secondary);
  padding: 2px 10px;
  background: var(--bg-card);
  border-radius: 10px;
}

.technique-effects {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  padding: 10px;
  background: var(--bg-card);
  border-radius: 8px;
}

.effect-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
}

.effect-type {
  font-size: 1rem;
}

.effect-value {
  font-weight: bold;
  min-width: 50px;
}

.effect-label {
  color: var(--text-secondary);
}

.technique-desc {
  font-size: 0.78rem;
  color: var(--text-secondary);
  padding: 8px;
  background: var(--bg-card);
  border-radius: 6px;
  width: 100%;
  line-height: 1.4;
}

.technique-buy-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  width: 100%;
}

.empty-technique {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-secondary);
}

.empty-technique .empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 8px;
  opacity: 0.7;
}

.shop-tip {
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding: 10px 0;
}

@media (max-width: 600px) {
  .shop-grid { grid-template-columns: repeat(2, 1fr); }
  .gacha-buttons { flex-direction: column; }
}
</style>
