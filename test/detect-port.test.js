'use strict';

const assert = require('assert');
const net = require('net');
const pedding = require('pedding');
const address = require('address');
const detectPort = require('..');

describe('detect port test', () => {
  const servers = [];
  before(done => {
    done = pedding(12, done);
    const server = new net.Server();
    server.listen(3000, 'localhost', done);
    servers.push(server);

    const server2 = new net.Server();
    server2.listen(4000, address.ip(), done);
    servers.push(server2);

    for (let port = 7000; port < 7010; port++) {
      const server = new net.Server();
      if (port % 3 === 0) {
        server.listen(port, done);
      } else if (port % 3 === 1) {
        server.listen(port, 'localhost', done);
      } else {
        server.listen(port, address.ip(), done);
      }
      servers.push(server);
    }
  });
  after(() => {
    servers.forEach(server => server.close());
  });

  it('get random port', done => {
    detectPort((_, port) => {
      assert(port >= 1024 && port < 65535);
      done();
    });
  });

  it('callback with occupied port', done => {
    const _port = 80;
    detectPort(_port, (_, port) => {
      assert(port >= _port && port < 65535);
      done();
    });
  });

  it('work with listening next port 3001 because 3000 was listen by localhost', done => {
    const port = 3000;
    detectPort(port, (_, realPort) => {
      assert(realPort === 3001);
      done();
    });
  });

  it('work with listening next port 4001 because 4000 was listen by ' + address.ip(), done => {
    const port = 4000;
    detectPort(port, (_, realPort) => {
      assert(realPort === 4001);
      done();
    });
  });

  it('work with listening random port when try port hit maxPort', done => {
    const port = 7000;
    detectPort(port, (_, realPort) => {
      assert(realPort < 7000 || realPort > 7009);
      done();
    });
  });

  it('callback with string arg', done => {
    const _port = '8080';
    detectPort(_port, (_, port) => {
      assert(port >= 8080 && port < 65535);
      done();
    });
  });

  it('callback with wrong arguments', done => {
    detectPort('oooo', (_, port) => {
      assert(port > 0);
      done();
    });
  });

  it('generator usage', function* () {
    const _port = 8080;
    const port = yield detectPort(_port);
    assert(port >= _port && port < 65535);
  });

  it('promise usage', done => {
    const _port = 8080;
    detectPort(_port)
      .then(port => {
        assert(port >= _port && port < 65535);
        done();
      })
      .catch(done);
  });

  it('promise with wrong arguments', done => {
    detectPort()
      .then(port => {
        assert(port > 0);
        done();
      })
      .catch(done);
  });

  it('generator with wrong arguments and return random port', function* () {
    const port = yield detectPort('oooo');
    assert(port > 0);
    assert(typeof port === 'number');
  });
});
