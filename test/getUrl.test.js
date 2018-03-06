const tap = require('tap');
const ServiceDeps = require('../');

tap.test('basic', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health', { test: 1 });
  t.equals(url, 'http://test/health?test=1');
  t.end();
});

tap.test('no query', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health');
  t.equals(url, 'http://test/health');
  t.end();
});

tap.test('no path', (t) => {
  const services = {
    test: 'http://test'
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test');
  t.equals(url, 'http://test/');
  t.end();
});

tap.test('path prefix', (t) => {
  const services = {
    test: {
      endpoint: 'http://test',
      health: '/',
      prefix: 'prefix/'
    }
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health');
  t.equals(url, 'http://test/prefix/health');
  t.end();
});

tap.test('env.SERVICE_{NAME} will override endpoint', (t) => {
  process.env.SERVICE_TEST = 'http://test:8080/';
  const services = {
    test: {
      health: '/'
    }
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health');
  t.equals(url, 'http://test:8080/health');
  t.end();
});
