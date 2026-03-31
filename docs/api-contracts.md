# API Contracts Draft

Base path: `/api/v1`

All responses use JSON. Errors follow:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

Success shape conventions:

- Single-resource and mutation endpoints return the DTO body directly.
- Collection endpoints return `{ "items": [...], "meta": { ... } }`.
- Sprint 1 does not add a global `{ "data": ... }` success envelope.

## Shared Types

### ToolSummary

```json
{
  "id": "uuid",
  "slug": "string",
  "name": "string",
  "description": "string",
  "category": "string",
  "isEnabled": true
}
```

### ToolField

```json
{
  "key": "string",
  "label": "string",
  "type": "text | textarea | number | select | boolean",
  "required": true,
  "placeholder": "string",
  "options": [
    {
      "label": "string",
      "value": "string"
    }
  ]
}
```

## Auth

### POST `/auth/register`

Request:

```json
{
  "email": "user@company.com",
  "password": "string"
}
```

Response `201`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshExpiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin | user"
  }
}
```

Response `409` when email already exists.

### POST `/auth/login`

Request:

```json
{
  "email": "user@company.com",
  "password": "string"
}
```

Response `200`:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "refreshExpiresIn": 604800,
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin | user"
  }
}
```

Response `401` for invalid credentials.

### POST `/auth/refresh`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response `200`:

```json
{
  "accessToken": "jwt",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Response `401` for invalid/expired refresh token.

### POST `/auth/logout`

Request:

```json
{
  "refreshToken": "jwt"
}
```

Response `200`:

```json
{
  "success": true
}
```

Response `401` for invalid refresh token.

### GET `/auth/me`

Requires `Authorization: Bearer <token>`.

Response `200`:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@company.com",
    "role": "admin | user"
  }
}
```

## Catalog

### GET `/tools`

Query params:

- `search`
- `category`
- `enabled`

Response `200`:

```json
{
  "items": [
    {
      "id": "uuid",
      "slug": "json-formatter",
      "name": "JSON Formatter",
      "description": "Format and validate JSON payloads",
      "category": "formatting",
      "isEnabled": true
    }
  ],
  "meta": {
    "total": 1
  }
}
```

### GET `/tools/:toolSlug`

Response `200`:

```json
{
  "id": "uuid",
  "slug": "json-formatter",
  "name": "JSON Formatter",
  "description": "Format and validate JSON payloads",
  "category": "formatting",
  "instructions": "string",
  "inputSchema": [
    {
      "key": "payload",
      "label": "Payload",
      "type": "textarea",
      "required": true,
      "placeholder": "{ \"hello\": \"world\" }"
    }
  ],
  "outputSchema": {
    "type": "json",
    "sample": {
      "formatted": "{\n  \"hello\": \"world\"\n}"
    }
  },
  "isEnabled": true
}
```

## Execute

### POST `/tools/:toolSlug/execute`

Requires `Authorization: Bearer <token>`.

Request:

```json
{
  "input": {
    "payload": "{ \"hello\": \"world\" }"
  },
  "requestId": "uuid"
}
```

`requestId` is required for tracing and idempotency.

Response `200`:

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

If the same authenticated user repeats the same `requestId` for the same tool with the same normalized input, the API should return the original successful response.

Response `404` with `TOOL_NOT_FOUND` when the tool slug does not exist.

Response `409` with `REQUEST_ID_CONFLICT` when the same `requestId` is reused with different input.

Response `422` when input validation fails.

Response `503` when the tool is disabled or temporarily unavailable.

Response `500` with `EXECUTION_FAILED` when the tool executor fails unexpectedly after request acceptance.

## Admin CRUD

Admin endpoints require `role=admin`.

### POST `/admin/tools`

Request:

```json
{
  "slug": "json-formatter",
  "name": "JSON Formatter",
  "description": "Format and validate JSON payloads",
  "category": "formatting",
  "instructions": "string",
  "inputSchema": [],
  "outputSchema": {},
  "isEnabled": true
}
```

Response `201` returns the created tool object.

### PATCH `/admin/tools/:toolId`

Request: partial of create payload.

Response `200` returns the updated tool object.

### DELETE `/admin/tools/:toolId`

Response `204` with empty body.

## Notes For FE And BE

- FE should treat `inputSchema` as renderable metadata, not as executable logic.
- BE owns schema validation and execution audit records.
- `requestId` is required for idempotency and tracing even before queue-based execution exists.
- Success payloads stay direct; error payloads must be normalized into the shared `error` envelope.
