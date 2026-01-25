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

      <!-- 蒙特卡洛预测分析 -->
      <div class="monte-carlo-card glass-card" v-loading="monteCarloLoading">
        <div class="section-header">
          <h2 class="section-title">
            <div class="title-icon mc-icon">
              <el-icon><DataLine /></el-icon>
            </div>
            概率预测分析
          </h2>
          <div class="mc-actions">
            <div class="mc-meta" v-if="monteCarloData">
              <span class="mc-date">{{ monteCarloData.predict_date }}</span>
              <span class="mc-samples">{{ monteCarloData.samples }} 次模拟</span>
            </div>
            <button 
              class="mc-run-btn"
              :class="{ loading: monteCarloLoading }"
              @click="fetchMonteCarlo"
              :disabled="monteCarloLoading"
            >
              <el-icon v-if="!monteCarloLoading"><Cpu /></el-icon>
              <el-icon v-else class="spin"><Loading /></el-icon>
              <span>{{ monteCarloData ? '重新模拟' : '运行模拟' }}</span>
            </button>
          </div>
        </div>
        
        <div class="mc-content" v-if="monteCarloData">
          <!-- 概率仪表盘 -->
          <div class="mc-gauge-section">
            <div class="gauge-container">
              <div class="gauge-ring" :style="gaugeStyle">
                <div class="gauge-center">
                  <span class="gauge-value" :class="monteCarloData.metrics.up_probability_pct >= 50 ? 'up' : 'down'">
                    {{ monteCarloData.metrics.up_probability_pct.toFixed(1) }}%
                  </span>
                  <span class="gauge-label">上涨概率</span>
                </div>
              </div>
            </div>
            <div class="probability-bars">
              <div class="prob-item up">
                <div class="prob-label">
                  <el-icon><Top /></el-icon>
                  <span>上涨</span>
                </div>
                <div class="prob-bar">
                  <div class="prob-fill" :style="{ width: monteCarloData.metrics.up_probability_pct + '%' }"></div>
                </div>
                <span class="prob-value">{{ monteCarloData.metrics.up_probability_pct.toFixed(1) }}%</span>
              </div>
              <div class="prob-item down">
                <div class="prob-label">
                  <el-icon><Bottom /></el-icon>
                  <span>下跌</span>
                </div>
                <div class="prob-bar">
                  <div class="prob-fill" :style="{ width: monteCarloData.metrics.down_probability_pct + '%' }"></div>
                </div>
                <span class="prob-value">{{ monteCarloData.metrics.down_probability_pct.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
          
          <!-- 关键指标 -->
          <div class="mc-metrics">
            <div class="metric-card">
              <div class="metric-icon return">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="metric-info">
                <span class="metric-label">预期收益</span>
                <span 
                  class="metric-value" 
                  :class="monteCarloData.metrics.expected_return_pct >= 0 ? 'up' : 'down'"
                >
                  {{ monteCarloData.metrics.expected_return_pct >= 0 ? '+' : '' }}{{ monteCarloData.metrics.expected_return_pct.toFixed(2) }}%
                </span>
              </div>
            </div>
            
            <div class="metric-card">
              <div class="metric-icon sharpe">
                <el-icon><Histogram /></el-icon>
              </div>
              <div class="metric-info">
                <span class="metric-label">夏普比率</span>
                <span 
                  class="metric-value"
                  :class="monteCarloData.metrics.sharpe_ratio >= 0 ? 'positive' : 'negative'"
                >
                  {{ monteCarloData.metrics.sharpe_ratio.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 价格分布 -->
          <div class="mc-distribution">
            <div class="distribution-header">
              <span class="dist-title">价格分布预测</span>
              <span class="current-price">当前: ¥{{ monteCarloData.current_close.toFixed(2) }}</span>
            </div>
            <div class="distribution-visual">
              <div class="dist-labels">
                <span class="dist-label p5">5%分位</span>
                <span class="dist-label mean">均值</span>
                <span class="dist-label p95">95%分位</span>
              </div>
              <div class="dist-bar-container">
                <div class="dist-bar-bg"></div>
                <div class="dist-bar-fill"></div>
                <div class="dist-marker p5"></div>
                <div class="dist-marker mean"></div>
                <div class="dist-marker p95"></div>
              </div>
              <div class="dist-values">
                <span class="dist-value p5">¥{{ monteCarloData.price_distribution.percentile_5.toFixed(2) }}</span>
                <span class="dist-value mean">¥{{ monteCarloData.price_distribution.mean.toFixed(2) }}</span>
                <span class="dist-value p95">¥{{ monteCarloData.price_distribution.percentile_95.toFixed(2) }}</span>
              </div>
            </div>
            <div class="distribution-stats">
              <div class="stat-item">
                <span class="stat-label">标准差</span>
                <span class="stat-value">±¥{{ monteCarloData.price_distribution.std.toFixed(2) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">90%置信区间</span>
                <span class="stat-value">
                  ¥{{ monteCarloData.price_distribution.percentile_5.toFixed(2) }} ~ ¥{{ monteCarloData.price_distribution.percentile_95.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="mc-placeholder" v-if="!monteCarloLoading && !monteCarloData">
          <div class="placeholder-icon">
            <el-icon><Cpu /></el-icon>
          </div>
          <p class="placeholder-text">点击右上角"运行模拟"按钮，进行蒙特卡洛概率分析</p>
          <p class="placeholder-hint">基于 1000 次随机模拟，预测明日价格走势概率</p>
        </div>
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
import { ArrowLeft, Top, Bottom, Clock, DataLine, TrendCharts, Histogram, Cpu, Loading } from '@element-plus/icons-vue'
import { getStockInfo, getDailyKLine, getPredictionDetail, getDailyKLinePrediction, getMonteCarloSimulation } from '@/api'
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

// 蒙特卡洛预测相关
const monteCarloData = ref(null)
const monteCarloLoading = ref(false)

// 默认预测日期（上一个工作日）
const defaultPredictDate = computed(() => {
  let date = dayjs()
  const dayOfWeek = date.day() // 0=周日, 1=周一, ..., 6=周六
  
  // 如果是周日，回退到周五
  if (dayOfWeek === 0) {
    date = date.subtract(2, 'day')
  }
  // 如果是周六，回退到周五  
  else if (dayOfWeek === 6) {
    date = date.subtract(1, 'day')
  }
  // 如果是周一，回退到上周五
  else if (dayOfWeek === 1) {
    date = date.subtract(3, 'day')
  }
  // 其他工作日（周二到周五），回退到昨天
  else {
    date = date.subtract(1, 'day')
  }
  
  return date.format('YYYY-MM-DD')
})

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

// 蒙特卡洛仪表盘样式
const gaugeStyle = computed(() => {
  if (!monteCarloData.value) return {}
  const upProb = monteCarloData.value.metrics.up_probability_pct
  // 使用 conic-gradient 创建环形进度条
  const upColor = upProb >= 50 ? 'var(--up-color)' : 'rgba(var(--up-rgb, 220, 38, 38), 0.3)'
  const downColor = upProb < 50 ? 'var(--down-color)' : 'rgba(var(--down-rgb, 22, 163, 74), 0.3)'
  return {
    background: `conic-gradient(${upColor} 0deg ${upProb * 3.6}deg, ${downColor} ${upProb * 3.6}deg 360deg)`
  }
})

// 获取蒙特卡洛预测
const fetchMonteCarlo = async () => {
  monteCarloLoading.value = true
  try {
    const result = await getMonteCarloSimulation(stockCode.value)
    monteCarloData.value = result
  } catch (error) {
    console.error('获取蒙特卡洛预测失败:', error)
    monteCarloData.value = null
  } finally {
    monteCarloLoading.value = false
  }
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
  // 切换股票时重置蒙特卡洛数据
  monteCarloData.value = null
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

// 蒙特卡洛预测卡片
.monte-carlo-card {
  padding: 0;
  overflow: hidden;
  margin-bottom: 24px;
  animation: fadeIn 0.5s ease backwards;
  animation-delay: 0.25s;
  
  .mc-icon {
    background: linear-gradient(135deg, #8b5cf6, #06b6d4) !important;
  }
  
  .mc-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .mc-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .mc-date {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--primary-color);
      background: rgba(var(--primary-rgb), 0.1);
      padding: 4px 10px;
      border-radius: 6px;
    }
    
    .mc-samples {
      font-size: 12px;
      color: var(--text-muted);
    }
  }
  
  .mc-run-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .spin {
      animation: spin 1s linear infinite;
    }
  }
  
  .mc-placeholder {
    padding: 60px 40px;
    text-align: center;
    
    .placeholder-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 20px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #8b5cf6;
    }
    
    .placeholder-text {
      font-size: 15px;
      color: var(--text-secondary);
      margin: 0 0 8px;
    }
    
    .placeholder-hint {
      font-size: 13px;
      color: var(--text-muted);
      margin: 0;
    }
  }
}

.mc-content {
  padding: 24px 28px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.mc-gauge-section {
  display: flex;
  align-items: center;
  gap: 24px;
  
  .gauge-container {
    flex-shrink: 0;
  }
  
  .gauge-ring {
    width: 120px;
    height: 120px;
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
      font-size: 22px;
      font-weight: 700;
      
      &.up { color: var(--up-color); }
      &.down { color: var(--down-color); }
    }
    
    .gauge-label {
      font-size: 11px;
      color: var(--text-muted);
    }
  }
  
  .probability-bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .prob-item {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .prob-label {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 60px;
      font-size: 13px;
      font-weight: 500;
    }
    
    &.up .prob-label { color: var(--up-color); }
    &.down .prob-label { color: var(--down-color); }
    
    .prob-bar {
      flex: 1;
      height: 8px;
      background: var(--hover-bg);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .prob-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    
    &.up .prob-fill { background: var(--up-color); }
    &.down .prob-fill { background: var(--down-color); }
    
    .prob-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      width: 50px;
      text-align: right;
      color: var(--text-secondary);
    }
  }
}

.mc-metrics {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .metric-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--hover-bg);
    border-radius: 12px;
    border: 1px solid var(--glass-border);
  }
  
  .metric-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    
    &.return {
      background: linear-gradient(135deg, rgba(248, 113, 113, 0.15), rgba(251, 191, 36, 0.15));
      color: #f87171;
    }
    
    &.sharpe {
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.15), rgba(6, 182, 212, 0.15));
      color: #818cf8;
    }
  }
  
  .metric-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .metric-label {
    font-size: 12px;
    color: var(--text-muted);
  }
  
  .metric-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 20px;
    font-weight: 700;
    
    &.up { color: var(--up-color); }
    &.down { color: var(--down-color); }
    &.positive { color: #818cf8; }
    &.negative { color: #f87171; }
  }
}

.mc-distribution {
  grid-column: 1 / -1;
  padding: 20px 24px;
  background: var(--hover-bg);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  
  .distribution-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .dist-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .current-price {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      color: var(--text-muted);
    }
  }
  
  .distribution-visual {
    margin-bottom: 20px;
  }
  
  .dist-labels {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    
    .dist-label {
      font-size: 11px;
      color: var(--text-muted);
      
      &.p5 { color: var(--down-color); }
      &.mean { color: var(--primary-color); }
      &.p95 { color: var(--up-color); }
    }
  }
  
  .dist-bar-container {
    position: relative;
    height: 12px;
    margin-bottom: 8px;
  }
  
  .dist-bar-bg {
    position: absolute;
    inset: 0;
    background: var(--border-color);
    border-radius: 6px;
  }
  
  .dist-bar-fill {
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 100%;
    background: linear-gradient(90deg, var(--down-color), var(--primary-color), var(--up-color));
    border-radius: 6px;
    opacity: 0.7;
  }
  
  .dist-marker {
    position: absolute;
    top: 50%;
    width: 4px;
    height: 20px;
    background: var(--card-bg);
    border: 2px solid;
    border-radius: 2px;
    transform: translate(-50%, -50%);
    
    &.p5 {
      left: 10%;
      border-color: var(--down-color);
    }
    
    &.mean {
      left: 50%;
      border-color: var(--primary-color);
    }
    
    &.p95 {
      left: 90%;
      border-color: var(--up-color);
    }
  }
  
  .dist-values {
    display: flex;
    justify-content: space-between;
    
    .dist-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      
      &.p5 { color: var(--down-color); }
      &.mean { color: var(--primary-color); }
      &.p95 { color: var(--up-color); }
    }
  }
  
  .distribution-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    padding-top: 16px;
    border-top: 1px solid var(--glass-border);
    
    .stat-item {
      text-align: center;
    }
    
    .stat-label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    
    .stat-value {
      font-family: 'JetBrains Mono', monospace;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-secondary);
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
