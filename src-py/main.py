import threading
from typing import TYPE_CHECKING

import cv2
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

if TYPE_CHECKING:
    from MyDetector import MyDetector

import sys
import os
if hasattr(sys, 'frozen'):
    # pyinstaller打包成exe时，sys.argv[0]的值是exe的路径
    # os.path.dirname(sys.argv[0])可以获取exe的所在目录
    # os.chdir()可以将工作目录更改为exe的所在目录
    os.chdir(os.path.dirname(sys.argv[0]))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# config
class Config:
    show_detect_window: bool = False  # 显示检测窗口
    camera_index: int = 1  # 当前摄像头索引


CONFIG = Config()

cap = cv2.VideoCapture(CONFIG.camera_index)
# 2025年3月26日，待测试 https://blog.csdn.net/laizi_laizi/article/details/130230282 稳定取图速度
fourcc = cv2.VideoWriter_fourcc('M', 'J', 'P', 'G')
cap.set(cv2.CAP_PROP_FOURCC, fourcc)  # 优化帧率

work_thread_lock = threading.Lock()
work_thread: threading.Thread = None
flag_work = False

my_detector: 'MyDetector' = None


def thread_init():
    from MyDetector import MyDetector

    global my_detector
    my_detector = MyDetector(maxHands=2)


@app.get("/")
def read_root():
    return "ready"


def thread_detect():
    while True:
        success, img = cap.read()

        if my_detector is None:
            from MyDetector import show_toast
            show_toast(
                title='初始化中',
                msg='初始化中',
                duration=1
            )
            continue

        if not flag_work:
            try:
                cv2.destroyAllWindows()
            except:
                pass
            break

        if not success:
            continue

        if CONFIG.show_detect_window:
            all_hands, img = my_detector.findHands(img, draw=True)
        else:
            all_hands = my_detector.findHands(img, draw=False)

        if all_hands:
            state = my_detector.process(all_hands)

        if CONFIG.show_detect_window:
            img = my_detector.draw_mouse_move_box(img)
            cv2.imshow("Lazyeat Detect Window", img)
            cv2.waitKey(1)
        else:
            # CONFIG.show_detect_window 改变需要关闭窗口
            try:
                cv2.destroyAllWindows()
            except:
                pass


@app.get("/toggle_work")
def toggle_work():
    global flag_work, work_thread
    with work_thread_lock:
        if work_thread is None or not work_thread.is_alive():
            flag_work = True

            work_thread = threading.Thread(target=thread_detect)
            work_thread.daemon = True
            work_thread.start()
            return "started"
        else:
            flag_work = False
            return "stopped"


@app.post("/update_config")
def update_config(data: dict):
    from pinia_store import PINIA_STORE

    global cap
    CONFIG.show_detect_window = data.get("show_window", False)

    camera_index = int(data.get("camera_index", 0))
    if camera_index != CONFIG.camera_index:
        cap.release()
        cap = cv2.VideoCapture(camera_index)
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))  # 优化帧率
        CONFIG.camera_index = camera_index

    # 更新四个手指同时竖起发送的按键
    new_key = data.get("four_fingers_up_send")
    if new_key:
        gesture_sender = PINIA_STORE.gesture_sender
        gesture_sender.set_gesture_send(gesture_sender.four_fingers_up, new_key)


@app.get("/shutdown")
def shutdown():
    try:
        cap.release()
        cv2.destroyAllWindows()
    except:
        pass

    import signal
    import os
    os.kill(os.getpid(), signal.SIGINT)


if __name__ == '__main__':
    print("Initializing...")
    t_init = threading.Thread(target=thread_init, daemon=True)
    t_init.start()

    port = 62334

    print(f"Starting server at http://localhost:{port}/docs")
    uvicorn.run(app, host="127.0.0.1", port=port)
