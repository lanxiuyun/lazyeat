<script setup lang="ts">
import DevTool from "@/components/DevTool.vue";
import AppMenu from "@/components/Menu.vue";
import pyApi from "@/py_api";
import use_app_store from "@/store/app";
import { getVersion } from "@tauri-apps/api/app";
import {
  getCurrentWindow,
  LogicalPosition,
  LogicalSize,
} from "@tauri-apps/api/window";
import { LazyStore } from "@tauri-apps/plugin-store";
import { ElAside, ElContainer, ElMain } from "element-plus";
import { onMounted, ref, watch } from "vue";

const is_dev = import.meta.env.DEV;
const appVersion = ref("");
const app_store = use_app_store();
const ready = ref(false);

onMounted(async () => {
  ready.value = await pyApi.ready();

  const timer = setInterval(async () => {
    ready.value = await pyApi.ready();
    if (ready.value) {
      clearInterval(timer);
    }
  }, 500);

  await getCurrentWindow().onCloseRequested(async () => {
    // 保存窗口状态
    const factor = await getCurrentWindow().scaleFactor();
    const position = (await getCurrentWindow().innerPosition()).toLogical(
      factor
    );
    const size = (await getCurrentWindow().innerSize()).toLogical(factor);
    await window_store_json.set("window_state", {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    });

    if (!is_dev) {
      await pyApi.shutdown();
    }
  });
});

// 窗口恢复上一次位置
const window_store_json = new LazyStore("window_state.json");
onMounted(async () => {
  appVersion.value = await getVersion();
  const window_state = await window_store_json.get("window_state");
  if (window_state) {
    let new_x = (window_state as any)?.x ?? 100;
    let new_y = (window_state as any)?.y ?? 100;
    const screen_width = window.screen.width;
    const screen_height = window.screen.height;

    // console.log("screen_width", screen_width);
    // console.log("screen_height", screen_height);
    // console.log("new_x", new_x);
    // console.log("new_y", new_y);

    // 如果窗口位置超出屏幕，则将窗口位置设置为100，100
    if (new_x <= 0) {
      new_x = 100;
    } else if (new_x >= screen_width) {
      new_x = 100;
    }
    if (new_y <= 0) {
      new_y = 100;
    } else if (new_y >= screen_height) {
      new_y = 100;
    }

    getCurrentWindow().setPosition(new LogicalPosition(new_x, new_y));
    getCurrentWindow().setSize(
      new LogicalSize(
        (window_state as any)?.width ?? 100,
        (window_state as any)?.height ?? 100
      )
    );
  }
});

// app_store 数据加载
const app_store_json = new LazyStore("settings.json");
onMounted(async () => {
  const config_data = await app_store_json.get("config");
  console.log("config_data", config_data);
  if (config_data) {
    Object.assign(app_store.config, JSON.parse(JSON.stringify(config_data)));
  }
});

watch(
  () => app_store.config,
  async (value) => {
    await app_store_json.set("config", value);
    app_store_json.save();
  },
  { deep: true }
);

// 通知
import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";

onMounted(async () => {
  let permissionGranted = await isPermissionGranted();
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }
});

// 使用默认浏览器打开 iframe 中的 <a> 标签
import { openUrl } from "@tauri-apps/plugin-opener";
window.addEventListener("message", async function (e) {
  const url = e.data;
  if (url) {
    await openUrl(url);
  }
});

// 创建子窗口
import { createSubWindow } from "@/utils/subWindow";
const subWindow = ref(null);
onMounted(async () => {
  if (!subWindow.value) {
    subWindow.value = (await createSubWindow(
      "/sub-window",
      "subWindow"
    )) as any;
  }
});
</script>

<template>
  <DevTool />
  <n-spin :show="!ready" size="large">
    <el-container class="app-container">
      <el-aside width="48px">
        <AppMenu style="flex-grow: 1" />
        <div
          v-if="app_store.is_macos()"
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            margin: 5px;
          "
        >
          Mac by
          <a
            class="contributor-link"
            href="https://github.com/mxue12138"
            target="_blank"
          >
            @mxue12138</a
          >
          <a
            class="contributor-link"
            href="https://github.com/GEYOUR"
            target="_blank"
            >@GEYOUR</a
          >
        </div>
      </el-aside>
      <el-container class="main-container">
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
    <template #description> 手势识别模块加载中... </template>
  </n-spin>
</template>

<style lang="scss">
.n-spin-container {
  height: 100%;
  width: 100%;
}

.n-spin-content {
  height: 100%;
  width: 100%;
}
</style>

<style scoped lang="scss">
.el-container {
  height: 100%;
  width: 100%;
}

.main-container {
  min-width: 800px;
  overflow: auto;
}

.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
  display: flex;
  flex-direction: column;
}
</style>
