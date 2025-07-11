'use strict';

const Utils = require('../utils');
const { BASE_URL, HOST, PORT, LANG } = require('./env/http');
const baseUrl = BASE_URL ? Utils.formatUrl(BASE_URL) : `http://${HOST}:${PORT}`;

module.exports = {
  baseUrl: baseUrl,
  backendHost: HOST,
  backendPort: PORT,
  LANG: LANG,
};
