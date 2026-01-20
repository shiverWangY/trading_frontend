import { defineStore } from 'pinia'
import { ref } from 'vue'
import { startDataSync, getDataSyncStatus } from '@/api'

export const useDataSyncStore = defineStore('dataSync', () => {
  // 数据同步任务状态
  const syncTask = ref({
    isRunning: false,
    taskId: null,
    status: 'idle',  // idle/pending/running/completed/failed
    progress: 0,
    stage: '',
    syncType: '',    // 当前同步类型: 5min / daily
    current: 0,      // 当前处理数量
    total: 0,        // 总数量
    message: '',     // 可读消息
    errorMessage: null
  })

  // 轮询定时器
  let pollTimer = null

  /**
   * 启动数据同步任务
   * @param {string} dataType - 同步类型: all/daily/5min
   * @param {string[]} dates - 日期数组
   */
  async function startSync(dataType = 'all', dates = []) {
    if (syncTask.value.isRunning) {
      return
    }

    try {
      // 重置任务状态
      syncTask.value = {
        isRunning: true,
        taskId: null,
        status: 'pending',
        progress: 0,
        stage: '准备同步...',
        syncType: dataType,
        current: 0,
        total: 0,
        message: '',
        errorMessage: null
      }

      const result = await startDataSync(dataType, dates)

      if (result.success && result.data?.task_id) {
        syncTask.value.taskId = result.data.task_id
        syncTask.value.status = 'running'
        startPolling(result.data.task_id)
      } else {
        throw new Error(result.message || '启动同步任务失败')
      }
    } catch (error) {
      console.error('启动同步任务失败:', error)
      syncTask.value.isRunning = false
      syncTask.value.status = 'failed'
      syncTask.value.errorMessage = error.message || '启动同步任务失败'
      throw error
    }
  }

  /**
   * 开始轮询任务状态
   */
  function startPolling(taskId) {
    stopPolling()
    pollTaskStatus(taskId)
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
      const status = await getDataSyncStatus(taskId)

      syncTask.value.status = status.status
      syncTask.value.progress = status.progress || 0
      syncTask.value.stage = status.stage || ''
      syncTask.value.syncType = status.sync_type || ''
      syncTask.value.current = status.current || 0
      syncTask.value.total = status.total || 0
      syncTask.value.message = status.message || ''
      syncTask.value.errorMessage = status.error_message

      if (status.status === 'completed') {
        stopPolling()
        syncTask.value.isRunning = false
      } else if (status.status === 'failed') {
        stopPolling()
        syncTask.value.isRunning = false
      }
    } catch (error) {
      console.error('查询同步任务状态失败:', error)
    }
  }

  /**
   * 重置任务状态
   */
  function resetTask() {
    stopPolling()
    syncTask.value = {
      isRunning: false,
      taskId: null,
      status: 'idle',
      progress: 0,
      stage: '',
      syncType: '',
      current: 0,
      total: 0,
      message: '',
      errorMessage: null
    }
  }

  return {
    syncTask,
    startSync,
    resetTask
  }
})
