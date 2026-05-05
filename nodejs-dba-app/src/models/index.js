const User = require('./User');
const Role = require('./Role');
const LogActivity = require('./LogActivity');
const DocumentasiDB = require('./DocumentasiDB');

// Associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

User.hasMany(LogActivity, { foreignKey: 'user_id', as: 'activities' });
LogActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(DocumentasiDB, { foreignKey: 'author_id', as: 'dokumentasi' });
DocumentasiDB.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

module.exports = { User, Role, LogActivity, DocumentasiDB };
