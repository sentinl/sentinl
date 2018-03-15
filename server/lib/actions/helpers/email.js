import emailjs from 'emailjs';
import Promise from 'bluebird';

/**
* Email server
*/
class Email {

  /**
  * Instantiate email server object
  *
  * @param {object} options for server connection https://github.com/eleith/emailjs#emailserverconnectoptions
  */
  constructor(options) {
    this.server = emailjs.server.connect(options);
  }

  /**
  * Send email
  *
  * @param {object} options for email sending https://github.com/eleith/emailjs#emailserversendmessage-callback
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
