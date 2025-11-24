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
        :style="{ cursor: canvasCursor }"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseleave="handleCanvasMouseLeave"
      ></canvas>
    </div>

    <n-popover trigger="hover" placement="bottom">
      <template #trigger>
        <n-button text circle type="info">
          <n-icon size="24">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
              />
            </svg>
          </n-icon>
        </n-button>
      </template>

      <div class="tooltip-content">
        <p><strong>识别框的位置决定了光标的移动范围：</strong></p>
        <ul>
          <li>识别框x和y：决定识别框的左上角位置</li>
          <li>当手势在识别框内移动时，光标会跟随手势在屏幕上移动</li>
        </ul>
      </div>
    </n-popover>

    <n-space>
      <n-form-item label="识别框x">
        <n-input-number
          v-model:value="app_store.config.boundary_left"
          :min="0"
          :max="app_store.VIDEO_WIDTH - app_store.config.boundary_width - 10"
          style="width: 150px"
        />
      </n-form-item>

      <n-form-item label="识别框y">
        <n-input-number
          v-model:value="app_store.config.boundary_top"
          :min="0"
          :max="app_store.VIDEO_HEIGHT - app_store.config.boundary_height - 10"
          style="width: 150px"
        />
      </n-form-item>

      <n-form-item label="识别框宽">
        <n-input-number
          v-model:value="app_store.config.boundary_width"
          :min="0"
          :max="app_store.VIDEO_WIDTH - app_store.config.boundary_left - 10"
          style="width: 150px"
        />
      </n-form-item>

      <n-form-item label="识别框高">
        <n-input-number
          v-model:value="app_store.config.boundary_height"
          :min="0"
          :max="app_store.VIDEO_HEIGHT - app_store.config.boundary_top - 10"
          style="width: 150px"
        />
      </n-form-item>
    </n-space>
  </div>
</template>

<script setup>
import { Detector } from "@/hand_landmark/detector";
import { use_app_store } from "@/store/app";
import { NButton, NIcon, NPopover } from "naive-ui";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";

// 常量定义
const app_store = use_app_store();
const MIN_BOUNDARY_SIZE = 40; // 最小识别框尺寸，避免框过小
const BOUNDARY_MARGIN = 10; // 贴近画布边缘的安全距离
const HANDLE_SIZE = 18; // 角点绘制尺寸
const HANDLE_HALF = HANDLE_SIZE / 2;

// 组件状态
const videoElement = ref(null);
const canvasElement = ref(null);
const detector = ref(new Detector());
const lastVideoTime = ref(-1);
const currentStream = ref(null);
const FPS = ref(0);
const camera_premission = ref(false);
const canvasCursor = ref("crosshair");
const isDrawingBoundary = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const activeHandle = ref(null);
const resizeSnapshot = ref({
  left: 0,
  top: 0,
  width: 0,
  height: 0,
});

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
    app_store.config.boundary_left,
    app_store.config.boundary_top,
    app_store.config.boundary_width,
    app_store.config.boundary_height
  );
  const handles = getHandlePositions();
  ctx.fillStyle = "rgb(255, 0, 255)";
  Object.values(handles).forEach(({ x, y }) => {
    ctx.fillRect(
      x - HANDLE_HALF,
      y - HANDLE_HALF,
      HANDLE_SIZE,
      HANDLE_SIZE
    );
  });
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
      // 翻转绘制
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 绘制手势点
      if (detection.leftHand) {
        drawHandLandmarks(ctx, detection.leftHand, "red");
      }
      if (detection.rightHand) {
        drawHandLandmarks(ctx, detection.rightHand, "blue");
      }

      // 恢复绘制状态
      ctx.restore();

      // 绘制鼠标移动框
      drawMouseMoveBox(ctx);
    }

    // 手势处理
    await detector.value.process(detection);

    // 绘制FPS
    drawFPS(ctx);
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

const clamp = (value, min, max) => {
  if (Number.isNaN(value)) {
    return min;
  }
  if (max < min) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const getHandlePositions = () => {
  // 实时根据当前 boundary 计算四角坐标
  const left = app_store.config.boundary_left;
  const top = app_store.config.boundary_top;
  const width = app_store.config.boundary_width;
  const height = app_store.config.boundary_height;
  const right = left + width;
  const bottom = top + height;
  return {
    tl: { x: left, y: top, cursor: "nwse-resize" },
    tr: { x: right, y: top, cursor: "nesw-resize" },
    bl: { x: left, y: bottom, cursor: "nesw-resize" },
    br: { x: right, y: bottom, cursor: "nwse-resize" },
  };
};

const findHandleAtPosition = (position) => {
  // 判断当前指针是否落在某个角点
  const handles = getHandlePositions();
  for (const [name, handle] of Object.entries(handles)) {
    if (
      Math.abs(position.x - handle.x) <= HANDLE_HALF &&
      Math.abs(position.y - handle.y) <= HANDLE_HALF
    ) {
      return { name, cursor: handle.cursor };
    }
  }
  return null;
};

const getCanvasRelativePosition = (event) => {
  const canvas = canvasElement.value;
  if (!canvas) {
    return null;
  }
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
};

const computeAxisSelection = (startValue, currentValue, limit) => {
  // 根据起点/终点计算单轴的起始位置与尺寸，保证合法范围
  const clampedStart = clamp(startValue, 0, limit);
  const clampedCurrent = clamp(currentValue, 0, limit);
  const drawingForward = clampedCurrent >= clampedStart;
  let minPoint = Math.min(clampedStart, clampedCurrent);
  let maxPoint = Math.max(clampedStart, clampedCurrent);

  if (maxPoint - minPoint < MIN_BOUNDARY_SIZE) {
    if (drawingForward) {
      maxPoint = Math.min(limit, minPoint + MIN_BOUNDARY_SIZE);
      minPoint = maxPoint - MIN_BOUNDARY_SIZE;
    } else {
      minPoint = Math.max(0, maxPoint - MIN_BOUNDARY_SIZE);
      maxPoint = minPoint + MIN_BOUNDARY_SIZE;
    }
  }

  if (maxPoint > limit) {
    const overflow = maxPoint - limit;
    maxPoint = limit;
    minPoint = Math.max(0, minPoint - overflow);
  }

  if (minPoint < 0) {
    const underflow = -minPoint;
    minPoint = 0;
    maxPoint = Math.min(limit, maxPoint + underflow);
  }

  return {
    start: minPoint,
    size: Math.max(MIN_BOUNDARY_SIZE, maxPoint - minPoint),
  };
};

const updateBoundaryFromDrag = (position) => {
  // 按下空白处拖拽时，实时更新新矩形
  const limitX = app_store.VIDEO_WIDTH - BOUNDARY_MARGIN;
  const limitY = app_store.VIDEO_HEIGHT - BOUNDARY_MARGIN;
  const xSelection = computeAxisSelection(dragStart.value.x, position.x, limitX);
  const ySelection = computeAxisSelection(dragStart.value.y, position.y, limitY);

  app_store.config.boundary_left = Math.round(xSelection.start);
  app_store.config.boundary_top = Math.round(ySelection.start);
  app_store.config.boundary_width = Math.round(
    clamp(xSelection.size, MIN_BOUNDARY_SIZE, limitX)
  );
  app_store.config.boundary_height = Math.round(
    clamp(ySelection.size, MIN_BOUNDARY_SIZE, limitY)
  );
};

const startHandleResize = (handleName) => {
  // 记录角点拖拽的初始快照
  activeHandle.value = handleName;
  resizeSnapshot.value = {
    left: app_store.config.boundary_left,
    top: app_store.config.boundary_top,
    width: app_store.config.boundary_width,
    height: app_store.config.boundary_height,
  };
};

const updateBoundaryFromHandle = (position) => {
  // 根据角点和当前指针位置调整对应边
  if (!activeHandle.value) {
    return;
  }
  const limitX = app_store.VIDEO_WIDTH - BOUNDARY_MARGIN;
  const limitY = app_store.VIDEO_HEIGHT - BOUNDARY_MARGIN;
  const pointerX = clamp(position.x, 0, limitX);
  const pointerY = clamp(position.y, 0, limitY);

  const snapshot = resizeSnapshot.value;
  let left = snapshot.left;
  let top = snapshot.top;
  let right = Math.min(limitX, snapshot.left + snapshot.width);
  let bottom = Math.min(limitY, snapshot.top + snapshot.height);

  switch (activeHandle.value) {
    case "tl":
      left = clamp(pointerX, 0, right - MIN_BOUNDARY_SIZE);
      top = clamp(pointerY, 0, bottom - MIN_BOUNDARY_SIZE);
      break;
    case "tr":
      right = clamp(pointerX, left + MIN_BOUNDARY_SIZE, limitX);
      top = clamp(pointerY, 0, bottom - MIN_BOUNDARY_SIZE);
      break;
    case "bl":
      left = clamp(pointerX, 0, right - MIN_BOUNDARY_SIZE);
      bottom = clamp(pointerY, top + MIN_BOUNDARY_SIZE, limitY);
      break;
    case "br":
      right = clamp(pointerX, left + MIN_BOUNDARY_SIZE, limitX);
      bottom = clamp(pointerY, top + MIN_BOUNDARY_SIZE, limitY);
      break;
    default:
      break;
  }

  const width = Math.max(MIN_BOUNDARY_SIZE, right - left);
  const height = Math.max(MIN_BOUNDARY_SIZE, bottom - top);

  app_store.config.boundary_left = Math.round(left);
  app_store.config.boundary_top = Math.round(top);
  app_store.config.boundary_width = Math.round(width);
  app_store.config.boundary_height = Math.round(height);
};

const handleCanvasMouseDown = (event) => {
  if (!app_store.config.show_window) {
    return;
  }
  const position = getCanvasRelativePosition(event);
  if (!position) {
    return;
  }
  const handleHit = findHandleAtPosition(position);
  event.preventDefault();
  if (handleHit) {
    canvasCursor.value = handleHit.cursor;
    startHandleResize(handleHit.name);
    updateBoundaryFromHandle(position);
    return;
  }
  activeHandle.value = null;
  isDrawingBoundary.value = true;
  dragStart.value = position;
  updateBoundaryFromDrag(position);
  canvasCursor.value = "crosshair";
};

const handleGlobalMouseMove = (event) => {
  // 全局监听保证拖拽超出画布也能继续
  const position = getCanvasRelativePosition(event);
  if (!position) {
    return;
  }
  if (activeHandle.value) {
    event.preventDefault();
    updateBoundaryFromHandle(position);
    return;
  }
  if (!isDrawingBoundary.value) {
    return;
  }
  event.preventDefault();
  updateBoundaryFromDrag(position);
};

const handleGlobalMouseUp = () => {
  if (activeHandle.value || isDrawingBoundary.value) {
    activeHandle.value = null;
    isDrawingBoundary.value = false;
    resizeSnapshot.value = {
      left: 0,
      top: 0,
      width: 0,
      height: 0,
    };
    canvasCursor.value = "crosshair";
  }
};

const handleCanvasMouseMove = (event) => {
  if (activeHandle.value || isDrawingBoundary.value) {
    return;
  }
  const position = getCanvasRelativePosition(event);
  if (!position) {
    return;
  }
  const handleHit = findHandleAtPosition(position);
  canvasCursor.value = handleHit ? handleHit.cursor : "crosshair";
};

const handleCanvasMouseLeave = () => {
  if (!activeHandle.value && !isDrawingBoundary.value) {
    canvasCursor.value = "crosshair";
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

onMounted(() => {
  window.addEventListener("mousemove", handleGlobalMouseMove);
  window.addEventListener("mouseup", handleGlobalMouseUp);
});

onBeforeUnmount(() => {
  stopCamera();
  window.removeEventListener("mousemove", handleGlobalMouseMove);
  window.removeEventListener("mouseup", handleGlobalMouseUp);
});
</script>

<style scoped>
.hand-detection {
  width: v-bind('app_store.VIDEO_WIDTH + "px"');
  height: v-bind('app_store.VIDEO_HEIGHT + "px"');
}

.output-canvas {
  position: absolute;
}

.tooltip-content {
  max-width: 300px;
  padding: 4px;
}

.tooltip-content p {
  margin-top: 0;
}

.tooltip-content ul {
  margin-bottom: 0;
  padding-left: 20px;
}
</style>
