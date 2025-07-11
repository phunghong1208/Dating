const Auth = require('./Auth').handle;
const ExtendResponse = require('./ExtendedResponse').handle;
const Guest = require('./Guest').handle;
const Role = require('./Role');

module.exports = {
  auth: Auth,
  extendResponse: ExtendResponse,
  guest: Guest,
  role: (...params) => {
    return new Role().init(...params);
  },
};
