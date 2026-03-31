import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AuthModule } from "../auth/auth.module";
import { ExecutionHistoryEntity } from "../database/entities/execution-history.entity";
import { ToolEntity } from "../database/entities/tool.entity";
import { Base64Handler } from "./executors/base64.handler";
import { JsonFormatterHandler } from "./executors/json-formatter.handler";
import { JwtDecoderHandler } from "./executors/jwt-decoder.handler";
import { RegexTesterHandler } from "./executors/regex-tester.handler";
import { UuidGeneratorHandler } from "./executors/uuid-generator.handler";
import { ToolsController } from "./tools.controller";
import { ToolsExecutionService } from "./tools-execution.service";
import { ToolsService } from "./tools.service";

@Module({
  imports: [TypeOrmModule.forFeature([ToolEntity, ExecutionHistoryEntity]), AuthModule],
  controllers: [ToolsController],
  providers: [
    ToolsService,
    ToolsExecutionService,
    JsonFormatterHandler,
    Base64Handler,
    UuidGeneratorHandler,
    JwtDecoderHandler,
    RegexTesterHandler
  ],
  exports: [ToolsService]
})
export class ToolsModule {}
