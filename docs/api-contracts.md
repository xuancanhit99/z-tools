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
  "tokenType": "Bearer",
  "expiresIn": 3600,
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

Request:

```json
{
  "input": {
    "payload": "{ \"hello\": \"world\" }"
  },
  "requestId": "uuid"
}
```

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

Response `422` when input validation fails.

Response `503` when the tool is disabled or temporarily unavailable.

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
- `requestId` is reserved for idempotency and tracing even before queue-based execution exists.
