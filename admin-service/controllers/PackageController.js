'use strict';

const BaseController = require('./BaseController');
const Model = require('../models/Package');

/*
  Xem hàm mẫu BaseController nếu muốn viết lại các action
*/
class PackageController extends BaseController {
  constructor() {
    super(PackageController);
    this.model = Model;
    this.requireParams = {
      ...this.requireParams,
      store: ['name', 'description'],
      update: ['name', 'description'],
    };
    this.acceptFields = {
      store: [
        'options.turnOffAds',
        'options.ctrlProfile',
        'options.ctrlWhoSeeYou',
        'options.ctrlWhoYouSee',
        'options.passportAnyWhere',
        'options.priorityTop',
        'options.unlimitedLikes',
        'options.ctrlWhoLikeYou',
        'options.priorityLike',
        'options.unlimitedReturns',
        'options.freeBoosterPerMonth',
        'options.superLikesPerWeek',
        'options.chatBeforeMatching',
        'usagePeriod',
      ],
      update: [
        'options.turnOffAds',
        'options.ctrlProfile',
        'options.ctrlWhoSeeYou',
        'options.ctrlWhoYouSee',
        'options.passportAnyWhere',
        'options.priorityTop',
        'options.unlimitedLikes',
        'options.ctrlWhoLikeYou',
        'options.priorityLike',
        'options.unlimitedReturns',
        'options.freeBoosterPerMonth',
        'options.superLikesPerWeek',
        'options.chatBeforeMatching',
        'usagePeriod',
      ],
    };
    this.validate = {
      unique: [
        {
          key: 'name',
          error: 'Found_Errors.package',
          message: 'Unique.package.name',
        },
      ],
      required: [
        {
          key: 'name',
          message: 'Required.package.name',
        },
      ],
    };
  }

  async load(req, res, next, id) {
    return super.load(req, res, next, id);
  }

  async index(req, res) {
    return super.index(req, res);
  }

  detail(req, res) {
    return super.detail(req, res);
  }

  async store(req, res) {
    return super.store(req, res);
  }

  async update(req, res) {
    return super.update(req, res);
  }

  async destroy(req, res) {
    return super.destroy(req, res);
  }

  async deleteMulti(req, res) {
    return super.deleteMulti(req, res);
  }
}

module.exports = new PackageController();
