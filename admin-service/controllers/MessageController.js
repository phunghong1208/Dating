'use strict';

const to = require('await-to-js').default;
const BaseController = require('./BaseController');
const Customer = require('../models/Customer');
const Image = require('../models/Image');
const Message = require('../models/Message');
const ServiceSocket = require('../services/socket');

const Utils = require('../utils');
const HttpUtil = require('../utils/http');

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.mCustomer = Customer;
    this.mImage = Image;
    this.mMessage = Message;
    this.serviceSk = ServiceSocket;
  }

  /**
   * Danh sach customer & bot
   * @param {*} req
   * @param {*} res
   * @returns
   */
  async getListReceiveMessageBot(req, res) {
    return HttpUtil.success(res, 'Success.general');
  }
  chunkArray(array, size) {
    const chunkedArr = [];
    for (let i = 0; i < array.length; i += size) {
      chunkedArr.push(array.slice(i, i + size));
    }
    return chunkedArr;
  }
  async postManyMessageByBot(req, res) {
    let requireParams = [
      'text',
      { name: 'listId', dataType: 'array', acceptEmpty: true },
      { name: 'sendId', dataType: 'string', acceptEmpty: true },
      { name: 'image', dataType: 'string', acceptEmpty: true },
      { name: 'icons', dataType: 'array', acceptEmpty: true },
      { name: 'reacts', dataType: 'array', acceptEmpty: true },
    ];

    let params = HttpUtil.getRequiredParams2(req, requireParams);
    if (params.error) return HttpUtil.badRequest(res, params.error);
    let { listId, sendId, ...message } = params;

    console.log('message', message);
    console.log('listId', listId);
    console.log('sendId', sendId);
    const chunkedIds = chunkArray(listId, batchSize);
    let ret = await this.mMessage.insertOne({ listId, sendId, message });

    return HttpUtil.success(res, 'Success');
  }
}

module.exports = new Controller();
