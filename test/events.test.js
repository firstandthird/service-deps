const tap = require('tap');
const ServiceDeps = require('../');

const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});

server.listen(8081);

tap.test('add service event', (t) => {
  const sd = new ServiceDeps();
  sd.on('service.add', (name, value) => {
    t.equals(name, 'test');
    t.deepEquals(value, {
      endpoint: 'http://test'
    });
    t.end();
  });
  sd.addService('test', 'http://test');
});

tap.test('check service event', async (t) => {
  const sd = new ServiceDeps();
  sd.on('service.check', (name, service, url) => {
    t.equals(name, 'test');
    t.deepEquals(service, {
      endpoint: 'http://localhost:8081'
    });
    t.equals(url, 'http://localhost:8081/');
    t.end();
  });
  sd.addService('test', 'http://localhost:8081');
  await sd.checkService('test');
});

tap.test('service success event', async (t) => {
  const sd = new ServiceDeps();
  sd.on('service.error', () => {
    t.equals(true, false);
  });
  sd.on('service.success', (name, service, res) => {
    t.equals(name, 'test');
    t.deepEquals(service, {
      endpoint: 'http://localhost:8081'
    });
    t.equals(typeof res, 'object');
    t.end();
  });
  sd.addService('test', 'http://localhost:8081');
  await sd.checkService('test');
});

tap.test('service error', async (t) => {
  const sd = new ServiceDeps();
  sd.on('service.success', () => {
    t.equals(true, false);
  });
  sd.on('service.error', (name, service, error) => {
    t.equals(name, 'test');
    t.deepEquals(service, {
      endpoint: 'http://localhost:8082'
    });
    t.equals(error.message, 'Client request error: connect ECONNREFUSED 127.0.0.1:8082');
  });
  sd.addService('test', 'http://localhost:8082');
  try {
    await sd.checkService('test');
  } catch (e) {
    t.notEquals(e, null);
    t.end();
  }
});

tap.todo('services.check');
