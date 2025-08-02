<template>
  <div v-if="hasUpdate" class="update-popup">
    <div class="update-header">
      <span class="version-tag">v{{ updateInfo?.version }} 可用更新</span>
      <button class="close-btn" @click="closeUpdate">×</button>
    </div>
    <div class="update-content">
      <n-scrollbar>
        {{ updateInfo?.body }}
      </n-scrollbar>
    </div>
    <div class="update-footer">
      <button
        v-if="!isDownloading"
        @click="installUpdate"
        class="update-button"
      >
        <span class="download-icon">↓</span> 立即更新
      </button>
      <n-progress
        v-if="isDownloading"
        :percentage="Number(((downloaded / contentLength) * 100).toFixed(2))"
        :show-text="true"
        :height="10"
        :color="(downloaded / contentLength) * 100 > 50 ? 'green' : 'orange'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";
import { onMounted, onUnmounted, ref } from "vue";

const hasUpdate = ref(false);
const updateInfo = ref<any>(null);
const isDownloading = ref(false);
let autoCloseTimer: number | null = null;
const downloaded = ref(0);
const contentLength = ref(0);

onMounted(() => {
  checkUpdate();
});

onUnmounted(() => {
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
  }
});

async function checkUpdate() {
  try {
    const update = await check({
      headers: {
        "X-AccessKey": "9SzxzOb3pQgkOB-LU-QU1Q",
      },
      timeout: 5000,
    });
    if (update) {
      console.log(
        `发现新版本 ${update.version}，发布于 ${update.date}，更新说明：${update.body}`
      );
      hasUpdate.value = true;
      updateInfo.value = update;

      // 设置3秒后自动关闭
      autoCloseTimer = window.setTimeout(() => {
        closeUpdate();
      }, 10000);
    }
  } catch (error) {
    console.error("检查更新失败:", error);
  }
}

function closeUpdate() {
  hasUpdate.value = false;
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }
}

async function installUpdate() {
  const update = await check({
    headers: {
      "X-AccessKey": "9SzxzOb3pQgkOB-LU-QU1Q",
    },
    timeout: 5000,
  });

  // 取消自动关闭定时器
  if (autoCloseTimer) {
    clearTimeout(autoCloseTimer);
    autoCloseTimer = null;
  }

  try {
    // 重置下载进度并显示进度条
    downloaded.value = 0;
    contentLength.value = 0;
    isDownloading.value = true;

    await update?.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength.value = event.data.contentLength || 0;
          break;
        case "Progress":
          downloaded.value += event.data.chunkLength;
          break;
        case "Finished":
          break;
      }
    });

    console.log("更新已安装，准备重启应用");
    await relaunch();
  } catch (error) {
    console.error("安装更新失败:", error);
    isDownloading.value = false;
  }
}
</script>

<style scoped>
.update-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 300px;
  background-color: rgba(0, 222, 113);
  color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  overflow: auto;
}

.update-header {
  display: flex;
  align-items: center;
  padding: 12px 16px 8px;
  position: relative;
}

.version-tag {
  font-size: 18px;
  font-weight: bold;
  flex-grow: 1;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
}

.close-btn:hover {
  opacity: 1;
}

.update-content {
  padding: 0 16px 12px;
  font-size: 14px;
  line-height: 1.5;
  height: 100px;
}

.update-footer {
  padding: 0 16px 16px;
}

.update-button {
  background-color: white;
  color: #00b248;
  border: none;
  padding: 8px 16px;
  text-align: center;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.update-button:hover {
  background-color: #f5f5f5;
}

.download-icon {
  margin-right: 6px;
}
</style>
