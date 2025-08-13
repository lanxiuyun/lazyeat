<template>
  <div class="help-container">
    <div class="nav-bar">
      <h2 class="title">{{ $t("帮助文档") }} 2025/8/5</h2>

      <n-button @click="openInBrowser" size="small" type="info">
        <template #icon>
          <n-icon
            ><svg
              class="external-link-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
              ></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </n-icon>
        </template>
        {{ $t("在浏览器中打开") }}({{ $t("浏览器中才能正常跳转") }})
      </n-button>
    </div>

    <iframe src="/help.html" class="github-frame" title="LazyEat Help"></iframe>
  </div>
</template>

<script setup>
import { openUrl } from "@tauri-apps/plugin-opener";
import { ref } from "vue";

const helpUrl = ref("https://github.com/lanxiuyun/lazyeat/issues/30");

const openInBrowser = async () => {
  await openUrl(helpUrl.value);
};
</script>

<style scoped>
.help-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.github-frame {
  flex: 1;
  border: none;
  overflow: hidden;
  background-color: #ffffff;
  margin: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
