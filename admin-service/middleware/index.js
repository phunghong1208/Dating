const Auth = require('./Auth').handle;
const Client = require('./Client').handle;
const ExtendResponse = require('./ExtendedResponse').handle;
const Guest = require('./Guest').handle;
const Role = require('./Role');

module.exports = {
  auth: Auth,
  app: Client,
  extendResponse: ExtendResponse,
  guest: Guest,
  role: (...params) => {
    return new Role().init(...params);
  },
};
