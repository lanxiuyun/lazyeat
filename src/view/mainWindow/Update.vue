<template>
  <div class="update-container">
    <n-card title="开发" hoverable>
      <n-space vertical size="large">
        <div class="dev-section">
          <n-alert type="info" title="开发者招募">
            <template #icon>
              <n-icon><code /></n-icon>
            </template>
            <n-space vertical>
              <span>有安卓开发的大佬吗，可以联系我。</span>
              <span>欢迎加入QQ群 
                <n-button text type="primary" tag="a" href="https://jq.qq.com/?_wv=1027&k=452246065" target="_blank">
                  452246065
                </n-button>
                讨论。
              </span>
            </n-space>
          </n-alert>
        </div>

        <div class="version-section">
          <h3>最新版本</h3>
          <n-card embedded>
            <n-space vertical>
              <div class="version-header">
                <n-tag type="success" size="small">v0.3.9</n-tag>
                <n-button text type="primary" tag="a" href="https://github.com/maplelost/lazyeat/releases/tag/v0.3.9" target="_blank">
                  下载地址
                </n-button>
              </div>
              <n-list>
                <n-list-item>
                  <n-text type="success">新增</n-text> 捏合手势滚动功能
                </n-list-item>
                <n-list-item>
                  <n-text type="info">优化</n-text> 自定义手势识别区域
                </n-list-item>
                <n-list-item>
                  <n-text type="info">优化</n-text> 手势识别的准确性
                </n-list-item>
              </n-list>
            </n-space>
          </n-card>
        </div>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { NCard, NSpace, NList, NListItem, NAlert, NButton, NTag, NText, NIcon } from 'naive-ui'
import { Code } from '@icon-park/vue-next'
</script>

<style scoped>
.update-container {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.dev-section {
  margin-bottom: 24px;
}

.version-section {
  margin-bottom: 24px;
}

.version-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 1.2em;
}

.version-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

:deep(.n-alert .n-alert-body) {
  align-items: flex-start;
}

:deep(.n-card) {
  transition: all 0.3s ease;
}

:deep(.n-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 