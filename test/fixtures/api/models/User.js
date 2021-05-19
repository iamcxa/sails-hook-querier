/**
 * User.js
 *
 */

module.exports = {
  attributes: {
    name: {
      type: Sequelize.STRING,
    },
    age: {
      type: Sequelize.INTEGER,
    },
  },
  associations: function () {},
  defaultScope: function () {
    return {};
  },
  options: {
    freezeTableName: false,
    tableName: 'User',
    schema: 'sails',
    classMethods: {
      oneUniqueClassMethod: function () {
        return 'User class method';
      },
    },
    instanceMethods: {
      toJSON: function () {
        const obj = this.get();
        obj.ageString = '' + obj.age + ' years';
        return obj;
      },
    },
    hooks: {},
  },
};
