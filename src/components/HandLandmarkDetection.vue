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
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(null);
const lastVideoTime = ref(-1);
const cameras = ref([]);
const selectedCameraId = ref("");
const currentStream = ref(null);

const getCameras = async () => {
  try {
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
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
  );
  detector.value = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });
};
// ... existing code ...

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
    const predictions = await detector.value.detect(video);

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制视频帧
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // 绘制检测到的手部关键点
    // if (predictions.landmarks) {
    //   predictions.landmarks.forEach((landmarks) => {
    //     landmarks.forEach((landmark) => {
    //       ctx.beginPath();
    //       ctx.arc(
    //         landmark.x * canvas.width,
    //         landmark.y * canvas.height,
    //         3,
    //         0,
    //         2 * Math.PI
    //       );
    //       ctx.fillStyle = "red";
    //       ctx.fill();
    //     });
    //   });
    // }

    if (predictions.landmarks?.[0]) {
      const [
        wrist,
        thumb1,
        thumb2,
        thumb3,
        thumbTip,
        index1,
        index2,
        index3,
        indexTip,
        middle1,
        middle2,
        middle3,
        middleTip,
      ] = predictions.landmarks[0];

      // 拇指尖 - 绘制红点
      ctx.beginPath();
      ctx.arc(
        thumbTip.x * canvas.width,
        thumbTip.y * canvas.height,
        5, // 点的大小
        0,
        2 * Math.PI
      );
      ctx.fillStyle = "red";
      ctx.fill();

      console.log("拇指尖位置:", {
        x: canvas.width - thumbTip.x * canvas.width, // 水平翻转
        y: thumbTip.y * canvas.height,
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
