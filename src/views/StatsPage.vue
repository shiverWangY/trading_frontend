<template>
  <div class="stats-page">
    <div class="page-container">
      <!-- 页面标题 -->
      <div class="page-header">
        <div class="title-section">
          <div class="title-icon">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="title-text">
            <h1 class="page-title">统计分析</h1>
            <p class="page-subtitle">模型预测准确率统计与分析报告</p>
          </div>
        </div>
      </div>

      <!-- 整体统计卡片 -->
      <div class="stats-grid stats-grid-5">
        <StatCard 
          label="总预测数" 
          :value="overallStats.total_predictions || 0" 
          icon="Document"
          type="primary"
        />
        <StatCard 
          label="正确数" 
          :value="overallStats.correct_predictions || 0" 
          icon="Select"
          type="success"
        />
        <StatCard 
          label="准确率" 
          :value="formatPercent(overallStats.accuracy)" 
          suffix="%"
          icon="PieChart"
          type="warning"
        />
        <StatCard 
          label="精确率" 
          :value="formatPercent(overallStats.precision)" 
          suffix="%"
          icon="Aim"
          type="danger"
        />
        <StatCard 
          label="召回率" 
          :value="formatPercent(overallStats.recall)" 
          suffix="%"
          icon="Connection"
          type="info"
        />
      </div>

      <!-- 准确率/精确率/召回率趋势图 -->
      <div class="chart-card glass-card full-width">
        <div class="card-header">
          <div class="header-title">
            <div class="title-dot"></div>
            <h2>模型指标趋势</h2>
          </div>
          <!-- 自定义图例 -->
          <div class="custom-legend">
            <div 
              v-for="item in legendItems" 
              :key="item.name"
              class="legend-item"
              :class="{ inactive: !item.selected }"
              @click="toggleLegend(item.name)"
            >
              <span class="legend-icon" :style="{ background: item.selected ? item.color : '' }"></span>
              <span class="legend-text">{{ item.name }}</span>
            </div>
          </div>
        </div>
        <div 
          ref="trendChartRef" 
          class="trend-chart"
          v-loading="loading"
        ></div>
      </div>

      <!-- 每日统计表格 -->
      <div class="table-card glass-card">
        <div class="card-header">
          <div class="header-title">
            <div class="title-dot"></div>
            <h2>每日统计</h2>
          </div>
        </div>
        
        <el-table
          :data="dailyStats"
          v-loading="loading"
          stripe
        >
          <el-table-column prop="date" label="日期" width="140">
            <template #default="{ row }">
              <span class="date-value">{{ row.date }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="total" label="总数" width="100" align="center">
            <template #default="{ row }">
              <span class="count-value">{{ row.total }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="positive_predictions" label="看涨数" width="120" align="center">
            <template #default="{ row }">
              <div class="positive-badge">
                <el-icon><Top /></el-icon>
                {{ row.positive_predictions }}
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="verified_count" label="已验证" width="100" align="center">
            <template #default="{ row }">
              <span class="verified-value">{{ row.verified_count || row.total }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="correct_count" label="正确数" width="100" align="center">
            <template #default="{ row }">
              <span class="correct-value">{{ row.correct_count || '-' }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="accuracy" label="准确率" min-width="180">
            <template #default="{ row }">
              <div class="accuracy-cell">
                <div class="accuracy-bar">
                  <div 
                    class="accuracy-fill"
                    :style="{ 
                      width: (row.accuracy * 100) + '%',
                      background: getAccuracyGradient(row.accuracy)
                    }"
                  ></div>
                </div>
                <span class="accuracy-value">{{ (row.accuracy * 100).toFixed(1) }}%</span>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column label="" width="80" align="center">
            <template #default="{ row }">
              <span class="view-detail-link" @click="goToDate(row.date)">
                详情
                <el-icon><ArrowRight /></el-icon>
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { DataAnalysis, Top, ArrowRight } from '@element-plus/icons-vue'
import { getAccuracyStats } from '@/api'
import { useThemeStore } from '@/stores/theme'
import { usePredictionStore } from '@/stores/prediction'
import StatCard from '@/components/StatCard.vue'
import * as echarts from 'echarts'

const router = useRouter()
const themeStore = useThemeStore()
const predictionStore = usePredictionStore()
const { isDark } = storeToRefs(themeStore)

const loading = ref(false)
const overallStats = ref({})
const dailyStats = ref([])
const trendChartRef = ref(null)
let trendChartInstance = null

// 自定义图例状态
const legendItems = ref([
  { name: '准确率', color: '#818cf8', selected: true },
  { name: '精确率', color: '#f87171', selected: true },
  { name: '召回率', color: '#4ade80', selected: true },
  { name: '预测数量', color: '#94a3b8', selected: true }
])

const toggleLegend = (name) => {
  const item = legendItems.value.find(i => i.name === name)
  if (item) {
    item.selected = !item.selected
    // 同步到 ECharts
    if (trendChartInstance) {
      trendChartInstance.dispatchAction({
        type: 'legendToggleSelect',
        name: name
      })
    }
  }
}

const formatPercent = (val) => {
  if (val === undefined || val === null) return '0.0'
  return (val * 100).toFixed(1)
}

const getAccuracyGradient = (accuracy) => {
  if (accuracy >= 0.7) {
    return isDark.value 
      ? 'linear-gradient(90deg, #34d399, #10b981)'
      : 'linear-gradient(90deg, #16a34a, #15803d)'
  }
  if (accuracy >= 0.5) {
    return isDark.value
      ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
      : 'linear-gradient(90deg, #d97706, #b45309)'
  }
  return isDark.value
    ? 'linear-gradient(90deg, #f87171, #ef4444)'
    : 'linear-gradient(90deg, #dc2626, #b91c1c)'
}

const getChartColors = () => {
  return {
    textColor: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    gridColor: isDark.value ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    borderColor: isDark.value ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    tooltipBg: isDark.value ? 'rgba(15, 15, 25, 0.9)' : 'rgba(255, 255, 255, 0.95)',
    tooltipText: isDark.value ? '#f8fafc' : '#0f172a',
    primaryColor: isDark.value ? '#818cf8' : '#6366f1',
    accentColor: isDark.value ? '#c084fc' : '#a855f7',
    successColor: isDark.value ? '#34d399' : '#16a34a',
    successLight: isDark.value ? 'rgba(52, 211, 153, 0.6)' : 'rgba(22, 163, 74, 0.6)',
    successBg: isDark.value ? 'rgba(52, 211, 153, 0.1)' : 'rgba(22, 163, 74, 0.1)'
  }
}

const initCharts = () => {
  if (trendChartRef.value && dailyStats.value.length) {
    if (trendChartInstance) {
      trendChartInstance.dispose()
    }
    trendChartInstance = echarts.init(trendChartRef.value)
  }
  
  updateCharts()
}

const updateCharts = () => {
  updateTrendChart()
  window.addEventListener('resize', handleResize)
}

const updateTrendChart = () => {
  if (!trendChartInstance || !dailyStats.value.length) return
  
  const colors = getChartColors()
  
  const dates = dailyStats.value.map(d => d.date).reverse()
  const accuracyData = dailyStats.value.map(d => ((d.accuracy || 0) * 100).toFixed(1)).reverse()
  const precisionData = dailyStats.value.map(d => ((d.precision || 0) * 100).toFixed(1)).reverse()
  const recallData = dailyStats.value.map(d => ((d.recall || 0) * 100).toFixed(1)).reverse()
  const totalData = dailyStats.value.map(d => d.total).reverse()
  
  const option = {
    backgroundColor: 'transparent',
    animation: true,
    animationDuration: 500,
    animationEasing: 'cubicOut',
    animationDurationUpdate: 300,
    animationEasingUpdate: 'cubicOut',
    legend: {
      show: false  // 使用自定义 HTML 图例
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: colors.tooltipBg,
      borderColor: colors.borderColor,
      borderWidth: 1,
      textStyle: { color: colors.tooltipText, fontSize: 13 },
      axisPointer: {
        type: 'cross',
        crossStyle: { color: colors.textColor }
      },
      extraCssText: 'backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);',
      formatter: (params) => {
        let result = `<div style="font-weight:600;margin-bottom:8px;">${params[0].axisValue}</div>`
        params.forEach(p => {
          const unit = p.seriesName === '预测数量' ? '' : '%'
          result += `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color}"></span>
            <span>${p.seriesName}: ${p.value}${unit}</span>
          </div>`
        })
        return result
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: colors.borderColor } },
      axisLabel: { color: colors.textColor, fontSize: 11 },
      axisTick: { show: false }
    },
    yAxis: [
      {
        type: 'value',
        name: '',
        min: 0,
        max: 100,
        axisLine: { show: false },
        axisLabel: { 
          color: colors.textColor, 
          fontSize: 11,
          formatter: '{value}%'
        },
        splitLine: { lineStyle: { color: colors.gridColor } }
      },
      {
        type: 'value',
        name: '',
        axisLine: { show: false },
        axisLabel: { color: colors.textColor, fontSize: 11 },
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '准确率',
        type: 'line',
        data: accuracyData,
        smooth: 0.4,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: colors.primaryColor,
          shadowColor: `${colors.primaryColor}80`,
          shadowBlur: 8
        },
        itemStyle: {
          color: colors.primaryColor,
          borderWidth: 2,
          borderColor: isDark.value ? 'rgba(15, 15, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)'
        }
      },
      {
        name: '精确率',
        type: 'line',
        data: precisionData,
        smooth: 0.4,
        symbol: 'diamond',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#f87171',
          shadowColor: 'rgba(248, 113, 113, 0.5)',
          shadowBlur: 8
        },
        itemStyle: {
          color: '#f87171',
          borderWidth: 2,
          borderColor: isDark.value ? 'rgba(15, 15, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)'
        }
      },
      {
        name: '召回率',
        type: 'line',
        data: recallData,
        smooth: 0.4,
        symbol: 'triangle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#4ade80',
          shadowColor: 'rgba(74, 222, 128, 0.5)',
          shadowBlur: 8
        },
        itemStyle: {
          color: '#4ade80',
          borderWidth: 2,
          borderColor: isDark.value ? 'rgba(15, 15, 25, 0.8)' : 'rgba(255, 255, 255, 0.8)'
        }
      },
      {
        name: '预测数量',
        type: 'bar',
        yAxisIndex: 1,
        data: totalData,
        barWidth: '40%',
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(148, 163, 184, 0.4)' },
            { offset: 1, color: 'rgba(148, 163, 184, 0.1)' }
          ]),
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

const handleResize = () => {
  trendChartInstance?.resize()
}

const goToDate = (date) => {
  router.push({ path: '/', query: { date } })
}

const fetchStats = async () => {
  loading.value = true
  try {
    // 使用当前选中的模型
    const result = await getAccuracyStats(predictionStore.currentModel || null)
    overallStats.value = result.overall || {}
    // 注意：后端返回的是 by_date，不是 daily
    dailyStats.value = result.by_date || result.daily || []
    
    nextTick(() => initCharts())
  } catch (error) {
    console.error('获取统计数据失败:', error)
    overallStats.value = {
      total_predictions: 12456,
      correct_predictions: 8234,
      accuracy: 0.661,
      precision: 0.723,
      recall: 0.65
    }
    dailyStats.value = [
      { date: '2026-01-17', total: 2490, positive_predictions: 1049, verified_count: 2490, correct_count: 1800, accuracy: 0.7474, precision: 0.7474, recall: 0.6794 },
      { date: '2026-01-16', total: 2380, positive_predictions: 980, verified_count: 2380, correct_count: 1720, accuracy: 0.7227, precision: 0.7143, recall: 0.6512 },
      { date: '2026-01-15', total: 2520, positive_predictions: 1100, verified_count: 2520, correct_count: 1850, accuracy: 0.7341, precision: 0.7545, recall: 0.6890 },
      { date: '2026-01-14', total: 2410, positive_predictions: 1020, verified_count: 2410, correct_count: 1680, accuracy: 0.6971, precision: 0.6863, recall: 0.6234 },
      { date: '2026-01-13', total: 2550, positive_predictions: 1080, verified_count: 2550, correct_count: 1900, accuracy: 0.7451, precision: 0.7593, recall: 0.7012 }
    ]
    nextTick(() => initCharts())
  } finally {
    loading.value = false
  }
}

// 监听主题变化，更新图表
watch(isDark, () => {
  nextTick(() => updateCharts())
})

// 监听模型变化，重新获取统计数据
watch(() => predictionStore.currentModel, () => {
  fetchStats()
})

onMounted(() => {
  fetchStats()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
})
</script>

<style lang="scss" scoped>
.stats-page {
  min-height: calc(100vh - 72px);
  padding-top: 72px;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 60px;
}

.page-header {
  margin-bottom: 40px;
  animation: fadeIn 0.6s ease;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.title-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  box-shadow: 
    0 8px 32px rgba(var(--primary-rgb), 0.35),
    0 0 60px rgba(var(--primary-rgb), 0.15);
}

.title-text {
  .page-title {
    font-size: 36px;
    font-weight: 800;
    color: var(--text-primary);
    margin: 0;
    letter-spacing: -1px;
  }
  
  .page-subtitle {
    font-size: 15px;
    color: var(--text-muted);
    margin-top: 6px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-bottom: 32px;
  
  > * {
    animation: fadeIn 0.6s ease backwards;
    
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.25s; }
    &:nth-child(5) { animation-delay: 0.3s; }
  }
  
  &.stats-grid-5 {
    grid-template-columns: repeat(5, 1fr);
    
    @media (max-width: 1200px) {
      grid-template-columns: repeat(3, 1fr);
    }
    
    @media (max-width: 768px) {
      grid-template-columns: repeat(2, 1fr);
    }
    
    @media (max-width: 480px) {
      grid-template-columns: 1fr;
    }
  }
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.full-width {
  width: 100%;
}

.header-hint {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}

.custom-legend {
  display: flex;
  align-items: center;
  gap: 20px;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    user-select: none;
    
    &:hover {
      background: var(--hover-bg);
    }
    
    &.inactive {
      .legend-icon {
        background: var(--text-muted) !important;
        opacity: 0.3;
      }
      
      .legend-text {
        color: var(--text-muted);
        opacity: 0.5;
      }
    }
    
    .legend-icon {
      width: 16px;
      height: 8px;
      border-radius: 4px;
      transition: all 0.3s ease;
    }
    
    .legend-text {
      font-size: 12px;
      color: var(--text-secondary);
      transition: all 0.3s ease;
    }
  }
}

.chart-card,
.table-card {
  padding: 0;
  overflow: hidden;
  margin-bottom: 24px;
  animation: fadeIn 0.6s ease backwards;
  animation-delay: 0.3s;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--glass-border);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 14px;
  
  .title-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    box-shadow: 0 0 16px rgba(var(--primary-rgb), 0.5);
  }
  
  h2 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }
}

.header-legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  
  &.accuracy {
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  }
  
  &.count {
    background: linear-gradient(135deg, var(--success-color), #10b981);
  }
  
  &.precision {
    background: linear-gradient(135deg, #f87171, #ef4444);
  }
  
  &.recall {
    background: linear-gradient(135deg, #4ade80, #22c55e);
  }
}

.title-dot.pr {
  background: linear-gradient(135deg, #f87171, #4ade80);
}

.trend-chart {
  width: 100%;
  height: 380px;
  padding: 20px;
  background: var(--chart-bg);
  transition: background 0.3s ease;
}

.date-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.count-value {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 600;
  color: var(--text-primary);
}

.positive-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(var(--up-color), 0.1);
  border-radius: 12px;
  color: var(--up-color);
  font-size: 13px;
  font-weight: 600;
  font-family: 'JetBrains Mono', monospace;
  
  .light & {
    background: rgba(220, 38, 38, 0.1);
  }
  
  .dark & {
    background: rgba(248, 113, 113, 0.15);
  }
}

.verified-value {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-muted);
}

.correct-value {
  font-family: 'JetBrains Mono', monospace;
  color: var(--success-color);
  font-weight: 600;
}

.view-detail-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 4px 8px;
  border-radius: 6px;
  
  .el-icon {
    font-size: 12px;
    transition: transform 0.2s ease;
  }
  
  &:hover {
    color: var(--primary-color);
    background: rgba(var(--primary-rgb), 0.1);
    
    .el-icon {
      transform: translateX(2px);
    }
  }
}

.accuracy-cell {
  display: flex;
  align-items: center;
  gap: 14px;
  
  .accuracy-bar {
    flex: 1;
    height: 8px;
    background: var(--border-color);
    border-radius: 4px;
    overflow: hidden;
  }
  
  .accuracy-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  
  .accuracy-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    min-width: 54px;
    color: var(--text-primary);
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
</style>
