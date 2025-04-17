import i18n from "@/locales/i18n";
import router from "@/router";
import { createPinia } from "pinia";
import { createApp } from "vue";

import App from "@/App.vue";

import {
  create,
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NDivider,
  NForm,
  NFormItem,
  NIcon,
  NImage,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutFooter,
  NLayoutHeader,
  NMenu,
  NMessageProvider,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
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
    NMessageProvider,
    NAlert,
    NTag,
  ],
});

const app = createApp(App);
const pinia = createPinia();

app.use(naive);
app.use(pinia);
app.use(i18n);
app.use(router);
app.mount("#app");
