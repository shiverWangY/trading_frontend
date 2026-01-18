<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左侧：Logo + 模型选择器 -->
      <div class="header-left">
        <router-link to="/" class="logo">
          <div class="logo-icon">
            <div class="logo-glow"></div>
            <el-icon :size="24"><TrendCharts /></el-icon>
          </div>
          <span class="logo-text">量化选股</span>
        </router-link>
        
        <!-- 模型选择器 -->
        <div class="model-selector">
          <el-select 
            v-model="selectedModel" 
            placeholder="选择模型"
            size="small"
            @change="handleModelChange"
          >
            <el-option
              v-for="model in store.models"
              :key="model.model_name"
              :label="model.model_name"
              :value="model.model_name"
            />
          </el-select>
        </div>
      </div>

      <!-- 中间：导航菜单（绝对定位居中） -->
      <nav class="nav-menu">
        <router-link 
          v-for="item in menuItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </span>
          <span class="nav-text">{{ item.title }}</span>
          <span class="nav-indicator"></span>
        </router-link>
      </nav>

      <!-- 右侧操作区 -->
      <div class="header-actions">
        <button class="search-btn" @click="$router.push('/search')">
          <el-icon :size="18"><Search /></el-icon>
          <span>搜索</span>
          <kbd>⌘K</kbd>
        </button>
        
        <!-- 主题切换按钮 -->
        <ThemeToggle />
        
        <div class="status-dot">
          <span class="dot"></span>
          <span class="label">在线</span>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TrendCharts, HomeFilled, DataAnalysis, Search } from '@element-plus/icons-vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { usePredictionStore } from '@/stores/prediction'

const route = useRoute()
const store = usePredictionStore()

const selectedModel = ref(store.currentModel)

// 监听 store 中的 currentModel 变化
watch(() => store.currentModel, (val) => {
  selectedModel.value = val
})

// 监听模型列表变化，如果当前没有选中模型，默认选第一个
watch(() => store.models, (models) => {
  if (models.length > 0 && !store.currentModel) {
    store.setModel(models[0].model_name)
    selectedModel.value = models[0].model_name
  }
}, { immediate: true })

const handleModelChange = (val) => {
  store.setModel(val)
}

const menuItems = [
  { path: '/', title: '预测大盘', icon: 'HomeFilled' },
  { path: '/stats', title: '统计分析', icon: 'DataAnalysis' },
  { path: '/search', title: '搜索股票', icon: 'Search' }
]

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// 组件挂载时获取模型列表
onMounted(() => {
  if (store.models.length === 0) {
    store.fetchModels()
  }
})
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: var(--header-bg);
  backdrop-filter: blur(var(--glass-blur-strong));
  -webkit-backdrop-filter: blur(var(--glass-blur-strong));
  border-bottom: 1px solid var(--glass-border);
  z-index: 1000;
  transition: all 0.3s ease;
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(var(--primary-rgb), 0.3),
      rgba(var(--accent-rgb), 0.3),
      transparent
    );
  }
}

.header-container {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: relative;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 1;
}

.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  text-decoration: none;
  color: var(--text-primary);
  
  .logo-icon {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 
      0 4px 20px rgba(var(--primary-rgb), 0.35),
      0 0 40px rgba(var(--primary-rgb), 0.15);
    overflow: hidden;
    transition: all 0.3s ease;
    
    .logo-glow {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.3),
        transparent 50%
      );
    }
  }
  
  &:hover .logo-icon {
    transform: scale(1.05);
    box-shadow: 
      0 6px 24px rgba(var(--primary-rgb), 0.45),
      0 0 60px rgba(var(--primary-rgb), 0.2);
  }
  
  .logo-text {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, var(--text-primary), var(--primary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.nav-menu {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  padding: 6px;
  background: var(--glass-bg);
  border-radius: 16px;
  border: 1px solid var(--glass-border);
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 12px;
  text-decoration: none;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  .nav-icon {
    display: flex;
    transition: transform 0.3s ease;
  }
  
  .nav-indicator {
    position: absolute;
    bottom: 6px;
    left: 50%;
    transform: translateX(-50%) scaleX(0);
    width: 20px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
    border-radius: 1px;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    color: var(--text-secondary);
    background: var(--hover-bg);
    
    .nav-icon {
      transform: translateY(-1px);
    }
  }
  
  &.active {
    color: var(--primary-color);
    background: rgba(var(--primary-rgb), 0.1);
    
    .nav-indicator {
      transform: translateX(-50%) scaleX(1);
    }
    
    .nav-icon {
      filter: drop-shadow(0 0 8px rgba(var(--primary-rgb), 0.5));
    }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 14px;
  z-index: 1;
}

.model-selector {
  display: flex;
  align-items: center;
  padding-left: 20px;
  border-left: 1px solid var(--glass-border);
  
  :deep(.el-select) {
    width: 200px;
    
    .el-select__wrapper {
      background: var(--glass-bg);
      border-color: var(--glass-border);
      border-radius: 10px;
      height: 36px;
      
      &:hover {
        border-color: var(--glass-border-hover);
      }
      
      &.is-focused {
        border-color: var(--primary-color);
      }
    }
    
    .el-select__selected-item {
      font-size: 13px;
      font-weight: 500;
    }
  }
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-muted);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  
  kbd {
    padding: 2px 6px;
    background: var(--hover-bg);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: 11px;
    font-family: inherit;
    color: var(--text-muted);
  }
  
  &:hover {
    border-color: var(--glass-border-hover);
    color: var(--text-secondary);
    background: var(--glass-bg-hover);
  }
}

.status-dot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: rgba(22, 163, 74, 0.1);
  border: 1px solid rgba(22, 163, 74, 0.2);
  border-radius: 20px;
  transition: all 0.3s ease;
  
  .dark & {
    background: rgba(52, 211, 153, 0.1);
    border-color: rgba(52, 211, 153, 0.2);
  }
  
  .dot {
    width: 8px;
    height: 8px;
    background: #16a34a;
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(22, 163, 74, 0.5);
    animation: pulse 2s ease-in-out infinite;
    
    .dark & {
      background: #34d399;
      box-shadow: 0 0 12px rgba(52, 211, 153, 0.6);
    }
  }
  
  .label {
    font-size: 12px;
    font-weight: 500;
    color: #16a34a;
    
    .dark & {
      color: #34d399;
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
