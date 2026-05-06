const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LogActivity = sequelize.define(
  'LogActivity',
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'e.g. LOGIN, LOGOUT, CREATE, UPDATE, DELETE',
    },
    module: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'e.g. users, roles, dokumentasi',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'warning'),
      defaultValue: 'success',
    },
    flag: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
    },
  },
  {
    tableName: 'log_activities',
    updatedAt: false,
  }
);

module.exports = LogActivity;
