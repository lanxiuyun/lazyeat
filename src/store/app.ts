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
    },

    cameras: [] as Camera[],
    selected_camera_id: "",
    VIDEO_WIDTH: 640,
    VIDEO_HEIGHT: 480,
    flag_detecting: false,
  }),
});

export default use_app_store;
