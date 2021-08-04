/**
 * Connections
 * (sails.config.connections)
 *
 * `Connections` are like "saved settings" for your adapters.  What's the difference between
 * a connection and an adapter, you might ask?  An adapter (e.g. `sails-mysql`) is generic--
 * it needs some additional information to work (e.g. your database host, password, user, etc.)
 * A `connection` is that additional information.
 *
 * Each model must have a `connection` property (a string) which is references the name of one
 * of these connections.  If it doesn't, the default `connection` configured in `config/models.js`
 * will be applied.  Of course, a connection can (and usually is) shared by multiple models.
 * .
 * Note: If you're using version control, you should put your passwords/api keys
 * in `config/local.js`, environment variables, or use another strategy.
 * (this is to prevent you inadvertently sensitive credentials up to your repository.)
 *
 * For more information on configuration, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.connections.html
 */

const _ = require('lodash');

let local = {};

try {
	// eslint-disable-next-line global-require
	local = require('../../../config/local');
} catch (e) {
	console.info('[!] local.js not exists.');
}

module.exports.datastores = {
	mysql: (_.has(local, 'datastores.mysql') && _.get(local, 'datastores.mysql')) || {
		user: 'root',
		password: 'toor',
		database: 'demo',
		options: {
			dialect: 'mysql',
			host: 'localhost',
			port: 3306,
			logging: console.log,
		},
	},

	ci: {
		user: 'test',
		password: '',
		database: 'database-ci',
		options: {
			dialect: 'mysql',
			host: '127.0.0.1',
			port: 3306,
			logging: console.log,
		},
	},

	memory: {
		adapter: 'sails-memory',
	},
};
