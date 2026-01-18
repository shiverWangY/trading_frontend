<template>
  <div class="score-slider">
    <div class="slider-header">
      <span class="slider-label">得分阈值</span>
      <span class="slider-value">≥ {{ formatValue(internalValue) }}</span>
    </div>
    <div class="slider-track">
      <el-slider
        v-model="internalValue"
        :min="0"
        :max="1"
        :step="0.05"
        :format-tooltip="formatTooltip"
        @change="handleChange"
      />
    </div>
    <div class="slider-marks">
      <span>0.0</span>
      <span>0.5</span>
      <span>1.0</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0.5
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (val) => {
  internalValue.value = val
})

const formatTooltip = (val) => `≥ ${val.toFixed(2)}`
const formatValue = (val) => val.toFixed(2)

const handleChange = (val) => {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<style lang="scss" scoped>
.score-slider {
  min-width: 240px;
}

.slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  
  .slider-label {
    color: var(--text-muted);
    font-size: 13px;
    font-weight: 500;
  }
  
  .slider-value {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
    font-size: 14px;
    color: var(--primary-light);
    padding: 4px 10px;
    background: rgba(var(--primary-rgb), 0.1);
    border-radius: 8px;
  }
}

.slider-track {
  :deep(.el-slider) {
    --el-slider-height: 6px;
    --el-slider-button-size: 18px;
    
    .el-slider__runway {
      background: rgba(255, 255, 255, 0.08);
      border-radius: 3px;
    }
    
    .el-slider__bar {
      background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
      border-radius: 3px;
      box-shadow: 0 0 16px rgba(var(--primary-rgb), 0.5);
    }
    
    .el-slider__button-wrapper {
      .el-slider__button {
        width: 18px;
        height: 18px;
        border: none;
        background: linear-gradient(135deg, #fff, #e2e8f0);
        box-shadow: 
          0 2px 8px rgba(0, 0, 0, 0.3),
          0 0 16px rgba(var(--primary-rgb), 0.4);
      }
    }
  }
}

.slider-marks {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  
  span {
    font-size: 11px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }
}
</style>
