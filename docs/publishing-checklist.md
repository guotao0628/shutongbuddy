# 出版前核对清单

## 一、待核对的技术细节（书中【待核】标记，共 2 处）

### 1. `output.schema` 的 `additionalProperties` 写法
- **位置**：第 7 章 7.6 节（`src/content/docs/part4/ch7.md`）
- **内容**：`material_stats` 工具的 `output.schema` 用了 `additionalProperties`，需对照所用 DeepSeek Harness 版本的 `ValueSchemaSpec` 确认是否接受；若不被接受，改为返回数组 `[{ type, files, bytes }]`。

### 2. sdk Profile 下多提供商的会话级指定方式
- **位置**：第 8 章 8.3 节（`src/content/docs/part4/ch8.md`）
- **内容**：sdk Profile 下多提供商（如 Kimi）的会话级模型指定方式，需对照所用 SDK 版本参考；备选方案是为 Kimi 单独起一个 dsh 实例，通过子智能体 ACP 委托（见 8.7 节）。

## 二、需作者确认的出版信息

| 事项 | 现状 | 需确认 |
|------|------|--------|
| 作者简介书目 | ✅ 已更新（《大模型设计模式》《Agentic AI 智能体应用开发（第 2 版）》《大模型前沿与实践》） | 已完成 |
| 封面 | 脚本生成的简化封面（书名 + 郭涛、李勇永 著 + 配套读物声明） | 本手册是《大模型Agent应用开发》辅助读物，不单独申请 ISBN/CIP；如需独立正式封面再另议 |
| 版权页 | 简化版（版权所有 + 书名 + 作者 + 配套读物声明） | 补版次、印次；不涉及书号与 CIP |

## 三、建议出版前完成的校对

- [ ] 全稿错别字与标点（尤其引号、破折号、中英文混排空格）
- [ ] 术语统一复核（ShuTongBuddy / dsh / DeepSeek Harness / deepseek-v4-pro / flash）
- [ ] 代码示例与 `plugins/`、`examples/` 目录的一致性
- [ ] 所有外部链接（GitHub 仓库、官方文档站）有效性
- [ ] 图表编号：全书表格/插图统一"表 X-Y""图 X-Y"编号（由出版社排版时统一处理）
- [ ] 第 8 章 ASCII 架构图转为正式插图（由美编绘制）

## 四、已完成的完善项（记录）

- [x] 补齐 review 复习计划工具 + explain_mistake 答疑工具（第 5 章 5.7/5.8）
- [x] 补齐 question-bank.json / mistakes.json / outline.json 结构示例（第 5 章 5.3）
- [x] 第 8 章补完整代码指引（指向 examples/shu-tong-buddy-studio/）
- [x] 口径统一：五个插件支撑四件套功能、答疑归属说明
- [x] 每章学习目标 + 练习题（8 章）
- [x] 术语表 Glossary（附录 F）
- [x] 代码块语言标注（bash/typescript/python/yaml/text）
