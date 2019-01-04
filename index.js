module.exports = function (sails) {
  var hookName = 'querier';
  var loader = require('sails-util-micro-apps')(sails);
  return {
    defaults: {
      __configKey__: {
        enable: true,
        exposeToGlobal: true,
        _hookTimeout: 30 * 1000,
      },
    },
    bootstrap() {
      try {
        // TODO: 修正 Sequelize pre query 去掉 fullGroupBy
        // console.log('SequelizeConnections=>', SequelizeConnections.mysql);
        // console.log('Sequelize=>', Sequelize);
        // const sequelize = require('sequelize');
        sails.log.warn('[!] FIXME: 需要依據 connection 自動移除 ONLY_FULL_GROUP_BY。');
        SequelizeConnections.mysql.query("SET GLOBAL sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))");
      } catch (e) {
        throw e;
      }
    },
    configure() {
      loader.configure({
        // policies: `${__dirname}/api/policies`,
        config: `${__dirname}/config`,
        // assets: `${__dirname}/assets`,
        // views: `${__dirname}/views`,
      });
    },
    initialize(next) {
      loader.inject({
        // models: `${__dirname}/api/models`,
        // helpers: `${__dirname}/api/helpers`,
        services: `${__dirname}/api/services`,
        // responses: `${__dirname}/api/responses`,
        // controllers: `${__dirname}/api/controllers`,
      }, err => next(err));
    },
  };
};