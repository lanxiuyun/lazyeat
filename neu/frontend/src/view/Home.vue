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
            <span style="display: flex; align-items: center">
              <n-icon size="20" style="margin-right: 8px">
                <Browser />
              </n-icon>
              <span>显示识别窗口</span>
            </span>
            <n-switch v-model:value="config.show_window" />
          </n-space>

          <n-space align="center" style="display: flex; align-items: center">
            <span style="display: flex; align-items: center">
              <n-icon size="20" style="margin-right: 8px">
                <Camera />
              </n-icon>
              <span>摄像头选择</span>
            </span>
            <n-select
              v-model:value="config.camera_index"
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
              <p>四指并拢发送按键 [F] 全屏</p>
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
  OneOne,
  TwoTwo,
  ThreeThree,
  FourFour,
  Six,
  Boxing,
  FiveFive,
  Camera,
  Monitor,
  Browser,
} from "@icon-park/vue-next";
import { ref, watch } from "vue";
import backend_api from "../backend_api";

const start = ref(false);
const config = ref({
  show_window: false,
  camera_index: 0,
});

// 摄像头选项,动态生成0-10的选项
const camera_options = ref(
  Array.from({ length: 11 }, (_, i) => ({
    label: i.toString(),
    value: i,
  }))
);

watch(start, async () => {
  await backend_api.toggle_detect();
});

watch(
  config,
  async (newVal) => {
    await backend_api.update_config(newVal);
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
