/**
 * Image.js
 *
 */

module.exports = {
  attributes: {
    url: {
      type: Sequelize.STRING,
    },
  },
  associations() {
    Image.belongsTo(User);
  },
  defaultScope() {
    return {
      include: [{ model: User }],
    };
  },
  options: {
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
