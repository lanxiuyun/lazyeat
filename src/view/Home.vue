<template>
  <div class="home-container">
    <!-- 顶部控制区域 -->
    <n-card class="control-panel" hoverable>
      <n-space vertical>
        <n-space justify="space-between" align="center">
          <h2 class="section-title">手势识别控制</h2>
          <n-switch v-model:value="start" size="large">
            <template #checked>运行中</template>
            <template #unchecked>已停止</template>
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
              <span>显示识别窗口</span>
            </span>
            <n-switch v-model:value="app_store.config.show_window" />
          </n-space>

          <n-space align="center" style="display: flex; align-items: center">
            <span style="display: flex; align-items: center">
              <n-icon size="20" style="margin-right: 8px">
                <Camera />
              </n-icon>
              <span>摄像头选择</span>
            </span>
            <n-select
              v-model:value="app_store.config.camera_index"
              :options="camera_options"
              :disabled="start"
              style="width: 250px"
            />
          </n-space>
        </n-space>
      </n-space>
    </n-card>

    <!-- 手势设置区域 -->
    <n-card class="gesture-panel" hoverable>
      <template #header>
        <h2 class="section-title">手势操作指南</h2>
      </template>

      <div class="gesture-grid">
        <GestureCard title="光标控制" description="竖起食指滑动控制光标位置">
          <template #icon>
            <GestureIcon :icon="OneOne" />
          </template>
        </GestureCard>

        <GestureCard title="单击操作" description="双指并拢执行鼠标单击">
          <template #icon>
            <GestureIcon :icon="TwoTwo" />
          </template>
        </GestureCard>

        <GestureCard title="单击操作" description="双指并拢执行鼠标单击">
          <template #icon>
            <GestureIcon :icon="Rock" />
          </template>
        </GestureCard>

        <GestureCard title="滚动控制" description="三指上下滑动控制页面滚动">
          <template #icon>
            <GestureIcon :icon="ThreeThree" />
          </template>
        </GestureCard>

        <GestureCard title="全屏控制" description="四指并拢发送按键">
          <template #icon>
            <GestureIcon :icon="FourFour" />
          </template>
          <template #extra>
            <n-input
              :value="app_store.config.four_fingers_up_send"
              readonly
              placeholder="点击设置快捷键"
              @click="listenForKey"
              :status="isListening ? 'warning' : undefined"
              :bordered="true"
              style="width: 200px"
            >
              <template #suffix>
                {{ isListening ? "请按下按键..." : "点击设置" }}
              </template>
            </n-input>
          </template>
        </GestureCard>

        <GestureCard title="开始语音识别" description="六指手势开始语音识别">
          <template #icon>
            <GestureIcon :icon="Six" />
          </template>
        </GestureCard>

        <GestureCard title="结束语音识别" description="拳头手势结束语音识别">
          <template #icon>
            <GestureIcon :icon="Boxing" />
          </template>
        </GestureCard>

        <GestureCard
          title="暂停/继续"
          description="双手张开暂停/继续 手势识别"
          :isDoubleHand="true"
        >
          <template #icon>
            <GestureIcon :icon="FiveFive" flipped />
            <GestureIcon :icon="FiveFive" />
          </template>
        </GestureCard>
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import {
  Boxing,
  Browser,
  Camera,
  FiveFive,
  FourFour,
  OneOne,
  Six,
  ThreeThree,
  TwoTwo,
  Rock,
} from "@icon-park/vue-next";
import { onMounted, ref, watch } from "vue";
import AutoStart from "../components/AutoStart.vue";
import pyApi from "../py_api";
import { use_app_store } from "../store/app";
import GestureCard from "../components/GestureCard.vue";
import GestureIcon from "../components/GestureIcon.vue";

const start = ref(false);
const app_store = use_app_store();

// 定义 camera_options
const camera_options = ref([{ label: "0", value: 0 }]);
onMounted(async () => {
  pyApi.get_all_cameras().then((res) => {
    camera_options.value = Object.entries(res).map(([key, value]) => ({
      label: value,
      value: Number(key),
    }));
  });
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

watch(start, async () => {
  await pyApi.toggle_detect();
});

watch(
  () => app_store.config,
  async (newVal) => {
    await pyApi.update_config(newVal);
  },
  {
    deep: true,
  }
);
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
</style>
