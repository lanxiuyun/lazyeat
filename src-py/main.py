import os
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from router.ws import router as ws_router

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

# 添加 WebSocket 路由
app.include_router(ws_router)


@app.get("/")
def read_root():
    return "ready"


@app.get("/shutdown")
def shutdown():
    import signal
    import os
    os.kill(os.getpid(), signal.SIGINT)


if __name__ == '__main__':
    port = 62334

    print(f"Starting server at http://127.0.0.1:{port}/docs")
    uvicorn.run(app, host="127.0.0.1", port=port)
