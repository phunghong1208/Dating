'use strict';

const BaseService = require('../services/Base');
const Socket = require('../models/Socket');
const sk = require('../socket.io');
const Config = require('../config');
const Utils = require('../utils');
const Events = require('../databases/events');
const skEventNames = require('../config/socket').eventNames;

class Service extends BaseService {
  constructor() {
    super(Service);
    this.model = Socket;
    this.sk = sk;
  }

  emitEvent(eventName, data, room = null) {
    this.sk.emitAll(eventName, data, room);
  }

  // record: Message
  async emitMessageCreated(record, channel) {
    console.log('channel', channel);
    let { channelId, senderId, message } = record;
    let { clientIds } = channel;
    let sockets = await this.model.getByClientIds(clientIds);
    if (sockets && sockets.length) {
      sockets.map(it => {
        this.sk.joinRoom(it.sid, channelId);
      });
      this.emitEvent(skEventNames.messageCreated, record, channelId);
    }
  }

  async getSocketsNativeByChannel(channelId) {
    let clients = await this.sk.getClientsByRoom(channelId);
    clients = clients.map(item => {
      let { id, user } = item;
      return { id, user };
    });
    return { clients };
  }

  async cleanSessionDisconnectedSockets() {
    let clients = await this.sk.getAllClients();
    let ids = [];
    if (clients && clients.length) ids = clients.map(it => it.id);
    let rs = { deleted: 0 };
    let conds = { sid: { $nin: ids }, host: Config.backendHost };
    let lists = await this.model.find(conds);
    if (lists && lists.length) {
      rs.deleted = lists.length;
      let clientIds = lists
        .filter(item => item.source == Config.sockets.source.app)
        .map(item => item.userId);
      clientIds = Utils.uniqElementsArray(clientIds);
      await this.model.deleteMany(conds);
      // update onlineNow for clients
      clientIds.map(id => {
        Events.setOnlineNowByClient(id);
      });
    }
    return rs;
  }

  emitEventMessageUpdateStatus(data, room) {
    return this.emitEvent(skEventNames.messageUpdateStatus, data, room);
  }

  async emitEventUserVerified(clientId, verified) {
    let sockets = await this.model.getByClientIds(clientId);

    console.log('sockets-devices', sockets);
    if (sockets && sockets.length) {
      sockets.map(it => {
        this.sk.joinRoom(it.sid, clientId);
      });
      console.log('skEventNames.userVerified', skEventNames.userVerified);
      console.log('verified', verified);
      this.emitEvent(skEventNames.userVerified, verified, clientId);
    }
  }

  async emitEventUserHasNewLikes(clientId, action, isMatched) {
    let sockets = await this.model.getByClientIds(clientId);
    if (sockets && sockets.length) {
      sockets.map(it => {
        this.sk.joinRoom(it.sid, clientId);
      });
      this.emitEvent(skEventNames.newLike, { action, isMatched }, clientId);
    }
  }
}

module.exports = new Service();
