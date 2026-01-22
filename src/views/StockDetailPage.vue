<template>
  <div class="stock-detail-page">
    <div class="page-container">
      <!-- 返回导航 -->
      <div class="back-nav">
        <button class="back-btn" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回列表</span>
        </button>
      </div>

      <!-- 股票信息卡片 -->
      <div class="stock-info-card glass-card" v-loading="stockLoading">
        <div class="card-glow"></div>
        <div class="stock-main-info">
          <div class="stock-badge">
            <span class="stock-code">{{ stockCode }}</span>
          </div>
          <h1 class="stock-name">{{ stockInfo?.name || '-' }}</h1>
        </div>
        
        <div class="stock-price-section" v-if="latestKline">
          <div class="price-main">
            <span class="currency">¥</span>
            <span class="price-value">{{ latestKline.close.toFixed(2) }}</span>
          </div>
          <div 
            class="price-change"
            :class="{ up: priceChange > 0, down: priceChange < 0 }"
          >
            <div class="change-icon">
              <el-icon v-if="priceChange > 0"><Top /></el-icon>
              <el-icon v-else-if="priceChange < 0"><Bottom /></el-icon>
            </div>
            <span class="change-value">
              {{ priceChange > 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
            </span>
          </div>
        </div>
        
        <div class="stock-meta-grid" v-if="latestKline">
          <div class="meta-item">
            <span class="meta-label">昨收</span>
            <span class="meta-value">¥{{ preClose.toFixed(2) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">开盘</span>
            <span class="meta-value">¥{{ latestKline.open.toFixed(2) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最高</span>
            <span class="meta-value up">¥{{ latestKline.high.toFixed(2) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">最低</span>
            <span class="meta-value down">¥{{ latestKline.low.toFixed(2) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">成交量</span>
            <span class="meta-value">{{ formatVolume(latestKline.volume) }}</span>
          </div>
        </div>
      </div>

      <!-- K线图 -->
      <div class="kline-section glass-card">
        <KLineChart
          :data="klineData"
          :prediction-data="predictionKlineData"
          :prediction-info="predictionInfo"
          :loading="klineLoading"
          :prediction-loading="predictionLoading"
          :default-predict-date="defaultPredictDate"
          @range-change="handleRangeChange"
          @predict-toggle="handlePredictToggle"
          @predict-date-change="handlePredictDateChange"
        />
      </div>

      <!-- 预测历史 -->
      <div class="prediction-history-card glass-card">
        <div class="section-header">
          <h2 class="section-title">
            <div class="title-icon">
              <el-icon><Clock /></el-icon>
            </div>
            预测历史
          </h2>
          <span class="history-count">最近 30 天</span>
        </div>
        
        <el-table
          :data="predictionHistory"
          v-loading="historyLoading"
          stripe
        >
          <el-table-column prop="date" label="日期" width="130">
            <template #default="{ row }">
              <span class="date-value">{{ row.date }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="score" label="得分" width="130">
            <template #default="{ row }">
              <div class="score-cell">
                <div class="score-dot" :style="{ background: getScoreColor(row.score) }"></div>
                <span class="score-value">{{ row.score.toFixed(3) }}</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="prediction" label="预测" width="110" align="center">
            <template #default="{ row }">
              <PredictionBadge :prediction="row.prediction" />
            </template>
          </el-table-column>
          
          <el-table-column prop="actual_return" label="3日最高" width="130">
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
          
          <el-table-column prop="is_correct" label="结果" width="110" align="center">
            <template #default="{ row }">
              <ResultBadge :is-correct="row.is_correct" />
            </template>
          </el-table-column>
        </el-table>
        
        <el-empty 
          v-if="!historyLoading && !predictionHistory.length"
          description="暂无预测历史"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Top, Bottom, Clock } from '@element-plus/icons-vue'
import { getStockInfo, getDailyKLine, getPredictionDetail, getDailyKLinePrediction } from '@/api'
import { usePredictionStore } from '@/stores/prediction'
import KLineChart from '@/components/KLineChart.vue'
import PredictionBadge from '@/components/PredictionBadge.vue'
import ResultBadge from '@/components/ResultBadge.vue'
import dayjs from 'dayjs'

const route = useRoute()
const predictionStore = usePredictionStore()

const stockCode = computed(() => route.params.code)
const stockInfo = ref(null)
const stockLoading = ref(false)
const klineData = ref([])
const klineLoading = ref(false)
const timeRange = ref(60)
const predictionHistory = ref([])
const historyLoading = ref(false)

// K线预测相关
const predictionKlineData = ref([])
const predictionInfo = ref(null)
const predictionLoading = ref(false)
const selectedPredictDate = ref(null)

// 默认预测日期（今天）
const defaultPredictDate = computed(() => dayjs().format('YYYY-MM-DD'))

// 最新一条K线数据
const latestKline = computed(() => {
  if (!klineData.value.length) return null
  return klineData.value[klineData.value.length - 1]
})

// 昨日收盘价（或前一条K线的收盘价）
const preClose = computed(() => {
  if (!klineData.value.length) return 0
  
  const latest = klineData.value[klineData.value.length - 1]
  
  // 如果API提供了 pre_close 字段
  if (latest.pre_close !== undefined && latest.pre_close !== null) {
    return latest.pre_close
  }
  
  // 否则使用前一条K线的收盘价
  if (klineData.value.length >= 2) {
    return klineData.value[klineData.value.length - 2].close
  }
  
  // 如果只有一条数据，使用开盘价作为参考
  return latest.open
})

// 涨跌幅 = (今日收盘 - 昨日收盘) / 昨日收盘 * 100%
const priceChange = computed(() => {
  if (!latestKline.value || !preClose.value) return 0
  return ((latestKline.value.close - preClose.value) / preClose.value) * 100
})

const formatVolume = (vol) => {
  if (vol >= 100000000) {
    return (vol / 100000000).toFixed(2) + '亿'
  } else if (vol >= 10000) {
    return (vol / 10000).toFixed(2) + '万'
  }
  return vol.toString()
}

const getScoreColor = (score) => {
  if (score >= 0.8) return '#f87171'
  if (score >= 0.6) return '#fbbf24'
  return '#818cf8'
}

const fetchStockInfo = async () => {
  stockLoading.value = true
  try {
    stockInfo.value = await getStockInfo(stockCode.value)
  } catch (error) {
    console.error('获取股票信息失败:', error)
  } finally {
    stockLoading.value = false
  }
}

const fetchKlineData = async () => {
  klineLoading.value = true
  try {
    const result = await getDailyKLine(stockCode.value, timeRange.value)
    klineData.value = result.data || []
  } catch (error) {
    console.error('获取K线数据失败:', error)
    klineData.value = []
  } finally {
    klineLoading.value = false
  }
}

const fetchPredictionHistory = async () => {
  historyLoading.value = true
  try {
    const dates = []
    for (let i = 0; i < 30; i++) {
      dates.push(dayjs().subtract(i, 'day').format('YYYY-MM-DD'))
    }
    
    // 使用当前选中的模型
    const modelName = predictionStore.currentModel || null
    const results = await Promise.allSettled(
      dates.map(date => getPredictionDetail(date, stockCode.value, modelName))
    )
    
    predictionHistory.value = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error('获取预测历史失败:', error)
    predictionHistory.value = []
  } finally {
    historyLoading.value = false
  }
}

const handleRangeChange = (range) => {
  timeRange.value = range
  fetchKlineData()
}

// 处理预测开关
const handlePredictToggle = async (enabled, date) => {
  if (enabled) {
    selectedPredictDate.value = date || defaultPredictDate.value
    await fetchKLinePrediction(selectedPredictDate.value)
  } else {
    predictionKlineData.value = []
    predictionInfo.value = null
  }
}

// 处理预测日期变化
const handlePredictDateChange = async (date) => {
  selectedPredictDate.value = date
  if (predictionKlineData.value.length > 0 || predictionInfo.value) {
    // 如果已经有预测数据，重新获取
    await fetchKLinePrediction(date)
  }
}

// 获取日K线预测数据
const fetchKLinePrediction = async (execDate = null) => {
  predictionLoading.value = true
  try {
    // 使用日K线预测接口，不传 model_name 使用后端默认模型
    const result = await getDailyKLinePrediction(stockCode.value, execDate, null)
    
    if (result && result.predictions) {
      // 转换预测数据格式（日K使用 date 而非 datetime）
      predictionKlineData.value = result.predictions.map(p => ({
        datetime: p.date || p.datetime,
        open: p.open,
        close: p.close,
        high: p.high,
        low: p.low,
        volume: p.volume || 0
      }))
      
      predictionInfo.value = {
        model_name: result.model_name,
        exec_date: result.exec_date,
        predict_start: result.predict_start,
        predict_end: result.predict_end,
        history_end: result.history_end
      }
    }
  } catch (error) {
    console.error('获取K线预测失败:', error)
    predictionKlineData.value = []
    predictionInfo.value = null
  } finally {
    predictionLoading.value = false
  }
}

watch(stockCode, () => {
  fetchStockInfo()
  fetchKlineData()
  fetchPredictionHistory()
})

// 监听模型变化，重新获取预测历史
watch(() => predictionStore.currentModel, () => {
  fetchPredictionHistory()
})

onMounted(() => {
  fetchStockInfo()
  fetchKlineData()
  fetchPredictionHistory()
})
</script>

<style lang="scss" scoped>
.stock-detail-page {
  min-height: calc(100vh - 72px);
  padding-top: 72px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 60px;
}

.back-nav {
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text-primary);
    border-color: var(--glass-border-hover);
    transform: translateX(-4px);
  }
}

.stock-info-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 32px 40px;
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease backwards;
  animation-delay: 0.1s;
  overflow: hidden;
  flex-wrap: wrap;
  
  .card-glow {
    position: absolute;
    top: 0;
    right: 0;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(129, 140, 248, 0.1), transparent 70%);
    pointer-events: none;
  }
}

.stock-main-info {
  .stock-badge {
    display: inline-block;
    padding: 6px 14px;
    background: rgba(var(--primary-rgb), 0.15);
    border: 1px solid rgba(var(--primary-rgb), 0.3);
    border-radius: 8px;
    margin-bottom: 12px;
    
    .stock-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
    }
  }
  
  .stock-name {
    font-size: 36px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -1px;
  }
}

.stock-price-section {
  text-align: center;
  padding: 0 40px;
  border-left: 1px solid var(--glass-border);
  border-right: 1px solid var(--glass-border);
  
  .price-main {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 4px;
    
    .currency {
      font-size: 20px;
      color: var(--text-muted);
    }
    
    .price-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 40px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -1px;
    }
  }
  
  .price-change {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 6px 14px;
    border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    
    &.up {
      background: rgba(220, 38, 38, 0.12);
      color: var(--up-color);
      
      .change-icon {
        background: var(--up-color);
      }
      
      .dark & {
        background: rgba(248, 113, 113, 0.15);
      }
    }
    
    &.down {
      background: rgba(22, 163, 74, 0.12);
      color: var(--down-color);
      
      .change-icon {
        background: var(--down-color);
      }
      
      .dark & {
        background: rgba(74, 222, 128, 0.15);
      }
    }
    
    .change-icon {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 12px;
    }
  }
}

.stock-meta-grid {
  display: flex;
  gap: 28px;
  margin-left: auto;
  flex-wrap: wrap;
}

.meta-item {
  text-align: center;
  
  .meta-label {
    display: block;
    font-size: 12px;
    color: var(--text-muted);
    margin-bottom: 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .meta-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    
    &.up {
      color: var(--up-color);
    }
    
    &.down {
      color: var(--down-color);
    }
  }
}

.kline-section {
  padding: 0;
  overflow: hidden;
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease backwards;
  animation-delay: 0.2s;
}

.prediction-history-card {
  padding: 0;
  overflow: hidden;
  animation: fadeIn 0.5s ease backwards;
  animation-delay: 0.3s;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--glass-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  
  .title-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.3);
  }
}

.history-count {
  font-size: 13px;
  color: var(--text-muted);
}

.score-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .score-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    box-shadow: 0 0 12px currentColor;
  }
  
  .score-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
  }
}

.date-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
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
}

.return-pending {
  color: var(--text-muted);
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
