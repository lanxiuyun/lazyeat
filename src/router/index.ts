import { createRouter, createWebHashHistory } from "vue-router";
import MainWindow from "@/view/mainWindow/MainWindow.vue";
import SubWindow from "@/view/subWindow/SubWindow.vue";

const routes = [
  {
    path: "/",
    name: "MainWindow",
    component: MainWindow,
  },
  {
    path: "/subWindow",
    name: "SubWindow",
    component: SubWindow,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
