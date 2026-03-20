const help = {
  帮助文档: "Help",
  在浏览器中打开: "Open in Browser",
  浏览器中才能正常跳转: "Browser to jump link",
};

const Guide = {
  食指和拇指距离小于值时滚动页面:
    "Scroll page when index and thumb distance is less than value",
  "可以通过右键->检查->控制台->捏合手势->查看当前距离":
    "Can check current distance by right-click -> inspect -> console -> pinch gesture",
};

export default {
  ...help,
  ...Guide,

  // menu
  首页: "Home",
  手势指南: "Gesture Guide",
  帮助: "Help",

  手势识别控制: "Gesture Recognition Control",
  运行中: "Running",
  已停止: "Stopped",
  开机自启动: "Auto Start",
  显示识别窗口: "Show Recognition Window",
  摄像头选择: "Camera Selection",
  关闭时最小化到托盘: "Minimize to Tray on Close",

  手势操作指南: "Gesture Guide",
  光标控制: "Cursor Control",
  竖起食指滑动控制光标位置:
    "Slide with index finger to control cursor position",
  单击操作: "Click Operation",
  双指举起执行鼠标单击: "Raise two fingers to perform mouse click",
  Rock手势执行鼠标单击: "Rock gesture to perform mouse click",
  滚动控制: "Scroll Control",
  三指上下滑动控制页面滚动:
    "Slide three fingers up/down to control page scrolling",
  "（okay手势）食指和拇指捏合滚动页面":
    "（okay gesture）Pinch with index and thumb to scroll page",
  食指和拇指距离小于: "Index and thumb distance less than",
  触发捏合: "Trigger pinch",
  "默认值0.02": "Default value 0.02",
  "可以通过右键->检查->控制台->捏合手势->查看当前距离":
    "Can check current distance by right-click -> inspect -> console -> pinch gesture",

  全屏控制: "Full Screen Control",
  四指并拢发送按键: "Four fingers together to send key",
  向上指: "Hand Up Gesture",
  向上指发送按键: "Five fingers open with palm up to send key",
  向下指: "Hand Down Gesture",
  向下指发送按键: "Thumb up with other fingers closed to send key",
  点击设置快捷键: "Click to set shortcut",
  "请按下按键...": "Please press keys...",
  点击设置: "Click to set",
  退格: "Backspace",
  发送退格键: "Send backspace key",
  开始语音识别:
    "Start Voice Recognition(You need to replace the chinese vosk model with En model first)",
  六指手势开始语音识别: "Six fingers gesture to start voice recognition",
  结束语音识别: "End Voice Recognition",
  拳头手势结束语音识别: "Fist gesture to end voice recognition",
  "暂停/继续": "Pause/Resume",
  "单手张开1.5秒 暂停/继续 手势识别":
    "Open one hand for 1.5 seconds to pause/resume gesture recognition",
  启用: "Enable",
  关闭: "Disable",

  识别框x: "Recognition box x",
  识别框y: "Recognition box y",
  识别框宽: "Recognition box width",
  识别框高: "Recognition box height",

  // 通知
  Lazyeat: "Lazyeat",
  提示: "Tip",
  停止语音识别: "Stop Voice Recognition",
  手势识别: "Gesture Recognition",
  继续手势识别: "Continue Gesture Recognition",
  暂停手势识别: "Pause Gesture Recognition",
};
