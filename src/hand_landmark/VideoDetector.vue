<template>
  <div class="hand-detection">
    <div class="camera-select">
      <select v-model="selectedCameraId" @change="switchCamera">
        <option
          v-for="camera in cameras"
          :key="camera.deviceId"
          :value="camera.deviceId"
        >
          {{ camera.label || `摄像头 ${camera.deviceId.slice(0, 4)}` }}
        </option>
      </select>
    </div>
    <video
      ref="videoElement"
      class="input-video"
      width="640"
      height="480"
      autoplay
      style="display: none"
    ></video>
    <canvas
      ref="canvasElement"
      class="output-canvas"
      width="640"
      height="480"
    ></canvas>
  </div>
</template>

<script setup>
import { Detector, HandGesture } from "@/hand_landmark/detector";
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useAppStore } from "@/store/app";

// 常量定义
const appStore = useAppStore();
const VIDEO_WIDTH = 640;
const VIDEO_HEIGHT = 480;
const GESTURE_DEBOUNCE_TIME = 500; // 手势防抖时间（毫秒）

// 组件状态
const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(new Detector());
const lastVideoTime = ref(-1);
const cameras = ref([]);
const selectedCameraId = ref("1");
const currentStream = ref(null);
const fps = ref(0);
const lastFpsTime = ref(0);
const lastGestureTime = ref(0);

// 摄像头相关方法
const getCameras = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true });
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter((device) => device.kind === "videoinput");
    if (cameras.value.length > 0) {
      selectedCameraId.value = cameras.value[0].deviceId;
    }
  } catch (error) {
    console.error("获取摄像头列表失败:", error);
  }
};

const initializeCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedCameraId.value
          ? { exact: selectedCameraId.value }
          : undefined,
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
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
const handleGesture = (gesture) => {
  const now = Date.now();
  if (now - lastGestureTime.value < GESTURE_DEBOUNCE_TIME) {
    return;
  }
  lastGestureTime.value = now;

  // 手势动作映射
  const gestureActions = {
    [HandGesture.ONLY_INDEX_UP]: () => console.log("食指举起"),
    [HandGesture.INDEX_AND_MIDDLE_UP]: () => console.log("食指和中指同时竖起"),
    [HandGesture.CLICK_GESTURE_SECOND]: () => console.log("点击"),
    [HandGesture.THREE_FINGERS_UP]: () => console.log("三根手指同时竖起"),
    [HandGesture.FOUR_FINGERS_UP]: () => console.log("四根手指同时竖起"),
    [HandGesture.STOP_GESTURE]: () => console.log("暂停/开始 识别"),
    [HandGesture.VOICE_GESTURE_START]: () => console.log("开始语音识别"),
    [HandGesture.VOICE_GESTURE_STOP]: () => console.log("结束语音识别"),
    [HandGesture.DELETE_GESTURE]: () => console.log("删除"),
  };

  const action = gestureActions[gesture];
  if (action) {
    action();
  } else {
    console.log("其他手势");
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

  // 单手手势识别 优先识别右手
  if (
    rightHandGesture !== HandGesture.OTHER &&
    rightHandGesture !== HandGesture.STOP_GESTURE
  ) {
    return rightHandGesture;
  }

  if (
    leftHandGesture !== HandGesture.OTHER &&
    leftHandGesture !== HandGesture.STOP_GESTURE
  ) {
    return leftHandGesture;
  }

  return HandGesture.OTHER;
};

// 绘制相关方法
const drawFPS = (ctx) => {
  const now = performance.now();
  if (lastFpsTime.value) {
    const delta = now - lastFpsTime.value;
    fps.value = Math.round(1000 / delta);
  }
  lastFpsTime.value = now;

  ctx.font = "20px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(`FPS: ${fps.value}`, 10, 30);
};

const drawHandLandmarks = (ctx, hand, color) => {
  hand.landmarks.forEach((landmark) => {
    ctx.beginPath();
    ctx.arc(
      landmark.x * VIDEO_WIDTH,
      landmark.y * VIDEO_HEIGHT,
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

    // 绘制视频帧
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 绘制FPS
    drawFPS(ctx);

    // 绘制手势点
    if (detection.leftHand) {
      drawHandLandmarks(ctx, detection.leftHand, "red");
    }
    if (detection.rightHand) {
      drawHandLandmarks(ctx, detection.rightHand, "blue");
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
    if (effectiveGesture !== HandGesture.OTHER) {
      handleGesture(effectiveGesture);
    }
  }

  requestAnimationFrame(predictWebcam);
};

const switchCamera = async () => {
  stopCamera();
  await initializeCamera();
};

// 生命周期钩子
onMounted(async () => {
  await getCameras();
  await detector.value.initialize();
  await initializeCamera();
});

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.hand-detection {
  position: relative;
  width: 640px;
  height: 480px;
}

.camera-select {
  top: 10px;
  left: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
}

.camera-select select {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
  background: white;
}

.output-canvas {
  position: absolute;
}
</style>
