const path = require('path');
const fs = require('fs');
const decompress = require('decompress');
const makeExecutableIfNecessary = require('../../helpers').makeExecutableIfNecessary;

const ver = '2.1.1';
const baseName = `phantomjs-${ver}`;
const defaultSrcPath = path.join(__dirname, '../../../../phantomjs');

function getPackage(srcPath) {
  const platform = process.env.PHANTOMJS_PLATFORM || process.platform;
  const arch = process.env.PHANTOMJS_ARCH || process.arch;
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
}

module.exports = function installPhantomjs({srcPath = defaultSrcPath} = {}) {
  const phantomPackage = getPackage(srcPath);

  if (fs.existsSync(phantomPackage.binary)) {
    return Promise.resolve(phantomPackage);
  } else {
    return decompress(path.join(phantomPackage.dir, phantomPackage.base), phantomPackage.dir)
      .then(() => {
        makeExecutableIfNecessary(phantomPackage.binary);
        return phantomPackage;
      })
      .catch((err) => {
        err.message += ': decompress PhantomJS archive and set permissions to 755';
        throw err;
      });
  }
};
