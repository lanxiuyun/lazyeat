import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 手势枚举
export const HandGesture = {
  // 食指举起，移动鼠标
  ONLY_INDEX_UP: "only_index_up",

  // 食指和中指同时竖起 - 鼠标左键点击
  INDEX_AND_MIDDLE_UP: "index_and_middle_up",
  CLICK_GESTURE_SECOND: "click_gesture_second",

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
      return HandGesture.CLICK_GESTURE_SECOND;
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
      hand.landmarks[4].x > hand.landmarks[8].x + 20 &&
      hand.landmarks[4].x > hand.landmarks[12].x + 20 &&
      hand.landmarks[4].x > hand.landmarks[16].x + 20 &&
      hand.landmarks[4].x > hand.landmarks[20].x + 20 &&
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
  MouseMove = "mouse_move",
  MouseClick = "mouse_click",
  MouseScrollUp = "mouse_scroll_up",
  MouseScrollDown = "mouse_scroll_down",
  FourFingersUp = "four_fingers_up",
  VoiceRecord = "voice_record",
  VoiceStop = "voice_stop",
}

interface WsData {
  type: WsDataType;
  msg: string;
  duration?: number;
  title?: string;
  data?: any;
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
        this.sendNotification({
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

  private async sendNotification({
    title,
    body,
  }: {
    title: string;
    body: string;
  }) {
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
        type: WsDataType.MouseMove,
        data: { x, y },
      })
    );
  }

  clickMouse() {
    this.ws?.send(JSON.stringify({ type: WsDataType.MouseClick }));
  }

  scrollUp() {
    this.ws?.send(JSON.stringify({ type: WsDataType.MouseScrollUp }));
  }

  scrollDown() {
    this.ws?.send(JSON.stringify({ type: WsDataType.MouseScrollDown }));
  }

  voiceRecord() {
    this.ws?.send(JSON.stringify({ type: WsDataType.VoiceRecord }));
  }

  voiceStop() {
    this.ws?.send(JSON.stringify({ type: WsDataType.VoiceStop }));
  }
}

import use_app_store from "@/store/app";
const triggerAction = new TriggerAction();
class GestureTrigger {
  private previousGesture: HandGestureType | null = null;
  private previousGestureCount: number = 0;
  private minGestureCount: number = 5;

  // 鼠标移动参数
  private screen_width: number = window.screen.width;
  private screen_height: number = window.screen.height;
  private smoothening = 8; // 平滑系数
  private prev_loc_x: number = 0;
  private prev_loc_y: number = 0;

  // 时间间隔参数
  private lastClickTime: number = 0;
  private lastScrollTime: number = 0;
  private lastFullScreenTime: number = 0;

  // 时间间隔常量（毫秒）
  private readonly CLICK_INTERVAL = 500; // 点击间隔
  private readonly SCROLL_INTERVAL = 300; // 滚动间隔
  private readonly FULL_SCREEN_INTERVAL = 1500; // 全屏切换间隔

  // 食指举起，移动鼠标
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
      triggerAction.moveMouse(this.screen_width - screenX, screenY);
    }
  }

  // 食指和中指同时竖起 - 鼠标左键点击
  _index_and_middle_up(hand: HandInfo) {
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_INTERVAL) {
      return;
    }
    this.lastClickTime = now;

    triggerAction.clickMouse();
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

      // 计算手指移动方向
      const deltaY = (indexTip.y + middleTip.y + ringTip.y) / 3;
      // 根据移动方向滚动屏幕
      window.scrollBy(0, deltaY * 100);
    }
  }

  // 四根手指同时竖起 - 视频全屏
  _four_fingers_up(hand: HandInfo) {
    const indexTip = Detector.getFingerTip(hand, 1);
    const middleTip = Detector.getFingerTip(hand, 2);
    const ringTip = Detector.getFingerTip(hand, 3);
    const pinkyTip = Detector.getFingerTip(hand, 4);
    if (indexTip && middleTip && ringTip && pinkyTip) {
      const now = Date.now();
      if (now - this.lastFullScreenTime < this.FULL_SCREEN_INTERVAL) {
        return;
      }
      this.lastFullScreenTime = now;

      // 计算手指移动方向
      const deltaY = (indexTip.y + middleTip.y + ringTip.y + pinkyTip.y) / 4;
      if (deltaY < 0.3) {
        // 向上滑动
        document.documentElement.requestFullscreen();
      } else if (deltaY > 0.7) {
        // 向下滑动
        document.exitFullscreen();
      }
    }
  }

  // 五根手指同时竖起 - 暂停/开始 识别
  _stop_gesture(hand: HandInfo) {
    // 这个手势的处理逻辑应该在外部实现
    console.log("暂停/开始手势");
  }

  // 拇指和食指同时竖起 - 语音识别
  _voice_gesture_start(hand: HandInfo) {
    console.log("开始语音识别");
  }

  _voice_gesture_stop(hand: HandInfo) {
    console.log("结束语音识别");
  }

  // 删除手势
  _delete_gesture(hand: HandInfo) {
    // 模拟按下删除键
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Backspace",
        code: "Backspace",
        keyCode: 8,
        which: 8,
        bubbles: true,
      })
    );
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
          case HandGesture.CLICK_GESTURE_SECOND:
          case HandGesture.INDEX_AND_MIDDLE_UP:
            this._index_and_middle_up(hand);
            break;
          case HandGesture.THREE_FINGERS_UP:
            this._three_fingers_up(hand);
            break;
          case HandGesture.FOUR_FINGERS_UP:
            this._four_fingers_up(hand);
            break;
          case HandGesture.STOP_GESTURE:
            this._stop_gesture(hand);
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
