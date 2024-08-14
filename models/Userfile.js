const Sequelize = require('sequelize');
const db = require('../util/database');

const Userfile = db.define('Userfile', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  googleDriveBackupId: {
    type: Sequelize.STRING
  }
});

module.exports = Userfile;
