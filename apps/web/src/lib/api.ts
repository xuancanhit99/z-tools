export type UserRole = "admin" | "user";

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type AuthSessionResponse = {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
  refreshExpiresIn?: number;
  user: AuthUser;
};

export type RefreshResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type LogoutResponse = {
  success: true;
};

export type ProfileResponse = {
  user: AuthUser;
};

export type ToolSummary = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
};

export type ToolField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "boolean";
  required: boolean;
  placeholder?: string;
  options?: Array<{
    label: string;
    value: string;
  }>;
};

export type ToolDetail = ToolSummary & {
  instructions: string;
  inputSchema: ToolField[];
  outputSchema: {
    type: string;
    sample: Record<string, unknown>;
  };
};

export type ToolListResponse = {
  items: ToolSummary[];
  meta: {
    total: number;
  };
};

export type AdminUserListItem = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminUsersPageResponse = {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
};

type AdminUsersPageApiResponse = {
  data: Array<Omit<AdminUserListItem, "isActive"> & { isActive?: boolean }>;
  total: number;
  page: number;
  limit: number;
};

export type UpdateAdminUserRequest = {
  role?: UserRole;
  isActive?: boolean;
};

export type AdminUserMutationResponse = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
};

export type AdminStatsResponse = {
  totalUsers: number;
  totalExecutions: number;
  toolUsage: Array<{
    slug: string;
    count: number;
  }>;
};

export type ExecuteToolRequest = {
  input: Record<string, string | number | boolean>;
  requestId: string;
};

export type ExecuteToolResponse = {
  executionId: string;
  toolSlug: string;
  status: "completed";
  output: Record<string, unknown>;
  durationMs: number;
  executedAt: string;
};

export class ApiError extends Error {
  readonly status: number | null;
  readonly fieldErrors: Record<string, string>;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    options: {
      status?: number | null;
      fieldErrors?: Record<string, string>;
      isNetworkError?: boolean;
    } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.status = options.status ?? null;
    this.fieldErrors = options.fieldErrors ?? {};
    this.isNetworkError = options.isNetworkError ?? false;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1").replace(/\/$/, "");
const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API !== "false";

const mockToolDetails: ToolDetail[] = [
  {
    id: "tool-1",
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Format and validate JSON payloads",
    category: "formatting",
    isEnabled: true,
    instructions: "Paste raw JSON and receive a formatted and validated output.",
    inputSchema: [
      {
        key: "payload",
        label: "Payload",
        type: "textarea",
        required: true,
        placeholder: '{ "hello": "world" }'
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        formatted: '{\n  "hello": "world"\n}'
      }
    }
  },
  {
    id: "tool-2",
    slug: "uuid-generator",
    name: "UUID Generator",
    description: "Generate one or many UUID values",
    category: "utility",
    isEnabled: true,
    instructions: "Choose amount and UUID version.",
    inputSchema: [
      {
        key: "count",
        label: "Count",
        type: "number",
        required: true,
        placeholder: "5"
      },
      {
        key: "version",
        label: "Version",
        type: "select",
        required: true,
        options: [
          { label: "v4", value: "v4" },
          { label: "v7", value: "v7" }
        ]
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        uuids: ["3f53e0d1-20f5-4330-b968-4d5ea8f40f6d"]
      }
    }
  },
  {
    id: "tool-3",
    slug: "base64-encoder",
    name: "Base64 Encoder",
    description: "Encode/decode text to Base64",
    category: "encoding",
    isEnabled: false,
    instructions: "Input plain text, choose encode/decode mode.",
    inputSchema: [
      {
        key: "mode",
        label: "Mode",
        type: "select",
        required: true,
        options: [
          { label: "Encode", value: "encode" },
          { label: "Decode", value: "decode" }
        ]
      },
      {
        key: "text",
        label: "Text",
        type: "textarea",
        required: true,
        placeholder: "Hello HyperZ"
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        output: "SGVsbG8gSHlwZXJa"
      }
    }
  },
  {
    id: "tool-4",
    slug: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode JWT header and payload for debugging",
    category: "security",
    isEnabled: true,
    instructions: "Paste a JWT to decode header, payload, and timing claims.",
    inputSchema: [
      {
        key: "token",
        label: "JWT token",
        type: "textarea",
        required: true,
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        header: {
          alg: "HS256"
        },
        payload: {
          sub: "user-1"
        }
      }
    }
  },
  {
    id: "tool-5",
    slug: "regex-tester",
    name: "Regex Tester",
    description: "Run regex matches with selectable flags",
    category: "developer",
    isEnabled: true,
    instructions: "Provide pattern, flags, and input text to inspect matches.",
    inputSchema: [
      {
        key: "pattern",
        label: "Pattern",
        type: "text",
        required: true,
        placeholder: "\\\\w+"
      },
      {
        key: "flags",
        label: "Flags",
        type: "text",
        required: false,
        placeholder: "gi"
      },
      {
        key: "input",
        label: "Input text",
        type: "textarea",
        required: true,
        placeholder: "sample text"
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        count: 2,
        matches: ["sample", "text"]
      }
    }
  }
];

type MockUserRecord = AuthUser & {
  password: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  deletedAt: string | null;
};

const mockToolMap = new Map(mockToolDetails.map((tool) => [tool.slug, tool]));
const mockUsersByEmail = new Map<string, MockUserRecord>();
const mockAccessTokens = new Map<string, string>();
const mockRefreshTokens = new Map<string, string>();
const mockToolUsageCounts = new Map<string, number>([
  ["json-formatter", 128],
  ["uuid-generator", 96],
  ["jwt-decoder", 61],
  ["regex-tester", 34],
  ["base64-encoder", 22]
]);
let mockAuthSeeded = false;
let currentAccessToken: string | null = null;

type RequestOptions = RequestInit & {
  accessToken?: string;
};

type ExtractedApiError = {
  message: string;
  fieldErrors: Record<string, string>;
};

function sleep(ms = 300) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function randomId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function encodeBase64(value: string) {
  return globalThis.btoa(value);
}

function decodeBase64(value: string) {
  return globalThis.atob(value);
}

function shouldUseMockApi() {
  return useMockApi;
}

function normalizeRole(email: string): UserRole {
  const normalized = email.toLowerCase();
  return normalized.startsWith("admin") ? "admin" : "user";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isLikelyEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function maybeParseFieldFromMessage(message: string): string | null {
  const lowered = message.toLowerCase();

  if (lowered.includes("full name") || lowered.includes("name")) {
    return "fullName";
  }

  if (lowered.includes("email")) {
    return "email";
  }

  if (lowered.includes("password")) {
    return "password";
  }

  return null;
}

function normalizeFieldErrors(raw: unknown): Record<string, string> {
  if (!isObjectLike(raw)) {
    return {};
  }

  const entries = Object.entries(raw).flatMap(([field, value]) => {
    if (typeof value === "string" && value.trim()) {
      return [[field, value.trim()] as const];
    }

    if (Array.isArray(value)) {
      const first = value.find((item) => typeof item === "string" && item.trim().length > 0);
      if (typeof first === "string") {
        return [[field, first] as const];
      }
    }

    return [];
  });

  return Object.fromEntries(entries);
}

function extractApiError(payload: unknown, fallbackMessage: string): ExtractedApiError {
  let message = fallbackMessage;
  const fieldErrors: Record<string, string> = {};

  if (!isObjectLike(payload)) {
    return { message, fieldErrors };
  }

  const explicitMessage = payload.message;
  if (typeof explicitMessage === "string" && explicitMessage.trim()) {
    message = explicitMessage.trim();
  }

  if (Array.isArray(explicitMessage)) {
    const messages = explicitMessage.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    if (messages.length > 0) {
      message = messages[0];
      messages.forEach((item) => {
        const field = maybeParseFieldFromMessage(item);
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = item;
        }
      });
    }
  }

  const nestedError = payload.error;
  if (isObjectLike(nestedError)) {
    if (typeof nestedError.message === "string" && nestedError.message.trim()) {
      message = nestedError.message.trim();
    }

    const detailsFieldErrors = normalizeFieldErrors(nestedError.details);
    Object.assign(fieldErrors, detailsFieldErrors);
  }

  const topLevelFieldErrors = normalizeFieldErrors(payload.fieldErrors);
  Object.assign(fieldErrors, topLevelFieldErrors);

  return { message, fieldErrors };
}

function requireField(value: string, field: string, message: string): string {
  if (!value.trim()) {
    throw new ApiError(message, {
      status: 422,
      fieldErrors: {
        [field]: message
      }
    });
  }

  return value.trim();
}

function ensureMockSeeded() {
  if (mockAuthSeeded) {
    return;
  }

  const adminEmail = "admin@hyperz.local";
  mockUsersByEmail.set(adminEmail, {
    id: "user-admin-local",
    email: adminEmail,
    role: "admin",
    name: "Local Admin",
    password: "admin123",
    isActive: true,
    createdAt: "2026-03-01T09:10:00.000Z",
    lastLoginAt: "2026-03-31T15:45:00.000Z",
    deletedAt: null
  });

  mockUsersByEmail.set("ops@hyperz.local", {
    id: "user-ops-local",
    email: "ops@hyperz.local",
    role: "admin",
    name: "Ops Admin",
    password: "opsadmin123",
    isActive: true,
    createdAt: "2026-03-10T11:30:00.000Z",
    lastLoginAt: "2026-03-30T21:03:00.000Z",
    deletedAt: null
  });

  mockUsersByEmail.set("alex@hyperz.local", {
    id: "user-alex-local",
    email: "alex@hyperz.local",
    role: "user",
    name: "Alex Park",
    password: "alexpass123",
    isActive: true,
    createdAt: "2026-03-12T08:25:00.000Z",
    lastLoginAt: "2026-03-31T13:10:00.000Z",
    deletedAt: null
  });

  mockUsersByEmail.set("mia@hyperz.local", {
    id: "user-mia-local",
    email: "mia@hyperz.local",
    role: "user",
    name: "Mia Chen",
    password: "miapass123",
    isActive: false,
    createdAt: "2026-03-13T12:05:00.000Z",
    lastLoginAt: "2026-03-27T16:30:00.000Z",
    deletedAt: null
  });

  mockUsersByEmail.set("sam@hyperz.local", {
    id: "user-sam-local",
    email: "sam@hyperz.local",
    role: "user",
    name: "Sam Rivera",
    password: "sampass123",
    isActive: true,
    createdAt: "2026-03-18T07:50:00.000Z",
    lastLoginAt: null,
    deletedAt: null
  });

  mockAuthSeeded = true;
}

function getMockAuthenticatedUser(accessToken?: string): MockUserRecord | null {
  const token = accessToken ?? currentAccessToken;
  if (!token) {
    return null;
  }

  const email = mockAccessTokens.get(token);
  if (!email) {
    return null;
  }

  return mockUsersByEmail.get(email) ?? null;
}

function requireMockAuthenticatedUser(accessToken?: string): MockUserRecord {
  const user = getMockAuthenticatedUser(accessToken);
  if (!user) {
    throw new ApiError("Missing access token.", {
      status: 401
    });
  }

  if (!user.isActive || user.deletedAt) {
    throw new ApiError("Account is inactive.", {
      status: 403
    });
  }

  return user;
}

function requireMockAdminUser(accessToken?: string): MockUserRecord {
  const user = requireMockAuthenticatedUser(accessToken);
  if (user.role !== "admin") {
    throw new ApiError("Admin role required.", {
      status: 403
    });
  }

  return user;
}

function toMockToolSummary(tool: ToolDetail): ToolSummary {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    description: tool.description,
    category: tool.category,
    isEnabled: tool.isEnabled
  };
}

function issueMockTokenPair(user: MockUserRecord): AuthSessionResponse {
  const accessToken = randomId("access");
  const refreshToken = randomId("refresh");
  user.lastLoginAt = new Date().toISOString();

  mockAccessTokens.set(accessToken, user.email);
  mockRefreshTokens.set(refreshToken, user.email);

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: 15 * 60,
    refreshExpiresIn: 7 * 24 * 60 * 60,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    }
  };
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);

  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = init?.accessToken ?? currentAccessToken;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      headers,
      credentials: "include"
    });
  } catch {
    throw new ApiError("Network error. Please check your connection and try again.", {
      isNetworkError: true
    });
  }

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;

    let parsedPayload: unknown = null;
    try {
      parsedPayload = await response.json();
    } catch {
      // Ignore JSON parsing errors and fallback to generic message.
    }

    const { message, fieldErrors } = extractApiError(parsedPayload, fallbackMessage);

    throw new ApiError(message, {
      status: response.status,
      fieldErrors
    });
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken() {
  return currentAccessToken;
}

export async function login(payload: LoginRequest): Promise<AuthSessionResponse> {
  const email = normalizeEmail(payload.email);
  const password = payload.password;

  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(400);

    if (!isLikelyEmail(email)) {
      throw new ApiError("Please enter a valid email address.", {
        status: 422,
        fieldErrors: {
          email: "Please enter a valid email address."
        }
      });
    }

    if (password.trim().length < 6) {
      throw new ApiError("Password must contain at least 6 characters.", {
        status: 422,
        fieldErrors: {
          password: "Password must contain at least 6 characters."
        }
      });
    }

    const user = mockUsersByEmail.get(email);
    if (!user || user.password !== password) {
      throw new ApiError("Invalid email or password.", {
        status: 401,
        fieldErrors: {
          email: "Invalid email or password.",
          password: "Invalid email or password."
        }
      });
    }

    return issueMockTokenPair(user);
  }

  return request<AuthSessionResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    })
  });
}

export async function register(payload: RegisterRequest): Promise<AuthSessionResponse> {
  const fullName = requireField(payload.fullName, "fullName", "Full name is required.");
  const email = normalizeEmail(payload.email);
  const password = payload.password;

  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(450);

    if (!isLikelyEmail(email)) {
      throw new ApiError("Please enter a valid email address.", {
        status: 422,
        fieldErrors: {
          email: "Please enter a valid email address."
        }
      });
    }

    if (password.trim().length < 8) {
      throw new ApiError("Password must contain at least 8 characters.", {
        status: 422,
        fieldErrors: {
          password: "Password must contain at least 8 characters."
        }
      });
    }

    if (mockUsersByEmail.has(email)) {
      throw new ApiError("Email is already registered.", {
        status: 409,
        fieldErrors: {
          email: "Email is already registered."
        }
      });
    }

    const user: MockUserRecord = {
      id: randomId("user"),
      email,
      role: normalizeRole(email),
      name: fullName,
      password,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      deletedAt: null
    };

    mockUsersByEmail.set(email, user);
    return issueMockTokenPair(user);
  }

  // Backend register contract currently accepts email + password.
  return request<AuthSessionResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    })
  });
}

export async function refreshSession(refreshToken?: string): Promise<RefreshResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(250);

    if (!refreshToken) {
      throw new ApiError("Missing refresh token.", {
        status: 401
      });
    }

    const email = mockRefreshTokens.get(refreshToken);
    if (!email) {
      throw new ApiError("Invalid refresh token.", {
        status: 401
      });
    }

    const user = mockUsersByEmail.get(email);
    if (!user) {
      throw new ApiError("Invalid refresh token.", {
        status: 401
      });
    }

    const accessToken = randomId("access");
    mockAccessTokens.set(accessToken, email);

    return {
      accessToken,
      tokenType: "Bearer",
      expiresIn: 15 * 60
    };
  }

  return request<RefreshResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify(
      refreshToken
        ? {
            refreshToken
          }
        : {}
    )
  });
}

export async function logout(refreshToken?: string): Promise<LogoutResponse> {
  if (shouldUseMockApi()) {
    await sleep(120);

    if (refreshToken) {
      mockRefreshTokens.delete(refreshToken);
    }

    return { success: true };
  }

  return request<LogoutResponse>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(
      refreshToken
        ? {
            refreshToken
          }
        : {}
    )
  });
}

export async function getProfile(accessToken?: string): Promise<ProfileResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(120);
    const user = requireMockAuthenticatedUser(accessToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    };
  }

  return request<ProfileResponse>("/auth/me", {
    method: "GET",
    accessToken
  });
}

export async function listTools(): Promise<ToolListResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(250);

    return {
      items: mockToolDetails.map((tool) => toMockToolSummary(tool)),
      meta: {
        total: mockToolDetails.length
      }
    };
  }

  return request<ToolListResponse>("/tools");
}

export async function getToolDetail(toolSlug: string): Promise<ToolDetail> {
  if (shouldUseMockApi()) {
    await sleep(250);

    const tool = mockToolMap.get(toolSlug);
    if (!tool) {
      throw new ApiError("Tool not found", {
        status: 404
      });
    }

    return tool;
  }

  return request<ToolDetail>(`/tools/${toolSlug}`);
}

export async function executeTool(toolSlug: string, payload: ExecuteToolRequest): Promise<ExecuteToolResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(600);

    const tool = mockToolMap.get(toolSlug);
    if (!tool) {
      throw new ApiError("Tool not found", {
        status: 404
      });
    }

    if (!tool.isEnabled) {
      throw new ApiError("Tool is disabled", {
        status: 503
      });
    }

    let output: Record<string, unknown> = payload.input;

    if (toolSlug === "json-formatter") {
      const rawValue = String(payload.input.payload ?? "");
      try {
        const parsed = JSON.parse(rawValue);
        output = {
          formatted: JSON.stringify(parsed, null, 2)
        };
      } catch {
        throw new ApiError("Invalid JSON payload", {
          status: 422,
          fieldErrors: {
            payload: "Invalid JSON payload"
          }
        });
      }
    }

    if (toolSlug === "uuid-generator") {
      const count = Number(payload.input.count ?? 1);
      output = {
        uuids: Array.from({ length: Math.max(1, Math.min(count, 10)) }, () => randomId("uuid"))
      };
    }

    if (toolSlug === "base64-encoder") {
      const mode = String(payload.input.mode ?? "encode");
      const text = String(payload.input.text ?? "");
      const encoded = encodeBase64(text);
      output = {
        output: mode === "decode" ? decodeBase64(text) : encoded
      };
    }

    const currentCount = mockToolUsageCounts.get(toolSlug) ?? 0;
    mockToolUsageCounts.set(toolSlug, currentCount + 1);

    return {
      executionId: randomId("exec"),
      toolSlug,
      status: "completed",
      output,
      durationMs: Math.floor(Math.random() * 140) + 20,
      executedAt: new Date().toISOString()
    };
  }

  return request<ExecuteToolResponse>(`/tools/${toolSlug}/execute`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function listAdminUsers(params?: { page?: number; limit?: number }): Promise<AdminUsersPageResponse> {
  const page = Math.max(1, params?.page ?? 1);
  const limit = Math.max(1, Math.min(params?.limit ?? 20, 100));

  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(260);
    requireMockAdminUser();

    const users = Array.from(mockUsersByEmail.values())
      .filter((user) => user.deletedAt === null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const offset = (page - 1) * limit;
    const sliced = users.slice(offset, offset + limit);

    return {
      data: sliced.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      })),
      total: users.length,
      page,
      limit
    };
  }

  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });

  const response = await request<AdminUsersPageApiResponse>(`/admin/users?${query.toString()}`, {
    method: "GET"
  });

  return {
    ...response,
    data: response.data.map((user) => ({
      ...user,
      isActive: user.isActive ?? true
    }))
  };
}

export async function updateAdminUser(userId: string, payload: UpdateAdminUserRequest): Promise<AdminUserMutationResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(240);
    const admin = requireMockAdminUser();

    const targetUser = Array.from(mockUsersByEmail.values()).find((user) => user.id === userId && user.deletedAt === null);
    if (!targetUser) {
      throw new ApiError("User not found", {
        status: 404
      });
    }

    if (admin.id === targetUser.id && payload.isActive === false) {
      throw new ApiError("Admins cannot deactivate themselves", {
        status: 400
      });
    }

    if (payload.role !== undefined) {
      targetUser.role = payload.role;
    }

    if (payload.isActive !== undefined) {
      targetUser.isActive = payload.isActive;
    }

    return {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name ?? null,
      role: targetUser.role,
      isActive: targetUser.isActive,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
      deletedAt: targetUser.deletedAt
    };
  }

  return request<AdminUserMutationResponse>(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function deleteAdminUser(userId: string): Promise<{ id: string; deletedAt: string }> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(240);
    const admin = requireMockAdminUser();

    const targetUser = Array.from(mockUsersByEmail.values()).find((user) => user.id === userId && user.deletedAt === null);
    if (!targetUser) {
      throw new ApiError("User not found", {
        status: 404
      });
    }

    if (admin.id === targetUser.id) {
      throw new ApiError("Admins cannot delete themselves", {
        status: 400
      });
    }

    const deletedAt = new Date().toISOString();
    targetUser.deletedAt = deletedAt;
    targetUser.isActive = false;

    return {
      id: targetUser.id,
      deletedAt
    };
  }

  return request<{ id: string; deletedAt: string }>(`/admin/users/${userId}`, {
    method: "DELETE"
  });
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(200);
    requireMockAdminUser();

    const totalUsers = Array.from(mockUsersByEmail.values()).filter((user) => user.deletedAt === null).length;
    const toolUsage = Array.from(mockToolUsageCounts.entries())
      .map(([slug, count]) => ({
        slug,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalUsers,
      totalExecutions: toolUsage.reduce((total, item) => total + item.count, 0),
      toolUsage
    };
  }

  return request<AdminStatsResponse>("/admin/stats", {
    method: "GET"
  });
}

export async function listAdminTools(): Promise<ToolListResponse> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(230);
    requireMockAdminUser();

    const tools = [...mockToolDetails].sort((a, b) => a.name.localeCompare(b.name)).map((tool) => toMockToolSummary(tool));

    return {
      items: tools,
      meta: {
        total: tools.length
      }
    };
  }

  return request<ToolListResponse>("/admin/tools", {
    method: "GET"
  });
}

export async function updateAdminToolStatus(toolId: string, isEnabled: boolean): Promise<ToolSummary> {
  if (shouldUseMockApi()) {
    ensureMockSeeded();
    await sleep(220);
    requireMockAdminUser();

    const tool = mockToolDetails.find((item) => item.id === toolId);
    if (!tool) {
      throw new ApiError("Tool not found", {
        status: 404
      });
    }

    tool.isEnabled = isEnabled;
    return toMockToolSummary(tool);
  }

  return request<ToolSummary>(`/admin/tools/${toolId}`, {
    method: "PATCH",
    body: JSON.stringify({
      isEnabled
    })
  });
}
