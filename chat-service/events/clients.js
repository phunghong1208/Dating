const BaseEvent = require('./base');
const Customer = require('../models/Customer');
const Socket = require('../models/Socket');

class EventClient extends BaseEvent {
  constructor() {
    super(EventClient);
    this.model = Customer;
    this.mSocket = Socket;
  }

  async setOnlineNow(clientId) {
    let onlineNow = false;
    let sockets = await this.mSocket.getByClientId(clientId);
    if (sockets && sockets.length) {
      onlineNow = true;
    }
    return await this.model.setOnlineNow(clientId, onlineNow);
  }
}

module.exports = EventClient;
