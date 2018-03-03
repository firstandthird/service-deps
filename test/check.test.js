const tap = require('tap');
const ServiceDeps = require('../');
//tap.runOnly = true;

const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});

server.listen(8081);

tap.test('successful check one', async (t) => {
  const services = {
    test: 'http://localhost:8081'
  };
  const sd = new ServiceDeps({ services });

  await sd.checkService('test');
  t.end();
});

tap.test('error check one', async (t) => {
  const services = {
    test: 'http://localhost:8081',
    bad: 'http://localhost:8082'
  };
  const sd = new ServiceDeps({ services });

  try {
    await sd.checkService('bad');
  } catch (e) {
    t.equals(e.message, 'Client request error: connect ECONNREFUSED 127.0.0.1:8082');
    t.end();
  }
});

tap.test('successful check all', async (t) => {
  const services = {
    test: 'http://localhost:8081',
    test2: 'http://localhost:8081'
  };
  const sd = new ServiceDeps({ services });

  await sd.checkServices();
  t.end();
});

tap.test('error check all', async (t) => {
  const services = {
    test: 'http://localhost:8081',
    bad: 'http://localhost:8082'
  };
  const sd = new ServiceDeps({ services });

  try {
    await sd.checkServices();
  } catch (e) {
    t.equals(e.message, 'Client request error: connect ECONNREFUSED 127.0.0.1:8082');
    t.end();
  }
});

tap.test('invalid service', (t) => {
  t.end();
});
tap.test('health url', (t) => {
  t.end();
});
