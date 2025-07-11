'use strict';
/**
 * @description Schema of CovidVaccine.
 */
const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class CovidVaccine extends BaseModel {
  constructor() {
    super('CovidVaccine', Entities.commons);
  }
}

module.exports = new CovidVaccine();
