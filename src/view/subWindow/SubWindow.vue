<template>
  <div class="container-sub-window">
    <NProgress
      type="circle"
      :percentage="app_store.sub_windows.progress"
      style="height: 100px; width: 100px"
    >
      <span style="text-align: center">{{
        app_store.flag_detecting ? "继续检测" : "暂停检测"
      }}</span>
    </NProgress>
  </div>
</template>

<script setup lang="ts">
import use_app_store from "@/store/app";
import { watch } from "vue";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";

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
}
</style>
