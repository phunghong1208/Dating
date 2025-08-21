const BaseModel = require('./Base');
const Entities = require('../databases/entities');

class CustomerClone extends BaseModel {
  constructor() {
    super('CustomerClone', Entities.customers);
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
}

module.exports = new CustomerClone();
