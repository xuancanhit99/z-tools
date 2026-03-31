import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";
import { ExecuteToolDto } from "./dto/execute-tool.dto";
import { ListToolsQueryDto } from "./dto/list-tools-query.dto";
import { ToolsExecutionService } from "./tools-execution.service";
import { ToolsService } from "./tools.service";

@Controller("tools")
export class ToolsController {
  constructor(
    private readonly toolsService: ToolsService,
    private readonly toolsExecutionService: ToolsExecutionService
  ) {}

  @Get()
  listTools(@Query() query: ListToolsQueryDto) {
    return this.toolsService.listEnabledTools(query);
  }

  @Get(":slug")
  getToolDetail(@Param("slug") slug: string) {
    return this.toolsService.getEnabledToolBySlug(slug);
  }

  @Post(":slug/execute")
  @UseGuards(JwtAuthGuard)
  executeTool(
    @Param("slug") slug: string,
    @Body() dto: ExecuteToolDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.toolsExecutionService.executeTool(req.user.id, slug, dto.input, dto.requestId);
  }
}
