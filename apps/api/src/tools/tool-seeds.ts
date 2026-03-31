type ToolSeed = {
  slug: string;
  name: string;
  description: string;
  category: string;
  instructions: string;
  inputSchema: Record<string, unknown>[];
  outputSchema: Record<string, unknown>;
};

export const DEFAULT_TOOL_SEEDS: ToolSeed[] = [
  {
    slug: "json-formatter",
    name: "JSON Formatter",
    description: "Parse and prettify JSON payloads.",
    category: "formatting",
    instructions: "Provide raw JSON in `payload`.",
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
    slug: "base64",
    name: "Base64 Encode/Decode",
    description: "Encode or decode unicode-safe Base64 values.",
    category: "encoding",
    instructions: "Set `mode` to encode or decode and pass `value`.",
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
        key: "value",
        label: "Value",
        type: "textarea",
        required: true,
        placeholder: "Hello HyperZ"
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        result: "SGVsbG8gSHlwZXJa"
      }
    }
  },
  {
    slug: "uuid-generator",
    name: "UUID Generator",
    description: "Generate UUID v4 values in bulk.",
    category: "utility",
    instructions: "Set `count` between 1 and 100.",
    inputSchema: [
      {
        key: "count",
        label: "Count",
        type: "number",
        required: true,
        placeholder: "5"
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        uuids: ["08d5e98a-f2cf-435e-8f8e-dd6caed6cae7"]
      }
    }
  },
  {
    slug: "jwt-decoder",
    name: "JWT Decoder",
    description: "Decode JWT header and payload and check expiry.",
    category: "security",
    instructions: "Provide JWT token as `token`.",
    inputSchema: [
      {
        key: "token",
        label: "JWT Token",
        type: "textarea",
        required: true,
        placeholder: "eyJhbGciOiJIUzI1NiIsInR5..."
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        header: { alg: "HS256", typ: "JWT" },
        payload: { sub: "123" },
        isExpired: false
      }
    }
  },
  {
    slug: "regex-tester",
    name: "Regex Tester",
    description: "Run regex against a string and inspect matches.",
    category: "development",
    instructions: "Pass `pattern`, optional `flags`, and `testString`.",
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
        key: "testString",
        label: "Test String",
        type: "textarea",
        required: true,
        placeholder: "hello world"
      }
    ],
    outputSchema: {
      type: "json",
      sample: {
        matches: ["hello", "world"],
        groups: [[], []]
      }
    }
  }
];
