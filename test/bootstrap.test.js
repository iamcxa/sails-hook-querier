const chai = require('chai');
chai.use(require('chai-datetime'));
global.should = chai.should();
global.sinon = require('sinon');
global.SpecHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/SpecHelper');
before(function (done) {
  let rc;
  const sails = require('./fixtures/app').sails;

  // Hook will timeout in 10 seconds
  this.timeout(11000);

  rc = require('rc');

  const config = rc('sails');
  config.hooks.sequelize = require('../node_modules/sails-hook-sequelize/index');
  config.hooks.querier = require('../index');

  // Attempt to lift sails
  sails().lift(config, (err, Sails) => {
    if (err) { return done(err); }
    return done(err, Sails);
  });
});
