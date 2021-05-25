/**
 * Group.js
 *
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    },
    role: {
      type: Sequelize.ENUM('USER', 'ADMIN'),
    },
  },
  associations() {
    Group.hasMany(User);
    User.belongsTo(Group);
  },
  defaultScope() {
    return {
      include: [{ model: User }],
    };
  },
  options: {
    freezeTableName: false,
    tableName: 'group',
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
