<template>
  <div class="container-sub-window">
    <CircleProgress
      v-if="display_progress"
      :percentage="app_store.sub_windows.progress"
      :size="100"
      :text="app_store.flag_detecting ? '暂停检测' : '继续检测'"
    />
    <div v-if="display_notification">
      {{ app_store.sub_windows.notification }}
    </div>
  </div>
</template>

<script setup lang="ts">
import CircleProgress from "@/components/CircleProgress.vue";
import use_app_store from "@/store/app";
import { getCurrentWindow, LogicalPosition } from "@tauri-apps/api/window";
import { watch, ref } from "vue";

const app_store = use_app_store();
const display_progress = ref(false);
const display_notification = ref(false);
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
      }, 500);
    }
  }
);

watch(
  () => app_store.sub_windows.notification,
  (newVal) => {
    if (newVal) {
      display_notification.value = true;
      show_window();
      // 清除之前的定时器
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      // 设置新的定时器
      hideTimer = setTimeout(() => {
        hide_window();
      }, 500);
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
}
</style>
