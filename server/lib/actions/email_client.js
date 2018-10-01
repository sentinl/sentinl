import emailjs from 'emailjs';
import Promise from 'bluebird';
import { readFileSync } from 'fs';
import { forEach, isObject } from 'lodash';
import { pickDefinedValues } from '../helpers';
import ActionError from '../errors/action_error';

class Email {
  constructor({
    host = 'localhost',
    port = 25,
    user,
    password,
    domain,
    ssl = false,
    tls = false,
    timeout = 5000,
    tlsopt,
    sslopt,
    authentication = 'PLAIN',
  }) {
    this.host = host;
    this.port = port;
    this.user = user;
    this.password = password;
    this.domain = domain;
    this.ssl = sslopt ? sslopt : ssl;
    this.tls = tlsopt ? tlsopt : tls;
    this.timeout = timeout;
    this.authentication = authentication;

    try {
      if (isObject(this.tls)) {
        forEach(this.tls, (value, key) => {
          if (value) this.tls[key] = readFileSync(this.tls[key]);
        });
      }
    } catch (err) {
      throw new ActionError('read TLS options', err);
    }

    try {
      if (isObject(this.ssl)) {
        forEach(this.ssl, (value, key) => {
          if (value) this.ssl[key] = readFileSync(this.ssl[key]);
        });
      }
    } catch (err) {
      throw new ActionError('read SSL options', err);
    }

    try {
      const request = pickDefinedValues({
        host: this.host,
        port: this.port,
        user: this.user,
        password: this.password,
        domain: this.domain,
        timeout: this.timeout,
        authentication: this.authentication,
        ssl: this.ssl,
        tls: this.tls,
      });

      this.client = emailjs.server.connect(request);
    } catch (err) {
      throw new ActionError('invalid server settings', err);
    }
  }

  send({text, from, to, subject, attachment}) {
    if (!from || !to) {
      return Promise.reject(new ActionError('obligatory options in email: from and to'));
    }

    return new Promise((resolve, reject) => {
      this.client.send(pickDefinedValues({text, from, to, subject, attachment}), (err, message) => {
        if (err) {
          reject(new ActionError('send email', err));
        }
        resolve(JSON.stringify(message));
      });
    });
  }
}

export default Email;
