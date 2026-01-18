<template>
  <div class="prediction-badge" :class="{ up: prediction === 1, down: prediction === 0 }">
    <div class="badge-icon">
      <el-icon v-if="prediction === 1"><Top /></el-icon>
      <el-icon v-else><Bottom /></el-icon>
    </div>
    <span class="badge-text">{{ prediction === 1 ? '看涨' : '看跌' }}</span>
  </div>
</template>

<script setup>
import { Top, Bottom } from '@element-plus/icons-vue'

defineProps({
  prediction: {
    type: Number,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.prediction-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &.up {
    background: rgba(248, 113, 113, 0.15);
    color: #fca5a5;
    
    .badge-icon {
      background: linear-gradient(135deg, #f87171, #ef4444);
      box-shadow: 0 2px 8px rgba(248, 113, 113, 0.4);
    }
  }
  
  &.down {
    background: rgba(74, 222, 128, 0.15);
    color: #86efac;
    
    .badge-icon {
      background: linear-gradient(135deg, #4ade80, #22c55e);
      box-shadow: 0 2px 8px rgba(74, 222, 128, 0.4);
    }
  }
}

.badge-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 12px;
}

.badge-text {
  letter-spacing: 0.5px;
}
</style>
