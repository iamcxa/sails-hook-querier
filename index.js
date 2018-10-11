var hookName = 'querier';
var config = require(`./config/${hookName}`);

module.exports = function (sails) {
    var loader = require('sails-util-micro-apps')(sails);
    var config = sails.config[hookName] || config;
    var isEnable = config.enable;
    return {
      configure() {
        if (isEnable) {
          loader.configure({
            policies: `${__dirname}/api/policies`, // Path to your hook's policies
            config: `${__dirname}/config`, // Path to your hook's config
            assets: `${__dirname}/assets`,
            views: `${__dirname}/views`,
          });
        }
      },
      initialize(next) {
        if (isEnable) {
          loader.inject({
            responses: `${__dirname}/api/responses`,
            models: `${__dirname}/api/models`, // Path to your hook's models
            helpers: `${__dirname}/api/helpers`, // Path to your hook's helpers
            services: `${__dirname}/api/services`, // Path to your hook's services
            controllers: `${__dirname}/api/controllers`, // Path to your hook's controllers
          }, err => next(err));
        }
      },
    };
};
