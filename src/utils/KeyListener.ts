/**
 * 键盘监听器 - 统一管理键盘快捷键监听逻辑
 */
export class KeyListener {
  private isListening = false;
  private callback: ((shortcut: string) => void) | null = null;
  private timeoutId: number | null = null;
  private readonly defaultTimeout = 10000; // 10秒超时

  /**
   * 开始监听键盘输入
   */
  startListening(
    callback: (shortcut: string) => void, 
    timeoutMs: number = this.defaultTimeout
  ): void {
    if (this.isListening) {
      this.stopListening();
    }

    this.isListening = true;
    this.callback = callback;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const modifiers = [];
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.shiftKey) modifiers.push('Shift');
      if (e.altKey) modifiers.push('Alt');
      if (e.metaKey) modifiers.push('Meta');

      let key = e.key;
      
      // 处理功能键
      if (key.startsWith('F') && key.length > 1 && /^F[1-9][0-2]?$/.test(key)) {
        // F1-F12 保持原样
      } 
      // 处理特殊键
      else if (key === 'Escape') {
        this.stopListening();
        return;
      }
      // 忽略单独的修饰键
      else if (key === 'Control' || key === 'Shift' || key === 'Alt' || key === 'Meta') {
        return;
      }
      // 处理其他键
      else {
        // 转换字母键为大写
        if (key.length === 1 && /[a-zA-Z]/.test(key)) {
          key = key.toUpperCase();
        }
        // 处理数字和符号键（保持原样）
      }

      const shortcut = modifiers.length > 0 
        ? [...modifiers, key].join('+')
        : key;

      this.callback?.(shortcut);
      this.stopListening();
    };

    // 添加事件监听器
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    // 设置超时
    if (timeoutMs > 0) {
      this.timeoutId = window.setTimeout(() => {
        if (this.isListening) {
          this.stopListening();
          console.warn('键盘监听超时');
        }
      }, timeoutMs);
    }

    // 保存清理函数
    this.cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (this.timeoutId) {
        window.clearTimeout(this.timeoutId);
        this.timeoutId = null;
      }
    };
  }

  /**
   * 停止监听键盘输入
   */
  stopListening(): void {
    if (!this.isListening) return;

    this.isListening = false;
    this.callback = null;
    
    if (this.cleanup) {
      this.cleanup();
      this.cleanup = null;
    }
  }

  /**
   * 检查是否正在监听
   */
  get listening(): boolean {
    return this.isListening;
  }

  /**
   * 获取当前监听状态文本
   */
  get statusText(): string {
    return this.isListening ? '请按下按键...' : '点击设置';
  }

  /**
   * 获取当前监听状态（用于UI显示）
   */
  get status(): 'warning' | undefined {
    return this.isListening ? 'warning' : undefined;
  }

  private cleanup: (() => void) | null = null;
}

/**
 * 快捷键工具函数
 */
export class ShortcutUtils {
  /**
   * 解析快捷键字符串为显示格式
   */
  static parseShortcut(shortcut: string): string {
    if (!shortcut) return '';
    
    return shortcut.split('+')
      .map(part => {
        // 美化显示
        switch(part.toLowerCase()) {
          case 'ctrl': return 'Ctrl';
          case 'shift': return 'Shift';
          case 'alt': return 'Alt';
          case 'meta': return 'Cmd';
          case 'escape': return 'Esc';
          case ' ': return 'Space';
          default: return part;
        }
      })
      .join(' + ');
  }

  /**
   * 验证快捷键是否有效
   */
  static isValidShortcut(shortcut: string): boolean {
    if (!shortcut) return false;
    
    const parts = shortcut.split('+');
    if (parts.length === 0) return false;

    // 检查是否只有修饰键
    const modifierKeys = ['Ctrl', 'Shift', 'Alt', 'Meta'];
    const lastPart = parts[parts.length - 1];
    if (modifierKeys.includes(lastPart)) {
      return false; // 不能只有修饰键
    }

    return true;
  }

  /**
   * 比较两个快捷键是否相同
   */
  static compareShortcuts(shortcut1: string, shortcut2: string): boolean {
    const normalize = (s: string) => 
      s.toLowerCase().split('+').sort().join('+');
    
    return normalize(shortcut1) === normalize(shortcut2);
  }

  /**
   * 获取快捷键的修饰键部分
   */
  static getModifiers(shortcut: string): string[] {
    if (!shortcut) return [];
    
    const parts = shortcut.split('+');
    const modifierKeys = ['Ctrl', 'Shift', 'Alt', 'Meta'];
    
    return parts.filter(part => 
      modifierKeys.includes(part) || 
      modifierKeys.map(m => m.toLowerCase()).includes(part.toLowerCase())
    );
  }

  /**
   * 获取快捷键的主键部分
   */
  static getMainKey(shortcut: string): string {
    if (!shortcut) return '';
    
    const parts = shortcut.split('+');
    const modifierKeys = ['Ctrl', 'Shift', 'Alt', 'Meta'];
    
    const mainKey = parts.find(part => 
      !modifierKeys.includes(part) && 
      !modifierKeys.map(m => m.toLowerCase()).includes(part.toLowerCase())
    );
    
    return mainKey || parts[parts.length - 1] || '';
  }
}