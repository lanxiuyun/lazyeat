import i18n from "@/locales/i18n";
import router from "@/router";
import { createPinia } from "pinia";
import { PiniaSharedState } from "pinia-shared-state";
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
  NInputNumber,
  NSpin,
  NScrollbar,
  NSwitch,
  NProgress,
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
    NInputNumber,
    NForm,
    NFormItem,
    NCheckbox,
    NCard,
    NMessageProvider,
    NAlert,
    NScrollbar,
    NTag,
    NProgress,
  ],
});

const app = createApp(App);
const pinia = createPinia();
// Pass the plugin to your application's pinia plugin
pinia.use(
  PiniaSharedState({
    // Enables the plugin for all stores. Defaults to true.
    enable: true,
    // If set to true this tab tries to immediately recover the shared state from another tab. Defaults to true.
    initialize: false,
    // Enforce a type. One of native, idb, localstorage or node. Defaults to native.
    type: "localstorage",
  })
);

app.use(naive);
app.use(pinia);
app.use(i18n);
app.use(router);
app.mount("#app");
