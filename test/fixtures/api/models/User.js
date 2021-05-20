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
    return {
      include: [{ model: Image }],
    };
  },
  options: {
    freezeTableName: false,
    tableName: 'user',
    classMethods: {
      oneUniqueClassMethod: function () {
        return 'User class method';
      },
    },
    instanceMethods: {
      toJSON: function () {
        let obj = this.get();
        obj.ageString = '' + obj.age + ' years';
        return obj;
      },
    },
    hooks: {},
  },
};
