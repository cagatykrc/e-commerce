const dotenv = require('dotenv');
require('dotenv').config();
const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
require('dotenv').config();
// const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER , process.env.DB_PASS, {
//   host: process.env.DB_HOST ,
//   dialect:'mysql' /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
// });
const sequelize = new Sequelize( 'fatosperde', 'root', '', {
  host:'localhost',
  dialect:'mysql' /* one of 'mysql' | 'postgres' | 'sqlite' | 'mariadb' | 'mssql' | 'db2' | 'snowflake' | 'oracle' */
});
module.exports = sequelize;  