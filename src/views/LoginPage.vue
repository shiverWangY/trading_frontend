<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-overlay"></div>
    </div>

    <div class="login-container">
      <!-- 左侧介绍区域 -->
      <div class="intro-section">
        <div class="intro-content">
          <div class="logo-section">
            <div class="logo-icon">
              <svg viewBox="0 0 48 48" fill="none">
                <path d="M8 36L16 24L24 30L32 16L40 24" stroke="url(#logo-gradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="16" cy="24" r="3" fill="url(#logo-gradient)"/>
                <circle cx="24" cy="30" r="3" fill="url(#logo-gradient)"/>
                <circle cx="32" cy="16" r="3" fill="url(#logo-gradient)"/>
                <defs>
                  <linearGradient id="logo-gradient" x1="8" y1="16" x2="40" y2="36">
                    <stop offset="0%" stop-color="#6366f1"/>
                    <stop offset="100%" stop-color="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 class="logo-text">DeepQuant</h1>
          </div>

          <h2 class="intro-title">AI 量化选股系统</h2>
          <p class="intro-subtitle">基于深度学习的智能股票预测平台</p>

          <!-- 功能特点 -->
          <div class="features">
            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>深度学习模型</h4>
                <p>Transformer + LSTM 混合架构</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 3v18h18"/>
                  <path d="M18 9l-5 5-4-4-5 5"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>实时预测分析</h4>
                <p>每日更新 5000+ 股票预测</p>
              </div>
            </div>

            <div class="feature-item">
              <div class="feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>历史回测验证</h4>
                <p>透明的准确率统计</p>
              </div>
            </div>
          </div>

          <!-- 底部装饰图表 -->
          <div class="chart-decoration">
            <svg viewBox="0 0 300 80" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="rgba(99, 102, 241, 0.3)"/>
                  <stop offset="100%" stop-color="rgba(99, 102, 241, 0)"/>
                </linearGradient>
              </defs>
              <path d="M0,60 Q30,50 60,55 T120,40 T180,50 T240,30 T300,45 L300,80 L0,80 Z" fill="url(#chart-fill)"/>
              <path d="M0,60 Q30,50 60,55 T120,40 T180,50 T240,30 T300,45" fill="none" stroke="rgba(99, 102, 241, 0.6)" stroke-width="2"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-section">
        <div class="form-container glass-card">
          <!-- 顶部操作按钮 -->
          <div class="top-actions">
            <a 
              href="https://github.com/shiverWangY/trading_frontend" 
              target="_blank" 
              class="github-link"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
            <ThemeToggle />
          </div>
          
          <div class="form-header">
            <h2>{{ isRegisterMode ? '创建账户' : '欢迎回来' }}</h2>
            <p>{{ isRegisterMode ? '注册以开始使用量化选股系统' : '登录以继续使用量化选股系统' }}</p>
          </div>

          <form @submit.prevent="handleSubmit" class="auth-form">
            <!-- 用户名 -->
            <div class="form-group">
              <label>用户名</label>
              <el-input
                v-model="form.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
                clearable
              />
            </div>

            <!-- 邮箱 (仅注册) -->
            <div v-if="isRegisterMode" class="form-group">
              <label>邮箱</label>
              <el-input
                v-model="form.email"
                type="email"
                placeholder="请输入邮箱"
                :prefix-icon="Message"
                size="large"
                clearable
              />
            </div>

            <!-- 昵称 (仅注册) -->
            <div v-if="isRegisterMode" class="form-group">
              <label>昵称</label>
              <el-input
                v-model="form.nickname"
                placeholder="请输入昵称（可选）"
                :prefix-icon="UserFilled"
                size="large"
                clearable
              />
            </div>

            <!-- 密码 -->
            <div class="form-group">
              <label>密码</label>
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                clearable
              />
            </div>

            <!-- 确认密码 (仅注册) -->
            <div v-if="isRegisterMode" class="form-group">
              <label>确认密码</label>
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                :prefix-icon="Lock"
                size="large"
                show-password
                clearable
              />
            </div>

            <!-- 错误提示 -->
            <div v-if="errorMessage" class="error-message">
              <el-icon><WarningFilled /></el-icon>
              {{ errorMessage }}
            </div>

            <!-- 提交按钮 -->
            <el-button
              type="primary"
              native-type="submit"
              size="large"
              :loading="loading"
              class="submit-btn"
            >
              {{ isRegisterMode ? '立即注册' : '立即登录' }}
            </el-button>
          </form>

          <!-- 切换模式 -->
          <div class="form-footer">
            <span>{{ isRegisterMode ? '已有账户？' : '还没有账户？' }}</span>
            <a href="#" @click.prevent="toggleMode">
              {{ isRegisterMode ? '立即登录' : '立即注册' }}
            </a>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message, UserFilled, WarningFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import ThemeToggle from '@/components/ThemeToggle.vue'

const router = useRouter()
const authStore = useAuthStore()

const isRegisterMode = ref(false)
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  username: '',
  email: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const toggleMode = () => {
  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  // 清空表单
  form.username = ''
  form.email = ''
  form.nickname = ''
  form.password = ''
  form.confirmPassword = ''
}

const validateForm = () => {
  if (!form.username.trim()) {
    errorMessage.value = '请输入用户名'
    return false
  }
  if (form.username.length < 3) {
    errorMessage.value = '用户名至少3个字符'
    return false
  }
  if (!form.password) {
    errorMessage.value = '请输入密码'
    return false
  }
  if (form.password.length < 6) {
    errorMessage.value = '密码至少6个字符'
    return false
  }
  
  if (isRegisterMode.value) {
    if (!form.email.trim()) {
      errorMessage.value = '请输入邮箱'
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errorMessage.value = '请输入有效的邮箱地址'
      return false
    }
    if (form.password !== form.confirmPassword) {
      errorMessage.value = '两次输入的密码不一致'
      return false
    }
  }
  
  return true
}

const handleSubmit = async () => {
  errorMessage.value = ''
  
  if (!validateForm()) return
  
  loading.value = true
  
  try {
    if (isRegisterMode.value) {
      // 注册
      await authStore.registerUser({
        username: form.username,
        password: form.password,
        email: form.email,
        nickname: form.nickname || form.username
      })
      
      ElMessage.success('注册成功，请登录')
      isRegisterMode.value = false
      form.password = ''
      form.confirmPassword = ''
    } else {
      // 登录
      await authStore.loginUser({
        username: form.username,
        password: form.password
      })
      
      ElMessage.success('登录成功')
      
      // 跳转到首页或之前的页面
      const redirect = router.currentRoute.value.query.redirect || '/'
      router.push(redirect)
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.detail || err.message || (isRegisterMode.value ? '注册失败' : '登录失败')
  } finally {
    loading.value = false
  }
}

</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

// 背景装饰
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  
  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.6;
    animation: float 20s ease-in-out infinite;
  }
  
  .orb-1 {
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(99, 102, 241, 0.4), transparent 70%);
    top: -200px;
    left: -100px;
  }
  
  .orb-2 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.3), transparent 70%);
    bottom: -150px;
    right: -100px;
    animation-delay: -7s;
  }
  
  .orb-3 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(34, 211, 238, 0.2), transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    animation-delay: -14s;
  }
  
  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.05);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.95);
  }
}

.login-container {
  display: flex;
  max-width: 1100px;
  width: 100%;
  min-height: 650px;
  position: relative;
  z-index: 1;
  gap: 60px;
  align-items: center;
}

// 左侧介绍区域
.intro-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  @media (max-width: 900px) {
    display: none;
  }
}

.intro-content {
  animation: fadeInLeft 0.8s ease-out;
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
  
  .logo-icon {
    width: 48px;
    height: 48px;
  }
  
  .logo-text {
    font-size: 28px;
    font-weight: 700;
    background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.intro-title {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
  line-height: 1.2;
}

.intro-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 48px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
    transform: translateX(8px);
  }
  
  .feature-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    
    svg {
      width: 24px;
      height: 24px;
      color: var(--primary-color);
    }
  }
  
  .feature-text {
    h4 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }
    
    p {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

.chart-decoration {
  margin-top: 48px;
  opacity: 0.8;
  
  svg {
    width: 100%;
    height: 80px;
  }
}

// 右侧表单区域
.form-section {
  width: 420px;
  flex-shrink: 0;
  
  @media (max-width: 900px) {
    width: 100%;
    max-width: 420px;
  }
}

.form-container {
  padding: 40px;
  border-radius: 24px;
  animation: fadeInRight 0.8s ease-out;
  position: relative;
}

.top-actions {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.github-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
  transition: all 0.3s ease;
  
  svg {
    width: 20px;
    height: 20px;
  }
  
  &:hover {
    background: var(--glass-bg-hover);
    border-color: var(--glass-border-hover);
    color: var(--text-primary);
    transform: translateY(-2px);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.form-header {
  text-align: center;
  margin-bottom: 32px;
  
  h2 {
    font-size: 26px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }
  
  p {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  
  :deep(.el-input__wrapper) {
    padding: 4px 12px;
    height: 48px;
    border-radius: 12px;
    background: var(--glass-bg);
    border: 1px solid var(--glass-border);
    box-shadow: none;
    
    .el-input__inner {
      font-size: 15px;
      color: var(--text-primary);
      
      &::placeholder {
        color: var(--text-muted);
      }
    }
    
    .el-input__prefix,
    .el-input__suffix {
      color: var(--text-muted);
    }
    
    &:hover {
      border-color: var(--glass-border-hover);
    }
    
    &.is-focus {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.15);
    }
  }
}

// 深色模式下输入框特殊处理
.dark .form-group {
  :deep(.el-input__wrapper) {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
    
    .el-input__inner {
      color: #f1f5f9;
      -webkit-text-fill-color: #f1f5f9;
      
      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }
      
      // Chrome 自动填充样式修复
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px rgba(30, 30, 46, 1) inset !important;
        -webkit-text-fill-color: #f1f5f9 !important;
        caret-color: #f1f5f9;
        transition: background-color 5000s ease-in-out 0s;
      }
    }
    
    .el-input__prefix,
    .el-input__suffix {
      color: rgba(255, 255, 255, 0.5);
    }
    
    &:hover {
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    &.is-focus {
      border-color: var(--primary-color);
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

// 浅色模式下 Chrome 自动填充样式修复
.light .form-group {
  :deep(.el-input__wrapper) {
    .el-input__inner {
      // Chrome 自动填充样式修复
      &:-webkit-autofill,
      &:-webkit-autofill:hover,
      &:-webkit-autofill:focus,
      &:-webkit-autofill:active {
        -webkit-box-shadow: 0 0 0 30px rgba(255, 255, 255, 0.9) inset !important;
        -webkit-text-fill-color: #1e293b !important;
        caret-color: #1e293b;
        transition: background-color 5000s ease-in-out 0s;
      }
    }
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 10px;
  color: #ef4444;
  font-size: 14px;
  
  .el-icon {
    font-size: 18px;
  }
}

.submit-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  margin-top: 8px;
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-secondary);
  
  a {
    color: var(--primary-color);
    font-weight: 500;
    margin-left: 4px;
    transition: color 0.2s;
    
    &:hover {
      color: var(--accent-color);
    }
  }
}


// 深色模式调整
.dark {
  .feature-item {
    .feature-icon {
      background: linear-gradient(135deg, rgba(129, 140, 248, 0.2), rgba(192, 132, 252, 0.15));
    }
  }
}
</style>
