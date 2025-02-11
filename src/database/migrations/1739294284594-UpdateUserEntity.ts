import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserEntity1739294284594 implements MigrationInterface {
  name = 'UpdateUserEntity1739294284594';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing table and recreate with new schema
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" UUID NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "avatar" TEXT,
        "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "metadata" JSONB,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        CONSTRAINT "pk_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "uq_users_email" UNIQUE ("email"),
        CONSTRAINT "ck_users_email_format" CHECK ("email" ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
        CONSTRAINT "ck_users_password_length" CHECK (LENGTH("password") >= 8),
        CONSTRAINT "ck_users_password_uppercase" CHECK ("password" ~ '[A-Z]'),
        CONSTRAINT "ck_users_password_lowercase" CHECK ("password" ~ '[a-z]'),
        CONSTRAINT "ck_users_password_number" CHECK ("password" ~ '[0-9]'),
        CONSTRAINT "ck_users_password_special" CHECK ("password" ~ '[!@#$%^&*(),.?":{}|<>]')
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "idx_users_id" ON "users" ("id");
      CREATE INDEX "idx_users_email" ON "users" ("email");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
  }
}
