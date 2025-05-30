// Mock for Node.js 'dns' module
module.exports = {
  lookup: (hostname, callback) => callback(null, '127.0.0.1', 4),
  resolve: (hostname, callback) => callback(null, ['127.0.0.1']),
  resolve4: (hostname, callback) => callback(null, ['127.0.0.1']),
  resolve6: (hostname, callback) => callback(null, ['::1']),
};