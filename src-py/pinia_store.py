
from GestureSender import GestureSender

class PiniaStore:
    def __init__(self):
        self.gesture_sender = GestureSender()


PINIA_STORE = PiniaStore()
