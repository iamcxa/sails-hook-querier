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
    return {};
  },
  options: {
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
