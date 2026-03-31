import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException
} from "@nestjs/common";
import { Request, Response } from "express";

type NormalizedErrorPayload = {
  statusCode: number;
  code: string;
  message: string;
  details: Record<string, unknown>;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const payload = this.normalizeException(exception, request);

    response.status(payload.statusCode).json({
      error: {
        code: payload.code,
        message: payload.message,
        details: payload.details
      }
    });
  }

  private normalizeException(exception: unknown, request: Request): NormalizedErrorPayload {
    if (!(exception instanceof HttpException)) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
        details: {
          path: request.originalUrl,
          method: request.method
        }
      };
    }

    const statusCode = exception.getStatus();
    const response = exception.getResponse();
    const normalized = this.normalizeHttpExceptionPayload(response, exception);
    const mapped = this.mapCodeAndStatus(statusCode, normalized.message, normalized.code);

    const details: Record<string, unknown> =
      Object.keys(normalized.details).length > 0
        ? normalized.details
        : {
            path: request.originalUrl,
            method: request.method
          };

    return {
      statusCode: mapped.statusCode,
      code: mapped.code,
      message: normalized.message,
      details
    };
  }

  private normalizeHttpExceptionPayload(
    response: string | object,
    exception: HttpException
  ): {
    code?: string;
    message: string;
    details: Record<string, unknown>;
  } {
    if (typeof response === "string") {
      return {
        message: response,
        details: {}
      };
    }

    const body = response as Record<string, unknown>;
    const explicitCode = typeof body.code === "string" ? body.code : undefined;
    const messageValue = body.message;
    const explicitDetails = this.toDetailsObject(body.details);

    if (Array.isArray(messageValue)) {
      return {
        code: explicitCode,
        message: "Input validation failed",
        details: {
          ...explicitDetails,
          messages: messageValue
        }
      };
    }

    if (typeof messageValue === "string") {
      return {
        code: explicitCode,
        message: messageValue,
        details: explicitDetails
      };
    }

    return {
      code: explicitCode,
      message: exception.message ?? new InternalServerErrorException().message,
      details: explicitDetails
    };
  }

  private mapCodeAndStatus(
    statusCode: number,
    message: string,
    explicitCode?: string
  ): { statusCode: number; code: string } {
    if (explicitCode) {
      return {
        statusCode: statusCode === HttpStatus.BAD_REQUEST ? HttpStatus.UNPROCESSABLE_ENTITY : statusCode,
        code: explicitCode
      };
    }

    const normalizedMessage = message.toLowerCase();

    if (statusCode === HttpStatus.BAD_REQUEST || statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
      return {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        code: "VALIDATION_ERROR"
      };
    }

    if (statusCode === HttpStatus.UNAUTHORIZED) {
      return {
        statusCode,
        code: "UNAUTHORIZED"
      };
    }

    if (statusCode === HttpStatus.FORBIDDEN) {
      return {
        statusCode,
        code: "FORBIDDEN"
      };
    }

    if (statusCode === HttpStatus.NOT_FOUND) {
      return {
        statusCode,
        code: normalizedMessage.includes("tool") ? "TOOL_NOT_FOUND" : "NOT_FOUND"
      };
    }

    if (statusCode === HttpStatus.CONFLICT) {
      return {
        statusCode,
        code: normalizedMessage.includes("requestid") ? "REQUEST_ID_CONFLICT" : "CONFLICT"
      };
    }

    if (statusCode === HttpStatus.SERVICE_UNAVAILABLE) {
      return {
        statusCode,
        code: normalizedMessage.includes("disabled") ? "TOOL_DISABLED" : "SERVICE_UNAVAILABLE"
      };
    }

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      return {
        statusCode,
        code: normalizedMessage.includes("execution") ? "EXECUTION_FAILED" : "INTERNAL_SERVER_ERROR"
      };
    }

    return {
      statusCode,
      code: "HTTP_ERROR"
    };
  }

  private toDetailsObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }

    return value as Record<string, unknown>;
  }
}
