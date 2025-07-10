'use strict';
/**
 * @description Schema of Workout.
 */
const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class Workout extends BaseModel {
  constructor() {
    super('Workout', Entities.commons);
  }
}

module.exports = new Workout();
