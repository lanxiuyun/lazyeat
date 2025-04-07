import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 手势枚举
export const HandGesture = {
  // 食指举起，移动鼠标
  ONLY_INDEX_UP: "only_index_up",

  // 食指和中指同时竖起 - 鼠标左键点击
  INDEX_AND_MIDDLE_UP: "index_and_middle_up",
  ROCK_GESTURE: "rock_gesture",

  // 三根手指同时竖起 - 滚动屏幕
  THREE_FINGERS_UP: "three_fingers_up",

  // 四根手指同时竖起 - 视频全屏
  FOUR_FINGERS_UP: "four_fingers_up",

  // 五根手指同时竖起 - 暂停/开始 识别
  STOP_GESTURE: "stop_gesture",

  // 拇指和食指同时竖起 - 语音识别
  VOICE_GESTURE_START: "voice_gesture_start",
  VOICE_GESTURE_STOP: "voice_gesture_stop",

  // 其他手势
  DELETE_GESTURE: "delete_gesture",

  OTHER: null,
} as const;

export type HandGestureType = (typeof HandGesture)[keyof typeof HandGesture];

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandInfo {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
}

export interface DetectionResult {
  leftHand?: HandInfo;
  rightHand?: HandInfo;
  // 原始检测结果，以防需要访问其他数据
  rawResult: any;
}

export class Detector {
  private detector: HandLandmarker | null = null;

  async initialize() {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    this.detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "/mediapipe/hand_landmarker.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 2,
    });
  }

  async detect(video: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.detector) {
      throw new Error("检测器未初始化");
    }

    const result = await this.detector.detect(video);
    const detection: DetectionResult = {
      rawResult: result,
    };

    if (result.landmarks && result.handedness) {
      for (let i = 0; i < result.landmarks.length; i++) {
        const hand: HandInfo = {
          landmarks: result.landmarks[i],
          handedness: result.handedness[i][0].categoryName as "Left" | "Right",
          score: result.handedness[i][0].score,
        };

        if (hand.handedness === "Left") {
          detection.leftHand = hand;
        } else {
          detection.rightHand = hand;
        }
      }
    }

    return detection;
  }

  // 便捷方法：获取特定手指的关键点
  static getFingerLandmarks(
    hand: HandInfo | undefined,
    fingerIndex: number
  ): HandLandmark[] | null {
    if (!hand) return null;

    const fingerIndices = {
      thumb: [1, 2, 3, 4],
      index: [5, 6, 7, 8],
      middle: [9, 10, 11, 12],
      ring: [13, 14, 15, 16],
      pinky: [17, 18, 19, 20],
    };

    const indices = Object.values(fingerIndices)[fingerIndex];
    return indices.map((i) => hand.landmarks[i]);
  }

  // 获取手指尖点
  static getFingerTip(
    hand: HandInfo | undefined,
    fingerIndex: number
  ): HandLandmark | null {
    if (!hand) return null;

    const tipIndices = [4, 8, 12, 16, 20];
    return hand.landmarks[tipIndices[fingerIndex]];
  }

  // 检测手指是否竖起
  static _fingersUp(hand: HandInfo): number[] {
    const fingers: number[] = [];
    const tipIds = [4, 8, 12, 16, 20]; // 从大拇指开始，依次为每个手指指尖

    // 检测大拇指
    if (hand.handedness === "Right") {
      if (hand.landmarks[tipIds[0]].x < hand.landmarks[tipIds[0] - 1].x) {
        fingers.push(0);
      } else {
        fingers.push(1);
      }
    } else {
      if (hand.landmarks[tipIds[0]].x > hand.landmarks[tipIds[0] - 1].x) {
        fingers.push(0);
      } else {
        fingers.push(1);
      }
    }

    // 检测其他四个手指
    for (let id = 1; id < 5; id++) {
      if (hand.landmarks[tipIds[id]].y < hand.landmarks[tipIds[id] - 2].y) {
        fingers.push(1);
      } else {
        fingers.push(0);
      }
    }

    return fingers;
  }

  // 获取单个手的手势类型
  private static getSingleHandGesture(hand: HandInfo): HandGestureType {
    const fingers = this._fingersUp(hand);

    // 0,1,2,3,4 分别代表 大拇指，食指，中指，无名指，小拇指
    if (fingers.toString() === [0, 1, 0, 0, 0].toString()) {
      return HandGesture.ONLY_INDEX_UP;
    } else if (fingers.toString() === [0, 1, 1, 0, 0].toString()) {
      return HandGesture.INDEX_AND_MIDDLE_UP;
    } else if (
      fingers.toString() === [0, 1, 0, 0, 1].toString() ||
      fingers.toString() === [1, 1, 0, 0, 1].toString()
    ) {
      return HandGesture.ROCK_GESTURE;
    } else if (fingers.toString() === [0, 1, 1, 1, 0].toString()) {
      return HandGesture.THREE_FINGERS_UP;
    } else if (fingers.toString() === [0, 1, 1, 1, 1].toString()) {
      return HandGesture.FOUR_FINGERS_UP;
    } else if (fingers.toString() === [1, 1, 1, 1, 1].toString()) {
      return HandGesture.STOP_GESTURE;
    } else if (fingers.toString() === [1, 0, 0, 0, 1].toString()) {
      return HandGesture.VOICE_GESTURE_START;
    } else if (fingers.toString() === [0, 0, 0, 0, 0].toString()) {
      return HandGesture.VOICE_GESTURE_STOP;
    } else if (
      // 拇指在左边，其他全收起 手势判断
      hand.landmarks[4].x > hand.landmarks[8].x + 0.05 &&
      hand.landmarks[4].x > hand.landmarks[12].x + 0.05 &&
      hand.landmarks[4].x > hand.landmarks[16].x + 0.05 &&
      hand.landmarks[4].x > hand.landmarks[20].x + 0.05 &&
      fingers.toString() === [1, 0, 0, 0, 0].toString()
    ) {
      return HandGesture.DELETE_GESTURE;
    } else {
      return HandGesture.OTHER;
    }
  }
}

// 添加WebSocket数据类型定义
enum WsDataType {
  // 系统消息类型
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",

  // 鼠标操作类型
  MOUSE_MOVE = "mouse_move",
  MOUSE_CLICK = "mouse_click",
  MOUSE_SCROLL_UP = "mouse_scroll_up",
  MOUSE_SCROLL_DOWN = "mouse_scroll_down",

  // 键盘操作类型
  SEND_KEYS = "send_keys",

  // 语音操作类型
  VOICE_RECORD = "voice_record",
  VOICE_STOP = "voice_stop",
}

interface WsData {
  type: WsDataType;
  msg: string;
  duration?: number;
  title?: string;
  data?: {
    x?: number;
    y?: number;
    key_str?: string;
  };
}

class TriggerAction {
  private ws: WebSocket | null = null;

  constructor() {
    this.connectWebSocket();
  }

  private connectWebSocket() {
    try {
      this.ws = new WebSocket("ws://127.0.0.1:62334/ws_lazyeat");
      this.ws.onmessage = (event: MessageEvent) => {
        const response: WsData = JSON.parse(event.data);
        this.notification({
          title: response.title || "Lazyeat",
          body: response.msg,
        });
      };
      this.ws.onopen = () => {
        console.log("ws_lazyeat connected");
      };
      this.ws.onclose = () => {
        console.log("ws_lazyeat closed, retrying...");
        this.ws = null;
        setTimeout(() => this.connectWebSocket(), 3000);
      };
      this.ws.onerror = (error) => {
        console.error("ws_lazyeat error:", error);
        this.ws?.close();
      };
    } catch (error) {
      console.error("Failed to create WebSocket instance:", error);
      this.ws = null;
      setTimeout(() => this.connectWebSocket(), 1000);
    }
  }

  async notification({ title, body }: { title: string; body: string }) {
    try {
      const { sendNotification } = await import(
        "@tauri-apps/plugin-notification"
      );
      await sendNotification({ title, body });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  moveMouse(x: number, y: number) {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.MOUSE_MOVE,
        data: { x, y },
      })
    );
  }

  clickMouse() {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.MOUSE_CLICK,
      })
    );
  }

  scrollUp() {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.MOUSE_SCROLL_UP,
      })
    );
  }

  scrollDown() {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.MOUSE_SCROLL_DOWN,
      })
    );
  }

  sendKeys(key_str: string) {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.SEND_KEYS,
        data: { key_str },
      })
    );
  }

  voiceRecord() {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.VOICE_RECORD,
      })
    );
  }

  voiceStop() {
    this.ws?.send(
      JSON.stringify({
        type: WsDataType.VOICE_STOP,
      })
    );
  }
}

import use_app_store from "@/store/app";

class GestureTrigger {
  private triggerAction: TriggerAction;
  private previousGesture: HandGestureType | null = null;
  private previousGestureCount: number = 0;
  private minGestureCount: number = 5;

  // 鼠标移动参数
  private screen_width: number = window.screen.width;
  private screen_height: number = window.screen.height;
  private smoothening = 7; // 平滑系数
  private prev_loc_x: number = 0;
  private prev_loc_y: number = 0;

  // 时间间隔参数
  private lastClickTime: number = 0;
  private lastScrollTime: number = 0;
  private lastFullScreenTime: number = 0;
  private prev_three_fingers_y: number = 0; // 添加三根手指上一次的 Y 坐标
  private lastDeleteTime: number = 0;

  // 时间间隔常量（毫秒）
  private readonly CLICK_INTERVAL = 500; // 点击间隔
  private readonly SCROLL_INTERVAL = 100; // 滚动间隔
  private readonly FULL_SCREEN_INTERVAL = 1500; // 全屏切换间隔

  constructor() {
    this.triggerAction = new TriggerAction();
  }

  // 鼠标移动参数
  _only_index_up(hand: HandInfo) {
    const app_store = use_app_store();

    const indexTip = Detector.getFingerTip(hand, 1); // 食指指尖
    if (indexTip) {
      // 将坐标转换为显示器分辨率
      const video_x = indexTip.x * app_store.VIDEO_WIDTH;
      const video_y = indexTip.y * app_store.VIDEO_HEIGHT;

      // 定义视频帧的边界
      const mouse_move_boundary = app_store.config.mouse_move_boundary; // 鼠标移动有效区域边界
      const wCam = app_store.VIDEO_WIDTH;
      const hCam = app_store.VIDEO_HEIGHT;

      // 辅助方法：将值从一个范围映射到另一个范围
      function mapRange(
        value: number,
        fromMin: number,
        fromMax: number,
        toMin: number,
        toMax: number
      ): number {
        return (
          ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin) + toMin
        );
      }

      // 将视频坐标映射到屏幕坐标
      let screenX = mapRange(
        video_x,
        mouse_move_boundary,
        wCam - mouse_move_boundary,
        0,
        this.screen_width
      );
      let screenY = mapRange(
        video_y,
        mouse_move_boundary,
        hCam - mouse_move_boundary,
        0,
        this.screen_height
      );

      screenX =
        this.prev_loc_x + (screenX - this.prev_loc_x) / this.smoothening;
      screenY =
        this.prev_loc_y + (screenY - this.prev_loc_y) / this.smoothening; // 消除抖动

      this.prev_loc_x = screenX;
      this.prev_loc_y = screenY;
      // 移动鼠标
      this.triggerAction.moveMouse(this.screen_width - screenX, screenY);
    }
  }

  // 食指和中指同时竖起 - 鼠标左键点击
  _index_and_middle_up(hand: HandInfo) {
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_INTERVAL) {
      return;
    }
    this.lastClickTime = now;

    this.triggerAction.clickMouse();
  }

  // 三根手指同时竖起 - 滚动屏幕
  _three_fingers_up(hand: HandInfo) {
    const indexTip = Detector.getFingerTip(hand, 1);
    const middleTip = Detector.getFingerTip(hand, 2);
    const ringTip = Detector.getFingerTip(hand, 3);
    if (indexTip && middleTip && ringTip) {
      const now = Date.now();
      if (now - this.lastScrollTime < this.SCROLL_INTERVAL) {
        return;
      }
      this.lastScrollTime = now;

      // 计算三根手指的平均 Y 坐标
      const currentY = (indexTip.y + middleTip.y + ringTip.y) / 3;

      // 如果是第一次检测到手势，记录当前 Y 坐标
      if (this.prev_three_fingers_y === 0) {
        this.prev_three_fingers_y = currentY;
        return;
      }

      // 计算 Y 坐标的变化
      const deltaY = currentY - this.prev_three_fingers_y;

      // 如果变化超过阈值，则触发滚动
      if (Math.abs(deltaY) > 0.008) {
        if (deltaY < 0) {
          // 手指向上移动，向上滚动
          this.triggerAction.scrollUp();
        } else {
          // 手指向下移动，向下滚动
          this.triggerAction.scrollDown();
        }
        // 更新上一次的 Y 坐标
        this.prev_three_fingers_y = currentY;
      }
    } else {
      // 如果没有检测到手指，重置上一次的 Y 坐标
      this.prev_three_fingers_y = 0;
    }
  }

  // 四根手指同时竖起 - 视频全屏
  _four_fingers_up(hand: HandInfo) {
    const app_store = use_app_store();
    const key_str = app_store.config.four_fingers_up_send;
    const now = Date.now();
    if (now - this.lastFullScreenTime < this.FULL_SCREEN_INTERVAL) {
      return;
    }
    this.lastFullScreenTime = now;

    this.triggerAction.sendKeys(key_str);
  }

  // 拇指和食指同时竖起 - 语音识别
  _voice_gesture_start(hand: HandInfo) {
    this.triggerAction.voiceRecord();
  }

  _voice_gesture_stop(hand: HandInfo) {
    this.triggerAction.voiceStop();
  }

  // 删除手势
  _delete_gesture(hand: HandInfo) {
    const now = Date.now();
    if (now - this.lastDeleteTime < 1500) {
      return;
    }
    this.lastDeleteTime = now;
    this.triggerAction.sendKeys("backspace");
  }

  // 处理手势
  handleGesture(gesture: HandGestureType, hand: HandInfo) {
    if (gesture === this.previousGesture) {
      this.previousGestureCount++;
    } else {
      this.previousGesture = gesture;
      this.previousGestureCount = 1;
    }

    // 如果是 ONLY_INDEX_UP 手势，则直接执行
    if (gesture === HandGesture.ONLY_INDEX_UP) {
      this._only_index_up(hand);
    } else {
      // 其他手势需要连续10次以上才执行
      if (this.previousGestureCount >= this.minGestureCount) {
        switch (gesture) {
          case HandGesture.ROCK_GESTURE:
          case HandGesture.INDEX_AND_MIDDLE_UP:
            this._index_and_middle_up(hand);
            break;
          case HandGesture.THREE_FINGERS_UP:
            this._three_fingers_up(hand);
            break;
          case HandGesture.FOUR_FINGERS_UP:
            this._four_fingers_up(hand);
            break;
          case HandGesture.VOICE_GESTURE_START:
            this._voice_gesture_start(hand);
            break;
          case HandGesture.VOICE_GESTURE_STOP:
            this._voice_gesture_stop(hand);
            break;
          case HandGesture.DELETE_GESTURE:
            this._delete_gesture(hand);
            break;
        }
      }
    }
  }
}

// 导出 GestureTrigger 类
export { GestureTrigger };

// 导出 GestureTrigger 实例
export const gestureTrigger = new GestureTrigger();
