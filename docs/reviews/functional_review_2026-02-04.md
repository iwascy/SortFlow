# SortFlow 功能评审报告

> **日期**: 2026-02-04  
> **版本**: v2.0  
> **测试环境**: macOS, 后端 Go (:8000), 前端 Vite (localhost:5173)

## 测试概述

本次评审对 SortFlow 前后端服务进行了功能验证，主要目标是检查产品设计文档中描述的核心功能是否正常运行。

---

## 问题汇总

| 优先级 | 问题                                           | 所在模块         | 状态   |
| ------ | ---------------------------------------------- | ---------------- | ------ |
| **P0** | 前端使用 Mock 数据，未连接真实后端             | 前端 API 层      | 待修复 |
| **P0** | 文件选择无法加入队列 (Items Queued 始终为 0)   | Transaction Desk | 待修复 |
| **P0** | COMMIT TO ARCHIVE 按钮无响应                   | Transaction Desk | 待修复 |
| **P1** | Configuration 页面未实现（显示 "Coming soon"） | Configuration    | 待开发 |
| **P1** | History Log 页面为空，且未调用 /history API    | History          | 待修复 |
| **P2** | 文件缩略图未显示（仅显示占位图标）             | Source Watchers  | 待验证 |

---

## 详细问题描述

### 1. 前端 Mock 数据问题（P0 - 阻塞性）

**现象**: 前端控制台显示 `[Mock API] GET /files/list` 和 `Mocks initialized`。

**影响**: 前端当前完全使用内置的 Mock Service Worker，未与真实后端 API 通信。这导致：
- 所有文件数据来自静态模拟数据
- 任何操作（包括 COMMIT）都不会真正执行
- 后端 API 完全未被调用

**建议**: 
1. 检查前端环境变量配置，确保 `VITE_API_URL` 指向 `http://localhost:8000`
2. 在 `src/mocks/` 目录下检查 MSW 配置，添加开发模式开关
3. 确保 `vite.config.ts` 配置了正确的 API 代理规则

---

### 2. 文件队列功能断链（P0 - 阻塞性）

**现象**: 
- 选择文件后，Pattern Mixer 正确显示文件元数据
- 选择 Destination Root 和 Organizational Class 后，路径预览正确更新
- **但 "Items Queued" 计数始终为 0，"Estimated Load" 始终为 0 MB**

**影响**: 用户无法将文件加入执行队列，核心工作流完全阻塞。

**根因推测**: 
- 文件选择状态与队列状态之间的数据绑定缺失
- 可能需要额外的"加入队列"操作按钮（当前 UI 未明确提供）

**建议**: 
1. 检查 `useSelectionStore` 与 `useQueueStore` 之间的状态同步逻辑
2. 明确 UI 交互设计：单选/多选文件后如何加入待执行队列
3. 参考产品设计文档中的 "COMMIT TO ARCHIVE" 流程

---

### 3. COMMIT TO ARCHIVE 按钮无响应（P0 - 阻塞性）

**现象**: 点击 "COMMIT TO ARCHIVE" 按钮后无任何反馈——无确认弹窗、无进度显示、无错误提示。控制台也无 API 调用记录。

**影响**: 核心执行功能完全不可用。

**根因推测**: 
- 按钮可能依赖 "Items Queued > 0" 条件来启用
- 由于问题 #2，队列始终为空，按钮逻辑被短路

**建议**: 
1. 为按钮添加 disabled 状态的视觉反馈（如灰色、不可点击）
2. 添加 Toast 提示："请先选择文件加入队列"
3. 确保按钮有完整的 onClick 事件绑定

---

### 4. Configuration 页面未实现（P1 - 功能缺失）

**现象**: 页面显示 "Configuration Panel - Coming soon." 占位符。

**影响**: 用户无法管理源目录、目标根目录和分类预设。

**现状**: 后端 API 已实现相关接口：
- `GET /system/config`
- `POST /system/watchers`, `POST /system/presets`, `POST /system/targets`

**建议**: 按 `frontend_plan.md` 完成 Configuration 页面开发。

---

### 5. History Log 页面空白（P1 - 功能缺失）

**现象**: 
- 页面显示空状态提示："History Log is empty. Operations you perform will appear here."
- 控制台**未观察到**对 `/history` API 的调用

**影响**: 历史记录功能不可用，无法撤销操作。

**根因推测**: 
- 前端 History 组件可能未挂载 API 请求逻辑
- 或由于 Mock 模式，未模拟 /history 接口

**建议**: 
1. 在 History 组件的 `useEffect` 中添加对 `GET /history` 的请求
2. 确保 Mock 数据中包含示例历史记录

---

### 6. 文件缩略图缺失（P2 - 体验问题）

**现象**: 文件列表中所有文件显示相同的默认图标，未显示实际的图片/视频缩略图。

**影响**: 用户难以通过视觉快速识别文件内容。

**建议**: 
1. 确认 `GET /files/thumbnail?path=xxx` 接口是否正常工作
2. 检查前端是否正确构建缩略图请求 URL
3. 验证后端 webp 缩略图生成逻辑

---

## 正常功能

以下功能经验证**工作正常**：

- ✅ 后端服务启动，所有 API 路由注册成功
- ✅ 前端 Vite 开发服务器正常运行
- ✅ Dashboard 三栏布局正确渲染
- ✅ 左侧导航切换（Dashboard/Configuration/History）
- ✅ 文件列表展示（使用 Mock 数据）
- ✅ 文件选择高亮和元数据展示
- ✅ Pattern Mixer 复选框交互
- ✅ Destination Root 和 Organizational Class 选择
- ✅ 任务状态列表弹出框（顶部图标）

---

## 测试录屏

| 测试项              | 录屏文件                                                         |
| ------------------- | ---------------------------------------------------------------- |
| 主页加载测试        | [homepage_load_test.webp](homepage_load_test_1770177437182.webp) |
| 执行流程测试        | [execute_flow_test.webp](execute_flow_test_1770177515459.webp)   |
| History 和 API 测试 | [history_api_test.webp](history_api_test_1770177639830.webp)     |

---

## 后续建议

1. **优先修复 Mock 数据问题**：添加环境变量开关，在开发模式下可选连接真实后端
2. **完善文件队列逻辑**：明确"选择文件"与"加入队列"的交互设计
3. **补齐未实现页面**：Configuration 和 History 的完整功能
4. **增加端到端测试**：确保前后端集成正常工作
