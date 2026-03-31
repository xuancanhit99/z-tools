import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";

import { UserEntity } from "./user.entity";

@Entity({ name: "admin_audit_logs" })
@Index("idx_admin_audit_logs_admin_id", ["adminId"])
@Index("idx_admin_audit_logs_created_at", ["createdAt"])
export class AdminAuditLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "admin_id", type: "uuid" })
  adminId!: string;

  @Column({ type: "varchar", length: 120 })
  action!: string;

  @Column({ name: "target_id", type: "uuid", nullable: true })
  targetId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne(() => UserEntity, (user) => user.adminAuditLogs, { nullable: false, onDelete: "NO ACTION" })
  @JoinColumn({ name: "admin_id" })
  admin!: UserEntity;
}
