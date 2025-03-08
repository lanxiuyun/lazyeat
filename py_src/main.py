import threading

import cv2
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from MyDetector import MyDetector

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
# https://blog.csdn.net/NoamaNelson/article/details/103135056
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))  # 优化帧率

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
    global cap
    CONFIG.show_detect_window = data.get("show_window", False)

    camera_index = int(data.get("camera_index", 0))
    if camera_index != CONFIG.camera_index:
        cap.release()
        cap = cv2.VideoCapture(camera_index)
        cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc('M', 'J', 'P', 'G'))  # 优化帧率
        CONFIG.camera_index = camera_index
    return "updated"


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
