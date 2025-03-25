from pynput.keyboard import Controller as KeyboardController
from pynput.keyboard import Key

class GestureSender:
    class GestureObj:
        def __init__(self, value):
            self.value = value

    def __init__(self):
        self.controller = KeyboardController()
        self.four_fingers_up = GestureSender.GestureObj('f')

    def set_gesture_send(self, gesture_name: GestureObj, new_send: str):
        gesture_name.value = new_send

    def set_four_fingers_up(self):
        self.controller.tap()
