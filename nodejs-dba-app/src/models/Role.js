const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define(
  'Role',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON array of permission strings',
    },
    flag: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1,
      comment: '1=active, 0=deleted',
    },
  },
  {
    tableName: 'roles',
  }
);

module.exports = Role;
