const { URL } = require('url');
const querystring = require('querystring');
const wreck = require('wreck');
const EventEmitter = require('events');
class ServiceDeps extends EventEmitter {
  constructor(obj = {}) {
    super();
    this.services = {};
    if (obj.services) {
      Object.entries(obj.services).forEach(([key, value]) => {
        this.addService(key, value);
      });
    }
    this.monitorInterval = obj.monitorInterval || 1000 * 30;
  }

  getServices() {
    return this.services;
  }

  getService(name) {
    const service = this.services[name];
    if (!service) {
      throw new Error(`${name} is not a valid service`);
    }
    return service;
  }

  addService(name, value) {
    if (typeof value === 'string') {
      value = {
        endpoint: value
      };
    }
    //TODO Joi validate obj
    this.services[name] = value;
    this.emit('service.add', name, value);
  }

  getUrl(name, path, query) {
    const service = this.getService(name);
    path = path || '/';
    const qs = query ? `?${querystring.stringify(query)}` : '';
    const url = new URL(`${service.prefix || ''}${path}${qs}`, service.endpoint);
    return url.toString();
  }

  async checkService(name) {
    const service = this.getService(name);
    const healthUrl = this.getUrl(name, service.health);
    this.emit('service.check', name, service, healthUrl);
    let res;
    try {
      res = await wreck.get(healthUrl);
      this.emit('service.success', name, service, res);
    } catch (e) {
      this.emit('service.error', name, service, e);
      throw e;
    }
    return res;
  }

  checkServices() {
    this.emit('services.check');
    const ps = Object
      .entries(this.services)
      .map(([key, value]) => this.checkService(key));
    return Promise.all(ps);
  }

  startMonitor() {
    if (this.monitorTimeout) {
      this.stopMonitor();
    }
    this.monitorTimeout = setInterval(() => {
      try {
        this.checkServices();
      } catch (e) {
        //swallow errors
      }
    }, this.monitorInterval);
    this.emit('monitor.start');
  }

  stopMonitor() {
    if (this.monitorTimeout) {
      clearInterval(this.monitorTimeout);
    }
    this.emit('monitor.stop');
  }
}

module.exports = ServiceDeps;
