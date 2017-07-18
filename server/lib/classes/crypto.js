import crypto from 'crypto';

export default class Crypto {

  constructor(config) {
    this.config = config;
  }

  encrypt(text) {
    const cipher = crypto.createCipher(this.config.algorithm, this.config.password);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  };

  decrypt(encrypted) {
    const decipher = crypto.createDecipher(this.config.algorithm, this.config.password);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  };

}
