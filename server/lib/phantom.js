import path from 'path';
import fs from 'fs';
import Promise from 'bluebird';
import decompress from 'decompress';

const ver = '2.1.1';
const baseName = `phantomjs-${ver}`;
const phantomPath = path.resolve(__dirname, '..', '..', '.phantomjs');

const getPackage = function (server, srcPath) {
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
    binary = path.join(`${baseName}-windows`, 'phantomjs.exe');
    suffix = 'windows.zip';
  } else {
    const msg = 'Platform ' + platform + ' ' + arch + ' is not supported';
    throw new Error(msg);
  }

  const filename = `${baseName}-${suffix}`;
  const parsed = path.parse(path.join(srcPath, filename));
  parsed.binary = path.join(srcPath, binary);
  return parsed;
};

const installPackage = function (server, srcPath = phantomPath) {
  const phantomPackage = getPackage(server, srcPath);

  return fs.access(phantomPackage.binary, fs.constants.X_OK, (err) => {
    if (err) {
      // binary does not exist, install it
      const fileType = phantomPackage.ext.substring(1);
      const filePath = `${phantomPackage.dir}/${phantomPackage.base}`;

      decompress(filePath, phantomPackage.dir)
      .then(() => fs.chmod(phantomPackage.binary, 755, () => phantomPackage))
      .catch((err) => server.log(['satus', 'error', 'Sentinl', 'report'], err));
    }
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
