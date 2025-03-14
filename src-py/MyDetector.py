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
            duration=duration
        )
    except Exception as e:
        traceback.print_exc()


class HandState:
    # 食指举起，移动鼠标
    only_index_up = 'only_index_up'

    # 食指和中指同时竖起 - 点击模式
    index_and_middle_up = 'index_and_middle_up'

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

    def get_hand_state(self, hand):
        fingers = self.fingersUp(hand)
        # print(fingers)

        # 0,1,2,3,4 分别代表 大拇指，食指，中指，无名指，小拇指
        if fingers == [0, 1, 0, 0, 0]:
            return HandState.only_index_up
        elif fingers == [0, 1, 1, 0, 0]:
            return HandState.index_and_middle_up
        elif fingers == [0, 1, 1, 1, 0]:
            return HandState.three_fingers_up
        elif fingers == [0, 1, 1, 1, 1]:
            return HandState.four_fingers_up
        elif fingers == [1, 1, 1, 1, 1]:
            return HandState.stop_gesture
        elif fingers == [1, 0, 0, 0, 1]:
            return HandState.voice_gesture_start
        elif fingers == [0, 0, 0, 0, 0]:
            return HandState.voice_gesture_stop
        # 拇指在左边，其他全收起 手势判断
        elif (hand['lmList'][4][0] > (hand['lmList'][8][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][12][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][16][0] + 20)
              and hand['lmList'][4][0] > (hand['lmList'][20][0] + 20)
              and fingers == [1, 0, 0, 0, 0]):
            return HandState.delete_gesture
        else:
            return HandState.other

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

            right_hand_state = self.get_hand_state(right_hand)
            left_hand_state = self.get_hand_state(left_hand)

            # 暂停/开始 识别
            if right_hand_state == HandState.stop_gesture and left_hand_state == HandState.stop_gesture:
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
            hand_state = self.get_hand_state(right_hand)

            x1, y1 = lmList[8][:-1]  # 食指指尖坐标
            x2, y2 = lmList[12][:-1]  # 中指指尖坐标
            # print(x1, y1, x2, y2)

            # 食指举起，移动鼠标
            if hand_state == HandState.only_index_up:
                # 步骤5: 坐标转换（摄像头坐标系转屏幕坐标系）
                x3 = np.interp(x1, (frameR, wCam - frameR), (0, screen_width))
                y3 = np.interp(y1, (frameR, hCam - frameR), (0, screen_height))

                # 步骤6: 平滑处理
                clocX = prev_loc_x + (x3 - prev_loc_x) / smoothening
                clocY = prev_loc_y + (y3 - prev_loc_y) / smoothening

                # 步骤7: 移动鼠标
                # print(screen_width - clocX, clocY)
                mouse.position = (screen_width - clocX, clocY)
                # mouse.position = (screen_width - (clocX * 1.1), clocY * 1.1) # *1.1 优化移动速度

                prev_loc_x, prev_loc_y = clocX, clocY

                # 更新最后移动时间, 防止误触
                self.last_move_time = time.time()

            # 食指举起，中指举起
            elif hand_state == HandState.index_and_middle_up:
                if self.is_false_touch():
                    return

                length, info = self.findDistance((x1, y1), (x2, y2))

                if length < 15:
                    current_time = time.time()
                    if not current_time - self.last_click_time > 0.5:  # 点击间隔 0.5s
                        return

                    mouse.click(Button.left, 1)
                    # print(length)
                    self.last_click_time = current_time

            # 三根手指同时竖起 - 滚动屏幕
            elif hand_state == HandState.three_fingers_up:
                if self.is_false_touch():
                    return

                y3 = np.interp(y1, (frameR, hCam - frameR), (0, screen_height))

                clocY = prev_scroll_y + (y3 - prev_scroll_y) / smoothening

                if abs(y3 - clocY) < 60:  # 防止手抖
                    return
                # print(clocY, prev_scroll_y)

                current_time = time.time()
                if current_time - self.last_scroll_time > 0.3:  # 滚动间隔 0.3s
                    if clocY > prev_scroll_y:
                        mouse.scroll(0, scroll_increment)
                    elif clocY < prev_scroll_y:
                        mouse.scroll(0, -scroll_increment)

                    self.last_scroll_time = current_time
                    prev_scroll_y = clocY

            # 四根手指同时竖起 - 视频全屏
            elif hand_state == HandState.four_fingers_up:
                if self.is_false_touch():
                    return

                current_time = time.time()
                if not current_time - self.last_full_screen_time > 1.5:
                    return
                keyboard.press('f')
                keyboard.release('f')
                self.last_full_screen_time = current_time

            # 拇指和食指同时竖起 - 语音识别
            elif hand_state == HandState.voice_gesture_start:
                if not self.voice_controller:
                    return

                if not self.voice_controller.is_recording:
                    self.voice_controller.start_record_thread()
                    show_toast(
                        title='开始语音识别',
                        msg='开始语音识别',
                        duration=1
                    )
            elif hand_state == HandState.voice_gesture_stop:
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
                    # 将文本输入到当前焦点的应用程序
                    if text:
                        keyboard.type(text)
                        keyboard.tap(Key.enter)
            elif hand_state == HandState.delete_gesture:
                keyboard.tap(Key.backspace)

    # 防止误触
    def is_false_touch(self):
        current_time = time.time()
        if current_time - self.last_move_time < 0.2:  # 防止误触, 移动鼠标后立即点击
            return True
        return False
