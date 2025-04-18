import json
from dataclasses import dataclass
from typing import Dict, List, Optional, Union

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pynput.keyboard import Controller as KeyboardController
from pynput.keyboard import Key
from pynput.mouse import Button, Controller

router = APIRouter()

# 存储活跃的WebSocket连接
active_connection: Optional[WebSocket] = None


@dataclass
class WebSocketMessage:
    """WebSocket消息数据类"""

    type: str
    msg: str = ""
    title: str = "提示"
    duration: int = 1
    data: Dict = None

    def __post_init__(self):
        if self.data is None:
            self.data = {"x": 0, "y": 0, "key_str": ""}

    def to_dict(self) -> Dict:
        """将消息转换为字典格式"""
        return {
            "type": self.type,
            "msg": self.msg,
            "title": self.title,
            "duration": self.duration,
            "data": self.data,
        }


class WebSocketMessageType:
    """WebSocket消息类型常量"""

    # 系统消息类型
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"

    # 鼠标操作类型
    MOUSE_MOVE = "mouse_move"
    MOUSE_CLICK = "mouse_click"
    MOUSE_SCROLL_UP = "mouse_scroll_up"
    MOUSE_SCROLL_DOWN = "mouse_scroll_down"

    # 键盘操作类型
    SEND_KEYS = "send_keys"

    # 语音操作类型
    VOICE_RECORD = "voice_record"
    VOICE_STOP = "voice_stop"


class MessageSender:
    """消息发送器,发送给前端"""

    @staticmethod
    async def send_message(
        ws_data_type: str, msg: str, title: str = "提示", duration: int = 1
    ) -> None:
        """
        发送消息到WebSocket客户端

        Args:
            ws_data_type: 消息类型
            msg: 消息内容
            title: 消息标题
            duration: 显示持续时间
        """
        if not active_connection:
            return

        try:
            message = WebSocketMessage(
                type=ws_data_type, msg=msg, title=title, duration=duration
            )
            await active_connection.send_json(message.to_dict())
        except Exception as e:
            print(f"发送消息失败: {e}")


class GestureHandler:
    """手势控制器"""

    def __init__(self):
        self.keyboard = KeyboardController()
        self.mouse = Controller()

    def move_mouse(self, x: int, y: int) -> None:
        """移动鼠标到指定位置"""
        self.mouse.position = (x, y)

    def click_mouse(self) -> None:
        """点击鼠标左键"""
        self.mouse.click(Button.left)

    def scroll_up(self) -> None:
        """向上滚动"""
        self.mouse.scroll(0, 1)

    def scroll_down(self) -> None:
        """向下滚动"""
        self.mouse.scroll(0, -1)

    def send_keys(self, key_str: str) -> None:
        """
        发送按键事件（支持组合键）

        Args:
            key_str: 按键字符串（如 'ctrl+r' 或 'F11'）
        """
        try:
            keys = [self.__parse_key(key) for key in key_str.split("+")]
            self.__execute_keys(keys)
        except Exception as e:
            print(f"发送按键失败: {e}")

    def __parse_key(self, key_str: str) -> Union[str, Key]:
        """
        解析单个按键

        Args:
            key_str: 按键字符串

        Returns:
            解析后的按键对象
        """
        key_str = key_str.strip().lower()

        if hasattr(Key, key_str):
            return getattr(Key, key_str)
        elif len(key_str) == 1:
            return key_str
        elif key_str.startswith("f"):
            try:
                return getattr(Key, key_str)
            except AttributeError:
                raise ValueError(f"无效的功能键: {key_str}")
        else:
            raise ValueError(f"无效的按键: {key_str}")

    def __execute_keys(self, keys: List[Union[str, Key]]) -> None:
        """
        执行按键序列

        Args:
            keys: 按键列表
        """
        pressed_keys = []
        try:
            # 按下所有键
            for key in keys:
                self.keyboard.press(key)
                pressed_keys.append(key)

            # 释放所有键（按相反顺序）
            for key in reversed(pressed_keys):
                self.keyboard.release(key)
        except Exception as e:
            print(f"执行按键失败: {e}")


class VoiceHandler:
    """语音处理控制器"""

    def __init__(self):
        from VoiceController import VoiceController

        self.controller: Optional[VoiceController] = None
        try:
            self.controller = VoiceController()
        except Exception as e:
            print(f"语音控制器初始化失败: {e}")

    async def start_recording(self, websocket: WebSocket) -> None:
        """开始录音"""
        if self.controller and not self.controller.is_recording:
            self.controller.start_record_thread()

    async def stop_recording(
        self, websocket: WebSocket, gesture_handler: GestureHandler
    ) -> None:
        """停止录音并处理结果"""
        if self.controller and self.controller.is_recording:
            self.controller.stop_record()

            # 获取识别结果并输入
            text = self.controller.transcribe_audio()
            if text:
                gesture_handler.keyboard.type(text)
                gesture_handler.keyboard.tap(Key.enter)


@router.websocket("/ws_lazyeat")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点处理函数"""
    global active_connection

    await websocket.accept()
    active_connection = websocket

    gesture_handler = GestureHandler()
    voice_handler = VoiceHandler()

    try:
        while True:
            data_str = await websocket.receive_text()
            await _handle_message(data_str, websocket, gesture_handler, voice_handler)
    except WebSocketDisconnect:
        active_connection = None
    except Exception as e:
        print(f"WebSocket处理错误: {e}")
        active_connection = None


async def _handle_message(
    data_str: str,
    websocket: WebSocket,
    gesture_handler: GestureHandler,
    voice_handler: VoiceHandler,
) -> None:
    """处理WebSocket消息"""
    try:
        message = WebSocketMessage(**json.loads(data_str))
        data = message.data

        # 处理鼠标操作
        if message.type == WebSocketMessageType.MOUSE_MOVE:
            gesture_handler.move_mouse(data["x"], data["y"])
        elif message.type == WebSocketMessageType.MOUSE_CLICK:
            gesture_handler.click_mouse()
        elif message.type == WebSocketMessageType.MOUSE_SCROLL_UP:
            gesture_handler.scroll_up()
        elif message.type == WebSocketMessageType.MOUSE_SCROLL_DOWN:
            gesture_handler.scroll_down()

        # 处理键盘操作
        elif message.type == WebSocketMessageType.SEND_KEYS:
            gesture_handler.send_keys(data["key_str"])

        # 处理语音操作
        elif message.type == WebSocketMessageType.VOICE_RECORD:
            await voice_handler.start_recording(websocket)
        elif message.type == WebSocketMessageType.VOICE_STOP:
            await voice_handler.stop_recording(websocket, gesture_handler)

    except json.JSONDecodeError:
        print("无效的JSON数据")
    except Exception as e:
        print(f"处理消息失败: {e}")
