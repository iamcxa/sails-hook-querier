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
  associations: function () {
    User.hasOne(Image);
    Image.belongsTo(User);
  },
  options: {
    freezeTableName: false,
    tableName: 'image',
    schema: 'sails',
    classMethods: {},
    instanceMethods: {},
    hooks: {},
  },
};
