# 具身智能 RSI 研究架构

AI 组研究如何让智能体协作、复用经验，并独立检验技能与改进器的候选版本。kagent 负责 Agent 运行，AgenticMesh 管理证据、候选与版本。仿真环境和数字孪生并列位于环境工具层，通过统一 MCP 工具接口提供观测和反馈。首个 AFSIM 时钟样例已在本地验证，数字孪生接入为架构设计。

## 入口

- [分层架构总图](./index.html#architecture) · [AI 组任务](./index.html#engineering) · [方向规划图](./directions.html) · [环境工具层](./index.html#environment-tools) · [已测时钟工具](./index.html#tool-contract)
- [高速固定翼专题](./fixed-wing.html)
- [AI 组的 AFSIM 时钟样例](./fixed-wing.html#integration)，含[时钟输入](./afsim-clock-input.txt)及[两次运行记录](./afsim-clock-check.json)。本地时钟复现实验使用 AFSIM 2.9.0，后续可见性实验的前置条件见方向规划图。
- [专题学生研究点与开题卡](./topics.html)
- [任务描述规范](./task-profile.schema.json) 与 [两份配置](./task-profiles.json)
- [共享成果索引](./research-assets.json)

## 运行 MCP 时钟工具

将 [clock_mcp.py](./clock_mcp.py)、[afsim-clock-input.txt](./afsim-clock-input.txt) 与 [afsim-clock-check.json](./afsim-clock-check.json) 放在同一目录。在 Python 3.12 虚拟环境中运行以下命令。

```sh
python -m pip install "mcp==1.30.0"
python clock_mcp.py
```

默认传输为 stdio。使用宿主或 MCP 客户端启动上述 Python 进程，再执行 `tools/list`。调用 `read_clock_reference` 时传入 `{"run_id":"repeat-01"}` 或 `{"run_id":"repeat-02"}`，可直接读取已发表的实测基线。调用 `measure_clock_markers` 时传入 `{}`。新测量需要在工具服务进程环境中将 `AFSIM_MISSION` 设为本机获准使用的 mission 可执行文件的绝对路径，每次调用使用独立的临时目录。

本机 HTTP 验证可用 `python clock_mcp.py --transport streamable-http`，端点为 `http://127.0.0.1:8000/mcp`。在 kagent 中规划绑定这两个工具时，使用 Agent 的 `mcpServer.toolNames` 指定名称，并引用已注册的工具服务。集群需单独提供可达的服务地址。本项目已用官方客户端验证两种传输、实际测量及错误处理，集群和 AgenticMesh 端到端集成待验收。[协议实测结果](./mcp-clock-test.json)

## 换一个任务

在 task-profiles.json 的 profiles 数组中登记唯一任务编号与版本，填写环境、具身体、时间语义、可见观测、可用能力、反馈、独立参考、评价口径和首项交付。实例需满足 task-profile.schema.json。网页通过同一个展示组件读取任务配置，新增任务无需修改三面的定义。环境连接和物理能力的实际实现由各任务适配器承担。

## 交接研究成果

将研究文件和版本化依赖登记在 research-assets.json，首页据此展示下载入口。核心成果可标注 audience 为 core。使用 rsi-experiment.txt 区分任务能力和改进器两类实验。共享样本和历史复算记录可通过既有编号查找。

网站提供架构设计、可下载契约、设计实例及合成统计样例。尚无在线具身运行器或自动自改进实验结果。GitHub Pages 从 main 分支根目录发布。学生分工按岗位展示。
