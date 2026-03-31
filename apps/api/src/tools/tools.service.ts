import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, In, Repository } from "typeorm";

import { ToolEntity } from "../database/entities/tool.entity";
import { ListToolsQueryDto } from "./dto/list-tools-query.dto";
import { DEFAULT_TOOL_SEEDS } from "./tool-seeds";

export type ToolSummaryResponse = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  isEnabled: boolean;
};

export type ToolDetailResponse = ToolSummaryResponse & {
  instructions: string;
  inputSchema: Record<string, unknown>[];
  outputSchema: Record<string, unknown>;
};

export type ToolListResponse = {
  items: ToolSummaryResponse[];
  meta: {
    total: number;
  };
};

@Injectable()
export class ToolsService implements OnModuleInit {
  constructor(
    @InjectRepository(ToolEntity)
    private readonly toolsRepository: Repository<ToolEntity>
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedDefaultTools();
  }

  async listEnabledTools(query: ListToolsQueryDto): Promise<ToolListResponse> {
    const where = {
      isEnabled: true,
      ...(query.search ? { name: ILike(`%${query.search}%`) } : {}),
      ...(query.category ? { category: query.category } : {})
    };

    const tools = await this.toolsRepository.find({
      where,
      order: { name: "ASC" }
    });

    return {
      items: tools.map((tool) => this.toSummary(tool)),
      meta: {
        total: tools.length
      }
    };
  }

  async getEnabledToolBySlug(slug: string): Promise<ToolDetailResponse> {
    const tool = await this.toolsRepository.findOne({
      where: { slug, isEnabled: true }
    });
    if (!tool) {
      throw new NotFoundException({
        code: "TOOL_NOT_FOUND",
        message: "Tool not found"
      });
    }

    return this.toDetail(tool);
  }

  async getToolBySlug(slug: string): Promise<ToolEntity> {
    const tool = await this.toolsRepository.findOne({ where: { slug } });
    if (!tool) {
      throw new NotFoundException({
        code: "TOOL_NOT_FOUND",
        message: "Tool not found"
      });
    }

    return tool;
  }

  private async seedDefaultTools(): Promise<void> {
    const slugs = DEFAULT_TOOL_SEEDS.map((tool) => tool.slug);
    const existing = await this.toolsRepository.find({
      where: {
        slug: In(slugs)
      },
      select: {
        id: true,
        slug: true
      }
    });

    const existingSlugs = new Set(existing.map((tool) => tool.slug));
    const missing = DEFAULT_TOOL_SEEDS.filter((tool) => !existingSlugs.has(tool.slug));

    if (missing.length === 0) {
      return;
    }

    await this.toolsRepository.save(
      missing.map((tool) =>
        this.toolsRepository.create({
          slug: tool.slug,
          name: tool.name,
          description: tool.description,
          category: tool.category,
          isEnabled: true,
          instructions: tool.instructions,
          inputSchema: tool.inputSchema,
          outputSchema: tool.outputSchema
        })
      )
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
}
