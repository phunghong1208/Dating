const fs = require('fs');
const os = require('os');
const appDir = process.env.PWD;
const envPath = `${appDir}/.env`;

function setEnvValue(key, value) {
  // read file from hdd & split if from a linebreak to a array
  const ENV_VARS = fs.readFileSync(envPath, 'utf8').split(os.EOL);
  let newEnv = `${key}=${value}`;
  // find the env we want based on the key
  let target = ENV_VARS.indexOf(
    ENV_VARS.find(line => {
      return line.match(new RegExp(key));
    }),
  );
  if (target == -1) target = ENV_VARS.length;
  // replace the key/value with the new value
  ENV_VARS.splice(target, 1, newEnv);
  // write everything back to the file system
  fs.writeFileSync(envPath, ENV_VARS.join(os.EOL));
}

module.exports = {
  set: setEnvValue,
};
