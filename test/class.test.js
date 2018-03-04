const tap = require('tap');
const ServiceDeps = require('../');

tap.test('new instance', (t) => {
  new ServiceDeps();
  t.end();
});

tap.test('#getService', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  const service = sd.getService('test');
  t.deepEqual(service, {
    endpoint: 'http://test',
    health: '/',
    prefix: ''
  });
  t.end();
});

tap.test('#getService - throws if invalid', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  t.throws(() => {
    sd.getService('test2');
  });
  t.end();
});
tap.test('#getServices', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  const services2 = sd.getServices();
  t.deepEqual(services2, {
    test: {
      endpoint: 'http://test',
      health: '/',
      prefix: ''
    }
  });
  t.end();
});

tap.test('#addService', (t) => {
  const sd = new ServiceDeps();

  sd.addService('test', 'http://test');
  const services = sd.getServices();
  t.deepEqual(services, {
    test: {
      endpoint: 'http://test',
      health: '/',
      prefix: ''
    }
  });
  t.end();
});
