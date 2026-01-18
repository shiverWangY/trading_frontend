import axios from 'axios'

// 从环境变量读取配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const API_KEY = import.meta.env.VITE_API_KEY || ''

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加 API Key 鉴权
api.interceptors.request.use(
  config => {
    if (API_KEY) {
      config.headers['X-API-Key'] = API_KEY
    }
    // ngrok 需要这个 header 来跳过警告页面
    config.headers['ngrok-skip-browser-warning'] = 'true'
    return config
  },
  error => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ========== 预测相关 API ==========

/**
 * 获取所有模型信息
 * @returns {Promise<{models: Array<{model_name: string, prediction_count: number, date_count: number, first_date: string, last_date: string}>}>}
 */
export const getModels = () => {
  return api.get('/predict/models')
}

/**
 * 启动预测任务（异步，立即返回）
 * @param {string[]} dates - 日期数组 ["2026-01-15", "2026-01-16", ...]
 * @param {number} threshold - 阈值
 * @param {string} modelName - 模型名称（可选）
 * @returns {Promise<{success: boolean, message: string, data: {task_id: number}}>}
 */
export const startPrediction = (dates, threshold = 0.5, modelName = null) => {
  const body = { dates, threshold }
  if (modelName) {
    body.model_name = modelName
  }
  return api.post('/predict', body)
}

/**
 * 轮询预测任务状态
 * @param {number} taskId - 任务ID
 * @returns {Promise<{task_id: number, status: string, progress: number, total_stocks: number, processed_stocks: number, positive_count: number|null, error_message: string|null}>}
 */
export const getPredictionTaskStatus = (taskId) => {
  return api.get(`/predict/task/${taskId}`)
}

/**
 * 获取预测列表
 * @param {string} date - 日期
 * @param {object} params - 查询参数
 */
export const getPredictions = (date, params = {}) => {
  return api.get(`/predict/${date}`, { params })
}

/**
 * 获取单只股票的预测详情
 * @param {string} date - 日期
 * @param {string} code - 股票代码
 * @param {string} modelName - 模型名称（可选）
 */
export const getPredictionDetail = (date, code, modelName = null) => {
  const params = {}
  if (modelName) {
    params.model_name = modelName
  }
  return api.get(`/predict/${date}/${code}`, { params })
}

// ========== 股票相关 API ==========

/**
 * 搜索股票
 * @param {string} query - 搜索关键词
 * @param {number} limit - 返回数量
 */
export const searchStocks = (query, limit = 20) => {
  return api.get('/stocks/search', { params: { q: query, limit } })
}

/**
 * 获取股票详情
 * @param {string} code - 股票代码
 */
export const getStockInfo = (code) => {
  return api.get(`/stocks/${code}`)
}

/**
 * 获取股票列表
 * @param {object} params - 查询参数
 */
export const getStocks = (params = {}) => {
  return api.get('/stocks', { params })
}

// ========== K线相关 API ==========

/**
 * 获取日K线数据
 * @param {string} code - 股票代码
 * @param {number} limit - 数据条数
 */
export const getDailyKLine = (code, limit = 60) => {
  return api.get(`/kline/${code}/daily`, { params: { limit } })
}

/**
 * 获取5分钟K线数据
 * @param {string} code - 股票代码
 * @param {number} limit - 数据条数
 */
export const get5MinKLine = (code, limit = 480) => {
  return api.get(`/kline/${code}/5min`, { params: { limit } })
}

// ========== 数据同步相关 API ==========

/**
 * 启动数据同步任务
 * @param {string} dataType - 同步类型: all/daily/5min
 * @returns {Promise<{success: boolean, message: string, data: {task_id: number}}>}
 */
export const startDataSync = (dataType = 'all') => {
  return api.post(`/data/sync?data_type=${dataType}`)
}

/**
 * 查询数据同步任务状态
 * @param {number} taskId - 任务ID
 */
export const getDataSyncStatus = (taskId) => {
  return api.get(`/data/sync/status/${taskId}`)
}

// ========== 统计相关 API ==========

/**
 * 获取准确率统计
 * @param {string} modelName - 模型名称（可选）
 */
export const getAccuracyStats = (modelName = null) => {
  const params = {}
  if (modelName) {
    params.model_name = modelName
  }
  return api.get('/stats/accuracy', { params })
}

/**
 * 获取每日统计
 * @param {string} date - 日期
 */
export const getDailyStats = (date) => {
  return api.get(`/stats/daily/${date}`)
}

/**
 * 获取热门预测
 * @param {string} date - 日期
 * @param {number} limit - 返回数量
 * @param {string} modelName - 模型名称（可选）
 */
export const getTopPredictions = (date, limit = 10, modelName = null) => {
  const params = { date, limit }
  if (modelName) {
    params.model_name = modelName
  }
  return api.get('/stats/top', { params })
}

export default api
