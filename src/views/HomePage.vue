<template>
  <div class="home-page">
    <div class="page-container">
      <!-- 页面标题区 -->
      <div class="page-header">
        <div class="header-left">
          <div class="title-badge">
            <el-icon><TrendCharts /></el-icon>
            <span>Kronos-Monte-Carlo</span>
          </div>
          <h1 class="page-title">预测大盘</h1>
          <p class="page-subtitle">
            基于序列生成-蒙特卡洛模拟的股票涨跌概率预测，发现高确定性投资机会
          </p>
        </div>
        <div class="header-right">
          <div class="date-selector" v-if="availableDates.length">
            <el-select 
              v-model="selectedDate" 
              placeholder="选择预测日期"
              size="large"
              @change="handleDateChange"
            >
              <el-option
                v-for="item in availableDates"
                :key="item.exec_date"
                :label="formatDateOption(item)"
                :value="item.exec_date"
              >
                <div class="date-option">
                  <span class="date-main">{{ item.exec_date }}</span>
                  <span class="date-info">
                    {{ item.stock_count }} 只 · 
                    <span :class="item.avg_up_probability_pct >= 50 ? 'up' : 'down'">
                      {{ item.avg_up_probability_pct.toFixed(1) }}% 看涨
                    </span>
                  </span>
                </div>
              </el-option>
            </el-select>
          </div>
        </div>
      </div>

      <!-- 大盘概览统计 -->
      <div class="overview-section" v-if="currentDateInfo">
        <div class="overview-card glass-card main-stat">
          <div class="stat-visual">
            <div class="gauge-ring" :style="gaugeStyle">
              <div class="gauge-center">
                <span class="gauge-value" :class="currentDateInfo.avg_up_probability_pct >= 50 ? 'up' : 'down'">
                  {{ currentDateInfo.avg_up_probability_pct.toFixed(1) }}%
                </span>
                <span class="gauge-label">平均看涨</span>
              </div>
            </div>
          </div>
          <div class="stat-info">
            <h3>大盘情绪</h3>
            <p class="stat-desc">
              预测日期 <strong>{{ predictDate }}</strong>，
              共 <strong>{{ currentDateInfo.stock_count }}</strong> 只股票
            </p>
            <div class="sentiment-bar">
              <div class="sentiment-fill up" :style="{ width: currentDateInfo.avg_up_probability_pct + '%' }"></div>
              <div class="sentiment-fill down" :style="{ width: (100 - currentDateInfo.avg_up_probability_pct) + '%' }"></div>
            </div>
            <div class="sentiment-labels">
              <span class="up">看涨 {{ currentDateInfo.avg_up_probability_pct.toFixed(1) }}%</span>
              <span class="down">看跌 {{ (100 - currentDateInfo.avg_up_probability_pct).toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon return">
            <el-icon><TrendCharts /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">平均预期收益</span>
            <span 
              class="card-value"
              :class="currentDateInfo.avg_expected_return_pct >= 0 ? 'up' : 'down'"
            >
              {{ currentDateInfo.avg_expected_return_pct >= 0 ? '+' : '' }}{{ currentDateInfo.avg_expected_return_pct.toFixed(2) }}%
            </span>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon stocks">
            <el-icon><Histogram /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">高概率看涨</span>
            <span class="card-value highlight">{{ highProbCount }}</span>
            <span class="card-sub">上涨概率 &gt; 70%</span>
          </div>
        </div>

        <div class="overview-card glass-card">
          <div class="card-icon date">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="card-content">
            <span class="card-label">预测目标日</span>
            <span class="card-value date-val">{{ predictDate }}</span>
            <span class="card-sub">基于 {{ selectedDate }} 数据</span>
          </div>
        </div>
      </div>

      <!-- 筛选工具栏 -->
      <div class="filter-toolbar glass-card">
        <div class="filter-section">
          <span class="filter-label">排序方式</span>
          <el-radio-group v-model="sortBy" @change="handleSortChange">
            <el-radio-button value="up_probability">上涨概率</el-radio-button>
            <el-radio-button value="expected_return">预期收益</el-radio-button>
            <el-radio-button value="sharpe_ratio">夏普比率</el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="filter-divider"></div>
        
        <div class="filter-section">
          <span class="filter-label">最低概率</span>
          <el-slider
            v-model="minProbability"
            :min="0"
            :max="100"
            :step="5"
            :format-tooltip="val => val + '%'"
            style="width: 150px"
            @change="handleFilterChange"
          />
          <span class="filter-value">{{ minProbability }}%</span>
        </div>
        
        <div class="filter-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索股票..."
            :prefix-icon="Search"
            clearable
            @input="handleSearch"
          />
        </div>
      </div>

      <!-- 预测结果表格 -->
      <div class="prediction-table-card glass-card">
        <div class="table-header">
          <h2 class="table-title">
            <el-icon><List /></el-icon>
            概率预测列表
          </h2>
          <div class="table-actions">
            <span class="result-count">
              共 <strong>{{ totalCount }}</strong> 条记录
            </span>
          </div>
        </div>
        
        <el-table
          :data="filteredList"
          v-loading="loading"
          stripe
          highlight-current-row
          @row-click="handleRowClick"
          style="width: 100%"
        >
          <el-table-column prop="code" label="代码" width="110">
            <template #default="{ row }">
              <span class="stock-code">{{ row.code }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="name" label="名称" min-width="140">
            <template #default="{ row }">
              <span class="stock-name">{{ row.name }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="up_probability_pct" label="上涨概率" width="180" sortable>
            <template #default="{ row }">
              <div class="probability-cell">
                <div class="prob-bar">
                  <div 
                    class="prob-fill"
                    :class="getProbClass(row.up_probability_pct)"
                    :style="{ width: row.up_probability_pct + '%' }"
                  ></div>
                </div>
                <span class="prob-value" :class="getProbClass(row.up_probability_pct)">
                  {{ row.up_probability_pct.toFixed(1) }}%
                </span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="expected_return_pct" label="预期收益" width="120">
            <template #default="{ row }">
              <span 
                v-if="row.expected_return_pct != null"
                class="return-value"
                :class="{ up: row.expected_return_pct > 0, down: row.expected_return_pct < 0 }"
              >
                {{ row.expected_return_pct > 0 ? '+' : '' }}{{ row.expected_return_pct.toFixed(2) }}%
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="sharpe_ratio" label="夏普比率" width="120">
            <template #default="{ row }">
              <span 
                v-if="row.sharpe_ratio != null"
                class="sharpe-value"
                :class="{ positive: row.sharpe_ratio > 0, negative: row.sharpe_ratio < 0 }"
              >
                {{ row.sharpe_ratio.toFixed(2) }}
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="current_close" label="当前价" width="110" align="right">
            <template #default="{ row }">
              <span class="price-value" v-if="row.current_close != null">¥{{ row.current_close.toFixed(2) }}</span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="预测区间" width="160" align="center">
            <template #default="{ row }">
              <span class="range-value" v-if="row.price_5pct != null && row.price_95pct != null">
                <span class="down">{{ row.price_5pct.toFixed(2) }}</span>
                <span class="separator">~</span>
                <span class="up">{{ row.price_95pct.toFixed(2) }}</span>
              </span>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column label="" width="60" align="center">
            <template #default="{ row }">
              <el-button 
                type="primary" 
                :icon="ArrowRight" 
                circle 
                size="small"
                class="view-btn"
                @click.stop="$router.push(`/stock/${row.code}`)"
              />
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="table-pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="totalCount"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ArrowRight, TrendCharts, List, Calendar, Histogram, Top } from '@element-plus/icons-vue'
import { getMonteCarloDates, getMonteCarloList } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

// 数据状态
const loading = ref(false)
const availableDates = ref([])
const selectedDate = ref('')
const predictionList = ref([])
const totalCount = ref(0)

// 筛选状态
const sortBy = ref('up_probability')
const minProbability = ref(0)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = 50

// 当前选中日期的信息
const currentDateInfo = computed(() => {
  return availableDates.value.find(d => d.exec_date === selectedDate.value)
})

// 预测目标日期
const predictDate = computed(() => {
  return currentDateInfo.value?.predict_date || '-'
})

// 高概率看涨数量
const highProbCount = computed(() => {
  return predictionList.value.filter(item => item.up_probability_pct >= 70).length
})

// 仪表盘样式
const gaugeStyle = computed(() => {
  if (!currentDateInfo.value) return {}
  const upProb = currentDateInfo.value.avg_up_probability_pct
  const upColor = upProb >= 50 ? 'var(--up-color)' : 'rgba(220, 38, 38, 0.3)'
  const downColor = upProb < 50 ? 'var(--down-color)' : 'rgba(22, 163, 74, 0.3)'
  return {
    background: `conic-gradient(${upColor} 0deg ${upProb * 3.6}deg, ${downColor} ${upProb * 3.6}deg 360deg)`
  }
})

// 筛选后的列表（前端搜索过滤）
const filteredList = computed(() => {
  let list = [...predictionList.value]
  
  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(item => 
      item.code.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword)
    )
  }
  
  return list
})

// 格式化日期选项
const formatDateOption = (item) => {
  return `${item.exec_date} (${item.stock_count}只)`
}

// 获取概率样式类
const getProbClass = (prob) => {
  if (prob >= 70) return 'high'
  if (prob >= 50) return 'medium'
  return 'low'
}

// 获取可用日期列表
const fetchDates = async () => {
  try {
    const result = await getMonteCarloDates()
    availableDates.value = result.dates || []
    if (availableDates.value.length > 0) {
      selectedDate.value = availableDates.value[0].exec_date
      await fetchList()
    }
  } catch (error) {
    console.error('获取日期列表失败:', error)
  }
}

// 获取预测列表
const fetchList = async () => {
  if (!selectedDate.value) return
  
  loading.value = true
  try {
    const result = await getMonteCarloList(selectedDate.value, {
      sortBy: sortBy.value,
      order: 'desc',
      limit: 100,
      offset: (currentPage.value - 1) * pageSize
    })
    predictionList.value = result.items || []
    totalCount.value = result.total || 0
  } catch (error) {
    console.error('获取预测列表失败:', error)
    console.error('错误详情:', error.response?.data)
    predictionList.value = []
  } finally {
    loading.value = false
  }
}

// 事件处理
const handleDateChange = () => {
  fetchList()
}

const handleSortChange = () => {
  currentPage.value = 1
  fetchList()
}

const handleFilterChange = () => {
  currentPage.value = 1
}

let searchTimer = null
const handleSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
  }, 300)
}

const handleRowClick = (row) => {
  router.push(`/stock/${row.code}`)
}

const handlePageChange = (page) => {
  currentPage.value = page
  fetchList()
}

onMounted(() => {
  fetchDates()
})
</script>

<style lang="scss" scoped>
.home-page {
  min-height: calc(100vh - 72px);
  padding-top: 72px;
}

.page-container {
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 32px 60px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  animation: fadeIn 0.6s ease;
}

.header-left {
  .title-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
    border: 1px solid rgba(139, 92, 246, 0.3);
    border-radius: 20px;
    color: #8b5cf6;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 16px;
  }
  
  .page-title {
    font-size: 42px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -1.5px;
    line-height: 1.1;
    background: linear-gradient(135deg, var(--text-primary) 0%, #8b5cf6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .page-subtitle {
    font-size: 16px;
    color: var(--text-muted);
    margin-top: 12px;
    max-width: 400px;
    line-height: 1.6;
  }
}

.header-right {
  display: flex;
  gap: 14px;
  align-items: center;
}

.date-selector {
  :deep(.el-select) {
    width: 260px;
  }
  
  .date-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    
    .date-main {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }
    
    .date-info {
      font-size: 12px;
      color: var(--text-muted);
      
      .up { color: var(--up-color); }
      .down { color: var(--down-color); }
    }
  }
}

// 大盘概览
.overview-section {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.overview-card {
  padding: 24px;
  animation: fadeIn 0.6s ease backwards;
  
  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.15s; }
  &:nth-child(3) { animation-delay: 0.2s; }
  &:nth-child(4) { animation-delay: 0.25s; }
  
  &.main-stat {
    display: flex;
    align-items: center;
    gap: 28px;
    
    @media (max-width: 1200px) {
      grid-column: 1 / -1;
    }
  }
  
  .stat-visual {
    flex-shrink: 0;
  }
  
  .gauge-ring {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      inset: 8px;
      background: var(--card-bg);
      border-radius: 50%;
    }
  }
  
  .gauge-center {
    position: relative;
    z-index: 1;
    text-align: center;
    
    .gauge-value {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 18px;
      font-weight: 700;
      
      &.up { color: var(--up-color); }
      &.down { color: var(--down-color); }
    }
    
    .gauge-label {
      font-size: 10px;
      color: var(--text-muted);
    }
  }
  
  .stat-info {
    flex: 1;
    
    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }
    
    .stat-desc {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0 0 16px;
      
      strong {
        color: var(--text-primary);
      }
    }
  }
  
  .sentiment-bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
    
    .sentiment-fill {
      height: 100%;
      transition: width 0.5s ease;
      
      &.up { background: var(--up-color); }
      &.down { background: var(--down-color); }
    }
  }
  
  .sentiment-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    
    .up { color: var(--up-color); }
    .down { color: var(--down-color); }
  }
  
  .card-icon {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    margin-bottom: 16px;
    
    &.return {
      background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(251, 191, 36, 0.15));
      color: #f87171;
    }
    
    &.stocks {
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.15), rgba(6, 182, 212, 0.15));
      color: #818cf8;
    }
    
    &.date {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(192, 132, 252, 0.15));
      color: #8b5cf6;
    }
  }
  
  .card-content {
    .card-label {
      display: block;
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 6px;
    }
    
    .card-value {
      display: block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      
      &.up { color: var(--up-color); }
      &.down { color: var(--down-color); }
      &.highlight { color: #8b5cf6; }
      &.date-val { font-size: 18px; }
    }
    
    .card-sub {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
  }
}

// 筛选工具栏
.filter-toolbar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 20px 28px;
  margin-bottom: 24px;
  animation: fadeIn 0.6s ease backwards;
  animation-delay: 0.3s;
  flex-wrap: wrap;
}

.filter-section {
  display: flex;
  align-items: center;
  gap: 14px;
}

.filter-label {
  font-size: 14px;
  color: var(--text-muted);
  font-weight: 500;
}

.filter-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  min-width: 40px;
}

.filter-divider {
  width: 1px;
  height: 32px;
  background: var(--glass-border);
}

.filter-search {
  margin-left: auto;
  
  :deep(.el-input) {
    width: 220px;
  }
}

// 表格
.prediction-table-card {
  padding: 0;
  overflow: hidden;
  animation: fadeIn 0.6s ease backwards;
  animation-delay: 0.35s;
  
  .table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 28px;
    border-bottom: 1px solid var(--glass-border);
  }
  
  .table-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
    
    > .el-icon {
      color: #8b5cf6;
    }
  }
  
  .result-count {
    font-size: 13px;
    color: var(--text-muted);
    
    strong {
      color: #8b5cf6;
    }
  }
  
  :deep(.el-table) {
    .el-table__row {
      cursor: pointer;
    }
  }
}

.stock-code {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: #8b5cf6;
  font-size: 13px;
}

.stock-name {
  font-weight: 600;
  color: var(--text-primary);
}

.probability-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .prob-bar {
    flex: 1;
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .prob-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
    
    &.high { background: var(--up-color); }
    &.medium { background: #fbbf24; }
    &.low { background: var(--down-color); }
  }
  
  .prob-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    min-width: 50px;
    
    &.high { color: var(--up-color); }
    &.medium { color: #fbbf24; }
    &.low { color: var(--down-color); }
  }
}

.price-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
}

.return-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  
  &.up { color: var(--up-color); }
  &.down { color: var(--down-color); }
}

.sharpe-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  
  &.positive { color: #818cf8; }
  &.negative { color: #f87171; }
}

.range-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  
  .up { color: var(--up-color); }
  .down { color: var(--down-color); }
  .separator { 
    color: var(--text-muted); 
    margin: 0 4px;
  }
}

.view-btn {
  opacity: 0.6;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
}

.text-muted {
  color: var(--text-muted);
}

.table-pagination {
  display: flex;
  justify-content: center;
  padding: 24px;
  border-top: 1px solid var(--glass-border);
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
</style>