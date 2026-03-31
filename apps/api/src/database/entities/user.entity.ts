import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { AdminAuditLogEntity } from "./admin-audit-log.entity";
import { ExecutionHistoryEntity } from "./execution-history.entity";
import { RefreshTokenEntity } from "./refresh-token.entity";

export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "varchar", length: 160, nullable: true })
  name!: string | null;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => ExecutionHistoryEntity, (execution) => execution.user)
  executions!: ExecutionHistoryEntity[];

  @OneToMany(() => RefreshTokenEntity, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshTokenEntity[];

  @OneToMany(() => AdminAuditLogEntity, (auditLog) => auditLog.admin)
  adminAuditLogs!: AdminAuditLogEntity[];
}
