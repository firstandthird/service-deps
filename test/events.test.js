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
      endpoint: 'http://test',
      health: '/',
      prefix: ''
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
      endpoint: 'http://localhost:8081',
      health: '/',
      prefix: ''
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
    t.match(service, {
      endpoint: 'http://localhost:8081',
      health: '/',
      prefix: '',
      status: 'up'
    });
    t.isA(service.lastChecked, Date);
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
    t.match(service, {
      endpoint: 'http://localhost:8082',
      health: '/',
      prefix: '',
      status: 'down'
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

tap.test('service.fallback', async (t) => {
  const sd = new ServiceDeps();
  let called = false;
  sd.on('service.fallback', (name, service, oldUrl, newUrl) => {
    t.equals(name, 'test');
    t.match(oldUrl, 'http://localhost:8082');
    t.match(newUrl, 'http://localhost:8081');
    called = true;
  });
  sd.addService('test', { endpoint: 'http://localhost:8082', fallback: 'http://localhost:8081' });
  await sd.checkService('test');
  await new Promise(resolve => setTimeout(resolve, 200));
  t.ok(called);
  t.match(sd.services.test, {
    endpoint: 'http://localhost:8081',
    prefix: '',
    health: '/',
    status: 'up'
  });
  server.close();
  t.end();
});

tap.todo('services.check');
