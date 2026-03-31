# Sprint 1 Implementation Guidance

This document is the implementation-level guidance for Sprint 1. It translates the Sprint 0 baseline into concrete module ownership, API contract rules, and review gates for FE and BE delivery.

## Current Review Snapshot

Approved from the current codebase:

- `auth` and `health` modules are wired correctly for the existing Sprint 0 slice.
- Global `ValidationPipe` is enabled with `whitelist`, `forbidNonWhitelisted`, and `transform`.
- Auth DTOs already establish the right boundary pattern: normalize input at the edge, then hand typed values to services.

Gaps that must be addressed before Sprint 1 can close:

- `tools`, `executions`, and `admin-tools` are still missing from `AppModule`.
- The documented error envelope is not normalized at runtime yet, so Nest default errors can drift from `docs/api-contracts.md`.
- FE auth types currently omit `refreshToken` and `refreshExpiresIn`, which already exist in the backend auth service contract.
- FE mock login accepts passwords with length `>= 4`, while backend DTOs require `>= 6` for login and `>= 8` for register.

## Approved Backend Ownership

Sprint 1 backend ownership is:

- `auth`
  - owns JWT issuance, refresh token lifecycle, guards, role checks, and `GET /auth/me`
- `tools`
  - owns public catalog reads, tool detail reads, and tool metadata mapping from persistence to API DTOs
- `executions`
  - owns `POST /tools/:toolSlug/execute`, request deduplication, tool-specific input validation, executor dispatch, and execution audit persistence
- `admin-tools`
  - owns admin-only CRUD and enabled/disabled state changes for tools
- `health`
  - stays isolated from domain logic

`users` is deferred as a standalone module for Sprint 1. There is not yet a second user-facing use case outside auth that justifies pulling user behavior out of `auth`.

## Module Structure Rules

Use vertical slices and keep transport DTOs with their owning module:

```text
src/
  auth/
  tools/
    dto/
    tools.controller.ts
    tools.service.ts
    tools.module.ts
  executions/
    dto/
    executors/
    executions.controller.ts
    executions.service.ts
    executions.module.ts
  admin-tools/
    dto/
    admin-tools.controller.ts
    admin-tools.service.ts
    admin-tools.module.ts
```

Rules:

- Controllers own HTTP concerns only.
- Services own orchestration and persistence coordination.
- Tool-specific execution code lives under `executions/executors`, not inside controllers.
- Do not add `common`, `helpers`, or `utils` folders for Sprint 1. Extract only after two concrete call sites.

## Tool Execution Contract

`POST /tools/:toolSlug/execute` is the only Sprint 1 execution entrypoint.

### Request

```json
{
  "input": {
    "payload": "{ \"hello\": \"world\" }"
  },
  "requestId": "uuid"
}
```

Rules:

- `requestId` is required and must be a UUID.
- `input` is required and must be an object.
- Route param remains the tool identifier. Do not duplicate `toolSlug` in the body.
- Transport validation happens in the DTO. Tool-shape validation happens inside `executions` after the tool definition is loaded.

### Success Response

For synchronous Sprint 1 execution, return a direct DTO body:

```json
{
  "executionId": "uuid",
  "toolSlug": "json-formatter",
  "status": "completed",
  "output": {
    "formatted": "{\n  \"hello\": \"world\"\n}"
  },
  "durationMs": 42,
  "executedAt": "2026-03-31T04:00:00.000Z"
}
```

Rules:

- Keep success responses as direct payloads. Do not introduce a `{ "data": ... }` envelope in Sprint 1.
- `status` should be `"completed"` on HTTP `200`.
- If execution fails after work started, persist a failed execution record and return a non-`200` error response instead of inventing partial-success payloads.

### Error Responses

All errors must use the documented envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": {}
  }
}
```

Required mappings:

- `401` for missing or invalid JWT
- `403` for role violations on admin endpoints
- `404` with `TOOL_NOT_FOUND` for unknown `toolSlug`
- `409` with `REQUEST_ID_CONFLICT` when a repeated `requestId` is reused with a different payload
- `422` with `VALIDATION_ERROR` when the request DTO or tool input is invalid
- `503` with `TOOL_DISABLED` when the tool is disabled or unavailable
- `500` with `EXECUTION_FAILED` for unexpected execution failures

Idempotency rule:

- Same authenticated user + same `toolSlug` + same `requestId` + same normalized input must return the original successful response.
- Same authenticated user + same `toolSlug` + same `requestId` + different input must return `409`.

## DTO And Validation Rules

- Every external payload must have an owning DTO class.
- Use `class-validator` and `class-transformer` at the controller boundary only.
- Keep DTOs transport-shaped. Do not leak TypeORM entities to the API layer.
- Normalize strings at the edge with `@Transform`, matching the auth DTO pattern already in the repo.
- Convert dynamic tool input into typed executor input inside `executions`, not in the controller.

## Error Handling Rules

- Add one global exception normalization layer so Nest validation and `HttpException` responses match `docs/api-contracts.md`.
- Services should throw typed Nest exceptions with stable `error.code` mappings.
- Do not throw raw `Error` from controllers.
- Persist execution audit rows for both success and failure paths when execution was attempted.

## FE And BE Alignment Rules

- FE must keep `apps/web/src/lib/api.ts` aligned with backend auth payloads before real API mode is enabled by default.
- FE should continue rendering forms from `inputSchema`; it must not hardcode tool-specific request shapes into route components.
- BE owns tool input validation, execution auditing, and idempotency behavior.
- Contract changes must update `docs/api-contracts.md` in the same change.

## Review Gate For Sprint 1 Close

Sprint 1 is not technically complete until all of the following are true:

- `tools`, `executions`, and `admin-tools` are registered in the API application
- runtime error responses match the documented error envelope
- `POST /tools/:toolSlug/execute` follows the request, status-code, and idempotency rules above
- FE auth types match backend auth responses
- execution writes are auditable in `execution_history`
