const tap = require('tap');
const ServiceDeps = require('../');
const util = require('util');
const wait = util.promisify(setTimeout);

const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});

server.listen(8081);

tap.test('monitor', async (t) => {
  const sd = new ServiceDeps({ monitorInterval: 10 });
  let checks = 0;
  sd.on('service.check', (name, service, url) => {
    checks++;
  });
  sd.addService('test', 'http://localhost:8081');
  sd.startMonitor();
  await wait(50);
  sd.stopMonitor();
  t.ok(checks > 0);
  t.end();
});

tap.test('stop monitor', async (t) => {
  const sd = new ServiceDeps({ monitorInterval: 10 });
  let checks = 0;
  sd.on('service.check', (name, service, url) => {
    checks++;
  });
  sd.addService('test', 'http://localhost:8081');
  sd.startMonitor();
  await wait(50);
  sd.stopMonitor();
  const currentChecks = checks;
  await wait(50);
  t.equals(currentChecks, checks);
  t.end();
});

tap.test('events', async (t) => {
  const sd = new ServiceDeps({ monitorInterval: 10 });
  let start = false;
  let stop = false;
  sd.on('monitor.start', () => {
    start = true;
  });
  sd.on('monitor.stop', () => {
    stop = true;
  });
  sd.addService('test', 'http://localhost:8081');
  sd.startMonitor();
  await wait(1);
  sd.stopMonitor();
  await wait(1);
  t.equals(start, true);
  t.equals(stop, true);
  server.close();
  t.end();
});
