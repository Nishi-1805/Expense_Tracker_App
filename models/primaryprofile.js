const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../util/database');

const PrimaryProfile = sequelize.define('PrimaryProfile', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  password: {
    type: Sequelize.STRING
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  purpose: {
    type: Sequelize.STRING
  },
  info: {
    type: Sequelize.TEXT
  },
  account: {
    type: Sequelize.STRING
  },
  totalExpense: {
    type: Sequelize.DECIMAL(10, 2),
    defaultValue: 0
  },
  resetPasswordToken: {
    type: Sequelize.STRING,
  },
});

PrimaryProfile.prototype.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    console.error('Error comparing password:', error);
    throw error;
  }
};

module.exports = PrimaryProfile;
