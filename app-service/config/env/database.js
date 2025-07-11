const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, DB_POOL_SIZE } =
  process.env;

module.exports = {
  DB_HOST: DB_HOST || '127.0.0.1',
  DB_PORT: DB_PORT || '27017',
  DB_USER: DB_USER || 'bachasoft',
  DB_PASS: DB_PASS || '123654',
  DB_NAME: DB_NAME || 'bachasoft',
  DB_POOL_SIZE: DB_POOL_SIZE || 10,
};
