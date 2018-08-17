import path from 'path';
import { chmodSync } from 'fs';
import { listAllFilesSync } from '../../helpers';
import os from 'os';
import { makeExecutableIfNecessary } from '../../helpers';

export default function getChromePath() {
  let chromePath = path.join(__dirname, '../../../../node_modules/puppeteer/.local-chromium');

  let binName = 'chrome';
  if (os.platform() === 'darwin') {
    binName = 'Chromium';
  }

  chromePath = listAllFilesSync(chromePath).filter((f) => f.split('/').pop() === binName);

  if (chromePath.length !== 1) {
    throw new Error('puppeter chrome was not found');
  }

  chromePath = chromePath[0];

  try {
    makeExecutableIfNecessary(chromePath);
  } catch (err) {
    throw new Error('user has no permissions to make file executable: ' + chromePath);
  }

  return chromePath;
}
