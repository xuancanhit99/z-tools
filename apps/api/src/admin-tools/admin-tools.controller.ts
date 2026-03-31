import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";
import { UserRole } from "../database/entities/user.entity";
import { CreateAdminToolDto } from "./dto/create-admin-tool.dto";
import { UpdateAdminToolDto } from "./dto/update-admin-tool.dto";
import { AdminToolsService } from "./admin-tools.service";

@Controller("admin/tools")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminToolsController {
  constructor(private readonly adminToolsService: AdminToolsService) {}

  @Get()
  listTools(@Req() req: AuthenticatedRequest) {
    return this.adminToolsService.listTools(req.user.id);
  }

  @Post()
  createTool(@Body() dto: CreateAdminToolDto, @Req() req: AuthenticatedRequest) {
    return this.adminToolsService.createTool(req.user.id, dto);
  }

  @Patch(":id")
  updateTool(
    @Param("id", new ParseUUIDPipe({ version: "4" })) toolId: string,
    @Body() dto: UpdateAdminToolDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.adminToolsService.updateTool(req.user.id, toolId, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async deleteTool(
    @Param("id", new ParseUUIDPipe({ version: "4" })) toolId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<void> {
    await this.adminToolsService.deleteTool(req.user.id, toolId);
  }
}
