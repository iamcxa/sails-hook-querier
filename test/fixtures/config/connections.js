const _ = require('lodash');

let local = {};

try {
  // eslint-disable-next-line global-require
  local = require('../../../config/local');
} catch (e) {
  console.info('[!] local.js not exists.');
}

module.exports.connections = {
  'mysql-test': (_.has(local, 'datastores["mysql-test"]') &&
    _.get(local, 'datastores["mysql-test"]')) || {
    user: 'root',
    password: '',
    database: 'database',
    options: {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      logging: console.log,
    },
  },

  'mysql-test-ci': (_.has(local, 'datastores["mysql-test-ci"]') &&
    _.get(local, 'datastores["mysql-test-ci"]')) || {
    user: 'root',
    password: '',
    database: 'database-ci',
    options: {
      dialect: 'mysql',
      host: 'localhost',
      port: 3306,
      logging: console.log,
    },
  },
};
