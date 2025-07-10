'use strict';

const useragent = require('express-useragent');
const to = require('await-to-js').default;
const Service = require('./services');
const GeoUtil = require('../../utils/geoip');
const AuthUtil = require('../../utils/auth');
const Config = require('../../config');
const ConfigSk = Config.sockets;
class Client {
  constructor() {
    this.service = new Service();
  }

  async subscribe(socket) {
    this.joinChannels(socket);

    socket.on('status', async data => {
      socket.emit('status', { connected: true });
    });

    socket.on('disconnect', async reason => {
      let [err, rs] = await to(this.service.disconnectEvent(socket, reason));
      if (err) {
        console.log('disconnectEvent error:', err);
      }
    });

    socket.on('reconnect', async data => {
      let [err, rs] = await to(this.service.reconnectEvent(data));
      if (err) {
        console.log('reconnectEvent error:', err);
      }
    });

    socket.on('error', err => {
      console.log('socket on error: ', err);
    });

    socket.on('joinRoom', roomId => {
      console.log('socket on joinRoom: ', socket.id, 'roomId:', roomId);
      socket.join(roomId);
    });

    socket.on('leaveRoom', roomId => {
      console.log('socket on leaveRoom: ', socket.id, 'roomId:', roomId);
      socket.leave(roomId);
    });

    socket.on('disconnecting', reason => {
      // the Set contains at least the socket ID
      console.log(
        '------------',
        socket.id,
        'on disconnecting -- reason:',
        reason,
      );
    });
  }

  async joinChannels(socket) {
    let channels = await this.service.getChannelIds(socket.user);
    if (channels.length) {
      channels.map(roomId => {
        if (socket.adapter.rooms.get(roomId)) {
          console.log('socket on joinRoom: ', socket.id, 'roomId:', roomId);
          socket.join(roomId);
        }
      });
    }
  }

  async auth(socket) {
    let info = socket.handshake;
    let { token = '' } = info.auth;
    let refererSite = info.query['referer-site'] || '';
    const check = refererSite == 'same-origin';
    let err, payload;
    if (check) {
      [err, payload] = await to(AuthUtil.verifyToken(token));
    } else {
      [err, payload] = await to(AuthUtil.verifyToken(token, true));
    }
    if (err) throw Error(err.message);
    const sourceLoockup = check ? ConfigSk.source.admin : ConfigSk.source.app;
    return { ...payload, source: sourceLoockup };
  }

  parseDataHearder(data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      return data;
    }
  }

  getIpInfo(socket) {
    let ipInfo = socket.handshake.headers['ip-info'];
    if (!ipInfo) {
      let ip = GeoUtil.getIpFromSocket(socket);
      return GeoUtil.getIpInfo(ip, true);
    }
    return this.parseDataHearder(ipInfo);
  }

  getDeviceInfo(info) {
    let deviceInfo = info.headers['device-info'];
    if (!deviceInfo) {
      let ua = useragent.parse(info.headers['user-agent']);
      let { browser, version, os, platform, source } = ua;
      return { browser, version, os, platform, source };
    }
    return this.parseDataHearder(deviceInfo);
  }

  getPackageInfo(info) {
    let data = info.headers['package-info'];
    if (data) return this.parseDataHearder(data);
    return null;
  }

  getFcmToken(info) {
    return info.headers['fcmtoken'];
  }

  getHostSk(info) {
    return info.headers['host'];
  }

  async storeSession(socket) {
    let sid = socket.id;
    let info = socket.handshake;
    let ipInfo = this.getIpInfo(socket);
    let deviceInfo = this.getDeviceInfo(info);
    let packageInfo = this.getPackageInfo(info);
    let fcmToken = this.getFcmToken(info);
    let user = socket.user;
    let sessionItem = {
      sid,
      userId: user._id,
      source: user.source,
      ipInfo,
      deviceInfo,
      packageInfo,
      host: Config.backendHost,
    };
    let deviceItem = { fcmToken, userId: user._id, deviceInfo };
    return await Promise.all([
      this.service.storeSession(sessionItem),
      this.service.storeDevice(deviceItem),
    ]);
  }
}

module.exports = Client;
