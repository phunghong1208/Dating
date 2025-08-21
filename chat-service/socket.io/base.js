'use strict';

const to = require('await-to-js').default;
const Client = require('./client');

class Base {
  constructor() {
    this.io = null;
    this.ioClients = null;
    this.client = new Client();
  }

  start(io) {
    io.use(async (socket, next) => {
      console.log(
        '----------------------- init connect socket',
        socket.id,
        socket.handshake,
      );
      let [err, payload] = await to(this.client.auth(socket));
      if (!err) {
        socket.user = payload;
        await this.client.storeSession(socket);
        return next();
      }
      return next(this.unauthorized());
    });
    io.on('connection', async socket => {
      this.client.subscribe(socket);
    });
    this.ioClients = io.sockets;
    this.io = io;
  }

  unauthorized(msg) {
    return this.error('Unauthorized', msg);
  }

  forbidden(msg) {
    return this.error('Forbidden', msg);
  }

  error(type, msg) {
    let err = new Error(type);
    if (msg) {
      err.data = { reason: msg };
    }
    err.stack = undefined;
    return err;
  }

  getIoServer() {
    return this.io;
  }

  getIoClients() {
    return this.ioClients;
  }

  getConnection(sid) {
    return this.ioClients.sockets.get(sid);
  }

  emitMessage(sid) {
    let sk = this.getConnection(sid);
    if (sk) {
      let args = Array.prototype.slice.call(arguments, 1);
      try {
        // sk.emit.apply(sk, args);
        sk.emit(...args);
      } catch (e) {
        console.log('socket.emitMessage error ', e);
      }
    }
  }

  joinRoom(sid, room) {
    let sk = this.getConnection(sid);
    if (sk) {
      sk.join(room, () => {
        console.log(`User '${sid}' has joined room '${room}'`);
      });
    }
  }

  leaveRoom(sid, room) {
    let sk = this.getConnection(sid);
    if (sk) {
      sk.leave(room, () => {
        console.log(`User '${sid}' has left room '${room}'`);
      });
    }
  }

  async getRoomsBySid(sid) {
    let keys = Object.keys(Object.fromEntries(this.ioClients.adapter.rooms));
    let rooms = [];
    keys = keys.filter(id => id != sid);
    let rs = await Promise.all(
      keys.map(roomId => this.verifyInRoom(sid, roomId)),
    );
    if (rs && rs.length) {
      rooms = rs.filter(it => !!it);
    }
    return rooms;
  }

  async verifyInRoom(sid, roomId) {
    let rs = null;
    let clients = await this.getClientsByRoom(roomId);
    if (clients && clients.length) {
      clients = clients.map(it => it.id);
      if (clients.indexOf(sid) > -1) rs = roomId;
    }
    return rs;
  }

  async getClientsByRoom(roomId) {
    return this.io.in(roomId).fetchSockets();
  }

  async getAllClients() {
    return this.io.fetchSockets();
  }

  emitAll(event, data, room = null) {
    if (room) {
      this.ioClients.to(room).emit(event, data);
    } else {
      this.ioClients.emit(event, data);
    }
  }
}

module.exports = Base;
