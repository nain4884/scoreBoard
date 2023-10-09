// models/Match.js
const { EntitySchema } = require("typeorm");

class ColumnNumericTransformer {
    to(data) {
        return data;
    }
    from(data) {
        if (data && data != 'NaN') return parseFloat(data).toFixed(2);
        return 0;
    }
}

const ScoreInning = new EntitySchema({
    name: "scoreInning",
    tableName: "scoreInning",
    columns: {
        id: {
            type: Number, primary: true, generated: true,
        },
        marketId: {
            type: "varchar", unique: true, nullable: false, name: "marketId", length: 40
        },
        gameType: {
            type: "varchar", length: 50, nullable: false, name: "gameType",
        },
        teamName: {
            type: "varchar", length: 40, nullable: false, name: "teamName",
        },
        title: {
            type: "varchar", length: 50, nullable: false, name: "title",
        },
        startDate: {
            type: "timestamp", nullable: false, name: "startDate", default: new Date(),
        },
        stopAt: {
            type: "timestamp", nullable: true, name: "stopAt"
        },
        inningNumber: {
            type: Number, nullable: false, name: "inningNumber"
        },
        score: {
            type: Number, nullable: false, default: 0.0, name: "score"
        },
        over: {
            type: "decimal", nullable: false, name: "over", default: 0.0, precision: 5, scale: 2, transformer: new ColumnNumericTransformer()
        },
        overRuns: {
            type: "varchar", nullable: true, length: 50, name: "overRuns"
        },
        wicket: {
            type: Number, nullable: false, default: 0, name: "wicket"
        },
        crr: {
            type: "decimal", nullable: false, name: "crr", default: 0.0, precision: 5, scale: 2, transformer: new ColumnNumericTransformer()
        },
        rrr: {
            type: "decimal", nullable: false, name: "rrr", default: 0.0, precision: 5, scale: 2, transformer: new ColumnNumericTransformer()
        },
        striker: {
            type: "varchar", nullable: true, length: 50, name: "striker"
        },
        nonStriker: {
            type: "varchar", nullable: true, length: 50, name: "nonStriker"
        },
        bowler: {
            type: "varchar", nullable: true, length: 50, name: "bowler"
        },
        bowlerType: {
            type: "varchar", nullable: true, length: 50, name: "bowlerType"
        },
        message: {
            type: "varchar", nullable: true, length: 50, name: "message"
        },
        lastOver: {
            type: "varchar", nullable: true, length: 50, name: "lastOver"
        },
    },
    indices: [
        {
          name: 'scoreInning_marketId',
          unique: true, // Optional: Set to true if you want a unique index
          columns: ['marketId', 'gameType'],
        }
      ],
});

module.exports = ScoreInning;