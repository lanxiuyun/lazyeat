<template>
  <div class="guide-container">
    <n-card title="操作指南" hoverable>
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
            <div style="display: flex; align-items: center; gap: 4px">
              {{ $t("食指和拇指距离小于") }}
              <n-input-number
                v-model:value="
                  app_store.config.scroll_gesture_2_thumb_and_index_threshold
                "
                :min="0"
                :step="0.01"
                style="width: 150px"
              />
              {{ $t("触发捏合") }}
            </div>
            <div class="tag-wrap">
              <n-tag>
                {{ $t("默认值0.02") }}
              </n-tag>
              <n-tag>
                {{ $t("可以通过右键->检查->控制台->捏合手势->查看当前距离") }}
              </n-tag>
            </div>
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
import GestureCard from "@/components/GestureCard.vue";
import GestureIcon from "@/components/GestureIcon.vue";
import { use_app_store } from "@/store/app";
import {
  BadTwo,
  Boxing,
  FiveFive,
  FourFour,
  Okay,
  OneOne,
  Rock,
  Six,
  TwoTwo,
} from "@icon-park/vue-next";
import { ref } from "vue";

const app_store = use_app_store();
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

<style scoped>
.guide-container {
  padding: 16px;
  margin: 0 auto;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}

:deep(.n-card) {
  transition: all 0.3s ease;
}

:deep(.n-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tag-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag-wrap .n-tag {
  white-space: normal !important;
  word-break: break-all;
  max-width: 100%;
}
</style>
