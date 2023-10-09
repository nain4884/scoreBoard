// models/Match.js
const { EntitySchema } = require("typeorm");

const MatchSchema = new EntitySchema({
  name: "Match",
  tableName: "match",
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    marketId: {
      type: "varchar",
      unique: true,
      nullable: false,
      name: "marketId",
    },
    eventId: {
      type: "varchar",
      nullable: false,
      name: "eventId",
    },
    competitionId: {
      type: "varchar",
      nullable: false,
      name: "competitionId",
    },
    competitionName: {
      type: "varchar",
      nullable: false,
      name: "competitionName",
    },
    gameType: {
      type: "varchar",
      length: 50,
      nullable: false,
      name: "gameType",
    },
    teamA: {
      type: "varchar",
      length: 40,
      nullable: false,
      name: "teamA",
    },
    teamB: {
      type: "varchar",
      length: 40,
      nullable: false,
      name: "teamB",
    },
    teamC: {
      type: "varchar",
      length: 40,
      nullable: true,
      name: "teamC",
    },
    title: {
      type: "varchar",
      length: 50,
      nullable: false,
      name: "title",
    },
    startDate: {
      type: "timestamp",
      nullable: false,
      name: "startDate",
      default: new Date(),
    },
    stopAt: {
      type: "timestamp",
      nullable: true,
      name: "stopAt"
    },
    overType: {
      type: "varchar",
      nullable: true,
      name: "overType"
    },
    noBallRun: {
      type: Number,
      nullable: true,
      name: "noBallRun"
    },
    currentInning: {
      type: Number,
      nullable: true,
      name: "currentInning"
    },
  },
  indices: [
    {
      name: 'match_marketId',
      unique: true, // Optional: Set to true if you want a unique index
      columns: ['marketId', 'gameType'],
    }
  ],
});

module.exports = MatchSchema;
