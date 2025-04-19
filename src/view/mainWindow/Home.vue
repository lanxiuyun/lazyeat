<template>
  <div class="home-container">
    <n-card
      class="control-panel"
      hoverable
      v-show="app_store.config.show_window"
    >
      <!-- <n-card class="performance-card" hoverable>
        <template #header>
          <n-space align="center">
            <n-icon size="20">
              <Speed />
            </n-icon>
            <span>性能监控</span>
          </n-space>
        </template>
        <n-space vertical :size="0">
          <n-space justify="space-between">
            <span>FPS:</span>
            <span>{{ fps }}</span>
          </n-space>
          <n-space justify="space-between">
            <span>cv2平均取图时间:</span>
            <span>{{ avg_catch_time }}ms</span>
          </n-space>
          <n-space justify="space-between">
            <span>平均预测时间:</span>
            <span>{{ avg_predict_time }}ms</span>
          </n-space>
          <n-space justify="space-between">
            <span>平均总耗时:</span>
            <span>{{ avg_cost_time }}ms</span>
          </n-space>
        </n-space>
      </n-card> -->
      <VideoDetector />
    </n-card>

    <!-- 顶部控制区域 -->
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

    <!-- 手势设置区域 -->
    <n-card class="gesture-panel" hoverable>
      <template #header>
        <h2 class="section-title">{{ $t("手势操作指南") }}</h2>
      </template>

      <div class="gesture-grid">
        <GestureCard
          :title="$t('光标控制')"
          :description="$t('竖起食指滑动控制光标位置')"
        >
          <template #icon>
            <GestureIcon :icon="OneOne" />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('单击操作')"
          :description="$t('双指举起执行鼠标单击')"
        >
          <template #icon>
            <GestureIcon :icon="TwoTwo" />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('单击操作')"
          :description="$t('Rock手势执行鼠标单击')"
        >
          <template #icon>
            <GestureIcon :icon="Rock" />
          </template>
          <template #extra>
            <n-space>
              <a href="https://github.com/MiKoto-Railgun" target="_blank">
                @MiKoto-Railgun
              </a>

              <a
                href="https://github.com/maplelost/lazyeat/issues/26"
                target="_blank"
              >
                issues
              </a>
            </n-space>
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('滚动控制')"
          :description="$t('（okay手势）食指和拇指捏合滚动页面')"
        >
          <template #icon>
            <GestureIcon :icon="Okay" />
          </template>
          <template #extra>
            <n-input-number
              v-model:value="
                app_store.config.scroll_gesture_2_thumb_and_index_threshold
              "
              :min="0"
              :step="0.01"
              :placeholder="$t('设置食指和拇指距离阈值')"
              style="width: 200px"
            />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('全屏控制')"
          :description="$t('四指并拢发送按键')"
        >
          <template #icon>
            <GestureIcon :icon="FourFour" />
          </template>
          <template #extra>
            <n-input
              :value="app_store.config.four_fingers_up_send"
              readonly
              :placeholder="$t('点击设置快捷键')"
              @click="listenForKey"
              :status="isListening ? 'warning' : undefined"
              :bordered="true"
              style="width: 200px"
            >
              <template #suffix>
                {{ isListening ? $t("请按下按键...") : $t("点击设置") }}
              </template>
            </n-input>
          </template>
        </GestureCard>

        <GestureCard :title="$t('退格')" :description="$t('发送退格键')">
          <template #icon>
            <GestureIcon
              style="transform: rotate(90deg) scaleX(-1)"
              :icon="BadTwo"
            />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('开始语音识别')"
          :description="$t('六指手势开始语音识别')"
        >
          <template #icon>
            <GestureIcon :icon="Six" />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('结束语音识别')"
          :description="$t('拳头手势结束语音识别')"
        >
          <template #icon>
            <GestureIcon :icon="Boxing" />
          </template>
        </GestureCard>

        <GestureCard
          :title="$t('暂停/继续')"
          :description="$t('单手张开1.5秒 暂停/继续 手势识别')"
          :isDoubleHand="true"
        >
          <template #icon>
            <GestureIcon :icon="FiveFive" />
          </template>
        </GestureCard>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import AutoStart from "@/components/AutoStart.vue";
import GestureCard from "@/components/GestureCard.vue";
import GestureIcon from "@/components/GestureIcon.vue";
import VideoDetector from "@/hand_landmark/VideoDetector.vue";
import { use_app_store } from "@/store/app";
import {
  BadTwo,
  Boxing,
  Browser,
  Camera,
  FiveFive,
  FourFour,
  OneOne,
  Rock,
  Six,
  Okay,
  TwoTwo,
} from "@icon-park/vue-next";
import { computed, onMounted, ref } from "vue";

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

// 监听 四指发送按键
const isListening = ref(false);
const listenForKey = () => {
  isListening.value = true;

  const handleKeyDown = (e: KeyboardEvent) => {
    e.preventDefault();

    const modifiers = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.altKey) modifiers.push("Alt");

    let key = e.key;
    // 处理功能键
    if (key.startsWith("F") && key.length > 1) {
      // F1-F12 保持原样
    } else if (key === "Control" || key === "Shift" || key === "Alt") {
      // 忽略单独的修饰键
      return;
    } else {
      // 其他键转换为大写
      key = key.toUpperCase();
    }

    const shortcut = [...modifiers, key].join("+");
    app_store.config.four_fingers_up_send = shortcut;
    isListening.value = false;
    window.removeEventListener("keydown", handleKeyDown);
  };

  window.addEventListener("keydown", handleKeyDown);
};
</script>

<style scoped lang="scss">
.home-container {
  margin: 0 auto;
}

.control-panel {
  margin-bottom: 24px;
}

.section-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
}

.settings-row {
  padding: 8px 0;
}

.gesture-panel {
  background: #ffffff;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  padding: 16px 0;
}

// 链接样式
a {
  color: #2196f3; // 默认使用适中的蓝色
  text-decoration: none;
  transition: all 0.3s ease; // 添加过渡效果
}

a:visited {
  color: #2196f3;
}

a:hover {
  color: #1976d2; // 悬停时使用深蓝色
}

a:active {
  color: #0d47a1; // 点击时使用更深的蓝色
}

.performance-card {
  width: 300px;

  :deep(.n-card-header) {
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  :deep(.n-card__content) {
    padding: 16px;
  }
}
</style>
