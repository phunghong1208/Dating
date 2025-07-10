db = db.getSiblingDB('bachasoft');
db.createUser({
  user: 'bachasoft',
  pwd: '123654',
  roles: [{ role: 'readWrite', db: 'bachasoft' }]
}); 