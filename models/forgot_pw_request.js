const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const PrimaryProfile = require('./primaryprofile');

const ForgotPasswordRequest = sequelize.define('ForgotPasswordRequest', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4
  },
  profileId: {
    type: Sequelize.INTEGER,
  },
  isActive: {
    type: Sequelize.BOOLEAN,
    defaultValue: true
  }
});

module.exports = ForgotPasswordRequest;
