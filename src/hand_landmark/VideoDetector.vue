<template>
  <div v-if="!camera_premission">
    <n-alert title="获取摄像头权限失败" type="error">
      <p>请尝试以下步骤解决:</p>
      <ol>
        <!-- <li>
          删除文件夹
          <n-tag size="small">
            %LOCALAPPDATA%\com.Lazyeat.maplelost\EBWebView
          </n-tag>
        </li> -->
        <li>
          进入<n-tag size="small">%LOCALAPPDATA%\com.Lazyeat.maplelost</n-tag>
        </li>
        <li>删除<n-tag size="small">EBWebView</n-tag>文件夹</li>
        <li>重新启动程序</li>
      </ol>
      <p>
        如果问题仍然存在,请加入QQ群询问:
        <a href="https://jq.qq.com/?_wv=1027&k=452246065" target="_blank"
          >452246065</a
        >
      </p>
    </n-alert>
  </div>

  <div v-else>
    <span>FPS: {{ FPS }}</span>
    <div class="hand-detection">
      <video
        ref="videoElement"
        class="input-video"
        :width="app_store.VIDEO_WIDTH"
        :height="app_store.VIDEO_HEIGHT"
        autoplay
        style="display: none"
      ></video>
      <canvas
        ref="canvasElement"
        class="output-canvas"
        :width="app_store.VIDEO_WIDTH"
        :height="app_store.VIDEO_HEIGHT"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { Detector } from "@/hand_landmark/detector";
import { use_app_store } from "@/store/app";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// 常量定义
const app_store = use_app_store();

// 组件状态
const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(new Detector());
const lastVideoTime = ref(-1);
const currentStream = ref(null);
const FPS = ref(0);
const camera_premission = ref(false);

onMounted(() => {
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    camera_premission.value = true;
    stream.getTracks().forEach((track) => track.stop());
  });
});

// 绘制相关方法
const drawMouseMoveBox = (ctx) => {
  ctx.strokeStyle = "rgb(255, 0, 255)";
  ctx.lineWidth = 2;
  ctx.strokeRect(
    app_store.config.mouse_move_boundary,
    app_store.config.mouse_move_boundary,
    app_store.VIDEO_WIDTH - 2 * app_store.config.mouse_move_boundary,
    app_store.VIDEO_HEIGHT - 2 * app_store.config.mouse_move_boundary
  );
};

const frameCount = ref(0);
const fpsUpdateInterval = 1000; // 每秒更新一次 FPS
const lastFpsTime = ref(0);
const drawFPS = (ctx) => {
  const now = performance.now();
  frameCount.value++;

  if (now - lastFpsTime.value >= fpsUpdateInterval) {
    FPS.value = frameCount.value;
    frameCount.value = 0;
    lastFpsTime.value = now;
  }
};

const drawHandLandmarks = (ctx, hand, color) => {
  hand.landmarks.forEach((landmark) => {
    ctx.beginPath();
    ctx.arc(
      landmark.x * app_store.VIDEO_WIDTH,
      landmark.y * app_store.VIDEO_HEIGHT,
      5,
      0,
      2 * Math.PI
    );
    ctx.fillStyle = color;
    ctx.fill();
  });
};

// 主要检测逻辑
const predictWebcam = async () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  const ctx = canvas.getContext("2d");

  if (video.currentTime !== lastVideoTime.value) {
    lastVideoTime.value = video.currentTime;
    const detection = await detector.value.detect(video);

    if (app_store.config.show_window) {
      // 绘制视频帧
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 绘制FPS
      drawFPS(ctx);

      // 绘制鼠标移动框
      drawMouseMoveBox(ctx);

      // 绘制手势点
      if (detection.leftHand) {
        drawHandLandmarks(ctx, detection.leftHand, "red");
      }
      if (detection.rightHand) {
        drawHandLandmarks(ctx, detection.rightHand, "blue");
      }
    }

    // 手势处理
    await detector.value.process(detection);
  }

  requestAnimationFrame(predictWebcam);
};

const initializeCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: app_store.config.selected_camera_id
          ? { exact: app_store.config.selected_camera_id }
          : undefined,
        width: app_store.VIDEO_WIDTH,
        height: app_store.VIDEO_HEIGHT,
      },
      audio: false,
    });
    currentStream.value = stream;
    videoElement.value.srcObject = stream;
    videoElement.value.addEventListener("loadeddata", predictWebcam);
  } catch (error) {
    console.error("无法访问摄像头:", error);
  }
};

const stopCamera = () => {
  if (videoElement.value?.srcObject) {
    videoElement.value.srcObject.getTracks().forEach((track) => track.stop());
  }
};

watch(
  () => app_store.config.selected_camera_id,
  async () => {
    stopCamera();
  }
);

// 监听 mission_running 的变化
watch(
  () => app_store.mission_running,
  async (newValue) => {
    if (newValue) {
      await initializeCamera();
      app_store.flag_detecting = true;
    } else {
      stopCamera();
    }
  }
);

// 生命周期钩子
onMounted(async () => {
  await detector.value.initialize();
  // 如果 mission_running 为 true，则初始化摄像头
  if (app_store.mission_running) {
    await initializeCamera();
  }
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.hand-detection {
  position: relative;
  width: v-bind('app_store.VIDEO_WIDTH + "px"');
  height: v-bind('app_store.VIDEO_HEIGHT + "px"');
}

.output-canvas {
  position: absolute;
  transform: scaleX(-1);
}
</style>
