<template>
  <div class="guide-container">
    <div class="sticky-header">
      <h2>{{ $t("手势指南") }}</h2>
      <div class="header-actions">
        <n-space>
          <n-button size="small" @click="enableAllGestures">
            {{ $t('启用全部') }}
          </n-button>
          <n-button size="small" @click="disableAllGestures">
            {{ $t('禁用全部') }}
          </n-button>
          <n-button size="small" @click="resetAllGestures">
            {{ $t('重置默认') }}
          </n-button>
          <n-tag type="info" size="small">
            {{ $t('已启用') }}: {{ enabledCount }} / {{ totalGestures }}
          </n-tag>
        </n-space>
      </div>
    </div>

    <n-scrollbar>
      <div class="gesture-content">
        <!-- 分组导航 -->
        <n-tabs v-model:value="activeGroup" type="line" animated>
          <n-tab-pane 
            v-for="group in groupInfo" 
            :key="group.id"
            :name="group.id"
            :tab="$t(group.name)"
          >
            <template #tab>
              <n-space align="center" size="small">
                <span>{{ $t(group.name) }}</span>
                <n-tag v-if="getGroupEnabledCount(group.id) > 0" type="success" size="tiny">
                  {{ getGroupEnabledCount(group.id) }}
                </n-tag>
              </n-space>
            </template>
            
            <el-main class="gesture-grid">
              <GestureCard
                v-for="gesture in getGesturesByGroup(group.id)"
                :key="gesture.id"
                :title="$t(gesture.name)"
                :description="$t(gesture.description)"
                :isDoubleHand="gesture.id === 'STOP_GESTURE'"
              >
                <template #icon>
                  <GestureIcon :icon="gesture.icon" :style="getIconStyle(gesture.id)" />
                </template>
                <template #extra>
                  <!-- 启用/禁用开关 -->
                  <div class="gesture-controls">
                    <n-switch 
                      :value="gesture.enabled" 
                      @update:value="gesture.enabled = $event"
                      size="small"
                    >
                      <template #checked>{{ $t('启用') }}</template>
                      <template #unchecked>{{ $t('关闭') }}</template>
                    </n-switch>

                    <!-- 额外配置选项 -->
                    <div v-if="gesture.hasExtraOptions()" class="extra-options">
                      <!-- 阈值配置 -->
                      <div v-if="gesture.threshold !== undefined" class="threshold-config">
                        <n-input-number
                          v-model:value="gesture.threshold"
                          size="small"
                          style="width: 150px"
                          :min="0"
                          :step="0.01"
                          clearable
                          :on-clear="
                            async () => {
                              await nextTick();
                              gesture.threshold = 0.02;
                            }
                          "
                        />
                        <div class="threshold-hint">
                          {{ $t("食指和拇指距离小于值时滚动页面") }}
                          <div class="tag-wrap">
                            {{ $t("可以通过右键->检查->控制台->捏合手势->查看当前距离") }}
                          </div>
                        </div>
                      </div>

                      <!-- 快捷键配置 -->
                      <div v-if="gesture.shortcut !== undefined" class="shortcut-config">
                        <n-input
                          :value="gesture.shortcut"
                          readonly
                          :placeholder="$t('点击设置快捷键')"
                          @click="() => listenForShortcut(gesture)"
                          :status="getListeningStatus(gesture.id)"
                          :bordered="true"
                          style="width: 200px"
                        >
                          <template #suffix>
                            {{ getListeningText(gesture.id) }}
                          </template>
                        </n-input>
                      </div>
                    </div>

                    <!-- 特殊链接（仅限Rock手势） -->
                    <div v-if="gesture.id === 'ROCK_GESTURE'" class="special-links">
                      <n-space>
                        <a href="https://github.com/MiKoto-Railgun" target="_blank">
                          @MiKoto-Railgun
                        </a>
                        <a href="https://github.com/maplelost/lazyeat/issues/26" target="_blank">
                          issues
                        </a>
                      </n-space>
                    </div>
                  </div>
                </template>
              </GestureCard>
            </el-main>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-scrollbar>
  </div>
</template>

<script setup lang="ts">
import GestureCard from "@/components/GestureCard.vue";
import GestureIcon from "@/components/GestureIcon.vue";
import { use_app_store } from "@/store/app";
import { GestureManager } from "@/utils/GestureManager";
import { GestureFactory } from "@/utils/GestureFactory";
import { KeyListener, ShortcutUtils } from "@/utils/KeyListener";
import { computed, onMounted, onUnmounted, ref } from "vue";

const app_store = use_app_store();

// 手势管理器实例
const gestureManager = ref<GestureManager | null>(null);

// 键盘监听器实例
const keyListener = ref(new KeyListener());

// 当前激活的分组
const activeGroup = ref('basic');

// 初始化手势管理器
const initializeGestureManager = () => {
  const manager = new GestureManager();
  const gestures = GestureFactory.createAllGestures(app_store.config);
  
  // 按分组注册手势
  const groupedGestures = GestureFactory.createGesturesByGroup(app_store.config);
  Object.entries(groupedGestures).forEach(([group, groupGestures]) => {
    groupGestures.forEach(gesture => {
      manager.register(gesture, group);
    });
  });
  
  return manager;
};

// 计算属性
const totalGestures = computed(() => {
  return gestureManager.value?.getAllGestures().length || 0;
});

const enabledCount = computed(() => {
  return gestureManager.value?.getEnabledCount() || 0;
});

const groupInfo = computed(() => {
  return GestureFactory.getGroupInfo();
});

// 方法
const getGesturesByGroup = (groupId: string) => {
  return gestureManager.value?.getGesturesByGroup(groupId) || [];
};

const getGroupEnabledCount = (groupId: string) => {
  const gestures = getGesturesByGroup(groupId);
  return gestures.filter(g => g.enabled).length;
};

const getIconStyle = (gestureId: string) => {
  const styles: Record<string, any> = {
    'HandDown': { transform: 'scaleX(-1)' },
    'BadTwo': { transform: 'rotate(90deg) scaleX(-1)' },
  };
  return styles[gestureId] || {};
};

const getListeningStatus = (gestureId: string) => {
  const listeningGesture = keyListener.value.listening ? gestureId : null;
  return listeningGesture === gestureId ? 'warning' : undefined;
};

const getListeningText = (gestureId: string) => {
  const listeningGesture = keyListener.value.listening ? gestureId : null;
  return listeningGesture === gestureId 
    ? $t('请按下按键...') 
    : $t('点击设置');
};

// 手势管理方法
const enableAllGestures = () => {
  gestureManager.value?.enableAll();
};

const disableAllGestures = () => {
  gestureManager.value?.disableAll();
};

const resetAllGestures = () => {
  gestureManager.value?.resetAll();
};

// 快捷键监听方法
const listenForShortcut = (gesture: any) => {
  if (!gesture.extraOptions?.hasShortcut || !gesture.extraOptions.shortcutKey) {
    return;
  }

  keyListener.value.startListening((shortcut: string) => {
    if (ShortcutUtils.isValidShortcut(shortcut)) {
      gesture.shortcut = shortcut;
    }
  });
};

// 生命周期
onMounted(() => {
  gestureManager.value = initializeGestureManager();
});

onUnmounted(() => {
  keyListener.value.stopListening();
});
</script>

<style scoped>
.guide-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sticky-header {
  border-bottom: 1px solid #e5e5e5;
  padding: 16px 20px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.sticky-header h2 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gesture-content {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-nav) {
  padding: 0 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.n-tab-pane) {
  padding: 0;
  height: 100%;
  overflow: auto;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  padding: 20px;
}

:deep(.n-card) {
  transition: all 0.3s ease;
  border: 1px solid #e5e7eb;
}

:deep(.n-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #d1d5db;
}

.gesture-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.extra-options {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f3f4f6;
}

.threshold-config,
.shortcut-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.threshold-hint {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

.tag-wrap {
  display: flex;
  flex-wrap: wrap;
  background-color: #fafafc;
  border: 1px solid #e5e9f2;
  padding: 4px 8px;
  border-radius: 4px;
  margin-top: 4px;
  font-size: 11px;
  color: #4b5563;
}

.tag-wrap .n-tag {
  white-space: normal !important;
  word-break: break-all;
  max-width: 100%;
}

.special-links {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
}

.special-links a {
  color: #3b82f6;
  text-decoration: none;
  font-size: 12px;
}

.special-links a:hover {
  text-decoration: underline;
  color: #2563eb;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gesture-grid {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 16px;
  }
  
  .sticky-header {
    padding: 12px 16px;
  }
  
  :deep(.n-tabs-nav) {
    padding: 0 16px;
  }
}

@media (max-width: 480px) {
  .gesture-grid {
    padding: 8px;
    gap: 12px;
  }
  
  .header-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
