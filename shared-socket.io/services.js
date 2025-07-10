'use strict';

// const to = require('await-to-js').default;
const Socket = require('../shared-models/Socket');
const Channel = require('../shared-models/Channel');
const Device = require('../shared-models/Device');
const Events = require('../shared-events');
const ConfigSk = require('../config').sockets;

class Service {
  constructor() {
    this.model = Socket;
    this.mChannel = Channel;
    this.mDevice = Device;
  }

  async storeSession(data) {
    let ret = await this.model.insertOne(data);
    if (data.source == ConfigSk.source.app)
      Events.setOnlineNowByClient(data.userId);
    return ret;
  }

  async storeDevice(data) {
    let { fcmToken } = data;
    if (!fcmToken) return;

    console.log('Data-Devices', data);
    let exist = await this.mDevice.checkExist(fcmToken);
    console.log('exist', exist);
    if (exist.check) {
      this.mDevice.replaceItem(exist.device._id, data);
      return { inserted: 0 };
    }
    await this.mDevice.insertOne(data);
    return { inserted: 1 };
  }

  async getChannelIds(user) {
    return this.mChannel.getIdsByClientId(user._id);
  }

  /**
   * Reconnect
   * @param {Object} data
   */
  async reconnectEvent(data) {
    console.log('---------------- reconnectEvent', data);
  }

  /**
   * remove session disconnected with socket server.
   * @param {Socket} socket
   * @param {any} reason
   */
  async disconnectEvent(socket, reason) {
    // console.log("---------------- disconnectEvent", socket.id, '---reason', reason);
    let ret = await this.model.removeSession(socket.id);
    if (socket.user.source == ConfigSk.source.app)
      Events.setOnlineNowByClient(socket.user._id);
    return ret;
  }
}

module.exports = Service;
