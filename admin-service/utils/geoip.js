const geoip = require('geoip-lite');

class GeoUtil {
  constructor() {}

  printIp(ip) {
    if (ip == '::1' || ip == '127.0.0.1') {
      return 'localhost';
    } else if (ip.startsWith('::ffff:')) {
      return ip.substring('::ffff:'.length);
    } else {
      return ip;
    }
  }

  // from express request
  getIpFromRequest(req) {
    let ip =
      req.headers['x-forwarded-for'] || req?.connection?.remoteAddress || '';
    return this.printIp(ip);
  }

  // from socketio client
  getIpFromSocket(socket) {
    let ip =
      socket.handshake.headers['x-forwarded-for'] ||
      socket.handshake.address ||
      '';
    return this.printIp(ip);
  }

  getIpInfo(ip, short = false) {
    let geo = geoip.lookup(ip);
    if (!geo) return { ip: ip };
    if (short) {
      return {
        country: geo.country,
        region: geo.region,
        timezone: geo.timezone,
        city: geo.city,
        location: geo.ll,
        ip: ip,
      };
    }
    geo.ip = ip;
    return geo;
  }
}

module.exports = new GeoUtil();
// https://github.com/michaelwittig/node-i18n-iso-countries
