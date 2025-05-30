// Mock for Node.js 'tls' module
module.exports = {
  connect: () => ({
    on: () => {},
    write: () => {},
    end: () => {},
  }),
  createServer: () => ({
    listen: () => {},
    on: () => {},
  }),
};