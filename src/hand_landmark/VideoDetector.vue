<template>
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
</template>

<script setup>
import {
  Detector,
  HandGesture,
  gestureTrigger,
} from "@/hand_landmark/detector";
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
const lastFpsTime = ref(0);

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

// 手势处理相关方法
const handleGesture = (gesture, detection) => {
  if (detection.rightHand) {
    gestureTrigger.handleGesture(gesture, detection.rightHand);
  } else if (detection.leftHand) {
    gestureTrigger.handleGesture(gesture, detection.leftHand);
  }
};

const getEffectiveGesture = (rightHandGesture, leftHandGesture) => {
  // 如果左右手都是暂停手势，才执行暂停手势
  if (
    rightHandGesture === HandGesture.STOP_GESTURE &&
    leftHandGesture === HandGesture.STOP_GESTURE
  ) {
    return HandGesture.STOP_GESTURE;
  }

  // 如果右手手势不是 OTHER 且不是 STOP_GESTURE，则返回右手手势
  if (
    rightHandGesture !== HandGesture.OTHER &&
    rightHandGesture !== HandGesture.STOP_GESTURE
  ) {
    return rightHandGesture;
  }
  // 如果右手手势是 STOP_GESTURE，则返回 OTHER
  if (rightHandGesture === HandGesture.STOP_GESTURE) {
    return HandGesture.OTHER;
  }
  // 如果右手手势是 OTHER，再检查左手手势
  if (
    leftHandGesture !== HandGesture.OTHER &&
    leftHandGesture !== HandGesture.STOP_GESTURE
  ) {
    return leftHandGesture;
  }
  // 如果左手手势是 STOP_GESTURE，则返回 OTHER
  if (leftHandGesture === HandGesture.STOP_GESTURE) {
    return HandGesture.OTHER;
  }
  // 如果左右手都没有有效手势，则返回 OTHER
  return HandGesture.OTHER;
};

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

const drawFPS = (ctx) => {
  const now = performance.now();
  if (lastFpsTime.value) {
    const delta = now - lastFpsTime.value;
    FPS.value = Math.round(1000 / delta);
  }
  lastFpsTime.value = now;

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`FPS: ${FPS.value}`, 10, 30);
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

    // 手势识别和处理
    const rightHandGesture = detection.rightHand
      ? Detector.getSingleHandGesture(detection.rightHand)
      : HandGesture.OTHER;
    const leftHandGesture = detection.leftHand
      ? Detector.getSingleHandGesture(detection.leftHand)
      : HandGesture.OTHER;

    const effectiveGesture = getEffectiveGesture(
      rightHandGesture,
      leftHandGesture
    );
    handleGesture(effectiveGesture, detection);
  }

  requestAnimationFrame(predictWebcam);
};

watch(
  () => app_store.config.selected_camera_id,
  async () => {
    stopCamera();
  }
);

// 监听 flag_detecting 的变化
watch(
  () => app_store.flag_detecting,
  async (newValue) => {
    if (newValue) {
      await initializeCamera();
    } else {
      stopCamera();
    }
  }
);

// 生命周期钩子
onMounted(async () => {
  await detector.value.initialize();
  // 如果 flag_detecting 为 true，则初始化摄像头
  if (app_store.flag_detecting) {
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
}
</style>
