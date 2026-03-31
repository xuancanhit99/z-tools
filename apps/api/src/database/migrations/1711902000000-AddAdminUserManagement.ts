import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdminUserManagement1711902000000 implements MigrationInterface {
  name = "AddAdminUserManagement1711902000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "name" character varying(160)`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "last_login_at" TIMESTAMPTZ`);
    await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "deleted_at" TIMESTAMPTZ`);
    await queryRunner.query(`CREATE INDEX "IDX_users_deleted_at" ON "users" ("deleted_at")`);

    await queryRunner.query(`
      CREATE TABLE "admin_audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "admin_id" uuid NOT NULL,
        "action" character varying(120) NOT NULL,
        "target_id" uuid,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_admin_audit_logs_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_admin_audit_logs_admin_id" ON "admin_audit_logs" ("admin_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_admin_audit_logs_created_at" ON "admin_audit_logs" ("created_at")`);
    await queryRunner.query(`
      ALTER TABLE "admin_audit_logs"
      ADD CONSTRAINT "FK_admin_audit_logs_admin_id"
      FOREIGN KEY ("admin_id")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "FK_admin_audit_logs_admin_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_admin_audit_logs_admin_id"`);
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_users_deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
