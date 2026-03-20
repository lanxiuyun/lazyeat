import { HandGesture, HandInfo } from "@/hand_landmark/detector";
import i18n from "@/locales/i18n";
import use_app_store from "@/store/app";
import { invoke } from "@tauri-apps/api/core";

/**
 * 动作触发器类 - 负责通过 Tauri Commands 发送操作命令到系统
 * 主要职责：
 * 1. 提供各种操作方法（移动鼠标、点击等）
 * 2. 所有方法都使用 Tauri invoke 调用 Rust 后端
 */
class TriggerAction {
  async moveMouse(x: number, y: number) {
    try {
      await invoke("move_mouse", {
        x: Math.round(x),
        y: Math.round(y),
      });
    } catch (error) {
      console.error("移动鼠标失败:", error);
    }
  }

  async clickMouse() {
    try {
      await invoke("click_mouse");
    } catch (error) {
      console.error("点击鼠标失败:", error);
    }
  }

  async scrollUp() {
    try {
      await invoke("scroll_up");
    } catch (error) {
      console.error("向上滚动失败:", error);
    }
  }

  async scrollDown() {
    try {
      await invoke("scroll_down");
    } catch (error) {
      console.error("向下滚动失败:", error);
    }
  }

  async sendKeys(key_str: string) {
    try {
      await invoke("send_keys", { keyStr: key_str });
    } catch (error) {
      console.error("发送按键失败:", error);
    }
  }

  async voiceRecord() {
    try {
      const result = await invoke<string>("start_voice_recording");
      if (result) {
        const app_store = use_app_store();
        app_store.sub_window_info(result);
      }
    } catch (error) {
      console.error("开始语音识别失败:", error);
    }
  }

  async voiceStop() {
    try {
      await invoke("stop_voice_recording");
    } catch (error) {
      console.error("停止语音识别失败:", error);
    }
  }
}

/**
 * 手势处理器类 - 负责将手势转换为具体操作
 * 主要职责:
 * 1. 接收识别到的手势类型
 * 2. 根据手势执行相应动作
 * 3. 处理防抖和连续手势确认
 */
export class GestureHandler {
  private triggerAction: TriggerAction;
  private previousGesture: HandGesture | null = null;
  private previousGestureCount: number = 0;
  private minGestureCount: number = 5;

  // 鼠标移动参数
  private screen_width: number = window.screen.width;
  private screen_height: number = window.screen.height;
  private smoothening = 7; // 平滑系数
  private prev_loc_x: number = 0;
  private prev_loc_y: number = 0;
  private prev_three_fingers_y: number = 0; // 添加三根手指上一次的 Y 坐标
  private prev_scroll2_y: number = 0;

  // 时间间隔参数
  private lastClickTime: number = 0;
  private lastScrollTime: number = 0;
  private lastFullScreenTime: number = 0;
  private lastDeleteTime: number = 0;
  private lastPointUpTime: number = 0;
  private lastPointDownTime: number = 0;

  // 时间间隔常量（毫秒）
  private readonly CLICK_INTERVAL = 500; // 点击间隔
  private readonly SCROLL_INTERVAL = 100; // 滚动间隔
  private readonly FULL_SCREEN_INTERVAL = 1500; // 全屏切换间隔
  private readonly POINT_UP_INTERVAL = 1000; // 向上指手势间隔
  private readonly POINT_DOWN_INTERVAL = 1000; // 向下指手势间隔

  // 语音识别参数
  private voice_recording: boolean = false;

  private app_store: any;
  constructor() {
    this.triggerAction = new TriggerAction();
    this.app_store = use_app_store();
  }

  /**
   * 处理食指上举手势 - 鼠标移动
   */
  private async handleIndexFingerUp(hand: HandInfo) {
    const indexTip = this.getFingerTip(hand, 1); // 食指指尖
    if (!indexTip) return;

    try {
      // 将 hand 的坐标转换为视频坐标
      const video_x =
        this.app_store.VIDEO_WIDTH - indexTip.x * this.app_store.VIDEO_WIDTH;
      const video_y = indexTip.y * this.app_store.VIDEO_HEIGHT;

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
      // 由于 x 轴方向相反，所以需要翻转
      let screenX = mapRange(
        video_x,
        this.app_store.config.boundary_left,
        this.app_store.config.boundary_left +
          this.app_store.config.boundary_width,
        0,
        this.screen_width
      );

      let screenY = mapRange(
        video_y,
        this.app_store.config.boundary_top,
        this.app_store.config.boundary_top +
          this.app_store.config.boundary_height,
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
      this.app_store.sub_windows.x = screenX + 10;
      this.app_store.sub_windows.y = screenY;
      await this.triggerAction.moveMouse(screenX, screenY);
    } catch (error) {
      console.error("处理鼠标移动失败:", error);
    }
  }

  /**
   * 处理食指和中指同时竖起手势 - 鼠标左键点击
   */
  private async handleMouseClick() {
    const now = Date.now();
    if (now - this.lastClickTime < this.CLICK_INTERVAL) {
      return;
    }
    this.lastClickTime = now;

    await this.triggerAction.clickMouse();
  }

  // 拇指和食指捏合，滚动屏幕
  private async handleScroll2(hand: HandInfo) {
    const indexTip = this.getFingerTip(hand, 1);
    const thumbTip = this.getFingerTip(hand, 0);
    if (!indexTip || !thumbTip) {
      this.prev_scroll2_y = 0;
      return;
    }

    const now = Date.now();
    if (now - this.lastScrollTime < this.SCROLL_INTERVAL) {
      return;
    }
    this.lastScrollTime = now;

    // 计算食指和拇指的距离
    const distance = Math.sqrt(
      (indexTip.x - thumbTip.x) ** 2 + (indexTip.y - thumbTip.y) ** 2
    );

    console.log(i18n.global.t("当前食指和拇指距离"), distance);

    // 如果距离大于阈值，说明没有捏合，重置上一次的 Y 坐标
    if (
      distance >
      this.app_store.config.scroll_gesture_2_thumb_and_index_threshold
    ) {
      this.prev_scroll2_y = 0;
      return;
    }

    // 如果是第一次检测到捏合，记录当前 Y 坐标
    if (this.prev_scroll2_y === 0) {
      this.prev_scroll2_y = indexTip.y;
      return;
    }

    // 计算 Y
    const deltaY = indexTip.y - this.prev_scroll2_y;

    // 如果变化超过阈值，则触发滚动
    if (Math.abs(deltaY) > 0.008) {
      if (deltaY < 0) {
        // 手指向上移动，向上滚动
        await this.triggerAction.scrollUp();
      } else {
        // 手指向下移动，向下滚动
        await this.triggerAction.scrollDown();
      }
      // 更新上一次的 Y 坐标
      this.prev_scroll2_y = indexTip.y;
    }
  }

  /**
   * 处理四根手指同时竖起手势 - 发送快捷键
   */
  private async handleFourFingers() {
    try {
      const key_str = this.app_store.config.four_fingers_up_send || "f";
      const now = Date.now();
      if (now - this.lastFullScreenTime < this.FULL_SCREEN_INTERVAL) {
        return;
      }
      this.lastFullScreenTime = now;

      await this.triggerAction.sendKeys(key_str);
    } catch (error) {
      console.error("处理四指手势失败:", error);
    }
  }

  /**
   * 处理向上指手势 - 发送快捷键
   */
  private async handlePointUp() {
    try {
      const key_str = this.app_store.config.point_up_send || "F11";
      const now = Date.now();
      if (now - this.lastPointUpTime < this.POINT_UP_INTERVAL) {
        return;
      }
      this.lastPointUpTime = now;

      await this.triggerAction.sendKeys(key_str);
    } catch (error) {
      console.error("处理向上指手势失败:", error);
    }
  }

  /**
   * 处理向下指手势 - 发送快捷键
   */
  private async handlePointDown() {
    try {
      const key_str = this.app_store.config.point_down_send || "ARROWDOWN";
      const now = Date.now();
      if (now - this.lastPointDownTime < this.POINT_DOWN_INTERVAL) {
        return;
      }
      this.lastPointDownTime = now;

      await this.triggerAction.sendKeys(key_str);
    } catch (error) {
      console.error("处理向下指手势失败:", error);
    }
  }

  /**
   * 处理拇指和小指同时竖起手势 - 开始语音识别
   */
  async handleVoiceStart() {
    if (this.voice_recording) {
      return;
    }
    await this.app_store.sub_window_info("开始语音识别");
    this.voice_recording = true;
    await this.triggerAction.voiceRecord();
  }

  /**
   * 处理拳头手势 - 停止语音识别
   */
  async handleVoiceStop() {
    if (!this.voice_recording) {
      return;
    }
    await this.app_store.sub_window_success("停止语音识别");
    this.voice_recording = false;
    await this.triggerAction.voiceStop();
  }

  /**
   * 处理删除手势
   */
  private async handleDelete() {
    const now = Date.now();
    if (now - this.lastDeleteTime < 300) {
      return;
    }
    this.lastDeleteTime = now;
    const key_str = this.app_store.config.delete_key;
    await this.triggerAction.sendKeys(key_str);
  }

  /**
   * 处理停止手势
   */
  async handleStopGesture(): Promise<void> {
    const toogle_detect = () => {
      this.app_store.flag_detecting = !this.app_store.flag_detecting;
    };

    if (this.previousGestureCount >= 60) {
      toogle_detect();
      this.previousGestureCount = 0;

      // 暂停手势识别后，更新 sub-window 进度条
      this.app_store.sub_windows.progress = 0;
    } else {
      this.previousGestureCount++;

      if (this.previousGestureCount >= 20) {
        // 更新 sub-window 进度条
        this.app_store.sub_windows.progress = Math.floor(
          (this.previousGestureCount / 60) * 100
        );
      }
    }
  }

  /**
   * 获取手指尖点
   */
  private getFingerTip(hand: HandInfo, fingerIndex: number) {
    if (!hand) return null;

    const tipIndices = [4, 8, 12, 16, 20];
    return hand.landmarks[tipIndices[fingerIndex]];
  }

  /**
   * 处理手势
   */
  async handleGesture(gesture: HandGesture, hand: HandInfo) {
    // 更新手势连续性计数
    if (gesture === this.previousGesture) {
      this.previousGestureCount++;
    } else {
      this.previousGesture = gesture;
      this.previousGestureCount = 1;
    }

    const enabled = this.app_store.config.gestures_enabled;

    // 首先处理停止手势
    if (gesture === HandGesture.STOP_GESTURE) {
      if (enabled.STOP_GESTURE && hand.categoryName === "Open_Palm") {
        await this.handleStopGesture();
      }
      return;
    }

    // 如果手势识别已暂停，则不处理
    if (!this.app_store.flag_detecting) {
      return;
    }

    // 只要切换手势就停止语音识别（语音停止不受禁用开关影响，防止无法结束语音）
    if (gesture !== HandGesture.VOICE_GESTURE_START && this.voice_recording) {
      await this.handleVoiceStop();
      return;
    }

    // 鼠标移动手势直接执行，不需要连续确认
    if (gesture === HandGesture.ONLY_INDEX_UP) {
      if (enabled.ONLY_INDEX_UP) {
        await this.handleIndexFingerUp(hand);
      }
      return;
    }

    // 其他手势需要连续确认才执行
    if (this.previousGestureCount >= this.minGestureCount) {
      switch (gesture) {
        case HandGesture.ROCK_GESTURE:
          if (enabled.ROCK_GESTURE) await this.handleMouseClick();
          break;
        case HandGesture.INDEX_AND_MIDDLE_UP:
          if (enabled.INDEX_AND_MIDDLE_UP) await this.handleMouseClick();
          break;
        case HandGesture.SCROLL_GESTURE_2:
          if (enabled.SCROLL_GESTURE_2) await this.handleScroll2(hand);
          break;
        case HandGesture.FOUR_FINGERS_UP:
          if (enabled.FOUR_FINGERS_UP) await this.handleFourFingers();
          break;
        case HandGesture.POINT_UP:
          if (enabled.POINT_UP) await this.handlePointUp();
          break;
        case HandGesture.POINT_DOWN:
          if (enabled.POINT_DOWN) await this.handlePointDown();
          break;
        case HandGesture.VOICE_GESTURE_START:
          if (enabled.VOICE_GESTURE_START) await this.handleVoiceStart();
          break;
        case HandGesture.DELETE_GESTURE:
          if (enabled.DELETE_GESTURE) await this.handleDelete();
          break;
      }
    }
  }
}
