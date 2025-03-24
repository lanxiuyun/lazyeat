import { defineStore } from "pinia";

export const use_app_store = defineStore("app-store", {
  state: () => ({
    auto_start: false,
  }),
  actions: {
    setAutoStart(value: boolean) {
      this.auto_start = value;
    },
  },
});

export default use_app_store;
