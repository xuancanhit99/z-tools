import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards
} from "@nestjs/common";

import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/interfaces/authenticated-request.interface";
import { UserRole } from "../database/entities/user.entity";
import { AdminService } from "./admin.service";
import { ListAdminUsersQueryDto } from "./dto/list-admin-users-query.dto";
import { UpdateAdminUserDto } from "./dto/update-admin-user.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  listUsers(@Query() query: ListAdminUsersQueryDto, @Req() req: AuthenticatedRequest) {
    return this.adminService.listUsers(req.user.id, query.page, query.limit);
  }

  @Patch("users/:id")
  updateUser(
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Body() dto: UpdateAdminUserDto,
    @Req() req: AuthenticatedRequest
  ) {
    return this.adminService.updateUser(req.user.id, userId, dto);
  }

  @Delete("users/:id")
  deleteUser(
    @Param("id", new ParseUUIDPipe({ version: "4" })) userId: string,
    @Req() req: AuthenticatedRequest
  ) {
    return this.adminService.softDeleteUser(req.user.id, userId);
  }

  @Get("stats")
  getStats(@Req() req: AuthenticatedRequest) {
    return this.adminService.getStats(req.user.id);
  }
}
