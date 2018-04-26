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

tap.test('endpoint with path', (t) => {
  const services = {
    test: 'http://test/api'
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test');
  t.equals(url, 'http://test/api');
  t.end();
});

tap.test('endpoint with path plus extra path', (t) => {
  const services = {
    test: 'http://test/api'
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health');
  t.equals(url, 'http://test/api/health');
  t.end();
});

tap.test('endpoint ending with trailing slash', (t) => {
  const services = {
    test: {
      endpoint: 'http://test/api/',
      prefix: '/prefix/',
      health: '/health',
    }
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', '/health');
  t.equals(url, 'http://test/api/prefix/health');
  t.end();
});

tap.test('endpoint with path plus prefix', (t) => {
  const services = {
    test: {
      endpoint: 'http://test/api',
      prefix: 'prefix'
    }
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test', 'health');
  t.equals(url, 'http://test/api/prefix/health');
  t.end();
});

tap.test('endpoint with path plus prefix without path', (t) => {
  const services = {
    test: {
      endpoint: 'http://test/api',
      prefix: 'prefix'
    }
  };
  const sd = new ServiceDeps({ services });

  const url = sd.getUrl('test');
  t.equals(url, 'http://test/api/prefix');
  t.end();
});

// MUST BE LAST
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
