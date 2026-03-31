import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { ToolExecutionHandler } from "../interfaces/tool-execution-handler.interface";

@Injectable()
export class JwtDecoderHandler implements ToolExecutionHandler {
  readonly slug = "jwt-decoder";

  execute(input: Record<string, unknown>): Record<string, unknown> {
    const token = input.token;
    if (typeof token !== "string" || token.trim().length === 0) {
      throw new UnprocessableEntityException("`token` must be a non-empty JWT string");
    }

    const parts = token.split(".");
    if (parts.length < 2) {
      throw new UnprocessableEntityException("Invalid JWT format");
    }

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;

    try {
      header = this.decodeJwtSegment(parts[0]);
      payload = this.decodeJwtSegment(parts[1]);
    } catch {
      throw new UnprocessableEntityException("Invalid JWT content");
    }

    const expirationSeconds = payload.exp;
    const isExpired =
      typeof expirationSeconds === "number"
        ? Date.now() >= expirationSeconds * 1000
        : false;

    return {
      header,
      payload,
      isExpired
    };
  }

  private decodeJwtSegment(segment: string): Record<string, unknown> {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const paddingSize = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4);
    const padded = base64 + "=".repeat(paddingSize);
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Invalid segment");
    }

    return parsed as Record<string, unknown>;
  }
}
