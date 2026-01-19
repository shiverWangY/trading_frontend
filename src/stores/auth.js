import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { register, login, changePassword, getCurrentUser } from '@/api/index.js'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref(null)
  const token = ref(localStorage.getItem('access_token') || '')
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const username = computed(() => user.value?.username || '')
  const nickname = computed(() => user.value?.nickname || user.value?.username || '')
  const userRole = computed(() => user.value?.role || 'user')

  // 初始化 - 如果有 token 则获取用户信息
  async function init() {
    if (token.value) {
      try {
        await fetchCurrentUser()
      } catch (err) {
        // token 无效，清除登录状态
        logout()
      }
    }
  }

  // 注册
  async function registerUser(userData) {
    loading.value = true
    error.value = null
    try {
      const result = await register(userData)
      return result
    } catch (err) {
      error.value = err.response?.data?.detail || err.message || '注册失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登录
  async function loginUser(credentials) {
    loading.value = true
    error.value = null
    try {
      const result = await login(credentials)
      
      // 保存 token
      token.value = result.access_token
      localStorage.setItem('access_token', result.access_token)
      
      // 保存用户信息
      user.value = result.user
      
      return result
    } catch (err) {
      error.value = err.response?.data?.detail || err.message || '登录失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  // 登出
  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('access_token')
  }

  // 获取当前用户
  async function fetchCurrentUser() {
    if (!token.value) return null
    
    loading.value = true
    try {
      const result = await getCurrentUser()
      user.value = result.data
      return user.value
    } catch (err) {
      error.value = err.response?.data?.detail || err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  async function updatePassword(oldPassword, newPassword) {
    loading.value = true
    error.value = null
    try {
      const result = await changePassword(oldPassword, newPassword)
      return result
    } catch (err) {
      error.value = err.response?.data?.detail || err.message || '密码修改失败'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    user,
    token,
    loading,
    error,
    // 计算属性
    isLoggedIn,
    username,
    nickname,
    userRole,
    // 方法
    init,
    registerUser,
    loginUser,
    logout,
    fetchCurrentUser,
    updatePassword
  }
})
