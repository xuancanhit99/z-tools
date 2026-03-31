import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { AdminAuditLogEntity } from "../database/entities/admin-audit-log.entity";
import { ToolEntity } from "../database/entities/tool.entity";
import { AdminToolsController } from "./admin-tools.controller";
import { AdminToolsService } from "./admin-tools.service";

@Module({
  imports: [TypeOrmModule.forFeature([ToolEntity, AdminAuditLogEntity]), AuthModule],
  controllers: [AdminToolsController],
  providers: [AdminToolsService]
})
export class AdminToolsModule {}
