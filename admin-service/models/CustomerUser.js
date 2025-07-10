const BaseModel = require('./Base');
const Entities = require('../databases/entities');
const Utils = require('../utils/index');
const DBUtils = require('../utils/Database');

class CustomerUser extends BaseModel {
  constructor() {
    super('CustomerUser', Entities.customers);
    this.projection = { delete: 0, __v: 0, hash: 0, salt: 0 };
    this.allowFields = [
      '_id',
      'oAuth2Id',
      'fullname',
      'username',
      'email',
      'phone',
      'dob',
      'profiles',
      'settings',
      'verifyStatus',
      'activeStatus',
      'lastActiveTime',
      'location',
      'coins',
      'explore',
      'plusCtrl',
      'numberLike',
      'numberSuperLike',
      'numberBooster',
      'boostInfo',
      'packageId',
      'pkgRegistrationDate',
      'pkgExpirationDate',
      'package',
      'insert',
      'update',
    ];
    this.relations = [
      {
        path: 'package',
        select: 'name description options usagePeriod',
        ref: 'Package',
        localField: 'packageId',
      },
    ];
  }

  async getListCustomerUser(options) {
    let lists = await this.lists(options);
    return lists;
  }

  async updateCustomeUserCommon(element) {
    let ret = await this.updateItem(
      { _id: element._id },
      {
        $set: {
          //   dob: dob.toString(),
          explore: {
            verified: 0,
            topics: [],
          },
        },
      },
    );
    return ret;
  }
}

module.exports = new CustomerUser();
