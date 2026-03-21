/**
 * 手势动作类 - 封装单个手势的启用/禁用逻辑
 */
export class GestureAction {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly icon: any,
    private readonly config: any, // 引用app_store.config
    public readonly extraOptions?: {
      hasThreshold?: boolean;
      thresholdKey?: string;
      defaultValue?: number;
      hasShortcut?: boolean;
      shortcutKey?: string;
    }
  ) {}

  /**
   * 获取手势是否启用
   */
  get enabled(): boolean {
    return this.config.gestures_enabled?.[this.id] || false;
  }

  /**
   * 设置手势启用状态
   */
  set enabled(value: boolean) {
    if (!this.config.gestures_enabled) {
      this.config.gestures_enabled = {};
    }
    this.config.gestures_enabled[this.id] = value;
  }

  /**
   * 切换手势启用状态
   */
  toggle(): void {
    this.enabled = !this.enabled;
  }

  /**
   * 获取阈值配置
   */
  get threshold(): number | undefined {
    if (this.extraOptions?.hasThreshold && this.extraOptions.thresholdKey) {
      return this.config[this.extraOptions.thresholdKey];
    }
    return undefined;
  }

  /**
   * 设置阈值配置
   */
  set threshold(value: number | undefined) {
    if (this.extraOptions?.hasThreshold && this.extraOptions.thresholdKey) {
      this.config[this.extraOptions.thresholdKey] = value;
    }
  }

  /**
   * 获取快捷键配置
   */
  get shortcut(): string | undefined {
    if (this.extraOptions?.hasShortcut && this.extraOptions.shortcutKey) {
      return this.config[this.extraOptions.shortcutKey];
    }
    return undefined;
  }

  /**
   * 设置快捷键配置
   */
  set shortcut(value: string | undefined) {
    if (this.extraOptions?.hasShortcut && this.extraOptions.shortcutKey) {
      this.config[this.extraOptions.shortcutKey] = value;
    }
  }

  /**
   * 重置为默认值
   */
  resetToDefault(): void {
    this.enabled = false;
    if (this.extraOptions?.hasThreshold && this.extraOptions.defaultValue !== undefined) {
      this.threshold = this.extraOptions.defaultValue;
    }
    if (this.extraOptions?.hasShortcut) {
      this.shortcut = '';
    }
  }

  /**
   * 检查是否有额外配置选项
   */
  hasExtraOptions(): boolean {
    return !!this.extraOptions && (
      this.extraOptions.hasThreshold || 
      this.extraOptions.hasShortcut
    );
  }
}