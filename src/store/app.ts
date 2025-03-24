import { defineStore } from "pinia";

export const use_app_store = defineStore("app-store", {
  state: () => ({
    config: {
      auto_start: false,
      show_window: false,
      camera_index: 0,
    },
  }),
});

export default use_app_store;
