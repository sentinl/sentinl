import SentinlError from './sentinl_error';

export default class ActionError extends SentinlError {
  constructor(message, ...args) {
    super(message, ...args);
    this.name = this.constructor.name;
  }
}
