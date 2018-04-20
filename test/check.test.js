const tap = require('tap');
const ServiceDeps = require('../');
//tap.runOnly = true;

const http = require('http');

const server = http.createServer((req, res) => {
  res.end();
});

server.listen(8081);

// will not respond in time:
const server2 = http.createServer((req, res) => {
  setTimeout(() => {
    res.end();
  }, 6000);
});
server2.listen(8085);


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

tap.test('checkTimeout', async (t) => {
  const services = {
    test: 'http://localhost:8085',
  };
  const sd = new ServiceDeps({ services, checkTimeout: 3000 });
  try {
    await sd.checkService('test');
  } catch (e) {
    t.equal(e.output.statusCode, 504, 'returns HTTP 504 (gateway timeout error)');
    t.end();
    return;
  }
  t.fail();
});

tap.test('health url', (t) => {
  server.close();
  server2.close();
  t.end();
});
