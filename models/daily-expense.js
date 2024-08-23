const { Sequelize, DataTypes } = require('sequelize');
const db = require('../util/database');
const PrimaryProfile = require('./primaryprofile');

const Transaction = db.define('Transaction', {
  date: {
    type: DataTypes.DATEONLY // add a date column
  },
  type: {
    type: DataTypes.STRING // income or expense
  },
  text: {
    type: DataTypes.STRING // income or expense text
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2)
  },
  description: {
    type: DataTypes.TEXT
  },
  profileId: {
    type: DataTypes.INTEGER,
  }
});


module.exports = Transaction;
