<template>
  <router-view />
  <div
    v-if="is_dev"
    class="dev-tool"
    :class="{ 'dev-tool--expanded': isExpanded }"
  >
    <div class="dev-tool__toggle" @click="toggleToolbox">
      <span class="dev-tool__icon">🔧</span>
    </div>
    <div class="dev-tool__content" v-if="isExpanded"></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const is_dev = import.meta.env.DEV;
const isExpanded = ref(false);

const toggleToolbox = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<style scoped lang="scss">
.dev-tool {
  position: fixed;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  background-color: #fff;
  border-radius: 0 8px 8px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  z-index: 9999;

  &--expanded {
    width: 200px;
  }

  &__toggle {
    padding: 10px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #eee;
  }

  &__icon {
    font-size: 20px;
  }

  &__content {
    padding: 10px;
  }

  &__item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    margin-bottom: 5px;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #f5f5f5;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}

// 链接样式
.contributor-link {
  color: #2196f3; // 默认使用适中的蓝色
  text-decoration: none;
  transition: all 0.3s ease; // 添加过渡效果

  &:visited {
    color: #2196f3;
  }

  &:hover {
    color: #1976d2; // 悬停时使用深蓝色
  }

  &:active {
    color: #0d47a1 !important; // 点击时使用更深的蓝色 
  }
}
</style>
