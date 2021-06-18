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
  associations() {
    User.hasOne(Image, { onDelete: 'cascade' });
    User.belongsTo(Group);
  },
  options: {
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
    defaultScope() {
      return {
        include: [{ model: Image }],
      };
    },
    hooks: {},
  },
};
