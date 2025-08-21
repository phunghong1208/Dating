const BaseEvent = require('./base');
const Channel = require('../../models/Channel');

class EventChannel extends BaseEvent {
  constructor() {
    super(EventChannel);
    this.model = Channel;
  }

  async activateChannel(channel) {
    return this.model.activateChannel(channel);
  }
}

module.exports = EventChannel;
