<template>
  <Teleport to="body">
    <Transition name="search-dialog">
      <div v-if="visible" class="search-dialog-overlay" @click.self="close">
        <div class="search-dialog">
          <!-- 搜索框 -->
          <div class="search-header">
            <el-icon class="search-icon"><Search /></el-icon>
            <input
              ref="inputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="输入股票代码或名称..."
              @input="handleSearch"
              @keydown.enter="handleEnter"
              @keydown.down.prevent="moveSelection(1)"
              @keydown.up.prevent="moveSelection(-1)"
              @keydown.esc="close"
            />
            <kbd class="esc-hint">ESC</kbd>
          </div>
          
          <!-- 搜索结果 -->
          <div class="search-body" v-if="searchQuery">
            <div class="results-status" v-if="loading">
              <el-icon class="loading-icon"><Loading /></el-icon>
              搜索中...
            </div>
            
            <div class="results-list" v-else-if="searchResults.length">
              <div
                v-for="(stock, index) in searchResults"
                :key="stock.code"
                class="result-item"
                :class="{ active: selectedIndex === index }"
                @click="goToStock(stock.code)"
                @mouseenter="selectedIndex = index"
              >
                <div class="result-icon">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="result-info">
                  <div class="result-name">{{ stock.name }}</div>
                  <div class="result-code">{{ stock.code }}</div>
                </div>
                <div class="result-action">
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
            
            <div class="no-results" v-else>
              <el-icon><Search /></el-icon>
              <span>未找到相关股票</span>
            </div>
          </div>
          
          <!-- 热门股票 -->
          <div class="search-body" v-else>
            <div class="section-label">热门股票</div>
            <div class="hot-list" v-if="hotStocks.length">
              <div
                v-for="(stock, index) in hotStocks"
                :key="stock.code"
                class="result-item"
                :class="{ active: selectedIndex === index }"
                @click="goToStock(stock.code)"
                @mouseenter="selectedIndex = index"
              >
                <div class="result-icon hot">
                  <el-icon><TrendCharts /></el-icon>
                </div>
                <div class="result-info">
                  <div class="result-name">{{ stock.name }}</div>
                  <div class="result-code">{{ stock.code }}</div>
                </div>
                <div class="result-action">
                  <el-icon><ArrowRight /></el-icon>
                </div>
              </div>
            </div>
            <div class="no-results" v-else-if="!hotLoading">
              <span>暂无热门股票</span>
            </div>
          </div>
          
          <!-- 底部提示 -->
          <div class="search-footer">
            <div class="hint-item">
              <kbd>↑</kbd><kbd>↓</kbd> 选择
            </div>
            <div class="hint-item">
              <kbd>Enter</kbd> 确认
            </div>
            <div class="hint-item">
              <kbd>ESC</kbd> 关闭
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, TrendCharts, Loading } from '@element-plus/icons-vue'
import { searchStocks, getTopPredictions } from '@/api'
import { usePredictionStore } from '@/stores/prediction'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

const router = useRouter()
const predictionStore = usePredictionStore()

const inputRef = ref(null)
const searchQuery = ref('')
const searchResults = ref([])
const loading = ref(false)
const selectedIndex = ref(0)
const hotStocks = ref([])
const hotLoading = ref(false)

let searchTimer = null

const close = () => {
  emit('update:visible', false)
  searchQuery.value = ''
  searchResults.value = []
  selectedIndex.value = 0
}

const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  
  if (!searchQuery.value) {
    searchResults.value = []
    selectedIndex.value = 0
    return
  }
  
  searchTimer = setTimeout(async () => {
    loading.value = true
    try {
      const result = await searchStocks(searchQuery.value, 10)
      searchResults.value = Array.isArray(result) ? result : (result?.items || [])
      selectedIndex.value = 0
    } catch (error) {
      console.error('搜索失败:', error)
      searchResults.value = []
    } finally {
      loading.value = false
    }
  }, 300)
}

const moveSelection = (delta) => {
  const list = searchQuery.value ? searchResults.value : hotStocks.value
  if (!list.length) return
  
  selectedIndex.value = (selectedIndex.value + delta + list.length) % list.length
}

const handleEnter = () => {
  const list = searchQuery.value ? searchResults.value : hotStocks.value
  if (list.length && selectedIndex.value >= 0) {
    goToStock(list[selectedIndex.value].code)
  }
}

const goToStock = (code) => {
  close()
  router.push(`/stock/${code}`)
}

const fetchHotStocks = async () => {
  hotLoading.value = true
  try {
    const date = predictionStore.currentDate
    const result = await getTopPredictions(date, 6, predictionStore.currentModel || null)
    hotStocks.value = result?.items || result || []
  } catch (error) {
    console.error('获取热门股票失败:', error)
    hotStocks.value = []
  } finally {
    hotLoading.value = false
  }
}

// 全局快捷键
const handleKeydown = (e) => {
  // Cmd/Ctrl + K 打开搜索
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    emit('update:visible', !props.visible)
  }
}

watch(() => props.visible, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
    if (!hotStocks.value.length) {
      fetchHotStocks()
    }
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
.search-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
}

.search-dialog {
  width: 100%;
  max-width: 560px;
  background: var(--card-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 
    0 24px 80px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.search-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--glass-border);
  
  .search-icon {
    font-size: 20px;
    color: var(--text-muted);
  }
  
  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 16px;
    font-family: inherit;
    color: var(--text-primary);
    
    &::placeholder {
      color: var(--text-muted);
    }
  }
  
  .esc-hint {
    padding: 4px 8px;
    background: var(--hover-bg);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 11px;
    font-family: inherit;
    color: var(--text-muted);
  }
}

.search-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 8px;
}

.section-label {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.results-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 32px;
  color: var(--text-muted);
  font-size: 14px;
  
  .loading-icon {
    animation: spin 1s linear infinite;
  }
}

.results-list,
.hot-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  
  &:hover,
  &.active {
    background: var(--hover-bg);
    
    .result-action {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .result-icon {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(var(--primary-rgb), 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary-color);
    font-size: 16px;
    
    &.hot {
      background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(251, 191, 36, 0.15));
      color: #f87171;
    }
  }
  
  .result-info {
    flex: 1;
    min-width: 0;
    
    .result-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .result-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 2px;
    }
  }
  
  .result-action {
    color: var(--text-muted);
    opacity: 0;
    transform: translateX(-4px);
    transition: all 0.15s ease;
  }
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px;
  color: var(--text-muted);
  font-size: 14px;
  
  .el-icon {
    font-size: 32px;
    opacity: 0.5;
  }
}

.search-footer {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  border-top: 1px solid var(--glass-border);
  background: var(--hover-bg);
  
  .hint-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted);
    
    kbd {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 5px;
      font-size: 11px;
      font-family: inherit;
    }
  }
}

// 动画
.search-dialog-enter-active,
.search-dialog-leave-active {
  transition: opacity 0.2s ease;
  
  .search-dialog {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.search-dialog-enter-from,
.search-dialog-leave-to {
  opacity: 0;
  
  .search-dialog {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
