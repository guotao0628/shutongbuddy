"""备考六阶段流水线：一份数据表 + 一个循环"""

PIPELINE = [
    ("organize", "知识点梳理", "通读 {course} 的教材与笔记，产出知识图谱 outline.json 与章节清单，写入工作区。"),
    ("drill",    "题库刷题",   "按 outline.json 的章节清单，逐章调用 practice 工具抽题组卷，判分结果写入 practice/。"),
    ("tutor",    "AI 答疑",    "逐题讲解错题本中的题目，举一反三给出同类题。"),
    ("analyze",  "错题分析",   "对照错题本归类错因、定位薄弱知识点，输出 analysis.md。"),
    ("plan",     "复习计划",   "调用 review 工具按遗忘曲线排程，生成每日复习任务。"),
    ("report",   "学习报告",   "汇总学习进度与错题统计，生成周报 report.md。"),
]


def run_pipeline(course: str, controller, on_stage) -> None:
    """按阶段顺序执行流水线，每个阶段通过 on_stage(stage, title, status, output) 上报进度。"""
    for stage, title, tmpl in PIPELINE:
        on_stage(stage, title, "running")
        prompt = tmpl.format(course=course)
        output = controller.run_stage(stage, prompt, session_id=f"{course}-{stage}")
        on_stage(stage, title, "done", output)
