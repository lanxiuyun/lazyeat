import use_app_store from "@/store/app";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 手势枚举
const HandGesture = {
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

type HandGestureType = (typeof HandGesture)[keyof typeof HandGesture];

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface HandInfo {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
}

interface DetectionResult {
  leftHand?: HandInfo;
  rightHand?: HandInfo;
  // 原始检测结果，以防需要访问其他数据
  rawResult: any;
}

/**
 * 检测器类 - 负责手势识别和手势分类
 * 主要职责:
 * 1. 初始化和管理MediaPipe HandLandmarker
 * 2. 检测视频帧中的手部
 * 3. 分析手势类型(手指竖起等)
 * 4. 提供手部关键点查询方法
 */
export class Detector {
  private detector: HandLandmarker | null = null;
  private gestureHandler: GestureHandler | null = null;

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
    this.gestureHandler = new GestureHandler();
  }

  /**
   * 从视频帧检测手部
   */
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

  /**
   * 便捷方法：获取特定手指的关键点
   */
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

  /**
   * 获取手指尖点
   */
  static getFingerTip(
    hand: HandInfo | undefined,
    fingerIndex: number
  ): HandLandmark | null {
    if (!hand) return null;

    const tipIndices = [4, 8, 12, 16, 20];
    return hand.landmarks[tipIndices[fingerIndex]];
  }

  /**
   * 检测手指是否竖起
   */
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

  /**
   * 获取单个手的手势类型
   */
  public static getSingleHandGesture(hand: HandInfo): HandGestureType {
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

  /**
   * 处理检测结果并执行相应动作
   */
  async process(detection: DetectionResult): Promise<void> {
    const rightHandGesture = detection.rightHand
      ? Detector.getSingleHandGesture(detection.rightHand)
      : HandGesture.OTHER;
    const leftHandGesture = detection.leftHand
      ? Detector.getSingleHandGesture(detection.leftHand)
      : HandGesture.OTHER;

    const effectiveGesture = this.getEffectiveGesture(
      rightHandGesture,
      leftHandGesture
    );

    // 将手势处理交给GestureHandler
    if (detection.rightHand) {
      this.gestureHandler?.handleGesture(effectiveGesture, detection.rightHand);
    } else if (detection.leftHand) {
      this.gestureHandler?.handleGesture(effectiveGesture, detection.leftHand);
    }
  }

  /**
   * 获取有效手势
   */
  private getEffectiveGesture(
    rightHandGesture: HandGestureType,
    leftHandGesture: HandGestureType
  ): HandGestureType {
    // 如果左右手都是暂停手势，才执行暂停手势
    if (
      rightHandGesture === HandGesture.STOP_GESTURE &&
      leftHandGesture === HandGesture.STOP_GESTURE
    ) {
      return HandGesture.STOP_GESTURE;
    }

    // 如果右手手势不是 OTHER 且不是 STOP_GESTURE，则返回右手手势
    if (
      rightHandGesture !== HandGesture.OTHER &&
      rightHandGesture !== HandGesture.STOP_GESTURE
    ) {
      return rightHandGesture;
    }
    // 如果右手手势是 STOP_GESTURE，则返回 OTHER
    if (rightHandGesture === HandGesture.STOP_GESTURE) {
      return HandGesture.OTHER;
    }
    // 如果右手手势是 OTHER，再检查左手手势
    if (
      leftHandGesture !== HandGesture.OTHER &&
      leftHandGesture !== HandGesture.STOP_GESTURE
    ) {
      return leftHandGesture;
    }
    // 如果左手手势是 STOP_GESTURE，则返回 OTHER
    if (leftHandGesture === HandGesture.STOP_GESTURE) {
      return HandGesture.OTHER;
    }
    // 如果左右手都没有有效手势，则返回 OTHER
    return HandGesture.OTHER;
  }
}

// WebSocket数据类型定义
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
  msg?: string;
  duration?: number;
  title?: string;
  data?: {
    x?: number;
    y?: number;
    key_str?: string;
  };
}

/**
 * 动作触发器类 - 负责发送操作命令到系统
 * 主要职责：
 * 1. 维护WebSocket连接
 * 2. 提供各种操作方法（移动鼠标、点击等）
 * 3. 发送通知
 */
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
          body: response.msg || "",
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
      console.log("notification", title, body);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  }

  private send(data: { type: WsDataType } & Partial<Omit<WsData, "type">>) {
    const message: WsData = {
      type: data.type,
      msg: data.msg || "",
      title: data.title || "Lazyeat",
      duration: data.duration || 1,
      data: data.data || {},
    };
    this.ws?.send(JSON.stringify(message));
  }

  moveMouse(x: number, y: number) {
    this.send({
      type: WsDataType.MOUSE_MOVE,
      data: { x, y },
    });
  }

  clickMouse() {
    this.send({
      type: WsDataType.MOUSE_CLICK,
    });
  }

  scrollUp() {
    this.send({
      type: WsDataType.MOUSE_SCROLL_UP,
    });
  }

  scrollDown() {
    this.send({
      type: WsDataType.MOUSE_SCROLL_DOWN,
    });
  }

  sendKeys(key_str: string) {
    this.send({
      type: WsDataType.SEND_KEYS,
      data: { key_str },
    });
  }

  voiceRecord() {
    this.send({
      type: WsDataType.VOICE_RECORD,
    });
  }

  voiceStop() {
    this.send({
      type: WsDataType.VOICE_STOP,
    });
  }
}

/**
 * 手势处理器类 - 负责将手势转换为具体操作
 * 主要职责:
 * 1. 接收识别到的手势类型
 * 2. 根据手势执行相应动作
 * 3. 处理防抖和连续手势确认
 */
class GestureHandler {
  private triggerAction: TriggerAction;
  private previousGesture: HandGestureType | null = null;
  private previousGestureCount: number = 0;
  private minGestureCount: number = 5;
  private lastStopGestureTime: number = 0;

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

  private app_store: any;

  constructor() {
    this.triggerAction = new TriggerAction();
    this.app_store = use_app_store();
  }

  /**
   * 处理食指上举手势 - 鼠标移动
   */
  private handleIndexFingerUp(hand: HandInfo) {
    const indexTip = Detector.getFingerTip(hand, 1); // 食指指尖
    if (!indexTip) return;

    try {
      // 将坐标转换为显示器分辨率
      const video_x = indexTip.x * this.app_store.VIDEO_WIDTH;
      const video_y = indexTip.y * this.app_store.VIDEO_HEIGHT;

      // 获取鼠标移动边界配置
      const mouse_move_boundary =
        this.app_store.config.mouse_move_boundary || 50; // 默认值为50
      const wCam = this.app_store.VIDEO_WIDTH;
      const hCam = this.app_store.VIDEO_HEIGHT;

      /**
       * 辅助方法：将值从一个范围映射到另一个范围
       */
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

      // 应用平滑处理
      screenX =
        this.prev_loc_x + (screenX - this.prev_loc_x) / this.smoothening;
      screenY =
        this.prev_loc_y + (screenY - this.prev_loc_y) / this.smoothening; // 消除抖动

      this.prev_loc_x = screenX;
      this.prev_loc_y = screenY;

      // 移动鼠标
      this.triggerAction.moveMouse(this.screen_width - screenX, screenY);
    } catch (error) {
      console.error("处理鼠标移动失败:", error);
    }
  }

  /**
   * 处理食指和中指同时竖起手势 - 鼠标左键点击
   */
  private handleMouseClick() {
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_INTERVAL) {
      return;
    }
    this.lastClickTime = now;

    this.triggerAction.clickMouse();
  }

  /**
   * 处理三根手指同时竖起手势 - 滚动屏幕
   */
  private handleScroll(hand: HandInfo) {
    const indexTip = Detector.getFingerTip(hand, 1);
    const middleTip = Detector.getFingerTip(hand, 2);
    const ringTip = Detector.getFingerTip(hand, 3);
    if (!indexTip || !middleTip || !ringTip) {
      this.prev_three_fingers_y = 0;
      return;
    }

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
  }

  /**
   * 处理四根手指同时竖起手势 - 发送快捷键
   */
  private handleFourFingers() {
    try {
      const key_str = this.app_store.config.four_fingers_up_send || "f";
      const now = Date.now();
      if (now - this.lastFullScreenTime < this.FULL_SCREEN_INTERVAL) {
        return;
      }
      this.lastFullScreenTime = now;

      this.triggerAction.sendKeys(key_str);
    } catch (error) {
      console.error("处理四指手势失败:", error);
    }
  }

  /**
   * 处理拇指和小指同时竖起手势 - 开始语音识别
   */
  private handleVoiceStart() {
    this.triggerAction.voiceRecord();
  }

  /**
   * 处理拳头手势 - 停止语音识别
   */
  private handleVoiceStop() {
    this.triggerAction.voiceStop();
  }

  /**
   * 处理删除手势
   */
  private handleDelete() {
    const now = Date.now();
    if (now - this.lastDeleteTime < 1500) {
      return;
    }
    this.lastDeleteTime = now;
    this.triggerAction.sendKeys("backspace");
  }

  /**
   * 处理停止手势
   */
  async handleStopGesture(): Promise<void> {
    const now = Date.now();
    // 如果距离上次暂停手势触发时间小于1.5秒，则忽略当前暂停手势
    if (now - this.lastStopGestureTime > 1500) {
      this.lastStopGestureTime = now;
      this.app_store.flag_detecting = !this.app_store.flag_detecting;
      this.triggerAction.notification({
        title: "手势识别",
        body: this.app_store.flag_detecting ? "继续手势识别" : "暂停手势识别",
      });
    }
  }

  /**
   * 处理手势
   */
  handleGesture(gesture: HandGestureType, hand: HandInfo) {
    // 首先处理停止手势
    if (gesture === HandGesture.STOP_GESTURE) {
      this.handleStopGesture();
      return;
    }

    // 如果手势识别已暂停，则不处理其他手势
    if (!this.app_store.flag_detecting) {
      return;
    }

    // 更新手势连续性计数
    if (gesture === this.previousGesture) {
      this.previousGestureCount++;
    } else {
      this.previousGesture = gesture;
      this.previousGestureCount = 1;
    }

    // 鼠标移动手势直接执行，不需要连续确认
    if (gesture === HandGesture.ONLY_INDEX_UP) {
      this.handleIndexFingerUp(hand);
      return;
    }

    // 其他手势需要连续确认才执行
    if (this.previousGestureCount >= this.minGestureCount) {
      switch (gesture) {
        case HandGesture.ROCK_GESTURE:
        case HandGesture.INDEX_AND_MIDDLE_UP:
          this.handleMouseClick();
          break;
        case HandGesture.THREE_FINGERS_UP:
          this.handleScroll(hand);
          break;
        case HandGesture.FOUR_FINGERS_UP:
          this.handleFourFingers();
          break;
        case HandGesture.VOICE_GESTURE_START:
          this.handleVoiceStart();
          break;
        case HandGesture.VOICE_GESTURE_STOP:
          this.handleVoiceStop();
          break;
        case HandGesture.DELETE_GESTURE:
          this.handleDelete();
          break;
      }
    }
  }
}
