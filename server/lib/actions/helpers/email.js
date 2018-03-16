import emailjs from 'emailjs';
import Promise from 'bluebird';

/**
* Email server
*/
export default class Email {

  /**
  * Instantiate email server object
  *
  * @param {object} args - init server connection settings (user, password, host, ssl, timeout)
  */
  constructor(args) {
    const { user, password, host, ssl, timeout } = args;
    this.server = emailjs.server.connect({
      user,
      password,
      host,
      ssl,
      timeout
    });
  }

  /**
  * Send email
  *
  * @param {object} args - email parameters (text, from, to, subject, attachment)
  */
  send(args) {
    const { text, from, to, subject, attachment } = args;
    return new Promise((resolve, reject) => {
      this.server.send({
        text,
        from,
        to,
        subject,
        attachment
      }, function (error, message) {
        if (error) {
          console.error(error);
          reject(error);
        }
        resolve(JSON.stringify(message));
      });
    });
  }
}
