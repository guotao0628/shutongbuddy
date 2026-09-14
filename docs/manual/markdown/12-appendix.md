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


**初稿说明**：本册基于 DeepSeek Harness 开发者预览版（0.1.5-rc.2）官方文档撰写，项目迭代迅速，若行为与描述不符，以仓库文档为准；文中【待核】处请在出版前对照最新文档确认。

