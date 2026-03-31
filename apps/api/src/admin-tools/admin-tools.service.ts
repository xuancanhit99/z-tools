import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryFailedError, Repository } from "typeorm";

import { AdminAuditLogEntity } from "../database/entities/admin-audit-log.entity";
import { ToolEntity } from "../database/entities/tool.entity";
import { ToolDetailResponse, ToolListResponse, ToolSummaryResponse } from "../tools/tools.service";
import { CreateAdminToolDto } from "./dto/create-admin-tool.dto";
import { UpdateAdminToolDto } from "./dto/update-admin-tool.dto";

@Injectable()
export class AdminToolsService {
  constructor(
    @InjectRepository(ToolEntity)
    private readonly toolsRepository: Repository<ToolEntity>,
    @InjectRepository(AdminAuditLogEntity)
    private readonly adminAuditLogsRepository: Repository<AdminAuditLogEntity>
  ) {}

  async listTools(adminId: string): Promise<ToolListResponse> {
    const tools = await this.toolsRepository.find({
      order: { name: "ASC" }
    });

    await this.logAdminAction(adminId, "admin.tools.list");

    return {
      items: tools.map((tool) => this.toSummary(tool)),
      meta: {
        total: tools.length
      }
    };
  }

  async createTool(adminId: string, dto: CreateAdminToolDto): Promise<ToolDetailResponse> {
    try {
      const createdTool = await this.toolsRepository.save(
        this.toolsRepository.create({
          slug: dto.slug,
          name: dto.name,
          description: dto.description,
          category: dto.category,
          instructions: dto.instructions,
          inputSchema: dto.inputSchema,
          outputSchema: dto.outputSchema,
          isEnabled: dto.isEnabled ?? true
        })
      );

      await this.logAdminAction(adminId, "admin.tools.create", createdTool.id);
      return this.toDetail(createdTool);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "TOOL_SLUG_CONFLICT",
          message: "Tool slug already exists"
        });
      }

      throw error;
    }
  }

  async updateTool(adminId: string, toolId: string, dto: UpdateAdminToolDto): Promise<ToolDetailResponse> {
    const tool = await this.toolsRepository.findOne({ where: { id: toolId } });
    if (!tool) {
      throw new NotFoundException({
        code: "TOOL_NOT_FOUND",
        message: "Tool not found"
      });
    }

    const hasAnyChange =
      dto.slug !== undefined ||
      dto.name !== undefined ||
      dto.description !== undefined ||
      dto.category !== undefined ||
      dto.instructions !== undefined ||
      dto.inputSchema !== undefined ||
      dto.outputSchema !== undefined ||
      dto.isEnabled !== undefined;

    if (!hasAnyChange) {
      throw new UnprocessableEntityException({
        code: "VALIDATION_ERROR",
        message: "At least one field must be provided for update"
      });
    }

    if (dto.slug !== undefined) {
      tool.slug = dto.slug;
    }
    if (dto.name !== undefined) {
      tool.name = dto.name;
    }
    if (dto.description !== undefined) {
      tool.description = dto.description;
    }
    if (dto.category !== undefined) {
      tool.category = dto.category;
    }
    if (dto.instructions !== undefined) {
      tool.instructions = dto.instructions;
    }
    if (dto.inputSchema !== undefined) {
      tool.inputSchema = dto.inputSchema;
    }
    if (dto.outputSchema !== undefined) {
      tool.outputSchema = dto.outputSchema;
    }
    if (dto.isEnabled !== undefined) {
      tool.isEnabled = dto.isEnabled;
    }

    let savedTool: ToolEntity;
    try {
      savedTool = await this.toolsRepository.save(tool);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException({
          code: "TOOL_SLUG_CONFLICT",
          message: "Tool slug already exists"
        });
      }

      throw error;
    }

    await this.logAdminAction(adminId, "admin.tools.update", savedTool.id);

    return this.toDetail(savedTool);
  }

  async deleteTool(adminId: string, toolId: string): Promise<void> {
    const tool = await this.toolsRepository.findOne({
      where: { id: toolId },
      select: { id: true }
    });
    if (!tool) {
      throw new NotFoundException({
        code: "TOOL_NOT_FOUND",
        message: "Tool not found"
      });
    }

    await this.toolsRepository.delete({ id: toolId });
    await this.logAdminAction(adminId, "admin.tools.delete", toolId);
  }

  private async logAdminAction(adminId: string, action: string, targetId?: string): Promise<void> {
    await this.adminAuditLogsRepository.save(
      this.adminAuditLogsRepository.create({
        adminId,
        action,
        targetId: targetId ?? null
      })
    );
  }

  private toSummary(tool: ToolEntity): ToolSummaryResponse {
    return {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      description: tool.description ?? "",
      category: tool.category,
      isEnabled: tool.isEnabled
    };
  }

  private toDetail(tool: ToolEntity): ToolDetailResponse {
    return {
      ...this.toSummary(tool),
      instructions: tool.instructions ?? "",
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      error instanceof QueryFailedError &&
      typeof (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === "string" &&
      (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === "23505"
    );
  }
}
