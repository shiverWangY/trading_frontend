<template>
  <div class="result-badge" :class="[statusClass]">
    <div class="badge-icon">
      <el-icon v-if="isCorrect === true"><Check /></el-icon>
      <el-icon v-else-if="isCorrect === false"><Close /></el-icon>
      <el-icon v-else><Clock /></el-icon>
    </div>
    <span class="badge-text">{{ statusText }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Check, Close, Clock } from '@element-plus/icons-vue'

const props = defineProps({
  isCorrect: {
    type: [Boolean, null],
    default: null
  }
})

const statusClass = computed(() => {
  if (props.isCorrect === true) return 'success'
  if (props.isCorrect === false) return 'error'
  return 'pending'
})

const statusText = computed(() => {
  if (props.isCorrect === true) return '正确'
  if (props.isCorrect === false) return '错误'
  return '待验证'
})
</script>

<style lang="scss" scoped>
.result-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &.success {
    background: rgba(52, 211, 153, 0.15);
    color: #6ee7b7;
    
    .badge-icon {
      background: linear-gradient(135deg, #34d399, #10b981);
      box-shadow: 0 2px 8px rgba(52, 211, 153, 0.4);
    }
  }
  
  &.error {
    background: rgba(248, 113, 113, 0.15);
    color: #fca5a5;
    
    .badge-icon {
      background: linear-gradient(135deg, #f87171, #ef4444);
      box-shadow: 0 2px 8px rgba(248, 113, 113, 0.4);
    }
  }
  
  &.pending {
    background: rgba(148, 163, 184, 0.1);
    color: #94a3b8;
    
    .badge-icon {
      background: linear-gradient(135deg, #64748b, #475569);
    }
  }
}

.badge-icon {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 10px;
}

.badge-text {
  letter-spacing: 0.3px;
}
</style>
