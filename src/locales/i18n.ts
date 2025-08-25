import { createI18n } from "vue-i18n";

// 导入语言包
import en from "./en";
import zh from "./zh";

// 创建 i18n 实例
const i18n = createI18n({
  locale: navigator.language.split("-")[0], // 使用系统语言作为默认语言
  // locale: "en", // 使用系统语言作为默认语言
  fallbackLocale: "zh", // 回退语言
  messages: {
    en,
    zh,
  },
});

export default i18n;
