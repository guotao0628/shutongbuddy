"""FastAPI 服务：后台线程跑流水线，SSE 推送阶段事件给前端"""
import asyncio
import json
import threading

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse

from controller import HarnessController
from pipeline import run_pipeline

# 工作区与 dsh 主目录（按需修改）
WORKSPACE = "C:/work/course-math"
DSH_HOME = "C:/work/shutongbuddy-dsh-home"

app = FastAPI(title="ShuTongBuddy Studio")
controller = HarnessController(workspace=WORKSPACE, dsh_home=DSH_HOME)


@app.post("/pipeline/start")
async def start_pipeline(course: str):
    async def event_stream():
        q: asyncio.Queue = asyncio.Queue()

        def emit(stage: str, title: str, status: str, output: str = "") -> None:
            q.put_nowait(json.dumps(
                {"stage": stage, "title": title, "status": status, "output": output},
                ensure_ascii=False,
            ))

        # 后台线程跑流水线，事件经线程安全队列转 SSE
        threading.Thread(
            target=run_pipeline, args=(course, controller, emit), daemon=True
        ).start()

        while True:
            yield f"data: {await q.get()}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/")
async def index():
    return HTMLResponse(open("static/index.html", encoding="utf-8").read())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
