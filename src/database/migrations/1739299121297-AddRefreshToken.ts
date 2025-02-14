import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshToken1739299121297 implements MigrationInterface {
  name = 'AddRefreshToken1739299121297';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_users_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_users_email"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_email_format"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_password_length"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_password_uppercase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_password_lowercase"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_password_number"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "ck_users_password_special"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refresh_token" character varying`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "uq_users_email"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "avatar" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_370107b7e116e1dd37b6dd8cdf" CHECK ("password" ~ '[!@#$%^&*(),.?":{}|<>]')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_e0ca32b145a23929ea84720acf" CHECK ("password" ~ '[0-9]')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_862c2b7eb3336667146101efc8" CHECK ("password" ~ '[a-z]')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_f1bc8631801473b474cd5dece0" CHECK ("password" ~ '[A-Z]')`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_8dd71f5cf12ea1c97f3e6f33e5" CHECK (LENGTH("password") >= 8)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_4692bf1cccc0c267ba6bf17993" CHECK ("email" ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_4692bf1cccc0c267ba6bf17993"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_8dd71f5cf12ea1c97f3e6f33e5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_f1bc8631801473b474cd5dece0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_862c2b7eb3336667146101efc8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_e0ca32b145a23929ea84720acf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_370107b7e116e1dd37b6dd8cdf"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "avatar"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "avatar" text`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "password" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email" text NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "uq_users_email" UNIQUE ("email")`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refresh_token"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_password_special" CHECK ((password ~ '[!@#$%^&*(),.?":{}|<>]'::text))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_password_number" CHECK ((password ~ '[0-9]'::text))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_password_lowercase" CHECK ((password ~ '[a-z]'::text))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_password_uppercase" CHECK ((password ~ '[A-Z]'::text))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_password_length" CHECK ((length(password) >= 8))`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "ck_users_email_format" CHECK ((email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::text))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_users_email" ON "users" ("email") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_users_id" ON "users" ("id") `);
  }
}
