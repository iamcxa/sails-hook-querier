module.exports = function (sails) {
  var hookName = 'querier';
  var loader = require('sails-util-micro-apps')(sails);
  var hookConfig = require(`./config/${hookName}`);
  var config = sails.config[hookName] || hookConfig[hookName];
  var isEnable = config.enable;
  return {
    configure() {
      if (isEnable) {
        loader.configure({
          policies: `${__dirname}/api/policies`,
          config: `${__dirname}/config`,
          assets: `${__dirname}/assets`,
          views: `${__dirname}/views`,
        });
      }
    },
    initialize(next) {
      sails.log.debug(`[!][sails-hook-${hookName}] Enable Status: ${isEnable}`);
      if (isEnable) {
        loader.inject({
          models: `${__dirname}/api/models`,
          helpers: `${__dirname}/api/helpers`,
          services: `${__dirname}/api/services`,
          responses: `${__dirname}/api/responses`,
          controllers: `${__dirname}/api/controllers`,
        }, err => next(err));
      } else next();
    },
  };
};