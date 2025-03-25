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
              style="width: 100px"
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
        <!-- 手势卡片 1 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <OneOne
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>光标控制</h3>
              <p>竖起食指滑动控制光标位置</p>
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 2 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <TwoTwo
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>单击操作</h3>
              <p>双指并拢执行鼠标单击</p>
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 3 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <ThreeThree
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>滚动控制</h3>
              <p>三指上下滑动控制页面滚动</p>
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 4 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <FourFour
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>全屏控制</h3>
              <p>四指并拢发送按键</p>
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
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 5 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <Six theme="outline" size="40" fill="#4098fc" :stroke-width="3" />
            </div>
            <div class="gesture-info">
              <h3>开始语音识别</h3>
              <p>六指手势开始语音识别</p>
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 6 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon">
              <Boxing
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>结束语音识别</h3>
              <p>拳头手势结束语音识别</p>
            </div>
          </n-space>
        </n-card>

        <!-- 手势卡片 7 -->
        <n-card class="gesture-card" :bordered="false">
          <n-space align="center" class="gesture-content">
            <div class="gesture-icon double-hand">
              <FiveFive
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
                class="flipped"
              />
              <FiveFive
                theme="outline"
                size="40"
                fill="#4098fc"
                :stroke-width="3"
              />
            </div>
            <div class="gesture-info">
              <h3>暂停/继续</h3>
              <p>双手张开暂停/继续 手势识别</p>
            </div>
          </n-space>
        </n-card>
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
} from "@icon-park/vue-next";
import { ref, watch } from "vue";
import AutoStart from "../components/AutoStart.vue";
import pyApi from "../py_api";
import { use_app_store } from "../store/app";

const start = ref(false);
const app_store = use_app_store();

// 摄像头选项,动态生成0-10的选项
const camera_options = ref(
  Array.from({ length: 11 }, (_, i) => ({
    label: i.toString(),
    value: i,
  }))
);

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

.gesture-card {
  transition: all 0.3s ease;
  background: linear-gradient(145deg, #f8faff, #ffffff);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e9f2;
  border-radius: 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(64, 152, 252, 0.15);
    border-color: #4098fc;
  }
}

.gesture-content {
  padding: 12px;
}

.gesture-icon {
  background: rgba(64, 152, 252, 0.1);
  padding: 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(64, 152, 252, 0.2);
}

.gesture-info {
  flex: 1;

  h3 {
    margin: 0 0 4px 0;
    font-size: 1.1rem;
    color: #2c3e50;
  }

  p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
}

.flipped {
  transform: scaleX(-1);
}

.double-hand {
  display: flex;
  gap: 8px;

  :deep(svg) {
    width: 32px;
    height: 32px;
  }
}
</style>
