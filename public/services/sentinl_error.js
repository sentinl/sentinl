export default class SentinlError extends Error {
  constructor(message, ...args) {
    super(message, ...args);
    this.date = new Date();
    this.name = this.constructor.name;

    const error = [...args].pop();
    if (error && error instanceof Error) {
      this.stack = error.stack;
      this.message = message + ' : ' + error.message;
    } else if (error && error.status >= 400) {
      this.status = error.status;
      this.message = message + ' : ' + error.data.message || error.data.error;
    } else {
      this.message = message;
    }
  }
}
