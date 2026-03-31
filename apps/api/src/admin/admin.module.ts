import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { AdminAuditLogEntity } from "../database/entities/admin-audit-log.entity";
import { ExecutionHistoryEntity } from "../database/entities/execution-history.entity";
import { UserEntity } from "../database/entities/user.entity";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, ExecutionHistoryEntity, AdminAuditLogEntity]), AuthModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
