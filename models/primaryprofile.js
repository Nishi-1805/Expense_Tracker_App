const Sequelize = require('sequelize');
const db = require('../util/database');
const bcrypt = require('bcrypt');
const Transaction = require('./daily-expense');
const Order = require('./orders');

const PrimaryProfile = db.define('PrimaryProfile', {
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
    allownull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allownull: false

  },
  purpose: {
    type: Sequelize.STRING
  },
  info: {
    type: Sequelize.TEXT
  },
  account: {
    type: Sequelize.STRING
  }
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
