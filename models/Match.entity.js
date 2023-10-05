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
    market_id: {
      type: Number,
      unique: true,

      nullable: false,
      name: "market_id",
    },
    event_id: {
      type: Number,
      unique: true,
      nullable: false,
      name: "event_id",
    },
    gameType: {
      type: "varchar",
      length: 50,
      nullable: false,
      name: "game_type",
    },
    teamA: {
      type: "varchar",
      length: 40,
      nullable: false,
      name: "team_a",
    },
    teamB: {
      type: "varchar",
      length: 40,
      nullable: false,
      name: "team_b",
    },
    teamC: {
      type: "varchar",
      length: 40,
      nullable: true,
      name: "team_c",
    },
    title: {
      type: "varchar",
      length: 50,
      nullable: false,
      name: "title",
    },
    start_date: {
      type: "timestamp",
      nullable: false,
      name: "start_date",
      default: new Date(),
    },
  },
});

module.exports = MatchSchema;
