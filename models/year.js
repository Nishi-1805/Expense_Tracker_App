const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const PrimaryProfile = require('./primaryprofile');

const Yearly = sequelize.define('year', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  profileId: {
    type: Sequelize.INTEGER,
  },
  income: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  expense: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  },
  balance: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = Yearly;
