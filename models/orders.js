const { Sequelize, DataTypes } = require('sequelize');
const db = require('../util/database');
const PrimaryProfile = require('./primaryprofile');

const Order = db.define('order', {
  id:{
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allownull: false,
    primaryKey: true
  },
  paymentId: Sequelize.STRING,
  orderId: Sequelize.STRING,
  status: Sequelize.STRING,
  profileId: {
    type: Sequelize.INTEGER,
  }
})

module.exports = Order;
