const { Sequelize, DataTypes } = require('sequelize');
const db = require('../util/database');

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
  }
});

module.exports = Transaction;
