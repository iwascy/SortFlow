# SortFlow UI Refactor Spec (Reference Style Alignment)

## 0. 文档目标

本规范用于把当前 `frontend/src` 的界面重构为你提供参考图的审美风格（浅色、柔和灰底、细边框、统一圆角、紫色主强调、轻量阴影、低噪声信息层级）。

本次只输出实施文档，不直接改代码。  
实现团队可按本规范逐步落地，确保视觉和交互一致。

---

## 1. 输入参考图的风格结论（必须统一）

### 1.1 总体风格
- 风格关键词：`Light Dashboard`、`Soft Neutral`、`Rounded Cards`、`Subtle Contrast`。
- 背景不是纯白：使用偏暖浅灰背景，降低刺眼感。
- 边框统一细线浅灰：几乎所有卡片/按钮/表头都有 1px 描边。
- 阴影轻，主要靠边框和层级分区，不靠强烈发光。
- 主强调色为紫色渐变，辅色为蓝、浅紫、黄、红（用于类型占比条）。

### 1.2 字体与文字观感
- 字重分层清晰：
  - 页面标题/卡片主标题：`600~700`
  - 正文/列表内容：`500`
  - 次级信息：`400~500` 且更浅色
- 字号体系偏大于当前项目：
  - 主标题 44~48px（`All files`）
  - 分区标题 24~28px（`Recently modified`）
  - 组件标题 18~22px（`Storage usage`、右侧分类名）
  - 正文 14~16px
  - 次级说明 12~14px

### 1.3 色调体系（目标）
- 页面底色：`#F3F4F6` 左右
- 卡片底色：`#FFFFFF`
- 主文本：`#2B2D3A`
- 次文本：`#6E7385`
- 边框：`#D9DCE4`
- 主按钮渐变：`#9A64FF -> #7A42F4`
- 紫色环图主色：`#7F4CF8`
- 文件类型条：
  - Documents（蓝）`#3F8CFF`
  - Image（紫）`#8A4DFF`
  - Video（浅紫）`#B08CFF`
  - Audio（黄）`#FFBF3A`
  - ZIP（红）`#FF5C45`

---

## 2. 当前实现与目标差异（按代码现状）

### 2.1 全局差异
- 当前全局是深色主题（`frontend/src/index.css`），目标是浅色主主题。
- 当前大量 `font-black`、超密大写 tracking，目标应改为自然产品化字重和常规字距。
- 当前有较强荧光/发光效果（`active-glow-*`），目标不需要强发光。
- 当前组件圆角偏大且不统一，目标是统一圆角体系（12/16/20/24）。

### 2.2 布局差异
- 当前为左导航 + 中区 + 右执行台，结构接近目标，但密度、间距、边框、字体均不一致。
- 参考图有“中区主列表 + 右侧信息栏”强分栏，且右栏固定宽度和卡片间距更规范。
- 参考图顶部工具栏更简洁：上传按钮、创建按钮、用户信息、通知。

### 2.3 组件差异
- 当前文件区是网格卡片为主，参考图核心是“表格列表 + 最近文件横向卡片 + 类型占比条”。
- 当前 Transaction Desk 的执行语义偏“归档执行控制台”，参考图偏“文件管理统计与分类概览”。
- 当前图标大多 Material Symbols 纯线性，参考图图标容器有统一边框小方块。

---

## 3. 重构范围定义（本次必须覆盖）

### 3.1 必改页面
- `Dashboard`（主页面，优先级 P0）
- `Layout`（全局导航/顶部栏，优先级 P0）
- `HistoryPage`（样式体系同步，优先级 P1）
- `ConfigurationPage`（样式体系同步，优先级 P1）

### 3.2 必改组件
- 全局 Token（颜色/字体/圆角/阴影/间距）
- Button / Input / Select / Card / Table / Badge / IconBox
- 文件类型占比条（新视觉）
- 存储环图卡片（新视觉）
- 右侧分类统计列表（新视觉）
- 最近文件横向卡片（新视觉）

### 3.3 非目标（先不做）
- 业务逻辑重写（执行接口、WebSocket 流程）不在本轮重点。
- 新增复杂业务能力（权限、分享、多人协作）不在本轮。

---

## 4. 设计令牌（Design Tokens）落地规范

> 所有页面与组件必须先完成 token 化，再进行局部重构，避免“局部好看但整体不统一”。

### 4.1 新增/替换全局 CSS 变量（建议维护在 `frontend/src/index.css`）
- `--sf-bg-page: #F3F4F6`
- `--sf-bg-surface: #FFFFFF`
- `--sf-bg-muted: #F7F8FA`
- `--sf-border: #D9DCE4`
- `--sf-text-primary: #2B2D3A`
- `--sf-text-secondary: #6E7385`
- `--sf-text-tertiary: #8B90A3`
- `--sf-accent-1: #9A64FF`
- `--sf-accent-2: #7A42F4`
- `--sf-accent-blue: #3F8CFF`
- `--sf-accent-purple: #8A4DFF`
- `--sf-accent-lavender: #B08CFF`
- `--sf-accent-yellow: #FFBF3A`
- `--sf-accent-red: #FF5C45`

### 4.2 字体与字号 Token
- 字体优先使用统一无衬线：`Inter, ui-sans-serif, system-ui`
- `--sf-fs-display: 48px`
- `--sf-fs-h1: 32px`
- `--sf-fs-h2: 26px`
- `--sf-fs-title: 20px`
- `--sf-fs-body: 16px`
- `--sf-fs-caption: 14px`
- `--sf-fs-meta: 12px`

### 4.3 圆角 Token
- `--sf-radius-sm: 10px`
- `--sf-radius-md: 14px`
- `--sf-radius-lg: 18px`
- `--sf-radius-xl: 24px`

### 4.4 阴影 Token
- `--sf-shadow-card: 0 2px 8px rgba(24, 39, 75, 0.06)`
- `--sf-shadow-hover: 0 6px 16px rgba(24, 39, 75, 0.10)`
- 禁用强荧光阴影（移除或停用 `active-glow-*`）

### 4.5 间距 Token（8pt 体系）
- `4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48`
- 卡片内边距默认 `24`
- 卡片间距默认 `16`
- 区块间距默认 `24~32`

---

## 5. 统一组件规范（逐项可实现）

## 5.1 Card 组件规范
- 背景 `--sf-bg-surface`
- 描边 `1px solid --sf-border`
- 圆角 `--sf-radius-lg`
- 阴影默认 `--sf-shadow-card`，hover 才增强到 `--sf-shadow-hover`
- 卡片标题：20px / 600
- 卡片副标题：14px / 500 / secondary

## 5.2 Button 组件规范
- Primary（紫色渐变）：
  - 背景 `linear-gradient(90deg, var(--sf-accent-1), var(--sf-accent-2))`
  - 文字白色，16px，600
  - 高度 56px（大按钮）/ 48px（常规）
  - 圆角 `14~16`
- Secondary（浅底边框）：
  - 背景白色，描边 `--sf-border`
  - 文本 `--sf-text-primary`
- Hover 只做轻微亮度变化，不做放大/发光

## 5.3 Input / Search 规范
- 高度 56px
- 背景 `#FFF`
- 描边 `--sf-border`
- 圆角 `14`
- placeholder 用 `--sf-text-tertiary`
- 聚焦边框：`#BBA4FF`（柔和紫）

## 5.4 Table 规范（核心）
- 表头背景 `--sf-bg-muted`
- 表头字号 16，字重 500，颜色 secondary
- 行高建议 72~80
- 行 hover：浅灰 `#F8F9FC`
- 主要列（文件名）文字 40 字符超长截断 + tooltip
- 行尾更多操作按钮使用三点 icon，图标颜色 secondary

## 5.5 IconBox 规范（右栏分类卡图标）
- 容器尺寸 `56 x 56`
- 背景白色，边框 `--sf-border`
- 圆角 `14`
- 图标尺寸 24，线宽统一

## 5.6 Legend & Color Chip 规范
- 文件类型 legend 使用 `16 x 16` 圆角方块
- 文本 40 字符截断
- 文案颜色 secondary，字号 14~16

---

## 6. Dashboard 页面重构细则（P0，最关键）

## 6.1 页面骨架（从上到下）
1. 顶部全局栏（搜索、通知、用户、上传、创建）
2. 页面标题区（`All files` + 副标题）
3. 最近文件横向卡片区（`Recently modified` + `View all`）
4. 主内容区：
   - 左：过滤工具 + 类型占比条 + 文件表格
   - 右：存储使用卡 + 文件类型统计卡 + 升级卡

## 6.2 顶部栏
- 左侧：搜索框（宽 520~620）
- 右侧：
  - 通知按钮（48x48）
  - 用户头像（40~44）
  - 用户名 + 下拉箭头
  - `Upload file` 主按钮
  - `Create` 次按钮
- 顶部栏高度 88~96，底部有 1px 分割线

## 6.3 页面标题区
- 标题：`All files`，44~48px，600
- 副标题：`All of your files are displayed here`，36 字符截断
- 与下一区块间距 32

## 6.4 最近文件卡片区（横向）
- 标题：`Recently modified`，26~28px
- 右侧操作：`View all ->`
- 卡片规格：
  - 高度 124~132
  - 左图标盒 + 中间文件名/元信息
  - 元信息格式：`8.4 MB • Image`
- 横向滚动，卡片间距 16

## 6.5 工具栏（Filter + List）
- 靠右对齐
- 两个按钮高度 56，圆角 14
- 图标 + 文本（16px）
- 支持 hover/active 状态

## 6.6 文件类型占比条
- 一条主横条，固定高度 72~78
- 段落顺序：Documents / Image / Video / Audio / ZIP / 空白
- 每段圆角与段间距一致（段间 8）
- 下方 legend 与颜色严格对应

## 6.7 文件列表表格（主区核心）
- 表头字段最少：`Name / Owner / File Size / Date modified / More`
- 表头容器圆角 12，背景 `--sf-bg-muted`
- 行内文本层级：
  - Name：primary 40 字符
  - Owner：secondary
  - Size：secondary
  - Date：secondary
- 行内操作（more）点击区域最少 36x36

## 6.8 右侧栏：Storage usage 卡
- 卡标题：`Storage usage`
- 中间为环形进度图：
  - 外环底色浅灰
  - 主进度紫色渐变
  - 中心显示 `104.6 GB / of 256 GB`
- 环图下方是文件类型统计列表

## 6.9 右侧栏：类型统计列表
- 每行结构：IconBox + 文本区
- 主文本：`Documents`
- 次文本：`42 Files | 112.8 MB`
- 行高 92~100，行间距 12

## 6.10 右侧栏：升级卡片
- 顶部轻插画区域（可先占位）
- 标题：`Get more space for your files`
- 副标题两行
- 底部全宽主按钮：`Upgrade to pro`

---

## 7. Layout（全局壳）改造细则（P0）

## 7.1 左主导航（参考图第三张）
- 宽度 280~320
- Logo 区高度约 112
- 菜单组标题 `Menu` 为次文本
- 菜单项高度 64 左右
- 激活项：浅底 + 细边框 + 轻阴影，不用高饱和底色
- 图标左对齐，文本 38 字符截断

## 7.2 主内容容器
- 顶部全局 header 固定
- 下方内容区滚动
- 页边距统一：左右 28~32，上下 24~28

## 7.3 当前 `Layout.tsx` 的明确改造点
- 去除深色背景类：`bg-background-dark` 一类
- 去除大量 `uppercase + tracking-widest + font-black`
- 把任务弹层样式也同步为浅色卡片风格
- 通知、任务按钮由“圆形纯图标”改“方圆角图标容器”

---

## 8. Configuration 页面样式同步规范（P1）

> 保持现有功能分组不变，只改审美层。

## 8.1 页面结构
- 顶部标题区：与 Dashboard 同风格（浅底、边框分割）
- 内容改为“分组卡片”结构：Display / Pattern Mixer Keywords / Video Covers / Source Watchers / Target Roots / Mixer Keywords / Presets

## 8.2 每个 Section 卡片规范
- 卡片标题 20px/600
- 说明文案 14px/secondary
- 表单控件高度统一 48 或 56
- 操作按钮位置统一（右上角或卡片底部）

## 8.3 列表项规范
- 每条 watcher/target/preset/keyword 用白底边框行
- 行内按钮改为次按钮风格（非红字裸按钮）
- 删除按钮使用 danger outline，避免视觉冲突

---

## 9. History 页面样式同步规范（P1）

## 9.1 页面结构
- 顶部标题区与 Dashboard 一致
- 历史列表改“卡片行”展示，不使用深色底
- 状态标签用 pill：`Completed / Failed / Running`

## 9.2 空态
- 中心图标 + 标题 + 说明
- 颜色为 secondary，不要强对比

---

## 10. 响应式规范（必须明确，避免实现歧义）

## 10.1 断点建议
- `>=1440`: 完整三栏（左导航 + 主区 + 右栏）
- `1200~1439`: 主区 + 右栏，左导航可收起图标态
- `768~1199`: 右栏下沉到主区底部，顶部工具栏压缩
- `<768`: 单列流式；最近文件横向滚动；表格可切卡片列表

## 10.2 小屏行为
- 搜索框缩短或折叠为图标点击展开
- 上传和创建按钮允许只显示图标 + tooltip
- 右栏统计卡改为可折叠 Accordion

---

## 11. 交互状态规范（容易遗漏，必须覆盖）

## 11.1 按钮状态
- `default / hover / active / disabled / loading`
- disabled 对比度下降但仍可识别文案

## 11.2 行与卡片状态
- 文件行：`default / hover / selected`
- 最近文件卡：`default / hover`
- 右栏分类行：`default / hover`

## 11.3 输入状态
- `default / focus / error / disabled`
- 错误提示文字 12~13px，颜色柔和红

## 11.4 异步态
- skeleton：最近文件卡、表格行、右栏统计
- empty：无文件、无最近项、无历史项
- error：网络失败重试按钮

---

## 12. 可访问性（A11y）要求

- 所有 icon-only 按钮必须有 `aria-label`
- 文本与背景对比度至少满足 WCAG AA
- 键盘可达：Tab 顺序合理，焦点可见
- 表格行操作按钮支持 Enter/Space 触发
- 下拉与弹层支持 ESC 关闭

---

## 13. 动效规范（轻量）

- 页面进入：`fade + translateY(8px)`，`180~220ms`
- 卡片 hover：阴影轻微提升，`120~160ms`
- 按钮点击：`95~98%` 轻压缩，`80ms`
- 禁止夸张弹跳和强霓虹光效

---

## 14. 代码落地映射（按文件）

## 14.1 P0 文件
- `frontend/src/index.css`
  - 新增浅色主题 token
  - 调整全局 body、滚动条、文字颜色
- `frontend/src/components/Layout.tsx`
  - 全局骨架、顶部栏、左导航视觉重做
- `frontend/src/features/dashboard/Dashboard.tsx`
  - 页面结构重排（标题/最近文件/主区）
- `frontend/src/features/file-explorer/FileGrid.tsx`
  - 从“卡片网格主视图”补齐“表格主视图”
- `frontend/src/features/file-explorer/FileCard.tsx`
  - 最近文件卡样式（而非深色大卡）
- `frontend/src/features/execution/TransactionDesk.tsx`
  - 右栏改为“存储统计 + 类型列表 + 升级卡”

## 14.2 P1 文件
- `frontend/src/features/config/ConfigurationPage.tsx`
- `frontend/src/features/history/HistoryPage.tsx`
- `frontend/src/components/Button.tsx`
- `frontend/src/components/Modal.tsx`

---

## 15. 分步实施计划（可直接分派）

## Step 0：冻结目标与视觉基线
- 输出：
  - 本文档评审通过
  - 最终色板/字号/圆角确认
- 验收：
  - 设计、前端、产品三方签字

## Step 1：全局 Token 与基础组件
- 改动：
  - `index.css` token
  - `Button`、`Input`、`Card` 基础样式
- 验收：
  - Dashboard 未改结构时也能看出统一浅色体系

## Step 2：Layout 壳层重构
- 改动：
  - 左导航、顶部栏、任务弹层
- 验收：
  - 三个 tab 页面在同一壳层下审美一致

## Step 3：Dashboard 上半区（标题+最近文件）
- 改动：
  - `All files` 标题区
  - `Recently modified` 横向卡片
- 验收：
  - 与参考图上半区布局比例一致

## Step 4：Dashboard 下半区左侧（工具栏+类型条+表格）
- 改动：
  - Filter/List 工具栏
  - 类型占比条 + legend
  - 表格主视图
- 验收：
  - 文字层级、间距、边框、行高符合规范

## Step 5：Dashboard 右侧栏
- 改动：
  - Storage usage 卡（含环图）
  - 分类统计列表
  - 升级卡 + CTA
- 验收：
  - 右栏与主区视觉风格无割裂

## Step 6：Configuration / History 样式同步
- 改动：
  - 两页替换为同样卡片体系与按钮体系
- 验收：
  - 任意 tab 切换无“像不同产品”的割裂感

## Step 7：响应式 + 状态覆盖
- 改动：
  - 4 个断点适配
  - loading/empty/error/disabled 全覆盖
- 验收：
  - 手机、平板、桌面截图对比通过

## Step 8：视觉 QA 与回归
- 改动：
  - 像素细调
  - 颜色和字号偏差修正
- 验收：
  - 完成检查清单（见第 16 节）

---

## 16. 最终验收清单（防遗漏）

## 16.1 视觉一致性
- 所有页面背景是否统一浅灰
- 所有卡片是否统一边框和圆角
- 所有标题/正文/次文案字号是否按 token
- 所有主按钮是否统一紫色渐变

## 16.2 结构一致性
- Dashboard 是否具备参考图同级信息结构
- 右栏三张卡是否完整
- 表格视图是否替代旧的“深色大网格主视图”

## 16.3 交互一致性
- hover/active/focus 是否统一
- 输入聚焦与错误样式是否统一
- 图标按钮是否统一尺寸与边框

## 16.4 适配一致性
- 1440、1280、1024、768、390 宽度截图检查
- 文案溢出、换行、截断策略检查

## 16.5 可用性与无障碍
- 键盘可操作
- aria-label 完整
- 对比度达标

---

## 17. 实施建议（团队协作）

- 先由 1 人完成 `Token + Layout + Dashboard`，其余人并行改 `Config/History`。
- 每一步都产出“前后对比截图”（同分辨率）以便快速验收。
- 在 PR 模板中强制附上第 16 节检查项勾选结果。

---

## 18. 备注

- 若后续你确认“参考图 1:1 还原优先于现有信息架构”，可追加一版 `IA 重排文档`，把当前业务面板字段做更强映射（例如将 Transaction Desk 的执行信息拆入右栏统计与底部执行条）。

