'use strict';

const rootPath = process.cwd();
const configDir = `${rootPath}/config`;
const viewDir = `${rootPath}/views`;
const { uploadHost, uploadDir, downloadDir } = require('./upload');
// DURATION_BOOST: time minutes
const {
  FORMAT_DATE = 'YYYY-MM-DD',
  IS_FREE_RUNTIME,
  DURATION_BOOST = '30',
  LIMITED_NUM_LIKES = '100',
  STARTUP_CRON_JOB,
} = process.env;
const { baseUrl, backendHost, backendPort } = require('../config/http');
const DB_CONFIG = require('./env/database');
const downloadUrl = `${baseUrl}/downloads`;
// const pdfMakeFonts = require('../libs/pdfmake/fonts.json');
const { EXCEL_LINE_LIMIT } = process.env;
const settings = require('../config/setting');
const { langs } = require('../langs');

module.exports = {
  baseUrl: baseUrl,
  backendHost: backendHost,
  backendPort: backendPort,
  rootPath: rootPath,
  configDir: configDir,
  viewDir: viewDir,
  formatDate: FORMAT_DATE,
  // config for project
  downloadDir: downloadDir,
  downloadUrl: downloadUrl,
  uploadDir: uploadDir,
  uploadHost: uploadHost,
  // config database
  mongodb: DB_CONFIG,
  session: {
    secret: 'bachasoft@codebasehq.com',
  },
  ...settings,
  // pdfMakeFonts: pdfMakeFonts,
  conversionValue: 1000,
  EXCEL_LINE_LIMIT: EXCEL_LINE_LIMIT || 20000,
  langs: langs,
  isFreeRuntime: IS_FREE_RUNTIME && IS_FREE_RUNTIME.toUpperCase() === 'TRUE',
  timeDurationBoost: parseInt(DURATION_BOOST) * 60,
  numLimitedLikes: parseInt(LIMITED_NUM_LIKES),
  isStartupCronJob:
    STARTUP_CRON_JOB && STARTUP_CRON_JOB.toUpperCase() === 'TRUE',
};
