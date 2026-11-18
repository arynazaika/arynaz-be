import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1792713600000 implements MigrationInterface {
  name = 'CreateUsers1792713600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_status" AS ENUM ('pending', 'active', 'blocked', 'deleting', 'deleted')`,
    );
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
        "email"         text        NOT NULL UNIQUE,
        "password_hash" text        NOT NULL,
        "display_name"  text        NULL,
        "photo_key"     text        NULL,
        "status"        "user_status" NOT NULL DEFAULT 'pending',
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_status"`);
  }
}
