'use strict';

const Utils = require('../utils/index');
const {
  UPLOAD_HOST,
  UPLOAD_PORT,
  UPLOAD_DIR,
  GENDOC_DIR,
} = require('../config/env/upload');

let uploadHost = Utils.formatUrl(UPLOAD_HOST);
if (UPLOAD_PORT !== '80') uploadHost = `${uploadHost}:${UPLOAD_PORT}`;

module.exports = {
  uploadHost: uploadHost,
  uploadDir: UPLOAD_DIR,
  downloadDir: GENDOC_DIR,
};
