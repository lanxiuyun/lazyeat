import { GestureAction } from './GestureAction';

/**
 * 手势管理器 - 统一管理所有手势动作
 */
export class GestureManager {
  private gestures: Map<string, GestureAction> = new Map();
  private gestureGroups: Map<string, GestureAction[]> = new Map();

  /**
   * 注册手势动作
   */
  register(gesture: GestureAction, group?: string): void {
    this.gestures.set(gesture.id, gesture);
    
    if (group) {
      if (!this.gestureGroups.has(group)) {
        this.gestureGroups.set(group, []);
      }
      this.gestureGroups.get(group)!.push(gesture);
    }
  }

  /**
   * 获取所有手势动作
   */
  getAllGestures(): GestureAction[] {
    return Array.from(this.gestures.values());
  }

  /**
   * 获取指定分组的手势动作
   */
  getGesturesByGroup(group: string): GestureAction[] {
    return this.gestureGroups.get(group) || [];
  }

  /**
   * 获取单个手势动作
   */
  getGesture(id: string): GestureAction | undefined {
    return this.gestures.get(id);
  }

  /**
   * 启用所有手势
   */
  enableAll(): void {
    this.gestures.forEach(gesture => gesture.enabled = true);
  }

  /**
   * 禁用所有手势
   */
  disableAll(): void {
    this.gestures.forEach(gesture => gesture.enabled = false);
  }

  /**
   * 启用指定分组的手势
   */
  enableGroup(group: string): void {
    const gestures = this.getGesturesByGroup(group);
    gestures.forEach(gesture => gesture.enabled = true);
  }

  /**
   * 禁用指定分组的手势
   */
  disableGroup(group: string): void {
    const gestures = this.getGesturesByGroup(group);
    gestures.forEach(gesture => gesture.enabled = false);
  }

  /**
   * 获取启用的手势数量
   */
  getEnabledCount(): number {
    return this.getAllGestures().filter(gesture => gesture.enabled).length;
  }

  /**
   * 获取启用的手势列表
   */
  getEnabledGestures(): GestureAction[] {
    return this.getAllGestures().filter(gesture => gesture.enabled);
  }

  /**
   * 获取禁用的手势列表
   */
  getDisabledGestures(): GestureAction[] {
    return this.getAllGestures().filter(gesture => !gesture.enabled);
  }

  /**
   * 重置所有手势为默认值
   */
  resetAll(): void {
    this.gestures.forEach(gesture => gesture.resetToDefault());
  }

  /**
   * 获取手势分组列表
   */
  getGroups(): string[] {
    return Array.from(this.gestureGroups.keys());
  }

  /**
   * 检查是否有手势启用
   */
  hasEnabledGestures(): boolean {
    return this.getEnabledCount() > 0;
  }

  /**
   * 批量更新手势状态
   */
  batchUpdate(updates: Array<{id: string, enabled: boolean}>): void {
    updates.forEach(({id, enabled}) => {
      const gesture = this.getGesture(id);
      if (gesture) {
        gesture.enabled = enabled;
      }
    });
  }
}