<template>
  <div class="container-sub-window">
    <NProgress
      type="circle"
      :percentage="app_store.sub_windows.progress"
      :show-indicator="false"
      style="height: 30px; width: 30px"
    />
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
