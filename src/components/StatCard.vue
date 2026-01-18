<template>
  <div class="stat-card" :class="[type]">
    <div class="card-glow"></div>
    <div class="card-content">
      <div class="stat-icon">
        <div class="icon-bg"></div>
        <el-icon :size="22"><component :is="icon" /></el-icon>
      </div>
      <div class="stat-info">
        <div class="stat-value">
          <span class="value">{{ formattedValue }}</span>
          <span class="suffix" v-if="suffix">{{ suffix }}</span>
        </div>
        <div class="stat-label">{{ label }}</div>
      </div>
    </div>
    <div class="card-shine"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  suffix: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: 'DataLine'
  },
  type: {
    type: String,
    default: 'default'
  }
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 10000) {
      return (props.value / 10000).toFixed(1) + '万'
    }
    return props.value.toLocaleString()
  }
  return props.value
})
</script>

<style lang="scss" scoped>
.stat-card {
  position: relative;
  padding: 24px;
  background: var(--card-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 20px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.15),
      transparent 50%
    );
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    pointer-events: none;
    
    .dark & {
      background: linear-gradient(
        135deg,
        rgba(255, 255, 255, 0.1),
        transparent 50%
      );
    }
  }
  
  &:hover {
    transform: translateY(-4px);
    border-color: var(--glass-border-hover);
    
    .card-glow {
      opacity: 1;
    }
    
    .card-shine {
      transform: translateX(100%);
    }
    
    .stat-icon {
      transform: scale(1.1);
      
      .icon-bg {
        transform: scale(1.2);
      }
    }
  }
}

.card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  
  .default & {
    background: radial-gradient(circle at 30% 30%, rgba(var(--primary-rgb), 0.12), transparent 60%);
  }
  
  .primary & {
    background: radial-gradient(circle at 30% 30%, rgba(var(--primary-rgb), 0.15), transparent 60%);
  }
  
  .success & {
    background: radial-gradient(circle at 30% 30%, rgba(22, 163, 74, 0.15), transparent 60%);
    
    .dark & {
      background: radial-gradient(circle at 30% 30%, rgba(52, 211, 153, 0.2), transparent 60%);
    }
  }
  
  .warning & {
    background: radial-gradient(circle at 30% 30%, rgba(217, 119, 6, 0.15), transparent 60%);
    
    .dark & {
      background: radial-gradient(circle at 30% 30%, rgba(251, 191, 36, 0.2), transparent 60%);
    }
  }
  
  .danger & {
    background: radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.15), transparent 60%);
    
    .dark & {
      background: radial-gradient(circle at 30% 30%, rgba(248, 113, 113, 0.2), transparent 60%);
    }
  }
}

.card-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.08),
    transparent
  );
  transition: transform 0.6s ease;
  pointer-events: none;
  
  .light & {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
  }
}

.card-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
  z-index: 1;
}

.stat-icon {
  position: relative;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  
  .icon-bg {
    position: absolute;
    inset: 0;
    border-radius: 16px;
    transition: transform 0.3s ease;
  }
  
  .el-icon {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
  
  .default & {
    .icon-bg {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
    }
  }
  
  .primary & {
    .icon-bg {
      background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
      box-shadow: 0 8px 24px rgba(var(--primary-rgb), 0.35);
    }
  }
  
  .success & {
    .icon-bg {
      background: linear-gradient(135deg, #16a34a, #15803d);
      box-shadow: 0 8px 24px rgba(22, 163, 74, 0.35);
      
      .dark & {
        background: linear-gradient(135deg, #34d399, #10b981);
        box-shadow: 0 8px 24px rgba(52, 211, 153, 0.4);
      }
    }
  }
  
  .warning & {
    .icon-bg {
      background: linear-gradient(135deg, #d97706, #b45309);
      box-shadow: 0 8px 24px rgba(217, 119, 6, 0.35);
      
      .dark & {
        background: linear-gradient(135deg, #fbbf24, #f59e0b);
        box-shadow: 0 8px 24px rgba(251, 191, 36, 0.4);
      }
    }
  }
  
  .danger & {
    .icon-bg {
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      box-shadow: 0 8px 24px rgba(220, 38, 38, 0.35);
      
      .dark & {
        background: linear-gradient(135deg, #f87171, #ef4444);
        box-shadow: 0 8px 24px rgba(248, 113, 113, 0.4);
      }
    }
  }
}

.stat-info {
  flex: 1;
  min-width: 0;
}

.stat-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  
  .value {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: -1px;
    line-height: 1;
  }
  
  .suffix {
    font-size: 16px;
    color: var(--text-secondary);
    font-weight: 500;
  }
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 6px;
  font-weight: 500;
}
</style>
