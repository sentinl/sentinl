import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import decompress from 'decompress';

const ver = '2.1.1';
const baseName = `phantomjs-${ver}`;
const phantomPath = path.resolve(__dirname, '..', '..', 'phantomjs');

const getPackage = function (srcPath) {
  const platform = getPlatform();
  const arch = getArch();
  let suffix;
  let binary;

  if (platform === 'linux' && arch === 'x64') {
    binary = path.join(`${baseName}-linux-x86_64`, 'bin', 'phantomjs');
    suffix = 'linux-x86_64.tar.bz2';
  } else if (platform === 'linux' && arch === 'ia32') {
    binary = path.join(`${baseName}-linux-i686`, 'bin', 'phantomjs');
    suffix = 'linux-i686.tar.bz2';
  } else if (platform === 'darwin') {
    binary = path.join(`${baseName}-macosx`, 'bin', 'phantomjs');
    suffix = 'macosx.zip';
  } else if (platform === 'win32') {
    binary = path.join(`${baseName}-windows`, 'bin', 'phantomjs.exe');
    suffix = 'windows.zip';
  } else {
    throw new Error(`Platform ${platform} ${arch} is not supported`);
  }

  const filename = `${baseName}-${suffix}`;
  const parsed = path.parse(path.join(srcPath, filename));
  parsed.binary = path.join(srcPath, binary);
  return parsed;
};

const installPackage = function (srcPath = phantomPath) {
  let phantomPackage;

  try {
    phantomPackage = getPackage(srcPath);
  } catch (err) {
    return Promise.reject(err);
  };

  const packageExists = function (path) {
    return new Promise ((resolve, reject) => {
      fs.access(path.binary, fs.constants.X_OK, (err) => {
        if (err) reject(err);
        resolve(true);
      });
    });
  };

  const changePermissions = function (path, permissions) {
    return new Promise ((resolve, reject) => {
      fs.chmod(path.binary, permissions, (err) => {
        if (err) reject(err);
        resolve(path);
      });
    });
  };

  return packageExists(phantomPackage)
  .then((exists) => Promise.resolve(phantomPackage))
  .catch(() => {
    // not exists, install package
    return decompress(`${phantomPackage.dir}/${phantomPackage.base}`, phantomPackage.dir)
    .then(() => changePermissions(phantomPackage, '755'))
    .catch((err) => Promise.reject(err));
  });
};

function getPlatform() {
  return process.env.PHANTOMJS_PLATFORM || process.platform;
}

function getArch() {
  return process.env.PHANTOMJS_ARCH || process.arch;
}

module.exports = {
  install: installPackage
};
