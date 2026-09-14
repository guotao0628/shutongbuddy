# 逐章技术验证清单

> 用途：交稿前在真实 DeepSeek Harness（0.1.5-rc.2）环境逐条验证书稿命令与代码，确保读者照书可跑通。
> 用法：每验证一条，在 `[ ]` 内打 `x`；发现不符就在"备注"记录差异，回改书稿。

## 第 1 章 快速上手

- [ ] `npx @deepseek-ai/dsh web` 能启动 Web UI（默认 http://127.0.0.1:3080）
- [ ] Settings → Models 配置 DeepSeek API Key 后模型路由立即生效（无需重启）
- [ ] Choose workspace 后能下达第一个任务（如"总结仓库结构"）
- [ ] 界面出现规划、工具调用、审批、产出四类卡片
- 备注：

## 第 2 章 架构解析（概念核对）

- [ ] 八个核心概念（Plugin/ctx/Session/Turn/Step/Tool/Profile/Seam）与官方文档表述一致
- [ ] "模型可见即落账"（Model-visible means logged）的机制表述无误
- [ ] Profile/Bundle/Patch 层序与 `--dump-config` 输出一致
- 备注：

## 第 3 章 安装部署与 Web UI

- [ ] `npx @deepseek-ai/dsh web` 与源码构建两种方式均可运行
- [ ] 五种 Profile（web/headless/sdk/sdk-minimal/acp）各自能启动
- [ ] `dsh --profile web --dump-config` 能输出实际插件树
- [ ] `$DSH_HOME` 下的四个关键位置（settings.yaml/.credentials.yaml/cordis.patch.yml/profiles/）确实存在
- [ ] 六条安全基线可落地
- 备注：

## 第 4 章 多模型 API 接入

- [ ] DeepSeek V4 Pro / Flash 开箱可用
- [ ] Kimi（Moonshot）接入成功
- [ ] settings.yaml 的 `input`/`reasoningEfforts`/`compat` 三类配置生效
- [ ] 故障排查表（401/UNKNOWN_MODEL/图片被拒）与实际行为一致
- 备注：

## 第 5 章 插件开发实战（重点）

- [ ] `plugins/shu-tong-buddy/` 在装了 `@deepseek-ai/*` 依赖后 `tsc` 编译通过
- [ ] question_bank 工具（add/search/list/stats）运行正确
- [ ] practice 工具按条件抽题正确
- [ ] mistake_gate 门禁：判分落盘时错题自动归档到 mistakes.json
- [ ] review_plan 工具按遗忘曲线排程正确
- [ ] explain_mistake 工具读取错题正确
- [ ] `pnpm dsh web --patch ./shu-tong-buddy/cordis.yml` 挂载成功、实时重载生效
- [ ] `dsh plugin --profile sdk add ...` 持久安装成功
- 备注：

## 第 6 章 智能体构建原理（概念核对）

- [ ] PTC 模式、投影/注入/压缩、六种子智能体提供者的机制表述与官方文档一致
- [ ] 【待核】`output.schema` 的 `additionalProperties` 写法是否被 ValueSchemaSpec 接受（见第 7 章）
- 备注：

## 第 7 章 实例一

- [ ] `dsh --profile headless "..."` 能一次性生成 STUDY_REPORT.md
- [ ] material_stats 工具统计正确
- [ ] 【待核】`output.schema` 的 `additionalProperties` 写法：若不被接受，改为返回数组 `[{ type, files, bytes }]` 并回改书稿
- 备注：

## 第 8 章 实例二

- [ ] `examples/shu-tong-buddy-studio/` 依赖安装成功（deepseek-harness-sdk/fastapi/uvicorn）
- [ ] `python app.py` 启动后浏览器访问 http://127.0.0.1:8000 正常
- [ ] 六阶段流水线（梳理→刷题→答疑→错题分析→复习→报告）能端到端跑通
- [ ] 【待核】sdk Profile 下多提供商（Kimi）的会话级指定方式：确认或改用 ACP 委托方案，回改书稿
- 备注：

---

## 验证结论

- [ ] 全部通过，书稿可交稿
- [ ] 有 N 处不符（见各章备注），需回改后重新验证
