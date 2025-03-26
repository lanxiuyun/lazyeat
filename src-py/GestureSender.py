from pynput.keyboard import Controller as KeyboardController, Key, KeyCode


class GestureSender:
    class GestureObj:
        def __init__(self, value):
            self.value = value  # 储存手势对应的按键或组合键

    def __init__(self):
        self.controller = KeyboardController()
        self.four_fingers_up = GestureSender.GestureObj('f')  # 初始化默认手势

    def set_gesture_send(self, gesture_name: GestureObj, new_send: str):
        """
        设置手势对应的动作（按键或组合键）

        :param gesture_name: 手势对象
        :param new_send: 新的按键动作（单个按键或组合键）
        """
        gesture_name.value = new_send

    def _parse_keys(self, key_str: str):
        """
        解析按键字符串为实际的按键对象

        :param key_str: 按键字符串（如 'ctrl+r' 或 'F11'）
        :return: 按键列表（组合键）或单个按键
        """
        keys = key_str.split('+')
        parsed_keys = []
        for key in keys:
            key = key.strip().lower()
            if hasattr(Key, key):  # 如果是特殊键（如 ctrl, shift 等）
                parsed_keys.append(getattr(Key, key))
            elif len(key) == 1:  # 如果是单字符键（如 a, b, c 等）
                parsed_keys.append(key)
            elif key.startswith('f'):  # 如果是功能键（如 F1, F2 等）
                try:
                    parsed_keys.append(getattr(Key, key))
                except AttributeError:
                    raise ValueError(f"Invalid function key: {key}")
            else:
                raise ValueError(f"Invalid key: {key}")
        return parsed_keys

    def _send_keys(self, keys):
        """
        发送按键事件（支持组合键）

        :param keys: 按键列表
        """
        pressed_keys = []
        try:
            for key in keys:
                if isinstance(key, str):  # 单字符键
                    self.controller.press(key)
                else:  # 特殊键
                    self.controller.press(key)
                pressed_keys.append(key)
            for key in reversed(pressed_keys):
                if isinstance(key, str):
                    self.controller.release(key)
                else:
                    self.controller.release(key)
        except Exception as e:
            print(f"Error sending keys: {e}")

    def send_four_fingers_up(self):
        """
        根据当前设置发送 'four_fingers_up' 手势对应的按键事件
        """
        gesture_value = self.four_fingers_up.value
        if not gesture_value:
            print("Gesture 'four_fingers_up' is not defined.")
            return

        keys = self._parse_keys(gesture_value)
        self._send_keys(keys)


# 示例用法
if __name__ == "__main__":
    sender = GestureSender()

    # 设置新的手势动作
    sender.set_gesture_send(sender.four_fingers_up, "ctrl+r")  # 设置为组合键
    sender.send_four_fingers_up()  # 触发发送组合键 ctrl + r

    # 修改手势动作为单个按键
    sender.set_gesture_send(sender.four_fingers_up, "F11")  # 设置为单个按键 F11
    sender.send_four_fingers_up()  # 触发发送单个按键 F11
