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
    t.isA(sd.services.bad.lastChecked, Date, 'logs time of failed check');
    t.equals(sd.services.bad.status, 'down', 'logs status of failed check');
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
  const sd = new ServiceDeps();
  try {
    sd.addService('test', { nein: 'just no' });
  } catch (e) {
    t.match(e.toString(), 'ValidationError: "nein" is not allowed');
    return t.end();
  }
  t.fail();
});

tap.test('error check fallback', async (t) => {
  const services = {
    badNoWaitOkay: {
      endpoint: 'http://localhost:8082',
      fallback: 'http://localhost:8081'
    }
  };
  const sd = new ServiceDeps({ services });
  await sd.checkService('badNoWaitOkay');
  t.match(sd.services.badNoWaitOkay, {
    status: 'up'
  });
  t.end();
});

tap.test('retries', async (t) => {
  let letPass = 0;
  const retryServer = http.createServer((req, res) => {
    letPass++;
    if (letPass > 3) {
      res.end();
    }
  });
  retryServer.timeout = 500;
  retryServer.listen(8085);
  const services = {
    test: 'http://localhost:8085',
  };
  const sd = new ServiceDeps({ services, retries: 5 });
  await sd.checkServices();
  retryServer.close();
  t.end();
});

tap.test('health url', (t) => {
  server.close();
  t.end();
});
