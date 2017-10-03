import emailjs from 'emailjs';
import Promise from 'bluebird';

export default class Email {

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
          reject(error);
        }
        resolve(JSON.stringify(message));
      });
    });
  }
}
