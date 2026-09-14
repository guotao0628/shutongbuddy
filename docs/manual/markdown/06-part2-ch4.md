# 第 4 章 多模型 API 接入：DeepSeek V4 Pro/Flash、Kimi 与任意兼容端点

Harness 的模型接入层是"万物皆插件"最好的广告牌：添加一个模型提供商，只是注册一个适配器；切换一个模型，不需要重启服务。本章把 DeepSeek V4 Pro/Flash、Kimi（Moonshot AI）以及任意 OpenAI 兼容网关的接入方法讲透，并给出一份故障排查速查表。

## 4.1 模型接入层全景

模型接入由 `llm/llm` 包承担，它定义了**消息与流的统一词汇表**和适配器接缝，`ctx.llm` 是它的服务键。官方自带两个参考实现：

| 适配器 | 风格 | 服务的路由 |
| --- | --- | --- |
| dsh-llm-deepseek | 直连 HTTP，SSE 流式解析 | DeepSeek 官方 API |
| dsh-llm-pi-ai | 包装通用 LLM 库 | 内置目录里的其他厂商 + 全部自定义端点 |


你在 Settings → Models 里做的一切配置，最终都落在 `$DSH_HOME/settings.yaml` 里；界面只暴露"让一条路由存在"所需的最小字段，其余进阶字段（推理挡位、图像输入、请求兼容开关、超时重试……）都在这个 YAML 文件里编辑，**保存后下一次请求即生效**。

## 4.2 接入 DeepSeek V4 Pro / Flash

DeepSeek 是 Harness 的一等公民路由，接入只需一步：打开 **Settings → Models**，在 DeepSeek 卡片填入 API Key 并保存。模型选择器随即列出官方目录中的模型，其中两个是本册的主力：

- deepseek-v4-pro：深度推理主力，适合规划、复杂分析、代码架构类任务；
- deepseek-flash：快速响应与多模态入口，适合摘要、改写、检索后处理，且默认带图像输入能力。

DeepSeek 路由的一个特色是**推理挡位（Reasoning Effort）**：其模型原生提供 `off`、`low`、`high`、`max` 四挡，模型选择器中的 **Effort** 菜单直接可选；路由级默认挡位在 `settings.yaml` 里设置：

- 

```yaml
llm-deepseek:
  reasoningEffort: max
```
经验法则：让 Flash 保持默认挡位跑流量，把 high/max 留给 Pro 处理硬任务。第 8 章的实例会把这条法则用成一套多模型分工策略。

## 4.3 接入 Kimi（Moonshot AI）

Kimi 走"内置提供商目录"通道，无需手写任何端点信息：

1. 打开 Settings → Models → Add provider；
2. 在列表中选择 moonshotai（即 Kimi；同目录里还有 anthropic、openai、zai（GLM）等）；
3. 填入 Kimi 开放平台的 API Key，保存。

安装目录内置了该厂商的端点、协议与模型清单，保存即可用。至此，模型选择器里同时存在 DeepSeek 与 Kimi 两个路由——**选中某个模型即把它设为后续新会话的默认模型**；已经发过请求的会话，则忠实保留自己日志里记录的模型，不会跟着默认模型跑。

**注意**：以 OAuth 登录的厂商（如 Codex）暂不支持在此页面接入。

## 4.4 接入任意 OpenAI 兼容端点

公司网关、自建服务、目录外的厂商，走 **Add a custom provider**。表单要求五项：

- Provider ID：小写标识，保存后不可更改——因为请求、已存会话、模型默认值与凭据引用都使用它。想改名，只能新建后删除旧的；
- Base URL：端点地址；
- API protocol：三选一——openai-completions（OpenAI Chat Completions）、openai-responses（OpenAI Responses API）、anthropic-messages（Anthropic Messages API）。一个提供商只说一种协议；一个网关若同时提供两种协议，就建两个提供商；
- 凭据：API Key；
- 至少一个模型。

模型清单可以手写，也可以点 **Fetch available models** 让 Harness 询问端点（对 OpenAI 兼容端点即调用 `GET /models`），在可搜索的清单里勾选添加。发现失败或返回为空时，**手写模型 id 一样能用**——发现只是便利，不是前提。

一个典型用法：把 DeepSeek V4 挂到公司统一网关后面，作为自定义提供商管理。

## 4.5 settings.yaml 进阶：三类高频定制

界面表单是刻意做小的。真正让多模型接入"好用"的，是 `settings.yaml` 里的三类进阶字段。

## （1）图像输入：input 与 defaultInput

手工录入的模型默认被视为纯文本——因为没有途径询问端点支持哪些模态。给自定义端点上的视觉模型开图像输入，只需一行：

```yaml
llm-pi-ai:
  providers:
    my-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example/v1
      models:
        - id: legacy-chat
        - id: vision-preview
          input: [text, image]
```
若该路由下所有手工模型都支持图像，在路由上设一次兜底即可：defaultInput: [text, image]（默认值是 [text]，它是兜底而非覆盖，不会摘掉目录模型已有的图像能力）。内置提供商的模型要用 modelOverrides 按模型 id 收窄。

## （2）推理挡位：reasoningEfforts

手工录入的模型默认不声明推理挡位（Effort 菜单不出现，端点自行决定是否思考）。用 `reasoningEfforts` 声明，键是菜单里显示的挡位，值是发送到线上的 `reasoning_effort` 拼写：

```yaml
models:
  - id: my-reasoner
    reasoningEfforts:
      off:
      high: high
      max: max
```
只有 off 允许留空——对多数端点，"不思考"就是参数缺省。但有一类模型默认思考、需要显式关闭，OpenAI 兼容网关后的 DeepSeek V4 就是典型。这时需要给模型加一个兼容开关 compat.thinkingFormat: deepseek：off 会发送 thinking: {type: disabled}，其余挡位发送 thinking: {type: enabled} 并附带挡位值：

## （3）请求兼容：compat

```yaml
models:
  - id: deepseek-v4-pro
    compat:
      thinkingFormat: deepseek
    reasoningEfforts:
      off:
      high: high
      max: max
```

网关的地址可达、密钥正确，仍可能拒绝每一个请求——因为它接受的请求形状与 OpenAI 本尊不同。最高发的两处：**推理模型的系统提示词**以 `role: "developer"` 发送（许多网关直接拒绝），以及**输出上限**以 `max_completion_tokens` 发送（只认 `max_tokens` 的服务会拒绝）。在路由上纠正：

```yaml
llm-pi-ai:
  providers:
    my-gateway:
      apiKeyEnv: GATEWAY_API_KEY
      api: openai-completions
      baseURL: https://gateway.example/v1
      compat:
        supportsDeveloperRole: false
        maxTokensField: max_tokens
      models:
        - id: my-model
```
路由的 compat 是其模型的默认值，模型自己的 compat 逐字段胜出。两条纪律：写了名字的开关必须给值（空值会被拒绝而非忽略）；开关按协议生效，张冠李戴会报错并列出该协议支持的开关。全部开关见配置目录中 PiAiCompatProfile 一节——它由源码生成，永远不会落后于适配器实际接受的范围。

## 4.6 模型切换的正确姿势

Harness 里"切模型"有三个层次，按场景选用：

| 层次 | 做法 | 适用 |
| --- | --- | --- |
| 会话级 | 模型选择器直接换；新会话跟随新默认 | 日常手动切换 |
| 路由级 | 同一 Provider ID 下并列多个模型，按需选 | 一key多模型（V4 Pro/Flash 同路由） |
| 编排级 | 不同子智能体/任务绑定不同模型 | 多模型分工协作（第 8 章） |


配合会话日志的"模型可见即落账"不变量，每个会话用过哪个模型全程可审计——多模型实验的结果对比因此非常干净。

## 4.7 故障排查速查表

| 症状 | 原因与处置 |
| --- | --- |
| MISSING_CREDENTIAL | 通过 Models 页存 Key，或补上被引用的环境变量 |
| UNKNOWN_MODEL | 选择已配置的模型，或在自定义提供商下补上该模型 |
| 发现模型返回 401 | 检查 Key；不支持 GET /models 的端点请手写模型 |
| 网关拒绝一切请求但 Key/URL 无误 | 请求形状差异：先试路由级 compat.supportsDeveloperRole: false 与 compat.maxTokensField: max_tokens |
| 只有推理模型失败 | 网关拒绝 developer 角色：设 compat.supportsDeveloperRole: false |
| 手工模型没有 Effort 菜单 | 未声明挡位：在 settings.yaml 为该模型加 reasoningEfforts |
| off 挡不住 DeepSeek 模型思考 | 端点默认思考：给模型或路由设 compat.thinkingFormat: deepseek |
| 兼容开关报"没有值" | 冒号后留空了：要么给值，要么删掉该键 |
| 图片发送前被拒 | 模型未声明图像模态：加 input: [text, image]；DeepSeek 路由请选用支持图像的目录条目（默认 deepseek-flash） |
| 提供商拒绝了带图请求 | 声明的模态超出端点实际能力：收窄 input/defaultInput 后开新会话（旧会话日志里仍带着图） |


## 本章小结

- DeepSeek 是一等路由：一个 Key 接入，deepseek-v4-pro/deepseek-flash 即刻可用，推理挡位原生支持；
- Kimi 走内置目录（moonshotai），一键添加；GLM（zai）、OpenAI、Anthropic 同理；
- 任意兼容端点走自定义提供商，三协议选一，Provider ID 一经保存不可改；
- 进阶三件事都在 settings.yaml：input 管图像、reasoningEfforts 管挡位、compat 管请求形状；

切换模型有三个层次，会话历史里的模型使用全程可审计。



