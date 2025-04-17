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
    },

    sub_windows: {
      x: 0,
      y: 0,
      progress: 0,
      notification: "",
    },

    mission_running: false,
    cameras: [] as Camera[],
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    flag_detecting: false,
  }),
  // PiniaSharedState 来共享不同 tauri 窗口之间的状态
  share: {
    // Override global config for this store.
    enable: true,
    initialize: true,
  },
  actions: {
    is_macos() {
      return navigator.userAgent.includes("Mac");
    },
    is_windows() {
      return navigator.userAgent.includes("Windows");
    },
    is_linux() {
      return navigator.userAgent.includes("Linux");
    },
  },
});

export default use_app_store;
