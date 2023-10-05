// models/User.js
const Sequelize = require('sequelize');

module.exports = sequelize => {
  return sequelize.define('user', {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    }
  });
};
