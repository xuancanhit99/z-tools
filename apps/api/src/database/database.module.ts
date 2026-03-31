import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { getTypeOrmModuleOptions } from "./typeorm.config";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => getTypeOrmModuleOptions()
    })
  ]
})
export class DatabaseModule {}
