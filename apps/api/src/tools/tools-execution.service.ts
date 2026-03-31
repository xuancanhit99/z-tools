import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
  UnprocessableEntityException
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ExecutionHistoryEntity } from "../database/entities/execution-history.entity";
import { ToolEntity } from "../database/entities/tool.entity";
import { Base64Handler } from "./executors/base64.handler";
import { JsonFormatterHandler } from "./executors/json-formatter.handler";
import { JwtDecoderHandler } from "./executors/jwt-decoder.handler";
import { RegexTesterHandler } from "./executors/regex-tester.handler";
import { UuidGeneratorHandler } from "./executors/uuid-generator.handler";
import { ToolExecutionHandler } from "./interfaces/tool-execution-handler.interface";
import { ToolsService } from "./tools.service";

export type ExecuteToolResponse = {
  executionId: string;
  toolSlug: string;
  status: "completed";
  output: Record<string, unknown>;
  durationMs: number;
  executedAt: string;
};

@Injectable()
export class ToolsExecutionService {
  private readonly handlers: Map<string, ToolExecutionHandler>;

  constructor(
    @InjectRepository(ExecutionHistoryEntity)
    private readonly executionHistoryRepository: Repository<ExecutionHistoryEntity>,
    private readonly toolsService: ToolsService,
    jsonFormatterHandler: JsonFormatterHandler,
    base64Handler: Base64Handler,
    uuidGeneratorHandler: UuidGeneratorHandler,
    jwtDecoderHandler: JwtDecoderHandler,
    regexTesterHandler: RegexTesterHandler
  ) {
    const executionHandlers = [
      jsonFormatterHandler,
      base64Handler,
      uuidGeneratorHandler,
      jwtDecoderHandler,
      regexTesterHandler
    ];

    this.handlers = new Map(executionHandlers.map((handler) => [handler.slug, handler]));
  }

  async executeTool(
    userId: string,
    toolSlug: string,
    input: Record<string, unknown>,
    requestId: string
  ): Promise<ExecuteToolResponse> {
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "`input` must be an object"
      });
    }

    const normalizedInput = this.toStableValue(input) as Record<string, unknown>;
    const tool = await this.toolsService.getToolBySlug(toolSlug);
    if (!tool.isEnabled) {
      throw new ServiceUnavailableException({
        code: "TOOL_DISABLED",
        message: "Tool is disabled"
      });
    }

    const existingExecution = await this.executionHistoryRepository.findOne({
      where: {
        userId,
        toolSlug,
        requestId,
        status: "completed"
      },
      order: {
        executedAt: "DESC"
      }
    });

    if (existingExecution) {
      const existingInput = this.toStableValue(existingExecution.input ?? {});
      if (JSON.stringify(existingInput) !== JSON.stringify(normalizedInput)) {
        throw new ConflictException({
          code: "REQUEST_ID_CONFLICT",
          message: "requestId has already been used with a different input payload"
        });
      }

      return this.toExecuteResponse(existingExecution);
    }

    const handler = this.handlers.get(toolSlug);
    if (!handler) {
      throw new ServiceUnavailableException({
        code: "TOOL_DISABLED",
        message: "No execution handler is registered for this tool"
      });
    }

    const startTime = Date.now();

    try {
      const output = handler.execute(normalizedInput);
      const execution = await this.saveExecution({
        tool,
        toolSlug,
        userId,
        requestId,
        input: normalizedInput,
        output,
        status: "completed",
        errorCode: null,
        errorMessage: null,
        durationMs: Date.now() - startTime
      });

      return this.toExecuteResponse(execution);
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const normalizedError = error instanceof Error ? error : new Error("Execution failed");

      await this.saveExecution({
        tool,
        toolSlug,
        userId,
        requestId,
        input: normalizedInput,
        output: null,
        status: "failed",
        errorCode: "EXECUTION_FAILED",
        errorMessage: normalizedError.message,
        durationMs
      });

      if (
        error instanceof UnprocessableEntityException ||
        error instanceof ConflictException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      throw new InternalServerErrorException({
        code: "EXECUTION_FAILED",
        message: "Tool execution failed unexpectedly"
      });
    }
  }

  private async saveExecution(params: {
    tool: ToolEntity;
    toolSlug: string;
    userId: string;
    requestId: string;
    input: Record<string, unknown>;
    output: Record<string, unknown> | null;
    status: string;
    errorCode: string | null;
    errorMessage: string | null;
    durationMs: number;
  }): Promise<ExecutionHistoryEntity> {
    return this.executionHistoryRepository.save(
      this.executionHistoryRepository.create({
        toolId: params.tool.id,
        userId: params.userId,
        toolSlug: params.toolSlug,
        requestId: params.requestId,
        input: params.input,
        output: params.output,
        durationMs: params.durationMs,
        status: params.status,
        errorCode: params.errorCode,
        errorMessage: params.errorMessage
      })
    );
  }

  private toExecuteResponse(execution: ExecutionHistoryEntity): ExecuteToolResponse {
    return {
      executionId: execution.id,
      toolSlug: execution.toolSlug,
      status: "completed",
      output: execution.output ?? {},
      durationMs: execution.durationMs ?? 0,
      executedAt: execution.executedAt.toISOString()
    };
  }

  private toStableValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.toStableValue(item));
    }

    if (!value || typeof value !== "object") {
      return value;
    }

    const objectValue = value as Record<string, unknown>;
    const keys = Object.keys(objectValue).sort();
    return keys.reduce<Record<string, unknown>>((accumulator, key) => {
      accumulator[key] = this.toStableValue(objectValue[key]);
      return accumulator;
    }, {});
  }
}
