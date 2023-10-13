// models/User.js
const { EntitySchema } = require('typeorm');

const PlayerSchema = new EntitySchema({
    name: 'Player',
    tableName: 'player',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: true,
        },
        marketId: {
            type: "varchar", nullable: false, name: "marketId", length: 40
        },
        gameType: {
            type: "varchar", length: 50, nullable: false, name: "gameType",
        },
        teamName: {
            type: "varchar", length: 40, nullable: false, name: "teamName",
        },
        playerName: {
            type: 'varchar',
            nullable: false,
            unique: true,
            name: "playerName"
        },
        playerType: {
            type: 'varchar',
            nullable: true,
            name: "playerType"
        },
        bowlerType: {
            type: 'varchar',
            nullable: true,
            name: "bowlerType"
        }
    },
    // indices: [
    //     {
    //         name: 'idx_player',
    //         unique: true, // Optional: Set to true if you want a unique index
    //         columns: ['playerType', 'playerName'],
    //     }
    // ],
});

module.exports = PlayerSchema;
