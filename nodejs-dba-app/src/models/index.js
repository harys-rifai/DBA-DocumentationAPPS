const User = require('./User');
const Role = require('./Role');
const LogActivity = require('./LogActivity');
const RunbookAI = require('./DocumentasiDB');

// Associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

User.hasMany(LogActivity, { foreignKey: 'user_id', as: 'activities' });
LogActivity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(RunbookAI, { foreignKey: 'author_id', as: 'dokumentasi' });
RunbookAI.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

module.exports = { User, Role, LogActivity, RunbookAI };
