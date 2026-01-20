<template>
  <div class="home-page">
    <div class="page-container">
      <!-- 页面标题区 -->
      <div class="page-header">
        <div class="header-left">
          <div class="title-badge">
            <el-icon><TrendCharts /></el-icon>
            <span>AI 预测</span>
          </div>
          <h1 class="page-title">预测大盘</h1>
          <p class="page-subtitle">
            查看 AI 模型对股票涨跌的预测结果，发现投资机会
          </p>
        </div>
        <div class="header-right">
          <div class="date-picker-wrap">
            <el-date-picker
              v-model="currentDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
              @change="handleDateChange"
            />
          </div>
          
          <!-- 数据同步按钮 (仅管理员可见) -->
          <el-button 
            v-if="isAdmin"
            size="large"
            :loading="dataSyncStore.syncTask.isRunning"
            :disabled="dataSyncStore.syncTask.isRunning"
            @click="showSyncDialog = true"
          >
            <el-icon><Refresh /></el-icon>
            {{ dataSyncStore.syncTask.isRunning ? '同步中...' : '同步数据' }}
          </el-button>
          
          <!-- 预测按钮 (仅管理员可见) -->
          <el-button 
            v-if="isAdmin"
            type="primary" 
            size="large"
            :loading="store.predictionTask.status === 'pending'"
            :disabled="store.predictionTask.isRunning"
            @click="showPredictDialog = true"
          >
            <el-icon><Cpu /></el-icon>
            {{ store.predictionTask.isRunning ? '预测中...' : '执行预测' }}
          </el-button>
        </div>
      </div>

      <!-- 数据同步进度条 -->
      <SyncProgress
        v-if="dataSyncStore.syncTask.isRunning || showSyncProgress"
        :status="dataSyncStore.syncTask.status"
        :progress="dataSyncStore.syncTask.progress"
        :stage="dataSyncStore.syncTask.stage"
        :sync-type="dataSyncStore.syncTask.syncType"
        :current="dataSyncStore.syncTask.current"
        :total="dataSyncStore.syncTask.total"
        :message="dataSyncStore.syncTask.message"
        :error-message="dataSyncStore.syncTask.errorMessage"
        @close="handleCloseSyncProgress"
      />

      <!-- 预测进度条 -->
      <PredictionProgress
        v-if="store.predictionTask.isRunning || showProgress"
        :status="store.predictionTask.status"
        :progress="store.predictionTask.progress"
        :stage="store.predictionTask.stage"
        :total-stocks="store.predictionTask.totalStocks"
        :processed-stocks="store.predictionTask.processedStocks"
        :positive-count="store.predictionTask.positiveCount"
        :error-message="store.predictionTask.errorMessage"
        @close="handleCloseProgress"
      />

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <StatCard 
          label="预测总数" 
          :value="store.dailyTotal" 
          icon="Document"
          type="primary"
        />
        <StatCard 
          label="看涨数量" 
          :value="store.totalPositiveCount" 
          icon="Top"
          type="danger"
        />
        <StatCard 
          label="准确率" 
          :value="store.accuracyRate" 
          suffix="%"
          icon="PieChart"
          type="success"
        />
        <StatCard 
          label="今日热门" 
          :value="topStock?.name || '-'" 
          icon="TrendCharts"
          type="warning"
        />
      </div>

      <!-- 筛选工具栏 -->
      <div class="filter-toolbar glass-card">
        <div class="filter-section">
          <ScoreSlider 
            v-model="filterScore" 
            @change="handleScoreChange"
          />
        </div>
        
        <div class="filter-divider"></div>
        
        <div class="filter-section">
          <span class="filter-label">预测方向</span>
          <el-radio-group v-model="filterPrediction" @change="handlePredictionFilter">
            <el-radio-button :value="null">全部</el-radio-button>
            <el-radio-button :value="1">
              <el-icon><Top /></el-icon>
              看涨
            </el-radio-button>
            <el-radio-button :value="0">
              <el-icon><Bottom /></el-icon>
              看跌
            </el-radio-button>
          </el-radio-group>
        </div>
        
        <div class="filter-divider"></div>
        
        <div class="filter-section">
          <el-checkbox 
            v-model="excludeLimitUp" 
            @change="handleExcludeLimitUp"
          >
            剔除涨停
          </el-checkbox>
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
            预测列表
            <span class="date-hint">
              <el-icon><Calendar /></el-icon>
              {{ formatShortDate(currentDate) }} 买入
            </span>
          </h2>
          <div class="table-actions">
            <span class="result-count">
              共 <strong>{{ store.pagination.total }}</strong> 条记录
            </span>
          </div>
        </div>
        
        <el-table
          :data="store.filteredPredictions"
          v-loading="store.loading"
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
          
          <el-table-column prop="score" label="得分" width="160" sortable>
            <template #default="{ row }">
              <div class="score-cell">
                <div class="score-bar">
                  <div 
                    class="score-fill" 
                    :style="{ 
                      width: (row.score * 100) + '%',
                      background: getScoreGradient(row.score)
                    }"
                  ></div>
                </div>
                <span class="score-value">{{ row.score.toFixed(3) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="prediction" label="预测" width="100" align="center">
            <template #default="{ row }">
              <PredictionBadge :prediction="row.prediction" />
            </template>
          </el-table-column>
          
          <el-table-column prop="buy_price" label="买入价" width="110" align="right">
            <template #default="{ row }">
              <span class="price-value" v-if="row.buy_price !== null && row.buy_price !== undefined">
                ¥{{ row.buy_price.toFixed(2) }}
              </span>
              <span v-else class="return-pending">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="day_change" label="当日涨跌" width="110" sortable>
            <template #default="{ row }">
              <span 
                v-if="row.day_change !== null && row.day_change !== undefined"
                class="return-value"
                :class="{ up: row.day_change > 0, down: row.day_change < 0, neutral: row.day_change === 0 }"
              >
                {{ row.day_change > 0 ? '+' : '' }}{{ row.day_change.toFixed(2) }}%
              </span>
              <span v-else class="return-pending">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="actual_return" label="3日最高" width="110" sortable>
            <template #default="{ row }">
              <span 
                v-if="row.actual_return !== null"
                class="return-value"
                :class="{ up: row.actual_return > 0, down: row.actual_return < 0 }"
              >
                {{ row.actual_return > 0 ? '+' : '' }}{{ (row.actual_return * 100).toFixed(2) }}%
              </span>
              <span v-else class="return-pending">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="is_correct" label="状态" width="100" align="center">
            <template #default="{ row }">
              <ResultBadge :is-correct="row.is_correct" />
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
            :page-size="store.pagination.pageSize"
            :total="store.pagination.total"
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 预测对话框 -->
    <el-dialog
      v-model="showPredictDialog"
      title="执行预测"
      width="480px"
      class="predict-dialog"
      :close-on-click-modal="false"
    >
      <div class="predict-form">
        <div class="form-item">
          <label>预测日期范围</label>
          <el-date-picker
            v-model="predictDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            :shortcuts="dateShortcuts"
            style="width: 100%"
          />
        </div>
        <div class="form-item">
          <label>得分阈值</label>
          <div class="threshold-input">
            <el-slider
              v-model="predictThreshold"
              :min="0"
              :max="1"
              :step="0.05"
              :format-tooltip="(val) => val.toFixed(2)"
            />
            <span class="threshold-value">{{ predictThreshold.toFixed(2) }}</span>
          </div>
        </div>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>将对选定日期范围内的所有交易日进行预测</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPredictDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!predictDateRange || predictDateRange.length !== 2"
          @click="handlePredict"
        >
          开始预测
        </el-button>
      </template>
    </el-dialog>

    <!-- 数据同步对话框 -->
    <el-dialog
      v-model="showSyncDialog"
      title="数据同步设置"
      width="480px"
      class="sync-dialog"
      :close-on-click-modal="false"
    >
      <div class="sync-form">
        <div class="form-item">
          <label>同步类型</label>
          <el-radio-group v-model="syncDataType" class="sync-type-group">
            <el-radio-button value="all">全部数据</el-radio-button>
            <el-radio-button value="daily">仅日K</el-radio-button>
            <el-radio-button value="5min">仅5分钟K</el-radio-button>
          </el-radio-group>
        </div>
        <div class="form-item">
          <label>同步日期范围</label>
          <el-date-picker
            v-model="syncDateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            :disabled-date="disabledDate"
            :shortcuts="syncDateShortcuts"
            style="width: 100%"
          />
        </div>
        <div class="form-tip">
          <el-icon><InfoFilled /></el-icon>
          <span>将同步选定日期范围内的所有交易数据</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showSyncDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!syncDateRange || syncDateRange.length !== 2"
          @click="handleSync"
        >
          开始同步
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Cpu, Search, ArrowRight, TrendCharts, Top, Bottom, List, Refresh, Files, Calendar, Timer, InfoFilled } from '@element-plus/icons-vue'
import { usePredictionStore } from '@/stores/prediction'
import { useDataSyncStore } from '@/stores/dataSync'
import { useAuthStore } from '@/stores/auth'
import StatCard from '@/components/StatCard.vue'
import ScoreSlider from '@/components/ScoreSlider.vue'
import PredictionBadge from '@/components/PredictionBadge.vue'
import ResultBadge from '@/components/ResultBadge.vue'
import PredictionProgress from '@/components/PredictionProgress.vue'
import SyncProgress from '@/components/SyncProgress.vue'
import dayjs from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
dayjs.extend(isSameOrBefore)
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = usePredictionStore()
const dataSyncStore = useDataSyncStore()
const authStore = useAuthStore()

// 是否是管理员
const isAdmin = computed(() => authStore.userRole === 'admin')

const currentDate = ref(store.currentDate)
const filterScore = ref(store.filters.minScore)
const filterPrediction = ref(store.filters.prediction)
const searchKeyword = ref('')
const excludeLimitUp = ref(store.filters.excludeLimitUp)
const currentPage = ref(1)
const showProgress = ref(false)
const showSyncProgress = ref(false)

// 预测对话框相关
const showPredictDialog = ref(false)
const predictDateRange = ref([dayjs().format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')])
const predictThreshold = ref(0.5)

// 同步对话框相关
const showSyncDialog = ref(false)
const syncDataType = ref('all')
const syncDateRange = ref([
  dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
])

// 同步日期快捷选项
const syncDateShortcuts = [
  {
    text: '最近7天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '最近90天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(89, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '最近180天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(179, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const start = dayjs().startOf('month').format('YYYY-MM-DD')
      const end = dayjs().format('YYYY-MM-DD')
      return [start, end]
    }
  }
]

// 日期快捷选项
const dateShortcuts = [
  {
    text: '今天',
    value: () => {
      const today = dayjs().format('YYYY-MM-DD')
      return [today, today]
    }
  },
  {
    text: '最近7天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '最近30天',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
      return [start, end]
    }
  },
  {
    text: '本月',
    value: () => {
      const end = dayjs().format('YYYY-MM-DD')
      const start = dayjs().startOf('month').format('YYYY-MM-DD')
      return [start, end]
    }
  }
]

const topStock = computed(() => {
  if (!store.predictions.length) return null
  return [...store.predictions].sort((a, b) => b.score - a.score)[0]
})

const disabledDate = (date) => {
  return date > new Date()
}

// 格式化日期显示
const formatDisplayDate = (date) => {
  if (!date) return ''
  const d = dayjs(date)
  return `${d.month() + 1}月${d.date()}日`
}

const formatShortDate = (date) => {
  if (!date) return ''
  const d = dayjs(date)
  return `${d.month() + 1}月${d.date()}日`
}

const getScoreGradient = (score) => {
  if (score >= 0.8) return 'linear-gradient(90deg, var(--up-color), #ef4444)'
  if (score >= 0.6) return 'linear-gradient(90deg, #fbbf24, #f59e0b)'
  return 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
}

const handleDateChange = (date) => {
  store.setDate(date)
}

// 生成日期范围内的所有日期数组
const generateDateRange = (startDate, endDate) => {
  const dates = []
  let current = dayjs(startDate)
  const end = dayjs(endDate)
  
  while (current.isSameOrBefore(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }
  
  return dates
}

const handlePredict = async () => {
  if (!predictDateRange.value || predictDateRange.value.length !== 2) {
    ElMessage.warning('请选择预测日期范围')
    return
  }
  
  try {
    showPredictDialog.value = false
    showProgress.value = true
    
    // 生成日期数组
    const dates = generateDateRange(predictDateRange.value[0], predictDateRange.value[1])
    
    await store.runPrediction(dates, predictThreshold.value)
    ElMessage.success('预测任务已启动')
  } catch (error) {
    ElMessage.error(error.message || '启动预测任务失败')
  }
}

const handleCloseProgress = () => {
  showProgress.value = false
  store.resetTask()
}

// 处理数据同步
const handleSync = async () => {
  if (!syncDateRange.value || syncDateRange.value.length !== 2) {
    ElMessage.warning('请选择同步日期范围')
    return
  }
  
  try {
    showSyncDialog.value = false
    showSyncProgress.value = true
    
    // 生成日期数组（复用预测的函数）
    const dates = generateDateRange(syncDateRange.value[0], syncDateRange.value[1])
    
    await dataSyncStore.startSync(syncDataType.value, dates)
    ElMessage.success('数据同步任务已启动')
  } catch (error) {
    ElMessage.error(error.message || '启动同步任务失败')
  }
}

const handleCloseSyncProgress = () => {
  showSyncProgress.value = false
  dataSyncStore.resetTask()
}

const handleScoreChange = (score) => {
  store.setFilters({ minScore: score })
}

const handlePredictionFilter = (val) => {
  store.setFilters({ prediction: val })
}

const handleExcludeLimitUp = (val) => {
  store.setFilters({ excludeLimitUp: val })
}

let searchTimer = null
const handleSearch = (val) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    store.setFilters({ keyword: val })
  }, 300)
}

const handleRowClick = (row) => {
  router.push(`/stock/${row.code}`)
}

const handlePageChange = (page) => {
  store.setPage(page)
}

// 监听预测任务完成状态
watch(() => store.predictionTask.status, (status) => {
  if (status === 'completed') {
    ElMessage.success('预测完成！')
  } else if (status === 'failed') {
    ElMessage.error(store.predictionTask.errorMessage || '预测失败')
  }
})

// 监听数据同步任务完成状态
watch(() => dataSyncStore.syncTask.status, (status) => {
  if (status === 'completed') {
    ElMessage.success('数据同步完成！')
  } else if (status === 'failed') {
    ElMessage.error(dataSyncStore.syncTask.errorMessage || '数据同步失败')
  }
})

onMounted(() => {
  store.fetchPredictions()
  store.fetchStats()
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
    background: rgba(var(--primary-rgb), 0.1);
    border: 1px solid rgba(var(--primary-rgb), 0.2);
    border-radius: 20px;
    color: var(--primary-color);
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
    background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-color) 100%);
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

.date-picker-wrap {
  :deep(.el-input__wrapper) {
    padding: 8px 16px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 24px;
  
  > * {
    animation: fadeIn 0.6s ease backwards;
    
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.25s; }
  }
  
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
}

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
      color: var(--primary-color);
    }
    
    .date-hint {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 12px;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(var(--primary-rgb), 0.15), rgba(192, 132, 252, 0.15));
      border: 1px solid rgba(var(--primary-rgb), 0.2);
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color);
      
      .el-icon {
        font-size: 14px;
      }
    }
  }
  
  .result-count {
    font-size: 13px;
    color: var(--text-muted);
    
    strong {
      color: var(--primary-color);
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
  color: var(--primary-color);
  font-size: 13px;
}

.stock-name {
  font-weight: 600;
  color: var(--text-primary);
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .score-bar {
    flex: 1;
    height: 6px;
    background: var(--border-color);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .score-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }
  
  .score-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    min-width: 54px;
    color: var(--text-secondary);
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
  
  &.up {
    color: var(--up-color);
  }
  
  &.down {
    color: var(--down-color);
  }
  
  &.neutral {
    color: var(--text-muted);
  }
}

.return-pending {
  color: var(--text-muted);
}

.view-btn {
  opacity: 0.6;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
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

// 预测对话框样式
.predict-form {
  padding: 10px 0;
  
  .form-item {
    margin-bottom: 24px;
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }
  }
  
  .threshold-input {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .el-slider {
      flex: 1;
    }
    
    .threshold-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 16px;
      font-weight: 700;
      color: var(--primary-color);
      min-width: 45px;
      text-align: right;
    }
  }
  
  .form-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(var(--primary-rgb), 0.08);
    border-radius: 10px;
    font-size: 13px;
    color: var(--text-secondary);
    
    .el-icon {
      color: var(--primary-color);
      font-size: 16px;
    }
  }
}

// 同步对话框表单
.sync-form {
  padding: 10px 0;
  
  .form-item {
    margin-bottom: 24px;
    
    label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }
  }
  
  .sync-type-group {
    width: 100%;
    
    .el-radio-button {
      flex: 1;
      
      :deep(.el-radio-button__inner) {
        width: 100%;
      }
    }
  }
  
  .form-tip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: rgba(var(--primary-rgb), 0.08);
    border-radius: 10px;
    font-size: 13px;
    color: var(--text-secondary);
    
    .el-icon {
      color: var(--primary-color);
      font-size: 16px;
    }
  }
}
</style>
