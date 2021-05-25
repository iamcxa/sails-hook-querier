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
  associations() {},
  defaultScope() {
    return {
      include: [{ model: Image }],
    };
  },
  options: {
    freezeTableName: false,
    tableName: 'user',
    classMethods: {
      oneUniqueClassMethod() {
        return 'User class method';
      },
    },
    instanceMethods: {
      toJSON() {
        const obj = this.get();
        obj.ageString = `${obj.age} years`;
        return obj;
      },
    },
    hooks: {},
  },
};
