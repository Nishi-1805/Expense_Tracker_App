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
    console.log(`Processing transaction for profile ID: ${transaction.profileId}`);

    const primaryProfile = await PrimaryProfile.findByPk(transaction.profileId);
    if (primaryProfile) {
      console.log(`Found primary profile: ${primaryProfile.id}, current totalExpense: ${primaryProfile.totalExpense}`);

      const totalExpense = await Transaction.sum('amount', {
        where: { profileId: transaction.profileId },
      });

      console.log(`Calculated totalExpense: ${totalExpense}`);
      
      primaryProfile.totalExpense = totalExpense || 0;
      await primaryProfile.save();

      console.log(`Updated totalExpense in primary profile: ${primaryProfile.totalExpense}`);
    } else {
      console.error(`PrimaryProfile not found for profile ID: ${transaction.profileId}`);
    }
  } catch (error) {
    console.error('Error updating primary profile totalExpense:', error);
  }
});


module.exports = Transaction;
