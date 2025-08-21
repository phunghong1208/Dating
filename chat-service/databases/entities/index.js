'use strict';

const users = require('./users');
const customers = require('./customers');
const channels = require('./channels');
const messages = require('./messages');
const devices = require('./devices');
const images = require('./images');
const promptAnswer = require('./promptAnswer');
const userChannels = require('./userChannels');
const sockets = require('./sockets');

module.exports = {
  users,
  customers,
  channels,
  messages,
  devices,
  images,
  promptAnswer,
  userChannels,
  sockets,
};
