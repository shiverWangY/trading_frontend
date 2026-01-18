<template>
  <button 
    class="theme-toggle" 
    :class="{ dark: isDark }"
    @click="toggleTheme"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
  >
    <div class="toggle-track">
      <div class="toggle-icons">
        <div class="icon sun">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </div>
        <div class="icon moon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </div>
      </div>
      <div class="toggle-thumb">
        <div class="thumb-glow"></div>
      </div>
    </div>
  </button>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const { isDark } = storeToRefs(themeStore)
const { toggleTheme } = themeStore
</script>

<style lang="scss" scoped>
.theme-toggle {
  position: relative;
  width: 64px;
  height: 32px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  outline: none;
  
  &:focus-visible {
    .toggle-track {
      box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.3);
    }
  }
}

.toggle-track {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  border: 1px solid rgba(251, 191, 36, 0.3);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.1),
    0 2px 8px rgba(251, 191, 36, 0.2);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  .dark & {
    background: linear-gradient(135deg, #1e1b4b, #312e81);
    border-color: rgba(129, 140, 248, 0.3);
    box-shadow: 
      inset 0 2px 4px rgba(0, 0, 0, 0.3),
      0 2px 8px rgba(129, 140, 248, 0.2);
  }
}

.toggle-icons {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
}

.icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
  
  svg {
    width: 100%;
    height: 100%;
  }
  
  &.sun {
    color: #f59e0b;
    opacity: 1;
    transform: scale(1);
    
    .dark & {
      opacity: 0.3;
      transform: scale(0.8);
    }
  }
  
  &.moon {
    color: #a5b4fc;
    opacity: 0.3;
    transform: scale(0.8);
    
    .dark & {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fff, #fef3c7);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.15),
    0 0 20px rgba(251, 191, 36, 0.3);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  .dark & {
    left: calc(100% - 29px);
    background: linear-gradient(135deg, #c7d2fe, #818cf8);
    box-shadow: 
      0 2px 8px rgba(0, 0, 0, 0.3),
      0 0 20px rgba(129, 140, 248, 0.5);
  }
}

.thumb-glow {
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(251, 191, 36, 0.4), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  
  .theme-toggle:hover & {
    opacity: 1;
  }
  
  .dark & {
    background: radial-gradient(circle, rgba(129, 140, 248, 0.4), transparent 70%);
  }
}
</style>
