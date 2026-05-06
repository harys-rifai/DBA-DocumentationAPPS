const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true,
    },
    full_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    active: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      comment: '1=active, 0=inactive',
    },
    ip_comp: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'Last login IP address',
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    flag: {
      type: DataTypes.SMALLINT,
      defaultValue: 1,
      comment: '1=valid, 0=deleted',
    },
  },
  {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

/**
 * Verify password
 * @param {string} plainPassword
 * @returns {Promise<boolean>}
 */
User.prototype.verifyPassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

module.exports = User;
