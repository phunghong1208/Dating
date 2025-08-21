const EventChannel = require('./channels');
const EventMessage = require('./messages');
const EventClient = require('./clients');

module.exports = {
  activateChannel: new EventChannel().activateChannel,
  summaryMessageByChannel: new EventMessage().summaryMessageByChannel,
  setOnlineNowByClient: new EventClient().setOnlineNow,
};
