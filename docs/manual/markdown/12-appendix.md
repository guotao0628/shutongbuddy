# 附录

## 附录 A 命令速查

| 命令 | 作用 |
| --- | --- |
| npx @deepseek-ai/dsh web | 启动 Web UI（默认 http://127.0.0.1:3080） |
| npx @deepseek-ai/dsh web --no-open | 启动但不自动打开浏览器 |
| dsh --profile <name> | 以指定 Profile 启动 |
| dsh --profile headless "任务" | 一次性运行：新会话、打印答案、退出 |
| dsh --profile <name> --from-default-profile web | 从官方模板创建自定义 Profile |
| dsh --profile <name> --dump-config | 输出实际组合的插件树（不启动） |
| dsh --profile <name> --dump-default-config | 输出默认组合的插件树 |
| dsh plugin --profile <name> add <pkg> | 为 Profile 安装外部插件（转发 pnpm） |
| pnpm dsh web --patch ./x/cordis.yml | 源码方式携带补丁覆盖层启动 |
| pnpm install && pnpm run build | 源码检出后的安装与构建 |


## 附录 B 关键文件位置（$DSH_HOME）

| 路径 | 内容 |
| --- | --- |
| settings.yaml | 全部设置（模型路由进阶字段在此编辑，热生效） |
| .credentials.yaml | API 密钥本体（只写存储） |
| cordis.patch.yml | 主目录级补丁层 |
| profiles/<name>/ | Profile 目录（package.json + cordis.patch.yml） |


## 附录 C settings.yaml 高频字段速查

| 字段 | 作用 |
| --- | --- |
| llm-deepseek.reasoningEffort | DeepSeek 路由默认推理挡位（off/low/high/max） |
| llm-pi-ai.providers.<id>.api | 协议：openai-completions / openai-responses / anthropic-messages |
| ...models[].input | 模型模态，如 [text, image] |
| ...providers.<id>.defaultInput | 路由级模态兜底（默认 [text]） |
| ...models[].reasoningEfforts | 手工模型的推理挡位声明 |
| ...compat.supportsDeveloperRole | 网关兼容：拒绝 developer 角色时设 false |
| ...compat.maxTokensField | 网关兼容：改为 max_tokens |
| ...compat.thinkingFormat: deepseek | 默认思考型 DeepSeek 模型的开关格式 |


## 附录 D 故障排查一行表

`MISSING_CREDENTIAL` → 存 Key 或补环境变量；`UNKNOWN_MODEL` → 选已配置模型或补录；发现模型 401 → 查 Key 或手写模型；网关全拒 → `compat.supportsDeveloperRole: false` + `maxTokensField: max_tokens`；`off` 挡不住思考 → `compat.thinkingFormat: deepseek`；图片被拒 → 声明 `input: [text, image]` 并开新会话。

## 附录 E 资源链接

| 资源 | 地址 |
| --- | --- |
| 项目仓库 | https://github.com/deepseek-ai/deepseek-harness |
| 官方文档站 | https://deepseek-harness.github.io/deepseek-harness/ |
| 问题反馈（Discussions） | https://github.com/deepseek-ai/deepseek-harness/discussions |
| 插件发现标签 | GitHub Topic：dsh-plugin |
| Cordis 框架 | https://github.com/cordiverse/cordis |
| Cordis 设计论文 | https://arxiv.org/abs/2608.25512 |
| DeepSeek 开放平台 | https://platform.deepseek.com/ |

## 附录 F 术语表（Glossary）

| 术语 | 英文 | 含义 |
| --- | --- | --- |
| 插件 | Plugin | 导出 `apply` 函数的模块，向共享上下文注册能力 |
| 上下文 | Context（`ctx`） | Cordis 的共享上下文，插件通过它注册服务、监听事件、声明效果 |
| 会话 | Session | 一次持续的人机协作；底层是一份只追加的事件日志 |
| 轮次 | Turn | 从零到多个 Step 构成；在"不再欠任何工作"时关闭 |
| 步骤 | Step | 一次模型请求加上它所触发的工具调用 |
| 工具 | Tool | 面向模型的能力单元，注册到 `ctx.tools` |
| 运行配置 | Profile | 一组命名好的插件树组合：web、headless、sdk、sdk-minimal、acp |
| 能力接缝 | Seam | 一个可替换能力的三角色契约：接口定义、提供者、消费者 |
| 微内核 | Microkernel | 没有特权核心的架构，一切皆插件 |
| 补丁 | Patch | 覆盖层，按层序替换插件树中的配置 |
| 可逆效果 | Reversible Effects | 注册即效果，卸载即回退 |
| 程序化工具调用 | PTC（Programmatic Tool Calls） | 工具成为可编程 API，返回规范 JSON 而非渲染文本 |
| 投影 | Projection | 从会话日志派生模型上下文 |
| 注入 | Injection | `agent.inject()` 追加持久上下文，进入下一个模型请求 |
| 压缩 | Compaction | 上下文压缩，一个可替换的能力接缝 |
| 子智能体 | Subagent | 通过 `ctx.subagents` 委托的智能体分身 |

**初稿说明**：本册基于 DeepSeek Harness 开发者预览版（0.1.5-rc.2）官方文档撰写，项目迭代迅速，若行为与描述不符，以仓库文档为准；文中【待核】处请在出版前对照最新文档确认。

