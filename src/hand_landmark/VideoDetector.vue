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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Detector } from "@/hand_landmark/detector";

const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(new Detector());
const lastVideoTime = ref(-1);
const cameras = ref([]);
const selectedCameraId = ref("1");
const currentStream = ref(null);

const getCameras = async () => {
  try {
    // 先请求摄像头权限
    await navigator.mediaDevices.getUserMedia({ video: true });

    // 获取设备列表
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter((device) => device.kind === "videoinput");
    if (cameras.value.length > 0) {
      selectedCameraId.value = cameras.value[1].deviceId;
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

    // 绘制左手拇指尖（红色）
    const leftThumbTip = Detector.getFingerTip(detection.leftHand, 0);
    if (leftThumbTip) {
      ctx.beginPath();
      ctx.arc(
        leftThumbTip.x * canvas.width,
        leftThumbTip.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "red";
      ctx.fill();
    }

    // 绘制右手拇指尖（蓝色）
    const rightThumbTip = Detector.getFingerTip(detection.rightHand, 0);
    if (rightThumbTip) {
      ctx.beginPath();
      ctx.arc(
        rightThumbTip.x * canvas.width,
        rightThumbTip.y * canvas.height,
        5,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "blue";
      ctx.fill();
    }

    // 输出位置信息
    if (leftThumbTip) {
      console.log("左手拇指尖位置:", {
        x: canvas.width - leftThumbTip.x * canvas.width,
        y: leftThumbTip.y * canvas.height,
      });
    }
    if (rightThumbTip) {
      console.log("右手拇指尖位置:", {
        x: canvas.width - rightThumbTip.x * canvas.width,
        y: rightThumbTip.y * canvas.height,
      });
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
  position: absolute;
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
  transform: scaleX(-1);
}
</style>
