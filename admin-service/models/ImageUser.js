'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../../shared-entities');
const Utils = require('../../utils');
const DBUtils = require('../../utils/Database');

class ImageUser extends BaseModel {
  constructor() {
    super('ImageUser', Entities.imageusers);
  }

  async getImagesByUserId(userId) {
    return this.find({ userId: userId });
  }

  async getListImage(options) {
    let lists = await this.lists(options);

    return lists;
  }

}

module.exports = new ImageUser();
