<template>
  <div class="circle-progress">
    <svg :width="size" :height="size" viewBox="0 0 100 100">
      <!-- 背景圆环 -->
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="backgroundColor"
        :stroke-width="strokeWidth"
      />
      <!-- 进度圆环 -->
      <circle
        cx="50"
        cy="50"
        :r="radius"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        class="progress"
      />
      <!-- 中心文本 -->
      <slot>
        <text x="50" y="50" text-anchor="middle" dominant-baseline="middle" class="progress-text">
          {{ text }}
          {{ percentage }}%
        </text>
      </slot>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  text?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 100,
  strokeWidth: 6,
  color: '#409eff',
  backgroundColor: '#e5e9f2',
  text: ''
});

const radius = computed(() => 50 - props.strokeWidth / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => 
  circumference.value * (1 - props.percentage / 100)
);
</script>

<style lang="scss" scoped>
.circle-progress {
  display: inline-block;
  
  .progress {
    transform: rotate(-90deg);
    transform-origin: center;
  }
  
  .progress-text {
    font-size: 14px;
    fill: #606266;
  }
}
</style> 