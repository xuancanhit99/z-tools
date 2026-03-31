import { randomUUID } from "node:crypto";

import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { ToolExecutionHandler } from "../interfaces/tool-execution-handler.interface";

@Injectable()
export class UuidGeneratorHandler implements ToolExecutionHandler {
  readonly slug = "uuid-generator";

  execute(input: Record<string, unknown>): Record<string, unknown> {
    const rawCount = input.count ?? 1;
    const count = Number(rawCount);

    if (!Number.isInteger(count) || count < 1 || count > 100) {
      throw new UnprocessableEntityException("`count` must be an integer from 1 to 100");
    }

    return {
      uuids: Array.from({ length: count }, () => randomUUID())
    };
  }
}
