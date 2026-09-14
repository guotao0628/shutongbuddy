# 插件代码（plugins/）

ShuTongBuddy 的配套插件，遵循 DeepSeek Harness "万物皆插件" 的架构（Cordis、Profile/Bundle/Patch、能力接缝、事件系统）。详见手册第 2、5 章。

## shu-tong-buddy/

备考助手核心插件包（手册第 5 章）：

| 模块 | 职责 | 类型 |
|------|------|------|
| `src/question-bank.ts` | 题库：登记 / 检索 / 列出 / 统计 | 工具插件 |
| `src/practice.ts` | 刷题：抽题组卷、返回题单 | 工具插件 |
| `src/mistake-gate.ts` | 错题门禁：判分落盘时自动归档错题 | 钩子插件 |
| `src/review.ts` | 复习计划：按遗忘曲线排程 | 工具插件 |
| `src/tutor.ts` | 答疑：读取错题供模型讲解 | 工具插件 |
| `src/state.ts` | 类型定义与 JSON 持久化 | 基础模块 |
| `src/index.ts` | 插件包汇总入口 | — |

状态文件（工作区内）：`question-bank.json`（题库）、`mistakes.json`（错题本）。
