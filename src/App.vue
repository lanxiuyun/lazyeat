<script setup lang="ts">
import { ElContainer, ElMain, ElAside } from "element-plus";
import AppMenu from "./components/Menu.vue";
import Home from "./view/Home.vue";
import pyApi from "./py_api";
import { onMounted, ref } from "vue";
import { getCurrentWindow } from "@tauri-apps/api/window";
import use_app_store from "./store/app";
import {
  saveWindowState,
  StateFlags,
  restoreStateCurrent,
} from "@tauri-apps/plugin-window-state";
import { getVersion } from "@tauri-apps/api/app";

const appVersion = ref("");
const ready = ref(false);
const is_dev = import.meta.env.DEV;

onMounted(async () => {
  appVersion.value = await getVersion();
  ready.value = await pyApi.ready();

  const timer = setInterval(async () => {
    ready.value = await pyApi.ready();
    if (ready.value) {
      clearInterval(timer);
    }
  }, 1000);

  await getCurrentWindow().onCloseRequested(async () => {
    await saveWindowState(StateFlags.ALL);
    await pyApi.shutdown();
  });
});

// 窗口恢复上一次状态
onMounted(() => {
  restoreStateCurrent(StateFlags.ALL);
});

// app_store 数据加载
import { watch } from "vue";
import { LazyStore } from "@tauri-apps/plugin-store";

const app_store = use_app_store();
const app_store_json = new LazyStore("settings.json");
onMounted(async () => {
  const config_data = await app_store_json.get("config");
  console.log("config_data", config_data);
  if (config_data) {
    app_store.config = JSON.parse(JSON.stringify(config_data));
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
  sendNotification,
} from "@tauri-apps/plugin-notification";

enum WsDataType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

interface WsData {
  type: WsDataType;
  msg: string;
  duration?: number;
  title?: string;
  data?: any;
}

onMounted(async () => {
  // when using `"withGlobalTauri": true`, you may use
  // const { isPermissionGranted, requestPermission, sendNotification, } = window.__TAURI__.notification;

  // Do you have permission to send a notification?
  let permissionGranted = await isPermissionGranted();

  // If not we need to request it
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === "granted";
  }
});

let ws: WebSocket | null = null;
const connectWebSocket = () => {
  // 尝试创建 WebSocket 实例，并捕获可能的异常
  try {
    ws = new WebSocket("ws://127.0.0.1:62334/ws_lazyeat");
    ws.onmessage = (event: MessageEvent) => {
      const response: WsData = JSON.parse(event.data);
      sendNotification({
        title: response.title || "Lazyeat",
        body: response.msg,
      });
    };
    ws.onopen = () => {
      console.log("ws_lazyeat connected");
      ws?.send("ws_lazyeat start");
    };
    ws.onclose = () => {
      console.log("ws_lazyeat closed, retrying...");
      ws = null; // 清除当前 WebSocket 实例
      setTimeout(connectWebSocket, 3000); // 每隔 3 秒重试一次
    };
    ws.onerror = (error) => {
      console.error("ws_lazyeat error:", error);
      ws?.close(); // 如果发生错误，主动关闭连接以触发重连逻辑
    };
  } catch (error) {
    console.error("Failed to create WebSocket instance:", error);
    ws = null; // 确保 ws 被设置为 null
    setTimeout(connectWebSocket, 1000); // 在实例化失败时重试
  }
};

onMounted(() => {
  connectWebSocket();
});
</script>

<template>
  <n-spin :show="!ready" size="large">
    <template #description> 手势识别模块加载中... </template>

    <el-container v-if="ready">
      <el-aside width="200px">
        <div class="aside-header">
          <img
            style="width: 30px; height: 30px"
            src="/lazyeat.png"
            alt="logo"
            class="logo"
          />
          <span class="logo-text">Lazyeat {{ appVersion }}</span>
        </div>
        <AppMenu />
      </el-aside>
      <el-container>
        <el-main>
          <n-card class="ad-container">
            <iframe
              :src="
                is_dev
                  ? '/lazyeat_ad/html/index.html'
                  : 'https://lazyeat-ad.pages.dev/'
              "
              width="100%"
              height="100%"
            ></iframe>
          </n-card>
          <Home />
        </el-main>
      </el-container>
    </el-container>
  </n-spin>
</template>

<style lang="scss">
.n-spin-container {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.n-spin-content {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>

<style scoped lang="scss">
.el-container {
  height: 100%;
  width: 100%;
}

.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
}

.logo {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.logo-text {
  font-size: 16px;
}

// 广告区域
.ad-container {
  height: 220px;
  background-color: transparent;
  margin-bottom: 24px;

  iframe {
    border: none;
  }

  :deep(.n-card__content) {
    padding: 0 !important;
    padding-top: 0 !important;
  }
}
</style>
