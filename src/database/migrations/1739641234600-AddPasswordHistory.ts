import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordHistory1739641234600 implements MigrationInterface {
  name = 'AddPasswordHistory1739641234600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password_history" text array DEFAULT '{}'`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "last_password_change" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "last_password_change"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_history"`,
    );
  }
}
