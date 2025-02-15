import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordHistory1739641234600 implements MigrationInterface {
  name = 'AddPasswordHistory1739641234600';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "previousPasswords" text`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "lastPasswordChange" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "lastPasswordChange"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "previousPasswords"`,
    );
  }
}
