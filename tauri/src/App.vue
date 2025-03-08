<script setup lang="ts">
import { ElContainer, ElMain, ElAside } from "element-plus";
import AppMenu from "./components/Menu.vue";
import Home from "./view/Home.vue";
</script>

<template>
  <el-container>
    <el-aside width="200px">
      <div class="aside-header">
        <img src="./assets/vue.svg" alt="logo" class="logo" />
        <span class="logo-text">Lazyeat</span>
      </div>
      <AppMenu />
    </el-aside>
    <el-container>
      <el-main>
        <div class="ad-container">
          <iframe src="https://stupendous-crepe-a45ad1.netlify.app/" width="100%" height="100%"></iframe>
        </div>
        <Home />
      </el-main>
    </el-container>
  </el-container>
</template>

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
  background-color: #f5f7fa;
  border-radius: 10px;
  padding: 5px;
}
</style>
