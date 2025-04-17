<template>
  <div class="container-sub-window">
    <CircleProgress
      :percentage="app_store.sub_windows.progress"
      :size="100"
      :text="app_store.flag_detecting ? '暂停检测' : '继续检测'"
    />
  </div>
</template>

<script setup lang="ts">
import CircleProgress from "@/components/CircleProgress.vue";
import use_app_store from "@/store/app";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import { watch } from "vue";

const app_store = use_app_store();

watch(
  () => app_store.sub_windows.x,
  (newVal) => {
    getCurrentWindow().setPosition(
      new LogicalPosition(newVal, app_store.sub_windows.y)
    );
  }
);
</script>

<style lang="scss" scoped>
.container-sub-window {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
