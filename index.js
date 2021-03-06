const { URL } = require('url');
const p = require('path');
const querystring = require('querystring');
const wreck = require('wreck');
const EventEmitter = require('events');
const Joi = require('joi');
const version = require('./package.json').version;

class ServiceDeps extends EventEmitter {
  constructor(obj = {}) {
    super();
    this.services = {};
    if (obj.services) {
      Object.entries(obj.services).forEach(([key, value]) => {
        this.addService(key, value);
      });
    }
    this.appName = obj.appName || 'Unknown';
    this.appVersion = obj.appVersion || '0.0.0';
    this.retries = obj.retries || 0;
    this.checkTimeout = obj.checkTimeout || 5000;
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
    // see if there's an environment variable that overrides this:
    value.endpoint = process.env[`SERVICE_${name.toUpperCase()}`] || value.endpoint;

    const validation = Joi.validate(value, {
      endpoint: Joi.string().uri(),
      prefix: Joi.string().default(''),
      health: Joi.string().default('/'),
      fallback: Joi.string().uri().optional()
    });
    if (validation.error) {
      throw validation.error;
    }
    this.services[name] = validation.value;
    this.emit('service.add', name, validation.value);
  }

  getUrl(name, path, query) {
    const service = this.getService(name);
    const qs = query ? `?${querystring.stringify(query)}` : '';

    const base = new URL(service.endpoint);

    path = path || '';

    if (service.prefix) {
      path = p.posix.join(service.prefix, path);
    }

    if (base.pathname) {
      path = p.posix.join(base.pathname, path);
    }

    const url = new URL(`${path}${qs}`, base);
    return url.toString();
  }

  request(serviceName, path, method, wreckOptions = {}) {
    if (!wreckOptions.headers) {
      wreckOptions.headers = {};
    }
    wreckOptions.headers['user-agent'] = `service-deps ${version} / ${this.appName} ${this.appVersion}`;
    return wreck[method](this.getUrl(serviceName, path), wreckOptions);
  }

  async checkService(name, retriesDone = 0) {
    const service = this.getService(name);
    const healthUrl = this.getUrl(name, service.health);
    this.emit('service.check', name, service, healthUrl);
    let res;
    service.lastChecked = new Date();
    service.status = 'down';
    try {
      res = await wreck.get(healthUrl, { timeout: this.checkTimeout });
      if (res.res.statusCode === 200) {
        service.status = 'up';
      }
      this.emit('service.success', name, service, res);
    } catch (e) {
      if (this.retries !== 0 && retriesDone < this.retries) {
        return this.checkService(name, retriesDone + 1);
      }
      // will re-try with the fallback url if one is specified:
      if (service.fallback) {
        this.emit('service.fallback', name, service, service.endpoint, service.fallback);
        service.endpoint = service.fallback;
        delete service.fallback;
        return this.checkService(name, retriesDone + 1);
      }
      this.emit('service.error', name, service, e);
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
