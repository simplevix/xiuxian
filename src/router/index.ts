import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 懒加载组件
const HomeView = () => import('@/views/HomeView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const GameView = () => import('@/views/GameView.vue')
const BattleView = () => import('@/views/BattleView.vue')
const SecretRealmView = () => import('@/views/SecretRealmView.vue')
const InventoryView = () => import('@/views/InventoryView.vue')
const PetView = () => import('@/views/PetView.vue')
const FormationView = () => import('@/views/FormationView.vue')
const ShopView = () => import('@/views/ShopView.vue')
const GMView = () => import('@/views/GMView.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { title: '首页 - 仙途问路' }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { title: '登录 - 仙途问路' }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { title: '注册 - 仙途问路' }
  },
  {
    path: '/game',
    name: 'Game',
    component: GameView,
    meta: { title: '游戏主界面 - 仙途问路' },
    children: [
      {
        path: '',
        redirect: { name: 'Battle' }
      },
      {
        path: 'battle',
        name: 'Battle',
        component: BattleView,
        meta: { title: '修炼 - 仙途问路' }
      },
      {
        path: 'secret-realm',
        name: 'SecretRealm',
        component: SecretRealmView,
        meta: { title: '秘境 - 仙途问路' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: InventoryView,
        meta: { title: '背包 - 仙途问路' }
      },
      {
        path: 'pet',
        name: 'Pet',
        component: PetView,
        meta: { title: '灵宠 - 仙途问路' }
      },
      {
        path: 'formation',
        name: 'Formation',
        component: FormationView,
        meta: { title: '阵法 - 仙途问路' }
      },
      {
        path: 'shop',
        name: 'Shop',
        component: ShopView,
        meta: { title: '商店 - 仙途问路' }
      }
    ]
  },
  {
    path: '/gm',
    name: 'GM',
    component: GMView,
    meta: { title: 'GM管理后台 - 仙途问路', requiresGM: true }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = String(to.meta.title)
  }

  const authStore = useAuthStore()

  // 检查是否需要GM权限
  if (to.meta.requiresGM) {
    if (!authStore.isGM) {
      next('/')
      return
    }
  }

  // 检查是否需要角色数据
  if (to.path.startsWith('/game')) {
    // 这里需要检查 Pinia store 中是否有角色数据
    // 暂时不添加复杂逻辑，后续根据需求调整
    next()
  } else {
    next()
  }
})

export default router