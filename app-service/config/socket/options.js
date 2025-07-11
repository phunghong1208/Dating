const { baseUrl } = require('../http');
const { allowedOrigins } = require('./sk.json').cors;

module.exports = {
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  cors: {
    // origin: [baseUrl, ...allowedOrigins],
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['authorization', 'content-type', 'lang', 'app'],
    credentials: true,
  },
  serveClient: true,
  allowEIO3: true,
  allowUpgrades: false,
  // below are engine.IO options
  pingInterval: 45000,
  pingTimeout: 45000,
  upgradeTimeout: 70000,
  maxHttpBufferSize: 1e8,
};
