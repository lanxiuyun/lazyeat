<script setup lang="ts">
import { TurnOn, Helpcenter, Home } from "@icon-park/vue-next";
import type { MenuOption } from "naive-ui";
import { NMenu } from "naive-ui";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { h } from "vue";

const router = useRouter();

const menuOptions: MenuOption[] = [
  {
    label: "首页",
    key: "/",
    icon: () => h(Home),
  },
  {
    label: "手势指南",
    key: "/guide",
    icon: () => h(TurnOn),
  },
  {
    label: "疑问",
    key: "/help",
    icon: () => h(Helpcenter),
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
    :collapsed="true"
    mode="vertical"
    @update:value="handleUpdateValue"
  />
</template>

<style scoped>
:deep(.i-icon) {
  width: 20px;
  height: 38px;
}
</style>
