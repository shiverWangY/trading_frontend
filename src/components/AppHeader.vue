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
          <span class="logo-text">DeepQuant</span>
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
        <button class="search-btn" @click="showSearch = true">
          <el-icon :size="18"><Search /></el-icon>
          <span>搜索</span>
          <kbd>⌘K</kbd>
        </button>
        
        <!-- GitHub 链接 -->
        <a 
          href="https://github.com/shiverWangY/trading_frontend" 
          target="_blank" 
          class="github-btn"
          title="GitHub"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
        
        <!-- 主题切换按钮 -->
        <ThemeToggle />
        
        <!-- 用户信息 -->
        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-avatar">
            <div class="avatar-circle">
              {{ authStore.nickname?.charAt(0)?.toUpperCase() || 'U' }}
            </div>
            <span class="user-name">{{ authStore.nickname || '用户' }}</span>
            <el-icon><ArrowDown /></el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <div class="user-info-item">
                  <span class="label">用户名</span>
                  <span class="value">{{ authStore.username }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item disabled>
                <div class="user-info-item">
                  <span class="label">角色</span>
                  <span class="value">{{ authStore.userRole === 'admin' ? '管理员' : '普通用户' }}</span>
                </div>
              </el-dropdown-item>
              <el-dropdown-item divided command="password">
                <el-icon><Lock /></el-icon>
                修改密码
              </el-dropdown-item>
              <el-dropdown-item command="logout">
                <el-icon><SwitchButton /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    
    <!-- 搜索弹窗 -->
    <SearchDialog v-model:visible="showSearch" />
  </header>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TrendCharts, HomeFilled, DataAnalysis, Search, Lock, SwitchButton, ArrowDown } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ThemeToggle from '@/components/ThemeToggle.vue'
import SearchDialog from '@/components/SearchDialog.vue'
import { usePredictionStore } from '@/stores/prediction'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const store = usePredictionStore()
const authStore = useAuthStore()

const selectedModel = ref(store.currentModel)
const showSearch = ref(false)

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

// 用户菜单命令处理
const handleUserCommand = async (command) => {
  if (command === 'logout') {
    authStore.logout()
    router.push('/login')
  } else if (command === 'password') {
    // 修改密码对话框
    ElMessageBox.prompt('请输入新密码', '修改密码', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'password',
      inputPlaceholder: '请输入新密码（至少6位）',
      inputValidator: (value) => {
        if (!value || value.length < 6) {
          return '密码至少6个字符'
        }
        return true
      }
    }).then(async ({ value }) => {
      try {
        // 这里需要旧密码，简化处理直接用新密码
        await authStore.updatePassword(value, value)
        ElMessage.success('密码修改成功')
      } catch (err) {
        ElMessage.error(err.message || '密码修改失败')
      }
    }).catch(() => {})
  }
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

.github-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-muted);
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--glass-border-hover);
    color: var(--text-primary);
    background: var(--glass-bg-hover);
    transform: translateY(-2px);
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

// 用户头像和下拉菜单
.user-avatar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: var(--glass-border-hover);
    background: var(--glass-bg-hover);
  }
  
  .avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(var(--primary-rgb), 0.3);
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .el-icon {
    color: var(--text-muted);
    font-size: 12px;
    transition: transform 0.2s;
  }
}

.user-info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  
  .label {
    font-size: 11px;
    color: var(--text-muted);
  }
  
  .value {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }
}

</style>
