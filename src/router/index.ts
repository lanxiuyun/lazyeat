import Guide from "@/view/mainWindow/Guide.vue";
import Home from "@/view/mainWindow/Home.vue";
import MainWindow from "@/view/mainWindow/MainWindow.vue";
import Update from "@/view/mainWindow/Update.vue";
import SubWindow from "@/view/subWindow/SubWindow.vue";
import { createRouter, createWebHistory } from "vue-router";
import Help from "@/view/mainWindow/Help.vue";

const routes = [
  {
    path: "/",
    name: "mainWindow",
    component: MainWindow,
    children: [
      {
        path: "",
        name: "home",
        component: Home,
      },
      {
        path: "update",
        name: "update",
        component: Update,
      },
      {
        path: "guide",
        name: "guide",
        component: Guide,
      },
      {
        path: "help",
        name: "help",
        component: Help,
      },
    ]
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
