'use strict';

const BaseController = require('../../../Base');
const Customer = require('../../models/Customer');
const Utils = require('../../utils');
const { default: to } = require('await-to-js');
const AvatarConfigs = require('../../../config').avatars;

class Controller extends BaseController {
  constructor() {
    super(Controller);
    this.count = 0;
    this.limit = 200;
  }

  async run(req, res) {
    console.log('------------------ start', new Date().toISOString());
    let data = await this.handle();
    return this.success(res, { data });
  }

  async handle() {
    let lists = await CustomerBK.find(
      { renew: { $ne: true } },
      { pageSize: this.limit },
    );

    if (!lists.length) {
      console.log('------------------ end', new Date().toISOString());
      return true;
    }

    let promises = lists.map(item => this.updateData(item));
    let [err, rs] = await to(Promise.all(promises));
    if (err) return this.throwErr(err);

    this.count += this.limit;
    console.log(
      '------------------ count',
      lists.length,
      '---',
      new Date().toISOString(),
    );
    // return rs
    return this.handle();
  }

  async updateData(doc) {
    let cloneData = Utils.cloneObject(doc);
    if (!cloneData.explore) cloneData.explore = {};
    cloneData.explore.topics = [];
    cloneData.profiles.isVerifiedAllAvatars = true;
    delete cloneData.packageId;
    if (cloneData.profiles.avatars && cloneData.profiles.avatars.length) {
      cloneData.profiles.isVerifiedAllAvatars = false;
      cloneData.profiles.avatars = cloneData.profiles.avatars.map(url => {
        return {
          id: Utils.generateULID(),
          url,
          status: AvatarConfigs.status.pending,
        };
      });
    }
    ['orientationSexuals', 'interests', 'languages', 'favoriteSongs'].map(
      key => {
        if (cloneData.profiles[key] && cloneData.profiles[key].length) {
          let arr = [];
          cloneData.profiles[key].map(item => {
            if (item && arr.indexOf(item) == -1) arr.push(item);
          });
          cloneData.profiles[key] = arr;
        }
      },
    );

    return Customer._model.create(cloneData);
  }
}

module.exports = new Controller();
