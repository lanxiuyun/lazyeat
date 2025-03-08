<script setup lang="ts">
import { ElContainer, ElMain, ElAside } from "element-plus";
import AppMenu from "./components/Menu.vue";
import Home from "./view/Home.vue";
import backend_api from "./backend_api";
import { onMounted, ref } from "vue";
import { os, events, app } from "@neutralinojs/lib";

const ready = ref(false);

onMounted(async () => {
  try {
    const resp_text = await backend_api.check_ready();
    ready.value = true;
  } catch (error) {
    // 启动 LazyEatBackend.exe
    os.execCommand("LazyEatBackend.exe", { background: true });

    // 每隔 1000ms 检查一次
    const interval = setInterval(async () => {
      const resp_text = await backend_api.check_ready();
      ready.value = true;

      if (ready.value) {
        clearInterval(interval);
      }
    }, 1000);
  }
});

events.on("windowClose", () => {
  backend_api.shutdown();
  setTimeout(() => {
    app.exit();
  }, 200);
});
</script>

<template>
  <n-spin :show="!ready" size="large">
    <template #description> 手势识别模块加载中... </template>

    <el-container>
      <el-aside width="200px">
        <div class="aside-header">
          <img
            style="width: 30px; height: 30px"
            src="/lazyteat.png"
            alt="logo"
            class="logo"
          />
          <span class="logo-text">LazyEat</span>
        </div>
        <AppMenu />
      </el-aside>
      <el-container>
        <el-main>
          <n-card class="ad-container">
            <iframe
              src="https://stupendous-crepe-a45ad1.netlify.app/"
              width="100%"
              height="100%"
            ></iframe>
          </n-card>
          <Home />
        </el-main>
      </el-container>
    </el-container>
  </n-spin>
</template>

<style lang="scss">
.n-spin-container {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.n-spin-content {
  height: 100%;
  width: 100%;
  overflow: auto;
}
</style>

<style scoped lang="scss">
.el-container {
  height: 100%;
  width: 100%;
}

.el-aside {
  background-color: #f5f7fa;
  border-right: 1px solid #e6e6e6;
}

.aside-header {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  border-bottom: 1px solid #e6e6e6;
}

.logo {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.logo-text {
  font-size: 18px;
}

// 广告区域
.ad-container {
  height: 220px;
  background-color: transparent;
  margin-bottom: 24px;

  iframe {
    border: none;
  }

  :deep(.n-card__content) {
    padding: 0 !important;
    padding-top: 0 !important;
  }
}
</style>
