import { GestureHandler } from "@/hand_landmark/gesture_handler";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

// 手势枚举
export enum HandGesture {
  // 食指举起，移动鼠标
  ONLY_INDEX_UP = "only_index_up",

  // 食指和中指同时竖起 - 鼠标左键点击
  INDEX_AND_MIDDLE_UP = "index_and_middle_up",
  ROCK_GESTURE = "rock_gesture",

  // 三根手指同时竖起 - 滚动屏幕
  THREE_FINGERS_UP = "three_fingers_up",

  // 四根手指同时竖起 - 视频全屏
  FOUR_FINGERS_UP = "four_fingers_up",

  // 五根手指同时竖起 - 暂停/开始 识别
  STOP_GESTURE = "stop_gesture",

  // 拇指和食指同时竖起 - 语音识别
  VOICE_GESTURE_START = "voice_gesture_start",
  VOICE_GESTURE_STOP = "voice_gesture_stop",

  // 其他手势
  DELETE_GESTURE = "delete_gesture",

  OTHER = "other"
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
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
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
  public static getSingleHandGesture(hand: HandInfo): HandGesture {
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
    rightHandGesture: HandGesture,
    leftHandGesture: HandGesture
  ): HandGesture {
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
