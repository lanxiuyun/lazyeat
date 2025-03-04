<script setup lang="ts">
import type { MenuOption } from "naive-ui";
import { NMenu } from "naive-ui";
import { ref } from "vue";

const menuOptions: MenuOption[] = [
  {
    label: "首页",
    key: "home",
  },
];

const activeKey = ref("home");
</script>

<template>
  <n-menu :options="menuOptions" v-model:value="activeKey" mode="vertical" />
</template>

<style scoped></style>
