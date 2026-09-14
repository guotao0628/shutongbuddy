"""HarnessController：对 DeepSeek Harness Python SDK 的封装（懒启动、阶段化执行）"""
from pathlib import Path
from deepseek_harness import DeepSeekHarness

# 阶段级模型分工：梳理/答疑/错题分析给 Pro，刷题/复习/报告给 Flash
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
