# scratch-plugin（第 7 章示例）

第 7 章「实例一：备考资料库体检智能体」的自定义工具插件。

- `src/material-stats.ts` — 统计备考资料库各类型文件数量与大小的工具；
- `cordis.yml` — Patch 覆盖层（把插件挂进官方插件树）。

## 使用

```bash
# 在 DeepSeek Harness 源码检出下，携带补丁启动
pnpm dsh web --patch ./examples/scratch-plugin/cordis.yml
```

> `cordis.yml` 里的路径改为你的实际绝对路径。
