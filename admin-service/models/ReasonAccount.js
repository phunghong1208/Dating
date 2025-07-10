'use strict';

const BaseModel = require('../models/Base');
const Entities = require('../databases/entities');

class ReasonAccount extends BaseModel {
  constructor() {
    super('ReasonAccount', Entities.reasonaccounts);
  }

  async getListReasonAccount(language) {
    let resultData = await this.find({});
    if (resultData && resultData.length) {
      resultData = resultData.map(item => ({
        code: item.code,
        value: item.langs[language] || item.langs['en'],
        codeReason: item.codeReason.map(reason => ({
          codeTitle: reason.codeTitle,
          value: reason.langs[language] || reason.langs['en'],
          codeReasonDetail: reason.codeReasonDetail.map(detail => ({
            codeDetail: detail.codeDetail,
            value: detail.langs[language] || detail.langs['en'],
          })),
        })),
      }));
    }
    return resultData;
  }
}

module.exports = new ReasonAccount();
