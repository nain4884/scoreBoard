const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class Second1697434981577 {
    name = 'Second1697434981577'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "match" ADD "tossWin" character varying`);
        await queryRunner.query(`ALTER TABLE "match" ADD "firstBatTeam" character varying`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "firstBatTeam"`);
        await queryRunner.query(`ALTER TABLE "match" DROP COLUMN "tossWin"`);
    }
}
