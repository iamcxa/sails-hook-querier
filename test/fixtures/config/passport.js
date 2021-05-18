/* eslint-disable global-require */
import passport from 'passport';

module.exports.passport = () => {
  const TAG = 'Passport';
  console.time(TAG);
  console.group(TAG);
  const LocalStrategy = require('passport-local').Strategy;

  passport.serializeUser((user, cb) => {
    sails.log.debug('serializeUser user=>', user);
    try {
      return cb(null, user);
    } catch (err) {
      return cb(err, null);
    }
  });

  passport.deserializeUser(async (user, cb) => {
    sails.log.debug('deserializeUser user=>', user);
    try {
      const data = await User.findById(user.id);
      return cb(null, data);
    } catch (err) {
      return cb(err, null);
    }
  });

  const { strategies } = sails.config;
  Object.keys(strategies)
    .filter(name => (!!strategies[name]))
    .map((name) => {
      const strategy = strategies[name];
      passport.use(strategy.name, new LocalStrategy(strategy.parameter, strategy.handler));
      sails.log.debug(`Load Strategy: ${name}`);
      return name;
    });
  console.groupEnd(TAG);
  console.timeEnd(TAG);
};
