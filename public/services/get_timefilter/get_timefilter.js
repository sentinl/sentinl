export default class GetTimefilter {
  constructor($injector) {
    this.$injector = $injector;
  }

  getService() {
    if (this.$injector.has('timefilter')) {
      return this.$injector.get('timefilter');
    }
    return require('ui/timefilter').timefilter;
  }

  static factory($injector) {
    const timefilter = new GetTimefilter($injector);
    return timefilter.getService();
  }
}
