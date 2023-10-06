// models/User.js
const { EntitySchema } = require('typeorm');

const UserSchema = new EntitySchema({
  name: 'User',
  tableName: 'users',
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
      name:"username"
    },
    password: {
      type: 'varchar',
      nullable: false,
      name:"password"
    },
  },
});

module.exports = UserSchema;
