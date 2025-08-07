<template>
  <n-card class="gesture-card" :bordered="false">
    <n-space :wrap="false" class="gesture-content">
      <div class="gesture-icon" :class="{ 'double-hand': isDoubleHand }">
        <slot name="icon"></slot>
      </div>
      <div class="gesture-info">
        <h3>{{ title }}</h3>
        <p>{{ description }}</p>
        <slot name="extra"></slot>
      </div>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  isDoubleHand?: boolean;
}>();
</script>

<style scoped lang="scss">
.gesture-card {
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #f8faff, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e9f2;
  border-radius: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(64, 152, 252, 0.15);
    border-color: #4098fc;
  }
}

.gesture-content {
  padding: 12px;
}

.gesture-icon {
  background: rgba(64, 152, 252, 0.1);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(64, 152, 252, 0.2);
}

.gesture-info {
  flex: 1;

  h3 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    color: #2c3e50;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
}

.double-hand {
  display: flex;
  gap: 8px;

  :deep(svg) {
    width: 32px;
    height: 32px;
  }
}

.flipped {
  transform: scaleX(-1);
}
</style>
