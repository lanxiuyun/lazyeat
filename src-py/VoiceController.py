import json
import threading
import os

import pyaudio
from vosk import Model, KaldiRecognizer

big_model_path = "big-model"
small_model_path = "model"


class VoiceController:
    def __init__(self, model_type='small'):
        from MyDetector import show_toast

        if model_type == 'small':
            if not os.path.exists(small_model_path):
                show_toast(
                    title='语音识别模块初始化失败',
                    msg='请确保目录下存在 model 文件夹',
                    duration=3
                )
            self.model = Model(small_model_path)
        else:
            if not os.path.exists(big_model_path):
                show_toast(
                    title='语音识别模块初始化失败',
                    msg='请确保目录下存在 big-model 文件夹',
                    duration=3)
            self.model = Model(big_model_path)

        self.zh_text = None
        self.is_recording = False
        self.recognizer = KaldiRecognizer(self.model, 16000)
        self.audio = pyaudio.PyAudio()
        self.stream = self.audio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,
            input=True,
            frames_per_buffer=4096
        )

    def record_audio(self):
        self.frames = []
        print("录音开始...")

        # 持续录音直到标志改变
        while self.is_recording:
            data = self.stream.read(4096, exception_on_overflow=False)
            self.frames.append(data)

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
