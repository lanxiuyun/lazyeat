import { createRouter, createWebHashHistory } from "vue-router";
import MainWindow from "@/view/mainWindow/MainWindow.vue";

const routes = [
  {
    path: "/",
    name: "MainWindow",
    component: MainWindow,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
