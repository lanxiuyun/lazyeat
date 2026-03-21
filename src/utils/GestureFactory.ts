import { GestureAction } from './GestureAction';
import { 
  BadTwo, Boxing, FiveFive, FourFour, HandUp, HandDown, 
  Okay, OneOne, Rock, Six, TwoTwo 
} from "@icon-park/vue-next";

/**
 * 手势工厂 - 统一创建所有手势动作实例
 */
export class GestureFactory {
  /**
   * 创建所有手势动作
   */
  static createAllGestures(config: any): GestureAction[] {
    return [
      this.createCursorControlGesture(config),
      this.createClickGesture1(config),
      this.createClickGesture2(config),
      this.createScrollGesture(config),
      this.createFullscreenGesture(config),
      this.createPointUpGesture(config),
      this.createPointDownGesture(config),
      this.createThumbGesture(config),
      this.createVoiceStartGesture(config),
      this.createVoiceEndGesture(config),
      this.createPauseGesture(config),
    ];
  }

  /**
   * 光标控制手势
   */
  static createCursorControlGesture(config: any): GestureAction {
    return new GestureAction(
      'ONLY_INDEX_UP',
      '光标控制',
      '竖起食指滑动控制光标位置',
      OneOne,
      config
    );
  }

  /**
   * 单击操作手势1
   */
  static createClickGesture1(config: any): GestureAction {
    return new GestureAction(
      'INDEX_AND_MIDDLE_UP',
      '单击操作',
      '双指举起执行鼠标单击',
      TwoTwo,
      config
    );
  }

  /**
   * 单击操作手势2
   */
  static createClickGesture2(config: any): GestureAction {
    return new GestureAction(
      'ROCK_GESTURE',
      '单击操作',
      'Rock手势执行鼠标单击',
      Rock,
      config
    );
  }

  /**
   * 滚动控制手势
   */
  static createScrollGesture(config: any): GestureAction {
    return new GestureAction(
      'SCROLL_GESTURE_2',
      '滚动控制',
      '（okay手势）食指和拇指捏合滚动页面',
      Okay,
      config,
      {
        hasThreshold: true,
        thresholdKey: 'scroll_gesture_2_thumb_and_index_threshold',
        defaultValue: 0.02,
      }
    );
  }

  /**
   * 全屏控制手势
   */
  static createFullscreenGesture(config: any): GestureAction {
    return new GestureAction(
      'FOUR_FINGERS_UP',
      '全屏控制',
      '四指并拢发送按键',
      FourFour,
      config,
      {
        hasShortcut: true,
        shortcutKey: 'four_fingers_up_send',
      }
    );
  }

  /**
   * 向上指手势
   */
  static createPointUpGesture(config: any): GestureAction {
    return new GestureAction(
      'POINT_UP',
      '向上指',
      '向上指发送按键',
      HandUp,
      config,
      {
        hasShortcut: true,
        shortcutKey: 'point_up_send',
      }
    );
  }

  /**
   * 向下指手势
   */
  static createPointDownGesture(config: any): GestureAction {
    return new GestureAction(
      'POINT_DOWN',
      '向下指',
      '向下指发送按键',
      HandDown,
      config,
      {
        hasShortcut: true,
        shortcutKey: 'point_down_send',
      }
    );
  }

  /**
   * 左大拇指手势
   */
  static createThumbGesture(config: any): GestureAction {
    return new GestureAction(
      'DELETE_GESTURE',
      '左大拇指',
      '发送按键',
      BadTwo,
      config,
      {
        hasShortcut: true,
        shortcutKey: 'delete_key',
      }
    );
  }

  /**
   * 开始语音识别手势
   */
  static createVoiceStartGesture(config: any): GestureAction {
    return new GestureAction(
      'VOICE_GESTURE_START',
      '开始语音识别',
      '六指手势开始语音识别',
      Six,
      config
    );
  }

  /**
   * 结束语音识别手势
   */
  static createVoiceEndGesture(config: any): GestureAction {
    return new GestureAction(
      'VOICE_GESTURE_END',
      '结束语音识别',
      '拳头手势结束语音识别',
      Boxing,
      config
    );
  }

  /**
   * 暂停/继续手势
   */
  static createPauseGesture(config: any): GestureAction {
    return new GestureAction(
      'STOP_GESTURE',
      '暂停/继续',
      '单手张开1.5秒 暂停/继续 手势识别',
      FiveFive,
      config
    );
  }

  /**
   * 按分组创建手势
   */
  static createGesturesByGroup(config: any): Record<string, GestureAction[]> {
    const allGestures = this.createAllGestures(config);
    
    return {
      'basic': allGestures.filter(g => 
        ['ONLY_INDEX_UP', 'INDEX_AND_MIDDLE_UP', 'ROCK_GESTURE'].includes(g.id)
      ),
      'advanced': allGestures.filter(g => 
        ['SCROLL_GESTURE_2', 'FOUR_FINGERS_UP'].includes(g.id)
      ),
      'shortcut': allGestures.filter(g => 
        ['POINT_UP', 'POINT_DOWN', 'DELETE_GESTURE'].includes(g.id)
      ),
      'voice': allGestures.filter(g => 
        ['VOICE_GESTURE_START', 'VOICE_GESTURE_END'].includes(g.id)
      ),
      'control': allGestures.filter(g => 
        ['STOP_GESTURE'].includes(g.id)
      ),
    };
  }

  /**
   * 获取手势分组信息
   */
  static getGroupInfo(): Array<{id: string, name: string, description: string}> {
    return [
      { id: 'basic', name: '基础手势', description: '光标控制和点击操作' },
      { id: 'advanced', name: '高级手势', description: '滚动和全屏控制' },
      { id: 'shortcut', name: '快捷键手势', description: '自定义快捷键触发' },
      { id: 'voice', name: '语音控制', description: '语音识别控制' },
      { id: 'control', name: '系统控制', description: '手势识别暂停/继续' },
    ];
  }
}