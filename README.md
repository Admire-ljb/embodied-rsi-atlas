# 具身智能 RSI 研究架构

本站为面向不同具身体、环境和任务的递归自我改进研究架构。首页介绍控制面、执行面、进化面，及支持跨版本比较的独立评价。高速固定翼是一个专题实例，另有室内移动巡检的任务适配设计。

## 入口

- [通用架构](./index.html)
- [高速固定翼专题](./fixed-wing.html)
- [AFSIM 与三课题联调](./fixed-wing.html#integration)，含[时钟输入](./afsim-clock-input.txt)及[两次运行记录](./afsim-clock-check.json)。本地时钟复现实验使用 AFSIM 2.9.0，运行中适配及半实物校核待联调。
- [专题学生研究点与开题卡](./topics.html)
- [任务描述规范](./task-profile.schema.json) 与 [两份配置](./task-profiles.json)
- [共享成果索引](./research-assets.json)

## 换一个任务

在 task-profiles.json 的 profiles 数组中登记唯一任务编号与版本，填写环境、具身体、时间语义、可见观测、可用能力、反馈、独立参考、评价口径和首项交付。实例需满足 task-profile.schema.json。网页通过同一个展示组件读取任务配置，新增任务无需修改三面的定义。环境连接和物理能力的实际实现由各任务适配器承担。

## 交接研究成果

将研究文件和版本化依赖登记在 research-assets.json，首页据此展示下载入口。核心成果可标注 audience 为 core。使用 rsi-experiment.txt 区分任务能力和改进器两类实验。共享样本和历史复算记录可通过既有编号查找。

网站提供架构设计、可下载契约、设计实例及合成统计样例。尚无在线具身运行器或自动自改进实验结果。GitHub Pages 从 main 分支根目录发布。学生分工按岗位展示。
