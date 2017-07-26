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
  * @param {string} text - password.
  */
  encrypt(text) {
    const cipher = crypto.createCipher(this.config.algorithm, this.config.password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  };

  /**
  * Decrypts password.
  *
  * @param {string} encrypted - SHA string.
  */
  decrypt(encrypted) {
    const decipher = crypto.createDecipher(this.config.algorithm, this.config.password);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

}
