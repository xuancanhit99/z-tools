import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ToolEntity } from "./tool.entity";
import { UserEntity } from "./user.entity";

@Entity({ name: "execution_history" })
@Index("idx_execution_history_tool_slug", ["toolSlug"])
@Index("idx_execution_history_executed_at", ["executedAt"])
export class ExecutionHistoryEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "tool_id", type: "uuid", nullable: true })
  toolId!: string | null;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ name: "tool_slug", type: "varchar", length: 120 })
  toolSlug!: string;

  @Column({ type: "varchar", length: 32 })
  status!: string;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  input!: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  output!: Record<string, unknown> | null;

  @Column({ name: "duration_ms", type: "integer", nullable: true })
  durationMs!: number | null;

  @Column({ name: "request_id", type: "uuid", nullable: true })
  requestId!: string | null;

  @Column({ name: "executed_at", type: "timestamptz", default: () => "CURRENT_TIMESTAMP" })
  executedAt!: Date;

  @Column({ name: "error_code", type: "varchar", length: 120, nullable: true })
  errorCode!: string | null;

  @Column({ name: "error_message", type: "text", nullable: true })
  errorMessage!: string | null;

  @ManyToOne(() => ToolEntity, (tool) => tool.executions, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "tool_id" })
  tool!: ToolEntity | null;

  @ManyToOne(() => UserEntity, (user) => user.executions, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity | null;
}
