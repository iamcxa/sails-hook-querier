/* eslint-disable global-require */

const chai = require('chai');
chai.use(require('chai-datetime'));

global.should = chai.should();
global.sinon = require('sinon');
global.SpecHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/SpecHelper');
global.SeedHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/SeedHelper');
global.ValidatorHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/VerifyHelper');
global.VerifyHelper = require('../node_modules/sails-hook-blocks/api/services/helpers/VerifyHelper');

// eslint-disable-next-line mocha/no-hooks-for-single-case
before(function (done) {
	// Hook will timeout in 10 seconds
	this.timeout(11000);
	chai.should();

	console.log('===================================');
	console.log(`NODE_ENV=>"${process.env.NODE_ENV}"`);

	const connInfo = require('./fixtures/config/datastores').datastores[
		process.env.NODE_ENV === 'test-ci' ? 'ci' : 'mysql'
	];

	console.log(`connection=>`, connInfo);
	console.log('===================================');

	const Sequelize = require('sequelize');
	const connection = new Sequelize(
		connInfo.database,
		connInfo.user,
		connInfo.password,
		connInfo.options,
	);

	// Drop schemas if exists
	connection.query('SET FOREIGN_KEY_CHECKS=0;').then(() =>
		connection.query('DROP SCHEMA IF EXISTS sails;').then(() =>
			connection.query('SET FOREIGN_KEY_CHECKS=1;').then(() => {
				const Sails = require('./fixtures/app').sails;
				// eslint-disable-next-line import/no-extraneous-dependencies
				const rc = require('rc');
				const config = rc('sails');
				// eslint-disable-next-line import/extensions,import/no-unresolved
				config.hooks.sequelize = require('sails-hook-sequelize');
				config.hooks.querier = require('../index');

				// Attempt to lift sails
				Sails().lift(config, (err, _sails) => {
					console.error(err);
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
