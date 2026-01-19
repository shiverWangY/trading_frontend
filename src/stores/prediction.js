import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { getPredictions, startPrediction, getPredictionTaskStatus, getAccuracyStats, getModels } from '@/api'

// 获取 T-2 个交易日（工作日，排除周末）
function getLatestTradingDay() {
  let date = dayjs()
  let tradingDaysToSubtract = 2
  
  // 如果今天是周末，先调整到周五
  const dayOfWeek = date.day() // 0=周日, 1=周一, ..., 6=周六
  if (dayOfWeek === 0) {
    // 周日 -> 先回到周五
    date = date.subtract(2, 'day')
  } else if (dayOfWeek === 6) {
    // 周六 -> 先回到周五
    date = date.subtract(1, 'day')
  }
  
  // 从当前交易日往前推 2 个交易日
  while (tradingDaysToSubtract > 0) {
    date = date.subtract(1, 'day')
    const day = date.day()
    // 跳过周末
    if (day !== 0 && day !== 6) {
      tradingDaysToSubtract--
    }
  }
  
  return date.format('YYYY-MM-DD')
}

export const usePredictionStore = defineStore('prediction', () => {
  // 状态
  const currentDate = ref(getLatestTradingDay())
  const predictions = ref([])
  const loading = ref(false)
  const stats = ref(null)
  const totalPositiveCount = ref(0)  // 后端返回的总看涨数量
  const dailyTotal = ref(0)  // 当天所有预测总数
  
  // 模型相关
  const models = ref([])  // 所有模型列表
  const currentModel = ref('')  // 当前选中的模型（空字符串表示全部）
  
  const filters = ref({
    minScore: 0.5,
    prediction: null,  // null: 全部, 1: 看涨, 0: 看跌
    keyword: '',
    excludeLimitUp: false  // 是否剔除涨停股票
  })
  const pagination = ref({
    page: 1,
    pageSize: 20,
    total: 0
  })

  // 预测任务状态
  const predictionTask = ref({
    isRunning: false,
    taskId: null,
    status: 'idle',  // idle/pending/running/completed/failed
    progress: 0,
    stage: '',       // 当前阶段描述
    totalStocks: 0,
    processedStocks: 0,
    positiveCount: null,
    errorMessage: null
  })

  // 轮询定时器
  let pollTimer = null

  // 计算属性（搜索已在后端完成，直接返回数据）
  const filteredPredictions = computed(() => {
    return predictions.value
  })

  const positiveCount = computed(() => {
    return predictions.value.filter(p => p.prediction === 1).length
  })

  const accuracyRate = computed(() => {
    const verified = predictions.value.filter(p => p.is_correct !== null)
    if (verified.length === 0) return 0
    const correct = verified.filter(p => p.is_correct).length
    return ((correct / verified.length) * 100).toFixed(1)
  })

  // 获取模型列表
  async function fetchModels() {
    try {
      const result = await getModels()
      models.value = result.models || []
    } catch (error) {
      console.error('获取模型列表失败:', error)
      models.value = []
    }
  }
  
  // 设置当前模型
  function setModel(modelName) {
    currentModel.value = modelName
    pagination.value.page = 1
    fetchPredictions()
  }

  // 方法
  async function fetchPredictions() {
    loading.value = true
    try {
      const params = {
        min_score: filters.value.minScore,
        limit: pagination.value.pageSize,
        offset: (pagination.value.page - 1) * pagination.value.pageSize
      }
      if (filters.value.prediction !== null) {
        params.prediction = filters.value.prediction
      }
      // 添加搜索参数
      if (filters.value.keyword) {
        params.search = filters.value.keyword
      }
      // 是否剔除涨停股票
      if (filters.value.excludeLimitUp) {
        params.exclude_limit_up = true
      }
      // 添加模型筛选
      if (currentModel.value) {
        params.model_name = currentModel.value
      }
      
      const data = await getPredictions(currentDate.value, params)
      predictions.value = data.items || []
      // filtered_total 是符合筛选条件的数量，用于分页
      pagination.value.total = data.filtered_total || data.total || 0
      // 当天所有预测总数
      dailyTotal.value = data.total || 0
      totalPositiveCount.value = data.positive_count || 0
    } catch (error) {
      console.error('获取预测数据失败:', error)
      predictions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 启动预测任务（异步）
   * @param {string[]} dates - 日期数组
   * @param {number} threshold - 阈值
   * @param {string} modelName - 模型名称（可选）
   */
  async function runPrediction(dates, threshold = 0.5, modelName = null) {
    // 如果已经有任务在运行，不重复启动
    if (predictionTask.value.isRunning) {
      return
    }

    try {
      // 重置任务状态
      predictionTask.value = {
        isRunning: true,
        taskId: null,
        status: 'pending',
        progress: 0,
        stage: '准备中...',
        totalStocks: 0,
        processedStocks: 0,
        positiveCount: null,
        errorMessage: null
      }

      // 启动预测任务（传入模型参数）
      const result = await startPrediction(dates, threshold, modelName || currentModel.value || null)
      
      if (result.success && result.data?.task_id) {
        predictionTask.value.taskId = result.data.task_id
        predictionTask.value.status = 'running'
        
        // 开始轮询任务状态
        startPolling(result.data.task_id)
      } else {
        throw new Error(result.message || '启动预测任务失败')
      }
    } catch (error) {
      console.error('启动预测任务失败:', error)
      predictionTask.value.isRunning = false
      predictionTask.value.status = 'failed'
      predictionTask.value.errorMessage = error.message || '启动预测任务失败'
      throw error
    }
  }

  /**
   * 开始轮询任务状态
   */
  function startPolling(taskId) {
    // 清除之前的定时器
    stopPolling()

    // 立即查询一次
    pollTaskStatus(taskId)

    // 每2秒轮询一次
    pollTimer = setInterval(() => {
      pollTaskStatus(taskId)
    }, 2000)
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  /**
   * 查询任务状态
   */
  async function pollTaskStatus(taskId) {
    try {
      const status = await getPredictionTaskStatus(taskId)
      
      predictionTask.value.status = status.status
      predictionTask.value.progress = status.progress || 0
      predictionTask.value.stage = status.stage || ''
      predictionTask.value.totalStocks = status.total_stocks || 0
      predictionTask.value.processedStocks = status.processed_stocks || 0
      predictionTask.value.positiveCount = status.positive_count
      predictionTask.value.errorMessage = status.error_message

      // 如果任务完成或失败，停止轮询
      if (status.status === 'completed') {
        stopPolling()
        predictionTask.value.isRunning = false
        // 刷新预测列表
        await fetchPredictions()
      } else if (status.status === 'failed') {
        stopPolling()
        predictionTask.value.isRunning = false
      }
    } catch (error) {
      console.error('查询任务状态失败:', error)
      // 出错时不立即停止，继续尝试
    }
  }

  /**
   * 取消/重置任务状态
   */
  function resetTask() {
    stopPolling()
    predictionTask.value = {
      isRunning: false,
      taskId: null,
      status: 'idle',
      progress: 0,
      stage: '',
      totalStocks: 0,
      processedStocks: 0,
      positiveCount: null,
      errorMessage: null
    }
  }

  async function fetchStats() {
    try {
      stats.value = await getAccuracyStats()
    } catch (error) {
      console.error('获取统计数据失败:', error)
    }
  }

  function setDate(date) {
    currentDate.value = date
    pagination.value.page = 1
    fetchPredictions()
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters }
    pagination.value.page = 1
    fetchPredictions()
  }

  function setPage(page) {
    pagination.value.page = page
    fetchPredictions()
  }

  return {
    // 状态
    currentDate,
    predictions,
    loading,
    stats,
    filters,
    pagination,
    predictionTask,
    totalPositiveCount,
    dailyTotal,
    models,
    currentModel,
    // 计算属性
    filteredPredictions,
    positiveCount,
    accuracyRate,
    // 方法
    fetchPredictions,
    fetchModels,
    setModel,
    runPrediction,
    resetTask,
    fetchStats,
    setDate,
    setFilters,
    setPage
  }
})
