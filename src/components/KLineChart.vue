<template>
  <div class="kline-chart-container">
    <div class="chart-toolbar">
      <div class="toolbar-left">
        <div class="chart-type-switch">
          <button 
            class="type-btn" 
            :class="{ active: chartType === 'daily' }"
            @click="handleTypeChange('daily')"
          >
            <el-icon><Calendar /></el-icon>
            日K线
          </button>
          <button 
            class="type-btn"
            :class="{ active: chartType === '5min' }"
            @click="handleTypeChange('5min')"
          >
            <el-icon><Timer /></el-icon>
            5分钟
          </button>
        </div>
        
        <!-- 预测开关 (仅5分钟K线可用) -->
        <div v-if="chartType === '5min'" class="predict-toggle">
          <el-switch
            v-model="showPrediction"
            :loading="predictionLoading"
            active-text="预测"
            @change="handlePredictToggle"
          />
          <el-tooltip v-if="predictionInfo" effect="dark" placement="top">
            <template #content>
              <div style="text-align: center;">
                <div>模型: {{ predictionInfo.model_name }}</div>
                <div>预测日期: {{ predictionInfo.target_date }}</div>
              </div>
            </template>
            <el-icon class="info-icon"><InfoFilled /></el-icon>
          </el-tooltip>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="range-selector">
          <span class="range-label">时间范围</span>
          <el-select 
            v-model="timeRange" 
            size="small" 
            style="width: 120px"
            @change="handleRangeChange"
          >
            <el-option label="近7天" :value="7" />
            <el-option label="近30天" :value="30" />
            <el-option label="近60天" :value="60" />
            <el-option label="近120天" :value="120" />
          </el-select>
        </div>
      </div>
    </div>
    
    <div 
      ref="chartRef" 
      class="chart-wrapper"
      v-loading="loading || predictionLoading"
    ></div>
    
    <div class="chart-footer">
      <div class="chart-hint">
        <el-icon><Mouse /></el-icon>
        拖动查看更多 · 滚轮缩放
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Calendar, Timer, Mouse, InfoFilled } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  predictionData: {
    type: Array,
    default: () => []
  },
  predictionInfo: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  predictionLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['typeChange', 'rangeChange', 'predictToggle'])

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

const chartRef = ref(null)
const chartType = ref('daily')
const timeRange = ref(60)
const showPrediction = ref(false)
let chartInstance = null

// 根据主题获取颜色配置
const getThemeColors = () => {
  return {
    textColor: isDark.value ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    borderColor: isDark.value ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    gridColor: isDark.value ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
    tooltipBg: isDark.value ? 'rgba(15, 15, 25, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDark.value ? 'rgba(129, 140, 248, 0.3)' : 'rgba(99, 102, 241, 0.3)',
    tooltipText: isDark.value ? '#f8fafc' : '#0f172a',
    upColor: isDark.value ? '#f87171' : '#dc2626',
    downColor: isDark.value ? '#4ade80' : '#16a34a',
    crossColor: isDark.value ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
    sliderBg: isDark.value ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    sliderFill: isDark.value ? 'rgba(129, 140, 248, 0.2)' : 'rgba(99, 102, 241, 0.2)'
  }
}

/**
 * 计算涨跌幅
 * @param {number} index - 当前K线索引
 * @param {object} currentData - 当前K线数据
 * @returns {number} 涨跌幅百分比
 */
const calculateChangePercent = (index, currentData) => {
  // 优先使用 pre_close（昨日收盘价），如果API提供的话
  if (currentData.pre_close !== undefined && currentData.pre_close !== null) {
    return ((currentData.close - currentData.pre_close) / currentData.pre_close * 100)
  }
  
  // 否则使用前一条K线的收盘价
  if (index > 0 && props.data[index - 1]) {
    const prevClose = props.data[index - 1].close
    return ((currentData.close - prevClose) / prevClose * 100)
  }
  
  // 如果是第一条数据，使用开盘价计算
  return ((currentData.close - currentData.open) / currentData.open * 100)
}

/**
 * 判断K线是涨还是跌
 * @param {number} index - 当前K线索引
 * @param {object} currentData - 当前K线数据
 * @returns {boolean} true表示涨，false表示跌
 */
const isKlineUp = (index, currentData) => {
  // 优先使用 pre_close 判断
  if (currentData.pre_close !== undefined && currentData.pre_close !== null) {
    return currentData.close >= currentData.pre_close
  }
  
  // 否则使用前一条K线的收盘价判断
  if (index > 0 && props.data[index - 1]) {
    return currentData.close >= props.data[index - 1].close
  }
  
  // 如果是第一条数据，使用开盘价判断
  return currentData.close >= currentData.open
}

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value, null, {
    renderer: 'canvas'
  })
  
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

const updateChart = () => {
  if (!chartInstance || !props.data.length) return
  
  const colors = getThemeColors()
  
  // 合并历史数据和预测数据
  const allData = [...props.data]
  const historyLength = props.data.length
  
  // 如果有预测数据且开启了显示
  if (showPrediction.value && props.predictionData.length) {
    allData.push(...props.predictionData)
  }
  
  const dates = allData.map(d => d.datetime)
  
  // 判断预测K线涨跌（使用开盘价和收盘价比较）
  const isPredictionUp = (data) => data.close >= data.open
  
  // 科技感霓虹红绿配色
  const neonColors = {
    upColor: 'rgba(255, 107, 129, 0.9)',      // 霓虹粉红
    upBorder: 'rgba(255, 107, 129, 1)',
    upGlow: 'rgba(255, 107, 129, 0.5)',
    downColor: 'rgba(46, 213, 115, 0.9)',     // 霓虹青绿
    downBorder: 'rgba(46, 213, 115, 1)',
    downGlow: 'rgba(46, 213, 115, 0.5)'
  }
  
  const klineData = allData.map((d, i) => {
    const isPrediction = i >= historyLength
    const isUp = isPrediction ? isPredictionUp(d) : isKlineUp(i, d)
    
    if (isPrediction) {
      // 预测K线：使用科技感霓虹红绿配色
      return {
        value: [d.open, d.close, d.low, d.high],
        itemStyle: {
          color: isUp ? neonColors.upColor : neonColors.downColor,
          color0: isUp ? neonColors.upColor : neonColors.downColor,
          borderColor: isUp ? neonColors.upBorder : neonColors.downBorder,
          borderColor0: isUp ? neonColors.upBorder : neonColors.downBorder,
          borderWidth: 1.5,
          opacity: 0.95,
          shadowBlur: 8,
          shadowColor: isUp ? neonColors.upGlow : neonColors.downGlow
        }
      }
    }
    
    return {
      value: [d.open, d.close, d.low, d.high],
      itemStyle: null
    }
  })
  
  const volumeData = allData.map((d, i) => {
    const isPrediction = i >= historyLength
    const isUp = isPrediction ? isPredictionUp(d) : isKlineUp(i, d)
    
    if (isPrediction) {
      // 预测成交量：科技感霓虹红绿渐变
      return {
        value: d.volume,
        itemStyle: {
          color: isUp
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 107, 129, 0.7)' },
                { offset: 1, color: 'rgba(255, 107, 129, 0.15)' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(46, 213, 115, 0.7)' },
                { offset: 1, color: 'rgba(46, 213, 115, 0.15)' }
              ])
        }
      }
    }
    
    return {
      value: d.volume,
      itemStyle: {
        color: isUp
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: isDark.value ? 'rgba(248, 113, 113, 0.8)' : 'rgba(220, 38, 38, 0.8)' },
              { offset: 1, color: isDark.value ? 'rgba(248, 113, 113, 0.2)' : 'rgba(220, 38, 38, 0.2)' }
            ])
          : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: isDark.value ? 'rgba(74, 222, 128, 0.8)' : 'rgba(22, 163, 74, 0.8)' },
              { offset: 1, color: isDark.value ? 'rgba(74, 222, 128, 0.2)' : 'rgba(22, 163, 74, 0.2)' }
            ])
      }
    }
  })
  
  const option = {
    animation: true,
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: colors.crossColor },
        lineStyle: { color: 'rgba(99, 102, 241, 0.5)' }
      },
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      padding: [16, 20],
      textStyle: { color: colors.tooltipText, fontSize: 13 },
      extraCssText: 'backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.15);',
      formatter: function (params) {
        const index = params[0].dataIndex
        const isPrediction = index >= historyLength
        const data = allData[index]
        if (!data) return ''
        
        // 预测数据使用开盘价计算涨跌幅
        let changePercent
        let preCloseDisplay = '-'
        
        if (isPrediction) {
          // 预测数据：使用开盘价和收盘价计算
          changePercent = ((data.close - data.open) / data.open * 100)
        } else {
          // 历史数据：使用正确的涨跌幅计算
          changePercent = calculateChangePercent(index, data)
          if (data.pre_close !== undefined && data.pre_close !== null) {
            preCloseDisplay = `¥${data.pre_close.toFixed(2)}`
          } else if (index > 0 && allData[index - 1]) {
            preCloseDisplay = `¥${allData[index - 1].close.toFixed(2)}`
          }
        }
        
        const isUp = changePercent >= 0
        const changeColor = isUp ? colors.upColor : colors.downColor
        
        // 预测标签
        const predictionBadge = isPrediction 
          ? `<span style="display: inline-block; padding: 2px 8px; background: rgba(255, 107, 129, 0.15); border-radius: 4px; font-size: 10px; font-weight: 600; color: #ff6b81; margin-left: 8px; border: 1px solid rgba(255, 107, 129, 0.3); text-shadow: 0 0 8px rgba(255, 107, 129, 0.5);">PREDICT</span>` 
          : ''
        
        return `
          <div style="min-width: 200px;">
            <div style="font-weight: 600; margin-bottom: 12px; opacity: 0.6; font-size: 12px; display: flex; align-items: center;">${data.datetime}${predictionBadge}</div>
            <div style="display: grid; gap: 8px;">
              ${!isPrediction ? `<div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">昨收</span>
                <span style="font-weight: 500; font-family: 'JetBrains Mono', monospace; opacity: 0.7;">${preCloseDisplay}</span>
              </div>` : ''}
              <div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">开盘</span>
                <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">¥${data.open.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">收盘</span>
                <span style="font-weight: 600; font-family: 'JetBrains Mono', monospace;">¥${data.close.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">最高</span>
                <span style="font-weight: 600; color: ${colors.upColor}; font-family: 'JetBrains Mono', monospace;">¥${data.high.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">最低</span>
                <span style="font-weight: 600; color: ${colors.downColor}; font-family: 'JetBrains Mono', monospace;">¥${data.low.toFixed(2)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid ${colors.borderColor};">
                <span style="opacity: 0.6;">涨跌幅</span>
                <span style="font-weight: 600; color: ${changeColor}; font-family: 'JetBrains Mono', monospace;">${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="opacity: 0.6;">成交量</span>
                <span style="font-weight: 500; font-family: 'JetBrains Mono', monospace;">${formatVolume(data.volume)}</span>
              </div>
            </div>
          </div>
        `
      }
    },
    axisPointer: {
      link: [{ xAxisIndex: 'all' }]
    },
    grid: [
      { left: '8%', right: '4%', top: '6%', height: '58%' },
      { left: '8%', right: '4%', top: '72%', height: '18%' }
    ],
    xAxis: [
      {
        type: 'category',
        data: dates,
        gridIndex: 0,
        axisLine: { lineStyle: { color: colors.borderColor } },
        axisLabel: { color: colors.textColor, fontSize: 11 },
        splitLine: { show: false },
        axisTick: { show: false },
        boundaryGap: true,
        axisPointer: { label: { show: false } }
      },
      {
        type: 'category',
        data: dates,
        gridIndex: 1,
        axisLine: { lineStyle: { color: colors.borderColor } },
        axisLabel: { show: false },
        splitLine: { show: false },
        axisTick: { show: false },
        boundaryGap: true
      }
    ],
    yAxis: [
      {
        type: 'value',
        scale: true,
        gridIndex: 0,
        axisLine: { show: false },
        axisLabel: { 
          color: colors.textColor, 
          fontSize: 11,
          formatter: (val) => '¥' + val.toFixed(0)
        },
        splitLine: { lineStyle: { color: colors.gridColor } }
      },
      {
        type: 'value',
        scale: true,
        gridIndex: 1,
        axisLine: { show: false },
        axisLabel: { 
          color: colors.textColor, 
          fontSize: 11,
          formatter: (val) => formatVolume(val)
        },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 60,
        end: 100
      },
      {
        type: 'slider',
        xAxisIndex: [0, 1],
        start: 60,
        end: 100,
        height: 24,
        bottom: 8,
        borderColor: 'transparent',
        backgroundColor: colors.sliderBg,
        fillerColor: colors.sliderFill,
        handleStyle: {
          color: '#6366f1',
          borderColor: '#6366f1'
        },
        moveHandleStyle: {
          color: 'rgba(99, 102, 241, 0.4)'
        },
        textStyle: { color: colors.textColor },
        brushStyle: { color: 'rgba(99, 102, 241, 0.1)' }
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: klineData,
        xAxisIndex: 0,
        yAxisIndex: 0,
        itemStyle: {
          color: colors.upColor,
          color0: colors.downColor,
          borderColor: colors.upColor,
          borderColor0: colors.downColor,
          borderWidth: 1
        }
      },
      {
        name: '成交量',
        type: 'bar',
        data: volumeData,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: '60%'
      }
    ]
  }
  
  // 如果有预测数据，添加分割线和背景区域
  if (showPrediction.value && props.predictionData.length && historyLength > 0) {
    // 添加预测区域背景（紫色系）
    option.series.push({
      name: '预测区域',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      markArea: {
        silent: true,
        itemStyle: {
          color: isDark.value 
            ? 'rgba(139, 92, 246, 0.06)' 
            : 'rgba(139, 92, 246, 0.04)'
        },
        data: [[
          { xAxis: historyLength },
          { xAxis: allData.length - 1 }
        ]]
      },
      markLine: {
        silent: true,
        symbol: 'none',
        animation: false,
        lineStyle: {
          color: 'rgba(139, 92, 246, 0.6)',
          type: 'dashed',
          width: 1.5
        },
        label: {
          show: true,
          formatter: 'Predict',
          position: 'end',
          color: '#a78bfa',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'JetBrains Mono, monospace',
          backgroundColor: 'transparent',
          padding: [0, 4],
          distance: 8
        },
        data: [
          { xAxis: historyLength - 0.5 }
        ]
      },
      data: []
    })
  }
  
  chartInstance.setOption(option, true)
}

const formatVolume = (vol) => {
  if (vol >= 100000000) {
    return (vol / 100000000).toFixed(2) + '亿'
  } else if (vol >= 10000) {
    return (vol / 10000).toFixed(2) + '万'
  }
  return vol.toString()
}

const handleResize = () => {
  chartInstance?.resize()
}

const handleTypeChange = (type) => {
  chartType.value = type
  if (type === 'daily') {
    showPrediction.value = false
  }
  emit('typeChange', type)
}

const handleRangeChange = (range) => {
  emit('rangeChange', range)
}

const handlePredictToggle = (val) => {
  emit('predictToggle', val)
}

// 监听数据变化
watch(() => props.data, () => {
  nextTick(() => updateChart())
}, { deep: true })

// 监听预测数据变化
watch(() => props.predictionData, () => {
  nextTick(() => updateChart())
}, { deep: true })

// 监听预测开关变化
watch(showPrediction, () => {
  nextTick(() => updateChart())
})

// 监听主题变化
watch(isDark, () => {
  nextTick(() => updateChart())
})

onMounted(() => {
  nextTick(() => initChart())
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})

defineExpose({
  refresh: updateChart
})
</script>

<style lang="scss" scoped>
.kline-chart-container {
  background: var(--card-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.chart-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--glass-border);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.chart-type-switch {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--glass-bg);
  border-radius: 12px;
  border: 1px solid var(--glass-border);
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text-secondary);
    background: var(--hover-bg);
  }
  
  &.active {
    color: #fff;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.35);
  }
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.range-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.range-label {
  font-size: 13px;
  color: var(--text-muted);
}

.chart-wrapper {
  width: 100%;
  height: 480px;
  background: var(--chart-bg);
  transition: background 0.3s ease;
}

.chart-footer {
  display: flex;
  justify-content: center;
  padding: 12px;
  border-top: 1px solid var(--glass-border);
}

.chart-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
}

.predict-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 16px;
  margin-left: 16px;
  border-left: 1px solid var(--glass-border);
  
  .info-icon {
    color: var(--text-muted);
    cursor: help;
    transition: color 0.2s;
    
    &:hover {
      color: var(--primary-color);
    }
  }
  
  :deep(.el-switch) {
    --el-switch-on-color: #8b5cf6;
  }
  
  :deep(.el-switch__label) {
    color: var(--text-muted);
    font-size: 12px;
    
    &.is-active {
      color: #8b5cf6;
    }
  }
}

</style>
