# Backend Code Review (2026-02-04)

## Scope
- `backend/cmd/server`
- `backend/internal/api`
- `backend/internal/service`
- `backend/internal/pkg`
- `backend/internal/config`
- `backend/internal/model`

## Summary
整体结构清晰，API/Service/Model 分层合理，主要功能覆盖了文件列表、缩略图、预览、执行整理、任务状态、系统配置与历史记录。当前实现存在几处会导致功能失败或数据不一致的逻辑问题，需要优先修复。

## Findings (按严重度排序)

### P1 - move 操作未创建目标目录，导致整理执行失败
- 位置：`backend/internal/service/execution_engine.go:160`
- 现象：`processFile` 中对 move 直接 `os.Rename`，当目标目录不存在时会失败。
- 影响：常见场景（移动到新目录）直接失败；与测试 `TestExecutionEngineProcessFile` 预期不一致。
- 建议：在 move 分支中先 `os.MkdirAll(filepath.Dir(dst), 0o755)`，再执行 rename。

### P1 - UndoHistory 对 copy 操作处理错误，可能覆盖原文件
- 位置：`backend/internal/service/history_service.go:135`
- 现象：Undo 总是 `os.Rename(new, original)`，若原始文件仍存在（copy 操作常见），会覆盖原文件或直接失败。
- 影响：copy 类型历史回滚不正确，存在数据损坏风险。
- 建议：在 history 中记录每个文件的操作类型，或使用 `history.Action` 判定；copy 的 undo 应删除 newPath（或仅在不存在原文件时才 rename）。

### P2 - Preview 可能产生重复目标名（批量冲突 + 磁盘冲突组合）
- 位置：`backend/internal/service/preview_engine.go:36`
- 现象：命名冲突处理只考虑批内重复，磁盘冲突的自动改名不会写回 `nameMap`；当两者叠加时可能产生相同 `NewName`。
- 影响：前端预览显示“可执行”，但实际执行时仍可能目标名冲突。
- 建议：维护一个“已分配名称集合”，磁盘冲突改名后也加入集合，并再次检测是否与批内结果冲突。

### P3 - CORS 允许凭证但 Origin 为通配符
- 位置：`backend/internal/api/middleware/cors.go:7`
- 现象：`Access-Control-Allow-Origin: *` 且 `Allow-Credentials: true`，浏览器会忽略凭证。
- 影响：若前端依赖 Cookie/认证头，会出现跨域认证失败。
- 建议：改为回显请求 Origin 或使用白名单；或禁用 `Allow-Credentials`。

## Test Gaps
- 缺少 handler 层的端到端/集成测试（文件列表、缩略图、执行整理、WebSocket 任务推送）。
- 缺少 preview “批量冲突 + 磁盘冲突”组合场景测试。
- 缺少 copy 操作的 UndoHistory 测试。

## Open Questions / Assumptions
- 预期的鉴权方式是什么？CORS 配置是否需要支持 Cookie/凭证？
- 任务执行是否允许取消或并发上限控制？当前实现不支持取消与速率限制。
