import { Injectable, UnprocessableEntityException } from "@nestjs/common";

import { ToolExecutionHandler } from "../interfaces/tool-execution-handler.interface";

@Injectable()
export class RegexTesterHandler implements ToolExecutionHandler {
  readonly slug = "regex-tester";

  execute(input: Record<string, unknown>): Record<string, unknown> {
    const pattern = input.pattern;
    const flags = input.flags;
    const testString = input.testString;

    if (typeof pattern !== "string") {
      throw new UnprocessableEntityException("`pattern` must be a string");
    }

    if (flags !== undefined && typeof flags !== "string") {
      throw new UnprocessableEntityException("`flags` must be a string");
    }

    if (typeof testString !== "string") {
      throw new UnprocessableEntityException("`testString` must be a string");
    }

    let expression: RegExp;
    try {
      expression = new RegExp(pattern, flags ?? "");
    } catch {
      throw new UnprocessableEntityException("Invalid regular expression");
    }

    const globalExpression = expression.global ? expression : new RegExp(expression.source, `${expression.flags}g`);
    const matches = Array.from(testString.matchAll(globalExpression));

    return {
      matches: matches.map((match) => match[0]),
      groups: matches.map((match) => match.slice(1))
    };
  }
}
