<template>
  <div class="help-container">
    <div class="nav-bar">
      <h1 class="title">帮助文档</h1>
      <button class="open-browser-btn" @click="openInBrowser">
        <span class="btn-text">在浏览器中打开(浏览器中才能正常跳转)</span>
        <svg class="external-link-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </button>
    </div>
    <iframe src="/help.html" class="github-frame" title="LazyEat Help"></iframe>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { openUrl } from "@tauri-apps/plugin-opener";

const helpUrl = ref('https://github.com/lanxiuyun/lazyeat/issues/30')

const openInBrowser = async () => {
  await openUrl(helpUrl.value)
}
</script>

<style scoped>
.help-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.github-frame {
  flex: 1;
  border: none;
  overflow: hidden;
  background-color: #ffffff;
  margin: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.open-browser-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background-color: #1677ff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.open-browser-btn:hover {
  background-color: #4096ff;
  transform: translateY(-1px);
}

.open-browser-btn:active {
  transform: translateY(0);
}

.btn-text {
  font-weight: 500;
}

.external-link-icon {
  width: 14px;
  height: 14px;
}
</style>
