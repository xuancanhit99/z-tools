import { join } from "node:path";

import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

import { AdminAuditLogEntity } from "./entities/admin-audit-log.entity";
import { ExecutionHistoryEntity } from "./entities/execution-history.entity";
import { RefreshTokenEntity } from "./entities/refresh-token.entity";
import { ToolEntity } from "./entities/tool.entity";
import { UserEntity } from "./entities/user.entity";

function parseBoolean(input: string | undefined, fallback = false): boolean {
  if (input === undefined) {
    return fallback;
  }

  return input.toLowerCase() === "true";
}

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER ?? "hyperz";
  const password = process.env.POSTGRES_PASSWORD ?? "hyperz_dev_password";
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5432";
  const database = process.env.POSTGRES_DB ?? "hyperz";

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getTypeOrmDataSourceOptions(): DataSourceOptions {
  const useSsl = parseBoolean(process.env.DATABASE_SSL, false);

  return {
    type: "postgres",
    url: resolveDatabaseUrl(),
    entities: [UserEntity, ToolEntity, ExecutionHistoryEntity, RefreshTokenEntity, AdminAuditLogEntity],
    migrations: [join(__dirname, "migrations", "*{.ts,.js}")],
    migrationsTableName: "typeorm_migrations",
    synchronize: false,
    logging: parseBoolean(process.env.TYPEORM_LOGGING, false),
    ssl: useSsl ? { rejectUnauthorized: false } : false
  };
}

export function getTypeOrmModuleOptions(): TypeOrmModuleOptions {
  return getTypeOrmDataSourceOptions();
}
