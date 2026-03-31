import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

import { ExecutionHistoryEntity } from "./execution-history.entity";

@Entity({ name: "tools" })
export class ToolEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  slug!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 120 })
  category!: string;

  @Column({ name: "is_enabled", type: "boolean", default: true })
  isEnabled!: boolean;

  @Column({ type: "text", nullable: true })
  instructions!: string | null;

  @Column({ name: "input_schema", type: "jsonb", default: () => "'[]'::jsonb" })
  inputSchema!: Record<string, unknown>[];

  @Column({ name: "output_schema", type: "jsonb", default: () => "'{}'::jsonb" })
  outputSchema!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany(() => ExecutionHistoryEntity, (execution) => execution.tool)
  executions!: ExecutionHistoryEntity[];
}
