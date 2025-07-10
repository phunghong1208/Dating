'use strict';

module.exports = {
  languages: ['en', 'vi', 'ja'],
  dateFormat: {
    en: 'yyyy/mm/dd',
    vi: 'dd/mm/yyyy',
    ja: 'mm/dd/yyyy',
  },
  roles: {
    root: 'root',
    admin: 'admin',
    operator: 'operator',
    reporter: 'reporter',
  },
  actions: {
    nope: 0,
    like: 1,
    superLike: 2,
  },
  typeOfChannel: {
    couple: 1,
    group: 2,
  },
  statusOfChannel: {
    pending: 0,
    activated: 1,
  },
  passwordDefault: '123456@@',
  sockets: {
    source: {
      admin: 'User',
      app: 'Customer',
    },
  },
  avatars: {
    status: {
      pending: 0,
      accepted: 1,
      rejected: 2,
    },
    statusTxt: {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
    },
    statusAI: {},
  },
};
