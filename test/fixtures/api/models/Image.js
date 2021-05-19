/**
 * Image.js
 *
 */

module.exports = {
  attributes: {
    url: {
      type: Sequelize.STRING
    }
  },
  associations: function () {
    Image.belongsTo(User);
  },
  options: {
    freezeTableName: false,
    tableName: 'image',
    schema: 'sails',
    classMethods: {},
    instanceMethods: {},
    hooks: {}
  }
};
