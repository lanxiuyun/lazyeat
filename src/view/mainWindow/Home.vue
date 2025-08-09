<template>
  <div class="home-container">
    <div class="sticky-header">
      <h2>首页</h2>
    </div>

    <n-scrollbar>
      <n-card class="ad-container">
        <iframe
          :src="
            is_dev
              ? '/lazyeat-ad/html/index.html'
              : 'https://lazyeat-ad.pages.dev/'
          "
          width="100%"
          height="100%"
        ></iframe>
      </n-card>

      <n-card
        class="control-panel"
        hoverable
        v-show="app_store.config.show_window"
      >
        <VideoDetector />
      </n-card>

      <!-- 手势识别控制 -->
      <n-card class="control-panel" hoverable>
        <n-space vertical>
          <n-space justify="space-between" align="center">
            <h2 class="section-title">{{ $t("手势识别控制") }}</h2>
            <n-switch v-model:value="app_store.mission_running" size="large">
              <template #checked>{{ $t("运行中") }}</template>
              <template #unchecked>{{ $t("已停止") }}</template>
            </n-switch>
          </n-space>

          <n-space align="center" class="settings-row">
            <n-space align="center" style="display: flex; align-items: center">
              <AutoStart />
            </n-space>

            <n-space align="center" style="display: flex; align-items: center">
              <span style="display: flex; align-items: center">
                <n-icon size="20" style="margin-right: 8px">
                  <Browser />
                </n-icon>
                <span>{{ $t("显示识别窗口") }}</span>
              </span>
              <n-switch v-model:value="app_store.config.show_window" />
            </n-space>

            <n-space align="center" style="display: flex; align-items: center">
              <span style="display: flex; align-items: center">
                <n-icon size="20" style="margin-right: 8px">
                  <Camera />
                </n-icon>
                <span>{{ $t("摄像头选择") }}</span>
              </span>
              <n-select
                v-model:value="app_store.config.selected_camera_id"
                :options="camera_options"
                :disabled="app_store.mission_running"
                style="width: 250px"
              />
            </n-space>
          </n-space>
        </n-space>
      </n-card>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import AutoStart from "@/components/AutoStart.vue";
import VideoDetector from "@/hand_landmark/VideoDetector.vue";
import { use_app_store } from "@/store/app";
import { Browser, Camera } from "@icon-park/vue-next";
import { computed, onMounted } from "vue";

const is_dev = computed(() => import.meta.env.DEV);
const app_store = use_app_store();
// 计算属性：摄像头选项
const camera_options = computed(() => {
  return app_store.cameras.map((camera) => ({
    label: camera.label || `摄像头 ${camera.deviceId.slice(0, 4)}`,
    value: camera.deviceId,
  }));
});

const getCameras = async () => {
  try {
    // 申请获取摄像头权限
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    stream.getTracks().forEach((track) => track.stop());

    const devices = await navigator.mediaDevices.enumerateDevices();
    app_store.cameras = devices.filter(
      (device) => device.kind === "videoinput"
    );
  } catch (error) {
    console.error("获取摄像头列表失败:", error);
  }
};

onMounted(async () => {
  await getCameras();
});
</script>

<style scoped>
.control-panel {
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 1.2em;
}

.settings-row {
  flex-wrap: wrap;
  gap: 16px;
}
</style>

<style scoped lang="scss">
// 广告区域
.ad-container {
  height: 260px;
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
