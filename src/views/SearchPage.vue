<template>
  <div class="search-page">
    <div class="page-container">
      <!-- 搜索区域 -->
      <div class="search-header">
        <div class="search-title">
          <div class="title-icon">
            <el-icon><Search /></el-icon>
          </div>
          <h1 class="page-title">搜索股票</h1>
        </div>
        <p class="page-subtitle">输入股票代码或名称，快速定位目标</p>
        
        <div class="search-box-wrapper">
          <div class="search-box glass-card">
            <el-icon class="search-icon"><Search /></el-icon>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="输入股票代码或名称..."
              @input="handleSearch"
            />
            <button 
              v-if="searchQuery" 
              class="clear-btn"
              @click="handleClear"
            >
              <el-icon><Close /></el-icon>
            </button>
          </div>
          <div class="search-hint">
            <kbd>Enter</kbd> 搜索 · <kbd>ESC</kbd> 清除
          </div>
        </div>
      </div>

      <!-- 搜索结果 -->
      <div class="search-results" v-if="searchQuery">
        <div class="results-header">
          <span class="results-count" v-if="!loading">
            找到 <strong>{{ searchResults.length }}</strong> 只股票
          </span>
        </div>
        
        <div class="results-list" v-loading="loading">
          <div
            v-for="(stock, index) in searchResults"
            :key="stock.code"
            class="result-item glass-card"
            :style="{ animationDelay: `${index * 0.05}s` }"
            @click="goToStock(stock.code)"
          >
            <div class="result-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="result-main">
              <div class="result-code">{{ stock.code }}</div>
              <div class="result-name">{{ stock.name }}</div>
            </div>
            <div class="result-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </div>
          
          <el-empty 
            v-if="!loading && !searchResults.length && searchQuery"
            description="未找到相关股票"
          />
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="hot-stocks" v-if="!searchQuery">
        <div class="section-header">
          <div class="section-title">
            <div class="title-icon small">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <h2>热门股票</h2>
          </div>
        </div>
        
        <div class="hot-tags">
          <button
            v-for="stock in hotStocks"
            :key="stock.code"
            class="hot-tag"
            @click="goToStock(stock.code)"
          >
            <span class="tag-name">{{ stock.name }}</span>
            <span class="tag-code">{{ stock.code }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, TrendCharts, Close } from '@element-plus/icons-vue'
import { searchStocks, getTopPredictions } from '@/api'
import { usePredictionStore } from '@/stores/prediction'
import dayjs from 'dayjs'

const router = useRouter()
const predictionStore = usePredictionStore()

const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const hotStocks = ref([])

let searchTimer = null

const handleSearch = (e) => {
  const val = e.target.value
  if (searchTimer) clearTimeout(searchTimer)
  
  if (!val) {
    searchResults.value = []
    return
  }
  
  searchTimer = setTimeout(async () => {
    loading.value = true
    try {
      const result = await searchStocks(val, 20)
      // API 可能返回数组或 { items: [...] } 格式
      searchResults.value = Array.isArray(result) ? result : (result?.items || [])
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const handleClear = () => {
  searchQuery.value = ''
  searchResults.value = []
}

const goToStock = (code) => {
  router.push(`/stock/${code}`)
}

const fetchHotStocks = async () => {
  try {
    // 使用 prediction store 中的当前日期（已经是最近交易日）
    const date = predictionStore.currentDate
    // 使用当前选中的模型
    const result = await getTopPredictions(date, 10, predictionStore.currentModel || null)
    // API 返回格式: { date: "...", items: [...] }
    hotStocks.value = result?.items || result || []
    console.log('热门股票:', date, predictionStore.currentModel, result)
  } catch (error) {
    console.error('获取热门股票失败:', error)
    hotStocks.value = []
  }
}

// 监听模型变化，重新获取热门股票
watch(() => predictionStore.currentModel, (newVal) => {
  // 只有当模型有值时才获取
  if (newVal) {
    fetchHotStocks()
  }
})

onMounted(() => {
  // 如果模型已经加载，立即获取
  if (predictionStore.currentModel) {
    fetchHotStocks()
  }
  // 否则等待模型加载完成后会触发 watch
})
</script>

<style lang="scss" scoped>
.search-page {
  min-height: calc(100vh - 72px);
  padding-top: 72px;
}

.page-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 60px 24px 80px;
}

.search-header {
  text-align: center;
  margin-bottom: 48px;
  animation: fadeIn 0.6s ease;
}

.search-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
  
  .title-icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 24px;
    box-shadow: 
      0 8px 32px rgba(var(--primary-rgb), 0.4),
      0 0 60px rgba(var(--primary-rgb), 0.2);
  }
}

.page-title {
  font-size: 48px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -2px;
  background: linear-gradient(135deg, var(--text-primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 16px;
  color: var(--text-muted);
  margin-top: 8px;
}

.search-box-wrapper {
  margin-top: 40px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 28px;
  border-radius: 20px;
  transition: all 0.3s ease;
  
  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 
      var(--shadow-lg),
      0 0 0 4px rgba(var(--primary-rgb), 0.1),
      var(--shadow-glow);
  }
  
  .search-icon {
    font-size: 22px;
    color: var(--text-muted);
  }
  
  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 18px;
    font-family: inherit;
    color: var(--text-primary);
    
    &::placeholder {
      color: var(--text-muted);
    }
  }
  
  .clear-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: var(--text-primary);
    }
  }
}

.search-hint {
  margin-top: 16px;
  font-size: 13px;
  color: var(--text-muted);
  
  kbd {
    display: inline-block;
    padding: 3px 8px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    border-radius: 6px;
    font-family: inherit;
    font-size: 11px;
    margin: 0 4px;
  }
}

.search-results {
  margin-top: 32px;
  animation: fadeIn 0.4s ease;
}

.results-header {
  margin-bottom: 20px;
  
  .results-count {
    font-size: 14px;
    color: var(--text-muted);
    
    strong {
      color: var(--primary-light);
    }
  }
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  cursor: pointer;
  animation: slideIn 0.4s ease backwards;
  
  &:hover {
    .result-arrow {
      opacity: 1;
      transform: translateX(4px);
    }
  }
  
  .result-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.2));
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-light);
    font-size: 18px;
  }
  
  .result-main {
    flex: 1;
    
    .result-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-muted);
    }
    
    .result-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-top: 4px;
    }
  }
  
  .result-arrow {
    color: var(--text-muted);
    opacity: 0;
    transition: all 0.2s ease;
  }
}

.hot-stocks {
  animation: fadeIn 0.6s ease;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 16px rgba(var(--primary-rgb), 0.4);
    
    &.small {
      width: 36px;
      height: 36px;
    }
  }
  
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
  }
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 32px;
}

.hot-tag {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  
  .tag-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .tag-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: var(--text-muted);
  }
  
  &:hover {
    border-color: var(--primary-color);
    background: rgba(var(--primary-rgb), 0.1);
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.2);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
