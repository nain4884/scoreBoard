const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Second1697174900452 {
    name = 'Second1697174900452'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "player" ("id" SERIAL NOT NULL, "marketId" character varying(40) NOT NULL, "gameType" character varying(50) NOT NULL, "teamName" character varying(40) NOT NULL, "playerName" character varying NOT NULL, "playerType" character varying, "bowlerType" character varying, CONSTRAINT "UQ_dbb6668f8c78808bad436fbae4d" UNIQUE ("playerName"), CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_player" ON "player" ("playerType", "playerName") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."idx_player"`);
        await queryRunner.query(`DROP TABLE "player"`);
    }
}
