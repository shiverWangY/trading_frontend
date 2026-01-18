<template>
  <div class="prediction-progress" :class="[status]">
    <div class="progress-header">
      <div class="progress-title">
        <div class="status-icon">
          <el-icon v-if="status === 'pending'" class="spin"><Loading /></el-icon>
          <el-icon v-else-if="status === 'running'" class="spin"><Loading /></el-icon>
          <el-icon v-else-if="status === 'completed'"><CircleCheck /></el-icon>
          <el-icon v-else-if="status === 'failed'"><CircleClose /></el-icon>
        </div>
        <span class="title-text">{{ statusText }}</span>
      </div>
      <div class="progress-stats">
        <span class="stats-text">
          {{ processedStocks.toLocaleString() }} / {{ totalStocks.toLocaleString() }}
        </span>
        <span class="stats-percent">{{ progress }}%</span>
      </div>
    </div>
    
    <div class="progress-bar-container">
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: progress + '%' }"
        >
          <div class="progress-glow"></div>
        </div>
      </div>
    </div>
    
    <div class="progress-footer">
      <div class="footer-info">
        <template v-if="status === 'pending' || status === 'running'">
          <el-icon class="spin-slow"><Refresh /></el-icon>
          <span class="stage-text">{{ stage || '正在处理中，请稍候...' }}</span>
        </template>
        <template v-else-if="status === 'completed' && positiveCount !== null">
          <el-icon><TrendCharts /></el-icon>
          <span>发现 <strong>{{ positiveCount }}</strong> 只看涨股票</span>
        </template>
        <template v-else-if="status === 'failed'">
          <el-icon><Warning /></el-icon>
          <span>{{ errorMessage || '预测任务失败' }}</span>
        </template>
      </div>
      
      <el-button 
        v-if="status === 'completed' || status === 'failed'"
        size="small" 
        text
        @click="$emit('close')"
      >
        关闭
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Loading, CircleCheck, CircleClose, Refresh, TrendCharts, Warning } from '@element-plus/icons-vue'

const props = defineProps({
  status: {
    type: String,
    default: 'pending' // pending, running, completed, failed
  },
  progress: {
    type: Number,
    default: 0
  },
  stage: {
    type: String,
    default: ''
  },
  totalStocks: {
    type: Number,
    default: 0
  },
  processedStocks: {
    type: Number,
    default: 0
  },
  positiveCount: {
    type: Number,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
})

defineEmits(['close'])

const statusText = computed(() => {
  switch (props.status) {
    case 'pending': return '准备中...'
    case 'running': return '预测进行中'
    case 'completed': return '预测完成'
    case 'failed': return '预测失败'
    default: return '预测任务'
  }
})
</script>

<style lang="scss" scoped>
.prediction-progress {
  padding: 20px 24px;
  background: var(--card-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  margin-bottom: 24px;
  animation: slideDown 0.3s ease;
  
  &.running {
    border-color: rgba(var(--primary-rgb), 0.3);
    box-shadow: 0 0 30px rgba(var(--primary-rgb), 0.1);
  }
  
  &.completed {
    border-color: rgba(22, 163, 74, 0.3);
    box-shadow: 0 0 30px rgba(22, 163, 74, 0.1);
    
    .dark & {
      border-color: rgba(52, 211, 153, 0.3);
      box-shadow: 0 0 30px rgba(52, 211, 153, 0.1);
    }
  }
  
  &.failed {
    border-color: rgba(220, 38, 38, 0.3);
    box-shadow: 0 0 30px rgba(220, 38, 38, 0.1);
    
    .dark & {
      border-color: rgba(248, 113, 113, 0.3);
      box-shadow: 0 0 30px rgba(248, 113, 113, 0.1);
    }
  }
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.progress-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  
  .running &, .pending & {
    background: rgba(var(--primary-rgb), 0.15);
    color: var(--primary-color);
  }
  
  .completed & {
    background: rgba(22, 163, 74, 0.15);
    color: #16a34a;
    
    .dark & {
      background: rgba(52, 211, 153, 0.15);
      color: #34d399;
    }
  }
  
  .failed & {
    background: rgba(220, 38, 38, 0.15);
    color: #dc2626;
    
    .dark & {
      background: rgba(248, 113, 113, 0.15);
      color: #f87171;
    }
  }
}

.title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-stats {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stats-text {
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
}

.stats-percent {
  font-family: 'JetBrains Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--primary-color);
}

.progress-bar-container {
  margin-bottom: 14px;
}

.progress-bar {
  height: 8px;
  background: var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
  transition: width 0.3s ease;
  position: relative;
  
  .completed & {
    background: linear-gradient(90deg, #16a34a, #15803d);
    
    .dark & {
      background: linear-gradient(90deg, #34d399, #10b981);
    }
  }
  
  .failed & {
    background: linear-gradient(90deg, #dc2626, #b91c1c);
    
    .dark & {
      background: linear-gradient(90deg, #f87171, #ef4444);
    }
  }
}

.progress-glow {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 60px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
  animation: shimmer 1.5s infinite;
  
  .completed &, .failed & {
    display: none;
  }
}

.progress-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  
  strong {
    color: var(--primary-color);
    font-weight: 600;
  }
  
  .failed & {
    color: #dc2626;
    
    .dark & {
      color: #f87171;
    }
  }
}

.spin {
  animation: spin 1s linear infinite;
}

.spin-slow {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
