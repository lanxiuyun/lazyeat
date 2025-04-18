import MainWindow from "@/view/mainWindow/MainWindow.vue";
import SubWindow from "@/view/subWindow/SubWindow.vue";
import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "mainWindow",
    component: MainWindow,
  },
  {
    path: "/sub-window",
    name: "subWindow",
    component: SubWindow,
  },
];

const router = createRouter({
  // 设置成 html5 模式,subWindow 才能正常工作
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;
