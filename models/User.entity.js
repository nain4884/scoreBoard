// models/User.js
const { EntitySchema } = require('typeorm');

const UserSchema = new EntitySchema({
  name: 'User',
  tableName: 'user',
  columns: {
    id: {
      type: Number,
      primary: true,
      generated: true,
    },
    username: {
      type: 'varchar',
      nullable: false,
      unique: true,
    },
    password: {
      type: 'varchar',
      nullable: false,
    },
  },
});

module.exports = UserSchema;
