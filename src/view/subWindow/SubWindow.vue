<template>
  <div class="container-sub-window">
    <CircleProgress
      :percentage="app_store.sub_windows.progress"
      :size="100"
      :text="app_store.flag_detecting ? '暂停检测' : '继续检测'"
      :color="app_store.flag_detecting ? '#F56C6C' : '#67C23A'"
    />
    <div style="height: 30px">
      <span>{{ app_store.sub_windows.notification }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import CircleProgress from "@/components/CircleProgress.vue";
import use_app_store from "@/store/app";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import { computed, ref, watch } from "vue";

const app_store = use_app_store();
const display_progress = ref(false);
const display_notification = computed(() => {
  return !display_progress.value;
});
let hideTimer: number | null = null;

async function show_window() {
  await getCurrentWindow().show();
}

async function hide_window() {
  await getCurrentWindow().hide();
}

watch(
  () => app_store.sub_windows.x,
  (newVal) => {
    getCurrentWindow().setPosition(
      new LogicalPosition(newVal, app_store.sub_windows.y)
    );
  }
);

// 显示 sub-window
watch(
  () => app_store.sub_windows.progress,
  (newVal) => {
    if (newVal) {
      display_progress.value = true;
      show_window();
      // 清除之前的定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      // 设置新的定时器
      hideTimer = setTimeout(() => {
        hide_window();
      }, 300);
    }
  }
);

watch(
  () => app_store.sub_windows.notification,
  (newVal) => {
    if (newVal) {
      display_progress.value = false;
      show_window();
      // 清除之前的定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      // 设置新的定时器
      hideTimer = setTimeout(() => {
        hide_window();
        app_store.sub_windows.notification = "";
      }, 1000);
    }
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
  flex-direction: column;
}
</style>
