import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

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
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
    );
    this.detector = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
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
}
