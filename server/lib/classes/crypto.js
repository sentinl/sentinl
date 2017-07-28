import crypto from 'crypto';

/**
* Encrypts passwords and decrypts SHA
*/
export default class Crypto {

  /**
  * @param {object} config - config.settings.authentication.encryption.
  */
  constructor(config) {
    this.config = config;
  }

  /**
  * Encrypts password.
  *
  * @param {string} plainText - password.
  */
  encrypt(plainText) {
    const IV = new Buffer(crypto.randomBytes(this.config.iv_length));

    const encryptor = crypto.createCipheriv(this.config.algorithm, this.config.key, IV);
    encryptor.setEncoding('hex');
    encryptor.write(plainText);
    encryptor.end();
    const cipherText = encryptor.read();

    return `${cipherText}:${IV.toString('hex')}`;
  };

  /**
  * Decrypts password.
  *
  * @param {string} cipherText - SHA string.
  */
  decrypt(cipherText) {
    let decryptor;
    if (cipherText.includes(':')) {
      const cipherBlob = cipherText.split(':');
      cipherText = cipherBlob[0];
      const IV = new Buffer(cipherBlob[1], 'hex');
      decryptor = crypto.createDecipheriv(this.config.algorithm, this.config.key, IV);
    } else {
      decryptor = crypto.createDecipher(this.config.algorithm, this.config.key);
    }

    let decryptedText = decryptor.update(cipherText, 'hex', 'utf-8');

    return decryptedText += decryptor.final('utf-8');
  };

}
