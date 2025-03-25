import { createApp } from "vue";
import App from "./App.vue";
import { create } from "naive-ui";

import { createPinia } from "pinia";

import {
  NButton,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NLayoutFooter,
  NMenu,
  NSpace,
  NImage,
  NDivider,
  NSwitch,
  NSelect,
  NSpin,
  NIcon,
  NCard,
  NInput,
  NForm,
  NFormItem,
  NCheckbox,
} from "naive-ui";

// 引入element-plus
import "element-plus/dist/index.css";

const naive = create({
  components: [
    NButton,
    NLayout,
    NLayoutHeader,
    NLayoutContent,
    NLayoutFooter,
    NMenu,
    NSpace,
    NImage,
    NDivider,
    NSwitch,
    NSelect,
    NSpin,
    NIcon,
    NInput,
    NForm,
    NFormItem,
    NCheckbox,
    NCard,
  ],
});

const app = createApp(App);
const pinia = createPinia();

app.use(naive);
app.use(pinia);
app.mount("#app");
