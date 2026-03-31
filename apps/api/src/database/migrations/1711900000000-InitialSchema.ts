import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1711900000000 implements MigrationInterface {
  name = "InitialSchema1711900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "password_hash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "tools" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "slug" character varying(120) NOT NULL,
        "name" character varying(255) NOT NULL,
        "description" text,
        "category" character varying(120) NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "instructions" text,
        "input_schema" jsonb NOT NULL DEFAULT '[]'::jsonb,
        "output_schema" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_tools_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tools_slug" UNIQUE ("slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "execution_history" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "tool_id" uuid,
        "user_id" uuid,
        "tool_slug" character varying(120) NOT NULL,
        "status" character varying(32) NOT NULL,
        "input" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "output" jsonb,
        "duration_ms" integer,
        "request_id" uuid,
        "executed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "error_code" character varying(120),
        "error_message" text,
        CONSTRAINT "PK_execution_history_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_execution_history_tool_slug" ON "execution_history" ("tool_slug")`);
    await queryRunner.query(`CREATE INDEX "IDX_execution_history_executed_at" ON "execution_history" ("executed_at")`);
    await queryRunner.query(`
      ALTER TABLE "execution_history"
      ADD CONSTRAINT "FK_execution_history_tool_id"
      FOREIGN KEY ("tool_id")
      REFERENCES "tools"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "execution_history"
      ADD CONSTRAINT "FK_execution_history_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE SET NULL
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "execution_history" DROP CONSTRAINT "FK_execution_history_user_id"`);
    await queryRunner.query(`ALTER TABLE "execution_history" DROP CONSTRAINT "FK_execution_history_tool_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_execution_history_executed_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_execution_history_tool_slug"`);
    await queryRunner.query(`DROP TABLE "execution_history"`);
    await queryRunner.query(`DROP TABLE "tools"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
