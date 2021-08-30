/**
 * Development environment settings
 *
 * This file can include shared settings for a development team,
 * such as API keys or remote database passwords.  If you're using
 * a version control solution for your Sails app, this file will
 * be committed to your repository unless you add it to your .gitignore
 * file.  If your repository will be publicly viewable, don't add
 * any private information to this file!
 *
 */

const _ = require('lodash');

let local = {};

try {
  // eslint-disable-next-line global-require
  local = require('../../../../config/local');
} catch (e) {
  console.info('[!] local.js not exists.');
}

module.exports = {
  datastores: {
    mysql: (_.has(local, 'datastores["mysql-test"]') && _.get(local, 'datastores["mysql-test"]')) || {
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
  },
};
