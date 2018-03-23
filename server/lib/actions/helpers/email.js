import emailjs from 'emailjs';
import Promise from 'bluebird';

/**
* Email server
*/
class Email {

  /**
  * Instantiate email server object
  *
  * @param {object} options to init server connection settings (user, password, host, ssl, timeout)
  */
  constructor(options) {
    this.server = emailjs.server.connect(options);
  }

  /**
  * Send email
  *
  * @param {object} options to send email (text, from, to, subject, attachment)
  */
  send(options) {
    return new Promise((resolve, reject) => {
      this.server.send(options, function (error, message) {
        if (error) {
          console.error(error);
          reject(error);
        }
        resolve(JSON.stringify(message));
      });
    });
  }
}

export default Email;
