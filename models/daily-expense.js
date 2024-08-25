const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../util/database');
const PrimaryProfile = require('./primaryprofile');

const Transaction = sequelize.define('Transaction', {
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

Transaction.afterCreate(async (transaction) => {
  try {
    const primaryProfile = await PrimaryProfile.findByPk(transaction.profileId);
    if (primaryProfile) {
      const totalExpense = await Transaction.sum('amount', {
        where: { profileId: transaction.profileId }
      });
      primaryProfile.totalExpense = totalExpense; // update totalExpense with the sum
      await primaryProfile.save();
    }
  } catch (error) {
    console.error('Error updating totalExpense:', error);
  }
});

module.exports = Transaction;
