// Mock for Node.js 'net' module
module.exports = {
  Socket: class Socket {
    connect() {}
    on() {}
    write() {}
    end() {}
    destroy() {}
  },
  createConnection: () => new module.exports.Socket(),
  createServer: () => ({
    listen: () => {},
    on: () => {},
  }),
};