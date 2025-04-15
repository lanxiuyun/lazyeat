<script setup lang="ts">
import { Power } from "@icon-park/vue-next";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { watch } from "vue";
import { use_app_store } from "@/store/app";

const app_store = use_app_store();

watch(
  () => app_store.config.auto_start,
  async (value) => {
    if (value) {
      await enable();
    } else {
      await disable();
    }
  }
);
</script>

<template>
  <n-space align="center" style="display: flex; align-items: center">
    <span style="display: flex; align-items: center">
      <n-icon size="20" style="margin-right: 8px">
        <Power />
      </n-icon>
      <span>{{ $t("开机自启动") }}</span>
    </span>
    <n-switch v-model:value="app_store.config.auto_start" />
  </n-space>
</template>
