<script setup lang="ts">
import type { MenuOption } from "naive-ui";
import { NMenu } from "naive-ui";
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const menuOptions: MenuOption[] = [
  {
    label: "首页",
    key: "/",
  },
  {
    label: "操作指南",
    key: "/guide",
  },
  // {
  //   label: "开发",
  //   key: "/update",
  // }
];

const activeKey = ref("/");

const handleUpdateValue = (key: string) => {
  activeKey.value = key;
  router.push(key);
};
</script>

<template>
  <n-menu
    :options="menuOptions"
    v-model:value="activeKey"
    mode="vertical"
    @update:value="handleUpdateValue"
  />
</template>

<style scoped></style>
