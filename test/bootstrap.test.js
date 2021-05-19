const chai = require('chai');
chai.use(require('chai-datetime'));

global.should = chai.should();
global.sinon = require('sinon');
global.SpecHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/SpecHelper');

before(function (done) {
  // Hook will timeout in 10 seconds
  this.timeout(11000);

  const Sequelize = require('sequelize');
  const connInfo = require('./fixtures/config/datastores').datastores.default;
  const connection = new Sequelize(connInfo.url, connInfo.options);

  // Drop schemas if exists
  connection.query('SET FOREIGN_KEY_CHECKS=0;').then(() =>
    connection.query('DROP SCHEMA IF EXISTS sails;').then(() =>
      connection.query('SET FOREIGN_KEY_CHECKS=1;').then(() => {
        const Sails = require('./fixtures/app').sails;
        const rc = require('rc');
        const config = rc('sails');
        config.hooks.sequelize = require('../node_modules/sails-hook-sequelize/index');
        config.hooks.querier = require('../index');

        // Attempt to lift sails
        Sails().lift(config, (err, _sails) => {
          if (err) {
            return done(err);
          }
          sails = _sails;
          return done(err, sails);
        });
      }),
    ),
  );
});
