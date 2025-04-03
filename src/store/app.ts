import { defineStore } from "pinia";

interface Camera {
  deviceId: string;
  label: string;
  kind: string;
}

export const use_app_store = defineStore("app-store", {
  state: () => ({
    config: {
      auto_start: false,
      show_window: false,
      four_fingers_up_send: "f",
      selected_camera_id: "",
      mouse_move_boundary: 150, // 鼠标移动的有效区域边界
      
      // 时间间隔配置（毫秒）
      click_interval: 500, // 点击间隔
      scroll_interval: 100, // 滚动间隔
      full_screen_interval: 1500, // 全屏切换间隔
      delete_interval: 1500, // 删除手势间隔
      min_gesture_count: 5, // 最小手势计数
      mouse_smoothening: 7, // 鼠标移动平滑系数
    },

    mission_running: false,
    cameras: [] as Camera[],
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    flag_detecting: false,
  }),
});

export default use_app_store;
