<template>
  <div class="app-container">
    <!-- 后端离线提示 -->
    <transition name="slide-down">
      <div v-if="!isBackendOnline" class="offline-banner">
        <div class="offline-content">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>后端服务未连接，部分功能不可用</span>
          <button @click="retryConnection" class="retry-btn">
            重试
          </button>
        </div>
      </div>
    </transition>
    
    <!-- 登录页面不显示 Header -->
    <AppHeader v-if="!isLoginPage" />
    <main class="main-content" :class="{ 'no-header': isLoginPage, 'has-banner': !isBackendOnline }">
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useThemeStore } from '@/stores/theme'
import { checkHealth } from '@/api/index.js'

// 初始化主题
const themeStore = useThemeStore()

const route = useRoute()

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login')

// 后端在线状态
const isBackendOnline = ref(true)
let healthCheckInterval = null

// 检查后端健康状态
const checkBackendHealth = async () => {
  try {
    await checkHealth()
    isBackendOnline.value = true
  } catch (error) {
    isBackendOnline.value = false
    console.warn('后端服务不可用:', error.message)
  }
}

// 重试连接
const retryConnection = () => {
  checkBackendHealth()
}

onMounted(() => {
  // 初始检查
  checkBackendHealth()
  
  // 每 30 秒检查一次
  healthCheckInterval = setInterval(checkBackendHealth, 30000)
})

onUnmounted(() => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval)
  }
})
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

// 离线横幅
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: white;
  padding: 10px 20px;
  box-shadow: 0 4px 20px rgba(220, 38, 38, 0.3);
}

.offline-content {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 14px;
  font-weight: 500;
  
  svg {
    flex-shrink: 0;
  }
}

.retry-btn {
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

// 横幅滑入动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  
  &.no-header {
    padding-top: 0;
  }
  
  &.has-banner {
    padding-top: 44px;
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
