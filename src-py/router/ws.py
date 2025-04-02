import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pynput.keyboard import Controller as KeyboardController
from pynput.keyboard import Key
from pynput.mouse import Button, Controller

router = APIRouter()

# 存储活跃的WebSocket连接
active_connection: WebSocket | None = None


class GestureSender:

    def __init__(self):
        self.keyboard = KeyboardController()
        self.mouse = Controller()

    def mouse_move(self, x: int, y: int):
        self.mouse.position = (x, y)

    def mouse_click(self):
        self.mouse.click(Button.left)

    def mouse_scroll_up(self):
        self.mouse.scroll(0, 1)

    def mouse_scroll_down(self):
        self.mouse.scroll(0, -1)

    def send_four_fingers_up(self, key_str: str):
        keys = self._parse_keys(key_str)
        self._send_keys(keys)

    def voice_record(self):
        self.keyboard.press(Key.space)

    def voice_stop(self):
        self.keyboard.release(Key.space)

    def _parse_keys(self, key_str: str):
        """
        解析按键字符串为实际的按键对象

        :param key_str: 按键字符串（如 'ctrl+r' 或 'F11'）
        :return: 按键列表（组合键）或单个按键
        """
        keys = key_str.split("+")
        parsed_keys = []
        for key in keys:
            key = key.strip().lower()
            if hasattr(Key, key):  # 如果是特殊键（如 ctrl, shift 等）
                parsed_keys.append(getattr(Key, key))
            elif len(key) == 1:  # 如果是单字符键（如 a, b, c 等）
                parsed_keys.append(key)
            elif key.startswith("f"):  # 如果是功能键（如 F1, F2 等）
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
                    self.keyboard.press(key)
                else:  # 特殊键
                    self.keyboard.press(key)
                pressed_keys.append(key)
            for key in reversed(pressed_keys):
                if isinstance(key, str):
                    self.keyboard.release(key)
                else:
                    self.keyboard.release(key)
        except Exception as e:
            print(f"Error sending keys: {e}")


gesture_sender = GestureSender()


@router.websocket("/ws_lazyeat")
async def websocket_endpoint(websocket: WebSocket):
    global active_connection
    await websocket.accept()

    # 存储当前连接
    active_connection = websocket

    while True:
        try:
            # 接收客户端消息
            data_str = await websocket.receive_text()

            try:
                ws_data = json.loads(data_str)
                ws_data_type = ws_data["type"]
                data = ws_data.get("data", {})

                if ws_data_type == WsDataType.MouseMove:
                    gesture_sender.mouse_move(data["x"], data["y"])
                elif ws_data_type == WsDataType.MouseClick:
                    gesture_sender.mouse_click()
                elif ws_data_type == WsDataType.MouseScrollUp:
                    gesture_sender.mouse_scroll_up()
                elif ws_data_type == WsDataType.MouseScrollDown:
                    gesture_sender.mouse_scroll_down()
                elif ws_data_type == WsDataType.VoiceRecord:
                    gesture_sender.voice_record()
                elif ws_data_type == WsDataType.VoiceStop:
                    gesture_sender.voice_stop()
                elif ws_data_type == WsDataType.FourFingersUp:
                    gesture_sender.send_four_fingers_up(data["key_str"])
            except Exception as e:
                print(f"Error processing message: {e}")

        except WebSocketDisconnect:
            # 连接断开时，清除连接
            active_connection = None
            break


class WsDataType:
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

    MouseMove = "mouse_move"
    MouseClick = "mouse_click"
    MouseScrollUp = "mouse_scroll_up"
    MouseScrollDown = "mouse_scroll_down"
    FourFingersUp = "four_fingers_up"
    VoiceRecord = "voice_record"
    VoiceStop = "voice_stop"
