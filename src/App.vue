<template>
  <div class="app-container">
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { useThemeStore } from '@/stores/theme'

// 初始化主题
const themeStore = useThemeStore()

const route = useRoute()

// 判断是否是登录页面
const isLoginPage = computed(() => route.path === '/login')
</script>

<style lang="scss">
.app-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
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
