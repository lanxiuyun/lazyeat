from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any
import json

router = APIRouter()

# 存储活跃的WebSocket连接
active_connection: WebSocket | None = None


@router.websocket("/ws_lazyeat")
async def websocket_endpoint(websocket: WebSocket):
    global active_connection
    await websocket.accept()

    # 存储当前连接
    active_connection = websocket

    try:
        while True:
            # 接收客户端消息
            data = await websocket.receive_text()
            # 发送响应回客户端
            response = {
                "type": WsDataType.SUCCESS,
                "msg": "success",
                "data": data
            }
            await websocket.send_text(json.dumps(response))

    except WebSocketDisconnect:
        # 连接断开时，清除连接
        active_connection = None


class WsDataType:
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


async def send_message(ws_data_type: WsDataType, msg: str = None, **data):
    """
    发送消息给客户端
    Args:
        ws_data_type: 消息类型
        msg: 消息内容
        data: 附加数据
    """
    if active_connection:
        response = {
            "type": ws_data_type,
            "msg": msg,
            **data
        }
        await active_connection.send_text(json.dumps(response))
