import json
import threading
import sounddevice as sd
import numpy as np

from vosk import Model, KaldiRecognizer

big_model_path = "big-model"
small_model_path = "model"


class VoiceController:
    def __init__(self, model_type='small'):
        if model_type == 'small':
            self.model = Model(small_model_path)
        else:
            self.model = Model(big_model_path)

        self.zh_text = None
        self.is_recording = False
        self.recognizer = KaldiRecognizer(self.model, 16000)
        # 初始化输入流
        self.stream = sd.InputStream(
            samplerate=16000,
            channels=1,
            blocksize=4096,
            dtype='int16'  # 对应原来 PyAudio 的 paInt16
        )
        self.stream.start()

    def record_audio(self):
        self.frames = []
        print("录音开始...")

        # 持续录音直到标志改变
        while self.is_recording:
            data, _ = self.stream.read(4096)
            self.frames.append(data.tobytes())  # 转成 bytes，保持跟原先 pyaudio 一致

    def start_record_thread(self):
        self.is_recording = True
        threading.Thread(target=self.record_audio, daemon=True).start()

    def stop_record(self):
        self.is_recording = False

    def transcribe_audio(self) -> str:
        self.recognizer.Reset()

        # 分块处理音频数据
        for chunk in self.frames:
            self.recognizer.AcceptWaveform(chunk)

        result = json.loads(self.recognizer.FinalResult())
        text = result.get('text', '')
        text = text.replace(' ', '')
        print(f"识别结果: {text}")
        return text


if __name__ == '__main__':
    pass
    # from PyQt5.QtWidgets import QApplication, QPushButton
    #
    # app = QApplication([])
    #
    # # 点击按钮开始录音
    # voice_controller = VoiceController()
    #
    #
    # def btn_clicked():
    #     if voice_controller.is_recording:
    #         voice_controller.stop_record()
    #         text = voice_controller.transcribe_audio()
    #         print(text)
    #     else:
    #         voice_controller.start_record_thread()
    #
    #
    # btn = QPushButton('开始录音')
    # btn.clicked.connect(btn_clicked)
    # btn.show()
    #
    # app.exec_()
