import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { ToolExecutionHandler } from "../interfaces/tool-execution-handler.interface";

@Injectable()
export class Base64Handler implements ToolExecutionHandler {
  readonly slug = "base64";

  execute(input: Record<string, unknown>): Record<string, unknown> {
    const mode = input.mode;
    if (mode !== "encode" && mode !== "decode") {
      throw new UnprocessableEntityException("`mode` must be either `encode` or `decode`");
    }

    const value = input.value ?? input.text;
    if (typeof value !== "string") {
      throw new UnprocessableEntityException("`value` must be a string");
    }

    if (mode === "encode") {
      return {
        result: Buffer.from(value, "utf8").toString("base64")
      };
    }

    if (!this.isValidBase64(value)) {
      throw new UnprocessableEntityException("Invalid base64 value");
    }

    return {
      result: Buffer.from(value, "base64").toString("utf8")
    };
  }

  private isValidBase64(value: string): boolean {
    if (value.length === 0 || value.length % 4 !== 0) {
      return false;
    }

    return /^[A-Za-z0-9+/]*={0,2}$/.test(value);
  }
}
