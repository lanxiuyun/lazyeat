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

const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(new Detector());
const lastVideoTime = ref(-1);
const cameras = ref([]);
const selectedCameraId = ref("1");
const currentStream = ref(null);
const lastGestureTime = ref(0);
const GESTURE_DEBOUNCE_TIME = 500; // 手势防抖时间（毫秒）

const getCameras = async () => {
  try {
    // 先请求摄像头权限
    await navigator.mediaDevices.getUserMedia({ video: true });

    // 获取设备列表
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter((device) => device.kind === "videoinput");
    if (cameras.value.length > 0) {
      selectedCameraId.value = cameras.value[0].deviceId;
    }
  } catch (error) {
    console.error("获取摄像头列表失败:", error);
  }
};

const initializeDetector = async () => {
  await detector.value.initialize();
};

const initializeCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: selectedCameraId.value
          ? { exact: selectedCameraId.value }
          : undefined,
        width: 640,
        height: 480,
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

const switchCamera = async () => {
  stopCamera();
  await initializeCamera();
};

// 记录 fps 的变量
const fps = ref(0);
const lastFpsTime = ref(0);

// 手势处理函数
const handleGesture = (gesture) => {
  const now = Date.now();
  if (now - lastGestureTime.value < GESTURE_DEBOUNCE_TIME) {
    return;
  }
  lastGestureTime.value = now;

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

// 获取有效手势
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

const predictWebcam = async () => {
  const video = videoElement.value;
  const canvas = canvasElement.value;
  const ctx = canvas.getContext("2d");

  if (video.currentTime !== lastVideoTime.value) {
    lastVideoTime.value = video.currentTime;
    const detection = await detector.value.detect(video);

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制视频帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 计算 FPS
    const now = performance.now();
    if (lastFpsTime.value) {
      const delta = now - lastFpsTime.value;
      fps.value = Math.round(1000 / delta);
    }
    lastFpsTime.value = now;

    // 绘制 FPS
    ctx.font = "20px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(`FPS: ${fps.value}`, 10, 30);

    // 绘制所有手势点
    if (detection.leftHand) {
      detection.leftHand.landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "red";
        ctx.fill();
      });
    }
    if (detection.rightHand) {
      detection.rightHand.landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = "blue";
        ctx.fill();
      });
    }

    // 获取左右手手势
    const rightHandGesture = detection.rightHand
      ? Detector.getSingleHandGesture(detection.rightHand)
      : HandGesture.OTHER;
    const leftHandGesture = detection.leftHand
      ? Detector.getSingleHandGesture(detection.leftHand)
      : HandGesture.OTHER;

    // 获取有效手势并处理
    const effectiveGesture = getEffectiveGesture(
      rightHandGesture,
      leftHandGesture
    );
    if (effectiveGesture !== HandGesture.OTHER) {
      handleGesture(effectiveGesture);
    }
  }

  // 继续下一帧检测
  requestAnimationFrame(predictWebcam);
};

const stopCamera = () => {
  if (videoElement.value?.srcObject) {
    videoElement.value.srcObject.getTracks().forEach((track) => track.stop());
  }
};

onMounted(async () => {
  await getCameras();
  await initializeDetector();
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
