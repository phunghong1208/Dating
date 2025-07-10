'use strict';

const BaseModel = require('./Base');
const Entities = require('../../shared-entities');

class ImageClone extends BaseModel {
  constructor() {
    super('ImageClone', Entities.imageClones);
  }

  async getImagesByUserId(userId) {
    return this.find({ userId: userId });
  }
}

module.exports = new ImageClone();
