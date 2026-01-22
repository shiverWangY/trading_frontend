<template>
  <div class="kline-chart-container">
    <div class="chart-toolbar">
      <div class="toolbar-left">
        <div class="chart-title">
          <el-icon><Calendar /></el-icon>
          <span>日K线</span>
        </div>
        
        <!-- 预测开关和日期选择 -->
        <div class="predict-toggle">
          <el-switch
            v-model="showPrediction"
            :loading="predictionLoading"
            active-text="预测"
            @change="handlePredictToggle"
          />
          <!-- 预测日期选择器 -->
          <el-date-picker
            v-if="showPrediction"
            v-model="predictDate"
            type="date"
            placeholder="预测日期"
            size="small"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 140px; margin-left: 12px;"
            :clearable="false"
            @change="handlePredictDateChange"
          />
          <el-tooltip v-if="predictionInfo" effect="dark" placement="top">
            <template #content>
              <div style="text-align: center;">
                <div>模型: {{ predictionInfo.model_name }}</div>
                <div>预测起始: {{ predictionInfo.predict_start }}</div>
                <div>预测结束: {{ predictionInfo.predict_end }}</div>
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
import { Calendar, Mouse, InfoFilled } from '@element-plus/icons-vue'
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
  },
  defaultPredictDate: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['rangeChange', 'predictToggle', 'predictDateChange'])

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)

const chartRef = ref(null)
const timeRange = ref(60)
const showPrediction = ref(false)
const predictDate = ref(props.defaultPredictDate || null)
let chartInstance = null
let currentHistoryLength = 0  // 存储当前历史数据长度
let currentAllDataLength = 0  // 存储当前总数据长度
let currentFirstPredictIndex = -1  // 存储预测区域起始索引

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
  
  // 监听 dataZoom 事件，更新预测区域的 graphic
  chartInstance.on('dataZoom', () => {
    updatePredictionGraphic()
  })
  
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

const updateChart = () => {
  if (!chartInstance || !props.data.length) return
  
  const colors = getThemeColors()
  
  // 判断预测K线涨跌（使用开盘价和收盘价比较）
  const isPredictionUp = (data) => data.close >= data.open
  
  // 预测K线专用配色（赛博霓虹风格）
  const predictColors = {
    up: 'rgba(255, 20, 147, 0.8)',         // 霓虹粉红
    upGlow: 'rgba(255, 20, 147, 0.45)',
    down: 'rgba(57, 255, 20, 0.8)',        // 霓虹绿
    downGlow: 'rgba(57, 255, 20, 0.45)'
  }
  
  // 构建历史数据的日期映射
  const historyMap = new Map()
  props.data.forEach((d, i) => {
    historyMap.set(d.datetime, { data: d, index: i })
  })
  
  // 构建预测数据的日期映射
  const predictionMap = new Map()
  if (showPrediction.value && props.predictionData.length) {
    props.predictionData.forEach(d => {
      predictionMap.set(d.datetime, d)
    })
  }
  
  // 构建完整的日期列表（合并历史和预测日期，去重并排序）
  const allDatesSet = new Set([...historyMap.keys()])
  if (showPrediction.value) {
    predictionMap.forEach((_, date) => allDatesSet.add(date))
  }
  const dates = Array.from(allDatesSet).sort()
  
  // 找到预测区域的起始位置（第一个预测日期的索引）
  let firstPredictIndex = -1
  if (showPrediction.value && props.predictionData.length) {
    const firstPredictDate = props.predictionData[0]?.datetime
    firstPredictIndex = dates.indexOf(firstPredictDate)
  }
  
  // 构建历史K线数据（按完整日期列表对齐）
  const historyKlineData = dates.map((date, i) => {
    const historyItem = historyMap.get(date)
    if (historyItem) {
      const d = historyItem.data
      const isUp = isKlineUp(historyItem.index, d)
      return {
        value: [d.open, d.close, d.low, d.high],
        itemStyle: null
      }
    }
    // 该日期没有历史数据，返回空
    return { value: '-', itemStyle: null }
  })
  
  // 构建预测K线数据（按完整日期列表对齐，稍微偏移显示）
  const predictionKlineData = dates.map((date) => {
    const predItem = predictionMap.get(date)
    if (predItem) {
      const isUp = isPredictionUp(predItem)
      const predColor = isUp ? predictColors.up : predictColors.down
      const predGlow = isUp ? predictColors.upGlow : predictColors.downGlow
      return {
        value: [predItem.open, predItem.close, predItem.low, predItem.high],
        itemStyle: {
          color: predColor,
          color0: predColor,
          borderColor: predColor,
          borderColor0: predColor,
          borderWidth: 1,
          opacity: 1,
          shadowBlur: 12,
          shadowColor: predGlow
        }
      }
    }
    // 该日期没有预测数据，返回空
    return { value: '-', itemStyle: null }
  })
  
  // 构建历史成交量数据
  const historyVolumeData = dates.map((date, i) => {
    const historyItem = historyMap.get(date)
    if (historyItem) {
      const d = historyItem.data
      const isUp = isKlineUp(historyItem.index, d)
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
    }
    return { value: '-', itemStyle: null }
  })
  
  // 构建预测成交量数据
  const predictionVolumeData = dates.map((date) => {
    const predItem = predictionMap.get(date)
    if (predItem) {
      const isUp = isPredictionUp(predItem)
      return {
        value: predItem.volume || 0,
        itemStyle: {
          color: isUp 
            ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(255, 20, 147, 0.65)' },
                { offset: 1, color: 'rgba(255, 20, 147, 0.15)' }
              ])
            : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(57, 255, 20, 0.65)' },
                { offset: 1, color: 'rgba(57, 255, 20, 0.15)' }
              ]),
          borderWidth: 0
        }
      }
    }
    return { value: '-', itemStyle: null }
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
        const index = params[0]?.dataIndex
        const date = dates[index]
        if (!date) return ''
        
        const historyItem = historyMap.get(date)
        const predItem = predictionMap.get(date)
        
        // 预测数据专用颜色
        const predUpColor = '#ff1493'
        const predDownColor = '#39ff14'
        
        // 计算历史数据
        let histData = null
        if (historyItem) {
          const d = historyItem.data
          let preClose = d.pre_close
          if (preClose === undefined || preClose === null) {
            if (historyItem.index > 0 && props.data[historyItem.index - 1]) {
              preClose = props.data[historyItem.index - 1].close
            }
          }
          const changePercent = calculateChangePercent(historyItem.index, d)
          const isUp = changePercent >= 0
          histData = {
            preClose,
            open: d.open,
            close: d.close,
            high: d.high,
            low: d.low,
            changePercent,
            isUp,
            volume: d.volume,
            openColor: preClose ? (d.open >= preClose ? colors.upColor : colors.downColor) : colors.tooltipText,
            closeColor: preClose ? (d.close >= preClose ? colors.upColor : colors.downColor) : colors.tooltipText
          }
        }
        
        // 计算预测数据
        let predData = null
        if (predItem) {
          let prevClose = null
          const prevDateIndex = index > 0 ? index - 1 : -1
          if (prevDateIndex >= 0) {
            const prevDate = dates[prevDateIndex]
            const prevHistoryItem = historyMap.get(prevDate)
            const prevPredItem = predictionMap.get(prevDate)
            if (prevHistoryItem) {
              prevClose = prevHistoryItem.data.close
            } else if (prevPredItem) {
              prevClose = prevPredItem.close
            }
          }
          let changePercent = 0
          let isUp = true
          if (prevClose) {
            changePercent = ((predItem.close - prevClose) / prevClose * 100)
            isUp = changePercent >= 0
          } else {
            changePercent = ((predItem.close - predItem.open) / predItem.open * 100)
            isUp = changePercent >= 0
          }
          predData = {
            preClose: prevClose,
            open: predItem.open,
            close: predItem.close,
            high: predItem.high,
            low: predItem.low,
            changePercent,
            isUp,
            volume: predItem.volume || 0,
            openColor: prevClose ? (predItem.open >= prevClose ? predUpColor : predDownColor) : predUpColor,
            closeColor: prevClose ? (predItem.close >= prevClose ? predUpColor : predDownColor) : (isUp ? predUpColor : predDownColor)
          }
        }
        
        // 只有历史数据
        if (histData && !predData) {
          return `
            <div style="min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 10px; font-size: 12px; opacity: 0.6;">${date}</div>
              <div style="display: grid; gap: 5px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">昨收</span><span style="font-family: 'JetBrains Mono', monospace; opacity: 0.7;">${histData.preClose ? '¥' + histData.preClose.toFixed(2) : '-'}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">开盘</span><span style="font-family: 'JetBrains Mono', monospace; color: ${histData.openColor};">¥${histData.open.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">收盘</span><span style="font-family: 'JetBrains Mono', monospace; color: ${histData.closeColor};">¥${histData.close.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">最高</span><span style="font-family: 'JetBrains Mono', monospace; color: ${colors.upColor};">¥${histData.high.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">最低</span><span style="font-family: 'JetBrains Mono', monospace; color: ${colors.downColor};">¥${histData.low.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">涨跌幅</span><span style="font-family: 'JetBrains Mono', monospace; color: ${histData.isUp ? colors.upColor : colors.downColor};">${histData.changePercent >= 0 ? '+' : ''}${histData.changePercent.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">成交量</span><span style="font-family: 'JetBrains Mono', monospace;">${formatVolume(histData.volume)}</span></div>
              </div>
            </div>
          `
        }
        
        // 只有预测数据
        if (!histData && predData) {
          return `
            <div style="min-width: 180px;">
              <div style="font-weight: 600; margin-bottom: 10px; font-size: 12px; opacity: 0.6;">${date} <span style="color: ${predUpColor}; font-size: 10px;">[预测]</span></div>
              <div style="display: grid; gap: 5px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">昨收</span><span style="font-family: 'JetBrains Mono', monospace; opacity: 0.7;">${predData.preClose ? '¥' + predData.preClose.toFixed(2) : '-'}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">开盘</span><span style="font-family: 'JetBrains Mono', monospace; color: ${predData.openColor};">¥${predData.open.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">收盘</span><span style="font-family: 'JetBrains Mono', monospace; color: ${predData.closeColor};">¥${predData.close.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">最高</span><span style="font-family: 'JetBrains Mono', monospace; color: ${predUpColor};">¥${predData.high.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">最低</span><span style="font-family: 'JetBrains Mono', monospace; color: ${predDownColor};">¥${predData.low.toFixed(2)}</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">涨跌幅</span><span style="font-family: 'JetBrains Mono', monospace; color: ${predData.isUp ? predUpColor : predDownColor};">${predData.changePercent >= 0 ? '+' : ''}${predData.changePercent.toFixed(2)}%</span></div>
                <div style="display: flex; justify-content: space-between;"><span style="opacity: 0.6;">成交量</span><span style="font-family: 'JetBrains Mono', monospace;">${formatVolume(predData.volume)}</span></div>
              </div>
            </div>
          `
        }
        
        // 两列对比表格（同时有历史和预测数据）
        const mono = "font-family: 'JetBrains Mono', monospace;"
        
        return `
          <div style="min-width: 280px;">
            <div style="font-weight: 600; margin-bottom: 10px; font-size: 12px; opacity: 0.6;">${date}</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr>
                  <th style="padding: 6px 8px; font-size: 10px; font-weight: 600; text-align: left; border-bottom: 1px solid ${colors.borderColor};"></th>
                  <th style="padding: 6px 8px; font-size: 10px; font-weight: 600; text-align: center; border-bottom: 1px solid ${colors.borderColor}; color: ${colors.upColor};">实际</th>
                  <th style="padding: 6px 8px; font-size: 10px; font-weight: 600; text-align: center; border-bottom: 1px solid ${colors.borderColor}; color: ${predUpColor};">预测</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">昨收</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; opacity: 0.7;">${histData.preClose ? '¥' + histData.preClose.toFixed(2) : '-'}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; opacity: 0.7;">${predData.preClose ? '¥' + predData.preClose.toFixed(2) : '-'}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">开盘</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${histData.openColor};">¥${histData.open.toFixed(2)}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${predData.openColor};">¥${predData.open.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">收盘</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${histData.closeColor};">¥${histData.close.toFixed(2)}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${predData.closeColor};">¥${predData.close.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">最高</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${colors.upColor};">¥${histData.high.toFixed(2)}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${predUpColor};">¥${predData.high.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">最低</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${colors.downColor};">¥${histData.low.toFixed(2)}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${predDownColor};">¥${predData.low.toFixed(2)}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">涨跌幅</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${histData.isUp ? colors.upColor : colors.downColor};">${histData.changePercent >= 0 ? '+' : ''}${histData.changePercent.toFixed(2)}%</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right; color: ${predData.isUp ? predUpColor : predDownColor};">${predData.changePercent >= 0 ? '+' : ''}${predData.changePercent.toFixed(2)}%</td>
                </tr>
                <tr>
                  <td style="padding: 4px 8px; font-size: 11px; opacity: 0.6;">成交量</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right;">${formatVolume(histData.volume)}</td>
                  <td style="padding: 4px 8px; ${mono} font-size: 11px; text-align: right;">${formatVolume(predData.volume)}</td>
                </tr>
              </tbody>
            </table>
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
      // 历史K线
      {
        name: '历史K线',
        type: 'candlestick',
        data: historyKlineData,
        xAxisIndex: 0,
        yAxisIndex: 0,
        barWidth: showPrediction.value && props.predictionData.length ? '35%' : '60%',
        barGap: '-100%',  // 让两个蜡烛重叠在同一列
        itemStyle: {
          color: colors.upColor,
          color0: colors.downColor,
          borderColor: colors.upColor,
          borderColor0: colors.downColor,
          borderWidth: 1
        }
      },
      // 预测K线（只在开启预测时显示）
      ...(showPrediction.value && props.predictionData.length ? [{
        name: '预测K线',
        type: 'candlestick',
        data: predictionKlineData,
        xAxisIndex: 0,
        yAxisIndex: 0,
        barWidth: '35%',
        barGap: '20%',  // 稍微偏移，方便对比
        itemStyle: {
          color: predictColors.up,
          color0: predictColors.down,
          borderColor: predictColors.up,
          borderColor0: predictColors.down,
          borderWidth: 1
        }
      }] : []),
      // 历史成交量
      {
        name: '历史成交量',
        type: 'bar',
        data: historyVolumeData,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: showPrediction.value && props.predictionData.length ? '35%' : '60%',
        barGap: '-100%'
      },
      // 预测成交量（只在开启预测时显示）
      ...(showPrediction.value && props.predictionData.length ? [{
        name: '预测成交量',
        type: 'bar',
        data: predictionVolumeData,
        xAxisIndex: 1,
        yAxisIndex: 1,
        barWidth: '35%',
        barGap: '20%'
      }] : [])
    ]
  }
  
  // 存储数据长度供 graphic 更新使用
  currentHistoryLength = props.data.length
  currentAllDataLength = dates.length
  // 存储预测起始索引
  currentFirstPredictIndex = firstPredictIndex
  
  chartInstance.setOption(option, true)
  
  // 更新预测区域的 graphic
  updatePredictionGraphic()
}

// 更新预测区域的分割线和背景（在缩放时调用）
const updatePredictionGraphic = () => {
  if (!chartInstance || !showPrediction.value || !props.predictionData.length || currentFirstPredictIndex < 0) {
    // 没有预测数据时清除 graphic
    if (chartInstance) {
      chartInstance.setOption({ graphic: [] })
    }
    return
  }
  
  try {
    // 获取预测第一点之前和之后的像素位置
    const beforePredictPixel = currentFirstPredictIndex > 0 
      ? chartInstance.convertToPixel({ xAxisIndex: 0 }, currentFirstPredictIndex - 1)
      : null
    const firstPredictPixel = chartInstance.convertToPixel({ xAxisIndex: 0 }, currentFirstPredictIndex)
    const lastPredictPixel = chartInstance.convertToPixel({ xAxisIndex: 0 }, currentAllDataLength - 1)
    
    // 如果像素位置无效（数据不在可视范围内），清除 graphic
    if (isNaN(firstPredictPixel) || isNaN(lastPredictPixel)) {
      chartInstance.setOption({ graphic: [] })
      return
    }
    
    // 分割线的 X 位置：在预测第一点之前
    const dividerX = beforePredictPixel !== null && !isNaN(beforePredictPixel)
      ? (beforePredictPixel + firstPredictPixel) / 2
      : firstPredictPixel - 20  // 如果没有前一个点，就往左偏移一点
    
    // 获取图表区域的边界
    const grid0 = chartInstance.getModel().getComponent('grid', 0)
    const gridRect0 = grid0.coordinateSystem.getRect()
    const grid1 = chartInstance.getModel().getComponent('grid', 1)
    const gridRect1 = grid1.coordinateSystem.getRect()
    
    // 计算背景区域的宽度（从分割线到最后一根蜡烛右边缘）
    const bgWidth = Math.max(0, lastPredictPixel - dividerX + 50)
    
    // 背景色
    const bgColor = isDark.value ? 'rgba(139, 92, 246, 0.06)' : 'rgba(139, 92, 246, 0.04)'
    
    // 使用 graphic 绘制分割线和背景（带平滑动画）
    chartInstance.setOption({
      graphic: [
        // K线图区域的背景
        {
          type: 'rect',
          id: 'predict-bg-0',
          z: 0,
          silent: true,
          shape: {
            x: dividerX,
            y: gridRect0.y,
            width: bgWidth,
            height: gridRect0.height
          },
          style: {
            fill: bgColor
          },
          transition: ['shape'],
          enterFrom: { style: { opacity: 0 } },
          enterAnimation: { duration: 300 }
        },
        // 成交量图区域的背景
        {
          type: 'rect',
          id: 'predict-bg-1',
          z: 0,
          silent: true,
          shape: {
            x: dividerX,
            y: gridRect1.y,
            width: bgWidth,
            height: gridRect1.height
          },
          style: {
            fill: bgColor
          },
          transition: ['shape'],
          enterFrom: { style: { opacity: 0 } },
          enterAnimation: { duration: 300 }
        },
        // K线图区域的分割线
        {
          type: 'line',
          id: 'predict-line-0',
          z: 100,
          silent: true,
          shape: {
            x1: dividerX,
            y1: gridRect0.y,
            x2: dividerX,
            y2: gridRect0.y + gridRect0.height
          },
          style: {
            stroke: 'rgba(139, 92, 246, 0.6)',
            lineWidth: 1.5,
            lineDash: [4, 4]
          },
          transition: ['shape'],
          enterFrom: { style: { opacity: 0 } },
          enterAnimation: { duration: 300 }
        },
        // 分割线标签
        {
          type: 'text',
          id: 'predict-label',
          z: 100,
          silent: true,
          x: dividerX,
          y: gridRect0.y - 5,
          style: {
            text: 'Predict',
            fill: '#a78bfa',
            fontSize: 10,
            fontWeight: 600,
            fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'center',
            textVerticalAlign: 'bottom'
          },
          transition: ['x', 'y'],
          enterFrom: { style: { opacity: 0 } },
          enterAnimation: { duration: 300 }
        },
        // 成交量图区域的分割线
        {
          type: 'line',
          id: 'predict-line-1',
          z: 100,
          silent: true,
          shape: {
            x1: dividerX,
            y1: gridRect1.y,
            x2: dividerX,
            y2: gridRect1.y + gridRect1.height
          },
          style: {
            stroke: 'rgba(139, 92, 246, 0.6)',
            lineWidth: 1.5,
            lineDash: [4, 4]
          },
          transition: ['shape'],
          enterFrom: { style: { opacity: 0 } },
          enterAnimation: { duration: 300 }
        }
      ]
    })
  } catch (e) {
    // 如果出错，清除 graphic
    chartInstance.setOption({ graphic: [] })
  }
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
  // 窗口大小变化时也更新 graphic
  updatePredictionGraphic()
}

const handleRangeChange = (range) => {
  emit('rangeChange', range)
}

const handlePredictToggle = (val) => {
  emit('predictToggle', val, predictDate.value)
}

const handlePredictDateChange = (date) => {
  emit('predictDateChange', date)
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

// 监听默认预测日期变化
watch(() => props.defaultPredictDate, (newDate) => {
  if (newDate && !predictDate.value) {
    predictDate.value = newDate
  }
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

.chart-title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(var(--primary-rgb), 0.35);
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
  border-left: 1px solid var(--glass-border);
  
  .info-icon {
    color: var(--text-muted);
    cursor: help;
    transition: color 0.2s;
    margin-left: 4px;
    
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
  
  :deep(.el-date-editor) {
    --el-input-bg-color: var(--glass-bg);
    --el-input-border-color: var(--glass-border);
    --el-input-text-color: var(--text-primary);
    
    .el-input__wrapper {
      background: var(--glass-bg);
      border-color: var(--glass-border);
      box-shadow: none;
      
      &:hover {
        border-color: var(--primary-color);
      }
    }
  }
}

</style>
