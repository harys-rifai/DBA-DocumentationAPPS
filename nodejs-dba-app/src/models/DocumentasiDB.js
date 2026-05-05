const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DocumentasiDB = sequelize.define(
  'DocumentasiDB',
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    db_type: {
      type: DataTypes.ENUM('mysql', 'redis', 'postgresql', 'mongodb', 'other'),
      allowNull: false,
      comment: 'Type of database',
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    tutorial: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      comment: 'Full tutorial / documentation content (Markdown supported)',
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rank: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Display order / priority rank',
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of tag strings',
    },
    author_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    flag: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1,
      comment: '1=published, 0=draft/deleted',
    },
  },
  {
    tableName: 'dokumentasi_db',
  }
);

module.exports = DocumentasiDB;
