/**
 * 语音识别 Vue Composable
 * 在组件中方便地使用语音识别功能
 */

import { ref, computed, onUnmounted } from 'vue';
import { speechService, type SpeechRecognitionResult, type SpeechRecognitionOptions } from './speechRecognition';

export interface UseSpeechRecognitionReturn {
  /** 当前识别文本 */
  transcript: ReturnType<typeof ref<string>>;
  /** 是否为最终结果 */
  isFinal: ReturnType<typeof ref<boolean>>;
  /** 是否正在监听 */
  isListening: ReturnType<typeof ref<boolean>>;
  /** 是否支持语音识别 */
  isSupported: ReturnType<typeof computed<boolean>>;
  /** 置信度 */
  confidence: ReturnType<typeof ref<number>>;
  /** 开始识别 */
  start: (options?: SpeechRecognitionOptions) => boolean;
  /** 停止识别 */
  stop: () => void;
  /** 清除文本 */
  clear: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const transcript = ref('');
  const isFinal = ref(false);
  const isListening = ref(false);
  const confidence = ref(0);

  const isSupported = computed(() => speechService.isSupported());

  const handleResult = (result: SpeechRecognitionResult) => {
    transcript.value = result.transcript;
    isFinal.value = result.isFinal;
    confidence.value = result.confidence;
  };

  const handleError = (error: string) => {
    console.error('[useSpeech] 错误:', error);
    isListening.value = false;
  };

  const start = (options?: SpeechRecognitionOptions): boolean => {
    clear();
    const success = speechService.start(handleResult, handleError, {
      lang: 'zh-CN',
      continuous: true,
      interimResults: true,
      ...options,
    });
    isListening.value = success;
    return success;
  };

  const stop = () => {
    speechService.stop();
    isListening.value = false;
  };

  const clear = () => {
    transcript.value = '';
    isFinal.value = false;
    confidence.value = 0;
  };

  // 组件卸载时自动停止
  onUnmounted(() => {
    stop();
  });

  return {
    transcript,
    isFinal,
    isListening,
    isSupported,
    confidence,
    start,
    stop,
    clear,
  };
}
