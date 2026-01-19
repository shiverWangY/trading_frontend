import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  // 从 localStorage 读取主题，默认深色
  const savedTheme = localStorage.getItem('theme') || 'dark'
  const isDark = ref(savedTheme === 'dark')

  // 更新 DOM class - 需要在 watch 之前定义
  const updateThemeClass = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    }
  }

  // 切换主题
  const toggleTheme = () => {
    isDark.value = !isDark.value
  }

  // 设置主题
  const setTheme = (dark) => {
    isDark.value = dark
  }

  // 监听主题变化，保存到 localStorage 并更新 DOM
  watch(isDark, (val) => {
    localStorage.setItem('theme', val ? 'dark' : 'light')
    updateThemeClass(val)
  }, { immediate: true })

  return {
    isDark,
    toggleTheme,
    setTheme
  }
})
