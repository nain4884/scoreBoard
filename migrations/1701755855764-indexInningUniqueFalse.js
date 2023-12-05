const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class IndexInningUniqueFalse1701755855764 {
    name = 'IndexInningUniqueFalse1701755855764'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."scoreInning_marketId"`);
        await queryRunner.query(`CREATE INDEX "scoreInning_marketId" ON "scoreInning" ("marketId", "inningNumber") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."scoreInning_marketId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "scoreInning_marketId" ON "scoreInning" ("marketId", "inningNumber") `);
    }
}
