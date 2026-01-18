<template>
  <div class="stock-card glass-card" @click="handleClick">
    <div class="card-content">
      <div class="stock-icon">
        <el-icon><TrendCharts /></el-icon>
      </div>
      <div class="stock-main">
        <div class="stock-code">{{ stock.code }}</div>
        <div class="stock-name">{{ stock.name }}</div>
      </div>
      <div class="stock-price" v-if="stock.close">
        <div class="price">¥{{ formatPrice(stock.close) }}</div>
        <div 
          class="change" 
          :class="{ up: changePercent > 0, down: changePercent < 0 }"
        >
          {{ changePercent > 0 ? '+' : '' }}{{ changePercent.toFixed(2) }}%
        </div>
      </div>
      <div class="arrow-icon">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowRight, TrendCharts } from '@element-plus/icons-vue'

const props = defineProps({
  stock: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const changePercent = computed(() => {
  if (!props.stock.open || !props.stock.close) return 0
  return ((props.stock.close - props.stock.open) / props.stock.open) * 100
})

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const handleClick = () => {
  router.push(`/stock/${props.stock.code}`)
}
</script>

<style lang="scss" scoped>
.stock-card {
  cursor: pointer;
  
  &:hover {
    .arrow-icon {
      opacity: 1;
      transform: translateX(4px);
    }
    
    .stock-icon {
      transform: scale(1.1);
    }
  }
}

.card-content {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
}

.stock-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.2));
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-light);
  font-size: 18px;
  transition: transform 0.3s ease;
}

.stock-main {
  flex: 1;
  
  .stock-code {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--text-muted);
  }
  
  .stock-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin-top: 4px;
  }
}

.stock-price {
  text-align: right;
  margin-right: 12px;
  
  .price {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
  
  .change {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    margin-top: 4px;
    
    &.up {
      color: var(--up-color);
    }
    
    &.down {
      color: var(--down-color);
    }
  }
}

.arrow-icon {
  color: var(--text-muted);
  opacity: 0;
  transition: all 0.2s ease;
}
</style>
