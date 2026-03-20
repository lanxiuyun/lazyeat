/**
 * 语音识别服务
 * 基于 Web Speech API，支持中文实时语音识别
 */

export interface SpeechRecognitionOptions {
  /** 语言代码，默认中文 */
  lang?: string;
  /** 是否持续识别 */
  continuous?: boolean;
  /** 是否返回临时结果 */
  interimResults?: boolean;
  /** 最大备选结果数 */
  maxAlternatives?: number;
}

export interface SpeechRecognitionResult {
  /** 识别文本 */
  transcript: string;
  /** 置信度 0-1 */
  confidence: number;
  /** 是否为最终结果 */
  isFinal: boolean;
}

export type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;
export type SpeechErrorCallback = (error: string) => void;

class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private onResultCallback: SpeechRecognitionCallback | null = null;
  private onErrorCallback: SpeechErrorCallback | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('[Speech] 浏览器不支持 Web Speech API');
      return;
    }
    this.recognition = new SpeechRecognition();
  }

  /**
   * 是否支持语音识别
   */
  isSupported(): boolean {
    return this.recognition !== null;
  }

  /**
   * 开始语音识别
   */
  start(
    onResult: SpeechRecognitionCallback,
    onError?: SpeechErrorCallback,
    options: SpeechRecognitionOptions = {}
  ): boolean {
    if (!this.recognition) {
      onError?.('浏览器不支持语音识别');
      return false;
    }

    if (this.isListening) {
      this.stop();
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;

    // 配置参数
    this.recognition.lang = options.lang || 'zh-CN';
    this.recognition.continuous = options.continuous ?? true;
    this.recognition.interimResults = options.interimResults ?? true;
    this.recognition.maxAlternatives = options.maxAlternatives ?? 1;

    // 事件监听
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      const alternative = lastResult[0];

      const result: SpeechRecognitionResult = {
        transcript: alternative.transcript,
        confidence: alternative.confidence,
        isFinal: lastResult.isFinal,
      };

      this.onResultCallback?.(result);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech] 识别错误:', event.error);
      this.onErrorCallback?.(event.error);

      // 网络错误时自动重试
      if (event.error === 'network' && this.isListening) {
        setTimeout(() => {
          this.restart();
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      console.log('[Speech] 识别结束');
      this.isListening = false;
      // 如果是持续模式，自动重启
      if (this.recognition?.continuous) {
        this.restart();
      }
    };

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('[Speech] 开始识别，语言:', this.recognition.lang);
      return true;
    } catch (err) {
      console.error('[Speech] 启动失败:', err);
      onError?.('启动失败');
      return false;
    }
  }

  /**
   * 停止识别
   */
  stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * 重新开始识别
   */
  private restart(): void {
    if (!this.recognition || !this.isListening) return;

    try {
      this.recognition.stop();
      setTimeout(() => {
        this.recognition?.start();
      }, 100);
    } catch (err) {
      console.error('[Speech] 重启失败:', err);
    }
  }

  /**
   * 是否正在监听
   */
  get listening(): boolean {
    return this.isListening;
  }
}

// 单例导出
export const speechService = new SpeechRecognitionService();
