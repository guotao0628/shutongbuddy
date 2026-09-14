# 第 8 章 实例二：ShuTongBuddy Studio（Web 备考助手）

终章实例把前七章攒成一件完整作品：一个 Web 端的**大学生备考助手 ShuTongBuddy Studio**。前端跑在浏览器里，界面布局参考 Codex 风格；后端用 FastAPI 编排，智能体引擎就是 DeepSeek Harness——第 5 章写好的备考助手插件包在这里正式上岗。业务流程严格走六阶段：**知识点梳理 → 题库刷题 → AI 答疑 → 错题分析 → 复习计划 → 学习报告**，多模型分工与多智能体协同贯穿始终。

## 8.1 技术选型：为什么是 Web

| 决策 | 选择 | 理由 |
| --- | --- | --- |
| 界面 | Web（浏览器访问） | 跨平台免安装：大学生 Windows / Mac / 手机浏览器都能用，无需打包分发 |
| 前端 | 原生 HTML + JS（可升级 Vite + React） | 三栏 Codex 布局轻量可教，与后端 SSE 对接 |
| 后端 | FastAPI | Python 生态，异步长任务友好，用 SSE 推送阶段进度 |
| 智能体引擎 | DeepSeek Harness（Python SDK） | 不重造轮子：工具、会话日志、权限、子智能体、多模型路由全部现成 |
| 连接方式 | deepseek-harness-sdk pip 包 | 安装即带匹配的原生运行时与 dsh 命令，无需系统 Node.js |
| 备考能力 | 第 5 章插件包 | 题库、刷题、错题门禁，一次开发两端复用 |

一句话架构：**浏览器负责"人"的体验，FastAPI 负责编排，Harness 负责"智能体"的一切**。

## 8.2 总体架构

```text
┌──────────────────────────────────────────────────────┐
│ 浏览器（ShuTongBuddy Studio Web 界面）                 │
│  ├─ 左栏：备考阶段 / 会话列表                          │
│  ├─ 中栏：对话流 + 工具调用卡片 + 进度                 │
│  └─ 右栏：题库 / 错题本面板                           │
└───────────────┬──────────────────────────────────────┘
                │ HTTP + SSE（阶段事件推送）
┌───────────────▼──────────────────────────────────────┐
│ FastAPI 服务                                           │
│  └─ HarnessController（后台线程 worker）               │
│      └─ DeepSeekHarness（Python SDK，context manager） │
└───────────────┬──────────────────────────────────────┘
                │ JSON-RPC stdio
┌───────────────▼──────────────────────────────────────┐
│ dsh --profile sdk（独立进程，随 SDK 懒启动）            │
│  ├─ shu-tong-buddy 插件包（question_bank / practice /  │
│  │   mistake-gate）                                    │
│  └─ 模型路由：deepseek-v4-pro / flash / Kimi          │
└──────────────────────────────────────────────────────┘
```

进程模型要点：harness.run() 是阻塞调用，必须放进后台线程 worker，通过 SSE 把阶段进度与输出推回浏览器——前端界面永不冻结。

## 8.3 环境搭建与多模型配置

```bash
py -3.10 -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install deepseek-harness-sdk fastapi uvicorn
$env:DEEPSEEK_API_KEY = "sk-your-key-here"
```

安装备考助手插件（第 5.8 节），让它在 sdk Profile 里持久就位：

```text
$env:DSH_HOME = "C:\work\shutongbuddy-dsh-home"
dsh --profile sdk --dump-default-config | Out-Null
dsh plugin --profile sdk add file:C:/work/shu-tong-buddy
```

多模型配置：sdk Profile 与 Web 共用同一套 settings.yaml 体系——在 $DSH_HOME/settings.yaml 里按第 4 章的方法加入 moonshotai（Kimi）提供商，答疑阶段即可路由到 Kimi。DeepSeek 侧，deepseek-v4-pro 与 deepseek-v4-flash 开箱可用。【待核：sdk Profile 下多提供商的会话级指定方式，以你所用版本的 SDK 参考为准；备选方案是为 Kimi 单独起一个 dsh 实例，通过子智能体 ACP 委托，见 8.7 节。】

## 8.4 核心代码一：HarnessController

对 SDK 的封装——懒启动、阶段化执行、线程内复用：

```python
from pathlib import Path
from deepseek_harness import DeepSeekHarness

STAGE_MODEL = {
    "organize": ("deepseek-official", "deepseek-v4-pro"),    # 知识点梳理
    "drill":    ("deepseek-official", "deepseek-v4-flash"),  # 题库刷题
    "tutor":    ("deepseek-official", "deepseek-v4-pro"),    # AI 答疑
    "analyze":  ("deepseek-official", "deepseek-v4-pro"),    # 错题分析
    "plan":     ("deepseek-official", "deepseek-v4-flash"),  # 复习计划
    "report":   ("deepseek-official", "deepseek-v4-flash"),  # 学习报告
}

class HarnessController:
    """每个阶段使用独立的 DeepSeekHarness 实例（各自懒启动 dsh 进程），
    会话日志共享同一个 dsh_home，题库与错题本共享同一个 workspace。"""

    def __init__(self, workspace: str, dsh_home: str):
        self.workspace = str(Path(workspace).resolve())
        self.dsh_home = str(Path(dsh_home).resolve())

    def run_stage(self, stage: str, prompt: str, session_id: str) -> str:
        provider, model = STAGE_MODEL[stage]
        with DeepSeekHarness(
            provider=provider,
            model=model,
            max_tokens=49_152,
            cwd=self.workspace,
            dsh_home=self.dsh_home,
            profile="sdk",
        ) as harness:
            result = harness.run(prompt, session_id=session_id)
        return result.final_response
```

三个设计说明：

- session_id 策略：同一阶段内续用同一 id（多轮纠偏保留上下文），跨阶段换新 id（上下文隔离，靠工作区文件传递事实——正是第 5.7 节"状态共享走文件"的落地）；
- workspace 与 dsh_home 显式隔离：SDK 与示例都不会静默读取 ~/.dsh，多门课程的备考项目天然互不污染；
- 安全前提：sdk-minimal Profile 锚定 danger-full-access，生产用 sdk Profile 并配合权限策略，工作区务必指向可隔离的目录（3.7 节安全基线在此同样适用）。

## 8.5 核心代码二：备考多阶段流水线

编排层把业务流程写成一目了然的数据与函数：

```text
PIPELINE = [
    ("organize", "知识点梳理",  "通读 {course} 的教材与笔记，产出知识图谱 outline.json 与章节清单，写入工作区。"),
    ("drill",    "题库刷题",    "按 outline.json 的章节清单，逐章调用 practice 工具抽题组卷，判分结果写入 practice/。"),
    ("tutor",    "AI 答疑",     "逐题讲解错题本中的题目，举一反三给出同类题。"),
    ("analyze",  "错题分析",    "对照错题本归类错因、定位薄弱知识点，输出 analysis.md。"),
    ("plan",     "复习计划",    "调用 review 工具按遗忘曲线排程，生成每日复习任务。"),
    ("report",   "学习报告",    "汇总学习进度与错题统计，生成周报 report.md。"),
]

def run_pipeline(course: str, controller: HarnessController, on_stage):
    for stage, title, tmpl in PIPELINE:
        on_stage(stage, title, "running")                 # → SSE 事件
        prompt = tmpl.format(course=course)
        output = controller.run_stage(stage, prompt, session_id=f"{course}-{stage}")
        on_stage(stage, title, "done", output)            # → SSE 事件
```

刷题与答疑阶段的并发：错题之间无依赖时，可为每题起一个子智能体（第 6.5 节的 spawn-in-process 提供者），并发度受 API 配额约束；错题约束天然一致——所有子智能体读同一份 mistakes.json。判分落盘环节则有第 5.6 节的 stb-mistake-gate 门禁兜底：答错的题被自动归档进错题本，不依赖模型自觉。

## 8.6 核心代码三：Web 界面（Codex 布局）

后端用 FastAPI 起服务，后台线程跑流水线，SSE 把阶段事件推给前端：

```python
import asyncio, json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, HTMLResponse

app = FastAPI()
controller = HarnessController(workspace="C:/work/course-math", dsh_home="C:/work/shutongbuddy-dsh-home")

@app.post("/pipeline/start")
async def start_pipeline(course: str):
    async def event_stream():
        q = asyncio.Queue()
        def emit(stage, title, status, output=""):
            q.put_nowait(json.dumps({"stage": stage, "title": title,
                                     "status": status, "output": output}))
        # 后台线程跑流水线，事件经线程安全队列转 SSE
        import threading
        threading.Thread(
            target=run_pipeline, args=(course, controller, emit), daemon=True
        ).start()
        while True:
            yield f"data: {await q.get()}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@app.get("/")
async def index():
    return HTMLResponse(open("index.html", encoding="utf-8").read())
```

前端骨架——三栏 + 底部输入框，EventSource 订阅阶段事件：

```text
<!-- index.html -->
<div id="app">
  <aside id="stages"></aside>          <!-- 左栏：阶段/会话 -->
  <main id="chat"></main>              <!-- 中栏：对话流 + 工具卡片 -->
  <aside id="panel"></aside>           <!-- 右栏：题库/错题本 -->
</div>
<script>
const es = new EventSource('/pipeline/start?course=高数');
es.onmessage = (e) => {
  const ev = JSON.parse(e.data);
  const card = document.createElement('div');
  card.textContent = `[${ev.title}] ${ev.status} ${ev.output}`;
  document.getElementById('chat').appendChild(card);   // 渲染为卡片
  if (ev.status === 'done') refreshPanel();            // 重读 question-bank.json / mistakes.json 刷新右栏
};
</script>
```

与 Codex 布局的对应关系：左栏 ≈ 会话/任务列表；中栏对话流里每个阶段事件渲染成卡片（工具调用卡片显示 question_bank、practice、write 等调用摘要）≈ Codex 的消息流与工具卡；右栏 ≈ 工作区侧边栏，直接读写工作区的 question-bank.json 与 mistakes.json，实现人机共编同一题库——界面登记的题目，智能体下一轮刷题就用到。底部输入框 ≈ composer。这就是 Web 相对桌面的红利：同样的三栏布局，浏览器一行命令跑起来，任何设备都能开。

## 8.7 多模型与多智能体的落法

把第 4、6 章的机制落到这个平台上，收敛为三条可执行规则：

1. 阶段级模型分工：梳理/答疑/错题分析给 V4 Pro（错题分析开 max 挡位），刷题/复习/报告给 Flash，答疑切 Kimi——切换点都在 STAGE_MODEL 一张表里，改配置不改代码；
2. 题目级智能体分身：答疑阶段每道错题一个子智能体，会话隔离、文件共享，门禁兜底；
3. 跨实例委托：若 Kimi 路由在 sdk Profile 下不便指定，为 Kimi 单独起一个 dsh 实例，用 dsh-subagent-acp/dsh-sdk 把答疑阶段委托过去——主流程代码不变。

平台边界之外的功夫：备考助手的"平台感"恰恰来自这些 Harness 原生能力——会话日志让每门课程的备考全程可回放审计；`--dump-config` 让部署环境可检视；补丁层让不同学生可以拿到不同门禁严格度的定制版。

## 本章小结

- Web（Codex 布局）+ FastAPI + Harness Python SDK 构成"体验层 + 编排层 + 智能体层"的干净分层；
- DeepSeekHarness 按阶段实例化，session_id 控制上下文边界，工作区文件承担跨阶段事实；
- 六阶段流水线 = 一份数据表 + 一个循环；多模型分工 = 一张 STAGE_MODEL 表；
- 第 5 章插件包在此复用：题库、刷题、错题门禁全部在线。

**进阶：打包成桌面版**——若学生想要"双击即用"，用 Tauri 把这套 Web 前端包成桌面壳：Tauri 内置一个本地 WebView 指向本地 FastAPI 服务（启动时自动拉起 dsh 与后端），一套 Web 代码同时获得桌面形态。这是"Web 优先、桌面可打包"的完整闭环，核心代码零改动。

人机共编题库、全程可审计的会话日志，是这个备考助手区别于"脚本调用 API"的本质。
