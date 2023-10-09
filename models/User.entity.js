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
    userName: {
      type: 'varchar',
      nullable: false,
      unique: true,
      name:"userName"
    },
    password: {
      type: 'varchar',
      nullable: false,
      name:"password"
    },
  },
  indices: [
    {
      name: 'idx_userName',
      unique: true, // Optional: Set to true if you want a unique index
      columns: ['id', 'userName'],
    }
  ],
});

module.exports = UserSchema;
