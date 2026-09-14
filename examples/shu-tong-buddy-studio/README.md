# ShuTongBuddy Studio（示例）

第 8 章「实例二：ShuTongBuddy Studio」的完整可运行代码——一个 Web 备考助手。

## 架构

```
浏览器（static/index.html）
   │ HTTP + SSE
FastAPI（app.py）
   │ 后台线程
HarnessController（controller.py）
   │ JSON-RPC stdio
dsh --profile sdk（DeepSeek Harness 独立进程）
   └─ shu-tong-buddy 插件包（../plugins/shu-tong-buddy）
```

## 运行

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置 DeepSeek API Key
set DEEPSEEK_API_KEY=sk-your-key-here

# 3. 安装备考助手插件（第 5 章插件包），使 sdk Profile 就位
set DSH_HOME=C:\work\shutongbuddy-dsh-home
dsh --profile sdk --dump-default-config
dsh plugin --profile sdk add file:C:/work/shu-tong-buddy

# 4. 启动服务
python app.py

# 5. 浏览器访问 http://127.0.0.1:8000
```

> 修改 `app.py` 顶部的 `WORKSPACE` 与 `DSH_HOME` 为你的实际路径。

## 文件

- `controller.py` — HarnessController（阶段级模型分工 + SDK 封装）
- `pipeline.py` — 备考六阶段流水线（知识点梳理→刷题→答疑→错题分析→复习计划→报告）
- `app.py` — FastAPI 后端（SSE 推送阶段事件）
- `static/index.html` — 三栏 Codex 布局前端
