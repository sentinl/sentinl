const crypto = require('crypto');

const plainTextPassword = 'admin';

const config = {
  algorithm: 'AES-256-CBC',
  key: 'b9726b04608ac48ecb0b6918214ade54'
};

const encrypt = function (plainText) {
  const encryptor = crypto.createCipher(config.algorithm, config.key);
  encryptor.setEncoding('hex');
  encryptor.write(plainText);
  encryptor.end();
  const cipherText = encryptor.read();

  return cipherText;
};

const cipherText = encrypt(plainTextPassword);
console.log(cipherText);

