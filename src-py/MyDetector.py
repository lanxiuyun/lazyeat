import threading
import time
import traceback
from typing import List

import cv2
import numpy as np
import pyautogui
from pynput.keyboard import Controller as KeyboardController
from pynput.keyboard import Key
from pynput.mouse import Button, Controller
from win10toast import ToastNotifier

from HandTrackingModule import HandDetector

screen_width, screen_height = pyautogui.size()
mouse = Controller()
keyboard = KeyboardController()
notification = ToastNotifier()

######################
wCam, hCam = 640, 480
frameR = 150  # Frame Reduction
smoothening = 7  # random value
######################

prev_loc_x, prev_loc_y = 0, 0

# 滚动屏幕的增量
scroll_increment = 1
prev_scroll_y = 0


def show_toast(title: str = '手势识别',
               msg: str = '手势识别',
               duration: int = 1):
    try:
        notification.show_toast(
            title=title,
            msg=msg,
            duration=duration,
            icon_path='icon.ico',
            threaded=True
        )
    except Exception as e:
        traceback.print_exc()


class HandGesture:
    # 食指举起，移动鼠标
    only_index_up = 'only_index_up'

    # 食指和中指同时竖起 - 鼠标左键点击
    index_and_middle_up = 'index_and_middle_up'
    click_gesture_second = 'click_gesture_second'

    # 三根手指同时竖起 - 滚动屏幕
    three_fingers_up = 'three_fingers_up'

    # 四根手指同时竖起 - 视频全屏
    four_fingers_up = 'four_fingers_up'

    # 五根手指同时竖起 - 暂停/开始 识别
    stop_gesture = 'stop_gesture'

    # 拇指和食指同时竖起 - 语音识别
    voice_gesture_start = 'voice_gesture_start'
    voice_gesture_stop = 'voice_gesture_stop'

    # 其他手势
    delete_gesture = 'delete_gesture'

    other = None


class MyDetector(HandDetector):
    """
    hand 为 findHands() 方法返回的字典信息
    lmList 为手部21个关键点的坐标信息, (x, y, z)
    """
    last_move_time = 0
    last_click_time = 0
    last_scroll_time = 0
    last_full_screen_time = 0
    last_change_flag_time = 0

    flag_detect = True
    voice_controller = None

    def __init__(self, mode=False, maxHands=2, detectionCon=0.5, minTrackCon=0.5):
        super().__init__(mode, maxHands, detectionCon, minTrackCon)

        def init_voice_controller():
            from VoiceController import VoiceController

            self.voice_controller = VoiceController()
            show_toast(
                title='语音识别模块初始化成功',
                msg='语音识别模块初始化成功',
                duration=1
            )

        thread = threading.Thread(target=init_voice_controller, daemon=True)
        thread.start()

    def get_hand_gesture(self, hand):
        fingers = self.fingersUp(hand)
        # print(fingers)

        # 0,1,2,3,4 分别代表 大拇指，食指，中指，无名指，小拇指
        if fingers == [0, 1, 0, 0, 0]:
            return HandGesture.only_index_up
        elif fingers == [0, 1, 1, 0, 0]:
            return HandGesture.index_and_middle_up
        elif fingers == [0, 1, 0, 0, 1] or fingers == [1, 1, 0, 0, 1]:
            return HandGesture.click_gesture_second
        elif fingers == [0, 1, 1, 1, 0]:
            return HandGesture.three_fingers_up
        elif fingers == [0, 1, 1, 1, 1]:
            return HandGesture.four_fingers_up
        elif fingers == [1, 1, 1, 1, 1]:
            return HandGesture.stop_gesture
        elif fingers == [1, 0, 0, 0, 1]:
            return HandGesture.voice_gesture_start
        elif fingers == [0, 0, 0, 0, 0]:
            return HandGesture.voice_gesture_stop
        # 拇指在左边，其他全收起 手势判断
        elif (hand['lmList'][4][0] > (hand['lmList'][8][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][12][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][16][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][20][0] + 20)
              and fingers == [1, 0, 0, 0, 0]):
            return HandGesture.delete_gesture
        else:
            return HandGesture.other

    def draw_mouse_move_box(self, img) -> np.ndarray:
        cv2.rectangle(img, (frameR, frameR), (wCam - frameR, hCam - frameR),
                      (255, 0, 255), 2)
        return img

    def process(self, all_hands: List[dict]):
        global prev_loc_x, prev_loc_y, prev_scroll_y

        # 没有手
        if len(all_hands) <= 0:
            return

        # 暂停识别
        if len(all_hands) == 2:
            right_hand = all_hands[0]
            left_hand = all_hands[1]

            # 两只手的类型相同, 不处理
            if right_hand['type'] == left_hand['type']:
                return

            right_hand_gesture = self.get_hand_gesture(right_hand)
            left_hand_state = self.get_hand_gesture(left_hand)

            # 暂停/开始 识别
            if right_hand_gesture == HandGesture.stop_gesture and left_hand_state == HandGesture.stop_gesture:
                current_time = time.time()
                if not current_time - self.last_change_flag_time > 1.5:
                    return

                self.flag_detect = not self.flag_detect

                show_toast(
                    msg='继续手势识别' if self.flag_detect else '暂停手势识别',
                    duration=1
                )
                self.last_change_flag_time = current_time

        if not self.flag_detect:
            return

        # 只有一只手
        if len(all_hands) >= 1:
            if len(all_hands) == 1:
                right_hand = all_hands[0]
            else:
                right_hand = all_hands[0] if all_hands[0]['type'] == 'Right' else all_hands[1]

            lmList, bbox = right_hand['lmList'], right_hand['bbox']
            hand_state = self.get_hand_gesture(right_hand)

            x1, y1 = lmList[8][:-1]  # 食指指尖坐标
            x2, y2 = lmList[12][:-1]  # 中指指尖坐标

            if hand_state == HandGesture.only_index_up:
                self._trigger_mouse_move(x1, y1)
            elif hand_state == HandGesture.index_and_middle_up or hand_state == HandGesture.click_gesture_second:
                self._trigger_mouse_click()
            elif hand_state == HandGesture.three_fingers_up:
                self._trigger_scroll(y1)
            elif hand_state == HandGesture.four_fingers_up:
                self._trigger_four_fingers_up()
            elif hand_state == HandGesture.voice_gesture_start:
                self._trigger_voice_record_start()
            elif hand_state == HandGesture.voice_gesture_stop:
                self._trigger_voice_record_stop()
            elif hand_state == HandGesture.delete_gesture:
                self._trigger_backspace()

    def _trigger_mouse_move(self, x1, y1):
        global prev_loc_x, prev_loc_y

        x3 = np.interp(x1, (frameR, wCam - frameR), (0, screen_width))
        y3 = np.interp(y1, (frameR, hCam - frameR), (0, screen_height))

        clocX = prev_loc_x + (x3 - prev_loc_x) / smoothening
        clocY = prev_loc_y + (y3 - prev_loc_y) / smoothening

        mouse.position = (screen_width - clocX, clocY)
        prev_loc_x, prev_loc_y = clocX, clocY
        self.last_move_time = time.time()

    def _trigger_mouse_click(self):
        current_time = time.time()
        if not current_time - self.last_click_time > 0.5:
            return

        mouse.click(Button.left, 1)
        self.last_click_time = current_time

    def _trigger_scroll(self, y1):
        global prev_scroll_y

        y3 = np.interp(y1, (frameR, hCam - frameR), (0, screen_height))
        clocY = prev_scroll_y + (y3 - prev_scroll_y) / smoothening

        if abs(y3 - clocY) < 60:
            return

        current_time = time.time()
        if current_time - self.last_scroll_time > 0.3:
            if clocY > prev_scroll_y:
                mouse.scroll(0, scroll_increment)
            elif clocY < prev_scroll_y:
                mouse.scroll(0, -scroll_increment)

            self.last_scroll_time = current_time
            prev_scroll_y = clocY

    def _trigger_voice_record_start(self):
        if not self.voice_controller:
            return

        if not self.voice_controller.is_recording:
            self.voice_controller.start_record_thread()
            show_toast(
                title='开始语音识别',
                msg='开始语音识别',
                duration=1
            )

    def _trigger_voice_record_stop(self):
        if not self.voice_controller:
            return

        if self.voice_controller.is_recording:
            self.voice_controller.stop_record()
            show_toast(
                title='结束语音识别',
                msg='结束语音识别',
                duration=1
            )

            text = self.voice_controller.transcribe_audio()
            if text:
                keyboard.type(text)
                keyboard.tap(Key.enter)

    def _trigger_backspace(self):
        keyboard.tap(Key.backspace)

    def _trigger_four_fingers_up(self):
        from pinia_store import PINIA_STORE

        current_time = time.time()
        if not current_time - self.last_full_screen_time > 1.5:
            return

        gesture_sender = PINIA_STORE.gesture_sender
        gesture_sender.send_four_fingers_up()
        self.last_full_screen_time = current_time
