/**
 * Group.js
 *
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING
    },
    role: {
      type: Sequelize.ENUM('USER', 'ADMIN')
      }
  },
  associations: function () {
    Group.hasMany(User);
  },
  defaultScope: function () {
    return {
      include: [
        { model: User }
      ]
    };
  },
  options: {
    freezeTableName : false,
    tableName: 'group',
    schema: 'sails',
    classMethods: {},
    instanceMethods: {},
    hooks: {}
  }
};
