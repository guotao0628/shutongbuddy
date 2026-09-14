# 多智能体代码（agents/）

ShuTongBuddy 的多智能体协同代码，对应手册第 6 章（Turn/Step、提示词装配、上下文工程、子智能体委托）与第 8 章（备考多阶段流水线）。

## orchestrator/

编排智能体：负责拆解备考任务、按阶段调度子智能体（手册第 5.7、8.5 节）。

备考子智能体分工：

| 子智能体 | 职责 | 建议模型 |
|----------|------|----------|
| librarian（知识点梳理） | 读教材笔记，产出知识图谱 | DeepSeek V4 Pro |
| drill（题库刷题） | 抽题、判分 | DeepSeek Flash |
| tutor（AI 答疑） | 讲解错题、举一反三 | DeepSeek V4 Pro |
| analyst（错题分析） | 归类错因、定位薄弱点 | DeepSeek V4 Pro |
| planner（复习计划） | 按遗忘曲线排程 | Flash |
| reporter（学习报告） | 汇总进度、导出报告 | Flash |
