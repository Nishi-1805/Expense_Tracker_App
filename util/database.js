//const Sequelize = require('sequelize');

//const sequelize = new Sequelize('node-connect', 'root', 'Rajran@21210703', {dialect: 'mysql', host: 'localhost' });

//module.exports = sequelize;

const Sequelize = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'node-connect',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || 'Rajran@21210703',
  {
    dialect: 'mysql',
    port: process.env.DB_PORT || 3306,
    host: process.env.DB_HOST || 'localhost'
  }
);

module.exports = sequelize;
