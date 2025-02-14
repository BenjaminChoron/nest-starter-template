import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmailVerification1739553399024 implements MigrationInterface {
  name = 'AddEmailVerification1739553399024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_verification_token" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "email_verification_expires" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_verification_expires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "email_verification_token"`,
    );
  }
}
