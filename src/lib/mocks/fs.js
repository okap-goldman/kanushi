// Mock for Node.js 'fs' module
module.exports = {
  readFile: (path, callback) => callback(new Error('fs not supported in React Native')),
  writeFile: (path, data, callback) => callback(new Error('fs not supported in React Native')),
  readFileSync: () => { throw new Error('fs not supported in React Native'); },
  writeFileSync: () => { throw new Error('fs not supported in React Native'); },
  existsSync: () => false,
  mkdirSync: () => {},
  promises: {
    readFile: () => Promise.reject(new Error('fs not supported in React Native')),
    writeFile: () => Promise.reject(new Error('fs not supported in React Native')),
  },
};