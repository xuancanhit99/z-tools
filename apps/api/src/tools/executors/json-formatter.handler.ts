import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { ToolExecutionHandler } from "../interfaces/tool-execution-handler.interface";

@Injectable()
export class JsonFormatterHandler implements ToolExecutionHandler {
  readonly slug = "json-formatter";

  execute(input: Record<string, unknown>): Record<string, unknown> {
    const payload = input.payload;
    if (typeof payload !== "string" || payload.trim().length === 0) {
      throw new UnprocessableEntityException("`payload` must be a non-empty JSON string");
    }

    try {
      const parsed = JSON.parse(payload);
      return {
        formatted: JSON.stringify(parsed, null, 2)
      };
    } catch {
      throw new UnprocessableEntityException("Invalid JSON payload");
    }
  }
}
