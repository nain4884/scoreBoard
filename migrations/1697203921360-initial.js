const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class initial1697203921360 {
    name = 'initial1697203921360'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "match" ("id" SERIAL NOT NULL, "marketId" character varying NOT NULL, "eventId" character varying NOT NULL, "competitionId" character varying NOT NULL, "competitionName" character varying NOT NULL, "gameType" character varying(50) NOT NULL, "teamA" character varying NOT NULL, "teamB" character varying NOT NULL, "teamC" character varying, "title" character varying NOT NULL, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "stopAt" TIMESTAMP, "overType" character varying, "noBallRun" integer, "currentInning" integer, "totalOver" integer NOT NULL DEFAULT '50', "tossWin" character varying, "firstBatTeam" character varying, CONSTRAINT "UQ_d7ae526ab78eea1ed19c3de64b1" UNIQUE ("marketId"), CONSTRAINT "PK_92b6c3a6631dd5b24a67c69f69d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "match_marketId" ON "match" ("marketId", "gameType") `);
        await queryRunner.query(`CREATE TABLE "player" ("id" SERIAL NOT NULL, "marketId" character varying(40) NOT NULL, "gameType" character varying(50) NOT NULL, "teamName" character varying(40) NOT NULL, "playerName" character varying NOT NULL, "playerType" character varying, "bowlerType" character varying, "isPlayerOut" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_65edadc946a7faf4b638d5e8885" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_player" ON "player" ("marketId", "playerName", "teamName") `);
        await queryRunner.query(`CREATE TABLE "scoreInning" ("id" SERIAL NOT NULL, "marketId" character varying(40) NOT NULL, "gameType" character varying(50) NOT NULL, "teamName" character varying(40) NOT NULL, "title" character varying NOT NULL, "startDate" TIMESTAMP NOT NULL DEFAULT now(), "stopAt" TIMESTAMP, "inningNumber" integer NOT NULL, "score" integer NOT NULL DEFAULT '0', "over" numeric(5,2) NOT NULL DEFAULT '0', "overRuns" character varying(50), "wicket" integer NOT NULL DEFAULT '0', "crr" numeric(5,2) NOT NULL DEFAULT '0', "rrr" numeric(5,2) NOT NULL DEFAULT '0', "striker" character varying(50), "nonStriker" character varying(50), "bowler" character varying(50), "bowlerType" character varying(50), "message" character varying(50), "lastOver" character varying(50), CONSTRAINT "PK_1426636eecdb8c10de1a9d5da23" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "scoreInning_marketId" ON "scoreInning" ("marketId", "inningNumber") `);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "userName" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_226bb9aa7aa8a69991209d58f59" UNIQUE ("userName"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "idx_userName" ON "users" ("id", "userName") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."idx_userName"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP INDEX "public"."scoreInning_marketId"`);
        await queryRunner.query(`DROP TABLE "scoreInning"`);
        await queryRunner.query(`DROP INDEX "public"."idx_player"`);
        await queryRunner.query(`DROP TABLE "player"`);
        await queryRunner.query(`DROP INDEX "public"."match_marketId"`);
        await queryRunner.query(`DROP TABLE "match"`);
    }
}
