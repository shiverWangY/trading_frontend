<template>
  <div class="app-container" :class="{ 'app-ready': isAppReady }">
    <!-- 后端离线提示气泡 -->
    <transition name="toast-slide" mode="out-in">
      <div v-if="showOfflineToast" key="toast" class="offline-toast glass-card">
        <div class="toast-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="toast-content">
          <span class="toast-title">连接中断</span>
          <span class="toast-message">后端服务未连接</span>
        </div>
        <div class="toast-actions">
          <button @click="retryConnection" class="toast-retry">重试</button>
          <button @click="dismissToast" class="toast-close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </transition>
    
    <!-- 登录页面不显示 Header -->
    <AppHeader v-if="!isLoginPage" />
    <main class="main-content" :class="{ 'no-header': isLoginPage }">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    
    <!-- 装饰性浮动光点（登录页面有自己的装饰） -->
    <div v-if="!isLoginPage" class="floating-orbs">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useThemeStore } from '@/stores/theme'
import { useAuthStore } from '@/stores/auth'
import { checkHealth } from '@/api/index.js'

// 初始化主题
const themeStore = useThemeStore()
const authStore = useAuthStore()

const route = useRoute()

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login')

// 应用就绪状态（防止刷新时闪现内部页面）
const isAppReady = ref(false)

// 后端在线状态
const isBackendOnline = ref(true)
const showOfflineToast = ref(false)
const toastDismissed = ref(false)
let healthCheckInterval = null
let autoHideTimer = null

// 检查后端健康状态
const checkBackendHealth = async () => {
  try {
    await checkHealth()
    isBackendOnline.value = true
    showOfflineToast.value = false
    toastDismissed.value = false
  } catch (error) {
    isBackendOnline.value = false
    // 只有未被手动关闭时才显示
    if (!toastDismissed.value) {
      showOfflineToast.value = true
      startAutoHide()
    }
    console.warn('后端服务不可用:', error.message)
  }
}

// 自动隐藏
const startAutoHide = () => {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  autoHideTimer = setTimeout(() => {
    showOfflineToast.value = false
  }, 8000) // 8秒后自动消失
}

// 手动关闭
const dismissToast = () => {
  showOfflineToast.value = false
  toastDismissed.value = true
  if (autoHideTimer) clearTimeout(autoHideTimer)
}

// 重试连接
const retryConnection = () => {
  if (autoHideTimer) clearTimeout(autoHideTimer)
  checkBackendHealth()
}

onMounted(async () => {
  // 等待认证状态恢复后再显示页面
  if (localStorage.getItem('access_token') && !authStore.isAuthenticated) {
    await authStore.fetchCurrentUser()
  }
  
  // 短暂延迟确保过渡平滑
  setTimeout(() => {
    isAppReady.value = true
  }, 50)
  
  // 初始检查后端健康状态
  checkBackendHealth()
  
  // 每 30 秒检查一次
  healthCheckInterval = setInterval(checkBackendHealth, 30000)
})

onUnmounted(() => {
  if (healthCheckInterval) clearInterval(healthCheckInterval)
  if (autoHideTimer) clearTimeout(autoHideTimer)
})
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &.app-ready {
    opacity: 1;
  }
}

// 离线气泡提示
.offline-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 2000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(239, 68, 68, 0.1) inset;
  max-width: 320px;
}

.toast-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(239, 68, 68, 0.15);
  flex-shrink: 0;
  
  svg {
    width: 18px;
    height: 18px;
    color: #ef4444;
  }
}

.toast-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.toast-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.toast-message {
  font-size: 12px;
  color: var(--text-secondary);
}

.toast-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.toast-retry {
  padding: 6px 12px;
  background: rgba(99, 102, 241, 0.15);
  border: 1px solid rgba(99, 102, 241, 0.25);
  border-radius: 8px;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(99, 102, 241, 0.25);
    border-color: rgba(99, 102, 241, 0.4);
  }
}

.toast-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  
  svg {
    width: 14px;
    height: 14px;
  }
  
  &:hover {
    background: var(--glass-bg-hover);
    color: var(--text-secondary);
  }
}

// 气泡动画
.toast-slide-enter-active {
  animation: toastIn 0.3s ease-out forwards;
}

.toast-slide-leave-active {
  animation: toastOut 0.2s ease-in forwards;
}

@keyframes toastIn {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes toastOut {
  0% {
    opacity: 1;
    transform: translateX(0);
  }
  100% {
    opacity: 0;
    transform: translateX(20px);
  }
}

.main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  
  &.no-header {
    padding-top: 0;
  }
}

// 页面过渡动画
.page-enter-active {
  animation: pageEnter 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-leave-active {
  animation: pageLeave 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pageLeave {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
  }
}

// 装饰性浮动光点
.floating-orbs {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
  transition: opacity 0.5s ease;
  
  .light & {
    opacity: 0.15;
  }
  
  .dark & {
    opacity: 0.4;
  }
  
  &.orb-1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(var(--primary-rgb), 0.4), transparent 70%);
    top: -10%;
    left: -5%;
    animation-delay: 0s;
  }
  
  &.orb-2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(var(--accent-rgb), 0.35), transparent 70%);
    bottom: -10%;
    right: -5%;
    animation-delay: -7s;
  }
  
  &.orb-3 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(22, 163, 74, 0.2), transparent 70%);
    top: 40%;
    left: 30%;
    animation-delay: -14s;
    
    .dark & {
      background: radial-gradient(circle, rgba(52, 211, 153, 0.15), transparent 70%);
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -30px) scale(1.05);
  }
  50% {
    transform: translate(20px, 40px) scale(0.95);
  }
  75% {
    transform: translate(-30px, 20px) scale(1.02);
  }
}
</style>
