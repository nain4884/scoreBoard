const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class RemoveTeamCandIndexUnique1701767574732 {
    name = 'RemoveTeamCandIndexUnique1701767574732'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."scoreInning_marketId"`);
        await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "teamC"`);
        await queryRunner.query(`ALTER TABLE "match" ADD "teamAShort" character varying`);
        await queryRunner.query(`ALTER TABLE "match" ADD "teamBShort" character varying`);
        await queryRunner.query(`ALTER TABLE "scoreInning" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "scoreInning" ADD "message" character varying(500)`);
        await queryRunner.query(`CREATE INDEX "scoreInning_marketId" ON "scoreInning" ("marketId", "inningNumber") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."scoreInning_marketId"`);
        await queryRunner.query(`ALTER TABLE "scoreInning" DROP COLUMN "message"`);
        await queryRunner.query(`ALTER TABLE "scoreInning" ADD "message" character varying(500)`);
        await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "teamBShort"`);
        await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "teamAShort"`);
        await queryRunner.query(`ALTER TABLE "match" ADD "teamC" character varying`);
        await queryRunner.query(`CREATE UNIQUE INDEX "scoreInning_marketId" ON "scoreInning" ("marketId", "inningNumber") `);
    }
}
