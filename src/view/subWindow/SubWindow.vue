<template>
  <div class="container-sub-window">
    <h1>子窗口</h1>
    <span> camera: {{ app_store.cameras }}</span>
    <span> camera-index: {{ app_store.config.selected_camera_id }}</span>
  </div>
</template>

<script setup lang="ts">
import use_app_store from "@/store/app";

const app_store = use_app_store();
</script>

<style lang="scss" scoped>
.container-sub-window {
  width: 100%;
  height: 100%;
}
</style>
