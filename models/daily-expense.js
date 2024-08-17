const { Sequelize, DataTypes } = require('sequelize');
const db = require('../util/database');
const User = require('./Userfile');

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
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});


module.exports = Transaction;
