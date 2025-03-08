<template>
  <div>
    <h1>👋开始识别 <n-switch v-model:value="start" /></h1>
    <n-space align="center">
      显示识别窗口<n-switch v-model:value="config.show_window" /> 
      摄像头索引
      <n-select
        v-model:value="config.camera_index"
        :options="camera_options"
        :disabled="start"
        style="width: 80px"
      />
    </n-space>
    <n-divider />

    <h1>👋设置</h1>
    <div class="gesture-setting-container">
      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <OneOne theme="outline" size="32" fill="#333" :stroke-width="2" />
          只竖起食指,滑动光标
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <TwoTwo theme="outline" size="32" fill="#333" :stroke-width="2" />
          双指并拢,鼠标单击
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <ThreeThree theme="outline" size="32" fill="#333" :stroke-width="2" />
          三指并拢,上移,向下滚动,下移,向上滚动
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <FourFour theme="outline" size="32" fill="#333" :stroke-width="2" />
          四指并拢,发送按键 [F] 全屏
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <Six theme="outline" size="32" fill="#333" :stroke-width="2" />
          六手势，开始语音识别
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <Boxing theme="outline" size="32" fill="#333" :stroke-width="2" />
          拳头手势，结束语音识别
          <div />
        </n-space>
      </div>
      <n-divider />

      <div class="gesture-setting-item">
        <n-space justify="space-between" align="center">
          <div>
            <FiveFive
              theme="outline"
              size="32"
              fill="#333"
              :stroke-width="2"
              class="flipped"
            />
            <FiveFive theme="outline" size="32" fill="#333" :stroke-width="2" />
          </div>
          两只手同时张开，暂停/继续 Lazyeat 识别
          <div />
        </n-space>
      </div>
      <n-divider />
    </div>
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
.gesture-setting-container {
  background-color: #d3e3fd;
  border-radius: 10px;
  padding: 20px;
}

.n-divider {
  margin: 5px 0;
}

.flipped {
  display: inline-block;
  transform: scaleX(-1);
}
</style>
