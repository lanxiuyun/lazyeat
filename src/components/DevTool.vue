<template>
  <div
    v-if="is_dev"
    class="dev-tool"
    :class="{ 'dev-tool--expanded': isExpanded }"
  >
    <div class="dev-tool__toggle" @click="toggleToolbox">
      <span class="dev-tool__icon">🔧</span>
    </div>
    <!-- <div class="dev-tool__content" v-if="isExpanded">
      <div class="dev-tool__item" @click="createSubWindowClick">创建子窗口</div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { createSubWindow } from "@/utils/subWindow";
import { ref } from "vue";

const is_dev = import.meta.env.DEV;
const isExpanded = ref(false);

const toggleToolbox = () => {
  isExpanded.value = !isExpanded.value;
};

const createSubWindowClick = () => {
  createSubWindow("/sub-window", "subWindow");
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