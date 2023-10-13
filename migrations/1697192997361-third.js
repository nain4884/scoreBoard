const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class third1697192997361 {
    name = 'third1697192997361'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."idx_player"`);
        await queryRunner.query(`ALTER TABLE "player" ADD "isPlayerOut" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT "UQ_dbb6668f8c78808bad436fbae4d"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_player" ON "player" ("marketId", "playerName", "teamName") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."idx_player"`);
        await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT "UQ_dbb6668f8c78808bad436fbae4d" UNIQUE ("playerName")`);
        await queryRunner.query(`ALTER TABLE "player" DROP COLUMN "isPlayerOut"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_player" ON "player" ("playerName", "playerType") `);
    }
}
