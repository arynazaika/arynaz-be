import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRateLimitBuckets1795167808161 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rate_limit_buckets (
        key        text PRIMARY KEY,        
        hits       int NOT NULL,            
        expires_at timestamptz NOT NULL     
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE rate_limit_buckets`);
  }
}
