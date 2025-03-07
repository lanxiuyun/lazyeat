import { createApp } from "vue";
import App from "./App.vue";
import { create } from "naive-ui";
import { NButton } from "naive-ui";
import {
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
    NCard,
  ],
});

// Import init function from "@neutralinojs/lib"
import { init } from "@neutralinojs/lib";

const app = createApp(App);

app.use(naive);
app.mount("#app");

try {
  init();
} catch (error) {
  console.log(error);
}
