import { defineStore } from "pinia";

interface Camera {
  deviceId: string;
  label: string;
  kind: string;
}

enum NotiType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

export const use_app_store = defineStore("app-store", {
  state: () => ({
    config: {
      auto_start: false,
      show_window: false,
      four_fingers_up_send: "f",
      selected_camera_id: "",

      // 识别框
      boundary_left: 100,
      boundary_top: 100,
      boundary_width: 100,
      boundary_height: 100,

      // 手势识别
      scroll_gesture_2_thumb_and_index_threshold: 0.02, // 食指和拇指距离阈值
    },

    sub_windows: {
      x: 0,
      y: 0,
      progress: 0,
      notification: "",
      noti_type: NotiType.INFO,
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

    async sub_window_info(body: string) {
      this.sub_windows.notification = body;
      this.sub_windows.noti_type = NotiType.INFO;
    },

    async sub_window_success(body: string) {
      this.sub_windows.notification = body;
      this.sub_windows.noti_type = NotiType.SUCCESS;
    },

    async sub_window_warning(body: string) {
      this.sub_windows.notification = body;
      this.sub_windows.noti_type = NotiType.WARNING;
    },

    async sub_window_error(body: string) {
      this.sub_windows.notification = body;
      this.sub_windows.noti_type = NotiType.ERROR;
    },
  },
});

export default use_app_store;
