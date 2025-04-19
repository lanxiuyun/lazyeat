import { GestureHandler } from "@/hand_landmark/gesture_handler";
import {
  FilesetResolver,
  GestureRecognizer,
  GestureRecognizerOptions,
} from "@mediapipe/tasks-vision";

// 手势枚举
export enum HandGesture {
  // 食指举起，移动鼠标
  ONLY_INDEX_UP = "only_index_up",

  // 食指和中指同时竖起 - 鼠标左键点击
  INDEX_AND_MIDDLE_UP = "index_and_middle_up",
  ROCK_GESTURE = "rock_gesture",

  // 三根手指同时竖起 - 滚动屏幕
  THREE_FINGERS_UP = "three_fingers_up",
  SCROLL_GESTURE_2 = "scroll_gesture_2",

  // 四根手指同时竖起
  FOUR_FINGERS_UP = "four_fingers_up",

  // 五根手指同时竖起 - 暂停/开始 识别
  STOP_GESTURE = "stop_gesture",

  // 拇指和食指同时竖起 - 语音识别
  VOICE_GESTURE_START = "voice_gesture_start",
  VOICE_GESTURE_STOP = "voice_gesture_stop",

  // 其他手势
  DELETE_GESTURE = "delete_gesture",

  OTHER = "other",
}

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandInfo {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
  categoryName?: string;
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
  private detector: GestureRecognizer | null = null;
  private gestureHandler: GestureHandler | null = null;

  async initialize(useCanvas = false) {
    const vision = await FilesetResolver.forVisionTasks("/mediapipe/wasm");
    try {
      const params = {
        baseOptions: {
          modelAssetPath: "/mediapipe/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      } as GestureRecognizerOptions;
      if (useCanvas) {
        params.canvas = document.createElement("canvas");
      }

      this.detector = await GestureRecognizer.createFromOptions(vision, params);
      this.gestureHandler = new GestureHandler();
    } catch (error: any) {
      // macos 旧设备的 wkwebview 对 webgl 兼容性不好，需要手动创建 canvas
      if (error.toString().includes("kGpuService")) {
        await this.initialize(true);
      } else {
        throw error;
      }
    }
  }

  /**
   * 从视频帧检测手部
   */
  async detect(video: HTMLVideoElement): Promise<DetectionResult> {
    if (!this.detector) {
      throw new Error("检测器未初始化");
    }

    const result = await this.detector.recognize(video);
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

        if (result.gestures.length > 0) {
          hand.categoryName = result.gestures[0][0].categoryName;
        }

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
  public static getSingleHandGesture(hand: HandInfo): HandGesture {
    const fingers = this._fingersUp(hand);
    const fingerState = fingers.join(",");

    // 定义手势映射表
    const gestureMap = new Map<string, HandGesture>([
      // 食指举起，移动鼠标
      ["0,1,0,0,0", HandGesture.ONLY_INDEX_UP],

      // 鼠标左键点击手势
      ["0,1,1,0,0", HandGesture.INDEX_AND_MIDDLE_UP],
      ["0,1,0,0,1", HandGesture.ROCK_GESTURE],
      ["1,1,0,0,1", HandGesture.ROCK_GESTURE],

      // 滚动屏幕手势
      ["0,1,1,1,0", HandGesture.THREE_FINGERS_UP],
      ["1,0,1,1,1", HandGesture.SCROLL_GESTURE_2],
      ["0,0,1,1,1", HandGesture.SCROLL_GESTURE_2],

      // 四根手指同时竖起
      ["0,1,1,1,1", HandGesture.FOUR_FINGERS_UP],

      // 五根手指同时竖起 - 暂停/开始 识别
      ["1,1,1,1,1", HandGesture.STOP_GESTURE],

      // 拇指和食指同时竖起 - 语音识别
      ["1,0,0,0,1", HandGesture.VOICE_GESTURE_START],

      // 其他手势
      ["0,0,0,0,0", HandGesture.VOICE_GESTURE_STOP],
    ]);

    if (gestureMap.has(fingerState)) {
      return gestureMap.get(fingerState) as HandGesture;
    }

    // 检查删除手势
    if (this._isDeleteGesture(hand, fingers)) {
      return HandGesture.DELETE_GESTURE;
    }

    // 返回默认值
    return HandGesture.OTHER;
  }

  /**
   * 检查是否为删除手势
   */
  private static _isDeleteGesture(hand: HandInfo, fingers: number[]): boolean {
    const THUMB_INDEX = 4;
    const FINGER_TIPS = [8, 12, 16, 20];
    const distance_threshold = 0.05;

    const isThumbExtended = fingers[0] === 1;
    const areOtherFingersClosed = fingers
      .slice(1)
      .every((finger) => finger === 0);
    const isThumbLeftmost = FINGER_TIPS.every(
      (tipIndex) =>
        hand.landmarks[THUMB_INDEX].x >
        hand.landmarks[tipIndex].x + distance_threshold
    );

    return isThumbExtended && areOtherFingersClosed && isThumbLeftmost;
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

    // 优先使用右手
    let effectiveGesture = rightHandGesture;
    if (detection.rightHand) {
      effectiveGesture = rightHandGesture;
    } else if (detection.leftHand) {
      effectiveGesture = leftHandGesture;
    }

    // 将手势处理交给GestureHandler
    if (detection.rightHand) {
      this.gestureHandler?.handleGesture(effectiveGesture, detection.rightHand);
    } else if (detection.leftHand) {
      this.gestureHandler?.handleGesture(effectiveGesture, detection.leftHand);
    }
  }
}
